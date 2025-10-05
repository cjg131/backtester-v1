"""
Rebalancing logic with tax-aware trading for taxable accounts.
Supports calendar-based, drift-based, and hybrid rebalancing.
"""

from datetime import date, datetime
from typing import Dict, List, Tuple, Optional
import pandas as pd
from engine.portfolio import Portfolio
from engine.models import RebalancingConfig, RebalanceType, CalendarPeriod
from engine.constants import AccountType
from engine.calendar import MarketCalendar


class Rebalancer:
    """Handle portfolio rebalancing with tax awareness"""
    
    def __init__(
        self,
        config: RebalancingConfig,
        calendar: MarketCalendar,
        account_type: AccountType
    ):
        self.config = config
        self.calendar = calendar
        self.account_type = account_type
        self.last_rebalance_date: Optional[date] = None
        self.next_calendar_rebalance: Optional[date] = None
    
    def should_rebalance(
        self,
        current_date: date,
        current_weights: Dict[str, float],
        target_weights: Dict[str, float],
        is_deposit_day: bool = False
    ) -> Tuple[bool, str]:
        """
        Determine if rebalancing should occur.
        
        Args:
            current_date: Current date
            current_weights: Current portfolio weights
            target_weights: Target portfolio weights
            is_deposit_day: Whether this is a deposit day
            
        Returns:
            (should_rebalance, reason)
        """
        if self.config.type == RebalanceType.CASHFLOW_ONLY:
            # Only rebalance on deposit days
            if is_deposit_day:
                return True, "deposit"
            return False, ""
        
        # Check calendar rebalancing
        calendar_trigger = False
        if self.config.type in [RebalanceType.CALENDAR, RebalanceType.BOTH]:
            if self.config.calendar:
                calendar_trigger = self._check_calendar_trigger(current_date)
        
        # Check drift rebalancing
        drift_trigger = False
        if self.config.type in [RebalanceType.DRIFT, RebalanceType.BOTH]:
            if self.config.drift:
                drift_trigger = self._check_drift_trigger(current_weights, target_weights)
        
        # Determine if we should rebalance
        if self.config.type == RebalanceType.CALENDAR:
            if calendar_trigger:
                return True, "calendar"
        
        elif self.config.type == RebalanceType.DRIFT:
            if drift_trigger:
                return True, "drift"
        
        elif self.config.type == RebalanceType.BOTH:
            if calendar_trigger:
                return True, "calendar"
            if drift_trigger:
                return True, "drift"
        
        # Also rebalance on deposit days if configured
        if is_deposit_day and self.config.type != RebalanceType.CASHFLOW_ONLY:
            return True, "deposit"
        
        return False, ""
    
    def _check_calendar_trigger(self, current_date: date) -> bool:
        """Check if calendar-based rebalancing should trigger"""
        if not self.config.calendar:
            return False
        
        period = self.config.calendar.period
        
        # Initialize next rebalance date if needed
        if self.next_calendar_rebalance is None:
            self.next_calendar_rebalance = self._get_next_calendar_date(
                current_date, period
            )
            return False
        
        # Check if we've reached the next rebalance date
        if current_date >= self.next_calendar_rebalance:
            # Update next rebalance date
            self.next_calendar_rebalance = self._get_next_calendar_date(
                current_date, period
            )
            return True
        
        return False
    
    def _get_next_calendar_date(
        self,
        current_date: date,
        period: CalendarPeriod
    ) -> date:
        """Get the next calendar rebalance date"""
        if period == CalendarPeriod.DAILY:
            return self.calendar.next_trading_day(current_date)
        
        elif period == CalendarPeriod.WEEKLY:
            # Next Monday (or next trading day after)
            next_date = current_date + pd.Timedelta(days=7)
            return self.calendar.align_to_business_day(next_date)
        
        elif period == CalendarPeriod.MONTHLY:
            # First trading day of next month
            if current_date.month == 12:
                next_month = date(current_date.year + 1, 1, 1)
            else:
                next_month = date(current_date.year, current_date.month + 1, 1)
            
            return self.calendar.get_first_trading_day_of_month(
                next_month.year, next_month.month
            )
        
        elif period == CalendarPeriod.QUARTERLY:
            # First trading day of next quarter
            current_quarter = (current_date.month - 1) // 3 + 1
            next_quarter = current_quarter + 1
            
            if next_quarter > 4:
                next_quarter = 1
                year = current_date.year + 1
            else:
                year = current_date.year
            
            return self.calendar.get_first_trading_day_of_quarter(year, next_quarter)
        
        elif period == CalendarPeriod.YEARLY:
            # First trading day of next year
            return self.calendar.get_first_trading_day_of_year(current_date.year + 1)
        
        else:
            return self.calendar.next_trading_day(current_date)
    
    def _check_drift_trigger(
        self,
        current_weights: Dict[str, float],
        target_weights: Dict[str, float]
    ) -> bool:
        """Check if drift-based rebalancing should trigger"""
        if not self.config.drift:
            return False
        
        # Check absolute drift
        if self.config.drift.abs_pct is not None:
            for symbol in target_weights:
                current = current_weights.get(symbol, 0.0)
                target = target_weights[symbol]
                
                abs_drift = abs(current - target)
                if abs_drift > self.config.drift.abs_pct:
                    return True
        
        # Check relative drift
        if self.config.drift.rel_pct is not None:
            for symbol in target_weights:
                current = current_weights.get(symbol, 0.0)
                target = target_weights[symbol]
                
                if target > 0:
                    rel_drift = abs(current - target) / target
                    if rel_drift > self.config.drift.rel_pct:
                        return True
        
        return False
    
    def generate_deposit_trades(
        self,
        target_weights: Dict[str, float],
        deposit_amount: float,
        current_prices: Dict[str, float]
    ) -> List[Tuple[str, str, float]]:
        """
        Generate trades to invest a deposit according to target weights.
        This ONLY buys with the deposit amount, doesn't rebalance existing positions.
        
        Args:
            target_weights: Target weights (symbol -> weight)
            deposit_amount: Amount of cash deposited
            current_prices: Current prices
            
        Returns:
            List of (symbol, action, quantity) tuples
        """
        trades = []
        
        if deposit_amount <= 0:
            return trades
        
        # Split deposit by target weights
        for symbol, weight in target_weights.items():
            if weight > 0:
                allocation = deposit_amount * weight
                qty = allocation / current_prices[symbol]
                trades.append((symbol, "BUY", qty))
        
        return trades
    
    def generate_rebalance_trades(
        self,
        portfolio: Portfolio,
        target_weights: Dict[str, float],
        current_prices: Dict[str, float],
        current_date: date
    ) -> List[Tuple[str, str, float]]:
        """
        Generate trades to rebalance portfolio to target weights.
        
        For taxable accounts, uses tax-aware ordering:
        1. Sell positions with losses first (tax-loss harvesting)
        2. Buy underweight positions
        3. Sell overweight positions with gains (if needed)
        
        Args:
            portfolio: Current portfolio
            target_weights: Target weights (symbol -> weight)
            current_prices: Current prices
            current_date: Rebalance date
            
        Returns:
            List of (symbol, action, quantity) tuples
        """
        # Calculate current portfolio value
        total_value = portfolio.get_total_value(current_prices)
        
        if total_value <= 0:
            return []
        
        # Calculate current weights
        positions = portfolio.get_all_positions(current_prices)
        current_weights = {}
        for pos in positions:
            current_weights[pos.symbol] = pos.market_value / total_value
        
        # Calculate target values
        target_values = {
            symbol: weight * total_value
            for symbol, weight in target_weights.items()
        }
        
        # Calculate current values
        current_values = {
            symbol: current_weights.get(symbol, 0.0) * total_value
            for symbol in target_weights
        }
        
        # Calculate trades needed
        trades = []
        
        # For taxable accounts, use tax-aware ordering
        if self.account_type == AccountType.TAXABLE:
            trades = self._generate_tax_aware_trades(
                portfolio,
                current_values,
                target_values,
                current_prices,
                current_date
            )
        else:
            # For tax-deferred accounts, just rebalance directly
            trades = self._generate_simple_trades(
                current_values,
                target_values,
                current_prices
            )
        
        return trades
    
    def _generate_tax_aware_trades(
        self,
        portfolio: Portfolio,
        current_values: Dict[str, float],
        target_values: Dict[str, float],
        current_prices: Dict[str, float],
        current_date: date
    ) -> List[Tuple[str, str, float]]:
        """Generate trades with tax-loss harvesting priority"""
        trades = []
        
        # Step 1: Identify positions with losses and gains
        positions = portfolio.get_all_positions(current_prices)
        
        loss_positions = []
        gain_positions = []
        
        for pos in positions:
            if pos.symbol in target_values:
                current_val = current_values.get(pos.symbol, 0.0)
                target_val = target_values[pos.symbol]
                
                if current_val > target_val:  # Overweight
                    if pos.unrealized_gain < 0:
                        loss_positions.append((pos.symbol, pos.unrealized_gain))
                    else:
                        gain_positions.append((pos.symbol, pos.unrealized_gain))
        
        # Sort losses by magnitude (largest losses first for tax benefit)
        loss_positions.sort(key=lambda x: x[1])
        
        # Step 2: Sell loss positions first
        for symbol, _ in loss_positions:
            current_val = current_values.get(symbol, 0.0)
            target_val = target_values[symbol]
            
            if current_val > target_val:
                sell_value = current_val - target_val
                sell_qty = sell_value / current_prices[symbol]
                trades.append((symbol, "SELL", sell_qty))
        
        # Step 3: Buy underweight positions
        for symbol, target_val in target_values.items():
            current_val = current_values.get(symbol, 0.0)
            
            if current_val < target_val:
                buy_value = target_val - current_val
                buy_qty = buy_value / current_prices[symbol]
                trades.append((symbol, "BUY", buy_qty))
        
        # Step 4: Sell gain positions if still needed
        for symbol, _ in gain_positions:
            current_val = current_values.get(symbol, 0.0)
            target_val = target_values[symbol]
            
            if current_val > target_val:
                sell_value = current_val - target_val
                sell_qty = sell_value / current_prices[symbol]
                trades.append((symbol, "SELL", sell_qty))
        
        return trades
    
    def _generate_simple_trades(
        self,
        current_values: Dict[str, float],
        target_values: Dict[str, float],
        current_prices: Dict[str, float]
    ) -> List[Tuple[str, str, float]]:
        """Generate simple rebalancing trades (for tax-deferred accounts)"""
        trades = []
        
        for symbol, target_val in target_values.items():
            current_val = current_values.get(symbol, 0.0)
            diff = target_val - current_val
            
            if abs(diff) < 1.0:  # Skip tiny trades
                continue
            
            if diff > 0:
                # Buy - account for slippage (5 bps = 0.0005)
                # Reduce target slightly to ensure we have enough cash
                adjusted_diff = diff * 0.999  # Leave 0.1% buffer for slippage
                qty = adjusted_diff / current_prices[symbol]
                trades.append((symbol, "BUY", qty))
            else:
                # Sell
                qty = abs(diff) / current_prices[symbol]
                trades.append((symbol, "SELL", qty))
        
        return trades
