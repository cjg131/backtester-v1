"""
Market calendar utilities using NYSE trading days.
"""

import pandas as pd
import pandas_market_calendars as mcal
from datetime import datetime, date
from typing import List


class MarketCalendar:
    """NYSE market calendar for determining trading days"""
    
    def __init__(self, calendar_name: str = "NYSE"):
        self.calendar = mcal.get_calendar(calendar_name)
        self._cache = {}
    
    def get_trading_days(self, start: str, end: str) -> List[date]:
        """
        Get list of trading days between start and end (inclusive).
        
        Args:
            start: Start date (YYYY-MM-DD)
            end: End date (YYYY-MM-DD)
            
        Returns:
            List of trading days as date objects
        """
        cache_key = (start, end)
        if cache_key in self._cache:
            return self._cache[cache_key]
        
        schedule = self.calendar.schedule(start_date=start, end_date=end)
        trading_days = [d.date() for d in schedule.index]
        
        self._cache[cache_key] = trading_days
        return trading_days
    
    def is_trading_day(self, dt: date) -> bool:
        """Check if a given date is a trading day"""
        dt_str = dt.strftime("%Y-%m-%d")
        schedule = self.calendar.schedule(start_date=dt_str, end_date=dt_str)
        return len(schedule) > 0
    
    def next_trading_day(self, dt: date) -> date:
        """Get the next trading day after the given date"""
        current = dt
        max_attempts = 10  # Prevent infinite loops
        attempts = 0
        
        while attempts < max_attempts:
            current = current + pd.Timedelta(days=1)
            if self.is_trading_day(current):
                return current
            attempts += 1
        
        raise ValueError(f"Could not find next trading day after {dt}")
    
    def previous_trading_day(self, dt: date) -> date:
        """Get the previous trading day before the given date"""
        current = dt
        max_attempts = 10
        attempts = 0
        
        while attempts < max_attempts:
            current = current - pd.Timedelta(days=1)
            if self.is_trading_day(current):
                return current
            attempts += 1
        
        raise ValueError(f"Could not find previous trading day before {dt}")
    
    def get_first_trading_day_of_month(self, year: int, month: int) -> date:
        """Get the first trading day of a given month"""
        first_day = date(year, month, 1)
        if self.is_trading_day(first_day):
            return first_day
        return self.next_trading_day(first_day)
    
    def get_last_trading_day_of_month(self, year: int, month: int) -> date:
        """Get the last trading day of a given month"""
        # Get first day of next month, then go back
        if month == 12:
            next_month = date(year + 1, 1, 1)
        else:
            next_month = date(year, month + 1, 1)
        
        last_day = next_month - pd.Timedelta(days=1)
        if self.is_trading_day(last_day):
            return last_day
        return self.previous_trading_day(last_day)
    
    def get_first_trading_day_of_quarter(self, year: int, quarter: int) -> date:
        """Get the first trading day of a given quarter (1-4)"""
        month = (quarter - 1) * 3 + 1
        return self.get_first_trading_day_of_month(year, month)
    
    def get_first_trading_day_of_year(self, year: int) -> date:
        """Get the first trading day of a given year"""
        return self.get_first_trading_day_of_month(year, 1)
    
    def align_to_business_day(self, dt: date, rule: str = "FIRST_BUSINESS_DAY") -> date:
        """
        Align a date to a business day according to a rule.
        
        Args:
            dt: Date to align
            rule: Alignment rule (FIRST_BUSINESS_DAY, LAST_BUSINESS_DAY, NEXT, PREVIOUS)
            
        Returns:
            Aligned trading day
        """
        if rule == "FIRST_BUSINESS_DAY":
            # If it's a trading day, use it; otherwise next
            if self.is_trading_day(dt):
                return dt
            return self.next_trading_day(dt)
        elif rule == "LAST_BUSINESS_DAY":
            # If it's a trading day, use it; otherwise previous
            if self.is_trading_day(dt):
                return dt
            return self.previous_trading_day(dt)
        elif rule == "NEXT":
            return self.next_trading_day(dt)
        elif rule == "PREVIOUS":
            return self.previous_trading_day(dt)
        else:
            # Default: use as-is if trading day, else next
            if self.is_trading_day(dt):
                return dt
            return self.next_trading_day(dt)
