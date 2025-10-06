"""
Polygon.io data provider for reliable stock market data.
"""

import requests
import time
from datetime import datetime, timedelta
from typing import List, Optional
from providers.base import DataProvider
from engine.models import Bar, Dividend, Split


class PolygonProvider(DataProvider):
    """Polygon.io data provider"""
    
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.base_url = "https://api.polygon.io"
        self._cache = {}
        self.rate_limit_delay = 0.2  # 200ms between requests (free tier: 5 req/min)
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
        params['apiKey'] = self.api_key
        
        url = f"{self.base_url}{endpoint}"
        response = requests.get(url, params=params)
        
        if response.status_code == 200:
            return response.json()
        else:
            print(f"Polygon API error: {response.status_code} - {response.text}")
            return None
    
    async def get_symbols(
        self,
        universe: str,
        as_of: Optional[str] = None
    ) -> List[str]:
        """Polygon doesn't provide universe screening"""
        return []
    
    async def get_bars(
        self,
        symbol: str,
        start: str,
        end: str,
        freq: str = "daily"
    ) -> List[Bar]:
        """Download bars from Polygon.io"""
        try:
            # Convert dates to Polygon format (YYYY-MM-DD)
            # Polygon's aggregates endpoint: /v2/aggs/ticker/{symbol}/range/{multiplier}/{timespan}/{from}/{to}
            
            endpoint = f"/v2/aggs/ticker/{symbol}/range/1/day/{start}/{end}"
            params = {
                'adjusted': 'true',  # Get adjusted prices
                'sort': 'asc',
                'limit': 50000
            }
            
            data = self._make_request(endpoint, params)
            
            if not data or 'results' not in data or not data['results']:
                print(f"No data returned for {symbol}")
                return []
            
            bars = []
            for result in data['results']:
                # Polygon returns timestamps in milliseconds
                date = datetime.fromtimestamp(result['t'] / 1000).strftime('%Y-%m-%d')
                
                bar = Bar(
                    date=date,
                    open=float(result['o']),
                    high=float(result['h']),
                    low=float(result['l']),
                    close=float(result['c']),
                    adj_close=float(result['c']),  # Polygon's adjusted prices
                    volume=float(result['v'])
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
        """Get dividend history from Polygon.io"""
        try:
            endpoint = f"/v3/reference/dividends"
            params = {
                'ticker': symbol,
                'ex_dividend_date.gte': start,
                'ex_dividend_date.lte': end,
                'limit': 1000
            }
            
            data = self._make_request(endpoint, params)
            
            if not data or 'results' not in data:
                return []
            
            dividends = []
            for result in data['results']:
                div = Dividend(
                    ex_date=result['ex_dividend_date'],
                    amount=float(result['cash_amount']),
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
        """Get split history from Polygon.io"""
        try:
            endpoint = f"/v3/reference/splits"
            params = {
                'ticker': symbol,
                'execution_date.gte': start,
                'execution_date.lte': end,
                'limit': 1000
            }
            
            data = self._make_request(endpoint, params)
            
            if not data or 'results' not in data:
                return []
            
            splits = []
            for result in data['results']:
                # Polygon provides split_from and split_to
                # e.g., 2-for-1 split: split_from=1, split_to=2, ratio=2.0
                ratio = float(result['split_to']) / float(result['split_from'])
                
                split = Split(
                    ex_date=result['execution_date'],
                    ratio=ratio
                )
                splits.append(split)
            
            return splits
        
        except Exception as e:
            print(f"Error fetching splits for {symbol}: {e}")
            return []
    
    async def get_expense_ratio(self, symbol: str) -> Optional[float]:
        """Polygon doesn't provide expense ratios"""
        return None
