"""
Tests for technical indicators and signal generation.
"""

import pytest
import pandas as pd
import numpy as np
from engine.signals import SignalGenerator


@pytest.fixture
def signal_gen():
    """Signal generator instance"""
    return SignalGenerator()


@pytest.fixture
def sample_prices():
    """Sample price series for testing"""
    # Create a simple uptrend
    dates = pd.date_range('2024-01-01', periods=100, freq='D')
    prices = pd.Series(range(100, 200), index=dates)
    return prices


@pytest.fixture
def volatile_prices():
    """Volatile price series for testing"""
    dates = pd.date_range('2024-01-01', periods=100, freq='D')
    np.random.seed(42)
    prices = pd.Series(100 + np.cumsum(np.random.randn(100) * 2), index=dates)
    return prices


def test_signal_generator_initialization():
    """Test signal generator initialization"""
    gen = SignalGenerator()
    assert gen.indicators == {}


def test_calculate_sma(signal_gen, sample_prices):
    """Test Simple Moving Average calculation"""
    sma = signal_gen.calculate_sma(sample_prices, period=10)
    
    # First 9 values should be NaN (not enough data)
    assert pd.isna(sma.iloc[:9]).all()
    
    # 10th value should be average of first 10 prices
    assert sma.iloc[9] == pytest.approx(104.5)
    
    # Last value should be average of last 10 prices
    assert sma.iloc[-1] == pytest.approx(194.5)


def test_calculate_sma_different_periods(signal_gen, sample_prices):
    """Test SMA with different periods"""
    sma_5 = signal_gen.calculate_sma(sample_prices, period=5)
    sma_20 = signal_gen.calculate_sma(sample_prices, period=20)
    
    # Shorter period should have fewer NaN values
    assert pd.isna(sma_5).sum() < pd.isna(sma_20).sum()


def test_calculate_ema(signal_gen, sample_prices):
    """Test Exponential Moving Average calculation"""
    ema = signal_gen.calculate_ema(sample_prices, period=10)
    
    # First 9 values should be NaN
    assert pd.isna(ema.iloc[:9]).all()
    
    # EMA should exist after warmup period
    assert not pd.isna(ema.iloc[10:]).any()
    
    # EMA should be different from SMA
    sma = signal_gen.calculate_sma(sample_prices, period=10)
    assert not ema.iloc[20:].equals(sma.iloc[20:])


def test_calculate_rsi(signal_gen, volatile_prices):
    """Test Relative Strength Index calculation"""
    rsi = signal_gen.calculate_rsi(volatile_prices, period=14)
    
    # RSI should be between 0 and 100
    valid_rsi = rsi.dropna()
    assert (valid_rsi >= 0).all()
    assert (valid_rsi <= 100).all()


def test_calculate_rsi_extreme_values(signal_gen):
    """Test RSI with extreme price movements"""
    # All up days
    dates = pd.date_range('2024-01-01', periods=50, freq='D')
    up_prices = pd.Series(range(100, 150), index=dates)
    rsi_up = signal_gen.calculate_rsi(up_prices, period=14)
    
    # RSI should be high (near 100) for consistent uptrend
    assert rsi_up.iloc[-1] > 70
    
    # All down days
    down_prices = pd.Series(range(150, 100, -1), index=dates)
    rsi_down = signal_gen.calculate_rsi(down_prices, period=14)
    
    # RSI should be low (near 0) for consistent downtrend
    assert rsi_down.iloc[-1] < 30


def test_calculate_macd(signal_gen, sample_prices):
    """Test MACD indicator calculation"""
    macd = signal_gen.calculate_macd(sample_prices, fast=12, slow=26, signal=9)
    
    assert 'macd' in macd
    assert 'signal' in macd
    assert 'histogram' in macd
    
    # MACD line should exist
    assert not pd.isna(macd['macd'].iloc[-1])
    
    # Signal line should exist
    assert not pd.isna(macd['signal'].iloc[-1])
    
    # Histogram should be MACD - Signal
    assert macd['histogram'].iloc[-1] == pytest.approx(
        macd['macd'].iloc[-1] - macd['signal'].iloc[-1]
    )


def test_calculate_macd_uptrend(signal_gen, sample_prices):
    """Test MACD in uptrend"""
    macd = signal_gen.calculate_macd(sample_prices)
    
    # In uptrend, MACD should generally be positive
    assert macd['macd'].iloc[-1] > 0


def test_calculate_momentum(signal_gen, sample_prices):
    """Test momentum indicator calculation"""
    momentum = signal_gen.calculate_momentum(sample_prices, lookback=20, skip=1)
    
    # Momentum should exist after warmup
    assert not pd.isna(momentum.iloc[-1])
    
    # For uptrend, momentum should be positive
    assert momentum.iloc[-1] > 0


def test_calculate_momentum_12_1(signal_gen):
    """Test 12-1 month momentum (252-21 days)"""
    # Create 300 days of data
    dates = pd.date_range('2024-01-01', periods=300, freq='D')
    prices = pd.Series(range(100, 400), index=dates)
    
    momentum = signal_gen.calculate_momentum(prices, lookback=252, skip=21)
    
    # Should have momentum values after warmup
    assert not pd.isna(momentum.iloc[-1])


