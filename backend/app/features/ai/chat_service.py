"""Financial Chat Service for Finroq AI.

Orchestrates conversations, persists messages, validates user ownership,
records API usage telemetry, and interfaces with the AI provider.
"""

from __future__ import annotations

import json
import re
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


# Language alias keywords mapping to ISO language code
LANGUAGE_KEYWORDS: Dict[str, str] = {
    # English
    "english": "en", "eng": "en", "angrezi": "en",
    # Hindi
    "hindi": "hi", "hin": "hi", "हिंदी": "hi", "हिन्दी": "hi",
    # Bengali
    "bengali": "bn", "bangla": "bn", "বাংলা": "bn", "bengla": "bn",
    # Gujarati
    "gujarati": "gu", "gujrati": "gu", "ગુજરાતી": "gu",
    # Tamil
    "tamil": "ta", "தமிழ்": "ta", "tamizh": "ta",
    # Telugu
    "telugu": "te", "తెలుగు": "te",
    # Marathi
    "marathi": "mr", "मराठी": "mr",
    # Kannada
    "kannada": "kn", "ಕನ್ನಡ": "kn",
    # Spanish
    "spanish": "es", "espanol": "es", "español": "es",
    # French
    "french": "fr", "francais": "fr", "français": "fr",
    # German
    "german": "de", "deutsch": "de",
    # Chinese
    "chinese": "zh", "mandarin": "zh", "中文": "zh",
    # Japanese
    "japanese": "ja", "nihongo": "ja", "日本語": "ja",
    # Arabic
    "arabic": "ar", "العربية": "ar",
    # Portuguese
    "portuguese": "pt", "portugues": "pt", "português": "pt",
    # Russian
    "russian": "ru", "русский": "ru",
    # Italian
    "italian": "it", "italiano": "it",
    # Korean
    "korean": "ko", "한국어": "ko",
}


def detect_language_from_text(text: str, default_lang: str = "en") -> str:
    """Detects requested language from text via explicit commands, keywords, or native script ranges."""
    text_lower = text.lower()

    # 1. Check explicit language switch requests e.g. "answer me in gujarati", "speak in hindi", "write in french"
    switch_patterns = [
        r"(?:answer|reply|respond|speak|talk|tell\s+me|explain|write|continue)(?:\s+me)?\s+(?:in|using|with|to)\s+([a-zA-Z\u00C0-\u024F\u0600-\u06FF\u0900-\u0D7F]+)",
        r"(?:in|auf|en|em)\s+([a-zA-Z\u00C0-\u024F]+)\s*(?:please|bitte|por favor|svp)?",
        r"([a-zA-Z\u00C0-\u024F\u0900-\u0D7F]+)\s*(?:में|তে|માં|இல்|లో|मध्ये|ದಲ್ಲಿ)\s*(?:बताओ|बोलो|उत्तर|सांगा|చెప్పండి|ತಿಳಿಸಿ|பதில்)",
    ]
    for pattern in switch_patterns:
        match = re.search(pattern, text_lower)
        if match:
            candidate = match.group(1).strip()
            if candidate in LANGUAGE_KEYWORDS:
                return LANGUAGE_KEYWORDS[candidate]

    # Also check if any language keyword appears with word boundary alongside "in <lang>" or switch phrases:
    for kw, lang_code in LANGUAGE_KEYWORDS.items():
        if re.search(r'\b(?:in|using|speak|answer|reply|explain\s+in)\s+' + re.escape(kw) + r'\b', text_lower):
            return lang_code

    # 2. Native script range detection
    if re.search(r"[\u0A80-\u0AFF]", text):
        return "gu"  # Gujarati
    if re.search(r"[\u0980-\u09FF]", text):
        return "bn"  # Bengali
    if re.search(r"[\u0B80-\u0BFF]", text):
        return "ta"  # Tamil
    if re.search(r"[\u0C00-\u0C7F]", text):
        return "te"  # Telugu
    if re.search(r"[\u0C80-\u0CFF]", text):
        return "kn"  # Kannada
    if re.search(r"[\u0600-\u06FF]", text):
        return "ar"  # Arabic
    if re.search(r"[\u0400-\u04FF]", text):
        return "ru"  # Russian
    if re.search(r"[\uAC00-\uD7AF\u1100-\u11FF]", text):
        return "ko"  # Korean
    if re.search(r"[\u3040-\u309F\u30A0-\u30FF]", text):
        return "ja"  # Japanese
    if re.search(r"[\u0900-\u097F]", text):
        if re.search(r"(आहे|नाही|सांगा|मला|कसा|काय)", text):
            return "mr"  # Marathi
        return "hi"  # Hindi
    if re.search(r"[\u4E00-\u9FFF]", text):
        return "zh"  # Chinese

    # Fall back to supplied default or validated keyword
    return default_lang if default_lang in LANGUAGE_KEYWORDS.values() else "en"


