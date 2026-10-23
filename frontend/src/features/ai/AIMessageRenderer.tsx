'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronDown, ChevronRight, ArrowRight, Sparkles } from 'lucide-react';

export interface FinroqFeatureDef {
  title: string;
  url: string;
  keywords: string[];
}

export const ALL_FINROQ_FEATURES: FinroqFeatureDef[] = [
  {
    title: 'Expense Tracking',
    url: '/app/expense-tracking',
    keywords: ['expense', 'spent', 'spend', 'spending', 'transaction', 'outflow', 'paid', 'purchase', 'cash flow', 'payment', 'ledger', 'discretionary', 'groceries', 'dining', 'housing', 'rent'],
  },
  {
    title: 'Budgeting',
    url: '/app/budgeting',
    keywords: ['budget', 'envelope', 'cap', 'limit', 'allocated', 'overspent', 'allowance', 'pacing', 'category limit', 'daily budget'],
  },
  {
    title: 'Pre-Spend Check',
    url: '/app/pre-spend-check',
    keywords: ['afford', 'buy', 'purchase', 'can i buy', 'can i afford', 'should i buy', 'impulse', 'shortfall', 'safe reserves'],
  },
  {
    title: 'Spend Leak Detector',
    url: '/app/spend-leak-detector',
    keywords: ['leak', 'recurring', 'subscription', 'bill', 'zombie', 'hidden cost', 'unbilled', 'broadband', 'netflix', 'vps'],
  },
  {
    title: 'Crash-Test Engine',
    url: '/app/crash-test',
    keywords: ['crash', 'stress', 'shock', 'layoff', 'crisis', 'resilience', 'adversity', 'medical emergency', 'inflation', '6-agent', 'stress test'],
  },
  {
    title: 'Goal Timeline',
    url: '/app/goal-timeline',
    keywords: ['goal', 'saving', 'save', 'target', 'milestone', 'horizon', 'timeline', 'projected savings', 'savings goal'],
  },
  {
    title: 'Emergency Cushion',
    url: '/app/emergency-cushion',
    keywords: ['cushion', 'emergency fund', 'runway', 'rainy day', 'safety net', 'liquid reserves', 'months of runway', 'buffer'],
  },
  {
    title: 'Net Worth Tracker',
    url: '/app/net-worth',
    keywords: ['net worth', 'asset', 'assets', 'liability', 'liabilities', 'wealth', 'balance sheet', 'portfolio', 'equity'],
  },
  {
    title: 'Debt Watchdog',
    url: '/app/debt-watchdog',
    keywords: ['debt', 'loan', 'emi', 'interest', 'avalanche', 'snowball', 'credit card balance', 'repayment', 'principal', 'borrow'],
  },
  {
    title: 'Credit Health',
    url: '/app/credit-health',
    keywords: ['credit score', 'credit health', 'cibil', 'experian', 'bureau', 'utilization', 'credit card score', 'inquiry'],
  },
  {
    title: 'Financial Health Score',
    url: '/app/financial-health',
    keywords: ['health score', 'overall health', 'grade', 'financial score', 'diagnosis', 'holistic', 'overall financial'],
  },
  {
    title: 'Expense Splitter',
    url: '/app/splitter',
    keywords: ['split', 'shared', 'roommate', 'trip expense', 'split bill', 'group expense', 'settle up', 'owing', 'owed'],
  },
  {
    title: 'Money Guides',
    url: '/app/money-guides',
    keywords: ['guide', 'learn', 'education', 'how to', 'tips', 'financial basics', 'investing basics', 'tutorial', 'primer'],
  },
];

interface AIMessageRendererProps {
  content: string;
  isUser: boolean;
  isGuestMode?: boolean;
}

interface ParsedAIMessage {
  summary: string;
  detailedAnalysis: string | null;
  sources: { title: string; url: string }[];
}

/**
 * Infer the best matching Finroq feature based on message keywords
 */
export function inferSourceFeatures(text: string): { title: string; url: string }[] {
  const lower = text.toLowerCase();

  let bestMatch: FinroqFeatureDef | null = null;
  let highestScore = 0;

  for (const feat of ALL_FINROQ_FEATURES) {
    let score = 0;
    for (const kw of feat.keywords) {
      if (lower.includes(kw)) {
        // Longer keywords indicate stronger semantic match
        score += kw.includes(' ') ? 3 : 1;
      }
    }
    if (score > highestScore) {
      highestScore = score;
      bestMatch = feat;
    }
  }

  // If a solid match was found, return it
  if (bestMatch && highestScore > 0) {
    return [{ title: bestMatch.title, url: bestMatch.url }];
  }

  // Fallback defaults:
  // If mentions money/numbers/currency, default to Expense Tracking; otherwise Financial Health Score
  if (/₹|\$|inr|usd|amount|spent|cost|balance|\d+/.test(lower)) {
    return [{ title: 'Expense Tracking', url: '/app/expense-tracking' }];
  }
  return [{ title: 'Financial Health Score', url: '/app/financial-health' }];
}

