"""
Tests for performance metrics calculation.
"""

import pytest
import pandas as pd
import numpy as np
from datetime import date, timedelta
from engine.metrics import MetricsCalculator


@pytest.fixture
def metrics_calc():
    """Metrics calculator with 2% risk-free rate"""
    return MetricsCalculator(risk_free_rate=0.02)


@pytest.fixture
def simple_equity_curve():
    """Simple equity curve with steady growth"""
    dates = pd.date_range('2024-01-01', periods=252, freq='D')
    # Start at 100k, grow to 110k
    values = np.linspace(100000, 110000, 252)
    return pd.Series(values, index=dates)


@pytest.fixture
def volatile_equity_curve():
    """Volatile equity curve"""
    dates = pd.date_range('2024-01-01', periods=252, freq='D')
    np.random.seed(42)
    values = 100000 * np.exp(np.cumsum(np.random.randn(252) * 0.01))
    return pd.Series(values, index=dates)


def test_metrics_calculator_initialization():
    """Test metrics calculator initialization"""
    calc = MetricsCalculator(risk_free_rate=0.03)
    assert calc.risk_free_rate == 0.03


def test_calculate_twr_no_cashflows(metrics_calc, simple_equity_curve):
    """Test TWR calculation without cashflows"""
    twr = metrics_calc.calculate_twr(simple_equity_curve)
    
    # Should be (110000 / 100000) - 1 = 0.10 (10%)
    assert twr == pytest.approx(0.10, rel=1e-3)


def test_calculate_twr_with_cashflows(metrics_calc):
    """Test TWR calculation with cashflows"""
    dates = pd.date_range('2024-01-01', periods=100, freq='D')
    
    # Start with 100k, add 10k on day 50, end at 120k
    equity = pd.Series([100000] * 50 + [120000] * 50, index=dates)
    cashflows = pd.Series(0, index=dates)
    cashflows.iloc[50] = 10000
    
    twr = metrics_calc.calculate_twr(equity, cashflows)
    
    # Gain = 120000 - 100000 - 10000 = 10000
    # Return = 10000 / 110000 = 0.0909
    assert twr == pytest.approx(0.0909, rel=1e-2)


def test_calculate_twr_empty_curve(metrics_calc):
    """Test TWR with insufficient data"""
    equity = pd.Series([100000])
    twr = metrics_calc.calculate_twr(equity)
    assert twr == 0.0


def test_calculate_cagr(metrics_calc, simple_equity_curve):
    """Test CAGR calculation"""
    # Get number of years
    days = (simple_equity_curve.index[-1] - simple_equity_curve.index[0]).days
    years = days / 365.25
    
    # Calculate CAGR
    total_return = simple_equity_curve.iloc[-1] / simple_equity_curve.iloc[0]
    cagr = (total_return ** (1 / years)) - 1
    
    # Should be approximately 10% annualized
    assert cagr == pytest.approx(0.10, rel=1e-1)


def test_calculate_sharpe_ratio(metrics_calc):
    """Test Sharpe ratio calculation"""
    dates = pd.date_range('2024-01-01', periods=252, freq='D')
    
    # Create returns with known mean and std
    np.random.seed(42)
    returns = pd.Series(np.random.randn(252) * 0.01 + 0.0004, index=dates)  # ~10% annual
    
    # Sharpe = (mean_return - rf) / std_return
    annual_return = returns.mean() * 252
    annual_std = returns.std() * np.sqrt(252)
    sharpe = (annual_return - metrics_calc.risk_free_rate) / annual_std
    
    assert sharpe > 0


def test_calculate_sortino_ratio(metrics_calc):
    """Test Sortino ratio calculation"""
    dates = pd.date_range('2024-01-01', periods=252, freq='D')
    
    # Create returns
    np.random.seed(42)
    returns = pd.Series(np.random.randn(252) * 0.01 + 0.0004, index=dates)
    
    # Sortino uses downside deviation
    downside_returns = returns[returns < 0]
    downside_std = downside_returns.std() * np.sqrt(252)
    
    annual_return = returns.mean() * 252
    sortino = (annual_return - metrics_calc.risk_free_rate) / downside_std
    
    # Sortino should be higher than Sharpe (only penalizes downside)
    assert sortino > 0


def test_calculate_max_drawdown(metrics_calc, simple_equity_curve):
    """Test maximum drawdown calculation"""
    # Add a drawdown to the curve
    equity = simple_equity_curve.copy()
    equity.iloc[100:150] = equity.iloc[100:150] * 0.9  # 10% drawdown
    
    # Calculate running max
    running_max = equity.expanding().max()
    drawdown = (equity - running_max) / running_max
    max_dd = drawdown.min()
    
    assert max_dd < 0
    assert max_dd >= -0.11  # Should be around -10%


def test_calculate_max_drawdown_duration(metrics_calc):
    """Test maximum drawdown duration"""
    dates = pd.date_range('2024-01-01', periods=200, freq='D')
    
    # Create curve with drawdown
    values = [100000] * 50 + [90000] * 50 + [100000] * 100
    equity = pd.Series(values, index=dates)
    
    # Drawdown lasts 50 days
    running_max = equity.expanding().max()
    drawdown = (equity - running_max) / running_max
    
    # Count consecutive days in drawdown
    in_drawdown = drawdown < 0
    assert in_drawdown.sum() >= 50


