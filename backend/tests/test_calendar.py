"""
Tests for market calendar utilities.
"""

import pytest
from datetime import date
from engine.calendar import MarketCalendar


@pytest.fixture
def calendar():
    """Market calendar instance"""
    return MarketCalendar("NYSE")


def test_calendar_initialization():
    """Test calendar initialization"""
    cal = MarketCalendar("NYSE")
    assert cal.calendar is not None


def test_get_trading_days(calendar):
    """Test getting trading days in a range"""
    # Get trading days in January 2024
    days = calendar.get_trading_days("2024-01-01", "2024-01-31")
    
    assert len(days) > 0
    assert all(isinstance(d, date) for d in days)
    # January 2024 should have ~21 trading days
    assert 18 <= len(days) <= 23


def test_is_trading_day_weekday(calendar):
    """Test that a regular weekday is a trading day"""
    # Wednesday, January 10, 2024
    assert calendar.is_trading_day(date(2024, 1, 10)) is True


def test_is_trading_day_weekend(calendar):
    """Test that weekends are not trading days"""
    # Saturday, January 6, 2024
    assert calendar.is_trading_day(date(2024, 1, 6)) is False
    # Sunday, January 7, 2024
    assert calendar.is_trading_day(date(2024, 1, 7)) is False


def test_is_trading_day_holiday(calendar):
    """Test that holidays are not trading days"""
    # New Year's Day 2024 (Monday, January 1)
    assert calendar.is_trading_day(date(2024, 1, 1)) is False
    # Christmas 2024 (Wednesday, December 25)
    assert calendar.is_trading_day(date(2024, 12, 25)) is False


def test_next_trading_day(calendar):
    """Test getting next trading day"""
    # Friday to Monday (skip weekend)
    friday = date(2024, 1, 5)
    next_day = calendar.next_trading_day(friday)
    assert next_day == date(2024, 1, 8)  # Monday


def test_next_trading_day_after_holiday(calendar):
    """Test next trading day after a holiday"""
    # New Year's Day 2024 is Monday, next trading day is Tuesday
    new_years = date(2024, 1, 1)
    next_day = calendar.next_trading_day(new_years)
    assert next_day == date(2024, 1, 2)


def test_previous_trading_day(calendar):
    """Test getting previous trading day"""
    # Monday to Friday (skip weekend)
    monday = date(2024, 1, 8)
    prev_day = calendar.previous_trading_day(monday)
    assert prev_day == date(2024, 1, 5)  # Friday


def test_get_first_trading_day_of_month(calendar):
    """Test getting first trading day of month"""
    # January 2024: 1st is a holiday, so 2nd should be first trading day
    first = calendar.get_first_trading_day_of_month(2024, 1)
    assert first == date(2024, 1, 2)
    
    # February 2024: 1st is a Thursday (trading day)
    first = calendar.get_first_trading_day_of_month(2024, 2)
    assert first == date(2024, 2, 1)


def test_get_last_trading_day_of_month(calendar):
    """Test getting last trading day of month"""
    # January 2024: 31st is a Wednesday (trading day)
    last = calendar.get_last_trading_day_of_month(2024, 1)
    assert last == date(2024, 1, 31)
    
    # June 2024: 30th is a Sunday, so 28th (Friday) should be last
    last = calendar.get_last_trading_day_of_month(2024, 6)
    assert last == date(2024, 6, 28)


def test_get_first_trading_day_of_quarter(calendar):
    """Test getting first trading day of quarter"""
    # Q1 2024 (January)
    first_q1 = calendar.get_first_trading_day_of_quarter(2024, 1)
    assert first_q1.month == 1
    
    # Q2 2024 (April)
    first_q2 = calendar.get_first_trading_day_of_quarter(2024, 2)
    assert first_q2.month == 4
    
    # Q3 2024 (July)
    first_q3 = calendar.get_first_trading_day_of_quarter(2024, 3)
    assert first_q3.month == 7
    
    # Q4 2024 (October)
    first_q4 = calendar.get_first_trading_day_of_quarter(2024, 4)
    assert first_q4.month == 10


def test_get_first_trading_day_of_year(calendar):
    """Test getting first trading day of year"""
    # 2024: January 1 is a holiday, so 2nd should be first
    first = calendar.get_first_trading_day_of_year(2024)
    assert first == date(2024, 1, 2)


def test_align_to_business_day_first(calendar):
    """Test align to first business day"""
    # Weekend date should move to Monday
    saturday = date(2024, 1, 6)
    aligned = calendar.align_to_business_day(saturday, "FIRST_BUSINESS_DAY")
    assert aligned == date(2024, 1, 8)  # Monday
    
    # Trading day should stay the same
    wednesday = date(2024, 1, 10)
    aligned = calendar.align_to_business_day(wednesday, "FIRST_BUSINESS_DAY")
    assert aligned == wednesday


def test_align_to_business_day_last(calendar):
    """Test align to last business day"""
    # Weekend date should move to Friday
    saturday = date(2024, 1, 6)
    aligned = calendar.align_to_business_day(saturday, "LAST_BUSINESS_DAY")
    assert aligned == date(2024, 1, 5)  # Friday
    
    # Trading day should stay the same
    wednesday = date(2024, 1, 10)
    aligned = calendar.align_to_business_day(wednesday, "LAST_BUSINESS_DAY")
    assert aligned == wednesday


def test_align_to_business_day_next(calendar):
    """Test align to next business day"""
    # Friday should move to Monday
    friday = date(2024, 1, 5)
    aligned = calendar.align_to_business_day(friday, "NEXT")
    assert aligned == date(2024, 1, 8)  # Monday


def test_align_to_business_day_previous(calendar):
    """Test align to previous business day"""
    # Monday should move to Friday
    monday = date(2024, 1, 8)
    aligned = calendar.align_to_business_day(monday, "PREVIOUS")
    assert aligned == date(2024, 1, 5)  # Friday


def test_trading_days_cache(calendar):
    """Test that trading days are cached"""
    # First call
    days1 = calendar.get_trading_days("2024-01-01", "2024-01-31")
    
    # Second call should use cache
    days2 = calendar.get_trading_days("2024-01-01", "2024-01-31")
    
    assert days1 == days2
    assert ("2024-01-01", "2024-01-31") in calendar._cache


def test_trading_days_across_year_boundary(calendar):
    """Test getting trading days across year boundary"""
    days = calendar.get_trading_days("2023-12-15", "2024-01-15")
    
    assert len(days) > 0
    # Should have days from both years
    assert any(d.year == 2023 for d in days)
    assert any(d.year == 2024 for d in days)


def test_trading_days_single_day(calendar):
    """Test getting trading days for a single day"""
    # Trading day
    days = calendar.get_trading_days("2024-01-10", "2024-01-10")
    assert len(days) == 1
    assert days[0] == date(2024, 1, 10)
    
    # Non-trading day (weekend)
    days = calendar.get_trading_days("2024-01-06", "2024-01-06")
    assert len(days) == 0


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
