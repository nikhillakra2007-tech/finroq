'use client';

import React, { useState, useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useI18n } from '@/lib/i18n-context';
import { apiClient, extractErrorMessage } from '@/lib/api-client';
import { AIChatResponse, AIConversationSummary, AIMessageItem, PublicAIChatResponse } from '@/lib/api-types';
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

const PUBLIC_SUGGESTED_QUESTIONS: Record<string, string[]> = {
  en: [
    'What features does Finroq offer?',
    'How does Finroq protect my financial privacy?',
    'How does budget and leak tracking work?',
    'What languages are supported on this site?',
  ],
  hi: [
    'फिनरॉक कौन-कौन सी सुविधाएं प्रदान करता है?',
    'फिनरॉक मेरी वित्तीय गोपनीयता कैसे सुरक्षित रखता है?',
    'बजट और खर्च की बचत कैसे काम करती है?',
    'इस साइट पर कौन-कौन सी भाषाएं उपलब्ध हैं?',
  ],
  es: [
    '¿Qué funciones ofrece Finroq?',
    '¿Cómo protege Finroq mi privacidad financiera?',
    '¿Cómo funciona el control de presupuestos y gastos?',
    '¿Qué idiomas están disponibles?',
  ],
};

const APP_SUGGESTED_QUESTIONS = [
  'Analyze my spending this month',
  'Where can I save more?',
  'Can I afford a ₹15,000 purchase?',
  'Explain my budget status',
  'What bills are coming up?',
];

export function FloatingFinroqAgent() {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { language, activeLanguageMeta, t } = useI18n();

  const isGuestMode = !isAuthenticated || !pathname?.startsWith('/app');

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
      recognition.lang = activeLanguageMeta.speechLocale || 'en-US';

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
          language,
        });
        const pubData: PublicAIChatResponse = res.data;
        const assistantMsg: AIMessageItem = {
          id: Date.now() + 1,
          role: 'assistant',
          content: pubData.message,
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
          language,
        });

        const data: AIChatResponse = res.data;
        setCurrentConversationId(data.conversation_id);

        const assistantMsg: AIMessageItem = {
          id: Date.now() + 1,
          role: 'assistant',
          content: data.message,
          structured_data: data.structured_data,
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
    ? PUBLIC_SUGGESTED_QUESTIONS[language] || PUBLIC_SUGGESTED_QUESTIONS['en']
    : APP_SUGGESTED_QUESTIONS;

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
                {activeLanguageMeta.badge}
              </span>
            </div>
          </button>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          2. EXPANDED FLOATING MESSAGE PANEL
      ───────────────────────────────────────────────────────────── */}
      {isOpen && (
        <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 w-[94vw] sm:w-[430px] h-[600px] max-h-[85vh] flex flex-col bg-white dark:bg-[#16251E] border border-[#CBD5CB] dark:border-[#2A3D33] rounded-3xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-6 duration-200">
          {/* Header */}
          <div className="px-4 py-3 border-b border-[var(--line)] bg-[#F8FAF8] dark:bg-[#14231B] flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[var(--soft)] text-[var(--accent)] flex items-center justify-center font-bold">
                <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-display font-bold text-sm text-[#173F2B] dark:text-slate-100">
                    {isGuestMode ? 'Finroq Guide' : 'Finroq AI'}
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full font-bold border flex items-center gap-1 bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800">
                    {isGuestMode ? (
                      <>
                        <ShieldCheck className="w-3 h-3 text-emerald-600" />
                        Public Guide
                      </>
                    ) : (
                      'Live Ledger'
                    )}
                  </span>
                </div>
                <p className="text-[10px] text-[var(--muted)] font-medium">
                  {isGuestMode
                    ? `Public assistance in ${activeLanguageMeta.nativeName} (${activeLanguageMeta.name})`
                    : `Private financial intelligence in ${activeLanguageMeta.nativeName}`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={handleStartNewConversation}
                className="p-1.5 rounded-lg hover:bg-[var(--line)] text-[var(--muted)] hover:text-[var(--ink)] transition-colors"
                title="New Chat"
              >
                <Plus className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg hover:bg-[var(--line)] text-[var(--muted)] hover:text-[var(--ink)] transition-colors"
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
                      ? `Ask me anything about our 12 features, bank statement imports, and zero-trust privacy in ${activeLanguageMeta.nativeName}.`
                      : `Type or tap the microphone to speak in ${activeLanguageMeta.nativeName}. I answer simply and to the point using your ledger.`}
                  </p>
                </div>

                <div className="w-full space-y-1.5 pt-1 text-left">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--muted)] font-bold block text-center">
                    Quick Suggestions
                  </span>
                  <div className="flex flex-col gap-1.5">
                    {suggestedQuestions.map((q, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSendMessage(q)}
                        className="w-full p-2 rounded-xl border border-[#CBD5CB] dark:border-[#2A3D33] bg-white dark:bg-[#1A2C22] hover:border-[#173F2B] dark:hover:border-emerald-500 hover:bg-[var(--soft)] text-[11px] font-medium text-[#173F2B] dark:text-slate-200 text-left flex items-center justify-between group transition-all"
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
                return (
                  <div key={m.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-[88%] p-3.5 rounded-2xl space-y-2 leading-relaxed break-words [overflow-wrap:anywhere] overflow-hidden ${
                        isUser
                          ? 'bg-[#173F2B] text-white dark:bg-emerald-700 rounded-tr-xs'
                          : 'bg-[#F8FAF8] dark:bg-[#14231B] border border-[#CBD5CB]/60 dark:border-[#2A3D33] text-[#173F2B] dark:text-slate-100 rounded-tl-xs shadow-2xs'
                      }`}
                    >
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
                    {isGuestMode ? 'Retrieving guidance...' : 'Computing verified ledger data...'}
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
                    ? `Listening in ${activeLanguageMeta.nativeName}...`
                    : isGuestMode
                    ? `Ask about Finroq in ${activeLanguageMeta.nativeName}...`
                    : `Ask or speak in ${activeLanguageMeta.nativeName}...`
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
                  title={isListening ? 'Stop listening' : `Speak in ${activeLanguageMeta.name}`}
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
                  className="p-2 rounded-xl bg-[#173F2B] text-white dark:bg-emerald-600 hover:bg-[#102F21] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  aria-label="Send message"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between mt-1.5 px-1 text-[9px] font-mono text-[var(--muted)]">
              <span>
                {isListening
                  ? `🎙️ Listening (${activeLanguageMeta.speechLocale})...`
                  : `Language: ${activeLanguageMeta.nativeName}`}
              </span>
              <span>{isGuestMode ? 'Zero-Trust · Private & Isolated' : 'Exact Decimal NUMERIC(14,2)'}</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
