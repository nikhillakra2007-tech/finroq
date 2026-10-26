import logging
import httpx
from typing import Optional, Dict, Any
from pydantic import BaseModel
from app.core.config import settings

logger = logging.getLogger(__name__)

GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta/models"

LANGUAGE_NAMES: Dict[str, str] = {
    "en": "English",
    "hi": "Hindi (हिन्दी)",
    "es": "Spanish (Español)",
    "fr": "French (Français)",
    "de": "German (Deutsch)",
    "zh": "Mandarin Chinese (中文)",
    "ja": "Japanese (日本語)",
    "ar": "Arabic (العربية)",
    "bn": "Bengali (বাংলা)",
    "pt": "Portuguese (Português)",
    "ru": "Russian (Русский)",
    "it": "Italian (Italiano)",
    "ko": "Korean (한국어)",
    "ta": "Tamil (தமிழ்)",
    "te": "Telugu (తెలుగు)",
    "mr": "Marathi (मराठी)",
    "gu": "Gujarati (ગુજરાતી)",
    "kn": "Kannada (ಕನ್ನಡ)",
}

FALLBACK_MESSAGES: Dict[str, str] = {
    "en": (
        "FINROQ Financial Intelligence Summary:\n"
        "• Cash Flow Integrity: Review recurring commitments and maintain budget discipline within target categories.\n"
        "• Liquidity Buffer: Ensure at least 3–6 months of essential baseline expenses are held in liquid accounts.\n"
        "• Allocation Strategy: Prioritize positive net cash flow to accelerate debt reduction or wealth accumulation goals."
    ),
    "hi": (
        "फिनरॉक वित्तीय बुद्धिमत्ता सारांश:\n"
        "• नकदी प्रवाह अखंडता: आवर्ती दायित्वों की समीक्षा करें और लक्षित श्रेणियों में बजट अनुशासन बनाए रखें।\n"
        "• तरलता बफर: सुनिश्चित करें कि कम से कम 3-6 महीने का आवश्यक खर्च तरल खातों में सुरक्षित हो।\n"
        "• आवंटन रणनीति: कर्ज मुक्ति या धन सृजन में तेजी लाने के लिए सकारात्मक शुद्ध नकदी प्रवाह को प्राथमिकता दें।"
    ),
    "bn": (
        "ফিনরক আর্থিক গোয়েন্দা তথ্য সারাংশ:\n"
        "• নগদ প্রবাহ শৃঙ্খলা: পুনরাবৃত্ত প্রতিশ্রুতি পর্যালোচনা করুন এবং লক্ষ্য বিভাগে বাজেট বজায় রাখুন।\n"
        "• তারল্য সুরক্ষা: তরল অ্যাকাউন্টে কমপক্ষে ৩-৬ মাসের মৌলিক খরচ সঞ্চিত রাখুন।\n"
        "• সম্পদ বণ্টন কৌশল: ঋণ হ্রাস বা সম্পদ বৃদ্ধির জন্য ইতিবাচক নেট নগদ প্রবাহ নিশ্চিত করুন।"
    ),
    "gu": (
        "ફિનરોક નાણાકીય બુદ્ધિમત્તા સારાંશ:\n"
        "• રોકડ પ્રવાહ શિસ્ત: નિયમિત ખર્ચાઓની સમીક્ષા કરો અને લક્ષિત શ્રેણીઓમાં બજેટ મર્યાદા જાળવો.\n"
        "• તરલતા સુરક્ષા: લિક્વિડ ખાતાઓમાં ઓછામાં ઓછા 3-6 મહિનાના આવશ્યક ખર્ચ સુરક્ષિત રાખો.\n"
        "• ફાળવણી વ્યૂહરચના: દેવું ઘટાડવા અથવા સંપત્તિ નિર્માણ માટે સકારાત્મક ચોખ્ખા રોકડ પ્રવાહને પ્રાથમિકતા આપો."
    ),
    "ta": (
        "ஃபின்ராக் நிதி நுண்ணறிவு சுருக்கம்:\n"
        "• பணப்புழக்க ஒருமைப்பாடு: தொடர் கட்டணங்களை மதிப்பாய்வு செய்து பட்ஜெட் ஒழுக்கத்தைப் பேணுங்கள்.\n"
        "• பணக் கையிருப்பு: குறைந்தபட்சம் 3-6 மாத அடிப்படை செலவுகளை சேமிப்புக் கணக்கில் வைத்திருங்கள்.\n"
        "• நிதி ஒதுக்கீடு: கடன் குறைப்பு மற்றும் செல்வ உருவாக்கத்திற்கு நேர்மறை பணப்புழக்கத்திற்கு முன்னுரிமை அளியுங்கள்."
    ),
    "te": (
        "ఫిన్‌రాక్ ఆర్థిక విశ్లేషణ సారాంశం:\n"
        "• నగదు ప్రవాహ సమగ్రత: పునరావృత ఖర్చులను సమీక్షించండి మరియు బడ్జెట్ పరిమితులను పాటించండి.\n"
        "• ద్రవ్యత నిల్వ: కనీసం 3-6 నెలల అత్యవసర ఖర్చులను పొదుపు ఖాతాలో ఉంచుకోండి.\n"
        "• కేటాయింపు వ్యూహం: రుణ విముక్తి లేదా సంపద సృష్టికి సానుకూల నికర నగదు ప్రవాహానికి ప్రాధాన్యత ఇవ్వండి."
    ),
    "mr": (
        "फिनरॉक वित्तीय बुद्धिमत्ता सारांश:\n"
        "• रोख प्रवाह शिस्त: नियमित देयकांचा आढावा घ्या आणि लक्ष्य श्रेणींमध्ये बजेट मर्यादा पाळा.\n"
        "• रोख राखीव निधी: किमान ३-६ महिन्यांचे अत्यावश्यक खर्च बचत खात्यात सुरक्षित ठेवा.\n"
        "• वाटप धोरण: कर्जमुक्ती किंवा संपत्ती निर्मितीसाठी सकारात्मक निव्वळ रोख प्रवाहाला प्राधान्य द्या."
    ),
    "kn": (
        "ಫಿನ್‌ರಾಕ್ ಹಣಕಾಸು ಬುದ್ಧಿಮತ್ತೆ ಸಾರಾಂಶ:\n"
        "• ನಗದು ಹರಿವಿನ ಶಿಸ್ತು: ಮರುಕಳಿಸುವ ಬದ್ಧತೆಗಳನ್ನು ಪರಿಶೀಲಿಸಿ ಮತ್ತು ಬಜೆಟ್ ಮಿತಿಗಳನ್ನು ಕಾಯ್ದುಕೊಳ್ಳಿ.\n"
        "• ದ್ರವ್ಯತೆ ಬಫರ್: ಕನಿಷ್ಠ 3-6 ತಿಂಗಳ ಅಗತ್ಯ ವೆಚ್ಚಗಳನ್ನು ಉಳಿತಾಯ ಖಾತೆಗಳಲ್ಲಿ ಇರಿಸಿ.\n"
        "• ಹಂಚಿಕೆ ತಂತ್ರ: ಸಾಲ ತೀರಿಸಲು ಅಥವಾ ಸಂಪತ್ತು ಬೆಳೆಸಲು ಧನಾತ್ಮಕ ನಿವ್ವಳ ನಗದು ಹರಿವಿಗೆ ಆದ್ಯತೆ ನೀಡಿ."
    ),
    "es": (
        "Resumen de Inteligencia Financiera FINROQ:\n"
        "• Integridad del Flujo de Caja: Revise los compromisos recurrentes y mantenga la disciplina presupuestaria en las categorías clave.\n"
        "• Colchón de Liquidez: Asegure al menos de 3 a 6 meses de gastos esenciales en cuentas líquidas.\n"
        "• Estrategia de Asignación: Priorice un flujo de caja neto positivo para acelerar la reducción de deuda o el patrimonio."
    ),
    "fr": (
        "Synthèse d'Intelligence Financière FINROQ :\n"
        "• Intégrité des Flux de Trésorerie : Passez en revue vos engagements récurrents et maintenez la discipline budgétaire.\n"
        "• Coussin de Liquidité : Assurez au moins 3 à 6 mois de dépenses essentielles sur des comptes liquides disponibles.\n"
        "• Stratégie d'Allocation : Privilégiez un flux de trésorerie net positif pour accélérer le désendettement ou la constitution de patrimoine."
    ),
    "de": (
        "FINROQ Finanzanalyse Zusammenfassung:\n"
        "• Cashflow-Integrität: Überprüfen Sie wiederkehrende Verpflichtungen und halten Sie die Budgetdisziplin ein.\n"
        "• Liquiditätspuffer: Halten Sie mindestens 3–6 Monate an Grundausgaben auf liquiden Konten bereit.\n"
        "• Allokationsstrategie: Priorisieren Sie einen positiven Netto-Cashflow für Schuldenabbau und Vermögensaufbau."
    ),
    "zh": (
        "FINROQ 财务智能摘要：\n"
        "• 现金流健康度：审视经常性支出并保持关键预算类别的纪律。\n"
        "• 流动性缓冲：确保在活期账户中储备至少3-6个月的基本生活开支。\n"
        "• 资产配置策略：优先保持正向净现金流，加速偿清债务或财富积累。"
    ),
    "ja": (
        "FINROQ 財務インテリジェンス要約：\n"
        "• キャッシュフローの健全性：定期的な固定費を見直し、予算枠内の規律を維持してください。\n"
        "• 流動性クッション：最低3〜6ヶ月分の基本生活費を流動性のある口座に確保してください。\n"
        "• 配分戦略：借入返済や資産形成を加速するため、プラスの純キャッシュフローを最優先してください。"
    ),
    "ar": (
        "ملخص الذكاء المالي من فينروك:\n"
        "• سلامة التدفق النقدي: راجع الالتزامات الدورية وحافظ على الانضباط في الميزانية.\n"
        "• وسادة السيولة: احتفظ بما يعادل 3-6 أشهر من النفقات الأساسية في حسابات سهلة السحب.\n"
        "• استراتيجية التخصيص: أعطِ الأولوية للتدفق النقدي الصافي الإيجابي لتسريع سداد الديون أو بناء الثروة."
    ),
    "pt": (
        "Resumo de Inteligência Financeira FINROQ:\n"
        "• Integridade do Fluxo de Caixa: Revise compromissos recorrentes e mantenha a disciplina orçamentária nas categorias.\n"
        "• Reserva de Liquidez: Mantenha de 3 a 6 meses de despesas essenciais em contas de liquidez imediata.\n"
        "• Estratégia de Alocação: Priorize fluxo de caixa líquido positivo para acelerar a quitação de dívidas ou formação de patrimônio."
    ),
    "ru": (
        "Сводка финансового интеллекта FINROQ:\n"
        "• Контроль денежного потока: Проверьте регулярные подписки и платежи, соблюдайте лимиты бюджета.\n"
        "• Подушка ликвидности: Сформируйте резерв на 3–6 месяцев базовых расходов на доступных счетах.\n"
        "• Стратегия распределения: Поддерживайте положительный чистый денежный поток для быстрого погашения долгов и роста накоплений."
    ),
    "it": (
        "Riepilogo Intelligenza Finanziaria FINROQ:\n"
        "• Integrità del Flusso di Cassa: Esamina gli impegni ricorrenti e mantieni la disciplina di bilancio.\n"
        "• Cuscinetto di Liquidità: Assicurati almeno 3-6 mesi di spese essenziali su conti liquidi.\n"
        "• Strategia di Allocazione: Dai priorità a un flusso di cassa netto positivo per accelerare la riduzione del debito e la crescita patrimoniale."
    ),
    "ko": (
        "FINROQ 금융 인텔리전스 요약:\n"
        "• 현금 흐름 건전성: 정기 지출 항목을 점검하고 카테고리별 예산 규율을 유지하세요.\n"
        "• 유동성 버퍼: 최소 3~6개월분의 필수 생활비를 유동성 계좌에 비축하세요.\n"
        "• 자산 배분 전략: 부채 상환 또는 자산 증식을 가속화하기 위해 플러스 순현금흐름을 최우선으로 확보하세요."
    ),
}


