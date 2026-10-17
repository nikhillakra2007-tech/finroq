'use client';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { ModuleShell } from '@/components/layout/ModuleShell';
import { FinancialAgentChat } from '@/features/ai/FinancialAgentChat';
import { useI18n } from '@/lib/i18n-context';

function AIAssistantChatContainer() {
  const searchParams = useSearchParams();
  const initialPrompt = searchParams.get('q') || undefined;

  return (
    <div className="max-w-4xl mx-auto">
      <FinancialAgentChat isCompact={false} initialPrompt={initialPrompt} />
    </div>
  );
}

export default function AIAssistantPage() {
  const { language } = useI18n();

  return (
    <ModuleShell
      title={language === 'hi' ? 'फिनरॉक एआई वित्तीय सहायक' : 'Finroq AI Intelligence'}
      category={language === 'hi' ? 'वित्तीय बुद्धिमत्ता' : 'Financial Intelligence'}
      description={
        language === 'hi'
          ? 'आपके व्यक्तिगत खाते के सत्यापित रिकॉर्ड, बजट, आवर्ती बिलों और सुरक्षित गणनाओं पर आधारित संवादात्मक मार्गदर्शन।'
          : 'Conversational guidance backed by your personal account records, budgets, recurring bills, and deterministic calculations.'
      }
    >
      <Suspense fallback={<div className="p-8 text-center text-sm font-mono text-[var(--muted)]">Loading AI Assistant...</div>}>
        <AIAssistantChatContainer />
      </Suspense>
    </ModuleShell>
  );
}
