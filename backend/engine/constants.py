"""
Constants for the backtesting engine.
Update IRS limits annually.
"""

from enum import Enum

# IRS Contribution Limits (2024)
IRA_CONTRIBUTION_LIMIT = 7000
IRA_CATCHUP_LIMIT = 1000
ROTH_CONTRIBUTION_LIMIT = 7000
ROTH_CATCHUP_LIMIT = 1000

# Tax holding periods
SHORT_TERM_DAYS = 365  # <= 365 days is short-term
WASH_SALE_DAYS = 30    # 30 days before/after for wash sale

# Trading defaults
DEFAULT_SLIPPAGE_BPS = 5
DEFAULT_COMMISSION = 0.0
TRADING_DAYS_PER_YEAR = 252


class AccountType(str, Enum):
    TAXABLE = "Taxable"
    TRADITIONAL_IRA = "Traditional IRA"
    ROTH_IRA = "Roth IRA"


class LotMethod(str, Enum):
    FIFO = "FIFO"
    LIFO = "LIFO"
    HIFO = "HIFO"  # Highest-in, first-out (tax-optimized)


class OrderTiming(str, Enum):
    MOO = "MOO"  # Market-on-Open
    MOC = "MOC"  # Market-on-Close


class DividendMode(str, Enum):
    DRIP = "DRIP"
    CASH = "CASH"


class RebalanceType(str, Enum):
    CALENDAR = "calendar"
    DRIFT = "drift"
    BOTH = "both"
    CASHFLOW_ONLY = "cashflow_only"


class DepositCadence(str, Enum):
    DAILY = "daily"
    WEEKLY = "weekly"
    MONTHLY = "monthly"
    QUARTERLY = "quarterly"
    YEARLY = "yearly"
    EVERY_MARKET_DAY = "every_market_day"


class CalendarPeriod(str, Enum):
    DAILY = "D"
    WEEKLY = "W"
    MONTHLY = "M"
    QUARTERLY = "Q"
    YEARLY = "A"
