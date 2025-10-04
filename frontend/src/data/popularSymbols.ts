export const POPULAR_ETFS = {
  'Broad Market': [
    'SPY', 'VOO', 'VTI', 'ITOT', 'SPTM', 'IVV', 'SPLG'
  ],
  'International': [
    'VXUS', 'IXUS', 'VEA', 'VWO', 'IEFA', 'IEMG', 'EFA', 'EEM'
  ],
  'Bonds': [
    'AGG', 'BND', 'VGIT', 'VGLT', 'TLT', 'IEF', 'SHY', 'VTEB'
  ],
  'Sector ETFs': [
    'XLK', 'XLF', 'XLV', 'XLI', 'XLE', 'XLY', 'XLP', 'XLU', 'XLB', 'XLRE'
  ],
  'Growth/Value': [
    'VUG', 'VTV', 'IWF', 'IWD', 'MTUM', 'QUAL', 'USMV', 'VMOT'
  ],
  'Small/Mid Cap': [
    'VB', 'VBR', 'VBK', 'VO', 'VOE', 'VOT', 'IWM', 'IJH', 'IJR'
  ],
  'Commodities': [
    'GLD', 'SLV', 'DBC', 'PDBC', 'USO', 'UNG', 'CORN', 'WEAT'
  ],
  'REITs': [
    'VNQ', 'SCHH', 'IYR', 'XLRE', 'RWR', 'FREL', 'USRT'
  ]
};

export const POPULAR_STOCKS = {
  'Mega Cap Tech': [
    'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META', 'TSLA', 'NVDA', 'NFLX'
  ],
  'Blue Chip': [
    'BRK.B', 'JNJ', 'JPM', 'PG', 'UNH', 'HD', 'MA', 'V', 'DIS', 'ADBE'
  ],
  'Growth': [
    'CRM', 'NOW', 'SHOP', 'SQ', 'ROKU', 'ZM', 'DOCU', 'TWLO', 'OKTA'
  ],
  'Dividend': [
    'KO', 'PEP', 'JNJ', 'PG', 'MCD', 'WMT', 'VZ', 'T', 'XOM', 'CVX'
  ],
  'Financial': [
    'JPM', 'BAC', 'WFC', 'C', 'GS', 'MS', 'AXP', 'USB', 'PNC', 'TFC'
  ],
  'Healthcare': [
    'JNJ', 'UNH', 'PFE', 'ABBV', 'TMO', 'ABT', 'DHR', 'BMY', 'MRK', 'LLY'
  ]
};

export const ALL_SYMBOLS = [
  ...Object.values(POPULAR_ETFS).flat(),
  ...Object.values(POPULAR_STOCKS).flat()
];

export function getSymbolSuggestions(input: string): string[] {
  const upperInput = input.toUpperCase();
  return ALL_SYMBOLS
    .filter(symbol => symbol.includes(upperInput))
    .slice(0, 10);
}
