"""Financial Chat Service for Finroq AI.

Orchestrates conversations, persists messages, validates user ownership,
records API usage telemetry, and interfaces with the AI provider.
"""

from __future__ import annotations

import json
import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, desc

from app.db.models import AIConversation, AIMessage, AIUsageLog
from app.features.ai.provider import BaseAIProvider, OpenAIProvider, AIProviderResult


# =====================================================================
# Request & Response Schemas
# =====================================================================

class AIChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=2000, description="The user's question or message.")
    conversation_id: Optional[str] = Field(default=None, description="Optional existing conversation ID.")
    language: Optional[str] = Field(default="en", description="Preferred response language code (e.g. en, hi, es, ta).")
    metadata: Optional[Dict[str, Any]] = Field(default=None, description="Optional client context metadata.")


class AIChatResponse(BaseModel):
    model_config = {"protected_namespaces": ()}
    conversation_id: str
    message: str
    is_live_ai: bool
    model_used: str
    structured_data: Optional[Dict[str, Any]] = None
    tools_executed: List[Dict[str, Any]] = []
    error_code: Optional[str] = None
    created_at: str


class ConversationSummary(BaseModel):
    id: str
    title: str
    created_at: str
    updated_at: str
    message_count: int


class MessageItem(BaseModel):
    id: int
    role: str
    content: str
    structured_data: Optional[Dict[str, Any]] = None
    created_at: str


class ConversationDetail(BaseModel):
    id: str
    title: str
    created_at: str
    updated_at: str
    messages: List[MessageItem]


# =====================================================================
# Financial Chat Service Implementation
# =====================================================================

