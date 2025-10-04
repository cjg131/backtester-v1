"""
Data models for the backtesting engine.
"""

from datetime import datetime, date
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field
from engine.constants import (
    AccountType, LotMethod, OrderTiming, DividendMode,
    RebalanceType, DepositCadence, CalendarPeriod
)


class Bar(BaseModel):
    """OHLCV bar data"""
    date: str
    open: float
    high: float
    low: float
    close: float
    adj_close: float
    volume: float


class Dividend(BaseModel):
    """Dividend payment"""
    ex_date: str
    pay_date: Optional[str] = None
    amount: float
    qualified_pct: Optional[float] = 1.0  # Default 100% qualified


class Split(BaseModel):
    """Stock split"""
    ex_date: str
    ratio: float  # 2.0 = 2-for-1 split


class Lot(BaseModel):
    """Tax lot for position tracking"""
    lot_id: str
    symbol: str
    quantity: float
    cost_basis: float  # Total cost basis for this lot
    acquisition_date: str
    is_wash_sale: bool = False
    wash_sale_disallowed: float = 0.0


class Trade(BaseModel):
    """Executed trade"""
    trade_id: str
    date: str
    symbol: str
    action: str  # BUY, SELL, DRIP, DIVIDEND
    quantity: float
    price: float
    commission: float
    slippage: float
    total_cost: float  # Negative for sells, positive for dividends
    lot_ids: List[str] = Field(default_factory=list)  # For sells
    notes: str = ""


class Position(BaseModel):
    """Current position in a symbol"""
    symbol: str
    quantity: float
    market_value: float
    cost_basis: float
    unrealized_gain: float
    lots: List[Lot]


class TaxConfig(BaseModel):
    """Tax configuration"""
    federal_ordinary: float = 0.32
    federal_ltcg: float = 0.15
    state: float = 0.06
    qualified_dividend_pct: float = 0.8
    apply_wash_sale: bool = True
    pay_taxes_from_external: bool = False
    withdrawal_tax_rate_for_ira: float = 0.25


class ContributionCaps(BaseModel):
    """IRA/Roth contribution limits"""
    enforce: bool = True
    ira: float = 7000
    ira_catch_up: float = 1000
    roth: float = 7000
    roth_catch_up: float = 1000


class AccountConfig(BaseModel):
    """Account configuration"""
    type: AccountType
    tax: TaxConfig = Field(default_factory=TaxConfig)
    contribution_caps: ContributionCaps = Field(default_factory=ContributionCaps)


class UniverseConfig(BaseModel):
    """Universe definition"""
    type: str = "CUSTOM"  # CUSTOM, US_STOCKS, ETF, BOND_ETF
    symbols: List[str]


class PeriodConfig(BaseModel):
    """Backtest period"""
    start: str
    end: str
    calendar: str = "NYSE"


class DepositConfig(BaseModel):
    """Deposit/cashflow configuration"""
    cadence: DepositCadence
    amount: float
    day_rule: str = "FIRST_BUSINESS_DAY"
    market_day_everyday: bool = False


class DividendConfig(BaseModel):
    """Dividend handling"""
    mode: DividendMode = DividendMode.DRIP
    reinvest_threshold_pct: float = 0.0


class CalendarRebalanceConfig(BaseModel):
    """Calendar-based rebalancing"""
    period: CalendarPeriod


class DriftRebalanceConfig(BaseModel):
    """Drift-based rebalancing"""
    abs_pct: Optional[float] = None
    rel_pct: Optional[float] = None


class RebalancingConfig(BaseModel):
    """Rebalancing configuration"""
    type: RebalanceType
    calendar: Optional[CalendarRebalanceConfig] = None
    drift: Optional[DriftRebalanceConfig] = None


class OrderConfig(BaseModel):
    """Order execution configuration"""
    timing: OrderTiming = OrderTiming.MOO


class LotConfig(BaseModel):
    """Lot selection method"""
    method: LotMethod = LotMethod.HIFO


class FrictionsConfig(BaseModel):
    """Trading frictions"""
    commission_per_trade: float = 0.0
    slippage_bps: float = 5.0
    use_actual_etf_er: bool = True
    equity_borrow_bps: float = 0.0


class Signal(BaseModel):
    """Signal definition"""
    id: str
    type: str
    params: Dict[str, Any] = Field(default_factory=dict)


class Rule(BaseModel):
    """Entry/exit rule"""
    signal: str
    op: str  # CROSS_UP, CROSS_DOWN, ABOVE, BELOW, etc.


class RulesConfig(BaseModel):
    """Entry/exit rules"""
    entry: List[Rule] = Field(default_factory=list)
    exit: List[Rule] = Field(default_factory=list)


class PositionSizingConfig(BaseModel):
    """Position sizing method"""
    method: str = "EQUAL_WEIGHT"
    top_n: Optional[int] = None
    vol_target: Optional[float] = None


class ExportsConfig(BaseModel):
    """Export options"""
    csv: bool = True
    json: bool = True
    pdf: bool = False


class StrategyConfig(BaseModel):
    """Complete strategy configuration"""
    meta: Dict[str, str] = Field(default_factory=lambda: {"name": "Untitled", "notes": ""})
    universe: UniverseConfig
    period: PeriodConfig
    initial_cash: float
    account: AccountConfig
    deposits: Optional[DepositConfig] = None
    dividends: DividendConfig = Field(default_factory=DividendConfig)
    rebalancing: RebalancingConfig
    orders: OrderConfig = Field(default_factory=OrderConfig)
    lots: LotConfig = Field(default_factory=LotConfig)
    frictions: FrictionsConfig = Field(default_factory=FrictionsConfig)
    signals: List[Signal] = Field(default_factory=list)
    rules: RulesConfig = Field(default_factory=RulesConfig)
    position_sizing: PositionSizingConfig = Field(default_factory=PositionSizingConfig)
    benchmark: List[str] = Field(default_factory=lambda: ["SPY"])
    exports: ExportsConfig = Field(default_factory=ExportsConfig)


class PerformanceMetrics(BaseModel):
    """Performance metrics"""
    twr: float  # Time-weighted return
    irr: float  # Internal rate of return
    cagr: float
    annual_vol: float
    sharpe: float
    sortino: float
    calmar: float
    max_drawdown: float
    max_drawdown_duration_days: int
    best_month: float
    worst_month: float
    best_quarter: float
    worst_quarter: float
    hit_ratio: float
    alpha: Optional[float] = None
    beta: Optional[float] = None
    tracking_error: Optional[float] = None
    information_ratio: Optional[float] = None


class TaxSummary(BaseModel):
    """Annual tax summary"""
    year: int
    short_term_gains: float
    long_term_gains: float
    qualified_dividends: float
    ordinary_dividends: float
    interest_income: float
    total_tax: float
    wash_sale_count: int


class BacktestResult(BaseModel):
    """Complete backtest results"""
    config: StrategyConfig
    equity_curve: List[Dict[str, Any]]  # date, portfolio_value, cash, positions_value
    metrics: PerformanceMetrics
    benchmark_metrics: Dict[str, PerformanceMetrics]
    trades: List[Trade]
    positions_history: List[Dict[str, Any]]
    tax_summaries: List[TaxSummary]
    lots: List[Lot]
    warnings: List[str]
    diagnostics: Dict[str, Any]
