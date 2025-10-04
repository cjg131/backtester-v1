"""
Base data provider interface.
All data providers must implement this interface.
"""

from abc import ABC, abstractmethod
from typing import List, Optional
from engine.models import Bar, Dividend, Split


class DataProvider(ABC):
    """Abstract base class for data providers"""
    
    @abstractmethod
    async def get_symbols(
        self,
        universe: str,
        as_of: Optional[str] = None
    ) -> List[str]:
        """
        Get list of symbols for a given universe.
        
        Args:
            universe: Universe type (US_STOCKS, ETF, BOND_ETF, CUSTOM)
            as_of: Optional date to get historical universe
            
        Returns:
            List of ticker symbols
        """
        pass
    
    @abstractmethod
    async def get_bars(
        self,
        symbol: str,
        start: str,
        end: str,
        freq: str = "daily"
    ) -> List[Bar]:
        """
        Get OHLCV bars for a symbol.
        
        Args:
            symbol: Ticker symbol
            start: Start date (YYYY-MM-DD)
            end: End date (YYYY-MM-DD)
            freq: Frequency (daily)
            
        Returns:
            List of Bar objects with adjusted prices
        """
        pass
    
    @abstractmethod
    async def get_dividends(
        self,
        symbol: str,
        start: str,
        end: str
    ) -> List[Dividend]:
        """
        Get dividend payments for a symbol.
        
        Args:
            symbol: Ticker symbol
            start: Start date (YYYY-MM-DD)
            end: End date (YYYY-MM-DD)
            
        Returns:
            List of Dividend objects
        """
        pass
    
    @abstractmethod
    async def get_splits(
        self,
        symbol: str,
        start: str,
        end: str
    ) -> List[Split]:
        """
        Get stock splits for a symbol.
        
        Args:
            symbol: Ticker symbol
            start: Start date (YYYY-MM-DD)
            end: End date (YYYY-MM-DD)
            
        Returns:
            List of Split objects
        """
        pass
    
    async def get_expense_ratio(self, symbol: str) -> Optional[float]:
        """
        Get expense ratio for an ETF.
        
        Args:
            symbol: Ticker symbol
            
        Returns:
            Annual expense ratio as decimal (e.g., 0.0003 for 0.03%) or None
        """
        return None
    
    async def get_delisted_symbols(
        self,
        start: str,
        end: str
    ) -> List[str]:
        """
        Get symbols that were delisted during the period.
        
        Args:
            start: Start date (YYYY-MM-DD)
            end: End date (YYYY-MM-DD)
            
        Returns:
            List of delisted ticker symbols
        """
        return []
