"""
CSV-based data provider for local/demo data.
Expects CSV files in a specific directory structure.
"""

import os
import pandas as pd
from typing import List, Optional
from pathlib import Path
from providers.base import DataProvider
from engine.models import Bar, Dividend, Split


class CSVProvider(DataProvider):
    """
    CSV data provider for local files.
    
    Directory structure:
        data/
            bars/
                SPY.csv
                AGG.csv
            dividends/
                SPY.csv
            splits/
                SPY.csv
            metadata.csv  # Optional: expense ratios, etc.
    """
    
    def __init__(self, data_dir: str = "data"):
        self.data_dir = Path(data_dir)
        self.bars_dir = self.data_dir / "bars"
        self.dividends_dir = self.data_dir / "dividends"
        self.splits_dir = self.data_dir / "splits"
        self.metadata_file = self.data_dir / "metadata.csv"
        
        # Load metadata if available
        self.metadata = {}
        if self.metadata_file.exists():
            df = pd.read_csv(self.metadata_file)
            self.metadata = df.set_index('symbol').to_dict('index')
    
    async def get_symbols(
        self,
        universe: str,
        as_of: Optional[str] = None
    ) -> List[str]:
        """Get all symbols with bar data available"""
        if not self.bars_dir.exists():
            return []
        
        symbols = []
        for file in self.bars_dir.glob("*.csv"):
            symbols.append(file.stem)
        
        return sorted(symbols)
    
    async def get_bars(
        self,
        symbol: str,
        start: str,
        end: str,
        freq: str = "daily"
    ) -> List[Bar]:
        """Load bars from CSV file"""
        file_path = self.bars_dir / f"{symbol}.csv"
        
        if not file_path.exists():
            return []
        
        try:
            df = pd.read_csv(file_path)
            df['date'] = pd.to_datetime(df['date'])
            
            # Filter by date range
            mask = (df['date'] >= start) & (df['date'] <= end)
            df = df[mask]
            
            # Convert to Bar objects
            bars = []
            for _, row in df.iterrows():
                bar = Bar(
                    date=row['date'].strftime('%Y-%m-%d'),
                    open=float(row['open']),
                    high=float(row['high']),
                    low=float(row['low']),
                    close=float(row['close']),
                    adj_close=float(row.get('adj_close', row['close'])),
                    volume=float(row['volume'])
                )
                bars.append(bar)
            
            return bars
        
        except Exception as e:
            print(f"Error loading bars for {symbol}: {e}")
            return []
    
    async def get_dividends(
        self,
        symbol: str,
        start: str,
        end: str
    ) -> List[Dividend]:
        """Load dividends from CSV file"""
        file_path = self.dividends_dir / f"{symbol}.csv"
        
        if not file_path.exists():
            return []
        
        try:
            df = pd.read_csv(file_path)
            df['ex_date'] = pd.to_datetime(df['ex_date'])
            
            # Filter by date range
            mask = (df['ex_date'] >= start) & (df['ex_date'] <= end)
            df = df[mask]
            
            # Convert to Dividend objects
            dividends = []
            for _, row in df.iterrows():
                div = Dividend(
                    ex_date=row['ex_date'].strftime('%Y-%m-%d'),
                    pay_date=row.get('pay_date'),
                    amount=float(row['amount']),
                    qualified_pct=float(row.get('qualified_pct', 1.0))
                )
                dividends.append(div)
            
            return dividends
        
        except Exception as e:
            print(f"Error loading dividends for {symbol}: {e}")
            return []
    
    async def get_splits(
        self,
        symbol: str,
        start: str,
        end: str
    ) -> List[Split]:
        """Load splits from CSV file"""
        file_path = self.splits_dir / f"{symbol}.csv"
        
        if not file_path.exists():
            return []
        
        try:
            df = pd.read_csv(file_path)
            df['ex_date'] = pd.to_datetime(df['ex_date'])
            
            # Filter by date range
            mask = (df['ex_date'] >= start) & (df['ex_date'] <= end)
            df = df[mask]
            
            # Convert to Split objects
            splits = []
            for _, row in df.iterrows():
                split = Split(
                    ex_date=row['ex_date'].strftime('%Y-%m-%d'),
                    ratio=float(row['ratio'])
                )
                splits.append(split)
            
            return splits
        
        except Exception as e:
            print(f"Error loading splits for {symbol}: {e}")
            return []
    
    async def get_expense_ratio(self, symbol: str) -> Optional[float]:
        """Get expense ratio from metadata"""
        if symbol in self.metadata:
            return self.metadata[symbol].get('expense_ratio')
        return None
