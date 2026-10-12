'use client';

import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, Button, Input, Badge } from '@/components/ui';
import { apiClient, extractErrorMessage } from '@/lib/api-client';
import {
  FinancialExplanationResponse,
  SpendingAssistantResponse,
  GoalSimulationResponse,
  AIEntitlementsResponse,
} from '@/lib/api-types';
import { formatCurrency } from '@/lib/utils';
import {
  Sparkles,
  Send,
  Target,
  RefreshCw,
  Lightbulb,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  TrendingUp,
} from 'lucide-react';

export default function InsightsPage() {
  // Explanation state
  const [explanation, setExplanation] = useState<FinancialExplanationResponse | null>(null);
  const [isExplaining, setIsExplaining] = useState(false);
  const [explanationError, setExplanationError] = useState<string | null>(null);

  // Assistant state
  const [question, setQuestion] = useState('');
  const [chatHistory, setChatHistory] = useState<Array<{ q: string; a: string; isAi: boolean }>>([]);
  const [isAnswering, setIsAnswering] = useState(false);
  const [assistantError, setAssistantError] = useState<string | null>(null);

  // Goal simulation state
  const [goalName, setGoalName] = useState('Down Payment Reserve');
  const [targetAmount, setTargetAmount] = useState('10000');
  const [currentSavings, setCurrentSavings] = useState('2000');
  const [monthlyContrib, setMonthlyContrib] = useState('500');
  const [goalResult, setGoalResult] = useState<GoalSimulationResponse | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);

  // Entitlements
  const [entitlements, setEntitlements] = useState<AIEntitlementsResponse | null>(null);

  const loadEntitlements = async () => {
    try {
      const res = await apiClient.getAIEntitlements();
      setEntitlements(res.data);
    } catch {
      // Non-blocking
    }
  };

  useEffect(() => {
    loadEntitlements();
  }, []);

  const handleGenerateExplanation = async () => {
    try {
      setIsExplaining(true);
      setExplanationError(null);
      const res = await apiClient.explainFinances();
      setExplanation(res.data);
      await loadEntitlements();
    } catch (err) {
      setExplanationError(extractErrorMessage(err, 'Failed to generate financial explanation.'));
    } finally {
      setIsExplaining(false);
    }
  };

  const handleAskQuestion = async (qText?: string) => {
    const query = qText || question;
    if (!query.trim()) return;

    try {
      setIsAnswering(true);
      setAssistantError(null);
      const res = await apiClient.askSpendingAssistant({ question: query });
      setChatHistory((prev) => [
        ...prev,
        { q: query, a: res.data.answer, isAi: res.data.is_ai_generated },
      ]);
      setQuestion('');
      await loadEntitlements();
    } catch (err) {
      setAssistantError(extractErrorMessage(err, 'Unable to answer question at this time.'));
    } finally {
      setIsAnswering(false);
    }
  };

  const handleSimulateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSimulating(true);
      const res = await apiClient.simulateGoal({
        goal_name: goalName,
        target_amount: targetAmount,
        current_savings: currentSavings,
        monthly_contribution: monthlyContrib,
      });
      setGoalResult(res.data);
    } catch (err) {
      alert(extractErrorMessage(err, 'Goal simulation calculation failed.'));
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <MainLayout>
      <div className="space-y-8 max-w-5xl mx-auto">
        {/* Header & Quota */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="p-1.5 bg-finroq-mint rounded-lg text-finroq-forest">
                <Sparkles className="h-5 w-5" />
              </span>
              <h1 className="heading-page">Financial Intelligence</h1>
            </div>
            <p className="text-sm text-finroq-muted">
              Deterministic calculations paired with plain-English AI explanations powered by Gemini.
            </p>
          </div>

          {entitlements && (
            <div className="flex items-center gap-2 bg-white px-3.5 py-2 rounded-xl border border-finroq-border text-xs">
              <span className="text-finroq-muted capitalize">{entitlements.tier} Tier:</span>
              <span className="font-semibold text-finroq-forest">
                {entitlements.queries_remaining} / {entitlements.queries_allowed} queries remaining
              </span>
            </div>
          )}
        </div>

        {/* Section 1: AI Financial Explainer */}
        <Card className="bg-white border-finroq-border">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4 pb-4 border-b border-finroq-border">
            <div>
              <h2 className="heading-card flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-finroq-positive" />
                AI Health & Budget Explainer
              </h2>
              <p className="text-xs text-finroq-muted mt-0.5">
                Translates your authoritative monthly numbers into clear, actionable observations.
              </p>
            </div>
            <Button
              variant="primary"
              onClick={handleGenerateExplanation}
              loading={isExplaining}
              disabled={isExplaining}
              className="flex items-center gap-2 text-xs"
            >
              <Sparkles className="h-3.5 w-3.5 text-finroq-lime" />
              {isExplaining ? 'Analyzing...' : 'Generate Insight'}
            </Button>
          </div>

          {explanationError && (
            <div className="p-3 mb-4 rounded-lg bg-red-50 border border-red-200 text-finroq-negative text-xs flex items-center gap-2">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>{explanationError}</span>
            </div>
          )}

          {explanation ? (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2 text-xs">
                <Badge variant="success">Income: ${explanation.verified_income}</Badge>
                <Badge variant="danger">Expenses: ${explanation.verified_expenses}</Badge>
                <Badge variant="info">Net Flow: ${explanation.verified_net_cash_flow}</Badge>
                <Badge variant="default">Engine: {explanation.model_used}</Badge>
              </div>

              {explanation.overspent_categories.length > 0 && (
                <div className="p-3 bg-amber-50 border border-amber-200 text-finroq-warning rounded-lg text-xs flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  <span>
                    Attention: Overspending detected in{' '}
                    <strong>{explanation.overspent_categories.join(', ')}</strong>.
                  </span>
                </div>
              )}

              <div className="p-4 bg-finroq-ivory rounded-xl border border-finroq-border text-sm text-finroq-text leading-relaxed whitespace-pre-line">
                {explanation.explanation}
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-finroq-muted text-sm">
              Click &quot;Generate Insight&quot; to synthesize your latest accounting cycle into plain language.
            </div>
          )}
        </Card>

        {/* Section 2: Spending Assistant */}
        <Card className="bg-white border-finroq-border">
          <div className="mb-4 pb-4 border-b border-finroq-border">
            <h2 className="heading-card flex items-center gap-2">
              <HelpCircle className="h-5 w-5 text-finroq-forest" />
              Spending Insight Assistant
            </h2>
            <p className="text-xs text-finroq-muted mt-0.5">
              Ask questions about your budget, cash flow, and historical expense patterns.
            </p>
          </div>

          {/* Preset question chips */}
          <div className="flex flex-wrap gap-2 mb-4">
            <button
              onClick={() => handleAskQuestion('Where did I spend the most this month?')}
              className="text-xs px-3 py-1.5 bg-finroq-ivory border border-finroq-border rounded-lg hover:bg-finroq-mint/40 text-finroq-text transition-colors"
            >
              Where did I spend the most?
            </button>
            <button
              onClick={() => handleAskQuestion('How much of my budget remains?')}
              className="text-xs px-3 py-1.5 bg-finroq-ivory border border-finroq-border rounded-lg hover:bg-finroq-mint/40 text-finroq-text transition-colors"
            >
              How much of my budget remains?
            </button>
            <button
              onClick={() => handleAskQuestion('What recurring commitments should I review?')}
              className="text-xs px-3 py-1.5 bg-finroq-ivory border border-finroq-border rounded-lg hover:bg-finroq-mint/40 text-finroq-text transition-colors"
            >
              Review recurring commitments
            </button>
          </div>

          {/* Chat history */}
          {chatHistory.length > 0 && (
            <div className="space-y-3 mb-4 max-h-64 overflow-y-auto pr-1">
              {chatHistory.map((msg, idx) => (
                <div key={idx} className="space-y-1.5 text-xs">
                  <div className="font-semibold text-finroq-text flex items-center gap-1.5">
                    <span>You:</span> {msg.q}
                  </div>
                  <div className="p-3 bg-finroq-ivory border border-finroq-border rounded-lg text-finroq-text leading-relaxed">
                    {msg.a}
                  </div>
                </div>
              ))}
            </div>
          )}

          {assistantError && (
            <div className="p-3 mb-3 rounded-lg bg-red-50 border border-red-200 text-finroq-negative text-xs">
              {assistantError}
            </div>
          )}

          <div className="flex gap-2">
            <Input
              type="text"
              placeholder="Ask a question about your personal finances..."
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAskQuestion()}
              disabled={isAnswering}
            />
            <Button
              variant="primary"
              onClick={() => handleAskQuestion()}
              loading={isAnswering}
              disabled={isAnswering || !question.trim()}
              className="flex items-center gap-1.5 px-4"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </Card>

        {/* Section 3: Goal Timeline Simulator */}
        <Card className="bg-white border-finroq-border">
          <div className="mb-4 pb-4 border-b border-finroq-border">
            <h2 className="heading-card flex items-center gap-2">
              <Target className="h-5 w-5 text-finroq-forest" />
              Deterministic Goal Timeline Simulator
            </h2>
            <p className="text-xs text-finroq-muted mt-0.5">
              Exact mathematical projections of savings milestones and funding gaps without financial speculation.
            </p>
          </div>

          <form onSubmit={handleSimulateGoal} className="grid gap-4 sm:grid-cols-4 text-xs mb-4">
            <div>
              <Input
                label="Goal Title"
                type="text"
                value={goalName}
                onChange={(e) => setGoalName(e.target.value)}
                required
              />
            </div>
            <div>
              <Input
                label="Target Amount ($)"
                type="number"
                step="0.01"
                value={targetAmount}
                onChange={(e) => setTargetAmount(e.target.value)}
                required
              />
            </div>
            <div>
              <Input
                label="Current Savings ($)"
                type="number"
                step="0.01"
                value={currentSavings}
                onChange={(e) => setCurrentSavings(e.target.value)}
                required
              />
            </div>
            <div>
              <Input
                label="Monthly Contribution ($)"
                type="number"
                step="0.01"
                value={monthlyContrib}
                onChange={(e) => setMonthlyContrib(e.target.value)}
                required
              />
            </div>

            <div className="sm:col-span-4 flex justify-end">
              <Button
                type="submit"
                variant="primary"
                loading={isSimulating}
                disabled={isSimulating}
                className="text-xs"
              >
                Calculate Timeline
              </Button>
            </div>
          </form>

          {goalResult && (
            <div className="mt-4 p-4 bg-finroq-mint/40 border border-finroq-border rounded-xl space-y-3 text-xs">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-semibold text-sm text-finroq-text">{goalResult.goal_name}</span>
                <Badge variant={goalResult.feasibility_status === 'Feasible' ? 'success' : 'info'}>
                  {goalResult.feasibility_status}
                </Badge>
              </div>

              <div className="grid gap-2 sm:grid-cols-3">
                <div className="p-2.5 bg-white rounded-lg border border-finroq-border">
                  <span className="text-finroq-muted">Remaining Funding Gap:</span>
                  <p className="font-mono font-bold text-sm text-finroq-forest mt-0.5">
                    {formatCurrency(goalResult.funding_gap)}
                  </p>
                </div>
                <div className="p-2.5 bg-white rounded-lg border border-finroq-border">
                  <span className="text-finroq-muted">Months Needed:</span>
                  <p className="font-mono font-bold text-sm text-finroq-forest mt-0.5">
                    {goalResult.projected_months_needed ?? 'N/A'} months
                  </p>
                </div>
                <div className="p-2.5 bg-white rounded-lg border border-finroq-border">
                  <span className="text-finroq-muted">Monthly Rate:</span>
                  <p className="font-mono font-bold text-sm text-finroq-forest mt-0.5">
                    {formatCurrency(goalResult.monthly_contribution)}/mo
                  </p>
                </div>
              </div>

              <p className="text-finroq-text leading-relaxed pt-1">{goalResult.explanation}</p>
            </div>
          )}
        </Card>
      </div>
    </MainLayout>
  );
}