PUBLIC_GUIDE_INTENTS: Dict[str, Dict[str, str]] = {
    "modules": {
        "en": "Finroq includes 13 unified financial engines: 1. Expense Tracking, 2. Daily Budgeting, 3. Expense Splitter, 4. Pre-Spend Check, 5. Net Worth Architecture, 6. Debt Watchdog, 7. Spend Leak Detector, 8. Goal Timeline Simulator, 9. Emergency Cushion, 10. Money Guides, 11. Credit Health, 12. Financial Health Score, and 13. Autonomous 6-Agent Crash-Test Engine (/app/crash-test).",
        "hi": "फिनरॉक में 13 एकीकृत वित्तीय इंजन हैं: 1. व्यय ट्रैकिंग लेजर, 2. दैनिक बजट, 3. खर्चा विभाजक, 4. खर्च पूर्व जांच, 5. कुल संपत्ति वास्तुकला, 6. कर्ज पहारेकरी, 7. अवांछित खर्च डिटेक्टर, 8. लक्ष्य सिम्युलेटर, 9. आपातकालीन फंड, 10. वित्तीय मार्गदर्शिका, 11. क्रेडिट स्वास्थ्य, 12. वित्तीय स्कोर, और 13. स्वायत्त 6-एजेंट क्रैश-टेस्ट इंजन (/app/crash-test)।",
        "bn": "ফিনরকে ১৩টি সমন্বিত আর্থিক ইঞ্জিন রয়েছে: ১. ব্যয় ট্র্যাকিং, ২. দৈনিক বাজেট, ৩. খরচ বিভাজক, ৪. প্রাক-ব্যয় পরীক্ষা, ৫. নিট সম্পদ, ৬. ঋণ নজরদারি, ৭. লিক ডিটেক্টর, ৮. লক্ষ্য সিমুলেটর, ৯. জরুরি তহবিল, ১০. মানি গাইড, ১১. ক্রেডিট স্বাস্থ্য, ১২. আর্থিক স্বাস্থ্য স্কোর, এবং ১৩. স্বায়ত্তশাসিত ৬-এজেন্ট ক্র্যাশ-টেস্ট ইঞ্জিন (/app/crash-test)।",
        "gu": "ફિનરોકમાં 13 એકીકૃત નાણાકીય એન્જિન શામેલ છે: 1. ખર્ચ ટ્રેકિંગ, 2. દૈનિક બજેટિંગ, 3. ખર્ચ વિભાજક, 4. ખર્ચ પૂર્વે તપાસ, 5. નેટવર્થ આર્કિટેક્ચર, 6. દેવું વોચડોગ, 7. બિનજરૂરી ખર્ચ શોધક, 8. લક્ષ્ય સિમ્યુલેટર, 9. ઇમરજન્સી ફંડ, 10. મની ગાઇડ્સ, 11. ક્રેડિટ હેલ્થ, 12. નાણાકીય સ્કોર, અને 13. સ્વાયત્ત 6-એજન્ટ ક્રેશ-ટેસ્ટ એન્જિન (/app/crash-test).",
        "ta": "ஃபின்ராக் 13 ஒருங்கிணைந்த நிதி அமைப்புகளைக் கொண்டுள்ளது: 1. செலவு கண்காணிப்பு, 2. தினசரி பட்ஜெட், 3. செலவு பிரிப்பான், 4. செலவுக்கு முந்தைய சோதனை, 5. நிகர மதிப்பு, 6. கடன் கண்காணிப்பு, 7. கசிவு கண்டறிதல், 8. இலக்கு சிமுலேட்டர், 9. அவசரகால நிதி, 10. நிதி வழிகாட்டி, 11. கடன் ஆரோக்கியம், 12. நிதி மதிப்பெண், மற்றும் 13. தன்னாட்சி 6-ஏஜென்ட் கிராஷ்-டெஸ்ட் எஞ்சின் (/app/crash-test).",
        "te": "ఫిన్‌రాక్ 13 ఏకీకృత ఆర్థిక ఇంజిన్‌లను కలిగి ఉంది: 1. ఖర్చుల ట్రాకింగ్, 2. రోజువారీ బడ్జెట్, 3. ఖర్చుల విభజన, 4. ఖర్చుకు ముందు తనిఖీ, 5. నికర విలువ, 6. రుణ పర్యవేక్షణ, 7. ఖర్చు లీక్ డిటెక్టర్, 8. లక్ష్య సిమ్యులేటర్, 9. అత్యవసర నిధి, 10. మనీ గైడ్‌లు, 11. క్రెడిట్ ఆరోగ్యం, 12. ఆర్థిక స్కోరు, మరియు 13. స్వయంప్రతిపత్తి 6-ఏజెంట్ క్రాష్-టెస్ట్ ఇంజిన్ (/app/crash-test).",
        "mr": "फिनरॉक 13 एकत्रित आर्थिक इंजिन प्रदान करतो: 1. खर्च ट्रॅकिंग लेजर, 2. दैनिक बजेट, 3. खर्च विभाजक, 4. खर्चापूर्वी तपासणी, 5. एकूण संपत्ती, 6. कर्ज पहारेकरी, 7. अनावश्यक खर्च शोधक, 8. उद्दिष्ट सिम्युलेटर, 9. आपत्कालीन निधी, 10. आर्थिक मार्गदर्शक, 11. क्रेडिट आरोग्य, 12. वित्तीय स्कोअर, आणि 13. स्वायत्त 6-एजंट क्रॅश-टेस्ट इंजिन (/app/crash-test).",
        "kn": "ಫಿನ್‌ರಾಕ್ 13 ಸಂಯೋಜಿತ ಹಣಕಾಸು ಎಂಜಿನ್‌ಗಳನ್ನು ಒಳಗೊಂಡಿದೆ: 1. ಖರ್ಚು ಟ್ರ್ಯಾಕಿಂಗ್, 2. ದೈನಂದಿನ ಬಜೆಟ್, 3. ಖರ್ಚು ವಿಭಜಕ, 4. ಖರ್ಚು ಪೂರ್ವ ತಪಾಸಣೆ, 5. ನಿವ್ವಳ ಮೌಲ್ಯ, 6. ಸಾಲ ಕಾವಲುಗಾರ, 7. ಸೋರಿಕೆ ಡಿಟೆಕ್ಟರ್, 8. ಗುರಿ ಸಿಮ್ಯುಲೇಟರ್, 9. ತುರ್ತು ನಿಧಿ, 10. ಹಣಕಾಸು ಮಾರ್ಗದರ್ಶಿ, 11. ಕ್ರೆಡಿಟ್ ಆರೋಗ್ಯ, 12. ಹಣಕಾಸು ಸ್ಕೋರ್, ಮತ್ತು 13. ಸ್ವಾಯತ್ತ 6-ಏಜೆಂಟ್ ಕ್ರ್ಯಾಶ್-ಟೆಸ್ಟ್ ಎಂಜಿನ್ (/app/crash-test).",
        "es": "Finroq incluye 13 motores financieros unificados: Control de Gastos, Presupuesto Diario, División de Gastos, Verificación Pre-Gasto, Patrimonio Neto, Control de Deuda, Detector de Fugas, Simulador de Metas, Fondo de Emergencia, Guías Financieras, Salud Crediticia, Puntuación Financiera y el Motor Autónomo de Crash-Test con 6 agentes (/app/crash-test).",
        "fr": "Finroq comprend 13 moteurs financiers unifiés : Suivi des Dépenses, Budget Quotidien, Partage des Dépenses, Vérification Pré-Achat, Patrimoine Net, Surveillance des Dettes, Détecteur de Fuites, Simulateur d'Objectifs, Coussin d'Urgence, Guides Financiers, Santé du Crédit, Score Financier et le Moteur Autonome de Crash-Test à 6 agents (/app/crash-test).",
        "de": "Finroq umfasst 13 einheitliche Finanzmodule: Ausgabenverfolgung, Tägliche Budgetierung, Ausgabenteiler, Vorabausgaben-Check, Nettovermögen, Schulden-Watchdog, Ausgabenleck-Detektor, Ziel-Simulator, Notfallpuffer, Finanzratgeber, Kreditgesundheit, Finanz-Score und die autonome 6-Agenten Crash-Test-Engine (/app/crash-test).",
        "zh": "Finroq 包含13个统一金融引擎：支出跟踪、每日预算、费用分摊、支出前检查、净资产架构、债务监控、消费泄漏检测、目标时间线模拟、应急缓冲金、财务指南、信用健康、综合财务评分以及自主6智能体压力测试引擎（/app/crash-test）。",
        "ja": "Finroqには13の統合金融エンジンが含まれています：支出追跡、日次予算、割り勘計算、支出前チェック、純資産管理、債務管理、支出漏れ検出、目標シミュレーター、緊急クッション、マネーガイド、クレジット健全性、総合財務スコア、自律型6エージェント・クラッシュテスト（/app/crash-test）。",
        "ar": "يتضمن فينروك 13 محركاً مالياً موحداً: تتبع النفقات، الميزانية اليومية، تقسيم النفقات، فحص ما قبل الإنفاق، صافي الثروة، مراقب الديون، كاشف تسرب الأموال، محاكي الأهداف، صندوق الطوارئ، الأدلة المالية، صحة الائتمان، نقاط الصحة المالية، ومحرك اختبار الصدمات الذكي عبر 6 عملاء (/app/crash-test).",
        "pt": "O Finroq inclui 13 motores financeiros unificados: Controle de Despesas, Orçamento Diário, Divisão de Contas, Verificação Pré-Gasto, Patrimônio Líquido, Monitor de Dívidas, Detector de Fugas, Simulador de Metas, Reserva de Emergência, Guias Financeiros, Saúde do Crédito, Pontuação Financeira e o Motor Autônomo de Crash-Test de 6 agentes (/app/crash-test).",
        "ru": "Finroq включает 13 финансовых модулей: учет расходов, ежедневное бюджетирование, разделение расходов, проверка перед покупкой, чистые активы, контроль долгов, детектор утечек, симулятор целей, подушка безопасности, финансовые руководства, кредитное здоровье, финансовый рейтинг и автономный стресс-тест из 6 агентов (/app/crash-test).",
        "it": "Finroq include 13 motori finanziari unificati: Tracciamento Spese, Budget Giornaliero, Divisione Spese, Controllo Pre-Spesa, Patrimonio Netto, Controllo Debiti, Rilevatore Perdite, Simulatore Obiettivi, Fondo Emergenza, Guide Finanziarie, Salute del Credito, Punteggio Finanziario e il Motore Autonomo Crash-Test a 6 agenti (/app/crash-test).",
        "ko": "Finroq에는 13가지 통합 금융 엔진이 포함되어 있습니다: 지출 추적, 일일 예산, 분할 결제, 지출 전 점검, 순자산 관리, 부채 모니터링, 지출 누수 감지, 목표 시뮬레이터, 비상 자금, 금융 가이드, 신용 점수, 종합 재정 점수 및 6개 에이전트 자율 크래시 테스트 엔진(/app/crash-test).",
    },
    "crashtest": {
        "en": "Finroq's Autonomous Crash-Test Engine (/app/crash-test) stress-tests your finances against 6 severe real-world shocks (income loss, medical bills, inflation surges, career pauses). Six coordinated agents analyze your ledger, formulate self-funded recovery shields, and mathematically verify solvency without high-interest borrowing.",
        "hi": "फिनरॉक का स्वायत्त क्रैश-टेस्ट इंजन (/app/crash-test) 6 गंभीर वास्तविक वित्तीय झटकों (नौकरी छूटना, चिकित्सा आपात स्थिति, महंगाई उछाल) के विरुद्ध आपकी वित्तीय सहनशक्ति की जांच करता है। 6 समन्वित एजेंट आपके लेजर का विश्लेषण करते हैं और बिना नया कर्ज लिए गणितीय रूप से सत्यापित रिकवरी प्लान तैयार करते हैं।",
        "bn": "ফিনরকের স্বায়ত্তশাসিত ক্র্যাশ-টেস্ট ইঞ্জিন (/app/crash-test) ৬টি বাস্তব আর্থিক সংকটের (চাকরি পরিবর্তন, চিকিৎসার জরুরি খরচ, মূল্যস্ফীতি) বিরুদ্ধে আপনার আর্থিক সক্ষমতা পরীক্ষা করে। ৬টি সমন্বিত এজেন্ট আপনার হিসাব বিশ্লেষণ করে নতুন ঋণ ছাড়াই গাণিতিকভাবে যাচাইকৃত সুরক্ষা পরিকল্পনা তৈরি করে।",
        "gu": "ફિનરોકનું સ્વાયત્ત ક્રેશ-ટેસ્ટ એન્જિન (/app/crash-test) 6 ગંભીર વાસ્તવિક આંચકાઓ (નોકરી ગુમાવવી, હોસ્પિટલ બિલ, મોંઘવારી વધારો) સામે તમારી નાણાકીય સ્થિરતા ચકાસે છે. 6 એજન્ટો તમારા ખાતાવહીનું વિશ્લેષણ કરે છે અને દેવું લીધા વિના ગાણિતિક પુનઃપ્રાપ્તિ યોજના સાબિત કરે છે.",
        "ta": "ஃபின்ராக்கின் தன்னாட்சி கிராஷ்-டெஸ்ட் எஞ்சின் (/app/crash-test) வருமான இழப்பு, மருத்துவ அவசரநிலைகள் மற்றும் பணவீக்கம் போன்ற 6 கடுமையான அதிர்ச்சிகளுக்கு எதிராக உங்கள் நிதியை சோதிக்கிறது. 6 ஏஜென்ட்கள் ஒருங்கிணைந்து கடன் இல்லாமல் கணித ரீதியாக நிரூபிக்கப்பட்ட மீட்பு திட்டங்களை உருவாக்குகின்றன.",
        "te": "ఫిన్‌రాక్ అటానమస్ క్రాష్-టెస్ట్ ఇంజిన్ (/app/crash-test) ఆదాయ నష్టం, అత్యవసర వైద్య ఖర్చులు మరియు ద్రవ్యోల్బణం వంటి 6 తీవ్రమైన ఆర్థిక షాక్‌లను తట్టుకునే మీ సామర్థ్యాన్ని పరీక్షిస్తుంది. 6 ఏజెంట్లు కలసి అప్పులు లేకుండా గణితశాస్త్ర నిరూపితమైన రక్షణ ప్రణాళికను అందిస్తాయి.",
        "mr": "फिनरॉकचे स्वायत्त क्रॅश-टेस्ट इंजिन (/app/crash-test) उत्पन्न नुकसान, वैद्यकीय आणीबाणी आणि महागाई यासारख्या 6 गंभीर वास्तविक आर्थिक संकटांविरुद्ध आपल्या वित्ताची चाचणी घेते. 6 एजंट मिळून कोणत्याही कर्जाशिवाय गणिताच्या दृष्टीने सिद्ध केलेल्या योजना तयार करतात.",
        "kn": "ಫಿನ್‌ರಾಕ್‌ನ ಸ್ವಾಯತ್ತ ಕ್ರ್ಯಾಶ್-ಟೆಸ್ಟ್ ಎಂಜಿನ್ (/app/crash-test) 6 ತೀವ್ರ ನೈಜ-ಜಗತ್ತಿನ ಆರ್ಥಿಕ ಆಘಾತಗಳ ವಿರುದ್ಧ ನಿಮ್ಮ ಹಣಕಾಸಿನ ಸ್ಥಿರತೆಯನ್ನು ಪರೀಕ್ಷಿಸುತ್ತದೆ ಮತ್ತು ಸಾಲವಿಲ್ಲದೆ ಗಣಿತಶಾಸ್ತ್ರೀಯವಾಗಿ ಪರಿಶೀಲಿಸಿದ ಚೇತರಿಕೆ ಯೋಜನೆಯನ್ನು ಒದಗಿಸುತ್ತದೆ.",
        "es": "El motor de Crash-Test autónomo de Finroq (/app/crash-test) evalúa su resistencia ante 6 shocks severos (pérdida de empleo, gastos médicos, inflación). Seis agentes coordinados diseñan planes de recuperación autofinanciados y verificados matemáticamente sin endeudarse.",
        "fr": "Le moteur de Crash-Test de Finroq (/app/crash-test) évalue votre résistance face à 6 chocs sévères (perte de revenu, factures médicales, inflation). Six agents coordonnés analysent votre grand livre et prouvent mathématiquement votre solvabilité sans endettement.",
        "de": "Die autonome Crash-Test-Engine von Finroq (/app/crash-test) testet Ihre Finanzen gegen 6 schwere Realschocks (Einkommensverlust, Arztrechnungen, Inflation). Sechs Agenten erstellen mathematisch geprüfte, schuldenfreie Wiederherstellungspläne.",
        "zh": "Finroq 的自主压力测试引擎（/app/crash-test）针对失业、医疗突发事件和通货膨胀等6大严峻冲击进行压力测试。6个智能体协同分析您的账本，在不增加借贷的前提下输出经数学验证的自愈计划。",
        "ja": "Finroqの自律型クラッシュテスト（/app/crash-test）は、失業、高額医療費、インフレなど6つの深刻なショックに対して財務耐性を検証し、6つの協調エージェントが借入不要の数学的証明付き回復策を策定します。",
        "ar": "محرك اختبار الصدمات المالي الذكي (/app/crash-test) يختبر قدرتك المالية ضد 6 صدمات حقيقية كفقدان الدخل والنفقات الطبية والتضخم، ويصمم خطط حماية ذاتية التمويل ومثبتة رياضياً دون ديون.",
        "pt": "O motor de Crash-Test autônomo do Finroq (/app/crash-test) avalia sua resistência contra 6 choques graves (perda de renda, despesas médicas, inflação), criando planos de recuperação matematicamente comprovados sem novas dívidas.",
        "ru": "Автономный стресс-тест Finroq (/app/crash-test) оценивает устойчивость ваших финансов к 6 серьезным шокам (потеря дохода, медицинские счета, инфляция) и рассчитывает математически проверенные планы защиты без долгов.",
        "it": "Il motore Crash-Test autonomo di Finroq (/app/crash-test) valuta la tua tenuta di fronte a 6 shock reali (perdita di reddito, spese mediche, inflazione), formulando piani di recupero matematicamente verificati senza indebitamento.",
        "ko": "Finroq 자율 크래시 테스트 엔진(/app/crash-test)은 소득 중단, 의료비 급증, 인플레이션 등 6가지 심각한 충격에 대한 재정 회복력을 검증하고 6개 협력 에이전트가 대출 없는 수학적 회복 플랜을 입증합니다.",
    },
    "security": {
        "en": "Finroq enforces zero-trust tenant isolation with Argon2id cryptographic password hashing and signed JWT tokens. Your financial records are isolated strictly to your account — no other user or administrator can view your ledger.",
        "hi": "फिनरॉक Argon2id क्रिप्टोग्राफिक सुरक्षा और हस्ताक्षरित JWT टोकन के साथ ज़ीरो-ट्रस्ट सुरक्षा लागू करता है। आपका वित्तीय डेटा पूरी तरह निजी है — कोई अन्य उपयोगकर्ता या व्यवस्थापक आपका खाता बही नहीं देख सकता।",
        "bn": "ফিনরক Argon2id ক্রিপ্টোগ্রাফিক সুরক্ষা এবং স্বাক্ষরিত JWT টোকেন সহ জিরো-ট্রাস্ট ডেটা সুরক্ষা নিশ্চিত করে। আপনার আর্থিক তথ্য সম্পূর্ণ গোপনীয় ಮತ್ತು સુરક્ષিত।",
        "gu": "ફિનરોક Argon2id એન્ક્રિપ્શન અને સુરક્ષિત JWT ટોકન્સ સાથે શૂન્ય-વિશ્વાસ સુરક્ષા પ્રદાન કરે છે. તમારો ડેટા સંપૂર્ણપણે ખાનગી અને સુરક્ષિત છે.",
        "ta": "ஃபின்ராக் Argon2id குறியாக்க பாதுகாப்பு மற்றும் கையொப்பமிடப்பட்ட JWT டோக்கன்களுடன் முழுமையான தரவு பாதுகாப்பை உறுதி செய்கிறது. உங்கள் நிதி பதிவுகளை வேறு யாரும் பார்க்க முடியாது.",
        "te": "ఫిన్‌రాక్ Argon2id భద్రత మరియు డిజిటల్ సంతకం చేసిన JWT టోకెన్‌లతో జీరో-ట్రస్ట్ డేటా రక్షణను నిర్ధారిస్తుంది. మీ ఆర్థిక రికార్డులను ఎవరూ చూడలేరు.",
        "mr": "फिनरॉक Argon2id एन्क्रिप्शन आणि सुरक्षित JWT टोकनसह संपूर्ण डेटा सुरक्षा सुनिश्चित करतो. आपला आर्थिक डेटा पूर्णपणे खाजगी आणि सुरक्षित आहे.",
        "kn": "ಫಿನ್‌ರಾಕ್ Argon2id ಗೂಢಲಿಪೀಕರಣ ಭದ್ರತೆ ಮತ್ತು ಸುರಕ್ಷಿತ JWT ಟೋಕನ್‌ಗಳೊಂದಿಗೆ ಸಂಪೂರ್ಣ ಡೇಟಾ ಗೌಪ್ಯತೆಯನ್ನು ಖಚಿತಪಡಿಸುತ್ತದೆ. ನಿಮ್ಮ ದಾಖಲೆಗಳನ್ನು ಯಾರೂ ವೀಕ್ಷಿಸಲು ಸಾಧ್ಯವಿಲ್ಲ.",
        "es": "Finroq aplica un aislamiento de seguridad de confianza cero con cifrado Argon2id y tokens JWT. Sus registros financieros son estrictamente privados; ningún otro usuario ni administrador puede ver su libro contable.",
        "fr": "Finroq applique une isolation de sécurité zéro confiance avec hachage Argon2id et jetons JWT signés. Vos données financières sont strictement privées : aucun autre utilisateur ou administrateur ne peut consulter vos registres.",
        "de": "Finroq erzwingt Zero-Trust-Sicherheit mit Argon2id-Verschlüsselung und signierten JWT-Tokens. Ihre Finanzdaten sind streng isoliert – kein anderer Benutzer oder Administrator kann Ihr Hauptbuch einsehen.",
        "zh": "Finroq 采用基于 Argon2id 加密和签名 JWT 令牌的零信任租户隔离。您的财务记录完全隔离，任何其他用户或管理员均无法查看您的账本。",
        "ja": "Finroqは、Argon2id暗号化と署名付きJWTトークンによるゼロトラスト分離を採用しています。財務記録は厳重に保護され、他のユーザーや管理者でも閲覧することはできません。",
        "ar": "يطبق فينروك عزل الأمان المتقدم مع تشفير Argon2id ورموز JWT الموقعة. سجلاتك المالية خاصة تماماً ولا يمكن لأي مستخدم آخر أو مسؤول الاطلاع عليها.",
        "pt": "O Finroq aplica isolamento de segurança Zero-Trust com criptografia Argon2id e tokens JWT. Seus registros são estritamente privados — ninguém, nem mesmo administradores, pode vê-los.",
        "ru": "Finroq обеспечивает нулевое доверие с шифрованием Argon2id и токенами JWT. Ваши финансовые записи строго изолированы — никто, даже администратор, не имеет к ним доступа.",
        "it": "Finroq garantisce isolamento zero-trust con crittografia Argon2id e token JWT firmati. I tuoi dati finanziari sono strettamente privati e inaccessibili ad altri o agli amministratori.",
        "ko": "Finroq은 Argon2id 암호화와 서명된 JWT 토큰으로 제로 트러스트 보안 격리를 적용합니다. 고객님의 금융 데이터는 엄격히 비공개되며 관리자도 열람할 수 없습니다.",
    },
    "language_switch": {
        "en": "Certainly! I have switched my language to English. I am your Finroq Guide — feel free to ask about our 13 modules, crash-testing, and bank imports!",
        "hi": "ज़रूर! मैंने अपनी भाषा बदलकर हिन्दी कर ली है। मैं आपका फिनरॉक गाइड हूँ — हमारे 13 मॉड्यूल्स, क्रैश-टेस्टिंग और बैंक स्टेटमेंट आयात के बारे में बेझिझक पूछें!",
        "bn": "নিশ্চয়ই! আমি আমার ভাষা পরিবর্তন করে বাংলায় নির্ধারণ করেছি। আমি আপনার ফিনরক গাইড — আমাদের ১৩টি মডিউল, ক্র্যাশ-টেস্ট এবং ব্যাংক স্টেটমেন্ট আমদানি সম্পর্কে নিঃসংকোচে জিজ্ঞাসা করুন!",
        "gu": "ચોક્કસ! મેં મારી ભાષા બદલીને ગુજરાતી કરી દીધી છે. હું તમારો ફિનરોક માર્ગદર્શક છું — અમારા 13 મોડ્યુલો, ક્રેશ-ટેસ્ટિંગ અને બેંક આયાત વિશે કોઈપણ પ્રશ્ન પૂછો!",
        "ta": "நிச்சயமாக! எனது மொழியை தமிழுக்கு மாற்றிவிட்டேன். நான் உங்கள் ஃபின்ராக் வழிகாட்டி — எங்கள் 13 தொகுதிகள், கிராஷ்-டெஸ்டிங் மற்றும் வங்கி அறிக்கைகள் பற்றி தயங்காமல் கேளுங்கள்!",
        "te": "తప్పకుండా! నేను నా భాషను తెలుగులోకి మార్చాను. నేను మీ ఫిన్‌రాక్ గైడ్ — మా 13 మాడ్యూల్స్, క్రాష్-టెస్టింగ్ మరియు బ్యాంక్ స్టేట్‌మెంట్‌ల గురించి నిస్సందేహంగా అడగండి!",
        "mr": "नक्कीच! मी माझी भाषा मराठीत बदलली आहे. मी आपला फिनरॉक मार्गदर्शक आहे — आमच्या 13 मॉड्यूल्स, क्रॅश-टेस्टिंग आणि बँक आयात बद्दल कोणतीही माहिती विचारा!",
        "kn": "ಖಂಡಿತವಾಗಿಯೂ! ನಾನು ನನ್ನ ಭಾಷೆಯನ್ನು ಕನ್ನಡಕ್ಕೆ ಬದಲಾಯಿಸಿದ್ದೇನೆ. ನಾನು ನಿಮ್ಮ ಫಿನ್‌ರಾಕ್ ಮಾರ್ಗದರ್ಶಿ — ನಮ್ಮ 13 ಮಾಡ್ಯೂಲ್‌ಗಳು, ಕ್ರ್ಯಾಶ್-ಟೆಸ್ಟಿಂಗ್ ಬಗ್ಗೆ ಧೈರ್ಯವಾಗಿ ಕೇಳಿ!",
        "es": "¡Por supuesto! He cambiado mi idioma a español. Soy su guía de Finroq: ¡pregúnteme sobre nuestros 13 módulos, pruebas de estrés y privacidad!",
        "fr": "Certainement ! J'ai changé ma langue pour le français. Je suis votre guide Finroq : posez-moi vos questions sur nos 13 modules et le Crash-Test !",
        "de": "Sehr gerne! Ich habe meine Sprache auf Deutsch umgestellt. Ich bin Ihr Finroq-Guide – fragen Sie mich gerne zu unseren 13 Modulen und Crash-Tests!",
        "zh": "没问题！我已经将语言切换为中文。我是您的 Finroq 指南——欢迎咨询我们的13个模块、压力测试及数据安全！",
        "ja": "かしこまりました！日本語に切り替えました。Finroqガイドとして、13のモジュールやクラッシュテスト機能について何でもご質問ください！",
        "ar": "بالتأكيد! لقد قمت بتغيير اللغة إلى العربية. أنا مرشدك في فينروك — لا تتردد في السؤال عن محركاتنا الـ13 واختبار الصدمات المالي!",
        "pt": "Com certeza! Mudei meu idioma para português. Sou seu assistente Finroq — fique à vontade para perguntar sobre nossos 13 módulos e crash-tests!",
        "ru": "Конечно! Я переключил язык на русский. Я ваш гид по Finroq — спрашивайте о наших 13 модулях, стресс-тестировании и импорте выписок!",
        "it": "Certamente! Ho impostato la mia lingua su italiano. Sono la tua guida Finroq: chiedimi pure dei nostri 13 moduli, dello stress-test e della privacy!",
        "ko": "물론입니다! 한국어로 응답 언어를 변경했습니다. Finroq 가이드로서 13가지 금융 모듈과 자율 크래시 테스트에 대해 언제든 문의하세요!",
    },
    "general": {
        "en": "Finroq is an enterprise-grade personal finance engine built with exact decimal arithmetic (NUMERIC 14,2) and 13 unified modules. You can test all features right now with the 1-click demo or create a secure account with Google. Sign in to analyze your personal finances!",
        "hi": "फिनरॉक सटीक दशमलव अंकगणित NUMERIC(14,2) और 13 एकीकृत मॉड्यूल्स पर बना वित्तीय इंजन है। आप 1-क्लिक डेमो के साथ सभी सुविधाओं का परीक्षण कर सकते हैं या Google से खाता बना सकते हैं। अपने व्यक्तिगत खाते देखने के लिए साइन इन करें!",
        "bn": "ফিনরক নির্ভুল দশমিক পাটিগণিত এবং ১৩টি সমন্বিত মডিউল সহ নির্মিত একটি এন্টারপ্রাইজ আর্থিক ইঞ্জিন। আপনি ১-ক্লিক ডেমো দিয়ে সব বৈশিষ্ট্য পরীক্ষা করতে পারেন বা Google দিয়ে সাইন ইন করতে পারেন!",
        "gu": "ફિનરોક ચોક્કસ દશાંશ ગણતરી અને 13 મોડ્યુલો પર બનેલું અદ્યતન નાણાકીય એન્જિન છે. તમે 1-ક્લિક ડેમો દ્વારા તમામ સુવિધાઓ ચકાસી શકો છો અથવા Google દ્વારા સાઇન ઇન કરી શકો છો!",
        "ta": "ஃபின்ராக் துல்லியமான தசம எண்கணிதம் மற்றும் 13 ஒருங்கிணைந்த அமைப்புகளுடன் கட்டமைக்கப்பட்ட நிதி எஞ்சின் ஆகும். 1-கிளிக் டெமோ மூலம் அனைத்து அம்சங்களையும் சோதிக்கலாம் அல்லது Google மூலம் உள்நுழையலாம்!",
        "te": "ఫిన్‌రాక్ ఖచ్చితమైన దశాంశ గణితం మరియు 13 మాడ్యూల్స్‌తో నిర్మించిన వ్యక్తిగత ఆర్థిక ఇంజిన్. మీరు 1-క్లిక్ డెమో ద్వారా అన్ని ఫీచర్లను పరీక్షించవచ్చు లేదా Google తో లాగిన్ అవ్వవచ్చు!",
        "mr": "फिनरॉक अचूक दशांश अंकगणित आणि 13 मॉड्यूल्सवर आधारित वैयक्तिक वित्त इंजिन आहे. आपण 1-क्लिक डेमोद्वारे सर्व वैशिष्ट्ये तपासू शकता किंवा Google द्वारे साइन इन करू शकता!",
        "kn": "ಫಿನ್‌ರಾಕ್ ನಿಖರವಾದ ದಶಮಾಂಶ ಗಣಿತ ಮತ್ತು 13 ಮಾಡ್ಯೂಲ್‌ಗಳ ಮೇಲೆ ನಿರ್ಮಿಸಲಾದ ವೈಯಕ್ತಿಕ ಹಣಕಾಸು ಎಂಜಿನ್ ಆಗಿದೆ. ನೀವು 1-ಕ್ಲಿಕ್ ಡೆಮೊ ಮೂಲಕ ಎಲ್ಲಾ ವೈಶಿಷ್ಟ್ಯಗಳನ್ನು ಪರೀಕ್ಷಿಸಬಹುದು!",
        "es": "Finroq es un motor de finanzas personales de nivel empresarial construido con aritmética decimal exacta y 13 módulos unificados. ¡Pruebe todas las funciones con la demo de 1 clic o inicie sesión con Google!",
        "fr": "Finroq est un moteur de finances personnelles haute précision basé sur une arithmétique décimale exacte et 13 modules unifiés. Testez toutes les fonctionnalités avec la démo en 1 clic ou connectez-vous avec Google !",
        "de": "Finroq ist eine hochpräzise persönliche Finanzengine mit exakter Dezimalarithmetik und 13 einheitlichen Modulen. Testen Sie alle Funktionen mit der 1-Klick-Demo oder melden Sie sich mit Google an!",
        "zh": "Finroq 是一个基于精确十进制算术和13个统一模块的高精度个人财务引擎。您可以立即使用一键演示试用所有功能，或使用 Google 登录！",
        "ja": "Finroqは、正確な10進数演算と13の統合モジュールに基づいた高精度の個人財務管理エンジンです。1クリックデモで今すぐすべての機能を試すか、Googleでログインしてください！",
        "ar": "فينروك هو محرك مالي شخصي متطور يعتمد على حسابات كسرية دقيقة و13 وحدة موحدة. يمكنك تجربة جميع الميزات الآن من خلال العرض التوضيحي بنقرة واحدة أو تسجيل الدخول باستخدام Google!",
        "pt": "O Finroq é um motor de finanças pessoais de alta precisão com aritmética decimal exata e 13 módulos unificados. Teste todos os recursos com a demonstração de 1 clique ou faça login com o Google!",
        "ru": "Finroq — высокоточный финансовый движок с точной десятичной арифметикой и 13 модулями. Опробуйте все функции в демо в 1 клик или войдите через Google для доступа к личному журналу!",
        "it": "Finroq è un motore finanziario ad alta precisione basato su aritmetica decimale esatta e 13 moduli unificati. Prova tutte le funzionalità con la demo in 1 clic o accedi con Google!",
        "ko": "Finroq은 정확한 10진수 산술과 13가지 통합 모듈을 기반으로 구축된 고정밀 개인 금융 엔진입니다. 1클릭 데모로 지금 바로 모든 기능을 체험하거나 Google로 로그인하세요!",
    },
}

