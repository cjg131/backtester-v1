/**
 * TypeScript types matching the backend models
 */

export interface StrategyConfig {
  meta: {
    name: string;
    notes: string;
  };
  universe: {
    type: string;
    symbols: string[];
  };
  period: {
    start: string;
    end: string;
    calendar: string;
  };
  initial_cash: number;
  account: AccountConfig;
  deposits?: DepositConfig;
  dividends: DividendConfig;
  rebalancing: RebalancingConfig;
  orders: OrderConfig;
  lots: LotConfig;
  frictions: FrictionsConfig;
  signals: Signal[];
  rules: RulesConfig;
  position_sizing: PositionSizingConfig;
  benchmark: string[];
  exports: ExportsConfig;
}

export interface AccountConfig {
  type: 'Taxable' | 'Traditional IRA' | 'Roth IRA' | '529 Plan';
  tax: TaxConfig;
  contribution_caps: ContributionCaps;
  state?: string;  // State code for 529 plan benefits
}

export interface TaxConfig {
  federal_ordinary: number;
  federal_ltcg: number;
  state: number;
  qualified_dividend_pct: number;
  apply_wash_sale: boolean;
  pay_taxes_from_external: boolean;
  withdrawal_tax_rate_for_ira: number;
}

export interface ContributionCaps {
  enforce: boolean;
  ira: number;
  ira_catch_up: number;
  roth: number;
  roth_catch_up: number;
}

export interface DepositConfig {
  cadence: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'every_market_day';
  amount: number;
  day_rule: string;
  market_day_everyday: boolean;
}

export interface DividendConfig {
  mode: 'DRIP' | 'CASH';
  reinvest_threshold_pct: number;
}

export interface RebalancingConfig {
  type: 'calendar' | 'drift' | 'both' | 'cashflow_only';
  calendar?: {
    period: 'D' | 'W' | 'M' | 'Q' | 'A';
  };
  drift?: {
    abs_pct?: number;
    rel_pct?: number;
  };
}

export interface OrderConfig {
  timing: 'MOO' | 'MOC';
}

export interface LotConfig {
  method: 'FIFO' | 'LIFO' | 'HIFO';
}

export interface FrictionsConfig {
  commission_per_trade: number;
  slippage_bps: number;
  use_actual_etf_er: boolean;
  equity_borrow_bps: number;
}

export interface Signal {
  id: string;
  type: string;
  params: Record<string, any>;
}

export interface RulesConfig {
  entry: Rule[];
  exit: Rule[];
}

export interface Rule {
  signal: string;
  op: string;
}

export interface PositionSizingConfig {
  method: string;
  top_n?: number;
  vol_target?: number;
  custom_weights?: { [symbol: string]: number };
}

export interface ExportsConfig {
  csv: boolean;
  json: boolean;
  pdf: boolean;
}

export interface BacktestResult {
  config: StrategyConfig;
  equity_curve: EquityPoint[];
  metrics: PerformanceMetrics;
  benchmark_metrics: Record<string, PerformanceMetrics>;
  benchmark_equity: Record<string, Array<{date: string; value: number}>>;
  trades: Trade[];
  positions_history: any[];
  tax_summaries: TaxSummary[];
  lots: Lot[];
  warnings: string[];
  diagnostics: Record<string, any>;
}

export interface EquityPoint {
  date: string;
  portfolio_value: number;
  cash: number;
  positions_value: number;
}

export interface PerformanceMetrics {
  twr: number;
  irr: number;
  cagr: number;
  annual_vol: number;
  sharpe: number;
  sortino: number;
  calmar: number;
  max_drawdown: number;
  max_drawdown_duration_days: number;
  best_month: number;
  worst_month: number;
  best_quarter: number;
  worst_quarter: number;
  hit_ratio: number;
  alpha?: number;
  beta?: number;
  tracking_error?: number;
  information_ratio?: number;
}

export interface Trade {
  trade_id: string;
  date: string;
  symbol: string;
  action: string;
  quantity: number;
  price: number;
  commission: number;
  slippage: number;
  total_cost: number;
  lot_ids: string[];
  notes: string;
}

export interface Lot {
  lot_id: string;
  symbol: string;
  quantity: number;
  cost_basis: number;
  acquisition_date: string;
  is_wash_sale: boolean;
  wash_sale_disallowed: number;
}

export interface TaxSummary {
  year: number;
  short_term_gains: number;
  long_term_gains: number;
  qualified_dividends: number;
  ordinary_dividends: number;
  interest_income: number;
  total_tax: number;
  wash_sale_count: number;
}

export interface SavedStrategy {
  id: string;
  config: StrategyConfig;
  created_at: string;
  updated_at: string;
  last_run?: string;
}
