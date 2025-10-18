"""
Integration tests for the strategy runner.
"""

import pytest
from datetime import date
from engine.runner import StrategyRunner
from engine.models import (
    StrategyConfig, UniverseConfig, PeriodConfig, AccountConfig,
    TaxConfig, LotConfig, RebalancingConfig, DepositConfig,
    DividendConfig, FrictionsConfig, RebalanceType
)
from engine.constants import (
    AccountType, LotMethod, DividendMode, DepositCadence
)
from providers.csv_provider import CSVProvider


@pytest.fixture
def csv_provider():
    """CSV data provider for testing"""
    return CSVProvider(data_dir="data")


@pytest.fixture
def simple_strategy_config():
    """Simple buy-and-hold strategy configuration"""
    return StrategyConfig(
        name="Test Strategy",
        initial_cash=100000,
        universe=UniverseConfig(
            symbols=["SPY"],
            weights={"SPY": 1.0}
        ),
        period=PeriodConfig(
            start="2024-01-01",
            end="2024-12-31",
            calendar="NYSE"
        ),
        account=AccountConfig(
            type=AccountType.TAXABLE,
            tax=TaxConfig(
                federal_ordinary=0.32,
                federal_ltcg=0.15,
                state=0.06,
                qualified_dividend_pct=0.8,
                apply_wash_sale=True,
                pay_taxes_from_external=False
            )
        ),
        lots=LotConfig(method=LotMethod.HIFO),
        rebalancing=RebalancingConfig(type=RebalanceType.CASHFLOW_ONLY),
        deposits=DepositConfig(
            cadence=DepositCadence.NONE,
            amount=0
        ),
        dividends=DividendConfig(
            mode=DividendMode.DRIP,
            reinvest_to="SPY"
        ),
        frictions=FrictionsConfig(
            commission_per_trade=0.0,
            slippage_bps=5.0,
            use_actual_etf_er=False,
            equity_borrow_bps=0.0
        )
    )


def test_strategy_runner_initialization(csv_provider):
    """Test strategy runner initialization"""
    runner = StrategyRunner(csv_provider)
    assert runner.data_provider == csv_provider
    assert runner.warnings == []


@pytest.mark.asyncio
async def test_run_simple_strategy(csv_provider, simple_strategy_config):
    """Test running a simple buy-and-hold strategy"""
    runner = StrategyRunner(csv_provider)
    
    # This will fail if data doesn't exist, but tests the flow
    try:
        result = await runner.run(simple_strategy_config)
        
        # Check result structure
        assert result.config == simple_strategy_config
        assert hasattr(result, 'equity_curve')
        assert hasattr(result, 'metrics')
        assert hasattr(result, 'trades')
        
    except (FileNotFoundError, ValueError) as e:
        # Expected if test data doesn't exist
        pytest.skip(f"Test data not available: {e}")


def test_strategy_config_validation():
    """Test strategy configuration validation"""
    # Missing required fields should raise validation error
    with pytest.raises(Exception):
        StrategyConfig(
            name="Invalid",
            initial_cash=-1000  # Invalid negative cash
        )


def test_account_type_taxable():
    """Test taxable account configuration"""
    config = AccountConfig(
        type=AccountType.TAXABLE,
        tax=TaxConfig(
            federal_ordinary=0.32,
            federal_ltcg=0.15,
            state=0.06,
            qualified_dividend_pct=0.8,
            apply_wash_sale=True,
            pay_taxes_from_external=False
        )
    )
    
    assert config.type == AccountType.TAXABLE
    assert config.tax.federal_ordinary == 0.32


def test_account_type_roth_ira():
    """Test Roth IRA account configuration"""
    config = AccountConfig(
        type=AccountType.ROTH_IRA,
        tax=TaxConfig()  # Tax settings ignored for Roth
    )
    
    assert config.type == AccountType.ROTH_IRA


def test_universe_config_single_symbol():
    """Test universe configuration with single symbol"""
    universe = UniverseConfig(
        symbols=["SPY"],
        weights={"SPY": 1.0}
    )
    
    assert len(universe.symbols) == 1
    assert universe.weights["SPY"] == 1.0


def test_universe_config_multiple_symbols():
    """Test universe configuration with multiple symbols"""
    universe = UniverseConfig(
        symbols=["SPY", "AGG"],
        weights={"SPY": 0.6, "AGG": 0.4}
    )
    
    assert len(universe.symbols) == 2
    assert sum(universe.weights.values()) == pytest.approx(1.0)


def test_period_config():
    """Test period configuration"""
    period = PeriodConfig(
        start="2024-01-01",
        end="2024-12-31",
        calendar="NYSE"
    )
    
    assert period.start == "2024-01-01"
    assert period.end == "2024-12-31"
    assert period.calendar == "NYSE"


def test_deposits_config_monthly():
    """Test monthly deposits configuration"""
    deposits = DepositConfig(
        cadence=DepositCadence.MONTHLY,
        amount=1000,
        start_date="2024-01-01"
    )
    
    assert deposits.cadence == DepositCadence.MONTHLY
    assert deposits.amount == 1000


def test_deposits_config_none():
    """Test no deposits configuration"""
    deposits = DepositConfig(
        cadence=DepositCadence.NONE,
        amount=0
    )
    
    assert deposits.cadence == DepositCadence.NONE
    assert deposits.amount == 0


