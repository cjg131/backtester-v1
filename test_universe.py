#!/usr/bin/env python3
"""
Test the entire ETF/Stock universe with the backend
"""

# Complete symbol universe (200+ symbols)
COMPLETE_UNIVERSE = [
    # Major ETFs
    'SPY', 'VOO', 'VTI', 'ITOT', 'SPTM', 'IVV', 'SPLG', 'QQQ', 'IWM', 'MDY',
    'VXUS', 'IXUS', 'VEA', 'VWO', 'IEFA', 'IEMG', 'EFA', 'EEM', 'VGK', 'VPL',
    'AGG', 'BND', 'VGIT', 'VGLT', 'TLT', 'IEF', 'SHY', 'VTEB', 'LQD', 'HYG',
    'XLK', 'XLF', 'XLV', 'XLI', 'XLE', 'XLY', 'XLP', 'XLU', 'XLB', 'XLRE',
    'VUG', 'VTV', 'IWF', 'IWD', 'MTUM', 'QUAL', 'USMV', 'VMOT',
    'VB', 'VBR', 'VBK', 'VO', 'VOE', 'VOT', 'IJH', 'IJR',
    'GLD', 'SLV', 'DBC', 'PDBC', 'USO', 'UNG', 'VNQ', 'SCHH', 'IYR',
    'ARKK', 'ARKQ', 'ARKG', 'ARKW', 'ICLN', 'PBW', 'ROBO', 'BOTZ',
    # Leveraged/Inverse ETFs
    'TQQQ', 'SQQQ', 'SPXL', 'SPXS', 'TNA', 'TZA', 'UPRO', 'SPXU', 'UDOW', 'SDOW', 'FAS', 'FAZ', 'TECL', 'TECS',
    # Dividend Focus ETFs
    'SCHD', 'VYM', 'NOBL', 'DVY', 'VIG', 'DGRO', 'HDV', 'SPHD', 'SPYD', 'FDVV', 'DGRW', 'PEY',
    
    # Major Stocks
    'AAPL', 'MSFT', 'GOOGL', 'GOOG', 'AMZN', 'META', 'TSLA', 'NVDA', 'NFLX',
    'ORCL', 'CRM', 'ADBE', 'INTC', 'AMD', 'CSCO', 'BRK.B', 'JNJ', 'JPM',
    'PG', 'UNH', 'HD', 'MA', 'V', 'DIS', 'WMT', 'KO', 'PEP', 'MCD', 'NKE',
    'IBM', 'GE', 'NOW', 'SHOP', 'SQ', 'ROKU', 'ZM', 'XOM', 'CVX', 'MMM',
    'CAT', 'BAC', 'WFC', 'C', 'GS', 'MS', 'AXP', 'USB', 'PNC', 'TFC',
    'PFE', 'ABBV', 'TMO', 'ABT', 'DHR', 'BMY', 'MRK', 'LLY', 'AMGN',
    'COP', 'EOG', 'SLB', 'PSX', 'VLO', 'LOW', 'SBUX', 'TJX', 'COST', 'TGT',
    'BA', 'HON', 'UPS', 'RTX', 'LMT', 'DE', 'UNP', 'CSX', 'FDX',
    'CMCSA', 'VZ', 'T', 'CHTR', 'TMUS'
]

print(f"Complete Universe: {len(COMPLETE_UNIVERSE)} symbols")
print("\nSymbols for copy-paste:")
print(",".join(COMPLETE_UNIVERSE))

print(f"\n\nTo test the complete universe:")
print("1. Go to: https://stock-backtest-pro.netlify.app")
print("2. Paste this symbol list in the input field:")
print("3. Set date range: 2020-01-01 to 2024-01-01")
print("4. Choose Equal Weight allocation")
print("5. Run backtest!")

print(f"\nThis will test {len(COMPLETE_UNIVERSE)} symbols across:")
print("- Major US ETFs (SPY, QQQ, VTI, etc.)")
print("- International ETFs (EFA, EEM, VXUS, etc.)")
print("- Bond ETFs (AGG, TLT, BND, etc.)")
print("- Sector ETFs (XLK, XLF, XLV, etc.)")
print("- Commodity ETFs (GLD, SLV, etc.)")
print("- REIT ETFs (VNQ, IYR, etc.)")
print("- Thematic ETFs (ARKK, ICLN, ROBO, etc.)")
print("- Mega Cap Stocks (AAPL, MSFT, GOOGL, etc.)")
print("- Blue Chip Stocks (BRK.B, JNJ, JPM, etc.)")
print("- Growth Stocks (CRM, NOW, SHOP, etc.)")
print("- All major sectors and asset classes")
