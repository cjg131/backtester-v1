"""
Tests for tax calculation and year-end tax accrual.
"""

import pytest
from datetime import date
from engine.tax import TaxCalculator, calculate_tax_drag
from engine.portfolio import Portfolio
from engine.models import TaxConfig
from engine.constants import AccountType


@pytest.fixture
def tax_config():
    """Standard tax configuration"""
    return TaxConfig(
        federal_ordinary=0.32,
        federal_ltcg=0.15,
        state=0.06,
        qualified_dividend_pct=0.8,
        apply_wash_sale=True,
        pay_taxes_from_external=False
    )


@pytest.fixture
def taxable_portfolio():
    """Portfolio with some realized gains and dividends"""
    portfolio = Portfolio(100000, AccountType.TAXABLE)
    
    # Buy and sell for short-term gain
    portfolio.buy("SPY", 10, 400, date(2024, 1, 1))
    portfolio.sell("SPY", 5, 450, date(2024, 6, 1))  # ST gain: 250
    
    # Buy and sell for long-term gain
    portfolio.buy("AAPL", 20, 150, date(2023, 1, 1))
    portfolio.sell("AAPL", 10, 180, date(2024, 6, 1))  # LT gain: 300
    
    # Record dividends
    portfolio.record_dividend("SPY", 100, date(2024, 3, 1), qualified_pct=1.0)
    portfolio.record_dividend("AAPL", 50, date(2024, 3, 1), qualified_pct=0.5)
    
    return portfolio


def test_tax_calculator_initialization(tax_config):
    """Test tax calculator initialization"""
    calc = TaxCalculator(tax_config)
    assert calc.config == tax_config


def test_calculate_short_term_gains_tax(tax_config):
    """Test short-term capital gains tax calculation"""
    portfolio = Portfolio(100000, AccountType.TAXABLE)
    
    # Buy and sell for ST gain
    portfolio.buy("SPY", 10, 400, date(2024, 1, 1))
    portfolio.sell("SPY", 10, 500, date(2024, 6, 1))  # ST gain: 1000
    
    calc = TaxCalculator(tax_config)
    summary = calc.calculate_annual_tax(2024, portfolio)
    
    assert summary.short_term_gains == 1000
    assert summary.long_term_gains == 0
    # ST tax = 1000 * (0.32 + 0.06) = 380
    assert summary.total_tax == pytest.approx(380)


def test_calculate_long_term_gains_tax(tax_config):
    """Test long-term capital gains tax calculation"""
    portfolio = Portfolio(100000, AccountType.TAXABLE)
    
    # Buy and sell for LT gain (> 365 days)
    portfolio.buy("SPY", 10, 400, date(2023, 1, 1))
    portfolio.sell("SPY", 10, 500, date(2024, 6, 1))  # LT gain: 1000
    
    calc = TaxCalculator(tax_config)
    summary = calc.calculate_annual_tax(2024, portfolio)
    
    assert summary.short_term_gains == 0
    assert summary.long_term_gains == 1000
    # LT tax = 1000 * (0.15 + 0.06) = 210
    assert summary.total_tax == pytest.approx(210)


def test_calculate_qualified_dividend_tax(tax_config):
    """Test qualified dividend tax calculation"""
    portfolio = Portfolio(100000, AccountType.TAXABLE)
    portfolio.buy("SPY", 10, 400, date(2024, 1, 1))
    
    # Record qualified dividend
    portfolio.record_dividend("SPY", 100, date(2024, 3, 1), qualified_pct=1.0)
    
    calc = TaxCalculator(tax_config)
    summary = calc.calculate_annual_tax(2024, portfolio)
    
    assert summary.qualified_dividends == 100
    assert summary.ordinary_dividends == 0
    # Qualified div tax = 100 * (0.15 + 0.06) = 21
    assert summary.total_tax == pytest.approx(21)


def test_calculate_ordinary_dividend_tax(tax_config):
    """Test ordinary dividend tax calculation"""
    portfolio = Portfolio(100000, AccountType.TAXABLE)
    portfolio.buy("SPY", 10, 400, date(2024, 1, 1))
    
    # Record ordinary dividend
    portfolio.record_dividend("SPY", 100, date(2024, 3, 1), qualified_pct=0.0)
    
    calc = TaxCalculator(tax_config)
    summary = calc.calculate_annual_tax(2024, portfolio)
    
    assert summary.qualified_dividends == 0
    assert summary.ordinary_dividends == 100
    # Ordinary div tax = 100 * (0.32 + 0.06) = 38
    assert summary.total_tax == pytest.approx(38)


def test_calculate_mixed_dividend_tax(tax_config):
    """Test partially qualified dividend tax calculation"""
    portfolio = Portfolio(100000, AccountType.TAXABLE)
    portfolio.buy("SPY", 10, 400, date(2024, 1, 1))
    
    # Record 50% qualified dividend
    portfolio.record_dividend("SPY", 100, date(2024, 3, 1), qualified_pct=0.5)
    
    calc = TaxCalculator(tax_config)
    summary = calc.calculate_annual_tax(2024, portfolio)
    
    assert summary.qualified_dividends == 50
    assert summary.ordinary_dividends == 50
    # Tax = 50 * 0.21 + 50 * 0.38 = 10.5 + 19 = 29.5
    assert summary.total_tax == pytest.approx(29.5)


def test_calculate_combined_tax(taxable_portfolio, tax_config):
    """Test combined tax calculation with gains and dividends"""
    calc = TaxCalculator(tax_config)
    summary = calc.calculate_annual_tax(2024, taxable_portfolio)
    
    # Should have ST gains, LT gains, and dividends
    assert summary.short_term_gains > 0
    assert summary.long_term_gains > 0
    assert summary.qualified_dividends > 0
    assert summary.total_tax > 0


