"""
Tax calculation and year-end tax accrual for taxable accounts.
"""

from typing import Dict, List
from datetime import date
from engine.models import TaxConfig, TaxSummary
from engine.portfolio import Portfolio
from engine.constants import AccountType


class TaxCalculator:
    """Calculate taxes for taxable accounts"""
    
    def __init__(self, config: TaxConfig):
        self.config = config
    
    def calculate_annual_tax(
        self,
        year: int,
        portfolio: Portfolio
    ) -> TaxSummary:
        """
        Calculate total tax liability for a year.
        
        Args:
            year: Tax year
            portfolio: Portfolio with realized gains/dividends
            
        Returns:
            TaxSummary with breakdown
        """
        # Get annual totals
        st_gains = portfolio.annual_realized_st.get(year, 0.0)
        lt_gains = portfolio.annual_realized_lt.get(year, 0.0)
        qualified_divs = portfolio.annual_dividends_qualified.get(year, 0.0)
        ordinary_divs = portfolio.annual_dividends_ordinary.get(year, 0.0)
        interest = portfolio.annual_interest.get(year, 0.0)
        
        # Calculate taxes
        # Short-term gains taxed as ordinary income
        st_tax = max(0, st_gains) * (self.config.federal_ordinary + self.config.state)
        
        # Long-term gains taxed at LTCG rate
        lt_tax = max(0, lt_gains) * (self.config.federal_ltcg + self.config.state)
        
        # Qualified dividends taxed at LTCG rate
        qualified_div_tax = qualified_divs * (self.config.federal_ltcg + self.config.state)
        
        # Ordinary dividends and interest taxed as ordinary income
        ordinary_div_tax = ordinary_divs * (self.config.federal_ordinary + self.config.state)
        interest_tax = interest * (self.config.federal_ordinary + self.config.state)
        
        # Total tax
        total_tax = st_tax + lt_tax + qualified_div_tax + ordinary_div_tax + interest_tax
        
        # Count wash sales
        wash_sale_count = sum(
            len(losses) for losses in portfolio.wash_sale_losses.values()
        )
        
        return TaxSummary(
            year=year,
            short_term_gains=st_gains,
            long_term_gains=lt_gains,
            qualified_dividends=qualified_divs,
            ordinary_dividends=ordinary_divs,
            interest_income=interest,
            total_tax=total_tax,
            wash_sale_count=wash_sale_count
        )
    
    def apply_year_end_tax(
        self,
        year: int,
        portfolio: Portfolio,
        pay_from_external: bool = False
    ) -> float:
        """
        Calculate and apply year-end tax.
        
        Args:
            year: Tax year
            portfolio: Portfolio to deduct tax from
            pay_from_external: If True, don't deduct from portfolio cash
            
        Returns:
            Tax amount
        """
        tax_summary = self.calculate_annual_tax(year, portfolio)
        
        if not pay_from_external and tax_summary.total_tax > 0:
            portfolio.deduct_tax(tax_summary.total_tax)
        
        return tax_summary.total_tax
    
    def calculate_after_tax_value(
        self,
        portfolio: Portfolio,
        current_prices: Dict[str, float],
        withdrawal_tax_rate: float = 0.0
    ) -> float:
        """
        Calculate after-tax portfolio value.
        
        For Traditional IRA, applies withdrawal tax rate to entire value.
        For Roth IRA, no tax.
        For Taxable, accounts for unrealized gains tax.
        
        Args:
            portfolio: Portfolio to value
            current_prices: Current market prices
            withdrawal_tax_rate: Tax rate for IRA withdrawals
            
        Returns:
            After-tax value
        """
        total_value = portfolio.get_total_value(current_prices)
        
        if portfolio.account_type == AccountType.ROTH_IRA:
            # Roth is tax-free
            return total_value
        
        elif portfolio.account_type == AccountType.TRADITIONAL_IRA:
            # Traditional IRA: entire withdrawal is taxed
            return total_value * (1 - withdrawal_tax_rate)
        
        else:  # Taxable
            # Calculate tax on unrealized gains
            positions = portfolio.get_all_positions(current_prices)
            unrealized_tax = 0.0
            
            for pos in positions:
                if pos.unrealized_gain > 0:
                    # Assume long-term for unrealized (conservative)
                    unrealized_tax += pos.unrealized_gain * (
                        self.config.federal_ltcg + self.config.state
                    )
            
            return total_value - unrealized_tax


def calculate_tax_drag(
    portfolio: Portfolio,
    tax_config: TaxConfig,
    years: List[int]
) -> Dict[int, float]:
    """
    Calculate annual tax drag (taxes paid as % of portfolio value).
    
    Args:
        portfolio: Portfolio with tax history
        tax_config: Tax configuration
        years: List of years to calculate
        
    Returns:
        Dict of year -> tax drag percentage
    """
    calculator = TaxCalculator(tax_config)
    tax_drag = {}
    
    for year in years:
        tax_summary = calculator.calculate_annual_tax(year, portfolio)
        # Tax drag would need portfolio value at year end
        # This is a simplified version
        tax_drag[year] = tax_summary.total_tax
    
    return tax_drag
