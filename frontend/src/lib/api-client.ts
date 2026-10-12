import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import type {
  Account,
  AccountCreate,
  AccountUpdate,
  AccountListResponse,
  Category,
  CategoryCreate,
  Transaction,
  TransactionCreate,
  TransactionUpdate,
  TransactionListResponse,
  FinancialSummary,
  Budget,
  BudgetCreate,
  BudgetUpdate,
  RecurringTransaction,
  RecurringTransactionCreate,
  RecurringTransactionUpdate,
  RecurringRecordOccurrenceResponse,
  AuthResponse,
  User,
} from './api-types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

class ApiClient {
  private client: AxiosInstance;
  private token: string | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    });

    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('finroq_token');
    }

    this.client.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        const token = this.getToken();
        if (token) {
          config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError<{ detail: string }>) => {
        if (error.response?.status === 401) {
          console.warn('Authentication required or expired session');
        }
        return Promise.reject(error);
      }
    );
  }

  setToken(token: string) {
    this.token = token;
    if (typeof window !== 'undefined') {
      localStorage.setItem('finroq_token', token);
    }
  }

  getToken(): string | null {
    if (!this.token && typeof window !== 'undefined') {
      this.token = localStorage.getItem('finroq_token');
    }
    return this.token;
  }

  logout() {
    this.token = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('finroq_token');
    }
  }

  // Health
  async healthCheck() {
    return this.client.get('/health');
  }

  async readinessCheck() {
    return this.client.get('/health/ready');
  }

  // Auth
  async register(data: { email: string; password: string; full_name?: string }) {
    const res = await this.client.post<User>('/auth/register', data);
    // After registration, auto-authenticate to retrieve token
    try {
      const loginRes = await this.login({ email: data.email, password: data.password });
      return { ...res, data: { ...res.data, access_token: loginRes.data.access_token } };
    } catch {
      return res;
    }
  }

  async login(data: { email: string; password: string }) {
    const res = await this.client.post<AuthResponse>('/auth/login', {
      email: data.email,
      password: data.password,
    });
    if (res.data?.access_token) {
      this.setToken(res.data.access_token);
    }
    return res;
  }

  async getMe() {
    return this.client.get<User>('/auth/me');
  }

  // Accounts
  async listAccounts(params?: { page?: number; page_size?: number; is_active?: boolean }) {
    return this.client.get<AccountListResponse>('/accounts', { params });
  }

  async getAccount(id: number) {
    return this.client.get<Account>(`/accounts/${id}`);
  }

  async createAccount(data: AccountCreate) {
    return this.client.post<Account>('/accounts', data);
  }

  async updateAccount(id: number, data: AccountUpdate) {
    return this.client.patch<Account>(`/accounts/${id}`, data);
  }

  // Transactions
  async listTransactions(params?: {
    page?: number;
    page_size?: number;
    account_id?: number;
    transaction_type?: string;
    category_id?: number;
    start_date?: string;
    end_date?: string;
  }) {
    return this.client.get<TransactionListResponse>('/transactions', { params });
  }

  async getTransaction(id: number) {
    return this.client.get<Transaction>(`/transactions/${id}`);
  }

  async createTransaction(data: TransactionCreate) {
    return this.client.post<Transaction>('/transactions', data);
  }

  async updateTransaction(id: number, data: TransactionUpdate) {
    return this.client.patch<Transaction>(`/transactions/${id}`, data);
  }

  async deleteTransaction(id: number) {
    return this.client.delete(`/transactions/${id}`);
  }

  // Categories
  async listCategories(params?: { category_type?: string; include_system?: boolean }) {
    return this.client.get<Category[]>('/categories', { params });
  }

  async createCategory(data: CategoryCreate) {
    return this.client.post<Category>('/categories', data);
  }

  async seedDefaultCategories() {
    return this.client.post<Category[]>('/categories/seed-defaults');
  }

  // Summary
  async getSummary(params?: { start_date?: string; end_date?: string }) {
    return this.client.get<FinancialSummary>('/summary', { params });
  }

  // Budgets
  async listBudgets(year: number, month: number) {
    return this.client.get<Budget[]>('/budgets', { params: { year, month } });
  }

  async getBudget(id: number) {
    return this.client.get<Budget>(`/budgets/${id}`);
  }

  async createBudget(data: BudgetCreate) {
    return this.client.post<Budget>('/budgets', data);
  }

  async updateBudget(id: number, data: BudgetUpdate) {
    return this.client.patch<Budget>(`/budgets/${id}`, data);
  }

  async deleteBudget(id: number) {
    return this.client.delete(`/budgets/${id}`);
  }

  // Recurring Transactions
  async listRecurring(params?: { status?: string; account_id?: number }) {
    return this.client.get<RecurringTransaction[]>('/recurring', { params });
  }

  async getRecurring(id: number) {
    return this.client.get<RecurringTransaction>(`/recurring/${id}`);
  }

  async createRecurring(data: RecurringTransactionCreate) {
    return this.client.post<RecurringTransaction>('/recurring', data);
  }

  async updateRecurring(id: number, data: RecurringTransactionUpdate) {
    return this.client.patch<RecurringTransaction>(`/recurring/${id}`, data);
  }

  async pauseRecurring(id: number) {
    return this.client.post<RecurringTransaction>(`/recurring/${id}/pause`);
  }

  async resumeRecurring(id: number) {
    return this.client.post<RecurringTransaction>(`/recurring/${id}/resume`);
  }

  async recordRecurringOccurrence(id: number, data?: { occurrence_date?: string }) {
    return this.client.post<RecurringRecordOccurrenceResponse>(`/recurring/${id}/record`, data || {});
  }

  async deleteRecurring(id: number) {
    return this.client.delete(`/recurring/${id}`);
  }
}

export function extractErrorMessage(err: unknown, fallback = 'An unexpected error occurred'): string {
  if (axios.isAxiosError(err)) {
    if (err.response?.data?.detail) {
      if (typeof err.response.data.detail === 'string') {
        return err.response.data.detail;
      }
      if (Array.isArray(err.response.data.detail)) {
        return err.response.data.detail.map((d: any) => d.msg || d.message || JSON.stringify(d)).join(', ');
      }
    }
    if (err.message === 'Network Error') {
      return 'Unable to connect to server. Please verify your internet or backend connection.';
    }
    return err.message || fallback;
  }
  if (err instanceof Error) {
    return err.message;
  }
  return fallback;
}

export const apiClient = new ApiClient();