class GeminiResponse(BaseModel):
    model_config = {"protected_namespaces": ()}
    content: str
    is_live_ai: bool
    model_used: str
    provider_status: str


class GeminiClient:
    def __init__(self, api_key: Optional[str] = None, model: Optional[str] = None, timeout: Optional[float] = None):
        self.api_key = api_key if api_key is not None else settings.gemini_api_key
        self.model = model or settings.gemini_model
        self.timeout = timeout or settings.ai_request_timeout_seconds

    @property
    def is_configured(self) -> bool:
        return bool(self.api_key and self.api_key.strip())

    async def generate_insight(
        self,
        system_instruction: str,
        user_prompt: str,
        language: Optional[str] = "en",
        max_output_tokens: int = 1000,
    ) -> GeminiResponse:
        """
        Calls Google Gemini REST API with bounded retries, strict error handling,
        and enforced multi-language fidelity across 18 languages.
        Falls back cleanly to localized deterministic response if API key is not configured or network fails.
        """
        lang_code = (language or "en").lower()
        if not self.is_configured:
            return GeminiResponse(
                content=self._generate_deterministic_fallback(user_prompt, language=lang_code),
                is_live_ai=False,
                model_used="deterministic-rules-engine",
                provider_status="unconfigured_api_key",
            )

        lang_full = LANGUAGE_NAMES.get(lang_code, lang_code)
        lang_directive = (
            f"\n\nLANGUAGE FIDELITY (MANDATORY & ABSOLUTE): The user's active language is {lang_full} ({lang_code}). "
            f"You MUST formulate your ENTIRE explanation and answer completely and naturally in {lang_full}. "
            f"Do NOT default to English."
        )

        url = f"{GEMINI_API_BASE}/{self.model}:generateContent?key={self.api_key}"
        payload = {
            "contents": [
                {
                    "role": "user",
                    "parts": [{"text": f"System Directive: {system_instruction}{lang_directive}\n\nUser Context:\n{user_prompt}"}],
                }
            ],
            "generationConfig": {
                "temperature": 0.2,
                "maxOutputTokens": max_output_tokens,
                "topP": 0.95,
            },
        }

        # Bounded retries: 1 retry for transient errors
        for attempt in range(2):
            try:
                async with httpx.AsyncClient(timeout=self.timeout) as client:
                    response = await client.post(url, json=payload)
                    if response.status_code == 200:
                        data = response.json()
                        candidates = data.get("candidates", [])
                        if candidates:
                            parts = candidates[0].get("content", {}).get("parts", [])
                            if parts and "text" in parts[0]:
                                return GeminiResponse(
                                    content=parts[0]["text"].strip(),
                                    is_live_ai=True,
                                    model_used=self.model,
                                    provider_status="active",
                                )
                        return GeminiResponse(
                            content="No text content returned from Gemini model.",
                            is_live_ai=True,
                            model_used=self.model,
                            provider_status="empty_candidate",
                        )
                    elif response.status_code in (429, 503) and attempt == 0:
                        logger.warning(f"Gemini API rate limited or unavailable (status {response.status_code}), retrying...")
                        continue
                    else:
                        logger.error(f"Gemini API error status {response.status_code}: {response.text}")
                        break
            except (httpx.TimeoutException, httpx.RequestError) as exc:
                logger.error(f"Gemini connection failure on attempt {attempt + 1}: {exc}")
                if attempt == 0:
                    continue

        return GeminiResponse(
            content=self._generate_deterministic_fallback(user_prompt, language=lang_code),
            is_live_ai=False,
            model_used="deterministic-rules-engine",
            provider_status="provider_unavailable_fallback",
        )

    def _generate_deterministic_fallback(self, prompt: str, language: str = "en") -> str:
        """
        Generates objective, rule-based financial guidance localized across 18 languages
        when the external AI provider is unavailable.
        """
        lang = (language or "en").lower()
        return FALLBACK_MESSAGES.get(lang, FALLBACK_MESSAGES["en"])
