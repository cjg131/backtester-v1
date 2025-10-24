"""
Smart data provider that uses CSV data when available, falls back to APIs for other symbols.
This ensures maximum reliability while supporting custom symbols.
"""

from typing import List, Optional
from providers.base import DataProvider
from providers.csv_provider import CSVProvider
from providers.twelvedata_provider import TwelveDataProvider
from providers.yfinance_provider import YFinanceProvider
from engine.models import Bar, Dividend, Split


class SmartProvider(DataProvider):
    """
    Smart provider that prioritizes reliability:
    1. CSV data (fastest, most reliable)
    2. TwelveData API (professional, rate limited)
    3. YFinance (free, unreliable)
    """
    
    def __init__(self, csv_provider: CSVProvider, twelvedata_provider: TwelveDataProvider, yfinance_provider: YFinanceProvider):
        self.csv_provider = csv_provider
        self.twelvedata_provider = twelvedata_provider
        self.yfinance_provider = yfinance_provider
        
        # Cache available CSV symbols for quick lookup
        self._csv_symbols = set()
        self._csv_symbols_loaded = False
    
    async def _load_csv_symbols(self):
        """Load available CSV symbols once"""
        if not self._csv_symbols_loaded:
            symbols = await self.csv_provider.get_symbols("", None)
            self._csv_symbols = set(symbols)
            self._csv_symbols_loaded = True
            print(f"Available CSV symbols: {sorted(self._csv_symbols)}")
    
    async def get_symbols(self, universe: str, as_of: Optional[str] = None) -> List[str]:
        """Return available CSV symbols"""
        await self._load_csv_symbols()
        return sorted(list(self._csv_symbols))
    
    async def get_bars(self, symbol: str, start: str, end: str, freq: str = "daily") -> List[Bar]:
        """Get bars with smart fallback"""
        await self._load_csv_symbols()
        
        # Try CSV first (fastest and most reliable)
        if symbol in self._csv_symbols:
            print(f"Using CSV data for {symbol}")
            bars = await self.csv_provider.get_bars(symbol, start, end, freq)
            if bars:
                return bars
        
        # Fallback to TwelveData for custom symbols
        print(f"CSV data not available for {symbol}, trying TwelveData...")
        try:
            bars = await self.twelvedata_provider.get_bars(symbol, start, end, freq)
            if bars:
                print(f"TwelveData success for {symbol}")
                return bars
        except Exception as e:
            print(f"TwelveData failed for {symbol}: {e}")
        
        # Last resort: YFinance
        print(f"TwelveData failed for {symbol}, trying YFinance...")
        try:
            bars = await self.yfinance_provider.get_bars(symbol, start, end, freq)
            if bars:
                print(f"YFinance success for {symbol}")
                return bars
        except Exception as e:
            print(f"YFinance failed for {symbol}: {e}")
        
        print(f"All providers failed for {symbol}")
        return []
    
    async def get_dividends(self, symbol: str, start: str, end: str) -> List[Dividend]:
        """Get dividends with smart fallback"""
        await self._load_csv_symbols()
        
        # Try CSV first
        if symbol in self._csv_symbols:
            dividends = await self.csv_provider.get_dividends(symbol, start, end)
            if dividends:
                return dividends
        
        # Fallback to APIs
        try:
            dividends = await self.twelvedata_provider.get_dividends(symbol, start, end)
            if dividends:
                return dividends
        except Exception:
            pass
        
        try:
            return await self.yfinance_provider.get_dividends(symbol, start, end)
        except Exception:
            return []
    
    async def get_splits(self, symbol: str, start: str, end: str) -> List[Split]:
        """Get splits with smart fallback"""
        await self._load_csv_symbols()
        
        # Try CSV first
        if symbol in self._csv_symbols:
            splits = await self.csv_provider.get_splits(symbol, start, end)
            if splits:
                return splits
        
        # Fallback to APIs
        try:
            splits = await self.twelvedata_provider.get_splits(symbol, start, end)
            if splits:
                return splits
        except Exception:
            pass
        
        try:
            return await self.yfinance_provider.get_splits(symbol, start, end)
        except Exception:
            return []
    
    async def get_expense_ratio(self, symbol: str) -> Optional[float]:
        """Get expense ratio with smart fallback"""
        await self._load_csv_symbols()
        
        # Try CSV first
        if symbol in self._csv_symbols:
            ratio = await self.csv_provider.get_expense_ratio(symbol)
            if ratio is not None:
                return ratio
        
        # Fallback to YFinance (TwelveData free tier doesn't have this)
        try:
            return await self.yfinance_provider.get_expense_ratio(symbol)
        except Exception:
            return None
