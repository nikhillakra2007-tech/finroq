'use client';

import React, { useState, useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useI18n, Language, SUPPORTED_LANGUAGES } from '@/lib/i18n-context';
import { apiClient, extractErrorMessage } from '@/lib/api-client';
import { AIChatResponse, AIConversationSummary, AIMessageItem, PublicAIChatResponse } from '@/lib/api-types';
import { resolveAIProvenance } from '@/lib/provenance';
import { StructuredResults } from './StructuredResults';
import {
  Sparkles,
  Send,
  X,
  Plus,
  ChevronDown,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  Lock,
  Globe,
  Check,
} from 'lucide-react';

function MicIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" x2="12" y1="19" y2="22" />
    </svg>
  );
}

function MicOffIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <line x1="2" x2="22" y1="2" y2="22" />
      <path d="M18.89 13.23A7.12 7.12 0 0 0 19 12v-2" />
      <path d="M5 10v2a7 7 0 0 0 12 5" />
      <path d="M15 9.34V5a3 3 0 0 0-5.68-1.33" />
      <path d="M9 9v3a3 3 0 0 0 5.12 2.12" />
      <line x1="12" x2="12" y1="19" y2="22" />
    </svg>
  );
}

// 18-Language Curated Questions
const PUBLIC_SUGGESTED_QUESTIONS: Record<Language, string[]> = {
  en: [
    'What 13 features does Finroq offer?',
    'How does the 6-agent Crash-Test work?',
    'How does Finroq protect my financial privacy?',
    'What languages are supported on this site?',
  ],
  hi: [
    'फिनरॉक कौन-कौन सी 13 सुविधाएं प्रदान करता है?',
    'स्वायत्त 6-एजेंट क्रैश-टेस्ट कैसे काम करता है?',
    'फिनरॉक मेरी वित्तीय गोपनीयता कैसे सुरक्षित रखता है?',
    'इस साइट पर कौन-कौन सी भाषाएं उपलब्ध हैं?',
  ],
  bn: [
    'ফিনরক কোন ১৩টি আর্থিক সুবিধা প্রদান করে?',
    'স্বায়ত্তশাসিত ৬-এজেন্ট ক্র্যাশ-টেস্ট কীভাবে কাজ করে?',
    'ফিনরক কীভাবে আমার আর্থিক গোপনীয়তা রক্ষা করে?',
    'এই সাইটে কোন কোন ভাষা উপলব্ধ আছে?',
  ],
  gu: [
    'ફિનરોક કઈ 13 નાણાકીય સુવિધાઓ પૂરી પાડે છે?',
    'સ્વાયત્ત 6-એજન્ટ ક્રેશ-ટેસ્ટ કેવી રીતે કાર્ય કરે છે?',
    'ફિનરોક મારી નાણાકીય ગોપનીયતા કેવી રીતે સુરક્ષિત રાખે છે?',
    'આ સાઇટ પર કઈ ભાષાઓ ઉપલબ્ધ છે?',
  ],
  ta: [
    'ஃபின்ராக் என்ன 13 நிதி அம்சங்களை வழங்குகிறது?',
    '6-ஏஜென்ட் கிராஷ்-டெஸ்ட் எவ்வாறு செயல்படுகிறது?',
    'ஃபின்ராக் எனது நிதித் தனியுரிமையை எவ்வாறு பாதுகாக்கிறது?',
    'இந்த தளத்தில் என்னென்ன மொழிகள் கிடைக்கின்றன?',
  ],
  te: [
    'ఫిన్‌రాక్ అందించే 13 ఆర్థిక ఫీచర్లు ఏమిటి?',
    '6-ఏజెంట్ క్రాష్-టెస్ట్ ఎలా పనిచేస్తుంది?',
    'ఫిన్‌రాక్ నా ఆర్థిక గోప్యతను ఎలా కాపాడుతుంది?',
    'ఈ సైట్‌లో ఏ భాషలు అందుబాటులో ఉన్నాయి?',
  ],
  mr: [
    'फिनरॉक कोणत्या 13 आर्थिक सुविधा प्रदान करतो?',
    'स्वायत्त 6-एजंट क्रॅश-टेस्ट कसे कार्य करते?',
    'फिनरॉक माझी आर्थिक गोपनीयता कशी सुरक्षित ठेवतो?',
    'या साइटवर कोणत्या भाषा उपलब्ध आहेत?',
  ],
  kn: [
    'ಫಿನ್‌ರಾಕ್ ಯಾವ 13 ಹಣಕಾಸು ಸೌಲಭ್ಯಗಳನ್ನು ನೀಡುತ್ತದೆ?',
    '6-ಏಜೆಂಟ್ ಕ್ರ್ಯಾಶ್-ಟೆಸ್ಟ್ ಹೇಗೆ ಕಾರ್ಯನಿರ್ವಹಿಸುತ್ತದೆ?',
    'ಫಿನ್‌ರಾಕ್ ನನ್ನ ಆರ್ಥಿಕ ಗೌಪ್ಯತೆಯನ್ನು ಹೇಗೆ ರಕ್ಷಿಸುತ್ತದೆ?',
    'ಈ ಸೈಟ್‌ನಲ್ಲಿ ಯಾವ ಭಾಷೆಗಳು ಲಭ್ಯವಿವೆ?',
  ],
  es: [
    '¿Qué 13 funciones ofrece Finroq?',
    '¿Cómo funciona el Crash-Test de 6 agentes?',
    '¿Cómo protege Finroq mi privacidad financiera?',
    '¿Qué idiomas están disponibles en el sitio?',
  ],
  fr: [
    'Quelles sont les 13 fonctionnalités de Finroq ?',
    'Comment fonctionne le Crash-Test à 6 agents ?',
    'Comment Finroq protège-t-il ma confidentialité financière ?',
    'Quelles langues sont prises en charge ?',
  ],
  de: [
    'Welche 13 Finanzmodule bietet Finroq?',
    'Wie funktioniert der 6-Agenten Crash-Test?',
    'Wie schützt Finroq meine finanzielle Privatsphäre?',
    'Welche Sprachen werden unterstützt?',
  ],
  zh: [
    'Finroq 提供哪13种核心金融功能？',
    '自主6智能体压力测试如何运作？',
    'Finroq 如何保护我的财务隐私？',
    '网站目前支持哪些语言？',
  ],
  ja: [
    'Finroqが提供する13の機能とは？',
    '6エージェント・クラッシュテストの仕組みは？',
    'Finroqは財務プライバシーをどのように保護しますか？',
    'サポートされている言語は何ですか？',
  ],
  ar: [
    'ما هي المحركات المالية الـ 13 التي يقدمها فينروك؟',
    'كيف يعمل اختبار الصدمات المالي عبر 6 عملاء؟',
    'كيف يحمي فينروك خصوصيتي المالية وبياناتي؟',
    'ما هي اللغات المدعومة على هذا الموقع؟',
  ],
  pt: [
    'Quais são os 13 recursos que o Finroq oferece?',
    'Como funciona o Crash-Test de 6 agentes?',
    'Como o Finroq protege minha privacidade financeira?',
    'Quais idiomas são suportados?',
  ],
  ru: [
    'Какие 13 финансовых модулей предлагает Finroq?',
    'Как работает стресс-тест из 6 агентов?',
    'Как Finroq защищает мою финансовую тайну?',
    'Какие языки поддерживаются на сайте?',
  ],
  it: [
    'Quali sono i 13 moduli finanziari di Finroq?',
    'Come funziona il Crash-Test con 6 agenti?',
    'Come protegge Finroq la mia privacy finanziaria?',
    'Quali lingue sono supportate su questo sito?',
  ],
  ko: [
    'Finroq이 제공하는 13가지 금융 기능은 무엇인가요?',
    '6개 에이전트 자율 크래시 테스트는 어떻게 작동하나요?',
    'Finroq은 개인 금융 정보를 어떻게 보호하나요?',
    '지원되는 언어는 어떤 것들이 있나요?',
  ],
};

