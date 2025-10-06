/**
 * Comprehensive security information for ETFs and stocks
 */

export interface SecurityInfo {
  symbol: string;
  name: string;
  type?: string;
  category: string;
  description: string;
  expenseRatio?: number;
  dividendYield?: number;
  inception?: string;
  aum?: string;
  holdings?: string;
  topHoldings?: Array<{ name: string; weight: number }>;
  sectors?: Array<{ name: string; weight: number }>;
  pros: string[];
  cons: string[];
  keyFeatures: string[];
  riskLevel: 1 | 2 | 3 | 4 | 5;
  website?: string;
}

export const SECURITY_INFO: Record<string, SecurityInfo> = {
  // Broad Market ETFs
  'VTI': {
    symbol: 'VTI',
    name: 'Vanguard Total Stock Market ETF',
    type: 'ETF',
    category: 'US Total Market',
    description: 'Tracks the entire US stock market, including small-, mid-, and large-cap growth and value stocks.',
    expenseRatio: 0.03,
    dividendYield: 1.3,
    inception: '2001',
    aum: '$300B+',
    holdings: '4,000+',
    topHoldings: [
      { name: 'Apple Inc.', weight: 7.2 },
      { name: 'Microsoft Corp.', weight: 6.8 },
      { name: 'Amazon.com Inc.', weight: 3.4 },
      { name: 'Alphabet Inc.', weight: 3.1 },
      { name: 'Tesla Inc.', weight: 2.1 }
    ],
    sectors: [
      { name: 'Technology', weight: 28.1 },
      { name: 'Consumer Discretionary', weight: 14.2 },
      { name: 'Industrials', weight: 13.1 },
      { name: 'Healthcare', weight: 12.8 },
      { name: 'Financials', weight: 12.4 }
    ],
    pros: [
      'Ultra-low expense ratio (0.03%)',
      'Complete US market exposure',
      'Excellent diversification',
      'Tax-efficient structure'
    ],
    cons: [
      'No international exposure',
      'Market-cap weighted (concentrated in large caps)',
      'No downside protection'
    ],
    keyFeatures: [
      'One-fund solution for US equity exposure',
      'Includes small-cap stocks unlike S&P 500',
      'Perfect core holding for portfolios'
    ],
    riskLevel: 3,
    website: 'https://investor.vanguard.com/etf/profile/VTI'
  },

  'VTIAX': {
    symbol: 'VTIAX',
    name: 'Vanguard Total International Stock Index Fund',
    type: 'ETF',
    category: 'International Developed + Emerging',
    description: 'Provides broad exposure to international developed and emerging markets, excluding the US.',
    expenseRatio: 0.11,
    dividendYield: 2.8,
    inception: '2010',
    aum: '$50B+',
    holdings: '8,000+',
    topHoldings: [
      { name: 'Taiwan Semiconductor', weight: 1.8 },
      { name: 'Nestle SA', weight: 1.2 },
      { name: 'Samsung Electronics', weight: 1.1 },
      { name: 'ASML Holding NV', weight: 0.9 },
      { name: 'Tencent Holdings', weight: 0.8 }
    ],
    sectors: [
      { name: 'Technology', weight: 18.2 },
      { name: 'Financials', weight: 16.8 },
      { name: 'Consumer Discretionary', weight: 12.1 },
      { name: 'Industrials', weight: 11.4 },
      { name: 'Healthcare', weight: 10.2 }
    ],
    pros: [
      'Geographic diversification outside US',
      'Includes emerging markets',
      'Low expense ratio for international fund',
      'Currency diversification'
    ],
    cons: [
      'Higher expense ratio than US funds',
      'Currency risk',
      'Political and regulatory risks',
      'Lower historical returns than US'
    ],
    keyFeatures: [
      'Covers both developed and emerging markets',
      'Complements US stock holdings perfectly',
      'Includes thousands of international companies'
    ],
    riskLevel: 4,
    website: 'https://investor.vanguard.com/mutual-funds/profile/VTIAX'
  },

  'BND': {
    symbol: 'BND',
    name: 'Vanguard Total Bond Market ETF',
    type: 'ETF',
    category: 'US Aggregate Bonds',
    description: 'Tracks the Bloomberg US Aggregate Float Adjusted Index, representing the broad US bond market.',
    expenseRatio: 0.03,
    dividendYield: 4.2,
    inception: '2007',
    aum: '$90B+',
    holdings: '10,000+',
    topHoldings: [
      { name: 'US Treasury Notes', weight: 42.1 },
      { name: 'US Treasury Bonds', weight: 23.8 },
      { name: 'Mortgage-Backed Securities', weight: 26.1 },
      { name: 'Corporate Bonds', weight: 8.0 }
    ],
    sectors: [
      { name: 'Government', weight: 65.9 },
      { name: 'Corporate', weight: 25.8 },
      { name: 'Securitized', weight: 8.3 }
    ],
    pros: [
      'Broad bond market exposure',
      'Ultra-low expense ratio',
      'High credit quality',
      'Inflation hedge potential'
    ],
    cons: [
      'Interest rate risk',
      'Low yields in current environment',
      'Credit risk from corporate bonds',
      'Duration risk'
    ],
    keyFeatures: [
      'Core bond holding for portfolios',
      'Government and corporate bonds',
      'Average duration of 6.2 years'
    ],
    riskLevel: 2,
    website: 'https://investor.vanguard.com/etf/profile/BND'
  },

  'VYM': {
    symbol: 'VYM',
    name: 'Vanguard High Dividend Yield ETF',
    type: 'ETF',
    category: 'High Dividend Yield',
    description: 'Focuses on stocks that pay above-average dividends, excluding REITs.',
    expenseRatio: 0.06,
    dividendYield: 2.9,
    inception: '2006',
    aum: '$50B+',
    holdings: '440+',
    topHoldings: [
      { name: 'JPMorgan Chase & Co.', weight: 3.8 },
      { name: 'Johnson & Johnson', weight: 3.6 },
      { name: 'Exxon Mobil Corp.', weight: 3.2 },
      { name: 'Procter & Gamble Co.', weight: 2.9 },
      { name: 'Home Depot Inc.', weight: 2.7 }
    ],
    sectors: [
      { name: 'Financials', weight: 21.2 },
      { name: 'Healthcare', weight: 14.8 },
      { name: 'Consumer Staples', weight: 13.1 },
      { name: 'Energy', weight: 11.4 },
      { name: 'Utilities', weight: 8.9 }
    ],
    pros: [
      'High dividend yield',
      'Quality dividend-paying companies',
      'Lower volatility than growth stocks',
      'Regular income stream'
    ],
    cons: [
      'Lower growth potential',
      'Sector concentration in value stocks',
      'Dividend cuts during recessions',
      'Tax inefficient in taxable accounts'
    ],
    keyFeatures: [
      'Focuses on sustainable dividend payers',
      'Excludes REITs for pure equity exposure',
      'Quarterly dividend distributions'
    ],
    riskLevel: 3,
    website: 'https://investor.vanguard.com/etf/profile/VYM'
  },

  'SCHD': {
    symbol: 'SCHD',
    name: 'Schwab US Dividend Equity ETF',
    type: 'ETF',
    category: 'Dividend Appreciation',
    description: 'Tracks companies with a record of consistently paying dividends, selected for quality and sustainability.',
    expenseRatio: 0.06,
    dividendYield: 3.5,
    inception: '2011',
    aum: '$35B+',
    holdings: '100+',
    topHoldings: [
      { name: 'Broadcom Inc.', weight: 4.2 },
      { name: 'Texas Instruments Inc.', weight: 3.8 },
      { name: 'AbbVie Inc.', weight: 3.6 },
      { name: 'Coca-Cola Co.', weight: 3.4 },
      { name: 'PepsiCo Inc.', weight: 3.2 }
    ],
    sectors: [
      { name: 'Technology', weight: 23.1 },
      { name: 'Healthcare', weight: 18.2 },
      { name: 'Financials', weight: 16.4 },
      { name: 'Consumer Staples', weight: 12.8 },
      { name: 'Industrials', weight: 11.2 }
    ],
    pros: [
      'Quality-focused dividend screening',
      'Dividend growth potential',
      'Lower concentration than VYM',
      'Strong historical performance'
    ],
    cons: [
      'Higher expense ratio than Vanguard',
      'Only 100 holdings vs broader funds',
      'Potential sector concentration',
      'Relatively new fund (2011)'
    ],
    keyFeatures: [
      'Quality and sustainability screening',
      'Focus on dividend growth, not just yield',
      'Quarterly rebalancing'
    ],
    riskLevel: 3,
    website: 'https://www.schwabassetmanagement.com/products/schd'
  },

  'VNQ': {
    symbol: 'VNQ',
    name: 'Vanguard Real Estate ETF',
    type: 'ETF',
    category: 'US REITs',
    description: 'Provides exposure to US real estate investment trusts (REITs) across various property types.',
    expenseRatio: 0.12,
    dividendYield: 3.8,
    inception: '2004',
    aum: '$25B+',
    holdings: '160+',
    topHoldings: [
      { name: 'American Tower Corp.', weight: 6.2 },
      { name: 'Prologis Inc.', weight: 5.8 },
      { name: 'Crown Castle Inc.', weight: 4.9 },
      { name: 'Equinix Inc.', weight: 4.1 },
      { name: 'Public Storage', weight: 3.7 }
    ],
    sectors: [
      { name: 'Specialized REITs', weight: 28.4 },
      { name: 'Industrial REITs', weight: 15.2 },
      { name: 'Residential REITs', weight: 14.8 },
      { name: 'Retail REITs', weight: 12.1 },
      { name: 'Office REITs', weight: 8.9 }
    ],
    pros: [
      'Real estate diversification',
      'High dividend yield',
      'Inflation hedge potential',
      'Professional property management'
    ],
    cons: [
      'Interest rate sensitivity',
      'Real estate market cyclicality',
      'Higher expense ratio',
      'Tax inefficient (ordinary income)'
    ],
    keyFeatures: [
      'Covers all major REIT sectors',
      'Monthly dividend distributions',
      'Alternative to direct real estate investment'
    ],
    riskLevel: 4,
    website: 'https://investor.vanguard.com/etf/profile/VNQ'
  },

  'QQQ': {
    symbol: 'QQQ',
    name: 'Invesco QQQ Trust ETF',
    type: 'ETF',
    category: 'Technology/Growth',
    description: 'Tracks the Nasdaq-100 Index, focusing on the largest non-financial companies on the Nasdaq.',
    expenseRatio: 0.20,
    dividendYield: 0.6,
    inception: '1999',
    aum: '$200B+',
    holdings: '100+',
    topHoldings: [
      { name: 'Apple Inc.', weight: 12.1 },
      { name: 'Microsoft Corp.', weight: 10.8 },
      { name: 'Amazon.com Inc.', weight: 5.4 },
      { name: 'Alphabet Inc.', weight: 4.9 },
      { name: 'Tesla Inc.', weight: 4.2 }
    ],
    sectors: [
      { name: 'Technology', weight: 48.2 },
      { name: 'Consumer Discretionary', weight: 16.8 },
      { name: 'Communication Services', weight: 14.2 },
      { name: 'Healthcare', weight: 6.1 },
      { name: 'Consumer Staples', weight: 5.8 }
    ],
    pros: [
      'Exposure to leading tech companies',
      'Strong historical performance',
      'Innovation-focused holdings',
      'Liquid and widely traded'
    ],
    cons: [
      'High concentration in tech sector',
      'Higher expense ratio than broad market',
      'High volatility',
      'Growth-focused (limited value exposure)'
    ],
    keyFeatures: [
      'Nasdaq-100 tracking',
      'Large-cap growth focus',
      'Excludes financial companies'
    ],
    riskLevel: 4,
    website: 'https://www.invesco.com/us/financial-products/etfs/product-detail?audienceType=Investor&ticker=QQQ'
  },

  'VGT': {
    symbol: 'VGT',
    name: 'Vanguard Information Technology ETF',
    type: 'ETF',
    category: 'Technology Sector',
    description: 'Provides exposure to the information technology sector of the US stock market.',
    expenseRatio: 0.10,
    dividendYield: 0.7,
    inception: '2004',
    aum: '$60B+',
    holdings: '330+',
    topHoldings: [
      { name: 'Apple Inc.', weight: 19.8 },
      { name: 'Microsoft Corp.', weight: 18.2 },
      { name: 'NVIDIA Corp.', weight: 4.8 },
      { name: 'Broadcom Inc.', weight: 3.2 },
      { name: 'Salesforce Inc.', weight: 2.1 }
    ],
    sectors: [
      { name: 'Software', weight: 42.1 },
      { name: 'Hardware', weight: 38.2 },
      { name: 'Semiconductors', weight: 19.7 }
    ],
    pros: [
      'Pure technology sector exposure',
      'Lower expense ratio than QQQ',
      'Broader tech holdings than QQQ',
      'Strong innovation exposure'
    ],
    cons: [
      'Sector concentration risk',
      'High volatility',
      'Cyclical sector exposure',
      'Limited diversification'
    ],
    keyFeatures: [
      'GICS Information Technology sector',
      'Includes software, hardware, semiconductors',
      'Market-cap weighted'
    ],
    riskLevel: 5,
    website: 'https://investor.vanguard.com/etf/profile/VGT'
  },

  'ARKK': {
    symbol: 'ARKK',
    name: 'ARK Innovation ETF',
    type: 'ETF',
    category: 'Disruptive Innovation',
    description: 'Actively managed fund focusing on companies developing disruptive innovation across multiple sectors.',
    expenseRatio: 0.75,
    dividendYield: 0.0,
    inception: '2014',
    aum: '$8B+',
    holdings: '35+',
    topHoldings: [
      { name: 'Tesla Inc.', weight: 9.8 },
      { name: 'Roku Inc.', weight: 6.2 },
      { name: 'Coinbase Global Inc.', weight: 5.4 },
      { name: 'UiPath Inc.', weight: 4.9 },
      { name: 'Zoom Video Communications', weight: 4.1 }
    ],
    sectors: [
      { name: 'Technology', weight: 38.2 },
      { name: 'Healthcare', weight: 28.1 },
      { name: 'Communication Services', weight: 18.4 },
      { name: 'Consumer Discretionary', weight: 15.3 }
    ],
    pros: [
      'Exposure to disruptive innovation',
      'Active management by experienced team',
      'Focus on future growth themes',
      'Concentrated high-conviction bets'
    ],
    cons: [
      'Very high expense ratio (0.75%)',
      'Extremely high volatility',
      'Concentrated portfolio (35 holdings)',
      'Speculative/unproven companies'
    ],
    keyFeatures: [
      'Actively managed innovation focus',
      'Themes: AI, robotics, genomics, fintech',
      'High-conviction concentrated approach'
    ],
    riskLevel: 5,
    website: 'https://ark-funds.com/arkk'
  },

  'VTEB': {
    symbol: 'VTEB',
    name: 'Vanguard Tax-Exempt Bond ETF',
    type: 'ETF',
    category: 'Municipal Bonds',
    description: 'Provides broad exposure to the US municipal bond market with tax-exempt interest income.',
    expenseRatio: 0.05,
    dividendYield: 3.2,
    inception: '2015',
    aum: '$8B+',
    holdings: '1,700+',
    topHoldings: [
      { name: 'California State Bonds', weight: 8.2 },
      { name: 'New York State Bonds', weight: 6.1 },
      { name: 'Texas State Bonds', weight: 4.8 },
      { name: 'Florida State Bonds', weight: 3.9 },
      { name: 'Illinois State Bonds', weight: 3.2 }
    ],
    sectors: [
      { name: 'State & Local Government', weight: 68.2 },
      { name: 'Transportation', weight: 12.1 },
      { name: 'Education', weight: 8.4 },
      { name: 'Utilities', weight: 6.8 },
      { name: 'Healthcare', weight: 4.5 }
    ],
    pros: [
      'Tax-exempt interest income',
      'Broad municipal bond exposure',
      'Low expense ratio',
      'High credit quality'
    ],
    cons: [
      'Lower yields than taxable bonds',
      'Credit risk from municipalities',
      'Interest rate sensitivity',
      'State-specific tax implications'
    ],
    keyFeatures: [
      'Federal tax-exempt income',
      'May be state tax-exempt too',
      'Investment-grade municipal bonds'
    ],
    riskLevel: 2,
    website: 'https://investor.vanguard.com/etf/profile/VTEB'
  },

  // Schwab Alternatives
  'SWTSX': {
    symbol: 'SWTSX',
    name: 'Schwab Total Stock Market Index Fund',
    type: 'Mutual Fund',
    category: 'US Total Market',
    expenseRatio: 0.03,
    description: 'Tracks the performance of the entire U.S. stock market, including small-, mid-, and large-cap stocks.',
    pros: [
      'Ultra-low expense ratio of 0.03%',
      'Broad diversification across entire U.S. market',
      'No minimum investment requirement',
      'Schwab ecosystem benefits'
    ],
    cons: [
      'No international exposure',
      'Concentrated in U.S. market risk',
      'May underperform during international outperformance'
    ],
    keyFeatures: [
      'Tracks Dow Jones U.S. Total Stock Market Index',
      'Over 2,500 holdings across all market caps',
      'Automatic dividend reinvestment available',
      'Low portfolio turnover reduces costs'
    ],
    riskLevel: 3,
    website: 'https://www.schwab.com/mutual-funds/mutual-fund-portfolio/total-stock-market-index'
  },

  'FXNAX': {
    symbol: 'FXNAX',
    name: 'Fidelity U.S. Bond Index Fund',
    type: 'Mutual Fund',
    category: 'US Aggregate Bonds',
    expenseRatio: 0.025,
    description: 'Seeks to provide investment results that correspond to the total return of the Bloomberg U.S. Aggregate Bond Index.',
    pros: [
      'Very low expense ratio of 0.025%',
      'Broad bond market exposure',
      'No minimum investment requirement',
      'Fidelity research and management'
    ],
    cons: [
      'Interest rate risk affects bond prices',
      'Credit risk from underlying bonds',
      'Inflation can erode real returns'
    ],
    keyFeatures: [
      'Tracks Bloomberg U.S. Aggregate Bond Index',
      'Includes government, corporate, and mortgage-backed securities',
      'Average duration of 6-7 years',
      'Monthly dividend distributions'
    ],
    riskLevel: 2,
    website: 'https://fundresearch.fidelity.com/mutual-funds/summary/316146356'
  },

  'SWISX': {
    symbol: 'SWISX',
    name: 'Schwab International Index Fund',
    type: 'Mutual Fund',
    category: 'International Developed Markets',
    expenseRatio: 0.06,
    description: 'Tracks the performance of the FTSE Developed ex US Index, providing exposure to international developed markets.',
    pros: [
      'Geographic diversification outside U.S.',
      'Low expense ratio of 0.06%',
      'Exposure to developed international markets',
      'Currency diversification benefits'
    ],
    cons: [
      'Currency exchange rate risk',
      'Political and economic risks in foreign markets',
      'May have different tax implications'
    ],
    keyFeatures: [
      'Tracks FTSE Developed ex US Index',
      'Exposure to Europe, Japan, and other developed markets',
      'Over 900 holdings across 23 countries',
      'Quarterly dividend distributions'
    ],
    riskLevel: 3,
    website: 'https://www.schwab.com/mutual-funds/mutual-fund-portfolio/international-index'
  },

  'FTIHX': {
    symbol: 'FTIHX',
    name: 'Fidelity Total International Index Fund',
    type: 'Mutual Fund',
    category: 'International Developed Markets',
    expenseRatio: 0.06,
    description: 'Seeks to provide investment results that correspond to the total return of the FTSE Global All Cap ex US Index.',
    pros: [
      'Broad international diversification',
      'Low expense ratio of 0.06%',
      'Includes both developed and emerging markets',
      'No minimum investment requirement'
    ],
    cons: [
      'Currency exchange rate volatility',
      'Emerging market risks included',
      'Political and regulatory risks'
    ],
    keyFeatures: [
      'Tracks FTSE Global All Cap ex US Index',
      'Includes developed and emerging markets',
      'Over 3,000 international holdings',
      'Quarterly dividend distributions'
    ],
    riskLevel: 4,
    website: 'https://fundresearch.fidelity.com/mutual-funds/summary/31635T708'
  },

  'FZROX': {
    symbol: 'FZROX',
    name: 'Fidelity ZERO Total Market Index Fund',
    type: 'Mutual Fund',
    category: 'US Total Market',
    expenseRatio: 0.0,
    description: 'Seeks to provide investment results that correspond to the total return of the Fidelity U.S. Total Investable Market Index.',
    pros: [
      'Zero expense ratio - completely free',
      'Broad U.S. market diversification',
      'No minimum investment requirement',
      'Fidelity research and technology'
    ],
    cons: [
      'Only available to Fidelity customers',
      'No international exposure',
      'Relatively new fund (launched 2018)'
    ],
    keyFeatures: [
      'Tracks Fidelity U.S. Total Investable Market Index',
      'Over 2,800 holdings across all market caps',
      'Zero management fees',
      'Quarterly dividend distributions'
    ],
    riskLevel: 3,
    website: 'https://fundresearch.fidelity.com/mutual-funds/summary/31635V307'
  }
};

export const getSecurityInfo = (symbol: string): SecurityInfo | null => {
  return SECURITY_INFO[symbol] || null;
};
