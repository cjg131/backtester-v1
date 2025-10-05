"""
Performance metrics calculation.
Includes TWR, IRR, Sharpe, Sortino, Calmar, drawdowns, and risk-adjusted metrics.
"""

import numpy as np
import pandas as pd
from typing import List, Dict, Tuple, Optional
from datetime import date
from scipy import optimize
from engine.models import PerformanceMetrics


class MetricsCalculator:
    """Calculate portfolio performance metrics"""
    
    def __init__(self, risk_free_rate: float = 0.02):
        self.risk_free_rate = risk_free_rate
    
    def calculate_twr(self, equity_curve: pd.Series, cashflows: Optional[pd.Series] = None) -> float:
        """
        Calculate Time-Weighted Return.
        If cashflows are provided, segments the return calculation around each cashflow.
        
        Args:
            equity_curve: Series of portfolio values indexed by date
            cashflows: Optional series of cashflows (deposits are positive)
            
        Returns:
            Total time-weighted return
        """
        if len(equity_curve) < 2:
            return 0.0
        
        # If no cashflows, use simple calculation
        if cashflows is None or len(cashflows) == 0:
            return (equity_curve.iloc[-1] / equity_curve.iloc[0]) - 1.0
        
        # With cashflows, we need to segment the returns
        # This is a simplified TWR that subtracts deposits from final value
        total_deposits = cashflows.sum() if cashflows is not None else 0.0
        initial_value = equity_curve.iloc[0]
        final_value = equity_curve.iloc[-1]
        
        # Calculate gain: final_value - initial_value - total_deposits
        total_gain = final_value - initial_value - total_deposits
        
        # Return as percentage of total invested (initial + deposits)
        total_invested = initial_value + total_deposits
        
        if total_invested <= 0:
            return 0.0
            
        return total_gain / total_invested
    
    def calculate_irr(
        self,
        equity_curve: pd.Series,
        cashflows: pd.Series
    ) -> float:
        """
        Calculate Internal Rate of Return using XIRR.
        
        Args:
            equity_curve: Series of portfolio values
            cashflows: Series of cashflows (deposits/withdrawals)
            
        Returns:
            Annualized IRR
        """
        if len(equity_curve) < 2:
            return 0.0
        
        # Prepare cashflows for IRR calculation
        dates = equity_curve.index.tolist()
        values = []
        
        # Initial investment (negative)
        values.append(-equity_curve.iloc[0])
        
        # Add intermediate cashflows
        for dt in dates[1:-1]:
            if dt in cashflows.index and cashflows[dt] != 0:
                values.append(-cashflows[dt])
        
        # Final value (positive)
        values.append(equity_curve.iloc[-1])
        
        # Calculate IRR using scipy
        try:
            # Convert dates to days from start
            start_date = dates[0]
            days = [(d - start_date).days for d in dates]
            
            # Use Newton's method to find IRR
            def npv(rate):
                return sum(v / (1 + rate) ** (d / 365.0) for v, d in zip(values, days))
            
            irr = optimize.newton(npv, 0.1)
            return irr
        
        except:
            # Fallback to simple return
            return self.calculate_twr(equity_curve)
    
    def calculate_cagr(
        self,
        equity_curve: pd.Series,
        years: Optional[float] = None,
        cashflows: Optional[pd.Series] = None
    ) -> float:
        """
        Calculate Compound Annual Growth Rate.
        Accounts for cashflows (deposits) if provided.
        
        Args:
            equity_curve: Series of portfolio values
            years: Number of years (calculated if not provided)
            cashflows: Optional series of cashflows (deposits are positive)
            
        Returns:
            Annualized CAGR
        """
        if len(equity_curve) < 2:
            return 0.0
        
        if years is None:
            days = (equity_curve.index[-1] - equity_curve.index[0]).days
            years = days / 365.25
        
        if years <= 0:
            return 0.0
        
        # If cashflows provided, calculate CAGR on actual gains
        if cashflows is not None and len(cashflows) > 0:
            total_deposits = cashflows.sum()
            initial_value = equity_curve.iloc[0]
            final_value = equity_curve.iloc[-1]
            
            # Calculate total gain
            total_gain = final_value - initial_value - total_deposits
            total_invested = initial_value + total_deposits
            
            if total_invested <= 0:
                return 0.0
            
            # CAGR based on gain ratio
            gain_ratio = (total_invested + total_gain) / total_invested
            cagr = (gain_ratio ** (1 / years)) - 1.0
        else:
            # No cashflows, use simple calculation
            total_return = equity_curve.iloc[-1] / equity_curve.iloc[0]
            cagr = (total_return ** (1 / years)) - 1.0
        
        return cagr
    
    def calculate_volatility(
        self,
        returns: pd.Series,
        annualize: bool = True
    ) -> float:
        """
        Calculate annualized volatility.
        
        Args:
            returns: Series of daily returns
            annualize: Whether to annualize (multiply by sqrt(252))
            
        Returns:
            Volatility (standard deviation)
        """
        if len(returns) < 2:
            return 0.0
        
        vol = returns.std()
        
        if annualize:
            vol *= np.sqrt(252)
        
        return vol
    
    def calculate_sharpe(
        self,
        returns: pd.Series,
        risk_free_rate: Optional[float] = None
    ) -> float:
        """
        Calculate Sharpe Ratio.
        
        Args:
            returns: Series of daily returns
            risk_free_rate: Annual risk-free rate (uses default if None)
            
        Returns:
            Annualized Sharpe ratio
        """
        if len(returns) < 2:
            return 0.0
        
        if risk_free_rate is None:
            risk_free_rate = self.risk_free_rate
        
        # Convert annual risk-free rate to daily
        daily_rf = (1 + risk_free_rate) ** (1/252) - 1
        
        excess_returns = returns - daily_rf
        
        if excess_returns.std() == 0:
            return 0.0
        
        sharpe = excess_returns.mean() / excess_returns.std() * np.sqrt(252)
        
        return sharpe
    
    def calculate_sortino(
        self,
        returns: pd.Series,
        risk_free_rate: Optional[float] = None
    ) -> float:
        """
        Calculate Sortino Ratio (uses downside deviation).
        
        Args:
            returns: Series of daily returns
            risk_free_rate: Annual risk-free rate
            
        Returns:
            Annualized Sortino ratio
        """
        if len(returns) < 2:
            return 0.0
        
        if risk_free_rate is None:
            risk_free_rate = self.risk_free_rate
        
        daily_rf = (1 + risk_free_rate) ** (1/252) - 1
        excess_returns = returns - daily_rf
        
        # Downside deviation (only negative returns)
        downside_returns = returns[returns < 0]
        
        if len(downside_returns) == 0 or downside_returns.std() == 0:
            return 0.0
        
        downside_std = downside_returns.std()
        sortino = excess_returns.mean() / downside_std * np.sqrt(252)
        
        return sortino
    
    def calculate_max_drawdown(
        self,
        equity_curve: pd.Series
    ) -> Tuple[float, int]:
        """
        Calculate maximum drawdown and duration.
        
        Args:
            equity_curve: Series of portfolio values
            
        Returns:
            (max_drawdown, duration_in_days)
        """
        if len(equity_curve) < 2:
            return 0.0, 0
        
        # Calculate running maximum
        running_max = equity_curve.expanding().max()
        
        # Calculate drawdown
        drawdown = (equity_curve - running_max) / running_max
        
        max_dd = drawdown.min()
        
        # Calculate duration
        # Find the longest period in drawdown
        in_drawdown = drawdown < 0
        
        max_duration = 0
        current_duration = 0
        
        for is_dd in in_drawdown:
            if is_dd:
                current_duration += 1
                max_duration = max(max_duration, current_duration)
            else:
                current_duration = 0
        
        return max_dd, max_duration
    
    def calculate_calmar(
        self,
        cagr: float,
        max_drawdown: float
    ) -> float:
        """
        Calculate Calmar Ratio (CAGR / Max Drawdown).
        
        Args:
            cagr: Compound annual growth rate
            max_drawdown: Maximum drawdown (negative value)
            
        Returns:
            Calmar ratio
        """
        if max_drawdown >= 0:
            return 0.0
        
        return cagr / abs(max_drawdown)
    
    def calculate_rolling_returns(
        self,
        equity_curve: pd.Series,
        window_days: int
    ) -> pd.Series:
        """
        Calculate rolling returns over a window.
        
        Args:
            equity_curve: Series of portfolio values
            window_days: Window size in days
            
        Returns:
            Series of rolling returns
        """
        rolling_ret = equity_curve.pct_change(periods=window_days)
        return rolling_ret
    
    def calculate_monthly_returns(self, equity_curve: pd.Series) -> pd.Series:
        """Calculate monthly returns"""
        monthly = equity_curve.resample('M').last()
        return monthly.pct_change()
    
    def calculate_quarterly_returns(self, equity_curve: pd.Series) -> pd.Series:
        """Calculate quarterly returns"""
        quarterly = equity_curve.resample('Q').last()
        return quarterly.pct_change()
    
    def calculate_hit_ratio(self, returns: pd.Series) -> float:
        """
        Calculate hit ratio (percentage of positive return periods).
        
        Args:
            returns: Series of returns
            
        Returns:
            Hit ratio (0 to 1)
        """
        if len(returns) == 0:
            return 0.0
        
        positive = (returns > 0).sum()
        total = len(returns)
        
        return positive / total
    
    def calculate_alpha_beta(
        self,
        portfolio_returns: pd.Series,
        benchmark_returns: pd.Series
    ) -> Tuple[float, float]:
        """
        Calculate alpha and beta vs benchmark.
        
        Args:
            portfolio_returns: Portfolio daily returns
            benchmark_returns: Benchmark daily returns
            
        Returns:
            (alpha, beta)
        """
        if len(portfolio_returns) < 2 or len(benchmark_returns) < 2:
            return 0.0, 1.0
        
        # Align series
        aligned = pd.DataFrame({
            'portfolio': portfolio_returns,
            'benchmark': benchmark_returns
        }).dropna()
        
        if len(aligned) < 2:
            return 0.0, 1.0
        
        # Calculate beta using covariance
        covariance = aligned['portfolio'].cov(aligned['benchmark'])
        benchmark_var = aligned['benchmark'].var()
        
        if benchmark_var == 0:
            beta = 1.0
        else:
            beta = covariance / benchmark_var
        
        # Calculate alpha (annualized)
        portfolio_mean = aligned['portfolio'].mean() * 252
        benchmark_mean = aligned['benchmark'].mean() * 252
        
        alpha = portfolio_mean - (beta * benchmark_mean)
        
        return alpha, beta
    
    def calculate_tracking_error(
        self,
        portfolio_returns: pd.Series,
        benchmark_returns: pd.Series
    ) -> float:
        """
        Calculate tracking error (annualized).
        
        Args:
            portfolio_returns: Portfolio daily returns
            benchmark_returns: Benchmark daily returns
            
        Returns:
            Annualized tracking error
        """
        aligned = pd.DataFrame({
            'portfolio': portfolio_returns,
            'benchmark': benchmark_returns
        }).dropna()
        
        if len(aligned) < 2:
            return 0.0
        
        excess_returns = aligned['portfolio'] - aligned['benchmark']
        tracking_error = excess_returns.std() * np.sqrt(252)
        
        return tracking_error
    
    def calculate_information_ratio(
        self,
        portfolio_returns: pd.Series,
        benchmark_returns: pd.Series
    ) -> float:
        """
        Calculate Information Ratio.
        
        Args:
            portfolio_returns: Portfolio daily returns
            benchmark_returns: Benchmark daily returns
            
        Returns:
            Information ratio
        """
        aligned = pd.DataFrame({
            'portfolio': portfolio_returns,
            'benchmark': benchmark_returns
        }).dropna()
        
        if len(aligned) < 2:
            return 0.0
        
        excess_returns = aligned['portfolio'] - aligned['benchmark']
        
        if excess_returns.std() == 0:
            return 0.0
        
        ir = (excess_returns.mean() / excess_returns.std()) * np.sqrt(252)
        
        return ir
    
    def calculate_all_metrics(
        self,
        equity_curve: pd.Series,
        cashflows: Optional[pd.Series] = None,
        benchmark_returns: Optional[pd.Series] = None
    ) -> PerformanceMetrics:
        """
        Calculate all performance metrics.
        
        Args:
            equity_curve: Portfolio value over time
            cashflows: Optional cashflows for IRR calculation
            benchmark_returns: Optional benchmark returns for alpha/beta
            
        Returns:
            PerformanceMetrics object
        """
        # Calculate returns
        returns = equity_curve.pct_change().dropna()
        
        # Calculate time period
        days = (equity_curve.index[-1] - equity_curve.index[0]).days
        years = days / 365.25
        
        # Basic metrics - pass cashflows to TWR for proper calculation
        twr = self.calculate_twr(equity_curve, cashflows)
        
        if cashflows is not None:
            irr = self.calculate_irr(equity_curve, cashflows)
        else:
            irr = twr
        
        cagr = self.calculate_cagr(equity_curve, years, cashflows)
        annual_vol = self.calculate_volatility(returns)
        sharpe = self.calculate_sharpe(returns)
        sortino = self.calculate_sortino(returns)
        
        max_dd, dd_duration = self.calculate_max_drawdown(equity_curve)
        calmar = self.calculate_calmar(cagr, max_dd)
        
        # Monthly/quarterly stats
        monthly_returns = self.calculate_monthly_returns(equity_curve)
        quarterly_returns = self.calculate_quarterly_returns(equity_curve)
        
        best_month = monthly_returns.max() if len(monthly_returns) > 0 else 0.0
        worst_month = monthly_returns.min() if len(monthly_returns) > 0 else 0.0
        best_quarter = quarterly_returns.max() if len(quarterly_returns) > 0 else 0.0
        worst_quarter = quarterly_returns.min() if len(quarterly_returns) > 0 else 0.0
        
        hit_ratio = self.calculate_hit_ratio(returns)
        
        # Benchmark metrics
        alpha = None
        beta = None
        tracking_error = None
        information_ratio = None
        
        if benchmark_returns is not None and len(benchmark_returns) > 0:
            alpha, beta = self.calculate_alpha_beta(returns, benchmark_returns)
            tracking_error = self.calculate_tracking_error(returns, benchmark_returns)
            information_ratio = self.calculate_information_ratio(returns, benchmark_returns)
        
        return PerformanceMetrics(
            twr=twr,
            irr=irr,
            cagr=cagr,
            annual_vol=annual_vol,
            sharpe=sharpe,
            sortino=sortino,
            calmar=calmar,
            max_drawdown=max_dd,
            max_drawdown_duration_days=dd_duration,
            best_month=best_month,
            worst_month=worst_month,
            best_quarter=best_quarter,
            worst_quarter=worst_quarter,
            hit_ratio=hit_ratio,
            alpha=alpha,
            beta=beta,
            tracking_error=tracking_error,
            information_ratio=information_ratio
        )
