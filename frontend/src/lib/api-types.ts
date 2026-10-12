export interface Account {
  id: number;
  owner_id: string;
  name: string;
  account_type: AccountType;
  currency: string;
  initial_balance: string;
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