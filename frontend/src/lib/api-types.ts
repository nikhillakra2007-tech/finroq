export interface Account {
  id: number;
  owner_id: string;
  name: string;
  account_type: AccountType;
  currency: string;
  initial_balance: string;
  current_balance?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type AccountType = 'checking' | 'savings' | 'credit' | 'investment' | 'cash' | 'other';

export interface AccountCreate {
  name: string;
  account_type?: AccountType;
  currency: string;
  initial_balance: string;
}

export interface AccountUpdate {
  name?: string;
  account_type?: AccountType;
  currency?: string;
  initial_balance?: string;
  is_active?: boolean;
}

export interface AccountListResponse {
  accounts: Account[];
  total: number;
  page: number;
  page_size: number;
}

export interface Category {
  id: number;
  name: string;
  category_type: CategoryType;
  owner_id: string | null;
  is_system: boolean;
  created_at: string;
  updated_at: string;
}

export type CategoryType = 'income' | 'expense' | 'both';

export interface CategoryCreate {
  name: string;
  category_type?: CategoryType;
}

export type TransactionType = 'income' | 'expense' | 'transfer';

export type TransactionStatus = 'completed' | 'pending' | 'cancelled';

export interface Transaction {
  id: number;
  owner_id: string;
  account_id: number;
  to_account_id?: number | null;
  category_id: number | null;
  category?: Category | null;
  related_transaction_id?: number | null;
  amount: string;
  currency: string;
  transaction_type: TransactionType;
  status?: TransactionStatus;
  description: string | null;
  transaction_date: string;
  created_at: string;
  updated_at: string;
}

export interface TransactionCreate {
  account_id: number;
  to_account_id?: number;
  category_id?: number;
  amount: string;
  currency: string;
  transaction_type: TransactionType;
  description?: string;
  transaction_date: string;
}

export interface TransactionUpdate {
  account_id?: number;
  to_account_id?: number | null;
  category_id?: number | null;
  amount?: string;
  currency?: string;
  transaction_type?: TransactionType;
  description?: string | null;
  transaction_date?: string;
}


export interface TransactionListResponse {
  transactions: Transaction[];
  total: number;
  page: number;
  page_size: number;
}

export interface SummaryPeriod {
  start_date: string;
  end_date: string;
}

export interface AccountBalance {
  account_id: number;
  account_name: string;
  account_type: AccountType;
  currency: string;
  current_balance: string;
  period_income: string;
  period_expenses: string;
}

export interface CategoryBreakdown {
  category_id: number | null;
  category_name: string;
  category_type: CategoryType;
  total_amount: string;
  transaction_count: number;
}

export interface FinancialSummary {
  period: SummaryPeriod;
  total_income: string;
  total_expenses: string;
  net_cash_flow: string;
  account_balances: AccountBalance[];
  category_breakdown: CategoryBreakdown[];
  net_worth?: string | null;
  income_change_percent?: string | null;
  expense_change_percent?: string | null;
  net_cash_flow_change_percent?: string | null;
}

export interface Budget {
  id: number;
  owner_id: string;
  category_id: number;
  category_name: string;
  budget_year: number;
  budget_month: number;
  allocated_amount: string;
  actual_spending: string;
  remaining_amount: string;
  utilization_percent: string | null;
  is_overspent: boolean;
  created_at: string;
  updated_at: string;
}

export interface BudgetCreate {
  category_id: number;
  budget_year: number;
  budget_month: number;
  allocated_amount: string;
}

export interface BudgetUpdate {
  allocated_amount: string;
}

export type RecurrenceFrequency = 'daily' | 'weekly' | 'monthly' | 'yearly';
export type RecurrenceStatus = 'active' | 'paused';

export interface RecurringTransaction {
  id: number;
  owner_id: string;
  account_id: number;
  account_name: string;
  to_account_id?: number | null;
  to_account_name?: string | null;
  category_id?: number | null;
  category_name?: string | null;
  amount: string;
  currency: string;
  transaction_type: TransactionType;
  frequency: RecurrenceFrequency;
  start_date: string;
  end_date?: string | null;
  next_occurrence?: string | null;
  status: RecurrenceStatus;
  description?: string | null;
  created_at: string;
  updated_at: string;
}

export interface RecurringTransactionCreate {
  account_id: number;
  to_account_id?: number;
  category_id?: number;
  amount: string;
  currency?: string;
  transaction_type: TransactionType;
  frequency: RecurrenceFrequency;
  start_date: string;
  end_date?: string;
  description?: string;
}

export interface RecurringTransactionUpdate {
  account_id?: number;
  to_account_id?: number;
  category_id?: number;
  amount?: string;
  currency?: string;
  transaction_type?: TransactionType;
  frequency?: RecurrenceFrequency;
  start_date?: string;
  end_date?: string;
  status?: RecurrenceStatus;
  description?: string;
}

export interface RecurringRecordOccurrenceResponse {
  transaction: Transaction;
  already_recorded: boolean;
  next_occurrence?: string | null;
}

export interface User {
  id: number;
  email: string;
  full_name?: string;
  is_active: boolean;
  is_superuser: boolean;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface ApiError {
  detail: string;
}

export interface FinancialExplanationRequest {
  start_date?: string;
  end_date?: string;
}

export interface FinancialExplanationResponse {
  explanation: string;
  is_ai_generated: boolean;
  model_used: string;
  provider_status: string;
  verified_income: string;
  verified_expenses: string;
  verified_net_cash_flow: string;
  overspent_categories: string[];
}

export interface SpendingAssistantRequest {
  question: string;
}

export interface SpendingAssistantResponse {
  answer: string;
  is_ai_generated: boolean;
  model_used: string;
  relevant_data: Record<string, any>;
}

export interface TransactionClassificationRequest {
  description: string;
  amount?: string;
}

export interface TransactionClassificationResponse {
  suggested_category_id: number | null;
  suggested_category_name: string;
  confidence: number;
  is_ai_generated: boolean;
}

export interface GoalSimulationRequest {
  goal_name: string;
  target_amount: string;
  current_savings: string;
  monthly_contribution: string;
  target_date?: string;
}

export interface GoalSimulationResponse {
  goal_name: string;
  target_amount: string;
  current_savings: string;
  funding_gap: string;
  monthly_contribution: string;
  projected_months_needed: number | null;
  projected_completion_date: string | null;
  feasibility_status: string;
  explanation: string;
  is_ai_generated: boolean;
}

export interface AIEntitlementsResponse {
  tier: string;
  queries_used: number;
  queries_allowed: number;
  queries_remaining: number;
}

export interface StatementImportPreviewItem {
  row_index: number;
  transaction_date: string;
  description: string | null;
  amount: string;
  transaction_type: TransactionType;
  suggested_category_id: number | null;
  suggested_category_name: string | null;
  is_duplicate: boolean;
  is_valid: boolean;
  error: string | null;
}

export interface StatementImportPreviewResponse {
  account_id: number;
  account_name: string;
  total_rows: number;
  valid_count: number;
  duplicate_count: number;
  items: StatementImportPreviewItem[];
}

export interface StatementImportConfirmItem {
  transaction_date: string;
  description: string | null;
  amount: string;
  transaction_type: TransactionType;
  category_id?: number | null;
}

export interface StatementImportConfirmRequest {
  account_id: number;
  transactions: StatementImportConfirmItem[];
}

export interface StatementImportConfirmResponse {
  imported_count: number;
  message: string;
}

export type ReadinessTier = 'limited_evidence' | 'preliminary' | 'provisional' | 'sufficiently_supported';
export type InsightType = 'recurring_subscription' | 'dormant_recurring' | 'excessive_category_spend' | 'recurring_cost_inflation' | 'duplicate_charge_leakage' | 'annual_subscription_evaluation';
export type InsightStatus = 'insufficient_evidence' | 'preliminary' | 'provisional' | 'sufficiently_supported';

export interface AccountCoverageItem {
  account_id: number;
  account_name: string;
  account_type: string;
  currency: string;
  is_active: boolean;
  transaction_count: number;
  earliest_transaction_date?: string | null;
  latest_transaction_date?: string | null;
}

export interface MissingPeriodGap {
  start_date: string;
  end_date: string;
  gap_days: number;
  description: string;
}

export interface SupportingTransaction {
  id: number;
  transaction_date: string;
  amount: string;
  description?: string | null;
  source: string;
}

export interface DataReadinessReport {
  account_age_days: number;
  available_history_days: number;
  observed_active_days: number;
  calendar_days_in_window: number;
  earliest_transaction_date?: string | null;
  latest_transaction_date?: string | null;
  data_freshness_days?: number | null;
  manual_transactions_count: number;
  imported_transactions_count: number;
  seed_transactions_count: number;
  provider_sync_transactions_count: number;
  total_eligible_transactions: number;
  verified_coverage_status: string;
  verified_coverage_notes: string;
  statement_coverage_start?: string | null;
  statement_coverage_end?: string | null;
  provider_sync_start?: string | null;
  provider_last_sync?: string | null;
  is_synthetic_demo_data: boolean;
  accounts_included: AccountCoverageItem[];
  accounts_excluded: AccountCoverageItem[];
  missing_periods: MissingPeriodGap[];
  readiness_tier: ReadinessTier;
  readiness_headline: string;
  readiness_explanation: string;
  recommended_action: string;
}

export interface SpendLeakInsight {
  id: string;
  insight_type: InsightType;
  status: InsightStatus;
  title: string;
  description: string;
  severity: 'high' | 'medium' | 'low';
  analysis_start_date?: string | null;
  analysis_end_date?: string | null;
  relevant_transaction_count: number;
  supporting_transactions: SupportingTransaction[];
  evidence_summary: string;
  calculation_method: string;
  assumptions: string;
  limitations: string;
  recommended_action: string;
  potential_monthly_savings: string;
  projected_annual_savings: string;
  is_savings_projected: boolean;
  disclaimer: string;
}

export interface SpendLeakAnalysisResponse {
  readiness: DataReadinessReport;
  insights: SpendLeakInsight[];
  total_monthly_leak: string;
  total_annual_leak: string;
  recoverable_monthly_estimate: string;
  recoverable_annual_estimate: string;
  disclaimer: string;
}