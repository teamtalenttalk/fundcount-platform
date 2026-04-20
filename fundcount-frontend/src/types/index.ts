// ---- Auth & Users ----

export interface User {
  id: number;
  email: string;
  full_name: string;
  role: 'admin' | 'accountant' | 'viewer' | 'investor';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  user: User;
}

// ---- Chart of Accounts ----

export interface Account {
  id: number;
  code: string;
  name: string;
  type: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
  subtype: string;
  parent_id: number | null;
  is_active: boolean;
  description: string;
  currency: string;
  balance: number;
  created_at: string;
  updated_at: string;
  children?: Account[];
}

// ---- General Ledger ----

export interface JournalEntry {
  id: number;
  entry_number: string;
  date: string;
  description: string;
  reference: string;
  status: 'draft' | 'posted' | 'reversed';
  created_by: number;
  approved_by: number | null;
  lines: JournalLine[];
  created_at: string;
  updated_at: string;
}

export interface JournalLine {
  id: number;
  journal_entry_id: number;
  account_id: number;
  account_code: string;
  account_name: string;
  debit: number;
  credit: number;
  description: string;
  currency: string;
  fx_rate: number;
}

// ---- Portfolios ----

export interface Portfolio {
  id: number;
  name: string;
  code: string;
  description: string;
  base_currency: string;
  inception_date: string;
  status: 'active' | 'inactive' | 'closed';
  portfolio_type: 'fund' | 'managed_account' | 'model';
  benchmark_id: number | null;
  nav: number;
  created_at: string;
  updated_at: string;
}

// ---- Assets ----

export interface Asset {
  id: number;
  symbol: string;
  name: string;
  asset_class: 'equity' | 'fixed_income' | 'commodity' | 'currency' | 'derivative' | 'real_estate' | 'alternative';
  asset_type: string;
  currency: string;
  exchange: string;
  isin: string;
  cusip: string;
  sedol: string;
  is_active: boolean;
  price: number;
  price_date: string;
  created_at: string;
  updated_at: string;
}

// ---- Positions ----

export interface Position {
  id: number;
  portfolio_id: number;
  asset_id: number;
  asset_symbol: string;
  asset_name: string;
  quantity: number;
  cost_basis: number;
  market_value: number;
  unrealized_pnl: number;
  unrealized_pnl_pct: number;
  weight: number;
  currency: string;
  as_of_date: string;
}

// ---- Trades ----

export interface Trade {
  id: number;
  portfolio_id: number;
  asset_id: number;
  asset_symbol: string;
  asset_name: string;
  trade_type: 'buy' | 'sell' | 'short' | 'cover';
  quantity: number;
  price: number;
  gross_amount: number;
  commission: number;
  fees: number;
  net_amount: number;
  trade_date: string;
  settlement_date: string;
  status: 'pending' | 'executed' | 'settled' | 'cancelled';
  currency: string;
  fx_rate: number;
  broker: string;
  reference: string;
  notes: string;
  created_at: string;
  updated_at: string;
}

// ---- Partners / Capital Accounts ----

export interface Partner {
  id: number;
  name: string;
  code: string;
  type: 'general' | 'limited';
  email: string;
  phone: string;
  tax_id: string;
  commitment: number;
  funded: number;
  ownership_pct: number;
  status: 'active' | 'inactive' | 'redeemed';
  inception_date: string;
  created_at: string;
  updated_at: string;
}

export interface CapitalAccount {
  id: number;
  partner_id: number;
  partner_name: string;
  portfolio_id: number;
  period_start: string;
  period_end: string;
  beginning_balance: number;
  contributions: number;
  withdrawals: number;
  management_fee: number;
  performance_fee: number;
  allocated_pnl: number;
  ending_balance: number;
  ownership_pct: number;
}

// ---- Performance ----

export interface PerformanceRecord {
  id: number;
  portfolio_id: number;
  portfolio_name: string;
  date: string;
  nav: number;
  daily_return: number;
  mtd_return: number;
  qtd_return: number;
  ytd_return: number;
  itd_return: number;
  benchmark_return: number;
  alpha: number;
  sharpe_ratio: number;
  max_drawdown: number;
  volatility: number;
}

// ---- Reports ----

export interface ReportConfig {
  id: number;
  name: string;
  type: 'balance_sheet' | 'income_statement' | 'trial_balance' | 'capital_account' | 'performance' | 'position' | 'transaction';
  portfolio_id: number | null;
  date_from: string;
  date_to: string;
  format: 'pdf' | 'xlsx' | 'csv';
  parameters: Record<string, unknown>;
}

// ---- Common ----

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface ApiError {
  detail: string;
  status_code: number;
}

export interface SelectOption {
  value: string;
  label: string;
}

export interface DashboardSummary {
  total_nav: number;
  total_portfolios: number;
  total_positions: number;
  daily_pnl: number;
  mtd_pnl: number;
  ytd_pnl: number;
  nav_history: { date: string; nav: number }[];
  asset_allocation: { asset_class: string; weight: number; value: number }[];
  top_performers: { symbol: string; name: string; return_pct: number }[];
  recent_trades: Trade[];
}
