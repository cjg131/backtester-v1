"""
Technical indicators and signal generation.
All indicators use only prior data (no look-ahead bias).
"""

import pandas as pd
import numpy as np
from typing import Dict, List, Optional
from engine.models import Bar, Signal


class SignalGenerator:
    """Generate trading signals from price data"""
    
    def __init__(self):
        self.indicators = {}
    
    def calculate_sma(self, prices: pd.Series, period: int) -> pd.Series:
        """Simple Moving Average"""
        return prices.rolling(window=period, min_periods=period).mean()
    
    def calculate_ema(self, prices: pd.Series, period: int) -> pd.Series:
        """Exponential Moving Average"""
        return prices.ewm(span=period, adjust=False, min_periods=period).mean()
    
    def calculate_rsi(self, prices: pd.Series, period: int = 14) -> pd.Series:
        """Relative Strength Index"""
        delta = prices.diff()
        gain = (delta.where(delta > 0, 0)).rolling(window=period).mean()
        loss = (-delta.where(delta < 0, 0)).rolling(window=period).mean()
        
        rs = gain / loss
        rsi = 100 - (100 / (1 + rs))
        return rsi
    
    def calculate_macd(
        self,
        prices: pd.Series,
        fast: int = 12,
        slow: int = 26,
        signal: int = 9
    ) -> Dict[str, pd.Series]:
        """
        MACD indicator.
        
        Returns:
            Dict with 'macd', 'signal', 'histogram'
        """
        ema_fast = self.calculate_ema(prices, fast)
        ema_slow = self.calculate_ema(prices, slow)
        
        macd_line = ema_fast - ema_slow
        signal_line = self.calculate_ema(macd_line, signal)
        histogram = macd_line - signal_line
        
        return {
            'macd': macd_line,
            'signal': signal_line,
            'histogram': histogram
        }
    
    def calculate_momentum(
        self,
        prices: pd.Series,
        lookback: int = 12,
        skip: int = 1
    ) -> pd.Series:
        """
        Momentum indicator (12-1 month momentum).
        
        Args:
            prices: Price series
            lookback: Lookback period (e.g., 252 for 12 months)
            skip: Skip period (e.g., 21 for 1 month)
            
        Returns:
            Momentum values (return from lookback to skip periods ago)
        """
        return prices.pct_change(periods=lookback - skip)
    
    def calculate_52week_high(self, prices: pd.Series) -> pd.Series:
        """52-week (252-day) rolling high"""
        return prices.rolling(window=252, min_periods=252).max()
    
    def calculate_52week_breakout(self, prices: pd.Series) -> pd.Series:
        """
        Signal when price breaks above 52-week high.
        
        Returns:
            Boolean series (True when at new 52-week high)
        """
        high_52w = self.calculate_52week_high(prices)
        return prices >= high_52w
    
    def calculate_bollinger_bands(
        self,
        prices: pd.Series,
        period: int = 20,
        std_dev: float = 2.0
    ) -> Dict[str, pd.Series]:
        """
        Bollinger Bands.
        
        Returns:
            Dict with 'upper', 'middle', 'lower'
        """
        middle = self.calculate_sma(prices, period)
        std = prices.rolling(window=period).std()
        
        upper = middle + (std * std_dev)
        lower = middle - (std * std_dev)
        
        return {
            'upper': upper,
            'middle': middle,
            'lower': lower
        }
    
    def evaluate_signal(
        self,
        signal_def: Signal,
        data: pd.DataFrame
    ) -> pd.Series:
        """
        Evaluate a signal definition against price data.
        
        Args:
            signal_def: Signal configuration
            data: DataFrame with OHLCV data
            
        Returns:
            Boolean series indicating signal state
        """
        signal_type = signal_def.type
        params = signal_def.params
        
        # Get price column to use
        price_col = params.get('on', 'close')
        prices = data[price_col]
        
        if signal_type == "SMA":
            period = params.get('period', 50)
            indicator = self.calculate_sma(prices, period)
            self.indicators[signal_def.id] = indicator
            return indicator > 0  # Dummy boolean
        
        elif signal_type == "SMA_CROSS":
            fast = params.get('fast', 50)
            slow = params.get('slow', 200)
            
            sma_fast = self.calculate_sma(prices, fast)
            sma_slow = self.calculate_sma(prices, slow)
            
            self.indicators[f"{signal_def.id}_fast"] = sma_fast
            self.indicators[f"{signal_def.id}_slow"] = sma_slow
            
            # Return boolean: fast > slow
            return sma_fast > sma_slow
        
        elif signal_type == "EMA_CROSS":
            fast = params.get('fast', 12)
            slow = params.get('slow', 26)
            
            ema_fast = self.calculate_ema(prices, fast)
            ema_slow = self.calculate_ema(prices, slow)
            
            self.indicators[f"{signal_def.id}_fast"] = ema_fast
            self.indicators[f"{signal_def.id}_slow"] = ema_slow
            
            return ema_fast > ema_slow
        
        elif signal_type == "RSI":
            period = params.get('period', 14)
            threshold = params.get('threshold', 30)
            direction = params.get('direction', 'above')
            
            rsi = self.calculate_rsi(prices, period)
            self.indicators[signal_def.id] = rsi
            
            if direction == 'above':
                return rsi > threshold
            else:
                return rsi < threshold
        
        elif signal_type == "MACD":
            fast = params.get('fast', 12)
            slow = params.get('slow', 26)
            signal_period = params.get('signal', 9)
            
            macd_data = self.calculate_macd(prices, fast, slow, signal_period)
            
            self.indicators[f"{signal_def.id}_macd"] = macd_data['macd']
            self.indicators[f"{signal_def.id}_signal"] = macd_data['signal']
            
            # Return boolean: MACD > signal
            return macd_data['macd'] > macd_data['signal']
        
        elif signal_type == "MOMENTUM":
            lookback = params.get('lookback', 252)
            skip = params.get('skip', 21)
            
            momentum = self.calculate_momentum(prices, lookback, skip)
            self.indicators[signal_def.id] = momentum
            
            return momentum > 0
        
        elif signal_type == "52W_BREAKOUT":
            breakout = self.calculate_52week_breakout(prices)
            self.indicators[signal_def.id] = breakout
            
            return breakout
        
        else:
            # Unknown signal type, return False
            return pd.Series(False, index=data.index)
    
    def detect_cross_up(self, signal: pd.Series) -> pd.Series:
        """Detect when signal crosses from False to True"""
        return signal & ~signal.shift(1).fillna(False)
    
    def detect_cross_down(self, signal: pd.Series) -> pd.Series:
        """Detect when signal crosses from True to False"""
        return ~signal & signal.shift(1).fillna(False)
    
    def evaluate_rule(
        self,
        signal_id: str,
        operation: str,
        signal_value: pd.Series
    ) -> pd.Series:
        """
        Evaluate a rule based on signal and operation.
        
        Args:
            signal_id: Signal identifier
            operation: Operation (CROSS_UP, CROSS_DOWN, ABOVE, BELOW)
            signal_value: Current signal values
            
        Returns:
            Boolean series indicating when rule is triggered
        """
        if operation == "CROSS_UP":
            return self.detect_cross_up(signal_value)
        
        elif operation == "CROSS_DOWN":
            return self.detect_cross_down(signal_value)
        
        elif operation == "ABOVE":
            return signal_value
        
        elif operation == "BELOW":
            return ~signal_value
        
        else:
            return pd.Series(False, index=signal_value.index)


def prepare_price_data(bars: List[Bar]) -> pd.DataFrame:
    """
    Convert list of Bar objects to DataFrame for signal calculation.
    
    Args:
        bars: List of Bar objects
        
    Returns:
        DataFrame with OHLCV columns indexed by date
    """
    if not bars:
        return pd.DataFrame()
    
    data = {
        'date': [bar.date for bar in bars],
        'open': [bar.open for bar in bars],
        'high': [bar.high for bar in bars],
        'low': [bar.low for bar in bars],
        'close': [bar.close for bar in bars],
        'adj_close': [bar.adj_close for bar in bars],
        'volume': [bar.volume for bar in bars]
    }
    
    df = pd.DataFrame(data)
    df['date'] = pd.to_datetime(df['date'])
    df.set_index('date', inplace=True)
    
    return df
