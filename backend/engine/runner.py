"""
Main strategy runner - orchestrates the backtest execution.
Handles daily simulation loop, deposits, dividends, rebalancing, and tax accrual.
"""

import pandas as pd
import numpy as np
from datetime import datetime, date
from typing import Dict, List, Optional, Tuple
from collections import defaultdict

from engine.models import (
    StrategyConfig, BacktestResult, Bar, Dividend,
    PerformanceMetrics, TaxSummary
)
from engine.portfolio import Portfolio
from engine.calendar import MarketCalendar
from engine.rebalancer import Rebalancer
from engine.tax import TaxCalculator
from engine.signals import SignalGenerator, prepare_price_data
from engine.metrics import MetricsCalculator
from engine.constants import (
    AccountType, DividendMode, DepositCadence,
    IRA_CONTRIBUTION_LIMIT, ROTH_CONTRIBUTION_LIMIT,
    TRADING_DAYS_PER_YEAR
)
from providers.base import DataProvider


class StrategyRunner:
    """Execute a backtest strategy"""
    
    def __init__(self, data_provider: DataProvider):
        self.data_provider = data_provider
        self.warnings: List[str] = []
    
    async def run(self, config: StrategyConfig) -> BacktestResult:
        """
        Execute the backtest.
        
        Args:
            config: Strategy configuration
            
        Returns:
            BacktestResult with equity curve, metrics, trades, etc.
        """
        self.warnings = []
        
        # Initialize components
        calendar = MarketCalendar(config.period.calendar)
        
        portfolio = Portfolio(
            initial_cash=config.initial_cash,
            account_type=config.account.type,
            lot_method=config.lots.method,
            apply_wash_sale=config.account.tax.apply_wash_sale
        )
        
        rebalancer = Rebalancer(
            config=config.rebalancing,
            calendar=calendar,
            account_type=config.account.type
        )
        
        tax_calculator = None
        if config.account.type == AccountType.TAXABLE:
            tax_calculator = TaxCalculator(config.account.tax)
        
        signal_generator = SignalGenerator()
        
        # Load market data
        print(f"Loading data for {len(config.universe.symbols)} symbols...")
        market_data = await self._load_market_data(config, calendar)
        
        if not market_data:
            raise ValueError("No market data loaded")
        
        # Get trading days
        trading_days = calendar.get_trading_days(
            config.period.start,
            config.period.end
        )
        
        print(f"Backtesting {len(trading_days)} trading days...")
        
        # Initialize tracking
        equity_curve = []
        positions_history = []
        daily_prices = {}
        
        # Calculate target weights
        target_weights = self._calculate_target_weights(
            config.universe.symbols,
            config.position_sizing
        )
        
        # Daily simulation loop
        for i, current_date in enumerate(trading_days):
            # Get current prices
            current_prices = self._get_prices_for_date(
                market_data,
                current_date
            )
            
            if not current_prices:
                continue
            
            daily_prices[current_date] = current_prices
            
            is_deposit_day = False
            if config.deposits:
                is_deposit_day = self._is_deposit_day(
                    current_date,
                    config.deposits,
                    calendar
                )
            
            # Process dividends first
            self._process_dividends(
                portfolio,
                market_data,
                current_date,
                current_prices,
                config
            )
            
            # Process deposits after dividends
            deposit_made = False
            deposit_amount = 0
            if config.deposits and is_deposit_day:
                if config.deposits.amount > 0:
                    deposit_amount = config.deposits.amount
                    
                    # Check contribution caps for IRA/Roth
                    if self._check_contribution_cap(
                        portfolio,
                        config.account,
                        current_date,
                        deposit_amount
                    ):
                        portfolio.add_deposit(deposit_amount, current_date)
                        deposit_made = True
                    else:
                        self.warnings.append(
                            f"Contribution cap reached on {current_date}, skipping deposit"
                        )
            
            # Apply ETF expense ratios (daily drag)
            self._apply_expense_ratios(
                portfolio,
                market_data,
                current_date
            )
            
            # Handle deposits and rebalancing separately
            if deposit_made:
                # On deposit days, just invest the deposit according to target weights
                # Don't rebalance the entire portfolio
                trades = rebalancer.generate_deposit_trades(
                    target_weights,
                    deposit_amount,
                    current_prices
                )
                
                self._execute_trades(
                    portfolio,
                    trades,
                    current_prices,
                    current_date,
                    config.frictions
                )
            else:
                # Check for rebalancing (not on deposit days)
                current_weights = self._calculate_current_weights(
                    portfolio,
                    current_prices
                )
                
                should_rebalance, reason = rebalancer.should_rebalance(
                    current_date,
                    current_weights,
                    target_weights,
                    False  # Never trigger deposit-based rebalancing since we handle it above
                )
                
                if should_rebalance or i == 0:  # Always trade on first day
                    # Generate and execute rebalance trades
                    trades = rebalancer.generate_rebalance_trades(
                        portfolio,
                        target_weights,
                        current_prices,
                        current_date
                    )
                    
                    self._execute_trades(
                        portfolio,
                        trades,
                        current_prices,
                        current_date,
                        config.frictions
                    )
            
            # Record daily snapshot
            portfolio_value = portfolio.get_total_value(current_prices)
            positions = portfolio.get_all_positions(current_prices)
            
            equity_curve.append({
                'date': current_date,
                'portfolio_value': portfolio_value,
                'cash': portfolio.cash,
                'positions_value': portfolio_value - portfolio.cash
            })
            
            positions_history.append({
                'date': current_date,
                'positions': positions
            })
            
            # Year-end tax accrual
            if tax_calculator and self._is_year_end(current_date, trading_days, i):
                year = current_date.year
                tax_amount = tax_calculator.apply_year_end_tax(
                    year,
                    portfolio,
                    config.account.tax.pay_taxes_from_external
                )
                
                if tax_amount > 0:
                    print(f"Year {year} tax: ${tax_amount:,.2f}")
        
        # Calculate metrics
        print("Calculating performance metrics...")
        metrics = self._calculate_metrics(
            equity_curve,
            portfolio,
            config
        )
        
        # Calculate benchmark metrics
        benchmark_metrics, benchmark_equity = await self._calculate_benchmark_metrics(
            config,
            calendar,
            trading_days
        )
        
        # Generate tax summaries
        tax_summaries = []
        if tax_calculator:
            years = list(set(d['date'].year for d in equity_curve))
            for year in sorted(years):
                summary = tax_calculator.calculate_annual_tax(year, portfolio)
                tax_summaries.append(summary)
        
        # Collect all lots
        all_lots = []
        for symbol_lots in portfolio.lots.values():
            all_lots.extend(symbol_lots)
        
        print(f"Backtest complete. Final value: ${equity_curve[-1]['portfolio_value']:,.2f}")
        
        return BacktestResult(
            config=config,
            equity_curve=equity_curve,
            metrics=metrics,
            benchmark_metrics=benchmark_metrics,
            benchmark_equity=benchmark_equity,
            trades=portfolio.trades,
            positions_history=positions_history,
            tax_summaries=tax_summaries,
            lots=all_lots,
            warnings=self.warnings,
            diagnostics={
                'total_trades': len(portfolio.trades),
                'total_symbols': len(config.universe.symbols),
                'trading_days': len(trading_days)
            }
        )
    
    async def _load_market_data(
        self,
        config: StrategyConfig,
        calendar: MarketCalendar
    ) -> Dict[str, Dict]:
        """Load all market data for symbols"""
        market_data = {}
        
        for symbol in config.universe.symbols:
            try:
                bars = await self.data_provider.get_bars(
                    symbol,
                    config.period.start,
                    config.period.end
                )
                
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
                    continue
                
                market_data[symbol] = {
                    'bars': bars,
                    'dividends': dividends,
                    'splits': splits,
                    'expense_ratio': expense_ratio or 0.0
                }
            
            except Exception as e:
                self.warnings.append(f"Error loading data for {symbol}: {e}")
        
        return market_data
    
    def _get_prices_for_date(
        self,
        market_data: Dict,
        target_date: date
    ) -> Dict[str, float]:
        """Get prices for all symbols on a specific date"""
        prices = {}
        
        for symbol, data in market_data.items():
            for bar in data['bars']:
                bar_date = datetime.strptime(bar.date, '%Y-%m-%d').date()
                if bar_date == target_date:
                    prices[symbol] = bar.adj_close
                    break
        
        return prices
    
    def _calculate_target_weights(
        self,
        symbols: List[str],
        position_sizing
    ) -> Dict[str, float]:
        """Calculate target portfolio weights"""
        if position_sizing.method == "EQUAL_WEIGHT":
            weight = 1.0 / len(symbols)
            return {symbol: weight for symbol in symbols}
        
        elif position_sizing.method == "CUSTOM_WEIGHTS":
            if not position_sizing.custom_weights:
                # Fallback to equal weights if no custom weights provided
                weight = 1.0 / len(symbols)
                return {symbol: weight for symbol in symbols}
            
            # Use custom weights, normalize to ensure they sum to 1.0
            weights = {}
            total_weight = 0.0
            
            for symbol in symbols:
                weight = position_sizing.custom_weights.get(symbol, 0.0)
                weights[symbol] = weight
                total_weight += weight
            
            # Normalize weights to sum to 1.0
            if total_weight > 0:
                weights = {symbol: weight / total_weight for symbol, weight in weights.items()}
            else:
                # If no weights specified, fallback to equal weights
                weight = 1.0 / len(symbols)
                weights = {symbol: weight for symbol in symbols}
            
            return weights
        
        # Add other methods as needed
        return {symbol: 1.0 / len(symbols) for symbol in symbols}
    
    def _calculate_current_weights(
        self,
        portfolio: Portfolio,
        current_prices: Dict[str, float]
    ) -> Dict[str, float]:
        """Calculate current portfolio weights"""
        total_value = portfolio.get_total_value(current_prices)
        
        if total_value <= 0:
            return {}
        
        positions = portfolio.get_all_positions(current_prices)
        weights = {}
        
        for pos in positions:
            weights[pos.symbol] = pos.market_value / total_value
        
        return weights
    
    def _is_deposit_day(
        self,
        current_date: date,
        deposit_config,
        calendar: MarketCalendar
    ) -> bool:
        """Check if current date is a deposit day"""
        if deposit_config.cadence == DepositCadence.EVERY_MARKET_DAY:
            return True
        
        elif deposit_config.cadence == DepositCadence.DAILY:
            # Every trading day
            return True
        
        elif deposit_config.cadence == DepositCadence.WEEKLY:
            # Every Monday (or first trading day of week)
            return current_date.weekday() == 0  # 0 = Monday
        
        elif deposit_config.cadence == DepositCadence.MONTHLY:
            # First business day of month
            first_day = calendar.get_first_trading_day_of_month(
                current_date.year,
                current_date.month
            )
            return current_date == first_day
        
        elif deposit_config.cadence == DepositCadence.QUARTERLY:
            # First business day of quarter
            quarter = (current_date.month - 1) // 3 + 1
            first_day = calendar.get_first_trading_day_of_quarter(
                current_date.year,
                quarter
            )
            return current_date == first_day
        
        elif deposit_config.cadence == DepositCadence.YEARLY:
            # First business day of year
            first_day = calendar.get_first_trading_day_of_year(current_date.year)
            return current_date == first_day
        
        return False
    
    def _check_contribution_cap(
        self,
        portfolio: Portfolio,
        account_config,
        current_date: date,
        deposit_amount: float
    ) -> bool:
        """Check if deposit would exceed contribution caps"""
        if not account_config.contribution_caps.enforce:
            return True
        
        year = current_date.year
        year_contributions = portfolio.annual_contributions.get(year, 0.0)
        
        if account_config.type == AccountType.TRADITIONAL_IRA:
            cap = account_config.contribution_caps.ira
        elif account_config.type == AccountType.ROTH_IRA:
            cap = account_config.contribution_caps.roth
        else:
            return True  # No cap for taxable
        
        return (year_contributions + deposit_amount) <= cap
    
    def _process_dividends(
        self,
        portfolio: Portfolio,
        market_data: Dict,
        current_date: date,
        current_prices: Dict[str, float],
        config: StrategyConfig
    ):
        """Process dividend payments"""
        for symbol, data in market_data.items():
            for div in data['dividends']:
                div_date = datetime.strptime(div.ex_date, '%Y-%m-%d').date()
                
                if div_date == current_date:
                    # Calculate dividend amount
                    quantity = portfolio.get_total_quantity(symbol)
                    
                    if quantity > 0:
                        total_dividend = quantity * div.amount
                        
                        # Record dividend as a trade entry
                        from engine.models import Trade
                        dividend_trade = Trade(
                            trade_id=f"DIV-{current_date}-{symbol}",
                            date=current_date.strftime('%Y-%m-%d'),
                            symbol=symbol,
                            action="DIVIDEND",
                            quantity=quantity,
                            price=div.amount,
                            commission=0.0,
                            slippage=0.0,
                            total_cost=total_dividend,
                            notes=f"Dividend: ${div.amount:.4f}/share x {quantity:.2f} shares"
                        )
                        portfolio.trades.append(dividend_trade)
                        
                        if config.dividends.mode == DividendMode.DRIP:
                            # Reinvest dividend
                            if symbol in current_prices:
                                price = current_prices[symbol]
                                shares = total_dividend / price
                                
                                try:
                                    portfolio.buy(
                                        symbol,
                                        shares,
                                        price,
                                        current_date,
                                        commission=0.0,
                                        slippage=0.0,
                                        action="DRIP"
                                    )
                                except ValueError:
                                    # Not enough cash for DRIP, add to cash instead
                                    portfolio.record_dividend(
                                        symbol,
                                        total_dividend,
                                        current_date,
                                        div.qualified_pct or 1.0
                                    )
                        else:
                            # Add to cash
                            portfolio.record_dividend(
                                symbol,
                                total_dividend,
                                current_date,
                                div.qualified_pct or 1.0
                            )
    
    def _apply_expense_ratios(
        self,
        portfolio: Portfolio,
        market_data: Dict,
        current_date: date
    ):
        """Apply daily ETF expense ratio drag"""
        for symbol, data in market_data.items():
            er = data.get('expense_ratio', 0.0)
            
            if er > 0:
                # Daily drag = (1 + ER)^(1/252) - 1
                daily_drag = (1 + er) ** (1/252) - 1
                
                # Apply to each lot
                if symbol in portfolio.lots:
                    for lot in portfolio.lots[symbol]:
                        drag_amount = lot.cost_basis * daily_drag
                        lot.cost_basis -= drag_amount
    
    def _execute_trades(
        self,
        portfolio: Portfolio,
        trades: List[Tuple[str, str, float]],
        current_prices: Dict[str, float],
        current_date: date,
        frictions_config
    ):
        """Execute a list of trades"""
        for symbol, action, quantity in trades:
            if quantity <= 0.0001:
                continue
            
            if symbol not in current_prices:
                continue
            
            price = current_prices[symbol]
            
            # Apply slippage
            slippage_bps = frictions_config.slippage_bps
            slippage_pct = slippage_bps / 10000.0
            commission = frictions_config.commission_per_trade
            
            try:
                if action == "BUY":
                    # Calculate total cost and adjust quantity if needed
                    total_cost = (quantity * price) + commission + (quantity * price * slippage_pct)
                    
                    # If we don't have enough cash, reduce quantity (with 0.01% buffer for rounding)
                    if total_cost >= portfolio.cash * 0.9999:
                        # Calculate max affordable quantity with safety margin
                        available_cash = portfolio.cash * 0.9999  # 0.01% buffer
                        max_qty = (available_cash - commission) / (price * (1 + slippage_pct))
                        quantity = max(0, max_qty)
                    
                    if quantity > 0.0001:
                        slippage_cost = quantity * price * slippage_pct
                        portfolio.buy(
                            symbol,
                            quantity,
                            price,
                            current_date,
                            commission,
                            slippage_cost
                        )
                elif action == "SELL":
                    slippage_cost = quantity * price * slippage_pct
                    portfolio.sell(
                        symbol,
                        quantity,
                        price,
                        current_date,
                        commission,
                        slippage_cost
                    )
            except Exception as e:
                self.warnings.append(
                    f"Trade failed on {current_date}: {action} {quantity} {symbol} - {e}"
                )
    
    def _is_year_end(
        self,
        current_date: date,
        trading_days: List[date],
        current_index: int
    ) -> bool:
        """Check if this is the last trading day of the year"""
        if current_index >= len(trading_days) - 1:
            return True
        
        next_date = trading_days[current_index + 1]
        return next_date.year > current_date.year
    
    def _calculate_metrics(
        self,
        equity_curve: List[Dict],
        portfolio: Portfolio,
        config: StrategyConfig
    ) -> PerformanceMetrics:
        """Calculate performance metrics from equity curve"""
        # Convert to pandas Series
        df = pd.DataFrame(equity_curve)
        df['date'] = pd.to_datetime(df['date'])
        df.set_index('date', inplace=True)
        
        equity_series = df['portfolio_value']
        
        # Build cashflows series from portfolio contributions
        cashflows_data = []
        for year, amount in portfolio.annual_contributions.items():
            # Add contribution at year start (approximate)
            year_start = pd.Timestamp(f'{year}-01-01')
            cashflows_data.append({'date': year_start, 'amount': amount})
        
        cashflows = None
        if cashflows_data:
            cf_df = pd.DataFrame(cashflows_data)
            cf_df['date'] = pd.to_datetime(cf_df['date'])
            cf_df.set_index('date', inplace=True)
            cashflows = cf_df['amount']
        
        calculator = MetricsCalculator()
        metrics = calculator.calculate_all_metrics(equity_series, cashflows=cashflows)
        
        return metrics
    
    async def _calculate_benchmark_metrics(
        self,
        config: StrategyConfig,
        calendar: MarketCalendar,
        trading_days: List[date]
    ) -> Tuple[Dict[str, PerformanceMetrics], Dict[str, List[Dict]]]:
        """Calculate metrics for benchmark(s) with simulated deposits"""
        benchmark_metrics = {}
        benchmark_equity = {}
        
        for benchmark_symbol in config.benchmark:
            try:
                bars = await self.data_provider.get_bars(
                    benchmark_symbol,
                    config.period.start,
                    config.period.end
                )
                
                if not bars:
                    continue
                
                # Build price series
                prices = {}
                for bar in bars:
                    bar_date = datetime.strptime(bar.date, '%Y-%m-%d').date()
                    prices[bar_date] = bar.adj_close
                
                # Simulate portfolio with deposits (buy-and-hold with regular deposits)
                shares = 0.0
                cash = config.initial_cash
                equity_data = []
                total_deposits = 0.0
                
                for i, current_date in enumerate(trading_days):
                    if current_date not in prices:
                        continue
                    
                    current_price = prices[current_date]
                    
                    # Check for deposit
                    is_deposit_day = False
                    if config.deposits:
                        is_deposit_day = self._is_deposit_day(
                            current_date,
                            config.deposits,
                            calendar
                        )
                    
                    # Add deposit if applicable
                    if is_deposit_day and config.deposits:
                        cash += config.deposits.amount
                        total_deposits += config.deposits.amount
                    
                    # Buy shares with all available cash (buy-and-hold strategy)
                    if cash > 0 and current_price > 0:
                        shares_to_buy = cash / current_price
                        shares += shares_to_buy
                        cash = 0
                    
                    # Calculate portfolio value
                    portfolio_value = shares * current_price + cash
                    
                    equity_data.append({
                        'date': current_date,
                        'value': portfolio_value
                    })
                
                # Convert to DataFrame for metrics calculation
                df = pd.DataFrame(equity_data)
                df['date'] = pd.to_datetime(df['date'])
                df.set_index('date', inplace=True)
                
                # Build cashflows for metrics
                cashflows_data = []
                if config.deposits and total_deposits > 0:
                    # Approximate: aggregate deposits by year
                    year_deposits = defaultdict(float)
                    for current_date in trading_days:
                        if config.deposits and self._is_deposit_day(current_date, config.deposits, calendar):
                            year_deposits[current_date.year] += config.deposits.amount
                    
                    for year, amount in year_deposits.items():
                        year_start = pd.Timestamp(f'{year}-01-01')
                        cashflows_data.append({'date': year_start, 'amount': amount})
                
                cashflows = None
                if cashflows_data:
                    cf_df = pd.DataFrame(cashflows_data)
                    cf_df['date'] = pd.to_datetime(cf_df['date'])
                    cf_df.set_index('date', inplace=True)
                    cashflows = cf_df['amount']
                
                calculator = MetricsCalculator()
                metrics = calculator.calculate_all_metrics(df['value'], cashflows=cashflows)
                
                benchmark_metrics[benchmark_symbol] = metrics
                
                # Store equity curve for charting
                benchmark_equity[benchmark_symbol] = [
                    {'date': d.strftime('%Y-%m-%d'), 'value': v}
                    for d, v in zip(df.index, df['value'])
                ]
            
            except Exception as e:
                self.warnings.append(f"Error calculating benchmark {benchmark_symbol}: {e}")
        
        return benchmark_metrics, benchmark_equity