const APP_SUGGESTED_QUESTIONS: Record<string, string[]> = {
  en: [
    'Analyze my spending this month',
    'Where can I save more?',
    'Can I afford a ₹15,000 purchase?',
    'Explain my budget status',
    'What bills are coming up?',
  ],
  hi: [
    'इस महीने का मेरा खर्च विश्लेषण करें',
    'मैं और अधिक बचत कहां कर सकता हूँ?',
    'क्या मैं ₹15,000 की खरीदारी कर सकता हूँ?',
    'मेरी बजट स्थिति स्पष्ट करें',
    'कौन से बिल आने वाले हैं?',
  ],
  bn: [
    'এই মাসের আমার খরচ বিশ্লেষণ করুন',
    'আমি কোথায় আরও বেশি সঞ্চয় করতে পারি?',
    'আমি কি ₹১৫,০০০ কেনাকাটা করতে পারি?',
    'আমার বাজেট অবস্থা ব্যাখ্যা করুন',
    'সামনে কোন কোন বিল পরিশোধ করতে হবে?',
  ],
  gu: [
    'આ મહિનાના મારા ખર્ચનું વિશ્લેષણ કરો',
    'હું ક્યાં વધુ બચત કરી શકું?',
    'શું હું ₹15,000 ની ખરીદી કરી શકું?',
    'મારા બજેટની સ્થિતિ સમજાવો',
    'આવનારા કયા બિલ બાકી છે?',
  ],
};