class FinancialChatService:
    def __init__(
        self,
        db: AsyncSession,
        owner_id: str,
        provider: Optional[BaseAIProvider] = None,
    ):
        self.db = db
        self.owner_id = str(owner_id)
        self.provider = provider or OpenAIProvider()

    async def list_conversations(self) -> List[ConversationSummary]:
        """List all conversations owned by the authenticated user."""
        stmt = (
            select(AIConversation)
            .where(AIConversation.owner_id == self.owner_id)
            .order_by(desc(AIConversation.updated_at))
        )
        res = await self.db.execute(stmt)
        conversations = res.scalars().all()

        summaries = []
        for conv in conversations:
            # Count messages
            msg_res = await self.db.execute(
                select(AIMessage.id).where(AIMessage.conversation_id == conv.id)
            )
            count = len(msg_res.scalars().all())
            summaries.append(
                ConversationSummary(
                    id=conv.id,
                    title=conv.title,
                    created_at=conv.created_at.isoformat(),
                    updated_at=conv.updated_at.isoformat(),
                    message_count=count,
                )
            )
        return summaries

    async def create_conversation(self, title: Optional[str] = None) -> ConversationSummary:
        """Create a new empty conversation for the user."""
        conv_id = str(uuid.uuid4())
        conv = AIConversation(
            id=conv_id,
            owner_id=self.owner_id,
            title=title or "New Conversation",
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
        )
        self.db.add(conv)
        await self.db.commit()
        await self.db.refresh(conv)

        return ConversationSummary(
            id=conv.id,
            title=conv.title,
            created_at=conv.created_at.isoformat(),
            updated_at=conv.updated_at.isoformat(),
            message_count=0,
        )

    async def get_conversation(self, conversation_id: str) -> Optional[ConversationDetail]:
        """Retrieve a specific conversation with all its messages, verifying ownership."""
        stmt = select(AIConversation).where(
            and_(
                AIConversation.id == conversation_id,
                AIConversation.owner_id == self.owner_id,
            )
        )
        res = await self.db.execute(stmt)
        conv = res.scalar_one_or_none()
        if not conv:
            return None

        # Fetch messages
        msg_stmt = (
            select(AIMessage)
            .where(AIMessage.conversation_id == conv.id)
            .order_by(AIMessage.id)
        )
        msg_res = await self.db.execute(msg_stmt)
        msgs = msg_res.scalars().all()

        items = []
        for m in msgs:
            parsed_struct = None
            if m.structured_data:
                try:
                    parsed_struct = json.loads(m.structured_data)
                except Exception:
                    pass
            items.append(
                MessageItem(
                    id=m.id,
                    role=m.role,
                    content=m.content,
                    structured_data=parsed_struct,
                    created_at=m.created_at.isoformat(),
                )
            )

        return ConversationDetail(
            id=conv.id,
            title=conv.title,
            created_at=conv.created_at.isoformat(),
            updated_at=conv.updated_at.isoformat(),
            messages=items,
        )

    async def delete_conversation(self, conversation_id: str) -> bool:
        """Delete conversation and its associated messages, verifying ownership."""
        stmt = select(AIConversation).where(
            and_(
                AIConversation.id == conversation_id,
                AIConversation.owner_id == self.owner_id,
            )
        )
        res = await self.db.execute(stmt)
        conv = res.scalar_one_or_none()
        if not conv:
            return False

        await self.db.delete(conv)
        await self.db.commit()
        return True

    async def send_chat_message(self, request: AIChatRequest) -> AIChatResponse:
        """
        Processes a user message:
        1. Validates or creates conversation.
        2. Records user message.
        3. Invokes AI provider with tool execution.
        4. Saves assistant response & structured data.
        5. Records usage telemetry.
        """
        # Validate or create conversation
        conv = None
        if request.conversation_id:
            stmt = select(AIConversation).where(
                and_(
                    AIConversation.id == request.conversation_id,
                    AIConversation.owner_id == self.owner_id,
                )
            )
            res = await self.db.execute(stmt)
            conv = res.scalar_one_or_none()

        if not conv:
            # Generate a title from the first 40 chars of question
            clean_title = request.message.strip().replace("\n", " ")[:40]
            if len(request.message.strip()) > 40:
                clean_title += "…"
            conv = AIConversation(
                id=str(uuid.uuid4()),
                owner_id=self.owner_id,
                title=clean_title or "Financial Conversation",
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow(),
            )
            self.db.add(conv)
            await self.db.flush()

        # Save user message
        user_msg = AIMessage(
            conversation_id=conv.id,
            role="user",
            content=request.message.strip(),
            created_at=datetime.utcnow(),
        )
        self.db.add(user_msg)
        await self.db.flush()

        # Load recent conversation history
        history_stmt = (
            select(AIMessage)
            .where(AIMessage.conversation_id == conv.id)
            .order_by(AIMessage.id)
        )
        history_res = await self.db.execute(history_stmt)
        history_msgs = [
            {"role": m.role, "content": m.content}
            for m in history_res.scalars().all()
        ]

        # Execute provider chat with preferred language
        result: AIProviderResult = await self.provider.run_chat(
            messages=history_msgs,
            user_id=self.owner_id,
            db=self.db,
            language=request.language or "en",
        )

        # Save assistant message
        struct_json = json.dumps(result.structured_data, default=str) if result.structured_data else None
        assistant_msg = AIMessage(
            conversation_id=conv.id,
            role="assistant",
            content=result.content,
            structured_data=struct_json,
            created_at=datetime.utcnow(),
        )
        self.db.add(assistant_msg)

        # Update conversation timestamp
        conv.updated_at = datetime.utcnow()

        # Log AI Usage Telemetry
        usage = AIUsageLog(
            owner_id=self.owner_id,
            conversation_id=conv.id,
            model=result.model_used,
            prompt_tokens=result.prompt_tokens,
            completion_tokens=result.completion_tokens,
            total_tokens=result.total_tokens,
            tool_calls_count=len(result.tool_calls_executed),
            duration_ms=result.duration_ms,
            created_at=datetime.utcnow(),
        )
        self.db.add(usage)

        await self.db.commit()

        return AIChatResponse(
            conversation_id=conv.id,
            message=result.content,
            is_live_ai=result.is_live_ai,
            model_used=result.model_used,
            structured_data=result.structured_data,
            tools_executed=result.tool_calls_executed,
            error_code=result.error_code,
            created_at=assistant_msg.created_at.isoformat(),
        )


# =====================================================================
# Public Visitor Chat Guidance (Landing Page Assistant - Zero DB Access)
# =====================================================================

class PublicAIChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=1000, description="Visitor question.")
    language: Optional[str] = Field(default="en", description="Selected language code.")