async def get_public_guidance(message: str, language: Optional[str] = "en") -> PublicAIChatResponse:
    """Answers public visitor inquiries across 18 languages with zero database or user data access."""
    # 1. Smart language detection from user message or explicit command
    lang = detect_language_from_text(message, default_lang=(language or "en").lower())
    msg_lower = message.lower()

    # 2. Check if user is solely requesting a language switch
    is_lang_switch_only = any(
        phrase in msg_lower for phrase in [
            "answer in", "reply in", "speak in", "respond in", "talk in", "switch to",
            "in english", "in hindi", "in bengali", "in gujarati", "in tamil", "in telugu",
            "में बताओ", "তে বলুন", "માં જવાબ", "இல் பேசு", "లో చెప్పు"
        ]
    ) and len(message.strip().split()) <= 6

    # 3. Determine intent
    if is_lang_switch_only:
        intent = "language_switch"
    elif any(k in msg_lower for k in [
        "crash", "stress", "shock", "pause", "emergency cushion", "resilience",
        "क्रैश", "शॉक", "संकट", "ক্র্যাশ", "ઝટકો", "கிராஷ்", "క్రాష్"
    ]):
        intent = "crashtest"
    elif any(k in msg_lower for k in [
        "module", "feature", "engine", "what can", "what do", "modules", "सुविधा",
        "कार्य", "मॉड्यूल", "ফিচার", "સુવિધા", "அம்சம்", "ఫీచర్లు"
    ]):
        intent = "modules"
    elif any(k in msg_lower for k in [
        "secure", "security", "privacy", "protect", "leak", "admin", "सुरक्षा",
        "प्राइवेसी", "নিরাপত্তা", "સુરક્ષા", "பாதுகாப்பு", "భద్రత"
    ]):
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

