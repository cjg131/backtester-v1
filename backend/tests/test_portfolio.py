"""
Tests for portfolio management and lot accounting.
"""

import pytest
from datetime import date
from engine.portfolio import Portfolio
from engine.constants import AccountType, LotMethod


def test_portfolio_initialization():
    """Test portfolio initialization"""
    portfolio = Portfolio(
        initial_cash=100000,
        account_type=AccountType.TAXABLE,
        lot_method=LotMethod.HIFO
    )
    
    assert portfolio.cash == 100000
    assert portfolio.account_type == AccountType.TAXABLE
    assert portfolio.lot_method == LotMethod.HIFO
    assert len(portfolio.lots) == 0
    assert len(portfolio.trades) == 0


def test_buy_creates_lot():
    """Test that buying creates a new lot"""
    portfolio = Portfolio(100000, AccountType.TAXABLE)
    
    trade = portfolio.buy(
        symbol="SPY",
        quantity=10,
        price=400,
        trade_date=date(2024, 1, 1),
        commission=0,
        slippage=0
    )
    
    assert portfolio.cash == 96000  # 100000 - (10 * 400)
    assert len(portfolio.lots["SPY"]) == 1
    assert portfolio.lots["SPY"][0].quantity == 10
    assert portfolio.lots["SPY"][0].cost_basis == 4000
    assert len(portfolio.trades) == 1


def test_sell_reduces_position():
    """Test that selling reduces position"""
    portfolio = Portfolio(100000, AccountType.TAXABLE)
    
    # Buy
    portfolio.buy("SPY", 10, 400, date(2024, 1, 1))
    
    # Sell
    portfolio.sell("SPY", 5, 450, date(2024, 6, 1))
    
    assert portfolio.get_total_quantity("SPY") == 5
    assert portfolio.cash > 96000  # Should have gained from sale


def test_hifo_lot_selection():
    """Test HIFO lot selection"""
    portfolio = Portfolio(100000, AccountType.TAXABLE, LotMethod.HIFO)
    
    # Buy at different prices
    portfolio.buy("SPY", 10, 400, date(2024, 1, 1))
    portfolio.buy("SPY", 10, 450, date(2024, 2, 1))
    portfolio.buy("SPY", 10, 350, date(2024, 3, 1))
    
    # Sell - should sell highest cost first (450)
    portfolio.sell("SPY", 10, 500, date(2024, 6, 1))
    
    # Check that the 450 lot was sold
    remaining_lots = portfolio.lots["SPY"]
    assert len(remaining_lots) == 2
    
    # The 450 lot should be gone
    costs = [lot.cost_basis / lot.quantity for lot in remaining_lots]
    assert 450 not in costs


def test_dividend_payment():
    """Test dividend recording"""
    portfolio = Portfolio(100000, AccountType.TAXABLE)
    
    portfolio.buy("SPY", 10, 400, date(2024, 1, 1))
    
    initial_cash = portfolio.cash
    portfolio.record_dividend("SPY", 50, date(2024, 3, 1), qualified_pct=1.0)
    
    assert portfolio.cash == initial_cash + 50
    assert portfolio.annual_dividends_qualified[2024] == 50


def test_deposit():
    """Test adding deposits"""
    portfolio = Portfolio(100000, AccountType.ROTH_IRA)
    
    portfolio.add_deposit(500, date(2024, 1, 1))
    
    assert portfolio.cash == 100500
    assert portfolio.annual_contributions[2024] == 500


def test_insufficient_cash():
    """Test that buying with insufficient cash raises error"""
    portfolio = Portfolio(1000, AccountType.TAXABLE)
    
    with pytest.raises(ValueError, match="Insufficient cash"):
        portfolio.buy("SPY", 100, 400, date(2024, 1, 1))


def test_insufficient_shares():
    """Test that selling more shares than owned raises error"""
    portfolio = Portfolio(100000, AccountType.TAXABLE)
    
    portfolio.buy("SPY", 10, 400, date(2024, 1, 1))
    
    with pytest.raises(ValueError, match="Insufficient shares"):
        portfolio.sell("SPY", 20, 400, date(2024, 6, 1))


def test_realized_gains_tracking():
    """Test that realized gains are tracked correctly"""
    portfolio = Portfolio(100000, AccountType.TAXABLE)
    
    # Buy and sell for a gain (must be > 365 days for long-term)
    portfolio.buy("SPY", 10, 400, date(2024, 1, 1))
    portfolio.sell("SPY", 10, 500, date(2025, 1, 2))  # Long-term gain (366 days)
    
    assert portfolio.realized_lt_gains > 0
    assert portfolio.annual_realized_lt[2025] > 0


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