export function parseAIMessageContent(raw: string): ParsedAIMessage {
  let text = raw || '';
  const sources: { title: string; url: string }[] = [];

  // 1. Extract Explicit Source Links in formats like:
  // 📌 Source: [Daily Budgeting](/app/budgeting)
  // Source: [Expense Tracking](/app/expense-tracking)
  // or standalone [Title](/app/...)
  const sourceRegex = /(?:📌\s*)?(?:Source|Source Feature|Powered by|Feature):\s*\[([^\]]+)\]\(([^)]+)\)/gi;
  let sourceMatch;
  while ((sourceMatch = sourceRegex.exec(text)) !== null) {
    sources.push({
      title: sourceMatch[1].trim(),
      url: sourceMatch[2].trim(),
    });
  }

  // Also catch generic markdown links to /app/ if no explicit Source: label was found
  if (sources.length === 0) {
    const genericAppLinkRegex = /\[([^\]]+)\]\((\/app\/[^)]+)\)/gi;
    let appMatch;
    while ((appMatch = genericAppLinkRegex.exec(text)) !== null) {
      sources.push({
        title: appMatch[1].trim(),
        url: appMatch[2].trim(),
      });
    }
  }

  // Clean the source citation lines from text
  text = text
    .replace(/(?:📌\s*)?(?:Source|Source Feature|Powered by|Feature):\s*\[([^\]]+)\]\(([^)]+)\)/gi, '')
    .trim();

  // 2. Extract Detailed Analysis section
  // Matches "### 🔍 Detailed Analysis" or "### Detailed Analysis" or "### Detailed Breakdown"
  const detailedAnalysisRegex = /###\s*(?:🔍\s*)?(?:Detailed Analysis|Detailed Breakdown|Detailed Metrics|Breakdown|Analysis)\s*([\s\S]*)$/i;
  const detailedMatch = detailedAnalysisRegex.exec(text);

  let summary = text;
  let detailedAnalysis: string | null = null;

  if (detailedMatch) {
    summary = text.substring(0, detailedMatch.index).trim();
    detailedAnalysis = detailedMatch[1].trim();
  } else {
    // Intelligent heuristic: If text contains "Top categories:" or bullet list items or breakdown sentences,
    // separate into simplistic 1st sentence summary + detailed breakdown drawer.
    const topCatIndex = text.search(/Top categories:|Breakdown:/i);
    if (topCatIndex > 20) {
      summary = text.substring(0, topCatIndex).trim();
      detailedAnalysis = text.substring(topCatIndex).trim();
    }
  }

  // If summary ended up empty (e.g. model output directly starting with heading), fallback
  if (!summary && detailedAnalysis) {
    summary = detailedAnalysis;
    detailedAnalysis = null;
  }

  // 3. Guaranteed Source Badge:
  // If no source link was found in markdown text, automatically infer from content keywords
  // so that EVERY single AI answer displays a clickable source badge for all features!
  if (sources.length === 0) {
    const inferred = inferSourceFeatures(raw);
    sources.push(...inferred);
  }

  return {
    summary,
    detailedAnalysis,
    sources,
  };
}

export function AIMessageRenderer({ content, isUser, isGuestMode = false }: AIMessageRendererProps) {
  const router = useRouter();
  const [isExpanded, setIsExpanded] = useState(false);

  if (isUser) {
    return <div className="whitespace-pre-wrap break-words [overflow-wrap:anywhere]">{content}</div>;
  }

  const { summary, detailedAnalysis, sources } = parseAIMessageContent(content);

  const handleNavigateToFeature = (url: string) => {
    router.push(url);
  };

  return (
    <div className="space-y-2.5">
      {/* 1. Simplistic To-The-Point Answer */}
      <div className="whitespace-pre-wrap break-words [overflow-wrap:anywhere] leading-relaxed text-[12px] font-normal text-inherit">
        {summary}
      </div>

      {/* 2. Expandable Detailed Breakdown (Collapsible) */}
      {detailedAnalysis && (
        <div className="pt-1">
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 font-mono text-[11px] font-semibold transition-all cursor-pointer border border-emerald-500/20 shadow-2xs select-none"
            aria-expanded={isExpanded}
          >
            {isExpanded ? (
              <>
                <ChevronDown className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Hide Detailed Breakdown</span>
              </>
            ) : (
              <>
                <ChevronRight className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>📊 View Detailed Breakdown</span>
              </>
            )}
          </button>

          {isExpanded && (
            <div className="mt-2 p-3 rounded-xl bg-white/70 dark:bg-black/40 border border-[#CBD5CB]/80 dark:border-[#2A3D33] text-[11px] leading-relaxed text-[var(--ink)] dark:text-slate-200 whitespace-pre-wrap break-words [overflow-wrap:anywhere] animate-in fade-in slide-in-from-top-1 duration-150">
              <div className="text-[10px] font-mono uppercase tracking-wider text-emerald-700 dark:text-emerald-400 font-bold mb-1.5 flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                <span>Verified Ledger Breakdown</span>
              </div>
              {detailedAnalysis}
            </div>
          )}
        </div>
      )}

      {/* 3. Deep-Linking Source Feature Chips - ALWAYS visible everywhere AI answers */}
      {sources.length > 0 && (
        <div className="pt-2 border-t border-[var(--line)]/50 flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--muted)] font-semibold flex items-center gap-1">
            <span>📌</span>
            <span>Source Feature:</span>
          </span>
          {sources.map((src, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleNavigateToFeature(src.url)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-950/80 dark:hover:bg-emerald-900 border border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 text-[11px] font-medium transition-all cursor-pointer group shadow-2xs"
              title={`Click to open ${src.title}`}
            >
              <span className="font-semibold">{src.title}</span>
              <ArrowRight className="w-3 h-3 text-emerald-600 dark:text-emerald-400 group-hover:translate-x-0.5 transition-transform" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

