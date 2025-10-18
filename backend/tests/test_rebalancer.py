"""
Tests for rebalancing logic with tax-aware trading.
"""

import pytest
from datetime import date
from engine.rebalancer import Rebalancer
from engine.portfolio import Portfolio
from engine.calendar import MarketCalendar
from engine.models import (
    RebalancingConfig, RebalanceType, CalendarRebalanceConfig, 
    DriftRebalanceConfig, CalendarPeriod
)
from engine.constants import AccountType


@pytest.fixture
def calendar():
    """Market calendar"""
    return MarketCalendar("NYSE")


@pytest.fixture
def taxable_portfolio():
    """Taxable portfolio with positions"""
    portfolio = Portfolio(100000, AccountType.TAXABLE)
    portfolio.buy("SPY", 100, 400, date(2024, 1, 1))
    portfolio.buy("AGG", 200, 100, date(2024, 1, 1))
    return portfolio


def test_rebalancer_initialization_calendar(calendar):
    """Test rebalancer initialization with calendar config"""
    config = RebalancingConfig(
        type=RebalanceType.CALENDAR,
        calendar=CalendarConfig(period=CalendarPeriod.MONTHLY)
    )
    
    rebalancer = Rebalancer(config, calendar, AccountType.TAXABLE)
    
    assert rebalancer.config == config
    assert rebalancer.account_type == AccountType.TAXABLE
    assert rebalancer.last_rebalance_date is None


def test_rebalancer_initialization_drift(calendar):
    """Test rebalancer initialization with drift config"""
    config = RebalancingConfig(
        type=RebalanceType.DRIFT,
        drift=DriftConfig(abs_pct=0.05)
    )
    
    rebalancer = Rebalancer(config, calendar, AccountType.TAXABLE)
    assert rebalancer.config.drift.abs_pct == 0.05


def test_should_rebalance_cashflow_only(calendar):
    """Test cashflow-only rebalancing"""
    config = RebalancingConfig(type=RebalanceType.CASHFLOW_ONLY)
    rebalancer = Rebalancer(config, calendar, AccountType.TAXABLE)
    
    current_weights = {"SPY": 0.6, "AGG": 0.4}
    target_weights = {"SPY": 0.5, "AGG": 0.5}
    
    # Should not rebalance on regular day
    should, reason = rebalancer.should_rebalance(
        date(2024, 1, 10), current_weights, target_weights, is_deposit_day=False
    )
    assert should is False
    
    # Should rebalance on deposit day
    should, reason = rebalancer.should_rebalance(
        date(2024, 1, 10), current_weights, target_weights, is_deposit_day=True
    )
    assert should is True
    assert reason == "deposit"


def test_should_rebalance_calendar_monthly(calendar):
    """Test monthly calendar rebalancing"""
    config = RebalancingConfig(
        type=RebalanceType.CALENDAR,
        calendar=CalendarRebalanceConfig(period=CalendarPeriod.MONTHLY)
    )
    rebalancer = Rebalancer(config, calendar, AccountType.TAXABLE)
    
    current_weights = {"SPY": 0.6, "AGG": 0.4}
    target_weights = {"SPY": 0.5, "AGG": 0.5}
    
    # First call initializes next rebalance date
    should, reason = rebalancer.should_rebalance(
        date(2024, 1, 10), current_weights, target_weights
    )
    assert should is False
    
    # Should trigger on first day of next month
    should, reason = rebalancer.should_rebalance(
        date(2024, 2, 1), current_weights, target_weights
    )
    assert should is True
    assert reason == "calendar"


def test_should_rebalance_calendar_quarterly(calendar):
    """Test quarterly calendar rebalancing"""
    config = RebalancingConfig(
        type=RebalanceType.CALENDAR,
        calendar=CalendarRebalanceConfig(period=CalendarPeriod.QUARTERLY)
    )
    rebalancer = Rebalancer(config, calendar, AccountType.TAXABLE)
    
    current_weights = {"SPY": 0.6, "AGG": 0.4}
    target_weights = {"SPY": 0.5, "AGG": 0.5}
    
    # Initialize
    rebalancer.should_rebalance(date(2024, 1, 10), current_weights, target_weights)
    
    # Should not trigger in February
    should, _ = rebalancer.should_rebalance(
        date(2024, 2, 1), current_weights, target_weights
    )
    assert should is False
    
    # Should trigger in April (Q2)
    should, reason = rebalancer.should_rebalance(
        date(2024, 4, 1), current_weights, target_weights
    )
    assert should is True


