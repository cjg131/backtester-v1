"""
Streaming-aware strategy runner that provides progress updates during long backtests.
Prevents browser timeouts by keeping the connection alive with progress messages.
"""

import asyncio
from typing import Dict, List, Optional, Callable, Any
from datetime import datetime, date

from engine.runner import StrategyRunner
from engine.models import StrategyConfig, BacktestResult
from providers.base import DataProvider


class StreamingStrategyRunner(StrategyRunner):
    """Strategy runner with streaming progress updates"""
    
    def __init__(self, data_provider: DataProvider, progress_callback: Optional[Callable] = None):
        super().__init__(data_provider)
        self.progress_callback = progress_callback
    
    async def _send_progress(self, message: str, progress: float = None):
        """Send progress update if callback is provided"""
        if self.progress_callback:
            await self.progress_callback({
                'status': 'progress',
                'message': message,
                'progress': progress
            })
            # Small delay to prevent overwhelming the client
            await asyncio.sleep(0.01)
    
    async def run_with_progress(self, config: StrategyConfig) -> BacktestResult:
        """
        Execute backtest with progress updates.
        
        Args:
            config: Strategy configuration
            
        Returns:
            BacktestResult with equity curve, metrics, trades, etc.
        """
        await self._send_progress("Starting backtest...", 0.0)
        
        # Calculate total steps for progress tracking
        total_symbols = len(config.universe.symbols)
        start_date = datetime.strptime(config.period.start, '%Y-%m-%d').date()
        end_date = datetime.strptime(config.period.end, '%Y-%m-%d').date()
        total_days = (end_date - start_date).days
        
        await self._send_progress(f"Backtest period: {total_days} days across {total_symbols} symbols", 5.0)
        
        # Override the data loading method to provide progress
        original_load_data = self._load_market_data
        self._load_market_data = self._load_market_data_with_progress
        
        try:
            # Run the normal backtest with progress tracking
            result = await super().run(config)
            await self._send_progress("Backtest completed successfully!", 100.0)
            return result
        finally:
            # Restore original method
            self._load_market_data = original_load_data
    
    async def _load_market_data_with_progress(self, config: StrategyConfig, calendar) -> Dict[str, Dict]:
        """Load market data with progress updates"""
        market_data = {}
        total_symbols = len(config.universe.symbols)
        
        await self._send_progress("Loading market data...", 10.0)
        
        for i, symbol in enumerate(config.universe.symbols):
            try:
                progress = 10.0 + (i / total_symbols) * 60.0  # 10% to 70% for data loading
                await self._send_progress(f"Loading data for {symbol}...", progress)
                
                # Load bars with progress
                bars = await self.data_provider.get_bars(
                    symbol,
                    config.period.start,
                    config.period.end
                )
                
                if bars:
                    await self._send_progress(f"Loaded {len(bars)} bars for {symbol}", progress + 5)
                
                # Load dividends and splits
                dividends = await self.data_provider.get_dividends(
                    symbol,
                    config.period.start,
                    config.period.end
                )
                
                splits = await self.data_provider.get_splits(
                    symbol,
                    config.period.start,
                    config.period.end
                )
                
                expense_ratio = None
                if config.frictions.use_actual_etf_er:
                    expense_ratio = await self.data_provider.get_expense_ratio(symbol)
                
                if not bars:
                    self.warnings.append(f"No price data for {symbol}")
                    await self._send_progress(f"Warning: No data for {symbol}", progress + 10)
                    continue
                
                market_data[symbol] = {
                    'bars': bars,
                    'dividends': dividends,
                    'splits': splits,
                    'expense_ratio': expense_ratio or 0.0
                }
                
                await self._send_progress(f"Completed {symbol} ({i+1}/{total_symbols})", progress + 10)
            
            except Exception as e:
                self.warnings.append(f"Error loading data for {symbol}: {e}")
                await self._send_progress(f"Error loading {symbol}: {e}", progress)
        
        await self._send_progress("Market data loaded, starting simulation...", 70.0)
        return market_data
