"""
Alpha Vantage data provider for reliable long-term historical data.
Free tier: 500 API calls/day, 25+ years of data
"""

import requests
import time
import pandas as pd
from datetime import datetime, timedelta
from typing import List, Optional
from providers.base import DataProvider
from engine.models import Bar, Dividend, Split


class AlphaVantageProvider(DataProvider):
    """Alpha Vantage API provider with 25+ years of historical data"""
    
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.base_url = "https://www.alphavantage.co/query"
        self._cache = {}
        self.rate_limit_delay = 12.0  # 5 calls per minute = 12 seconds between calls
        self.last_request_time = 0
    
    def _rate_limit(self):
        """Enforce rate limiting - Alpha Vantage is strict about this"""
        current_time = time.time()
        time_since_last = current_time - self.last_request_time
        if time_since_last < self.rate_limit_delay:
            sleep_time = self.rate_limit_delay - time_since_last
            print(f"Rate limiting: sleeping {sleep_time:.1f}s")
            time.sleep(sleep_time)
        self.last_request_time = time.time()
    
    def _make_request(self, params: dict) -> dict:
        """Make API request with rate limiting"""
        self._rate_limit()
        
        params['apikey'] = self.api_key
        
        response = requests.get(self.base_url, params=params)
        
        if response.status_code == 200:
            data = response.json()
            
            # Check for API error messages
            if 'Error Message' in data:
                print(f"Alpha Vantage error: {data['Error Message']}")
                return None
            elif 'Note' in data:
                print(f"Alpha Vantage note: {data['Note']}")
                return None
            
            return data
        else:
            print(f"Alpha Vantage HTTP error: {response.status_code} - {response.text}")
            return None
    
    async def get_symbols(self, universe: str, as_of: Optional[str] = None) -> List[str]:
        """Alpha Vantage doesn't provide universe screening"""
        return []
    
    async def get_bars(self, symbol: str, start: str, end: str, freq: str = "daily") -> List[Bar]:
        """Download bars from Alpha Vantage with caching"""
        cache_key = f"{symbol}_{start}_{end}_{freq}"
        if cache_key in self._cache:
            print(f"Using cached data for {symbol}")
            return self._cache[cache_key]
            
        try:
            print(f"Fetching {symbol} from Alpha Vantage ({start} to {end})")
            
            # Alpha Vantage daily adjusted endpoint
            params = {
                'function': 'TIME_SERIES_DAILY_ADJUSTED',
                'symbol': symbol,
                'outputsize': 'full'  # Get full historical data (20+ years)
            }
            
            data = self._make_request(params)
            
            if not data or 'Time Series (Daily)' not in data:
                print(f"No data returned for {symbol}")
                return []
            
            time_series = data['Time Series (Daily)']
            
            bars = []
            for date_str, daily_data in time_series.items():
                # Filter by date range
                if start <= date_str <= end:
                    bar = Bar(
                        date=date_str,
                        open=float(daily_data['1. open']),
                        high=float(daily_data['2. high']),
                        low=float(daily_data['3. low']),
                        close=float(daily_data['4. close']),
                        adj_close=float(daily_data['5. adjusted close']),
                        volume=float(daily_data['6. volume'])
                    )
                    bars.append(bar)
            
            # Sort by date (Alpha Vantage returns newest first)
            bars.sort(key=lambda x: x.date)
            
            print(f"Loaded {len(bars)} bars for {symbol}")
            self._cache[cache_key] = bars  # Cache the results
            return bars
        
        except Exception as e:
            print(f"Error fetching bars for {symbol}: {e}")
            return []
    
    async def get_dividends(self, symbol: str, start: str, end: str) -> List[Dividend]:
        """Get dividend history from Alpha Vantage"""
        try:
            print(f"Fetching dividends for {symbol}")
            
            # Alpha Vantage doesn't have a separate dividends endpoint in free tier
            # Dividend info is included in the adjusted close calculation
            # For now, return empty - could be enhanced with premium tier
            return []
        
        except Exception as e:
            print(f"Error fetching dividends for {symbol}: {e}")
            return []
    
    async def get_splits(self, symbol: str, start: str, end: str) -> List[Split]:
        """Get split history from Alpha Vantage"""
        try:
            print(f"Fetching splits for {symbol}")
            
            # Alpha Vantage doesn't have a separate splits endpoint in free tier
            # Split info is included in the adjusted close calculation
            # For now, return empty - could be enhanced with premium tier
            return []
        
        except Exception as e:
            print(f"Error fetching splits for {symbol}: {e}")
            return []
    
    async def get_expense_ratio(self, symbol: str) -> Optional[float]:
        """Alpha Vantage doesn't provide expense ratios in free tier"""
        return None