class PublicAIChatResponse(BaseModel):
    message: str
    language: str
    is_live_ai: bool = False


PUBLIC_GUIDE_INTENTS: Dict[str, Dict[str, str]] = {
    "modules": {
        "en": "Finroq includes 12 unified financial engines: Expense Tracking (double-entry ledger), Daily Budgeting, Expense Splitter, Pre-Spend Check, Spend Leak Detector, Practical Money Guides, Net Worth Architecture, Goal Timeline Simulator, Emergency Cushion Calculator, EMI & Debt Watchdog, Credit Health, and Financial Health Score.",
        "hi": "फिनरॉक में 12 एकीकृत वित्तीय इंजन हैं: व्यय ट्रैकिंग (डबल-एंट्री लेजर), दैनिक बजट, खर्चा विभाजक, खर्च पूर्व जांच, अवांछित खर्च डिटेक्टर, वित्तीय मार्गदर्शिका, कुल संपत्ति वास्तुकला, लक्ष्य सिम्युलेटर, आपातकालीन फंड, ईएमआई प्रहरी, क्रेडिट स्वास्थ्य और वित्तीय स्कोर।",
        "es": "Finroq incluye 12 motores financieros unificados: Control de Gastos, Presupuesto Diario, División de Gastos, Verificación Pre-Gasto, Detector de Fugas, Guías de Dinero, Patrimonio Neto, Simulador de Metas, Fondo de Emergencia, Control de Deuda, Salud Crediticia y Puntuación Financiera.",
        "fr": "Finroq comprend 12 moteurs financiers unifiés : Suivi des Dépenses, Budget Quotidien, Partage des Dépenses, Vérification Pré-Achat, Détecteur de Fuites, Guides Financiers, Patrimoine Net, Simulateur d'Objectifs, Coussin d'Urgence, Surveillance des Dettes, Santé du Crédit et Score Financier.",
        "de": "Finroq umfasst 12 einheitliche Finanzmodule: Ausgabenverfolgung, Tägliche Budgetierung, Ausgabenteiler, Vorabausgaben-Check, Ausgabenleck-Detektor, Finanzratgeber, Nettovermögen, Ziel-Simulator, Notfallpuffer, Schulden-Watchdog, Kreditgesundheit und Finanz-Score.",
        "zh": "Finroq 包含12个统一的金融引擎：支出跟踪、每日预算、费用分摊、支出前检查、消费泄漏检测、财务指南、净资产架构、目标时间线模拟、应急缓冲金、债务监控、信用健康和综合财务评分。",
        "ja": "Finroqには12の統合金融エンジンが含まれています：支出追跡、日次予算、割り勘計算、支出前チェック、支出漏れ検出、マネーガイド、純資産管理、目標シミュレーター、緊急クッション、債務管理、クレジット健全性、総合財務スコア。",
        "ar": "يتضمن فينروك 12 محركاً مالياً موحداً: تتبع النفقات، الميزانية اليومية، تقسيم النفقات، فحص ما قبل الإنفاق، كاشف تسرب الأموال، الأدلة المالية، صافي الثروة، محاكي الأهداف، صندوق الطوارئ، مراقب الديون، صحة الائتمان، ونقاط الصحة المالية.",
        "bn": "ফিনরকে ১২টি সমন্বিত আর্থিক ইঞ্জিন রয়েছে: ব্যয় ট্র্যাকিং, দৈনিক বাজেট, খরচ বিভাজক, প্রাক-ব্যয় পরীক্ষা, লিক ডিটেক্টর, মানি গাইড, নেট ওয়ার্থ, লক্ষ্য সিমুলেটর, জরুরি তহবিল, ঋণ নজরদারি, ক্রেডিট স্বাস্থ্য এবং আর্থিক স্কোর।",
        "pt": "O Finroq inclui 12 motores financeiros unificados: Controle de Despesas, Orçamento Diário, Divisão de Contas, Verificação Pré-Gasto, Detector de Fugas, Guias Financeiros, Patrimônio Líquido, Simulador de Metas, Reserva de Emergência, Monitor de Dívidas, Saúde do Crédito e Pontuação Financeira.",
        "ru": "Finroq включает 12 финансовых модулей: учет расходов, ежедневное бюджетирование, разделение расходов, проверка перед покупкой, детектор утечек, финансовые руководства, чистые активы, симулятор целей, подушка безопасности, контроль долгов, кредитное здоровье и финансовый рейтинг.",
        "it": "Finroq include 12 motori finanziari: Tracciamento Spese, Budget Giornaliero, Divisione Spese, Controllo Pre-Spesa, Rilevatore Perdite, Guide Finanziarie, Patrimonio Netto, Simulatore Obiettivi, Fondo Emergenza, Controllo Debiti, Salute del Credito e Punteggio Finanziario.",
        "ko": "Finroq에는 12가지 통합 금융 엔진이 포함되어 있습니다: 지출 추적, 일일 예산, 분할 결제, 지출 전 점검, 지출 누수 감지, 금융 가이드, 순자산 관리, 목표 시뮬레이터, 비상 자금, 부채 모니터링, 신용 점수 및 종합 재정 점수.",
        "ta": "ஃபின்ராக் 12 ஒருங்கிணைந்த நிதி அமைப்புகளைக் கொண்டுள்ளது: செலவு கண்காணிப்பு, தினசரி பட்ஜெட், செலவு பிரிப்பான், செலவுக்கு முந்தைய சோதனை, கசிவு கண்டறிதல், நிதி வழிகாட்டி, நிகர மதிப்பு, இலக்கு சிமுலேட்டர், அவசரகால நிதி, கடன் கண்காணிப்பு, கடன் ஆரோக்கியம் மற்றும் நிதி மதிப்பெண்.",
        "te": "ఫిన్‌రాక్ 12 ఏకీకృత ఆర్థిక ఇంజిన్‌లను కలిగి ఉంది: ఖర్చుల ట్రాకింగ్, రోజువారీ బడ్జెట్, ఖర్చుల విభజన, ఖర్చుకు ముందు తనిఖీ, ఖర్చు లీక్ డిటెక్టర్, మనీ గైడ్‌లు, నికర విలువ, లక్ష్య సిమ్యులేటర్, అత్యవసర నిధి, రుణ పర్యవేక్షణ, క్రెడిట్ ఆరోగ్యం మరియు ఆర్థిక స్కోరు.",
        "mr": "फिनरॉक 12 एकत्रित आर्थिक इंजिन प्रदान करतो: खर्च ट्रॅकिंग, दैनिक बजेट, खर्च विभाजक, खर्चापूर्वी तपासणी, अनावश्यक खर्च शोधक, आर्थिक मार्गदर्शक, एकूण संपत्ती, उद्दिष्ट सिम्युलेटर, आपत्कालीन निधी, कर्ज पहारेकरी, क्रेडिट आरोग्य आणि आर्थिक स्कोअर.",
        "gu": "ફિનરોકમાં 12 એકીકૃત નાણાકીય એન્જિન શામેલ છે: ખર્ચ ટ્રેકિંગ, દૈનિક બજેટિંગ, ખર્ચ વિભાજક, ખર્ચ પૂર્વે તપાસ, બિનજરૂરી ખર્ચ શોધક, નાણાકીય માર્ગદર્શિકા, નેટવર્થ, લક્ષ્ય સિમ્યુલેટર, ઇમરજન્સી ફંડ, દેવું વોચડોગ, ક્રેડિટ હેલ્થ અને નાણાકીય સ્કોર.",
        "kn": "ಫಿನ್‌ರಾಕ್ 12 ಸಂಯೋಜಿತ ಹಣಕಾಸು ಎಂಜಿನ್‌ಗಳನ್ನು ಒಳಗೊಂಡಿದೆ: ಖರ್ಚು ಟ್ರ್ಯಾಕಿಂಗ್, ದೈನಂದಿನ ಬಜೆಟ್, ಖರ್ಚು ವಿಭಜಕ, ಖರ್ಚು ಪೂರ್ವ ತಪಾಸಣೆ, ಸೋರಿಕೆ ಡಿಟೆಕ್ಟರ್, ಹಣಕಾಸು ಮಾರ್ಗದರ್ಶಿ, ನಿವ್ವಳ ಮೌಲ್ಯ, ಗುರಿ ಸಿಮ್ಯುಲೇಟರ್, ತುರ್ತು ನಿಧಿ, ಸಾಲ ಕಾವಲುಗಾರ, ಕ್ರೆಡಿಟ್ ಆರೋಗ್ಯ ಮತ್ತು ಹಣಕಾಸು ಸ್ಕೋರ್.",
    },
    "security": {
        "en": "Finroq enforces zero-trust tenant isolation with Argon2id cryptographic password hashing and signed JWT tokens. Your financial records are isolated strictly to your account — no other user or administrator can view your ledger.",
        "hi": "फिनरॉक Argon2id क्रिप्टोग्राफिक सुरक्षा और हस्ताक्षरित JWT टोकन के साथ ज़ीरो-ट्रस्ट सुरक्षा लागू करता है। आपका वित्तीय डेटा पूरी तरह निजी है — कोई अन्य उपयोगकर्ता या व्यवस्थापक आपका खाता बही नहीं देख सकता।",
        "es": "Finroq aplica un aislamiento de seguridad de confianza cero con cifrado Argon2id y tokens JWT. Sus registros financieros son estrictamente privados; ningún otro usuario ni administrador puede ver su libro contable.",
        "fr": "Finroq applique une isolation de sécurité zéro confiance avec hachage Argon2id et jetons JWT signés. Vos données financières sont strictement privées : aucun autre utilisateur ou administrateur ne peut consulter vos registres.",
        "de": "Finroq erzwingt Zero-Trust-Sicherheit mit Argon2id-Verschlüsselung und signierten JWT-Tokens. Ihre Finanzdaten sind streng isoliert – kein anderer Benutzer oder Administrator kann Ihr Hauptbuch einsehen.",
        "zh": "Finroq 采用基于 Argon2id 加密和签名 JWT 令牌的零信任租户隔离。您的财务记录完全隔离，任何其他用户或管理员均无法查看您的账本。",
        "ja": "Finroqは、Argon2id暗号化と署名付きJWTトークンによるゼロトラスト分離を採用しています。財務記録は厳重に保護され、他のユーザーや管理者でも閲覧することはできません。",
        "ar": "يطبق فينروك عزل الأمان المتقدم مع تشفير Argon2id ورموز JWT الموقعة. سجلاتك المالية خاصة تماماً ولا يمكن لأي مستخدم آخر أو مسؤول الاطلاع عليها.",
        "bn": "ফিনরক Argon2id ক্রিপ্টোগ্রাফিক সুরক্ষা এবং স্বাক্ষরিত JWT টোকেন সহ জিরো-ট্রাস্ট ডেটা সুরক্ষা নিশ্চিত করে। আপনার আর্থিক তথ্য সম্পূর্ণ গোপনীয় এবং সুরক্ষিত।",
        "pt": "O Finroq aplica isolamento de segurança Zero-Trust com criptografia Argon2id e tokens JWT. Seus registros são estritamente privados — ninguém, nem mesmo administradores, pode vê-los.",
        "ru": "Finroq обеспечивает нулевое доверие с шифрованием Argon2id и токенами JWT. Ваши финансовые записи строго изолированы — никто, даже администратор, не имеет к ним доступа.",
        "it": "Finroq garantisce isolamento zero-trust con crittografia Argon2id e token JWT firmati. I tuoi dati finanziari sono strettamente privati e inaccessibili ad altri o agli amministratori.",
        "ko": "Finroq은 Argon2id 암호화와 서명된 JWT 토큰으로 제로 트러스트 보안 격리를 적용합니다. 고객님의 금융 데이터는 엄격히 비공개되며 관리자도 열람할 수 없습니다.",
        "ta": "ஃபின்ராக் Argon2id குறியாக்க பாதுகாப்பு மற்றும் கையொப்பமிடப்பட்ட JWT டோக்கன்களுடன் முழுமையான தரவு பாதுகாப்பை உறுதி செய்கிறது. உங்கள் நிதி பதிவுகளை வேறு யாரும் பார்க்க முடியாது.",
        "te": "ఫిన్‌రాక్ Argon2id భద్రత మరియు డిజిటల్ సంతకం చేసిన JWT టోకెన్‌లతో జీరో-ట్రస్ట్ డేటా రక్షణను నిర్ధారిస్తుంది. మీ ఆర్థిక రికార్డులను ఎవరూ చూడలేరు.",
        "mr": "फिनरॉक Argon2id एन्क्रिप्शन आणि सुरक्षित JWT टोकनसह संपूर्ण डेटा सुरक्षा सुनिश्चित करतो. आपला आर्थिक डेटा पूर्णपणे खाजगी आणि सुरक्षित आहे.",
        "gu": "ફિનરોક Argon2id એન્ક્રિપ્શન અને સુરક્ષિત JWT ટોકન્સ સાથે શૂન્ય-વિશ્વાસ સુરક્ષા પ્રદાન કરે છે. તમારો ડેટા સંપૂર્ણપણે ખાનગી અને સુરક્ષિત છે.",
        "kn": "ಫಿನ್‌ರಾಕ್ Argon2id ಗೂಢಲಿಪೀಕರಣ ಭದ್ರತೆ ಮತ್ತು ಸುರಕ್ಷಿತ JWT ಟೋಕನ್‌ಗಳೊಂದಿಗೆ ಸಂಪೂರ್ಣ ಡೇಟಾ ಗೌಪ್ಯತೆಯನ್ನು ಖಚಿತಪಡಿಸುತ್ತದೆ. ನಿಮ್ಮ ದಾಖಲೆಗಳನ್ನು ಯಾರೂ ವೀಕ್ಷಿಸಲು ಸಾಧ್ಯವಿಲ್ಲ.",
    },
    "general": {
        "en": "Finroq is an enterprise-grade personal finance engine built with exact decimal arithmetic (NUMERIC 14,2). You can test all features right now with the 1-click demo or create a secure account with Google (Gmail only). Sign in to connect your personal ledger!",
        "hi": "फिनरॉक सटीक दशमलव अंकगणित NUMERIC(14,2) पर बना वित्तीय इंजन है। आप 1-क्लिक डेमो के साथ सभी सुविधाओं का परीक्षण कर सकते हैं या Google (केवल Gmail) से खाता बना सकते हैं। अपने व्यक्तिगत खाते देखने के लिए साइन इन करें!",
        "es": "Finroq es un motor de finanzas personales de nivel empresarial construido con aritmética decimal exacta. ¡Pruebe todas las funciones con la demostración de 1 clic o inicie sesión con Google (solo Gmail) para ver su libro personal!",
        "fr": "Finroq est un moteur de finances personnelles haute précision basé sur une arithmétique décimale exacte. Testez toutes les fonctionnalités avec la démo en 1 clic ou connectez-vous avec Google (Gmail uniquement) !",
        "de": "Finroq ist eine hochpräzise persönliche Finanzengine mit exakter Dezimalarithmetik. Testen Sie alle Funktionen mit der 1-Klick-Demo oder melden Sie sich mit Google (nur Gmail) an!",
        "zh": "Finroq 是一个基于精确十进制算术的高精度个人财务引擎。您可以立即使用一键演示试用所有功能，或使用 Google（仅限 Gmail）登录以连接您的个人账本！",
        "ja": "Finroqは、正確な10進数演算に基づいた高精度の個人財務管理エンジンです。1クリックデモで今すぐすべての機能を試すか、Google（Gmailのみ）でログインして個人の帳簿にアクセスしてください！",
        "ar": "فينروك هو محرك مالي شخصي متطور يعتمد على حسابات كسرية دقيقة. يمكنك تجربة جميع الميزات الآن من خلال العرض التوضيحي بنقرة واحدة أو تسجيل الدخول باستخدام Google (Gmail فقط)!",
        "bn": "ফিনরক নির্ভুল দশমিক পাটিগণিতের উপর নির্মিত একটি আর্থিক ইঞ্জিন। আপনি ১-ক্লিক ডেমো দিয়ে সব বৈশিষ্ট্য পরীক্ষা করতে পারেন বা Google (শুধুমাত্র Gmail) দিয়ে সাইন ইন করতে পারেন!",
        "pt": "O Finroq é um motor de finanças pessoais de alta precisão com aritmética decimal exata. Teste todos os recursos com a demonstração de 1 clique ou faça login com o Google (apenas Gmail)!",
        "ru": "Finroq — высокоточный финансовый движок с точной десятичной арифметикой. Опробуйте все функции в демо в 1 клик или войдите через Google (только Gmail) для доступа к личному журналу!",
        "it": "Finroq è un motore finanziario ad alta precisione basato su aritmetica decimale esatta. Prova tutte le funzionalità con la demo in 1 clic o accedi con Google (solo Gmail)!",
        "ko": "Finroq은 정확한 10진수 산술을 기반으로 구축된 고정밀 개인 금융 엔진입니다. 1클릭 데모로 지금 바로 모든 기능을 체험하거나 Google(Gmail 전용)로 로그인하세요!",
        "ta": "ஃபின்ராக் துல்லியமான தசம எண்கணிதத்தில் கட்டமைக்கப்பட்ட நிதி எஞ்சின் ஆகும். 1-கிளிக் டெமோ மூலம் அனைத்து அம்சங்களையும் சோதிக்கலாம் அல்லது Google (Gmail மட்டும்) மூலம் உள்நுழையலாம்!",
        "te": "ఫిన్‌రాక్ ఖచ్చితమైన దశాంశ గణితంతో నిర్మించిన వ్యక్తిగత ఆర్థిక ఇంజిన్. మీరు 1-క్లిక్ డెమో ద్వారా అన్ని ఫీచర్లను పరీక్షించవచ్చు లేదా Google (Gmail మాత్రమే) తో లాగిన్ అవ్వవచ్చు!",
        "mr": "फिनरॉक अचूक दशांश अंकगणितावर आधारित वैयक्तिक वित्त इंजिन आहे. आपण 1-क्लिक डेमोद्वारे सर्व वैशिष्ट्ये तपासू शकता किंवा Google (केवळ Gmail) द्वारे साइन इन करू शकता!",
        "gu": "ફિનરોક ચોક્કસ દશાંશ ગણતરી પર બનેલું નાણાકીય એન્જિન છે. તમે 1-ક્લિક ડેમો દ્વારા તમામ સુવિધાઓ ચકાસી શકો છો અથવા Google (માત્ર Gmail) દ્વારા સાઇન ઇન કરી શકો છો!",
        "kn": "ಫಿನ್‌ರಾಕ್ ನಿಖರವಾದ ದಶಮಾಂಶ ಗಣಿತದ ಮೇಲೆ ನಿರ್ಮಿಸಲಾದ ವೈಯಕ್ತಿಕ ಹಣಕಾಸು ಎಂಜಿನ್ ಆಗಿದೆ. ನೀವು 1-ಕ್ಲಿಕ್ ಡೆಮೊ ಮೂಲಕ ಎಲ್ಲಾ ವೈಶಿಷ್ಟ್ಯಗಳನ್ನು ಪರೀಕ್ಷಿಸಬಹುದು ಅಥವಾ Google (Gmail ಮಾತ್ರ) ನೊಂದಿಗೆ ಲಾಗಿನ್ ಆಗಬಹುದು!",
    },
}

async def get_public_guidance(message: str, language: Optional[str] = "en") -> PublicAIChatResponse:
    """Answers public visitor inquiries across 18 languages with zero database or user data access."""
    lang = (language or "en").lower()
    msg_lower = message.lower()

    # Determine intent
    if any(k in msg_lower for k in ["module", "feature", "engine", "what can", "what do", "modules", "कार्य", "मॉड्यूल", "सुविधा"]):
        intent = "modules"
    elif any(k in msg_lower for k in ["secure", "security", "privacy", "protect", "leak", "admin", "सुरक्षा", "प्राइवेसी"]):
        intent = "security"
    else:
        intent = "general"

    responses = PUBLIC_GUIDE_INTENTS.get(intent, PUBLIC_GUIDE_INTENTS["general"])
    answer = responses.get(lang, responses["en"])

    return PublicAIChatResponse(
        message=answer,
        language=lang,
        is_live_ai=False,
    )