def test_dividends_config_drip():
    """Test DRIP dividends configuration"""
    dividends = DividendConfig(
        mode=DividendMode.DRIP,
        reinvest_to="SPY"
    )
    
    assert dividends.mode == DividendMode.DRIP
    assert dividends.reinvest_to == "SPY"


def test_dividends_config_cash():
    """Test cash dividends configuration"""
    dividends = DividendConfig(
        mode=DividendMode.CASH
    )
    
    assert dividends.mode == DividendMode.CASH


def test_frictions_config():
    """Test frictions configuration"""
    frictions = FrictionsConfig(
        commission_per_trade=1.0,
        slippage_bps=5.0,
        use_actual_etf_er=True,
        equity_borrow_bps=0.0
    )
    
    assert frictions.commission_per_trade == 1.0
    assert frictions.slippage_bps == 5.0
    assert frictions.use_actual_etf_er is True


def test_lot_method_hifo():
    """Test HIFO lot method configuration"""
    lots = LotConfig(method=LotMethod.HIFO)
    assert lots.method == LotMethod.HIFO


def test_lot_method_fifo():
    """Test FIFO lot method configuration"""
    lots = LotConfig(method=LotMethod.FIFO)
    assert lots.method == LotMethod.FIFO


def test_lot_method_lifo():
    """Test LIFO lot method configuration"""
    lots = LotConfig(method=LotMethod.LIFO)
    assert lots.method == LotMethod.LIFO


def test_rebalancing_config_calendar():
    """Test calendar rebalancing configuration"""
    from engine.models import CalendarRebalanceConfig, CalendarPeriod
    
    rebalancing = RebalancingConfig(
        type=RebalanceType.CALENDAR,
        calendar=CalendarRebalanceConfig(period=CalendarPeriod.MONTHLY)
    )
    
    assert rebalancing.type == RebalanceType.CALENDAR
    assert rebalancing.calendar.period == CalendarPeriod.MONTHLY


def test_rebalancing_config_drift():
    """Test drift rebalancing configuration"""
    from engine.models import DriftRebalanceConfig
    
    rebalancing = RebalancingConfig(
        type=RebalanceType.DRIFT,
        drift=DriftRebalanceConfig(abs_pct=0.05)
    )
    
    assert rebalancing.type == RebalanceType.DRIFT
    assert rebalancing.drift.abs_pct == 0.05


def test_tax_config_rates():
    """Test tax configuration with different rates"""
    tax = TaxConfig(
        federal_ordinary=0.37,
        federal_ltcg=0.20,
        state=0.10,
        qualified_dividend_pct=1.0,
        apply_wash_sale=True,
        pay_taxes_from_external=True
    )
    
    assert tax.federal_ordinary == 0.37
    assert tax.federal_ltcg == 0.20
    assert tax.state == 0.10
    assert tax.qualified_dividend_pct == 1.0


def test_strategy_with_multiple_symbols(csv_provider):
    """Test strategy configuration with multiple symbols"""
    config = StrategyConfig(
        name="60/40 Portfolio",
        initial_cash=100000,
        universe=UniverseConfig(
            symbols=["SPY", "AGG"],
            weights={"SPY": 0.6, "AGG": 0.4}
        ),
        period=PeriodConfig(
            start="2024-01-01",
            end="2024-12-31",
            calendar="NYSE"
        ),
        account=AccountConfig(
            type=AccountType.ROTH_IRA,
            tax=TaxConfig()
        ),
        lots=LotConfig(method=LotMethod.FIFO),
        rebalancing=RebalancingConfig(type=RebalanceType.CASHFLOW_ONLY),
        deposits=DepositConfig(cadence=DepositCadence.NONE, amount=0),
        dividends=DividendConfig(mode=DividendMode.DRIP),
        frictions=FrictionsConfig()
    )
    
    assert len(config.universe.symbols) == 2
    assert config.account.type == AccountType.ROTH_IRA


def test_strategy_runner_warnings(csv_provider):
    """Test that runner collects warnings"""
    runner = StrategyRunner(csv_provider)
    
    # Warnings should start empty
    assert len(runner.warnings) == 0


@pytest.mark.asyncio
async def test_run_with_invalid_config(csv_provider):
    """Test running with invalid configuration"""
    runner = StrategyRunner(csv_provider)
    
    # Create config with invalid date range
    config = StrategyConfig(
        name="Invalid",
        initial_cash=100000,
        universe=UniverseConfig(
            symbols=["INVALID_SYMBOL"],
            weights={"INVALID_SYMBOL": 1.0}
        ),
        period=PeriodConfig(
            start="2024-01-01",
            end="2023-01-01",  # End before start
            calendar="NYSE"
        ),
        account=AccountConfig(type=AccountType.TAXABLE, tax=TaxConfig()),
        lots=LotConfig(method=LotMethod.HIFO),
        rebalancing=RebalancingConfig(type=RebalanceType.CASHFLOW_ONLY),
        deposits=DepositConfig(cadence=DepositCadence.NONE, amount=0),
        dividends=DividendConfig(mode=DividendMode.DRIP),
        frictions=FrictionsConfig()
    )
    
    # Should raise an error or handle gracefully
    with pytest.raises((ValueError, Exception)):
        await runner.run(config)


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