def test_no_tax_on_losses(tax_config):
    """Test that losses don't create negative tax"""
    portfolio = Portfolio(100000, AccountType.TAXABLE)
    
    # Buy and sell for a loss
    portfolio.buy("SPY", 10, 500, date(2024, 1, 1))
    portfolio.sell("SPY", 10, 400, date(2024, 6, 1))  # ST loss: -1000
    
    calc = TaxCalculator(tax_config)
    summary = calc.calculate_annual_tax(2024, portfolio)
    
    assert summary.short_term_gains == -1000
    assert summary.total_tax == 0  # No negative tax


def test_apply_year_end_tax_deducts_from_portfolio(tax_config):
    """Test that year-end tax is deducted from portfolio cash"""
    portfolio = Portfolio(100000, AccountType.TAXABLE)
    
    # Generate some gains
    portfolio.buy("SPY", 10, 400, date(2024, 1, 1))
    portfolio.sell("SPY", 10, 500, date(2024, 6, 1))  # ST gain: 1000
    
    initial_cash = portfolio.cash
    
    calc = TaxCalculator(tax_config)
    tax_amount = calc.apply_year_end_tax(2024, portfolio, pay_from_external=False)
    
    assert tax_amount > 0
    assert portfolio.cash == initial_cash - tax_amount


def test_apply_year_end_tax_external_payment(tax_config):
    """Test that external payment doesn't deduct from portfolio"""
    portfolio = Portfolio(100000, AccountType.TAXABLE)
    
    # Generate some gains
    portfolio.buy("SPY", 10, 400, date(2024, 1, 1))
    portfolio.sell("SPY", 10, 500, date(2024, 6, 1))
    
    initial_cash = portfolio.cash
    
    calc = TaxCalculator(tax_config)
    tax_amount = calc.apply_year_end_tax(2024, portfolio, pay_from_external=True)
    
    assert tax_amount > 0
    assert portfolio.cash == initial_cash  # Cash unchanged


def test_calculate_after_tax_value_roth(tax_config):
    """Test after-tax value for Roth IRA (no tax)"""
    portfolio = Portfolio(100000, AccountType.ROTH_IRA)
    portfolio.buy("SPY", 100, 400, date(2024, 1, 1))
    
    current_prices = {"SPY": 500}
    
    calc = TaxCalculator(tax_config)
    after_tax = calc.calculate_after_tax_value(portfolio, current_prices)
    
    # Roth is tax-free
    total_value = portfolio.get_total_value(current_prices)
    assert after_tax == total_value


def test_calculate_after_tax_value_traditional_ira(tax_config):
    """Test after-tax value for Traditional IRA (withdrawal tax)"""
    portfolio = Portfolio(100000, AccountType.TRADITIONAL_IRA)
    portfolio.buy("SPY", 100, 400, date(2024, 1, 1))
    
    current_prices = {"SPY": 500}
    withdrawal_tax_rate = 0.25
    
    calc = TaxCalculator(tax_config)
    after_tax = calc.calculate_after_tax_value(
        portfolio, current_prices, withdrawal_tax_rate
    )
    
    # Traditional IRA: tax on entire withdrawal
    total_value = portfolio.get_total_value(current_prices)
    expected = total_value * (1 - withdrawal_tax_rate)
    assert after_tax == pytest.approx(expected)


def test_calculate_after_tax_value_taxable(tax_config):
    """Test after-tax value for taxable account (unrealized gains tax)"""
    portfolio = Portfolio(100000, AccountType.TAXABLE)
    portfolio.buy("SPY", 100, 400, date(2024, 1, 1))
    
    current_prices = {"SPY": 500}  # Unrealized gain: 10000
    
    calc = TaxCalculator(tax_config)
    after_tax = calc.calculate_after_tax_value(portfolio, current_prices)
    
    # Should be less than total value due to unrealized gains tax
    total_value = portfolio.get_total_value(current_prices)
    assert after_tax < total_value
    
    # Unrealized gain tax = 10000 * (0.15 + 0.06) = 2100
    expected = total_value - 2100
    assert after_tax == pytest.approx(expected)


def test_tax_drag_calculation(tax_config):
    """Test tax drag calculation over multiple years"""
    portfolio = Portfolio(100000, AccountType.TAXABLE)
    
    # Generate gains in 2024
    portfolio.buy("SPY", 10, 400, date(2024, 1, 1))
    portfolio.sell("SPY", 10, 500, date(2024, 6, 1))
    
    # Generate gains in 2025
    portfolio.buy("AAPL", 10, 150, date(2025, 1, 1))
    portfolio.sell("AAPL", 10, 200, date(2025, 6, 1))
    
    drag = calculate_tax_drag(portfolio, tax_config, [2024, 2025])
    
    assert 2024 in drag
    assert 2025 in drag
    assert drag[2024] > 0
    assert drag[2025] > 0


def test_wash_sale_count(tax_config):
    """Test that wash sales are counted in tax summary"""
    portfolio = Portfolio(100000, AccountType.TAXABLE)
    portfolio.apply_wash_sale = True
    
    # Sell at a loss
    portfolio.buy("SPY", 10, 500, date(2024, 1, 1))
    portfolio.sell("SPY", 10, 400, date(2024, 2, 1))  # Loss
    
    # Buy back within 30 days (wash sale)
    portfolio.buy("SPY", 10, 400, date(2024, 2, 15))
    
    calc = TaxCalculator(tax_config)
    summary = calc.calculate_annual_tax(2024, portfolio)
    
    # Should have at least one wash sale
    assert summary.wash_sale_count >= 0


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