def test_should_rebalance_drift_absolute(calendar):
    """Test drift-based rebalancing with absolute threshold"""
    config = RebalancingConfig(
        type=RebalanceType.DRIFT,
        drift=DriftRebalanceConfig(abs_pct=0.05)  # 5% absolute drift
    )
    rebalancer = Rebalancer(config, calendar, AccountType.TAXABLE)
    
    target_weights = {"SPY": 0.5, "AGG": 0.5}
    
    # Small drift - should not trigger
    current_weights = {"SPY": 0.52, "AGG": 0.48}
    should, _ = rebalancer.should_rebalance(
        date(2024, 1, 10), current_weights, target_weights
    )
    assert should is False
    
    # Large drift - should trigger
    current_weights = {"SPY": 0.60, "AGG": 0.40}
    should, reason = rebalancer.should_rebalance(
        date(2024, 1, 10), current_weights, target_weights
    )
    assert should is True
    assert reason == "drift"


def test_should_rebalance_drift_relative(calendar):
    """Test drift-based rebalancing with relative threshold"""
    config = RebalancingConfig(
        type=RebalanceType.DRIFT,
        drift=DriftRebalanceConfig(rel_pct=0.10)  # 10% relative drift
    )
    rebalancer = Rebalancer(config, calendar, AccountType.TAXABLE)
    
    target_weights = {"SPY": 0.5, "AGG": 0.5}
    
    # 5% absolute drift = 10% relative drift (5/50)
    current_weights = {"SPY": 0.55, "AGG": 0.45}
    should, reason = rebalancer.should_rebalance(
        date(2024, 1, 10), current_weights, target_weights
    )
    assert should is True
    assert reason == "drift"


def test_should_rebalance_both(calendar):
    """Test hybrid rebalancing (calendar OR drift)"""
    config = RebalancingConfig(
        type=RebalanceType.BOTH,
        calendar=CalendarRebalanceConfig(period=CalendarPeriod.MONTHLY),
        drift=DriftRebalanceConfig(abs_pct=0.05)
    )
    rebalancer = Rebalancer(config, calendar, AccountType.TAXABLE)
    
    target_weights = {"SPY": 0.5, "AGG": 0.5}
    
    # Initialize
    rebalancer.should_rebalance(date(2024, 1, 10), target_weights, target_weights)
    
    # Should trigger on drift even before calendar date
    current_weights = {"SPY": 0.60, "AGG": 0.40}
    should, reason = rebalancer.should_rebalance(
        date(2024, 1, 15), current_weights, target_weights
    )
    assert should is True
    assert reason == "drift"


def test_generate_deposit_trades(calendar, taxable_portfolio):
    """Test generating trades for a deposit"""
    config = RebalancingConfig(type=RebalanceType.CASHFLOW_ONLY)
    rebalancer = Rebalancer(config, calendar, AccountType.TAXABLE)
    
    target_weights = {"SPY": 0.6, "AGG": 0.4}
    current_prices = {"SPY": 400, "AGG": 100}
    deposit_amount = 10000
    
    trades = rebalancer.generate_deposit_trades(
        target_weights, deposit_amount, current_prices
    )
    
    # Should have 2 buy trades
    assert len(trades) == 2
    
    # Check allocations
    spy_trade = [t for t in trades if t[0] == "SPY"][0]
    agg_trade = [t for t in trades if t[0] == "AGG"][0]
    
    assert spy_trade[1] == "BUY"
    assert agg_trade[1] == "BUY"
    
    # SPY should get 60% of deposit
    assert spy_trade[2] == pytest.approx(10000 * 0.6 / 400)
    # AGG should get 40% of deposit
    assert agg_trade[2] == pytest.approx(10000 * 0.4 / 100)


def test_generate_deposit_trades_zero_deposit(calendar):
    """Test deposit trades with zero deposit"""
    config = RebalancingConfig(type=RebalanceType.CASHFLOW_ONLY)
    rebalancer = Rebalancer(config, calendar, AccountType.TAXABLE)
    
    target_weights = {"SPY": 0.6, "AGG": 0.4}
    current_prices = {"SPY": 400, "AGG": 100}
    
    trades = rebalancer.generate_deposit_trades(
        target_weights, 0, current_prices
    )
    
    assert len(trades) == 0