// Language alias lookup table
const LANGUAGE_ALIASES: Record<string, Language> = {
  english: 'en', eng: 'en', angrezi: 'en',
  hindi: 'hi', hin: 'hi', 'हिन्दी': 'hi', 'हिंदी': 'hi',
  bengali: 'bn', bangla: 'bn', 'বাংলা': 'bn', bengla: 'bn',
  gujarati: 'gu', gujrati: 'gu', 'ગુજરાતી': 'gu',
  tamil: 'ta', 'தமிழ்': 'ta', tamizh: 'ta',
  telugu: 'te', 'తెలుగు': 'te',
  marathi: 'mr', 'मराठी': 'mr',
  kannada: 'kn', 'ಕನ್ನಡ': 'kn',
  spanish: 'es', espanol: 'es', 'español': 'es',
  french: 'fr', francais: 'fr', 'français': 'fr',
  german: 'de', deutsch: 'de',
  chinese: 'zh', mandarin: 'zh', '中文': 'zh',
  japanese: 'ja', nihongo: 'ja', '日本語': 'ja',
  arabic: 'ar', 'العربية': 'ar',
  portuguese: 'pt', portugues: 'pt', 'português': 'pt',
  russian: 'ru', 'русский': 'ru',
  italian: 'it', italiano: 'it',
  korean: 'ko', '한국어': 'ko',
};

function detectLanguageFromInput(text: string): Language | null {
  const lower = text.toLowerCase();

  // 1. Explicit commands e.g. "answer in Bengali", "respond in Hindi", "tell me in Gujarati"
  const match = lower.match(/(?:answer|reply|respond|speak|talk|tell me|explain|write|continue)\s+(?:in|using|with|to)?\s+([a-zA-Z\u00C0-\u024F\u0600-\u06FF\u0900-\u0D7F]+)/i)
    || lower.match(/(?:in|auf|en|em)\s+([a-zA-Z\u00C0-\u024F]+)\s*(?:please|bitte|por favor|svp)?$/i)
    || lower.match(/([a-zA-Z\u00C0-\u024F\u0900-\u0D7F]+)\s*(?:में|তে|માં|இல்|లో|मध्ये|ದಲ್ಲಿ)\s*(?:बताओ|बोलो|उत्तर|सांगा|చెప్పండి|ತಿಳಿಸಿ|பதில்)/i);

  if (match) {
    const candidate = match[1].trim().toLowerCase();
    if (LANGUAGE_ALIASES[candidate]) {
      return LANGUAGE_ALIASES[candidate];
    }
  }

  // 2. Direct keyword check
  for (const [key, langCode] of Object.entries(LANGUAGE_ALIASES)) {
    if (new RegExp(`\\b${key}\\b`, 'i').test(lower)) {
      if (lower.includes('answer') || lower.includes('speak') || lower.includes('reply') || lower.includes('talk') || lower.includes('switch') || lower.includes('in') || lower.length <= 20) {
        return langCode;
      }
    }
  }

  // 3. Script range detection
  if (/[\u0A80-\u0AFF]/.test(text)) return 'gu'; // Gujarati
  if (/[\u0980-\u09FF]/.test(text)) return 'bn'; // Bengali
  if (/[\u0B80-\u0BFF]/.test(text)) return 'ta'; // Tamil
  if (/[\u0C00-\u0C7F]/.test(text)) return 'te'; // Telugu
  if (/[\u0C80-\u0CFF]/.test(text)) return 'kn'; // Kannada
  if (/[\u0600-\u06FF]/.test(text)) return 'ar'; // Arabic
  if (/[\u0400-\u04FF]/.test(text)) return 'ru'; // Russian Cyrillic
  if (/[\uAC00-\uD7AF\u1100-\u11FF]/.test(text)) return 'ko'; // Korean Hangul
  if (/[\u3040-\u309F\u30A0-\u30FF]/.test(text)) return 'ja'; // Japanese Hiragana/Katakana
  if (/[\u0900-\u097F]/.test(text)) {
    if (/(आहे|नाही|सांगा|मला|कसा|काय)/.test(text)) return 'mr'; // Marathi
    return 'hi'; // Hindi
  }
  if (/[\u4E00-\u9FFF]/.test(text)) return 'zh'; // Chinese Hanzi

  return null;
}

