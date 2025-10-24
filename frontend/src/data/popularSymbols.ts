export const POPULAR_ETFS = {
  'Broad Market': [
    'SPY', 'VOO', 'VTI', 'ITOT', 'SPTM', 'IVV', 'SPLG', 'QQQ', 'IWM', 'MDY'
  ],
  'International': [
    'VXUS', 'IXUS', 'VEA', 'VWO', 'IEFA', 'IEMG', 'EFA', 'EEM', 'VGK', 'VPL', 'VSS', 'ACWI', 'VTIAX'
  ],
  'Bonds': [
    'AGG', 'BND', 'VGIT', 'VGLT', 'TLT', 'IEF', 'SHY', 'VTEB', 'LQD', 'HYG', 'JNK', 'SCHZ', 'GOVT', 'MUB'
  ],
  'Sector ETFs': [
    'XLK', 'XLF', 'XLV', 'XLI', 'XLE', 'XLY', 'XLP', 'XLU', 'XLB', 'XLRE', 'VGT', 'VFH', 'VHT', 'VIS', 'VDE', 'VCR', 'VDC', 'VPU', 'VAW'
  ],
  'Growth/Value': [
    'VUG', 'VTV', 'IWF', 'IWD', 'MTUM', 'QUAL', 'USMV', 'VMOT', 'VBK', 'VBR', 'VONG', 'VONV', 'MGK', 'MGV'
  ],
  'Small/Mid Cap': [
    'VB', 'VBR', 'VBK', 'VO', 'VOE', 'VOT', 'IWM', 'IJH', 'IJR', 'VXF', 'VTWO', 'VTWV', 'SCHA', 'SCHM'
  ],
  'Commodities': [
    'GLD', 'SLV', 'DBC', 'PDBC', 'USO', 'UNG', 'CORN', 'WEAT', 'IAU', 'SGOL', 'PPLT', 'PALL', 'CPER', 'JJC'
  ],
  'REITs': [
    'VNQ', 'SCHH', 'IYR', 'XLRE', 'RWR', 'FREL', 'USRT', 'VNQI', 'REET', 'REZ', 'MORT', 'REM'
  ],
  'Thematic/Specialty': [
    'ARKK', 'ARKQ', 'ARKG', 'ARKW', 'ICLN', 'PBW', 'QCLN', 'TAN', 'FAN', 'LIT', 'ROBO', 'BOTZ', 'FINX', 'HACK'
  ]
};

export const POPULAR_STOCKS = {
  'Mega Cap Tech': [
    'AAPL', 'MSFT', 'GOOGL', 'GOOG', 'AMZN', 'META', 'TSLA', 'NVDA', 'NFLX', 'ORCL', 'CRM', 'ADBE', 'INTC', 'AMD', 'CSCO'
  ],
  'Blue Chip': [
    'BRK.B', 'JNJ', 'JPM', 'PG', 'UNH', 'HD', 'MA', 'V', 'DIS', 'ADBE', 'WMT', 'KO', 'PEP', 'MCD', 'NKE', 'IBM', 'GE'
  ],
  'Growth': [
    'CRM', 'NOW', 'SHOP', 'SQ', 'ROKU', 'ZM', 'DOCU', 'TWLO', 'OKTA', 'SNOW', 'PLTR', 'CRWD', 'ZS', 'DDOG', 'MDB', 'NET'
  ],
  'Dividend': [
    'KO', 'PEP', 'JNJ', 'PG', 'MCD', 'WMT', 'VZ', 'T', 'XOM', 'CVX', 'MMM', 'CAT', 'IBM', 'INTC', 'CSCO', 'MO', 'PM'
  ],
  'Financial': [
    'JPM', 'BAC', 'WFC', 'C', 'GS', 'MS', 'AXP', 'USB', 'PNC', 'TFC', 'COF', 'SCHW', 'BLK', 'SPGI', 'ICE', 'CME'
  ],
  'Healthcare': [
    'JNJ', 'UNH', 'PFE', 'ABBV', 'TMO', 'ABT', 'DHR', 'BMY', 'MRK', 'LLY', 'AMGN', 'GILD', 'BIIB', 'REGN', 'VRTX', 'ISRG'
  ],
  'Energy': [
    'XOM', 'CVX', 'COP', 'EOG', 'SLB', 'PSX', 'VLO', 'MPC', 'OXY', 'KMI', 'WMB', 'EPD', 'ET', 'MPLX'
  ],
  'Consumer': [
    'AMZN', 'TSLA', 'HD', 'LOW', 'SBUX', 'NKE', 'TJX', 'COST', 'TGT', 'F', 'GM', 'BABA', 'JD', 'PDD'
  ],
  'Industrial': [
    'BA', 'CAT', 'GE', 'HON', 'UPS', 'RTX', 'LMT', 'MMM', 'DE', 'UNP', 'CSX', 'NSC', 'FDX', 'DAL', 'UAL'
  ],
  'Communication': [
    'GOOGL', 'META', 'NFLX', 'DIS', 'CMCSA', 'VZ', 'T', 'CHTR', 'TMUS', 'TWTR', 'SNAP', 'PINS', 'SPOT'
  ]
};

export const ALL_SYMBOLS = [
  ...Object.values(POPULAR_ETFS).flat(),
  ...Object.values(POPULAR_STOCKS).flat()
];

// Remove duplicates and sort
export const UNIQUE_ALL_SYMBOLS = [...new Set(ALL_SYMBOLS)].sort();

export function getSymbolSuggestions(input: string): string[] {
  const upperInput = input.toUpperCase();
  return UNIQUE_ALL_SYMBOLS
    .filter(symbol => symbol.includes(upperInput))
    .slice(0, 10);
}

// Preset symbol combinations for comprehensive testing
export const SYMBOL_PRESETS = {
  'All ETFs Only': Object.values(POPULAR_ETFS).flat(),
  'All Stocks Only': Object.values(POPULAR_STOCKS).flat(),
  'Top 50 Most Popular': [
    // Major ETFs
    'SPY', 'QQQ', 'VTI', 'IWM', 'EFA', 'EEM', 'AGG', 'TLT', 'GLD', 'VNQ',
    'XLK', 'XLF', 'XLV', 'XLE', 'XLI', 'XLY', 'XLP', 'XLU', 'XLB', 'XLRE',
    // Major Stocks
    'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META', 'TSLA', 'NVDA', 'NFLX', 'BRK.B', 'JNJ',
    'JPM', 'PG', 'UNH', 'HD', 'MA', 'V', 'DIS', 'ADBE', 'WMT', 'KO',
    'PEP', 'MCD', 'NKE', 'IBM', 'GE', 'XOM', 'CVX', 'BA', 'CAT', 'COST'
  ],
  'Comprehensive Universe': UNIQUE_ALL_SYMBOLS,
  'Core Holdings': [
    'SPY', 'QQQ', 'VTI', 'VXUS', 'AGG', 'TLT', 'GLD', 'VNQ',
    'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META', 'TSLA', 'NVDA', 'BRK.B'
  ],
  'Sector Rotation': [
    'XLK', 'XLF', 'XLV', 'XLI', 'XLE', 'XLY', 'XLP', 'XLU', 'XLB', 'XLRE'
  ]
};