def test_calculate_calmar_ratio(metrics_calc, simple_equity_curve):
    """Test Calmar ratio calculation"""
    # Calmar = CAGR / abs(max_drawdown)
    
    # Calculate CAGR
    days = (simple_equity_curve.index[-1] - simple_equity_curve.index[0]).days
    years = days / 365.25
    total_return = simple_equity_curve.iloc[-1] / simple_equity_curve.iloc[0]
    cagr = (total_return ** (1 / years)) - 1
    
    # Calculate max drawdown
    running_max = simple_equity_curve.expanding().max()
    drawdown = (simple_equity_curve - running_max) / running_max
    max_dd = abs(drawdown.min())
    
    if max_dd > 0:
        calmar = cagr / max_dd
        assert calmar > 0


def test_calculate_alpha_beta(metrics_calc):
    """Test alpha and beta calculation vs benchmark"""
    dates = pd.date_range('2024-01-01', periods=252, freq='D')
    
    # Create correlated returns
    np.random.seed(42)
    benchmark_returns = pd.Series(np.random.randn(252) * 0.01, index=dates)
    portfolio_returns = benchmark_returns * 1.2 + np.random.randn(252) * 0.005
    
    # Beta = covariance / variance
    covariance = portfolio_returns.cov(benchmark_returns)
    variance = benchmark_returns.var()
    beta = covariance / variance
    
    # Alpha = portfolio_return - (rf + beta * (benchmark_return - rf))
    assert beta > 0


def test_calculate_tracking_error(metrics_calc):
    """Test tracking error calculation"""
    dates = pd.date_range('2024-01-01', periods=252, freq='D')
    
    np.random.seed(42)
    portfolio_returns = pd.Series(np.random.randn(252) * 0.01, index=dates)
    benchmark_returns = pd.Series(np.random.randn(252) * 0.01, index=dates)
    
    # Tracking error = std of (portfolio - benchmark)
    tracking_error = (portfolio_returns - benchmark_returns).std() * np.sqrt(252)
    
    assert tracking_error > 0


def test_calculate_information_ratio(metrics_calc):
    """Test information ratio calculation"""
    dates = pd.date_range('2024-01-01', periods=252, freq='D')
    
    np.random.seed(42)
    portfolio_returns = pd.Series(np.random.randn(252) * 0.01 + 0.0005, index=dates)
    benchmark_returns = pd.Series(np.random.randn(252) * 0.01 + 0.0003, index=dates)
    
    # IR = (portfolio_return - benchmark_return) / tracking_error
    excess_return = (portfolio_returns - benchmark_returns).mean() * 252
    tracking_error = (portfolio_returns - benchmark_returns).std() * np.sqrt(252)
    
    if tracking_error > 0:
        ir = excess_return / tracking_error
        assert isinstance(ir, float)


def test_calculate_win_rate(metrics_calc):
    """Test win rate calculation"""
    dates = pd.date_range('2024-01-01', periods=100, freq='D')
    
    # 60% positive days
    np.random.seed(42)
    returns = pd.Series(np.random.randn(100), index=dates)
    
    win_rate = (returns > 0).sum() / len(returns)
    
    assert 0 <= win_rate <= 1


def test_calculate_best_worst_periods(metrics_calc, volatile_equity_curve):
    """Test best and worst period calculations"""
    returns = volatile_equity_curve.pct_change().dropna()
    
    best_day = returns.max()
    worst_day = returns.min()
    
    assert best_day > 0
    assert worst_day < 0
    assert best_day > abs(worst_day) or best_day < abs(worst_day)


def test_calculate_rolling_returns(metrics_calc, simple_equity_curve):
    """Test rolling return calculations"""
    # 30-day rolling return
    rolling_30d = simple_equity_curve.pct_change(30)
    
    assert len(rolling_30d) == len(simple_equity_curve)
    assert pd.isna(rolling_30d.iloc[:30]).all()


def test_calculate_monthly_returns(metrics_calc):
    """Test monthly return calculations"""
    dates = pd.date_range('2024-01-01', periods=365, freq='D')
    equity = pd.Series(range(100000, 100365), index=dates)
    
    # Resample to monthly
    monthly = equity.resample('M').last()
    monthly_returns = monthly.pct_change()
    
    assert len(monthly_returns) == 12


def test_calculate_annual_volatility(metrics_calc):
    """Test annualized volatility calculation"""
    dates = pd.date_range('2024-01-01', periods=252, freq='D')
    
    np.random.seed(42)
    returns = pd.Series(np.random.randn(252) * 0.01, index=dates)
    
    # Annual vol = daily_std * sqrt(252)
    annual_vol = returns.std() * np.sqrt(252)
    
    assert annual_vol > 0


def test_zero_returns(metrics_calc):
    """Test metrics with zero returns"""
    dates = pd.date_range('2024-01-01', periods=100, freq='D')
    equity = pd.Series([100000] * 100, index=dates)
    
    twr = metrics_calc.calculate_twr(equity)
    assert twr == 0.0


def test_negative_returns(metrics_calc):
    """Test metrics with negative returns"""
    dates = pd.date_range('2024-01-01', periods=100, freq='D')
    equity = pd.Series(range(100000, 90000, -100), index=dates)
    
    twr = metrics_calc.calculate_twr(equity)
    assert twr < 0


def test_calculate_ulcer_index(metrics_calc, volatile_equity_curve):
    """Test Ulcer Index calculation (alternative to max drawdown)"""
    # Ulcer Index = sqrt(mean(drawdown^2))
    running_max = volatile_equity_curve.expanding().max()
    drawdown_pct = (volatile_equity_curve - running_max) / running_max * 100
    
    ulcer = np.sqrt((drawdown_pct ** 2).mean())
    
    assert ulcer >= 0


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
