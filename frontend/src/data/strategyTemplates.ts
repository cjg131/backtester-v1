/**
 * Pre-built strategy templates based on research and common investment approaches
 */

import type { StrategyConfig } from '@/types';

export interface FundAlternative {
  symbol: string;
  name: string;
  reason: string;
  expenseRatio?: number;
  provider: string;
}

export interface StrategyTemplate {
  id: string;
  name: string;
  description: string;
  category: 'Conservative' | 'Moderate' | 'Aggressive' | 'Specialized';
  riskLevel: 1 | 2 | 3 | 4 | 5;
  timeHorizon: 'Short (1-3 years)' | 'Medium (3-10 years)' | 'Long (10+ years)';
  config: Omit<StrategyConfig, 'meta'>;
  fundAlternatives?: Record<string, FundAlternative[]>; // symbol -> alternatives
  tags: string[];
  pros: string[];
  cons: string[];
}

export const STRATEGY_TEMPLATES: StrategyTemplate[] = [
  {
    id: 'three-fund-conservative',
    name: 'Three-Fund Portfolio (Conservative)',
    description: 'Classic Bogleheads approach with 60% stocks, 40% bonds for stability',
    category: 'Conservative',
    riskLevel: 2,
    timeHorizon: 'Medium (3-10 years)',
    config: {
      universe: {
        type: 'CUSTOM',
        symbols: ['VTI', 'VTIAX', 'BND']
      },
      period: {
        start: '2020-01-01',
        end: '2024-12-31',
        calendar: 'NYSE'
      },
      initial_cash: 10000,
      account: {
        type: 'Taxable',
        tax: {
          federal_ordinary: 0.24,
          federal_ltcg: 0.15,
          state: 0.06,
          qualified_dividend_pct: 0.8,
          apply_wash_sale: true,
          pay_taxes_from_external: false,
          withdrawal_tax_rate_for_ira: 0.25
        },
        contribution_caps: {
          enforce: false,
          ira: 7000,
          ira_catch_up: 1000,
          roth: 7000,
          roth_catch_up: 1000
        }
      },
      deposits: {
        cadence: 'monthly',
        amount: 500,
        day_rule: '1',
        market_day_everyday: false
      },
      dividends: {
        mode: 'CASH',
        reinvest_threshold_pct: 0
      },
      rebalancing: {
        type: 'calendar',
        calendar: { period: 'Q' }
      },
      orders: { timing: 'MOO' },
      lots: { method: 'HIFO' },
      frictions: {
        commission_per_trade: 0,
        slippage_bps: 5,
        use_actual_etf_er: true,
        equity_borrow_bps: 0
      },
      signals: [],
      rules: { entry: [], exit: [] },
      position_sizing: {
        method: 'CUSTOM_WEIGHTS',
        custom_weights: {
          'VTI': 0.36,    // 36% US Total Market
          'VTIAX': 0.24,  // 24% International
          'BND': 0.40     // 40% Bonds
        }
      },
      benchmark: ['SPY'],
      exports: { csv: true, json: true, pdf: false }
    },
    fundAlternatives: {
      'VTI': [
        { symbol: 'SWTSX', name: 'Schwab Total Stock Market Index', reason: 'Lower expense ratio (0.03%)', expenseRatio: 0.03, provider: 'Schwab' },
        { symbol: 'FZROX', name: 'Fidelity ZERO Total Market Index', reason: 'Zero expense ratio', expenseRatio: 0.0, provider: 'Fidelity' },
        { symbol: 'ITOT', name: 'iShares Core S&P Total US Stock Market', reason: 'Alternative provider, similar exposure', expenseRatio: 0.03, provider: 'iShares' }
      ],
      'VTIAX': [
        { symbol: 'FTIHX', name: 'Fidelity Total International Index', reason: 'Lower expense ratio (0.06%)', expenseRatio: 0.06, provider: 'Fidelity' },
        { symbol: 'SWISX', name: 'Schwab International Index', reason: 'Schwab alternative with low fees', expenseRatio: 0.06, provider: 'Schwab' },
        { symbol: 'IXUS', name: 'iShares Core MSCI Total International Stock', reason: 'iShares alternative', expenseRatio: 0.09, provider: 'iShares' }
      ],
      'BND': [
        { symbol: 'FXNAX', name: 'Fidelity US Bond Index', reason: 'Lower expense ratio (0.025%)', expenseRatio: 0.025, provider: 'Fidelity' },
        { symbol: 'SWAGX', name: 'Schwab US Aggregate Bond Index', reason: 'Schwab alternative', expenseRatio: 0.04, provider: 'Schwab' },
        { symbol: 'AGG', name: 'iShares Core US Aggregate Bond', reason: 'Most liquid bond ETF', expenseRatio: 0.03, provider: 'iShares' }
      ]
    },
    tags: ['Bogleheads', 'Diversified', 'Low-cost', 'Stable'],
    pros: [
      'Well-diversified across asset classes',
      'Low expense ratios with Vanguard funds',
      'Proven long-term track record',
      'Simple to understand and maintain'
    ],
    cons: [
      'Lower expected returns than stock-heavy portfolios',
      'Bond allocation may drag performance in bull markets',
      'Requires periodic rebalancing'
    ]
  },
  
  {
    id: 'aggressive-growth',
    name: 'Aggressive Growth',
    description: '90% stocks, 10% bonds for maximum long-term growth potential',
    category: 'Aggressive',
    riskLevel: 4,
    timeHorizon: 'Long (10+ years)',
    config: {
      universe: {
        type: 'CUSTOM',
        symbols: ['VTI', 'VTIAX', 'BND']
      },
      period: {
        start: '2020-01-01',
        end: '2024-12-31',
        calendar: 'NYSE'
      },
      initial_cash: 10000,
      account: {
        type: 'Roth IRA',
        tax: {
          federal_ordinary: 0.24,
          federal_ltcg: 0.15,
          state: 0.06,
          qualified_dividend_pct: 0.8,
          apply_wash_sale: false,
          pay_taxes_from_external: false,
          withdrawal_tax_rate_for_ira: 0.0
        },
        contribution_caps: {
          enforce: true,
          ira: 7000,
          ira_catch_up: 1000,
          roth: 7000,
          roth_catch_up: 1000
        }
      },
      deposits: {
        cadence: 'monthly',
        amount: 583,  // ~$7000/year for IRA limit
        day_rule: '1',
        market_day_everyday: false
      },
      dividends: {
        mode: 'DRIP',
        reinvest_threshold_pct: 0
      },
      rebalancing: {
        type: 'calendar',
        calendar: { period: 'A' }
      },
      orders: { timing: 'MOO' },
      lots: { method: 'HIFO' },
      frictions: {
        commission_per_trade: 0,
        slippage_bps: 5,
        use_actual_etf_er: true,
        equity_borrow_bps: 0
      },
      signals: [],
      rules: { entry: [], exit: [] },
      position_sizing: {
        method: 'CUSTOM_WEIGHTS',
        custom_weights: {
          'VTI': 0.54,    // 54% US Total Market
          'VTIAX': 0.36,  // 36% International
          'BND': 0.10     // 10% Bonds
        }
      },
      benchmark: ['SPY'],
      exports: { csv: true, json: true, pdf: false }
    },
    fundAlternatives: {
      'VTI': [
        { symbol: 'SWTSX', name: 'Schwab Total Stock Market Index', reason: 'Lower expense ratio (0.03%)', expenseRatio: 0.03, provider: 'Schwab' },
        { symbol: 'FZROX', name: 'Fidelity ZERO Total Market Index', reason: 'Zero expense ratio', expenseRatio: 0.0, provider: 'Fidelity' },
        { symbol: 'ITOT', name: 'iShares Core S&P Total US Stock Market', reason: 'Alternative provider', expenseRatio: 0.03, provider: 'iShares' }
      ],
      'VTIAX': [
        { symbol: 'FTIHX', name: 'Fidelity Total International Index', reason: 'Lower expense ratio (0.06%)', expenseRatio: 0.06, provider: 'Fidelity' },
        { symbol: 'SWISX', name: 'Schwab International Index', reason: 'Schwab alternative', expenseRatio: 0.06, provider: 'Schwab' },
        { symbol: 'IXUS', name: 'iShares Core MSCI Total International Stock', reason: 'iShares alternative', expenseRatio: 0.09, provider: 'iShares' }
      ],
      'BND': [
        { symbol: 'FXNAX', name: 'Fidelity US Bond Index', reason: 'Lower expense ratio (0.025%)', expenseRatio: 0.025, provider: 'Fidelity' },
        { symbol: 'SWAGX', name: 'Schwab US Aggregate Bond Index', reason: 'Schwab alternative', expenseRatio: 0.04, provider: 'Schwab' },
        { symbol: 'AGG', name: 'iShares Core US Aggregate Bond', reason: 'Most liquid bond ETF', expenseRatio: 0.03, provider: 'iShares' }
      ]
    },
    tags: ['High-growth', 'Long-term', 'Tax-free', 'Aggressive'],
    pros: [
      'Maximum growth potential over long periods',
      'Tax-free growth in Roth IRA',
      'Global diversification',
      'Annual rebalancing reduces maintenance'
    ],
    cons: [
      'High volatility and potential for large losses',
      'Not suitable for short-term goals',
      'Requires strong risk tolerance',
      'Limited contribution amounts'
    ]
  },
  
  {
    id: 'dividend-income',
    name: 'Dividend Income Focus',
    description: 'High-quality dividend stocks and REITs for steady income',
    category: 'Moderate',
    riskLevel: 3,
    timeHorizon: 'Medium (3-10 years)',
    config: {
      universe: {
        type: 'CUSTOM',
        symbols: ['VYM', 'SCHD', 'VNQ', 'BND']
      },
      period: {
        start: '2020-01-01',
        end: '2024-12-31',
        calendar: 'NYSE'
      },
      initial_cash: 10000,
      account: {
        type: 'Taxable',
        tax: {
          federal_ordinary: 0.24,
          federal_ltcg: 0.15,
          state: 0.06,
          qualified_dividend_pct: 0.8,
          apply_wash_sale: true,
          pay_taxes_from_external: false,
          withdrawal_tax_rate_for_ira: 0.25
        },
        contribution_caps: {
          enforce: false,
          ira: 7000,
          ira_catch_up: 1000,
          roth: 7000,
          roth_catch_up: 1000
        }
      },
      deposits: {
        cadence: 'monthly',
        amount: 750,
        day_rule: '1',
        market_day_everyday: false
      },
      dividends: {
        mode: 'CASH',
        reinvest_threshold_pct: 0
      },
      rebalancing: {
        type: 'calendar',
        calendar: { period: 'Q' }
      },
      orders: { timing: 'MOO' },
      lots: { method: 'HIFO' },
      frictions: {
        commission_per_trade: 0,
        slippage_bps: 5,
        use_actual_etf_er: true,
        equity_borrow_bps: 0
      },
      signals: [],
      rules: { entry: [], exit: [] },
      position_sizing: {
        method: 'CUSTOM_WEIGHTS',
        custom_weights: {
          'VYM': 0.40,   // 40% High Dividend Yield
          'SCHD': 0.30,  // 30% Dividend Appreciation
          'VNQ': 0.15,   // 15% REITs
          'BND': 0.15    // 15% Bonds
        }
      },
      benchmark: ['SPY'],
      exports: { csv: true, json: true, pdf: false }
    },
    fundAlternatives: {
      'VYM': [
        { symbol: 'SCHD', name: 'Schwab US Dividend Equity ETF', reason: 'Quality-focused dividend screening', expenseRatio: 0.06, provider: 'Schwab' },
        { symbol: 'DVY', name: 'iShares Select Dividend ETF', reason: 'Different dividend methodology', expenseRatio: 0.38, provider: 'iShares' },
        { symbol: 'NOBL', name: 'ProShares S&P 500 Dividend Aristocrats', reason: 'Dividend growth focus', expenseRatio: 0.35, provider: 'ProShares' }
      ],
      'SCHD': [
        { symbol: 'VYM', name: 'Vanguard High Dividend Yield ETF', reason: 'Lower expense ratio (0.06%)', expenseRatio: 0.06, provider: 'Vanguard' },
        { symbol: 'DGRO', name: 'iShares Core Dividend Growth ETF', reason: 'Dividend growth focus', expenseRatio: 0.08, provider: 'iShares' },
        { symbol: 'HDV', name: 'iShares Core High Dividend ETF', reason: 'High-quality dividend focus', expenseRatio: 0.08, provider: 'iShares' }
      ],
      'VNQ': [
        { symbol: 'SCHH', name: 'Schwab US REIT ETF', reason: 'Lower expense ratio (0.07%)', expenseRatio: 0.07, provider: 'Schwab' },
        { symbol: 'IYR', name: 'iShares US Real Estate ETF', reason: 'Alternative REIT exposure', expenseRatio: 0.42, provider: 'iShares' },
        { symbol: 'FREL', name: 'Fidelity MSCI Real Estate Index ETF', reason: 'Fidelity alternative', expenseRatio: 0.08, provider: 'Fidelity' }
      ],
      'BND': [
        { symbol: 'FXNAX', name: 'Fidelity US Bond Index', reason: 'Lower expense ratio (0.025%)', expenseRatio: 0.025, provider: 'Fidelity' },
        { symbol: 'SWAGX', name: 'Schwab US Aggregate Bond Index', reason: 'Schwab alternative', expenseRatio: 0.04, provider: 'Schwab' },
        { symbol: 'AGG', name: 'iShares Core US Aggregate Bond', reason: 'Most liquid bond ETF', expenseRatio: 0.03, provider: 'iShares' }
      ]
    },
    tags: ['Income', 'Dividends', 'REITs', 'Steady'],
    pros: [
      'Regular dividend income',
      'Quality companies with strong fundamentals',
      'Real estate diversification through REITs',
      'Lower volatility than growth stocks'
    ],
    cons: [
      'Dividend taxes in taxable accounts',
      'May underperform in growth markets',
      'Interest rate sensitivity',
      'Sector concentration risk'
    ]
  },
  
  {
    id: 'tech-growth',
    name: 'Technology Growth',
    description: 'Focus on technology sector for high growth potential',
    category: 'Aggressive',
    riskLevel: 5,
    timeHorizon: 'Long (10+ years)',
    config: {
      universe: {
        type: 'CUSTOM',
        symbols: ['QQQ', 'VGT', 'ARKK', 'BND']
      },
      period: {
        start: '2020-01-01',
        end: '2024-12-31',
        calendar: 'NYSE'
      },
      initial_cash: 10000,
      account: {
        type: 'Roth IRA',
        tax: {
          federal_ordinary: 0.24,
          federal_ltcg: 0.15,
          state: 0.06,
          qualified_dividend_pct: 0.8,
          apply_wash_sale: false,
          pay_taxes_from_external: false,
          withdrawal_tax_rate_for_ira: 0.0
        },
        contribution_caps: {
          enforce: true,
          ira: 7000,
          ira_catch_up: 1000,
          roth: 7000,
          roth_catch_up: 1000
        }
      },
      deposits: {
        cadence: 'monthly',
        amount: 583,
        day_rule: '1',
        market_day_everyday: false
      },
      dividends: {
        mode: 'DRIP',
        reinvest_threshold_pct: 0
      },
      rebalancing: {
        type: 'calendar',
        calendar: { period: 'Q' }
      },
      orders: { timing: 'MOO' },
      lots: { method: 'HIFO' },
      frictions: {
        commission_per_trade: 0,
        slippage_bps: 5,
        use_actual_etf_er: true,
        equity_borrow_bps: 0
      },
      signals: [],
      rules: { entry: [], exit: [] },
      position_sizing: {
        method: 'CUSTOM_WEIGHTS',
        custom_weights: {
          'QQQ': 0.40,   // 40% Nasdaq 100
          'VGT': 0.30,   // 30% Technology Sector
          'ARKK': 0.20,  // 20% Innovation ETF
          'BND': 0.10    // 10% Bonds
        }
      },
      benchmark: ['QQQ'],
      exports: { csv: true, json: true, pdf: false }
    },
    fundAlternatives: {
      'QQQ': [
        { symbol: 'VGT', name: 'Vanguard Information Technology ETF', reason: 'Pure tech sector, lower fees (0.10%)', expenseRatio: 0.10, provider: 'Vanguard' },
        { symbol: 'XLK', name: 'Technology Select Sector SPDR Fund', reason: 'S&P tech sector focus', expenseRatio: 0.12, provider: 'SPDR' },
        { symbol: 'FTEC', name: 'Fidelity MSCI Information Technology ETF', reason: 'Fidelity tech alternative', expenseRatio: 0.084, provider: 'Fidelity' }
      ],
      'VGT': [
        { symbol: 'QQQ', name: 'Invesco QQQ Trust ETF', reason: 'Nasdaq-100 exposure, more diversified', expenseRatio: 0.20, provider: 'Invesco' },
        { symbol: 'XLK', name: 'Technology Select Sector SPDR Fund', reason: 'S&P tech sector', expenseRatio: 0.12, provider: 'SPDR' },
        { symbol: 'FTEC', name: 'Fidelity MSCI Information Technology ETF', reason: 'Lower expense ratio (0.084%)', expenseRatio: 0.084, provider: 'Fidelity' }
      ],
      'ARKK': [
        { symbol: 'ARKQ', name: 'ARK Autonomous Technology & Robotics ETF', reason: 'Robotics and AI focus', expenseRatio: 0.75, provider: 'ARK' },
        { symbol: 'ARKG', name: 'ARK Genomic Revolution ETF', reason: 'Genomics innovation focus', expenseRatio: 0.75, provider: 'ARK' },
        { symbol: 'ARKW', name: 'ARK Next Generation Internet ETF', reason: 'Internet innovation focus', expenseRatio: 0.75, provider: 'ARK' }
      ],
      'BND': [
        { symbol: 'FXNAX', name: 'Fidelity US Bond Index', reason: 'Lower expense ratio (0.025%)', expenseRatio: 0.025, provider: 'Fidelity' },
        { symbol: 'SWAGX', name: 'Schwab US Aggregate Bond Index', reason: 'Schwab alternative', expenseRatio: 0.04, provider: 'Schwab' },
        { symbol: 'AGG', name: 'iShares Core US Aggregate Bond', reason: 'Most liquid bond ETF', expenseRatio: 0.03, provider: 'iShares' }
      ]
    },
    tags: ['Technology', 'Growth', 'Innovation', 'High-risk'],
    pros: [
      'Exposure to leading technology companies',
      'High growth potential',
      'Innovation-focused investments',
      'Tax-free growth in Roth IRA'
    ],
    cons: [
      'Extremely high volatility',
      'Sector concentration risk',
      'Susceptible to tech bubbles',
      'May underperform in bear markets'
    ]
  },
  
  {
    id: 'college-529',
    name: 'College Savings (529 Plan)',
    description: 'Age-appropriate allocation for education savings with tax benefits',
    category: 'Moderate',
    riskLevel: 3,
    timeHorizon: 'Medium (3-10 years)',
    config: {
      universe: {
        type: 'CUSTOM',
        symbols: ['VTI', 'BND', 'VTEB']
      },
      period: {
        start: '2020-01-01',
        end: '2024-12-31',
        calendar: 'NYSE'
      },
      initial_cash: 5000,
      account: {
        type: '529 Plan',
        state: 'NY',
        tax: {
          federal_ordinary: 0.24,
          federal_ltcg: 0.0,  // Tax-free growth
          state: 0.0,         // Tax-free growth
          qualified_dividend_pct: 1.0,
          apply_wash_sale: false,
          pay_taxes_from_external: false,
          withdrawal_tax_rate_for_ira: 0.0
        },
        contribution_caps: {
          enforce: false,
          ira: 7000,
          ira_catch_up: 1000,
          roth: 7000,
          roth_catch_up: 1000
        }
      },
      deposits: {
        cadence: 'monthly',
        amount: 300,
        day_rule: '1',
        market_day_everyday: false
      },
      dividends: {
        mode: 'CASH',
        reinvest_threshold_pct: 0
      },
      rebalancing: {
        type: 'calendar',
        calendar: { period: 'A' }
      },
      orders: { timing: 'MOO' },
      lots: { method: 'FIFO' },
      frictions: {
        commission_per_trade: 0,
        slippage_bps: 5,
        use_actual_etf_er: true,
        equity_borrow_bps: 0
      },
      signals: [],
      rules: { entry: [], exit: [] },
      position_sizing: {
        method: 'CUSTOM_WEIGHTS',
        custom_weights: {
          'VTI': 0.60,   // 60% US Total Market
          'BND': 0.30,   // 30% Total Bond Market
          'VTEB': 0.10   // 10% Tax-Exempt Bonds
        }
      },
      benchmark: ['SPY'],
      exports: { csv: true, json: true, pdf: false }
    },
    fundAlternatives: {
      'VTI': [
        { symbol: 'SWTSX', name: 'Schwab Total Stock Market Index', reason: 'Lower expense ratio (0.03%)', expenseRatio: 0.03, provider: 'Schwab' },
        { symbol: 'FZROX', name: 'Fidelity ZERO Total Market Index', reason: 'Zero expense ratio', expenseRatio: 0.0, provider: 'Fidelity' },
        { symbol: 'ITOT', name: 'iShares Core S&P Total US Stock Market', reason: 'Alternative provider', expenseRatio: 0.03, provider: 'iShares' }
      ],
      'BND': [
        { symbol: 'FXNAX', name: 'Fidelity US Bond Index', reason: 'Lower expense ratio (0.025%)', expenseRatio: 0.025, provider: 'Fidelity' },
        { symbol: 'SWAGX', name: 'Schwab US Aggregate Bond Index', reason: 'Schwab alternative', expenseRatio: 0.04, provider: 'Schwab' },
        { symbol: 'AGG', name: 'iShares Core US Aggregate Bond', reason: 'Most liquid bond ETF', expenseRatio: 0.03, provider: 'iShares' }
      ],
      'VTEB': [
        { symbol: 'MUB', name: 'iShares National Muni Bond ETF', reason: 'iShares municipal bond alternative', expenseRatio: 0.05, provider: 'iShares' },
        { symbol: 'MUNI', name: 'PIMCO Intermediate Municipal Bond Active ETF', reason: 'Active management approach', expenseRatio: 0.35, provider: 'PIMCO' },
        { symbol: 'TFI', name: 'SPDR Nuveen Bloomberg Municipal Bond ETF', reason: 'SPDR alternative', expenseRatio: 0.23, provider: 'SPDR' }
      ]
    },
    tags: ['Education', '529', 'Tax-advantaged', 'Goal-based'],
    pros: [
      'Tax-free growth for education expenses',
      'State tax deductions (varies by state)',
      'Age-appropriate risk level',
      'Flexible beneficiary changes'
    ],
    cons: [
      '10% penalty for non-qualified withdrawals',
      'Limited to education expenses',
      'State plan restrictions may apply',
      'Investment options may be limited'
    ]
  }
];

export const getTemplatesByCategory = (category?: string) => {
  if (!category) return STRATEGY_TEMPLATES;
  return STRATEGY_TEMPLATES.filter(template => template.category === category);
};

export const getTemplatesByRiskLevel = (maxRisk: number) => {
  return STRATEGY_TEMPLATES.filter(template => template.riskLevel <= maxRisk);
};

export const getTemplateById = (id: string) => {
  return STRATEGY_TEMPLATES.find(template => template.id === id);
};