export function FloatingFinroqAgent() {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { language, activeLanguageMeta, t } = useI18n();

  const isGuestMode = !isAuthenticated || !pathname?.startsWith('/app');

  // Active language isolated to the model itself (does NOT change the entire site)
  const [activeChatLang, setActiveChatLang] = useState<Language>(language);
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [langSwitchNotice, setLangSwitchNotice] = useState<string | null>(null);

  // Sync with site language when user switches outside the modal
  useEffect(() => {
    setActiveChatLang(language);
  }, [language]);

  const currentChatMeta = SUPPORTED_LANGUAGES.find((l) => l.code === activeChatLang) || activeLanguageMeta;

  const [isOpen, setIsOpen] = useState(false);
  const [conversations, setConversations] = useState<AIConversationSummary[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<AIMessageItem[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Speech Recognition state
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const recognitionRef = useRef<any>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Check speech recognition support on client mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hasSpeech = 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;
      setSpeechSupported(hasSpeech);
    }
  }, []);

  // Auto-scroll messages
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading, isOpen]);

  // Load existing conversation on open if in-app authenticated mode
  useEffect(() => {
    if (isOpen && isAuthenticated && !isGuestMode && conversations.length === 0) {
      apiClient
        .listAIConversations()
        .then((res) => {
          const convs = res.data || [];
          setConversations(convs);
          if (convs.length > 0 && !currentConversationId) {
            setCurrentConversationId(convs[0].id);
            apiClient.getAIConversation(convs[0].id).then((detail) => {
              setMessages(detail.data.messages || []);
            });
          }
        })
        .catch(() => {});
    }
  }, [isOpen, isAuthenticated, isGuestMode]);

  // Speech Recognition toggle
  const toggleListening = () => {
    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
      return;
    }

    if (typeof window === 'undefined') return;
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setError('Voice recognition is not supported in this browser. Please use Google Chrome, Edge, or Safari.');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      // Wire Speech recognition locale directly to the user's selected language
      recognition.lang = currentChatMeta.speechLocale || 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
        setError(null);
      };

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          transcript += event.results[i][0].transcript;
        }
        if (transcript) {
          setInputMessage(transcript);
        }
      };

      recognition.onerror = (event: any) => {
        if (event.error === 'not-allowed') {
          setError('Microphone access was denied. Please allow microphone permissions.');
        } else if (event.error !== 'no-speech') {
          setError(`Voice input error: ${event.error}`);
        }
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      setError('Could not initialize microphone.');
      setIsListening(false);
    }
  };

  // Start fresh chat
  const handleStartNewConversation = async () => {
    if (isGuestMode) {
      setMessages([]);
      setError(null);
      textareaRef.current?.focus();
      return;
    }
    try {
      setError(null);
      const res = await apiClient.createAIConversation('New Analysis');
      const newConv = res.data;
      setConversations((prev) => [newConv, ...prev]);
      setCurrentConversationId(newConv.id);
      setMessages([]);
      textareaRef.current?.focus();
    } catch (err) {
      setError(extractErrorMessage(err, 'Failed to start a new chat.'));
    }
  };

  // Send message
  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || isLoading) return;

    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }

    setError(null);
    setInputMessage('');

    // Dynamic Language Detection: check if user explicitly requested a language or typed in native script
    const detected = detectLanguageFromInput(text);
    let effectiveLang = activeChatLang;

    if (detected && detected !== activeChatLang) {
      effectiveLang = detected;
      setActiveChatLang(detected);
      // NOTE: Intentionally do NOT call setLanguage — site language stays intact while model adapts!
      const targetMeta = SUPPORTED_LANGUAGES.find((l) => l.code === detected);
      if (targetMeta) {
        setLangSwitchNotice(`Assistant answering in ${targetMeta.nativeName} (${targetMeta.name}) · Site remains unchanged`);
        setTimeout(() => setLangSwitchNotice(null), 6000);
      }
    }

    const tempUserMsg: AIMessageItem = {
      id: Date.now(),
      role: 'user',
      content: text,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);
    setIsLoading(true);

    if (isGuestMode) {
      // Public Landing Guide Mode (Strictly zero user ledger access)
      try {
        const res = await apiClient.chatPublicAI({
          message: text,
          language: effectiveLang,
        });
        const pubData: PublicAIChatResponse = res.data;
        const assistantMsg: AIMessageItem = {
          id: Date.now() + 1,
          role: 'assistant',
          content: pubData.message,
          is_live_ai: false,
          model_used: 'finroq-static-guide',
          created_at: pubData.created_at || new Date().toISOString(),
        };
        setMessages((prev) => [...prev, assistantMsg]);
      } catch (err) {
        const errMsg = extractErrorMessage(err, 'Could not retrieve public assistance. Please try again.');
        setError(errMsg);
      } finally {
        setIsLoading(false);
      }
    } else {
      // In-App Ledger Intelligence Mode
      try {
        const res = await apiClient.chatAI({
          message: text,
          conversation_id: currentConversationId,
          language: effectiveLang,
        });

        const data: AIChatResponse = res.data;
        setCurrentConversationId(data.conversation_id);

        const assistantMsg: AIMessageItem = {
          id: Date.now() + 1,
          role: 'assistant',
          content: data.message,
          structured_data: data.structured_data,
          is_live_ai: data.is_live_ai,
          model_used: data.model_used,
          created_at: data.created_at || new Date().toISOString(),
        };
        setMessages((prev) => [...prev, assistantMsg]);

        // Refresh list
        apiClient.listAIConversations().then((r) => setConversations(r.data || [])).catch(() => {});
      } catch (err) {
        const errMsg = extractErrorMessage(err, 'Failed to complete analysis. Please try again.');
        setError(errMsg);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Hide widget if on the dedicated full-page AI screen
  if (pathname === '/app/ai-assistant') {
    return null;
  }

  const suggestedQuestions = isGuestMode
    ? PUBLIC_SUGGESTED_QUESTIONS[activeChatLang] || PUBLIC_SUGGESTED_QUESTIONS['en']
    : APP_SUGGESTED_QUESTIONS[activeChatLang] || APP_SUGGESTED_QUESTIONS['en'];

  return (
    <>
      {/* ─────────────────────────────────────────────────────────────
          1. COLLAPSED FLOATING TRIGGER BUTTON (BOTTOM RIGHT)
      ───────────────────────────────────────────────────────────── */}
      {!isOpen && (
        <div className="fixed bottom-6 right-6 z-50 animate-in fade-in zoom-in-95 duration-200">
          <button
            onClick={() => setIsOpen(true)}
            className="group relative flex items-center gap-2.5 px-4 py-3 sm:px-5 sm:py-3.5 rounded-full bg-[#173F2B] text-white dark:bg-emerald-600 hover:bg-[#102F21] dark:hover:bg-emerald-700 shadow-2xl hover:shadow-emerald-900/25 hover:scale-105 active:scale-95 transition-all duration-200 border border-emerald-400/30 cursor-pointer focus:outline-none focus:ring-4 focus:ring-emerald-500/20"
            aria-label="Open Finroq AI"
          >
            {/* Pulsing online badge */}
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400" />
            </span>

            {/* Sparkles Emblem */}
            <Sparkles className="w-5 h-5 text-emerald-300 group-hover:rotate-12 transition-transform duration-200" />

            {/* Label & Active Language Badge */}
            <div className="flex items-center gap-1.5 font-display font-bold text-sm tracking-tight">
              <span>{isGuestMode ? 'Finroq Guide' : 'Finroq AI'}</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 font-bold">
                {currentChatMeta.badge}
              </span>
            </div>
          </button>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          2. EXPANDED FLOATING MESSAGE PANEL
      ───────────────────────────────────────────────────────────── */}
      {isOpen && (
        <div
          className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 w-[94vw] sm:w-[440px] h-[610px] max-h-[85vh] flex flex-col bg-white dark:bg-[#16251E] border border-[#CBD5CB] dark:border-[#2A3D33] rounded-3xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-6 duration-200"
          data-lenis-prevent
        >
          {/* Header */}
          <div className="px-4 py-3 border-b border-[var(--line)] bg-[#F8FAF8] dark:bg-[#14231B] flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-[var(--soft)] text-[var(--accent)] flex items-center justify-center font-bold shrink-0">
                <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-display font-bold text-sm text-[#173F2B] dark:text-slate-100 truncate">
                    {isGuestMode ? 'Finroq Guide' : 'Finroq AI'}
                  </span>
                  <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded-full font-bold border flex items-center gap-1 ${
                    !isGuestMode && apiClient.isDemoSession()
                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                      : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                  } shrink-0`}>
                    {isGuestMode ? (
                      <>
                        <ShieldCheck className="w-2.5 h-2.5 text-emerald-600" />
                        Guide
                      </>
                    ) : apiClient.isDemoSession() ? (
                      'Demo'
                    ) : (
                      'Account'
                    )}
                  </span>
                </div>
                <p className="text-[10px] text-[var(--muted)] font-medium truncate">
                  {isGuestMode
                    ? `${currentChatMeta.nativeName} (${currentChatMeta.name})`
                    : `Financial intelligence in ${currentChatMeta.nativeName}`}
                </p>
              </div>
            </div>

            {/* Header Action Controls */}
            <div className="flex items-center gap-1.5 shrink-0">
              {/* Language Selector Dropdown directly in the modal */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowLangMenu(!showLangMenu)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[10px] font-bold border border-[#CBD5CB] dark:border-[#2A3D33] hover:border-emerald-600 bg-white dark:bg-[#1A2C22] text-[#173F2B] dark:text-emerald-300 transition-colors shadow-2xs cursor-pointer focus:outline-none"
                  title="Change language"
                  aria-label="Select Assistant Language"
                >
                  <Globe className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                  <span className="font-semibold">{currentChatMeta.badge}</span>
                  <ChevronDown className={`w-2.5 h-2.5 text-[var(--muted)] transition-transform duration-150 ${showLangMenu ? 'rotate-180' : ''}`} />
                </button>

                {showLangMenu && (
                  <div className="absolute right-0 top-full mt-1.5 w-48 max-h-60 overflow-y-auto bg-white dark:bg-[#16251E] border border-[#CBD5CB] dark:border-[#2A3D33] rounded-2xl shadow-2xl z-50 p-1.5 space-y-0.5 animate-in fade-in zoom-in-95 duration-150">
                    <div className="px-2 py-1 text-[10px] font-mono uppercase text-[var(--muted)] font-bold">
                      18 Languages
                    </div>
                    {SUPPORTED_LANGUAGES.map((item) => (
                      <button
                        key={item.code}
                        type="button"
                        onClick={() => {
                          setActiveChatLang(item.code);
                          // NOTE: Intentionally do NOT call setLanguage — site language stays intact while model adapts!
                          setLangSwitchNotice(`Assistant set to ${item.nativeName} (${item.name}) · Site remains unchanged`);
                          setTimeout(() => setLangSwitchNotice(null), 5000);
                          setShowLangMenu(false);
                        }}
                        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                          item.code === activeChatLang
                            ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-900 dark:text-emerald-200 font-bold'
                            : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200'
                        }`}
                      >
                        <span className="truncate">{item.nativeName}</span>
                        <span className="font-mono text-[9px] uppercase font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 shrink-0">
                          {item.badge}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button
                onClick={handleStartNewConversation}
                className="p-1.5 rounded-lg hover:bg-[var(--line)] text-[var(--muted)] hover:text-[var(--ink)] transition-colors cursor-pointer"
                title="New Chat"
              >
                <Plus className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg hover:bg-[var(--line)] text-[var(--muted)] hover:text-[var(--ink)] transition-colors cursor-pointer"
                title="Minimize"
                aria-label="Close"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Guest Mode Banner: Privacy & Scope */}
          {isGuestMode && (
            <div className="px-3.5 py-2 bg-emerald-50/80 dark:bg-emerald-950/40 border-b border-emerald-100 dark:border-emerald-900/60 flex items-center justify-between text-[11px] text-emerald-900 dark:text-emerald-200">
              <div className="flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span className="font-medium">Public mode: Zero user data access.</span>
              </div>
              <button
                onClick={() => router.push('/auth/sign-in')}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-700 text-white font-semibold text-[10px] hover:bg-emerald-800 transition-colors"
              >
                Sign In
                <ArrowRight className="w-2.5 h-2.5" />
              </button>
            </div>
          )}

          {/* Language Switch Notification Notice */}
          {langSwitchNotice && (
            <div className="px-3.5 py-1.5 bg-emerald-100 dark:bg-emerald-950/90 border-b border-emerald-200 dark:border-emerald-800 text-[11px] font-bold text-emerald-900 dark:text-emerald-200 flex items-center justify-between animate-in fade-in slide-in-from-top-1 duration-150">
              <div className="flex items-center gap-1.5">
                <Globe className="w-3 h-3 text-emerald-700 dark:text-emerald-400 shrink-0" />
                <span>{langSwitchNotice}</span>
              </div>
              <span className="text-[10px] font-normal text-emerald-700 dark:text-emerald-400">Adapting live</span>
            </div>
          )}

          {/* Conversation Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 text-xs">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col justify-center items-center text-center py-6 space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-[var(--soft)] text-[var(--accent)] flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-display text-base font-bold text-[#173F2B] dark:text-slate-100">
                    {isGuestMode ? 'Welcome to Finroq!' : 'Your finances, understood.'}
                  </h4>
                  <p className="text-[11px] text-[#4D5D51] dark:text-slate-300 max-w-xs leading-relaxed">
                    {isGuestMode
                      ? `Ask me anything about our 13 features, bank statement imports, and zero-trust privacy in ${currentChatMeta.nativeName}.`
                      : `Type or tap the microphone to speak in ${currentChatMeta.nativeName}. I answer simply and to the point using your ledger.`}
                  </p>
                </div>

                <div className="w-full space-y-1.5 pt-1 text-left">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--muted)] font-bold block text-center">
                    Quick Suggestions ({currentChatMeta.nativeName})
                  </span>
                  <div className="flex flex-col gap-1.5">
                    {suggestedQuestions.map((q, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSendMessage(q)}
                        className="w-full p-2 rounded-xl border border-[#CBD5CB] dark:border-[#2A3D33] bg-white dark:bg-[#1A2C22] hover:border-[#173F2B] dark:hover:border-emerald-500 hover:bg-[var(--soft)] text-[11px] font-medium text-[#173F2B] dark:text-slate-200 text-left flex items-center justify-between group transition-all cursor-pointer"
                      >
                        <span className="truncate">{q}</span>
                        <ArrowRight className="w-3 h-3 text-[var(--accent)] opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all shrink-0" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              messages.map((m) => {
                const isUser = m.role === 'user';
                const prov = !isUser ? resolveAIProvenance(m, apiClient.isDemoSession(), isGuestMode) : null;
                return (
                  <div key={m.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-[88%] p-3.5 rounded-2xl space-y-2 leading-relaxed break-words [overflow-wrap:anywhere] overflow-hidden ${
                        isUser
                          ? 'bg-[#173F2B] text-white dark:bg-emerald-700 rounded-tr-xs'
                          : 'bg-[#F8FAF8] dark:bg-[#14231B] border border-[#CBD5CB]/60 dark:border-[#2A3D33] text-[#173F2B] dark:text-slate-100 rounded-tl-xs shadow-2xs'
                      }`}
                    >
                      {!isUser && prov && (
                        <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-[var(--line)]/50 text-[10px] font-mono text-[var(--muted)] flex-wrap gap-1">
                          <div className="flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-[var(--accent)]" />
                            <span>{isGuestMode ? 'Finroq Guide' : 'Finroq AI'}</span>
                          </div>
                          <div className="flex items-center gap-1 flex-wrap">
                            {/* Execution Type Badge */}
                            {prov.isLiveAI ? (
                              <span className="px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold border border-emerald-200 dark:border-emerald-800">
                                {prov.executionBadgeLabel}
                              </span>
                            ) : prov.isDeterministic ? (
                              <span className="px-1.5 py-0.5 rounded-full bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300 font-bold border border-sky-200 dark:border-sky-800">
                                {prov.executionBadgeLabel}
                              </span>
                            ) : prov.isSimulated ? (
                              <span className="px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 font-bold border border-amber-200 dark:border-amber-800">
                                {prov.executionBadgeLabel}
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 font-bold border border-slate-200 dark:border-slate-700">
                                {prov.executionBadgeLabel}
                              </span>
                            )}

                            {/* Data Provenance Badge */}
                            {prov.provenanceBadgeLabel && (
                              <span className={`px-1.5 py-0.5 rounded-full font-bold border ${
                                prov.dataProvenance === 'verified_ledger'
                                  ? 'bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300 border-teal-200 dark:border-teal-800'
                                  : 'bg-amber-50 text-amber-900 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                              }`}>
                                {prov.provenanceBadgeLabel}
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                      <div className="whitespace-pre-wrap break-words [overflow-wrap:anywhere]">{m.content}</div>

                      {/* Render Structured Results Card if Present */}
                      {m.structured_data && (
                        <div className="pt-1">
                          <StructuredResults data={m.structured_data} />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}

            {/* Thinking indicator */}
            {isLoading && (
              <div className="flex items-start">
                <div className="p-3 rounded-2xl bg-[#F4F7F3] dark:bg-[#14231B] border border-[#DCE4DC] dark:border-[#2A3D33] rounded-bl-xs flex items-center gap-2 text-xs text-[var(--muted)]">
                  <div className="w-3.5 h-3.5 border-2 border-[var(--accent)]/30 border-t-[var(--accent)] rounded-full animate-spin" />
                  <span className="font-mono text-[11px]">
                    {isGuestMode
                      ? `Retrieving guidance in ${currentChatMeta.nativeName}...`
                      : apiClient.isDemoSession()
                      ? 'Preparing demo financial response...'
                      : 'Processing financial analysis...'}
                  </span>
                </div>
              </div>
            )}

            {/* Error notice */}
            {error && (
              <div className="p-3 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-[11px] text-red-800 dark:text-red-300 flex items-start gap-2">
                <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-red-600" />
                <div className="flex-1 space-y-1">
                  <p className="font-medium">{error}</p>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Message Bar: Type + Speak */}
          <div className="p-3 border-t border-[var(--line)] bg-[#F8FAF8] dark:bg-[#14231B]">
            <div className={`relative flex items-center bg-white dark:bg-[#16251E] border ${isListening ? 'border-red-500 ring-2 ring-red-500/20' : 'border-[#CBD5CB] dark:border-[#2A3D33] focus-within:border-[#173F2B] dark:focus-within:border-emerald-500'} rounded-2xl shadow-xs transition-all`}>
              <textarea
                ref={textareaRef}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  isListening
                    ? `Listening in ${currentChatMeta.nativeName}...`
                    : isGuestMode
                    ? `Ask in ${currentChatMeta.nativeName} (e.g. "answer in Bengali")...`
                    : `Ask or speak in ${currentChatMeta.nativeName}...`
                }
                rows={1}
                disabled={isLoading}
                className="w-full resize-none py-2.5 pl-3.5 pr-2 text-xs bg-transparent text-[#173F2B] dark:text-slate-100 placeholder:text-[var(--muted)] focus:outline-none"
              />

              <div className="flex items-center gap-1 pr-2 shrink-0">
                {/* Microphone / Speech button */}
                <button
                  type="button"
                  onClick={toggleListening}
                  className={`p-2 rounded-xl transition-all ${
                    isListening
                      ? 'bg-red-500 text-white animate-pulse shadow-md'
                      : 'text-[#173F2B] dark:text-slate-200 hover:bg-[var(--soft)]'
                  }`}
                  title={isListening ? 'Stop listening' : `Speak in ${currentChatMeta.name}`}
                  aria-label="Voice input"
                >
                  {isListening ? (
                    <MicOffIcon className="w-4 h-4" />
                  ) : (
                    <MicIcon className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                  )}
                </button>

                {/* Send button */}
                <button
                  type="button"
                  onClick={() => handleSendMessage()}
                  disabled={!inputMessage.trim() || isLoading}
                  className="p-2 rounded-xl bg-[#173F2B] text-white dark:bg-emerald-600 hover:bg-[#102F21] disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
                  aria-label="Send message"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between mt-1.5 px-1 text-[9px] font-mono text-[var(--muted)]">
              <span>
                {isListening
                  ? `🎙️ Listening (${currentChatMeta.speechLocale})...`
                  : `Language: ${currentChatMeta.nativeName} (${currentChatMeta.badge})`}
              </span>
              <span>{isGuestMode ? 'Zero-Trust · Private & Isolated' : 'Exact Decimal NUMERIC(14,2)'}</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
