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

# 529 Plan state tax deduction limits (2024)
# Format: {state_code: {'deduction_limit': amount, 'tax_rate': estimated_rate}}
PLAN_529_STATE_BENEFITS = {
    'AL': {'deduction_limit': 5000, 'tax_rate': 0.05},
    'AZ': {'deduction_limit': 4000, 'tax_rate': 0.045},
    'AR': {'deduction_limit': 5000, 'tax_rate': 0.055},
    'CA': {'deduction_limit': 0, 'tax_rate': 0.093},  # No deduction
    'CO': {'deduction_limit': 0, 'tax_rate': 0.0455},  # Full deduction
    'CT': {'deduction_limit': 5000, 'tax_rate': 0.0699},
    'DE': {'deduction_limit': 0, 'tax_rate': 0.066},  # No deduction
    'FL': {'deduction_limit': 0, 'tax_rate': 0.0},  # No state tax
    'GA': {'deduction_limit': 4000, 'tax_rate': 0.0575},
    'IL': {'deduction_limit': 10000, 'tax_rate': 0.0495},
    'IN': {'deduction_limit': 5000, 'tax_rate': 0.0323},
    'IA': {'deduction_limit': 3522, 'tax_rate': 0.0853},
    'KS': {'deduction_limit': 3000, 'tax_rate': 0.057},
    'LA': {'deduction_limit': 2400, 'tax_rate': 0.06},
    'ME': {'deduction_limit': 0, 'tax_rate': 0.075},  # No deduction
    'MD': {'deduction_limit': 2500, 'tax_rate': 0.0575},
    'MA': {'deduction_limit': 1000, 'tax_rate': 0.05},
    'MI': {'deduction_limit': 5000, 'tax_rate': 0.0425},
    'MN': {'deduction_limit': 1500, 'tax_rate': 0.0985},
    'MS': {'deduction_limit': 10000, 'tax_rate': 0.05},
    'MO': {'deduction_limit': 8000, 'tax_rate': 0.054},
    'MT': {'deduction_limit': 3000, 'tax_rate': 0.0675},
    'NE': {'deduction_limit': 10000, 'tax_rate': 0.0684},
    'NV': {'deduction_limit': 0, 'tax_rate': 0.0},  # No state tax
    'NH': {'deduction_limit': 0, 'tax_rate': 0.0},  # No state tax
    'NJ': {'deduction_limit': 0, 'tax_rate': 0.1075},  # No deduction
    'NM': {'deduction_limit': 0, 'tax_rate': 0.059},  # Full deduction
    'NY': {'deduction_limit': 10000, 'tax_rate': 0.1090},
    'NC': {'deduction_limit': 0, 'tax_rate': 0.0525},  # No deduction
    'ND': {'deduction_limit': 5000, 'tax_rate': 0.029},
    'OH': {'deduction_limit': 4000, 'tax_rate': 0.0399},
    'OK': {'deduction_limit': 10000, 'tax_rate': 0.05},
    'OR': {'deduction_limit': 0, 'tax_rate': 0.099},  # No deduction
    'PA': {'deduction_limit': 16000, 'tax_rate': 0.0307},
    'RI': {'deduction_limit': 500, 'tax_rate': 0.0599},
    'SC': {'deduction_limit': 0, 'tax_rate': 0.07},  # Full deduction
    'SD': {'deduction_limit': 0, 'tax_rate': 0.0},  # No state tax
    'TN': {'deduction_limit': 0, 'tax_rate': 0.0},  # No state tax
    'TX': {'deduction_limit': 0, 'tax_rate': 0.0},  # No state tax
    'UT': {'deduction_limit': 0, 'tax_rate': 0.0495},  # 5% credit
    'VT': {'deduction_limit': 2500, 'tax_rate': 0.0875},
    'VA': {'deduction_limit': 4000, 'tax_rate': 0.0575},
    'WA': {'deduction_limit': 0, 'tax_rate': 0.0},  # No state tax
    'WV': {'deduction_limit': 0, 'tax_rate': 0.065},  # Full deduction
    'WI': {'deduction_limit': 3340, 'tax_rate': 0.0765},
    'WY': {'deduction_limit': 0, 'tax_rate': 0.0},  # No state tax
}


class AccountType(str, Enum):
    TAXABLE = "Taxable"
    TRADITIONAL_IRA = "Traditional IRA"
    ROTH_IRA = "Roth IRA"
    PLAN_529 = "529 Plan"


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