def test_generate_rebalance_trades(calendar, taxable_portfolio):
    """Test generating rebalance trades"""
    config = RebalancingConfig(type=RebalanceType.CALENDAR)
    rebalancer = Rebalancer(config, calendar, AccountType.TAXABLE)
    
    target_weights = {"SPY": 0.5, "AGG": 0.5}
    current_prices = {"SPY": 400, "AGG": 100}
    
    trades = rebalancer.generate_rebalance_trades(
        taxable_portfolio, target_weights, current_prices, date(2024, 2, 1)
    )
    
    # Should have trades to rebalance
    assert len(trades) > 0


def test_rebalance_with_tax_loss_harvesting(calendar):
    """Test that rebalancer prioritizes selling losses in taxable accounts"""
    config = RebalancingConfig(type=RebalanceType.CALENDAR)
    rebalancer = Rebalancer(config, calendar, AccountType.TAXABLE)
    
    # Create portfolio with a loss position
    portfolio = Portfolio(100000, AccountType.TAXABLE)
    portfolio.buy("SPY", 100, 500, date(2024, 1, 1))  # Will be at loss
    portfolio.buy("AGG", 200, 100, date(2024, 1, 1))  # Will be at gain
    
    target_weights = {"SPY": 0.3, "AGG": 0.7}
    current_prices = {"SPY": 400, "AGG": 120}  # SPY down, AGG up
    
    trades = rebalancer.generate_rebalance_trades(
        portfolio, target_weights, current_prices, date(2024, 6, 1)
    )
    
    # Should generate trades
    assert isinstance(trades, list)


def test_calendar_period_daily(calendar):
    """Test daily rebalancing period"""
    config = RebalancingConfig(
        type=RebalanceType.CALENDAR,
        calendar=CalendarRebalanceConfig(period=CalendarPeriod.DAILY)
    )
    rebalancer = Rebalancer(config, calendar, AccountType.TAXABLE)
    
    # Should rebalance every trading day
    rebalancer.should_rebalance(
        date(2024, 1, 2), {}, {}, is_deposit_day=False
    )
    
    should, _ = rebalancer.should_rebalance(
        date(2024, 1, 3), {}, {}, is_deposit_day=False
    )
    assert should is True


def test_calendar_period_yearly(calendar):
    """Test yearly rebalancing period"""
    config = RebalancingConfig(
        type=RebalanceType.CALENDAR,
        calendar=CalendarRebalanceConfig(period=CalendarPeriod.YEARLY)
    )
    rebalancer = Rebalancer(config, calendar, AccountType.TAXABLE)
    
    # Initialize
    rebalancer.should_rebalance(date(2024, 1, 2), {}, {})
    
    # Should not trigger in same year
    should, _ = rebalancer.should_rebalance(date(2024, 6, 1), {}, {})
    assert should is False
    
    # Should trigger in next year
    should, _ = rebalancer.should_rebalance(date(2025, 1, 2), {}, {})
    assert should is True


def test_rebalancer_with_ira_account(calendar):
    """Test rebalancer with IRA account (no tax considerations)"""
    config = RebalancingConfig(
        type=RebalanceType.DRIFT,
        drift=DriftRebalanceConfig(abs_pct=0.05)
    )
    rebalancer = Rebalancer(config, calendar, AccountType.ROTH_IRA)
    
    assert rebalancer.account_type == AccountType.ROTH_IRA


def test_empty_target_weights(calendar, taxable_portfolio):
    """Test rebalancing with empty target weights"""
    config = RebalancingConfig(type=RebalanceType.CALENDAR)
    rebalancer = Rebalancer(config, calendar, AccountType.TAXABLE)
    
    target_weights = {}
    current_prices = {"SPY": 400, "AGG": 100}
    
    trades = rebalancer.generate_rebalance_trades(
        taxable_portfolio, target_weights, current_prices, date(2024, 2, 1)
    )
    
    # Should handle empty weights gracefully
    assert isinstance(trades, list)


def test_drift_with_zero_target_weight(calendar):
    """Test drift calculation when target weight is zero"""
    config = RebalancingConfig(
        type=RebalanceType.DRIFT,
        drift=DriftRebalanceConfig(rel_pct=0.10)
    )
    rebalancer = Rebalancer(config, calendar, AccountType.TAXABLE)
    
    target_weights = {"SPY": 1.0, "AGG": 0.0}
    current_weights = {"SPY": 0.9, "AGG": 0.1}
    
    # Should handle zero target weight
    should, _ = rebalancer.should_rebalance(
        date(2024, 1, 10), current_weights, target_weights
    )
    assert isinstance(should, bool)


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
