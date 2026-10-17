/**
 * AI Provenance, Session Mode, and Execution Classification Engine
 *
 * Separates three distinct concerns:
 * 1. Session Mode: Whether the user is in an explicit trusted demo session, an authenticated account session, or guest mode.
 * 2. Execution Type: Whether the response was produced by a live external provider (e.g. Gemini), a deterministic backend engine, a simulated client demo, or static public guide.
 * 3. Data Provenance: Whether the underlying figures originate from verified user ledger database queries, sample demo records, or generic prompt context.
 */

export type AISessionMode = 'demo' | 'authenticated' | 'guest';

export type AIExecutionType =
  | 'live_provider'
  | 'deterministic_backend'
  | 'simulated_demo'
  | 'static_guide'
  | 'unavailable';

export type AIDataProvenance =
  | 'verified_ledger'
  | 'simulated_demo'
  | 'no_ledger_context';

export interface AIProvenanceInfo {
  sessionMode: AISessionMode;
  executionType: AIExecutionType;
  dataProvenance: AIDataProvenance;
  executionBadgeLabel: string;
  provenanceBadgeLabel?: string;
  isLiveAI: boolean;
  isDeterministic: boolean;
  isSimulated: boolean;
}

export interface ResolveAIProvenanceInput {
  content?: string;
  is_live_ai?: boolean;
  model_used?: string;
  structured_data?: Record<string, any> | null;
  tools_executed?: Array<{
    tool: string;
    arguments?: Record<string, any>;
    result?: Record<string, any>;
  }>;
}

export function resolveAIProvenance(
  msg: ResolveAIProvenanceInput,
  isDemoSession: boolean,
  isGuestMode: boolean = false
): AIProvenanceInfo {
  // 1. Session Mode
  const sessionMode: AISessionMode = isGuestMode
    ? 'guest'
    : isDemoSession
    ? 'demo'
    : 'authenticated';

  // 2. Execution Type
  let executionType: AIExecutionType = 'unavailable';
  let executionBadgeLabel = 'Unavailable';

  const model = (msg.model_used || '').toLowerCase();
  const isDemoModel =
    model.includes('demo') ||
    (typeof msg.content === 'string' && msg.content.startsWith('[Simulated Demo]'));

  if (isGuestMode || model === 'finroq-static-guide') {
    executionType = 'static_guide';
    executionBadgeLabel = 'Public Guide';
  } else if (msg.is_live_ai === true) {
    executionType = 'live_provider';
    const displayModel = msg.model_used && msg.model_used !== 'unknown' ? msg.model_used : 'Live AI';
    executionBadgeLabel = `Live AI · ${displayModel}`;
  } else if (
    model.includes('deterministic') ||
    model === 'deterministic-rules-engine' ||
    model === 'deterministic-fallback' ||
    model === 'finroq-deterministic-summary'
  ) {
    executionType = 'deterministic_backend';
    executionBadgeLabel = 'Deterministic Engine';
  } else if (isDemoSession || isDemoModel) {
    executionType = 'simulated_demo';
    executionBadgeLabel = 'Simulated Demo';
  } else if (model === 'unconfigured' || model === 'missing_dependency') {
    executionType = 'unavailable';
    executionBadgeLabel = 'Provider Unavailable';
  } else {
    executionType = 'unavailable';
    executionBadgeLabel = 'Offline / Unavailable';
  }

  // 3. Data Provenance
  let dataProvenance: AIDataProvenance = 'no_ledger_context';
  let provenanceBadgeLabel: string | undefined = undefined;

  const struct = msg.structured_data;
  const isStructSimulated = Boolean(
    struct?.is_simulated ||
    (typeof struct?.data_freshness === 'string' &&
      (struct.data_freshness.toLowerCase().includes('demo') ||
       struct.data_freshness.toLowerCase().includes('simulated')))
  );

  if (isDemoSession || isStructSimulated || isDemoModel) {
    dataProvenance = 'simulated_demo';
    provenanceBadgeLabel = 'Sample Demo Ledger';
  } else if (
    !isDemoSession &&
    !isGuestMode &&
    struct &&
    ((typeof struct.data_freshness === 'string' && struct.data_freshness.toLowerCase().includes('verified')) ||
      (Array.isArray(msg.tools_executed) && msg.tools_executed.length > 0))
  ) {
    dataProvenance = 'verified_ledger';
    provenanceBadgeLabel = 'Verified Ledger Context';
  }

  return {
    sessionMode,
    executionType,
    dataProvenance,
    executionBadgeLabel,
    provenanceBadgeLabel,
    isLiveAI: executionType === 'live_provider',
    isDeterministic: executionType === 'deterministic_backend',
    isSimulated: executionType === 'simulated_demo' || dataProvenance === 'simulated_demo',
  };
}