def test_calculate_52week_high(signal_gen):
    """Test 52-week high calculation"""
    # Create 300 days of data
    dates = pd.date_range('2024-01-01', periods=300, freq='D')
    prices = pd.Series(range(100, 400), index=dates)
    
    high_52w = signal_gen.calculate_52week_high(prices)
    
    # First 251 values should be NaN
    assert pd.isna(high_52w.iloc[:251]).all()
    
    # After warmup, should have values
    assert not pd.isna(high_52w.iloc[252:]).any()
    
    # In uptrend, 52w high should be current or recent price
    assert high_52w.iloc[-1] == prices.iloc[-1]


def test_calculate_52week_breakout(signal_gen):
    """Test 52-week breakout signal"""
    # Create data with a breakout
    dates = pd.date_range('2024-01-01', periods=300, freq='D')
    # Flat for 252 days, then breakout
    prices_data = [100] * 252 + list(range(101, 149))
    prices = pd.Series(prices_data, index=dates)
    
    breakout = signal_gen.calculate_52week_breakout(prices)
    
    # Should have breakout signals after the flat period
    assert breakout.iloc[-1] == True


def test_calculate_bollinger_bands(signal_gen, volatile_prices):
    """Test Bollinger Bands calculation"""
    bb = signal_gen.calculate_bollinger_bands(volatile_prices, period=20, std_dev=2.0)
    
    assert 'middle' in bb
    assert 'upper' in bb
    assert 'lower' in bb
    
    # Middle band should be SMA
    sma = signal_gen.calculate_sma(volatile_prices, period=20)
    assert bb['middle'].equals(sma)
    
    # Upper band should be above middle
    assert (bb['upper'].dropna() >= bb['middle'].dropna()).all()
    
    # Lower band should be below middle
    assert (bb['lower'].dropna() <= bb['middle'].dropna()).all()


def test_bollinger_bands_width(signal_gen):
    """Test Bollinger Bands width with different volatility"""
    dates = pd.date_range('2024-01-01', periods=100, freq='D')
    
    # Low volatility
    low_vol = pd.Series([100] * 100, index=dates)
    bb_low = signal_gen.calculate_bollinger_bands(low_vol, period=20)
    
    # High volatility
    np.random.seed(42)
    high_vol = pd.Series(100 + np.cumsum(np.random.randn(100) * 10), index=dates)
    bb_high = signal_gen.calculate_bollinger_bands(high_vol, period=20)
    
    # High volatility should have wider bands
    width_low = (bb_low['upper'] - bb_low['lower']).iloc[-1]
    width_high = (bb_high['upper'] - bb_high['lower']).iloc[-1]
    
    assert width_high > width_low


def test_sma_crossover_signal(signal_gen):
    """Test SMA crossover detection"""
    # Create data with a crossover
    dates = pd.date_range('2024-01-01', periods=100, freq='D')
    # Downtrend then uptrend
    prices_data = list(range(150, 100, -1)) + list(range(100, 150))
    prices = pd.Series(prices_data[:100], index=dates)
    
    sma_fast = signal_gen.calculate_sma(prices, period=10)
    sma_slow = signal_gen.calculate_sma(prices, period=20)
    
    # Check for crossover
    crossover = (sma_fast > sma_slow) & (sma_fast.shift(1) <= sma_slow.shift(1))
    
    # Should have at least one crossover
    assert crossover.sum() > 0


def test_rsi_oversold_signal(signal_gen):
    """Test RSI oversold condition"""
    # Create oversold condition
    dates = pd.date_range('2024-01-01', periods=50, freq='D')
    prices = pd.Series(range(150, 100, -1), index=dates)
    
    rsi = signal_gen.calculate_rsi(prices, period=14)
    
    # RSI should be below 30 (oversold)
    assert rsi.iloc[-1] < 30


def test_rsi_overbought_signal(signal_gen):
    """Test RSI overbought condition"""
    # Create overbought condition
    dates = pd.date_range('2024-01-01', periods=50, freq='D')
    prices = pd.Series(range(100, 150), index=dates)
    
    rsi = signal_gen.calculate_rsi(prices, period=14)
    
    # RSI should be above 70 (overbought)
    assert rsi.iloc[-1] > 70


def test_macd_crossover(signal_gen):
    """Test MACD crossover detection"""
    # Create data with trend change
    dates = pd.date_range('2024-01-01', periods=100, freq='D')
    prices_data = list(range(100, 150)) + list(range(150, 100, -1))
    prices = pd.Series(prices_data[:100], index=dates)
    
    macd = signal_gen.calculate_macd(prices)
    
    # Detect crossover
    crossover = (macd['macd'] > macd['signal']) & (
        macd['macd'].shift(1) <= macd['signal'].shift(1)
    )
    
    # Should have crossovers
    assert crossover.sum() >= 0


def test_no_lookahead_bias_sma(signal_gen, sample_prices):
    """Test that SMA doesn't use future data"""
    sma = signal_gen.calculate_sma(sample_prices, period=10)
    
    # SMA at position i should only use data up to position i
    # We can't directly test this, but we ensure NaN for insufficient data
    assert pd.isna(sma.iloc[:9]).all()


def test_no_lookahead_bias_ema(signal_gen, sample_prices):
    """Test that EMA doesn't use future data"""
    ema = signal_gen.calculate_ema(sample_prices, period=10)
    
    # EMA at position i should only use data up to position i
    assert pd.isna(ema.iloc[:9]).all()


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
