'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useI18n } from '@/lib/i18n-context';
import { apiClient, extractErrorMessage } from '@/lib/api-client';
import { AIChatResponse, AIConversationSummary, AIMessageItem } from '@/lib/api-types';
import { resolveAIProvenance } from '@/lib/provenance';
import { StructuredResults } from './StructuredResults';
import {
  Sparkles,
  Send,
  Plus,
  RefreshCw,
  AlertCircle,
  Layers,
  Trash2,
  ChevronDown,
  ArrowRight,
  ShieldCheck,
  Check,
  X,
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

interface FinancialAgentChatProps {
  initialPrompt?: string;
  isCompact?: boolean;
}

const SUGGESTED_QUESTIONS = [
  'Analyze my spending this month',
  'Where can I save more?',
  'Can I afford a ₹15,000 purchase?',
  'Explain my budget status',
  'What bills are coming up?',
];

export function FinancialAgentChat({ initialPrompt, isCompact = false }: FinancialAgentChatProps) {
  const { language, activeLanguageMeta } = useI18n();
  const [conversations, setConversations] = useState<AIConversationSummary[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<AIMessageItem[]>([]);
  const [inputMessage, setInputMessage] = useState(initialPrompt || '');
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<any>(null);

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
      setError('Voice recognition is not supported in this browser. Please use Chrome, Edge, or Safari.');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
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
          setError('Microphone permission denied.');
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
    } catch {
      setError('Failed to start voice recognition.');
      setIsListening(false);
    }
  };

  // Auto-scroll to latest message
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Load conversations on mount
  useEffect(() => {
    async function loadConversations() {
      try {
        setIsInitializing(true);
        const res = await apiClient.listAIConversations();
        const convs = res.data || [];
        setConversations(convs);
        if (convs.length > 0) {
          setCurrentConversationId(convs[0].id);
          // Load messages of the first conversation
          const detailRes = await apiClient.getAIConversation(convs[0].id);
          setMessages(detailRes.data.messages || []);
        }
      } catch (err) {
        // Safe initial state
      } finally {
        setIsInitializing(false);
      }
    }
    loadConversations();
  }, []);

  useEffect(() => {
    if (initialPrompt && initialPrompt.trim()) {
      setInputMessage(initialPrompt.trim());
      textareaRef.current?.focus();
    }
  }, [initialPrompt]);

  // Handle switching conversations
  const handleSelectConversation = async (convId: string) => {
    try {
      setIsLoading(true);
      setError(null);
      setCurrentConversationId(convId);
      setIsHistoryOpen(false);
      const res = await apiClient.getAIConversation(convId);
      setMessages(res.data.messages || []);
    } catch (err) {
      setError(extractErrorMessage(err, 'Failed to load conversation history.'));
    } finally {
      setIsLoading(false);
    }
  };

  // Start new empty conversation
  const handleStartNewConversation = async () => {
    try {
      setError(null);
      const res = await apiClient.createAIConversation('New Analysis');
      const newConv = res.data;
      setConversations((prev) => [newConv, ...prev]);
      setCurrentConversationId(newConv.id);
      setMessages([]);
      setIsHistoryOpen(false);
      textareaRef.current?.focus();
    } catch (err) {
      setError(extractErrorMessage(err, 'Failed to start a new conversation.'));
    }
  };

  // Delete conversation
  const handleDeleteConversation = async (convId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await apiClient.deleteAIConversation(convId);
      setConversations((prev) => prev.filter((c) => c.id !== convId));
      if (currentConversationId === convId) {
        setCurrentConversationId(null);
        setMessages([]);
      }
    } catch (err) {
      setError(extractErrorMessage(err, 'Failed to delete conversation.'));
    }
  };

  // Send message
  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || isLoading) return;

    setError(null);
    setInputMessage('');

    // Optimistically append user message
    const tempUserMsg: AIMessageItem = {
      id: Date.now(),
      role: 'user',
      content: text,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);
    setIsLoading(true);

    try {
      const res = await apiClient.chatAI({
        message: text,
        conversation_id: currentConversationId,
        language,
      });

      const data: AIChatResponse = res.data;
      setCurrentConversationId(data.conversation_id);

      // Append assistant message
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

      // Refresh conversations list in background
      apiClient.listAIConversations().then((r) => setConversations(r.data || [])).catch(() => {});
    } catch (err) {
      const errMsg = extractErrorMessage(err, 'Failed to generate financial analysis. Please try again.');
      setError(errMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className={`w-full flex flex-col bg-white dark:bg-[#16251E] border border-[#CBD5CB] dark:border-[#2A3D33] rounded-3xl shadow-sm overflow-hidden ${isCompact ? 'h-[540px]' : 'h-[680px]'}`}>
      {/* Top Header / Context Switcher */}
      <div className="px-5 py-3.5 border-b border-[var(--line)] bg-[#F8FAF8] dark:bg-[#14231B] flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[var(--soft)] text-[var(--accent)] flex items-center justify-center font-bold">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-display font-bold text-sm text-[#173F2B] dark:text-slate-100">
                Finroq AI
              </span>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold border ${
                apiClient.isDemoSession()
                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                  : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
              }`}>
                {apiClient.isDemoSession() ? 'Demo Session' : 'Account Workspace'}
              </span>
            </div>
            <p className="text-[11px] text-[var(--muted)] font-medium">Personal Financial Intelligence Agent</p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {conversations.length > 0 && (
            <div className="relative">
              <button
                onClick={() => setIsHistoryOpen((prev) => !prev)}
                className="px-2.5 py-1.5 rounded-xl border border-[var(--line)] bg-white dark:bg-[#1A2C22] text-xs font-semibold text-[#173F2B] dark:text-slate-200 hover:border-[var(--ink)] flex items-center gap-1.5 transition-colors"
                title="View Conversation History"
              >
                <Layers className="w-3.5 h-3.5 text-[var(--accent)]" />
                <span className="hidden sm:inline">History</span>
                <ChevronDown className={`w-3 h-3 text-[var(--muted)] transition-transform ${isHistoryOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* History Dropdown Menu */}
              {isHistoryOpen && (
                <div className="absolute right-0 top-full mt-1.5 w-64 max-h-72 overflow-y-auto rounded-2xl bg-white dark:bg-[#16251E] border border-[#CBD5CB] dark:border-[#2A3D33] shadow-xl z-50 p-2 space-y-1">
                  <div className="px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider font-bold text-[var(--muted)]">
                    Saved Analyses
                  </div>
                  {conversations.map((c) => (
                    <div
                      key={c.id}
                      onClick={() => handleSelectConversation(c.id)}
                      className={`group flex items-center justify-between p-2 rounded-xl text-xs cursor-pointer transition-colors ${
                        currentConversationId === c.id
                          ? 'bg-[#173F2B] text-white font-bold'
                          : 'hover:bg-[var(--soft)] text-[#173F2B] dark:text-slate-200'
                      }`}
                    >
                      <span className="truncate pr-2">{c.title}</span>
                      <button
                        onClick={(e) => handleDeleteConversation(c.id, e)}
                        className={`p-1 rounded-md opacity-0 group-hover:opacity-100 hover:text-red-500 transition-opacity ${
                          currentConversationId === c.id ? 'text-white/80 hover:text-white' : 'text-[var(--muted)]'
                        }`}
                        title="Delete conversation"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <button
            onClick={handleStartNewConversation}
            className="px-3 py-1.5 rounded-xl bg-[#173F2B] text-white dark:bg-emerald-600 hover:bg-[#102F21] text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
            title="Start New Conversation"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">New Chat</span>
          </button>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
        {messages.length === 0 ? (
          /* Welcome State */
          <div className="h-full flex flex-col justify-center items-center text-center max-w-md mx-auto py-8 space-y-6">
            <div className="w-14 h-14 rounded-3xl bg-[var(--soft)] text-[var(--accent)] flex items-center justify-center shadow-inner">
              <Sparkles className="w-7 h-7" />
            </div>

            <div className="space-y-2">
              <h3 className="font-display text-2xl font-bold tracking-tight text-[#173F2B] dark:text-slate-100">
                Your finances, understood.
              </h3>
              <p className="text-xs sm:text-sm text-[#4D5D51] dark:text-slate-300 leading-relaxed">
                Ask Finroq AI about your spending, budgets, upcoming bills, or financial goals.
                All calculations are performed deterministically against your verified records.
              </p>
            </div>

            {/* Quick Suggestion Pills */}
            <div className="w-full space-y-2 pt-2 text-left">
              <span className="text-[11px] font-mono uppercase tracking-wider text-[var(--muted)] font-bold block text-center">
                Suggested Financial Questions
              </span>
              <div className="flex flex-col gap-2">
                {SUGGESTED_QUESTIONS.map((q, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(q)}
                    className="w-full p-2.5 rounded-xl border border-[#CBD5CB] dark:border-[#2A3D33] bg-white dark:bg-[#1A2C22] hover:border-[#173F2B] dark:hover:border-emerald-500 hover:bg-[var(--soft)] text-xs font-medium text-[#173F2B] dark:text-slate-200 text-left flex items-center justify-between group transition-all"
                  >
                    <span>{q}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-[var(--accent)] opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* Message List */
          messages.map((m) => {
            const isUser = m.role === 'user';
            const prov = !isUser ? resolveAIProvenance(m, apiClient.isDemoSession(), false) : null;
            return (
              <div
                key={m.id}
                className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} max-w-full`}
              >
                <div
                  className={`max-w-[85%] sm:max-w-[78%] rounded-2xl p-4 text-xs sm:text-sm leading-relaxed ${
                    isUser
                      ? 'bg-[#173F2B] text-white font-medium rounded-br-xs shadow-xs'
                      : 'bg-[#F4F7F3] dark:bg-[#14231B] text-[#173F2B] dark:text-slate-100 border border-[#DCE4DC] dark:border-[#2A3D33] rounded-bl-xs shadow-xs'
                  }`}
                >
                  {!isUser && prov && (
                    <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-[var(--line)]/50 text-[10px] font-mono text-[var(--muted)] flex-wrap gap-1">
                      <div className="flex items-center gap-1.5">
                        <Sparkles className="w-3 h-3 text-[var(--accent)]" />
                        <span>Finroq AI</span>
                      </div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {/* Execution Status Badge */}
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

                  <div className="whitespace-pre-wrap">{m.content}</div>

                  {/* Render Structured Results Card if Present */}
                  {m.structured_data && (
                    <StructuredResults data={m.structured_data} />
                  )}
                </div>
              </div>
            );
          })
        )}

        {/* Loading / Thinking State */}
        {isLoading && (
          <div className="flex items-start">
            <div className="p-3.5 rounded-2xl bg-[#F4F7F3] dark:bg-[#14231B] border border-[#DCE4DC] dark:border-[#2A3D33] rounded-bl-xs flex items-center gap-2.5 text-xs text-[var(--muted)]">
              <div className="w-4 h-4 border-2 border-[var(--accent)]/30 border-t-[var(--accent)] rounded-full animate-spin" />
              <span className="font-mono text-xs">
                {apiClient.isDemoSession() ? 'Preparing demo financial analysis...' : 'Processing financial analysis...'}
              </span>
            </div>
          </div>
        )}

        {/* Error Notification */}
        {error && (
          <div className="p-3.5 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-xs text-red-800 dark:text-red-300 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
            <div className="flex-1 space-y-1">
              <p className="font-semibold">{error}</p>
              <button
                onClick={() => handleSendMessage()}
                className="text-xs font-bold underline hover:no-underline text-red-700 dark:text-red-400"
              >
                Try again
              </button>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar */}
      <div className="p-3 sm:p-4 border-t border-[var(--line)] bg-[#F8FAF8] dark:bg-[#14231B]">
        <div className={`relative flex items-center bg-white dark:bg-[#16251E] border ${isListening ? 'border-red-500 ring-2 ring-red-500/20' : 'border-[#CBD5CB] dark:border-[#2A3D33] focus-within:border-[#173F2B] dark:focus-within:border-emerald-500'} rounded-2xl shadow-xs transition-all`}>
          <textarea
            ref={textareaRef}
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isListening ? 'Listening... Speak your financial query' : 'Ask about your spending, budgets, savings, or purchase affordability...'}
            rows={1}
            disabled={isLoading}
            className="w-full resize-none py-3 px-4 text-xs sm:text-sm bg-transparent text-[#173F2B] dark:text-slate-100 placeholder:text-[var(--muted)] focus:outline-none"
          />
          <div className="flex items-center gap-1 mr-2 shrink-0">
            <button
              type="button"
              onClick={toggleListening}
              className={`p-2 rounded-xl transition-all ${
                isListening
                  ? 'bg-red-500 text-white animate-pulse shadow-md'
                  : 'text-[#173F2B] dark:text-slate-200 hover:bg-[var(--soft)]'
              }`}
              title={isListening ? 'Stop listening' : 'Speak (Voice input)'}
              aria-label="Voice input"
            >
              {isListening ? (
                <MicOffIcon className="w-4 h-4" />
              ) : (
                <MicIcon className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
              )}
            </button>
            <button
              onClick={() => handleSendMessage()}
              disabled={!inputMessage.trim() || isLoading}
              className="p-2 rounded-xl bg-[#173F2B] text-white hover:bg-[#102F21] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              aria-label="Send message"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
        <div className="flex items-center justify-between mt-2 px-1 text-[10px] font-mono text-[var(--muted)]">
          <span>{isListening ? '🎙️ Listening to microphone...' : 'Type or click 🎙️ to speak'}</span>
          <span>Verified math • Zero hallucinations</span>
        </div>
      </div>
    </div>
  );
}
