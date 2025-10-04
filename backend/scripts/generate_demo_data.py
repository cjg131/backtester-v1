"""
Generate demo CSV data for testing.
Downloads data from yfinance and saves to CSV format.
"""

import yfinance as yf
import pandas as pd
from pathlib import Path


def generate_demo_data():
    """Generate demo data for common symbols"""
    
    symbols = ["SPY", "AGG", "QQQ", "TLT", "VTI", "BND"]
    start_date = "2005-01-01"
    end_date = "2024-12-31"
    
    data_dir = Path("../data")
    bars_dir = data_dir / "bars"
    dividends_dir = data_dir / "dividends"
    splits_dir = data_dir / "splits"
    
    # Create directories
    bars_dir.mkdir(parents=True, exist_ok=True)
    dividends_dir.mkdir(parents=True, exist_ok=True)
    splits_dir.mkdir(parents=True, exist_ok=True)
    
    for symbol in symbols:
        print(f"Downloading {symbol}...")
        
        try:
            ticker = yf.Ticker(symbol)
            
            # Get historical data
            hist = ticker.history(start=start_date, end=end_date, auto_adjust=False)
            
            if not hist.empty:
                # Save bars
                bars_df = pd.DataFrame({
                    'date': hist.index.strftime('%Y-%m-%d'),
                    'open': hist['Open'].values,
                    'high': hist['High'].values,
                    'low': hist['Low'].values,
                    'close': hist['Close'].values,
                    'adj_close': hist['Adj Close'].values if 'Adj Close' in hist.columns else hist['Close'].values,
                    'volume': hist['Volume'].values
                })
                
                bars_df.to_csv(bars_dir / f"{symbol}.csv", index=False)
                print(f"  Saved {len(bars_df)} bars")
            
            # Get dividends
            divs = ticker.dividends
            if not divs.empty:
                divs_df = pd.DataFrame({
                    'ex_date': divs.index.strftime('%Y-%m-%d'),
                    'amount': divs.values,
                    'qualified_pct': 1.0
                })
                divs_df.to_csv(dividends_dir / f"{symbol}.csv", index=False)
                print(f"  Saved {len(divs_df)} dividends")
            
            # Get splits
            splits = ticker.splits
            if not splits.empty:
                splits_df = pd.DataFrame({
                    'ex_date': splits.index.strftime('%Y-%m-%d'),
                    'ratio': splits.values
                })
                splits_df.to_csv(splits_dir / f"{symbol}.csv", index=False)
                print(f"  Saved {len(splits_df)} splits")
        
        except Exception as e:
            print(f"  Error: {e}")
    
    print("\nDemo data generation complete!")


if __name__ == "__main__":
    generate_demo_data()
