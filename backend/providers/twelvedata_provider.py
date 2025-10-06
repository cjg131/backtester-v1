"""
Twelve Data API provider for reliable stock market data.
Free tier: 800 API calls/day
"""

import requests
import time
from datetime import datetime
from typing import List, Optional
from providers.base import DataProvider
from engine.models import Bar, Dividend, Split


class TwelveDataProvider(DataProvider):
    """Twelve Data API provider"""
    
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.base_url = "https://api.twelvedata.com"
        self._cache = {}
        self.rate_limit_delay = 0.1  # 100ms between requests (free tier: ~8 req/sec)
        self.last_request_time = 0
    
    def _rate_limit(self):
        """Enforce rate limiting"""
        current_time = time.time()
        time_since_last = current_time - self.last_request_time
        if time_since_last < self.rate_limit_delay:
            time.sleep(self.rate_limit_delay - time_since_last)
        self.last_request_time = time.time()
    
    def _make_request(self, endpoint: str, params: dict = None) -> dict:
        """Make API request with rate limiting"""
        self._rate_limit()
        
        if params is None:
            params = {}
        params['apikey'] = self.api_key
        
        url = f"{self.base_url}{endpoint}"
        response = requests.get(url, params=params)
        
        if response.status_code == 200:
            return response.json()
        else:
            print(f"Twelve Data API error: {response.status_code} - {response.text}")
            return None
    
    async def get_symbols(
        self,
        universe: str,
        as_of: Optional[str] = None
    ) -> List[str]:
        """Twelve Data doesn't provide universe screening"""
        return []
    
    async def get_bars(
        self,
        symbol: str,
        start: str,
        end: str,
        freq: str = "daily"
    ) -> List[Bar]:
        """Download bars from Twelve Data"""
        try:
            # Twelve Data time series endpoint
            params = {
                'symbol': symbol,
                'interval': '1day',
                'start_date': start,
                'end_date': end,
                'outputsize': 5000
            }
            
            data = self._make_request('/time_series', params)
            
            if not data or 'values' not in data or not data['values']:
                print(f"No data returned for {symbol}")
                return []
            
            bars = []
            for item in reversed(data['values']):  # Twelve Data returns newest first
                bar = Bar(
                    date=item['datetime'],
                    open=float(item['open']),
                    high=float(item['high']),
                    low=float(item['low']),
                    close=float(item['close']),
                    adj_close=float(item['close']),  # Twelve Data provides adjusted in separate endpoint
                    volume=float(item.get('volume', 0))
                )
                bars.append(bar)
            
            print(f"Loaded {len(bars)} bars for {symbol}")
            return bars
        
        except Exception as e:
            print(f"Error fetching bars for {symbol}: {e}")
            return []
    
    async def get_dividends(
        self,
        symbol: str,
        start: str,
        end: str
    ) -> List[Dividend]:
        """Get dividend history from Twelve Data"""
        try:
            # Twelve Data dividends endpoint
            params = {
                'symbol': symbol,
                'start_date': start,
                'end_date': end
            }
            
            data = self._make_request('/dividends', params)
            
            if not data or 'dividends' not in data:
                return []
            
            dividends = []
            for item in data['dividends']:
                div = Dividend(
                    ex_date=item['ex_date'],
                    amount=float(item['amount']),
                    qualified_pct=1.0  # Assume qualified
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
        """Get split history from Twelve Data"""
        try:
            # Twelve Data splits endpoint
            params = {
                'symbol': symbol,
                'start_date': start,
                'end_date': end
            }
            
            data = self._make_request('/splits', params)
            
            if not data or 'splits' not in data:
                return []
            
            splits = []
            for item in data['splits']:
                # Twelve Data provides "from_factor" and "to_factor"
                # e.g., 2-for-1 split: from=1, to=2
                ratio = float(item['to_factor']) / float(item['from_factor'])
                
                split = Split(
                    ex_date=item['date'],
                    ratio=ratio
                )
                splits.append(split)
            
            return splits
        
        except Exception as e:
            print(f"Error fetching splits for {symbol}: {e}")
            return []
    
    async def get_expense_ratio(self, symbol: str) -> Optional[float]:
        """Twelve Data doesn't provide expense ratios in free tier"""
        return None
