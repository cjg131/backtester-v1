"""
Yahoo Finance data provider using yfinance library.
Enhanced with user-agent rotation and request throttling.
"""

import yfinance as yf
import pandas as pd
import time
import random
from typing import List, Optional
from providers.base import DataProvider
from engine.models import Bar, Dividend, Split


class YFinanceProvider(DataProvider):
    """Yahoo Finance data provider with anti-blocking measures"""
    
    def __init__(self):
        self._cache = {}
        # Randomize user agents to avoid blocking
        self.user_agents = [
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
            'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36'
        ]
    
    async def get_symbols(
        self,
        universe: str,
        as_of: Optional[str] = None
    ) -> List[str]:
        """
        YFinance doesn't provide universe screening.
        Return empty list - users should provide custom symbol lists.
        """
        return []
    
    async def get_bars(
        self,
        symbol: str,
        start: str,
        end: str,
        freq: str = "daily"
    ) -> List[Bar]:
        """Download bars from Yahoo Finance with anti-blocking measures"""
        # Add retry logic for yfinance API issues
        max_retries = 5
        base_delay = 1.5  # seconds
        
        for attempt in range(max_retries):
            try:
                # Random delay between requests to look more human
                delay = base_delay * (attempt + 1) + random.uniform(0, 1)
                if attempt > 0:
                    time.sleep(delay)
                
                # Use random user agent
                user_agent = random.choice(self.user_agents)
                
                # Create ticker with session that has user agent
                ticker = yf.Ticker(symbol)
                
                # Set user agent on the session
                if hasattr(ticker, 'session'):
                    ticker.session.headers['User-Agent'] = user_agent
                
                # Download data
                df = ticker.history(start=start, end=end, auto_adjust=False)
                
                if df.empty:
                    print(f"Empty dataframe for {symbol} on attempt {attempt + 1}")
                    if attempt < max_retries - 1:
                        continue
                    return []
                
                # Successfully got data
                break
                
            except Exception as e:
                print(f"Attempt {attempt + 1}/{max_retries} failed for {symbol}: {e}")
                if attempt == max_retries - 1:
                    print(f"All retries exhausted for {symbol}")
                    return []
                continue
        
        try:
            
            bars = []
            for date, row in df.iterrows():
                bar = Bar(
                    date=date.strftime('%Y-%m-%d'),
                    open=float(row['Open']),
                    high=float(row['High']),
                    low=float(row['Low']),
                    close=float(row['Close']),
                    adj_close=float(row['Close']),  # Will adjust manually
                    volume=float(row['Volume'])
                )
                bars.append(bar)
            
            # Apply adjustments for splits and dividends
            bars = self._apply_adjustments(bars, df)
            
            return bars
        
        except Exception as e:
            print(f"Error fetching bars for {symbol}: {e}")
            return []
    
    def _apply_adjustments(self, bars: List[Bar], df: pd.DataFrame) -> List[Bar]:
        """Apply split and dividend adjustments to create adj_close"""
        if df.empty or len(bars) == 0:
            return bars
        
        # Use the built-in adjusted close if available
        if 'Adj Close' in df.columns:
            for i, (date, row) in enumerate(df.iterrows()):
                if i < len(bars):
                    bars[i].adj_close = float(row['Adj Close'])
        
        return bars
    
    async def get_dividends(
        self,
        symbol: str,
        start: str,
        end: str
    ) -> List[Dividend]:
        """Get dividend history from Yahoo Finance"""
        try:
            ticker = yf.Ticker(symbol)
            divs = ticker.dividends
            
            # Handle different return types from yfinance
            if divs is None or (hasattr(divs, 'empty') and divs.empty) or (isinstance(divs, list) and len(divs) == 0):
                return []
            
            # Ensure it's a pandas Series before filtering
            if not hasattr(divs, 'index'):
                return []
            
            # Filter by date range
            divs = divs[(divs.index >= start) & (divs.index <= end)]
            
            dividends = []
            for date, amount in divs.items():
                div = Dividend(
                    ex_date=date.strftime('%Y-%m-%d'),
                    amount=float(amount),
                    qualified_pct=1.0  # Assume 100% qualified, user can override
                )
                dividends.append(div)
            
            return dividends
        
        except Exception as e:
            print(f"Error fetching dividends for {symbol}: {e}")
            return []
    
    async def get_splits(
        self,
        symbol: str,
        start: str,
        end: str
    ) -> List[Split]:
        """Get split history from Yahoo Finance"""
        try:
            ticker = yf.Ticker(symbol)
            splits = ticker.splits
            
            # Handle different return types from yfinance
            if splits is None or (hasattr(splits, 'empty') and splits.empty) or (isinstance(splits, list) and len(splits) == 0):
                return []
            
            # Ensure it's a pandas Series before filtering
            if not hasattr(splits, 'index'):
                return []
            
            # Filter by date range
            splits = splits[(splits.index >= start) & (splits.index <= end)]
            
            split_list = []
            for date, ratio in splits.items():
                split = Split(
                    ex_date=date.strftime('%Y-%m-%d'),
                    ratio=float(ratio)
                )
                split_list.append(split)
            
            return split_list
        
        except Exception as e:
            print(f"Error fetching splits for {symbol}: {e}")
            return []
    
    async def get_expense_ratio(self, symbol: str) -> Optional[float]:
        """
        Try to get expense ratio from Yahoo Finance info.
        This is not always available.
        """
        try:
            ticker = yf.Ticker(symbol)
            info = ticker.info
            
            # YFinance sometimes has this under different keys
            if 'annualReportExpenseRatio' in info:
                return float(info['annualReportExpenseRatio'])
            elif 'expenseRatio' in info:
                return float(info['expenseRatio'])
            
            return None
        
        except Exception:
            return None
