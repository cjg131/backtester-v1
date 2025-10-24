"""
Reliable provider that tries Alpha Vantage first, then falls back to YFinance.
This ensures we get data even if Alpha Vantage free tier has limitations.
"""

from typing import List, Optional
from providers.base import DataProvider
from providers.alphavantage_provider import AlphaVantageProvider
from providers.yfinance_provider import YFinanceProvider
from engine.models import Bar, Dividend, Split


class ReliableProvider(DataProvider):
    """
    Reliable provider with Alpha Vantage primary, YFinance fallback
    """
    
    def __init__(self, alphavantage_key: str):
        self.alphavantage = AlphaVantageProvider(alphavantage_key)
        self.yfinance = YFinanceProvider()
    
    async def get_symbols(self, universe: str, as_of: Optional[str] = None) -> List[str]:
        """Return empty list - users provide symbols"""
        return []
    
    async def get_bars(self, symbol: str, start: str, end: str, freq: str = "daily") -> List[Bar]:
        """Get bars with Alpha Vantage first, YFinance fallback"""
        
        # Try Alpha Vantage first
        try:
            print(f"Trying Alpha Vantage for {symbol}...")
            bars = await self.alphavantage.get_bars(symbol, start, end, freq)
            if bars and len(bars) > 0:
                print(f"✅ Alpha Vantage success for {symbol}: {len(bars)} bars")
                return bars
            else:
                print(f"⚠️ Alpha Vantage returned no data for {symbol}")
        except Exception as e:
            print(f"❌ Alpha Vantage failed for {symbol}: {e}")
        
        # Fallback to YFinance
        try:
            print(f"Falling back to YFinance for {symbol}...")
            bars = await self.yfinance.get_bars(symbol, start, end, freq)
            if bars and len(bars) > 0:
                print(f"✅ YFinance success for {symbol}: {len(bars)} bars")
                return bars
            else:
                print(f"⚠️ YFinance returned no data for {symbol}")
        except Exception as e:
            print(f"❌ YFinance failed for {symbol}: {e}")
        
        print(f"❌ All providers failed for {symbol}")
        return []
    
    async def get_dividends(self, symbol: str, start: str, end: str) -> List[Dividend]:
        """Get dividends with fallback"""
        # Try Alpha Vantage first
        try:
            dividends = await self.alphavantage.get_dividends(symbol, start, end)
            if dividends:
                return dividends
        except Exception:
            pass
        
        # Fallback to YFinance
        try:
            return await self.yfinance.get_dividends(symbol, start, end)
        except Exception:
            return []
    
    async def get_splits(self, symbol: str, start: str, end: str) -> List[Split]:
        """Get splits with fallback"""
        # Try Alpha Vantage first
        try:
            splits = await self.alphavantage.get_splits(symbol, start, end)
            if splits:
                return splits
        except Exception:
            pass
        
        # Fallback to YFinance
        try:
            return await self.yfinance.get_splits(symbol, start, end)
        except Exception:
            return []
    
    async def get_expense_ratio(self, symbol: str) -> Optional[float]:
        """Get expense ratio from YFinance (Alpha Vantage free tier doesn't have this)"""
        try:
            return await self.yfinance.get_expense_ratio(symbol)
        except Exception:
            return None
