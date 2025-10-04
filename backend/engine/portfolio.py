"""
Portfolio management with per-lot accounting, tax tracking, and DRIP support.
"""

import uuid
from datetime import datetime, date
from typing import List, Dict, Optional, Tuple
from collections import defaultdict
from engine.models import Lot, Trade, Position
from engine.constants import LotMethod, AccountType, WASH_SALE_DAYS, SHORT_TERM_DAYS


class Portfolio:
    """
    Portfolio with per-lot accounting for tax-aware trading.
    Tracks cash, positions, lots, and realized gains/losses.
    """
    
    def __init__(
        self,
        initial_cash: float,
        account_type: AccountType,
        lot_method: LotMethod = LotMethod.HIFO,
        apply_wash_sale: bool = True
    ):
        self.cash = initial_cash
        self.account_type = account_type
        self.lot_method = lot_method
        self.apply_wash_sale = apply_wash_sale
        
        # Positions: symbol -> list of lots
        self.lots: Dict[str, List[Lot]] = defaultdict(list)
        
        # Trade history
        self.trades: List[Trade] = []
        
        # Realized gains tracking
        self.realized_st_gains = 0.0  # Short-term gains
        self.realized_lt_gains = 0.0  # Long-term gains
        
        # Wash sale tracking (symbol -> list of (date, loss_amount))
        self.wash_sale_losses: Dict[str, List[Tuple[date, float]]] = defaultdict(list)
        
        # Annual tracking
        self.annual_contributions = defaultdict(float)  # year -> amount
        self.annual_realized_st = defaultdict(float)
        self.annual_realized_lt = defaultdict(float)
        self.annual_dividends_qualified = defaultdict(float)
        self.annual_dividends_ordinary = defaultdict(float)
        self.annual_interest = defaultdict(float)
    
    def get_position(self, symbol: str) -> Optional[Position]:
        """Get current position for a symbol"""
        if symbol not in self.lots or not self.lots[symbol]:
            return None
        
        total_qty = sum(lot.quantity for lot in self.lots[symbol])
        total_cost = sum(lot.cost_basis for lot in self.lots[symbol])
        
        return Position(
            symbol=symbol,
            quantity=total_qty,
            market_value=0.0,  # Will be updated with current price
            cost_basis=total_cost,
            unrealized_gain=0.0,  # Will be calculated
            lots=self.lots[symbol].copy()
        )
    
    def get_total_quantity(self, symbol: str) -> float:
        """Get total quantity held for a symbol"""
        if symbol not in self.lots:
            return 0.0
        return sum(lot.quantity for lot in self.lots[symbol])
    
    def buy(
        self,
        symbol: str,
        quantity: float,
        price: float,
        trade_date: date,
        commission: float = 0.0,
        slippage: float = 0.0,
        action: str = "BUY"
    ) -> Trade:
        """
        Execute a buy order and create a new lot.
        
        Args:
            symbol: Ticker symbol
            quantity: Number of shares
            price: Execution price
            trade_date: Trade date
            commission: Commission paid
            slippage: Slippage cost
            action: BUY or DRIP
            
        Returns:
            Trade object
        """
        # Calculate total cost
        gross_cost = quantity * price
        total_cost = gross_cost + commission + slippage
        
        # Check if we have enough cash
        if self.cash < total_cost:
            raise ValueError(f"Insufficient cash: need ${total_cost:.2f}, have ${self.cash:.2f}")
        
        # Deduct from cash
        self.cash -= total_cost
        
        # Create new lot
        lot_id = str(uuid.uuid4())
        lot = Lot(
            lot_id=lot_id,
            symbol=symbol,
            quantity=quantity,
            cost_basis=total_cost,
            acquisition_date=trade_date.strftime('%Y-%m-%d'),
            is_wash_sale=False,
            wash_sale_disallowed=0.0
        )
        
        self.lots[symbol].append(lot)
        
        # Record trade
        trade = Trade(
            trade_id=str(uuid.uuid4()),
            date=trade_date.strftime('%Y-%m-%d'),
            symbol=symbol,
            action=action,
            quantity=quantity,
            price=price,
            commission=commission,
            slippage=slippage,
            total_cost=total_cost,
            lot_ids=[lot_id]
        )
        
        self.trades.append(trade)
        
        return trade
    
    def sell(
        self,
        symbol: str,
        quantity: float,
        price: float,
        trade_date: date,
        commission: float = 0.0,
        slippage: float = 0.0
    ) -> Trade:
        """
        Execute a sell order using lot selection method.
        
        Args:
            symbol: Ticker symbol
            quantity: Number of shares to sell
            price: Execution price
            trade_date: Trade date
            commission: Commission paid
            slippage: Slippage cost
            
        Returns:
            Trade object
        """
        # Check if we have enough shares
        total_qty = self.get_total_quantity(symbol)
        if total_qty < quantity:
            raise ValueError(f"Insufficient shares: need {quantity}, have {total_qty}")
        
        # Select lots to sell
        lots_to_sell = self._select_lots_for_sale(symbol, quantity, trade_date)
        
        # Calculate proceeds
        gross_proceeds = quantity * price
        net_proceeds = gross_proceeds - commission - slippage
        
        # Add to cash
        self.cash += net_proceeds
        
        # Process each lot
        lot_ids = []
        total_cost_basis = 0.0
        
        for lot, qty_from_lot in lots_to_sell:
            lot_ids.append(lot.lot_id)
            
            # Calculate cost basis for this portion
            cost_per_share = lot.cost_basis / lot.quantity
            cost_basis = cost_per_share * qty_from_lot
            total_cost_basis += cost_basis
            
            # Calculate gain/loss
            proceeds_from_lot = (qty_from_lot / quantity) * net_proceeds
            gain_loss = proceeds_from_lot - cost_basis
            
            # Determine if short-term or long-term
            acq_date = datetime.strptime(lot.acquisition_date, '%Y-%m-%d').date()
            holding_days = (trade_date - acq_date).days
            is_short_term = holding_days <= SHORT_TERM_DAYS
            
            # Check for wash sale if loss in taxable account
            if (self.account_type == AccountType.TAXABLE and 
                self.apply_wash_sale and 
                gain_loss < 0):
                
                # Check if we bought within wash sale window
                if self._has_wash_sale_purchase(symbol, trade_date):
                    # Disallow the loss
                    lot.is_wash_sale = True
                    lot.wash_sale_disallowed = abs(gain_loss)
                    self.wash_sale_losses[symbol].append((trade_date, abs(gain_loss)))
                    gain_loss = 0.0  # Loss is disallowed
            
            # Record realized gain/loss (only for taxable accounts)
            if self.account_type == AccountType.TAXABLE:
                year = trade_date.year
                if is_short_term:
                    self.realized_st_gains += gain_loss
                    self.annual_realized_st[year] += gain_loss
                else:
                    self.realized_lt_gains += gain_loss
                    self.annual_realized_lt[year] += gain_loss
            
            # Reduce or remove lot
            lot.quantity -= qty_from_lot
            lot.cost_basis -= cost_basis
            
            if lot.quantity <= 0.0001:  # Floating point tolerance
                self.lots[symbol].remove(lot)
        
        # Record trade
        trade = Trade(
            trade_id=str(uuid.uuid4()),
            date=trade_date.strftime('%Y-%m-%d'),
            symbol=symbol,
            action="SELL",
            quantity=quantity,
            price=price,
            commission=commission,
            slippage=slippage,
            total_cost=-net_proceeds,  # Negative for sells
            lot_ids=lot_ids
        )
        
        self.trades.append(trade)
        
        return trade
    
    def _select_lots_for_sale(
        self,
        symbol: str,
        quantity: float,
        trade_date: date
    ) -> List[Tuple[Lot, float]]:
        """
        Select lots to sell based on lot method.
        
        Returns:
            List of (lot, quantity_to_sell) tuples
        """
        available_lots = self.lots[symbol].copy()
        
        if self.lot_method == LotMethod.FIFO:
            # First in, first out
            available_lots.sort(key=lambda x: x.acquisition_date)
        
        elif self.lot_method == LotMethod.LIFO:
            # Last in, first out
            available_lots.sort(key=lambda x: x.acquisition_date, reverse=True)
        
        elif self.lot_method == LotMethod.HIFO:
            # Highest cost first (tax-optimized for gains)
            # For taxable accounts, prefer lots with losses, then highest cost
            if self.account_type == AccountType.TAXABLE:
                # Sort by cost per share descending
                available_lots.sort(
                    key=lambda x: x.cost_basis / x.quantity,
                    reverse=True
                )
            else:
                # For tax-deferred, just use FIFO
                available_lots.sort(key=lambda x: x.acquisition_date)
        
        # Select lots until we have enough quantity
        selected = []
        remaining = quantity
        
        for lot in available_lots:
            if remaining <= 0:
                break
            
            qty_from_lot = min(lot.quantity, remaining)
            selected.append((lot, qty_from_lot))
            remaining -= qty_from_lot
        
        return selected
    
    def _has_wash_sale_purchase(self, symbol: str, sale_date: date) -> bool:
        """
        Check if there was a purchase within the wash sale window.
        Window is 30 days before or after the sale.
        """
        window_start = sale_date - pd.Timedelta(days=WASH_SALE_DAYS)
        window_end = sale_date + pd.Timedelta(days=WASH_SALE_DAYS)
        
        # Check all lots for purchases in the window
        for lot in self.lots[symbol]:
            acq_date = datetime.strptime(lot.acquisition_date, '%Y-%m-%d').date()
            if window_start <= acq_date <= window_end and acq_date != sale_date:
                return True
        
        return False
    
    def record_dividend(
        self,
        symbol: str,
        amount: float,
        ex_date: date,
        qualified_pct: float = 1.0
    ):
        """
        Record dividend payment (added to cash).
        
        Args:
            symbol: Ticker symbol
            amount: Total dividend amount
            ex_date: Ex-dividend date
            qualified_pct: Percentage that is qualified (0.0 to 1.0)
        """
        self.cash += amount
        
        # Track for tax purposes (taxable accounts only)
        if self.account_type == AccountType.TAXABLE:
            year = ex_date.year
            qualified_amount = amount * qualified_pct
            ordinary_amount = amount * (1 - qualified_pct)
            
            self.annual_dividends_qualified[year] += qualified_amount
            self.annual_dividends_ordinary[year] += ordinary_amount
    
    def add_deposit(self, amount: float, deposit_date: date):
        """Add a deposit/contribution to the portfolio"""
        self.cash += amount
        year = deposit_date.year
        self.annual_contributions[year] += amount
    
    def deduct_tax(self, amount: float):
        """Deduct tax payment from cash"""
        self.cash -= amount
    
    def get_total_value(self, prices: Dict[str, float]) -> float:
        """
        Calculate total portfolio value.
        
        Args:
            prices: Dict of symbol -> current price
            
        Returns:
            Total portfolio value (cash + positions)
        """
        positions_value = 0.0
        
        for symbol, lots in self.lots.items():
            if symbol in prices:
                total_qty = sum(lot.quantity for lot in lots)
                positions_value += total_qty * prices[symbol]
        
        return self.cash + positions_value
    
    def get_all_positions(self, prices: Dict[str, float]) -> List[Position]:
        """Get all current positions with market values"""
        positions = []
        
        for symbol in self.lots.keys():
            if not self.lots[symbol]:
                continue
            
            total_qty = sum(lot.quantity for lot in self.lots[symbol])
            total_cost = sum(lot.cost_basis for lot in self.lots[symbol])
            
            price = prices.get(symbol, 0.0)
            market_value = total_qty * price
            unrealized_gain = market_value - total_cost
            
            pos = Position(
                symbol=symbol,
                quantity=total_qty,
                market_value=market_value,
                cost_basis=total_cost,
                unrealized_gain=unrealized_gain,
                lots=self.lots[symbol].copy()
            )
            positions.append(pos)
        
        return positions


# Import pandas for timedelta
import pandas as pd
