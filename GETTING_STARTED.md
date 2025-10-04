# Getting Started with Backtester v1

## Quick Start (5 minutes)

### 1. Install Dependencies

```bash
cd /Users/cj/CascadeProjects/backtester-v1

# Backend
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cd ..

# Frontend
cd frontend
npm install
cd ..
```

### 2. Generate Demo Data (Optional)

```bash
cd backend
source venv/bin/activate
python scripts/generate_demo_data.py
cd ..
```

This downloads historical data for SPY, AGG, QQQ, TLT, VTI, and BND from Yahoo Finance.

### 3. Start the Application

**Option A: Use the startup script (recommended)**

```bash
chmod +x start.sh
./start.sh
```

**Option B: Start services manually**

Terminal 1 (Backend):
```bash
cd backend
source venv/bin/activate
uvicorn main:app --reload --port 8000
```

Terminal 2 (Frontend):
```bash
cd frontend
npm run dev
```

### 4. Access the Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs

## Your First Backtest

### Using the Web Interface

1. Open http://localhost:5173
2. Click **"New Strategy"**
3. Fill in the form:
   - **Name**: "My First Strategy"
   - **Symbols**: SPY
   - **Start Date**: 2010-01-01
   - **End Date**: 2024-12-31
   - **Initial Cash**: 100000
   - **Account Type**: Taxable
4. Click **"Run Backtest"**
5. View results with equity curve, metrics, trades, and tax summary

### Using Example Strategies

Load pre-configured examples from the `examples/` directory:

1. **SPY Buy & Hold** (`spy_buy_hold.json`)
   - Simple buy-and-hold with DRIP
   - Taxable account
   - No rebalancing

2. **60/40 Portfolio** (`60_40_rebalance.json`)
   - 60% SPY, 40% AGG
   - Quarterly rebalancing
   - Roth IRA with monthly deposits

3. **Drift Rebalancing** (`drift_rebalance.json`)
   - Three-asset portfolio
   - 5% drift threshold
   - Tax-aware trading

### Using the API Directly

```bash
# Run a backtest
curl -X POST http://localhost:8000/api/backtest/run \
  -H "Content-Type: application/json" \
  -d @examples/spy_buy_hold.json

# Validate a configuration
curl -X POST http://localhost:8000/api/backtest/validate \
  -H "Content-Type: application/json" \
  -d @examples/60_40_rebalance.json

# Check data availability
curl "http://localhost:8000/api/data/check?symbols=SPY,AGG&start=2010-01-01&end=2024-12-31&provider=csv"
```

## Understanding the Results

### Performance Metrics

- **TWR (Time-Weighted Return)**: Total return independent of cashflows
- **IRR (Internal Rate of Return)**: Return accounting for deposit timing
- **CAGR**: Compound Annual Growth Rate
- **Sharpe Ratio**: Risk-adjusted return (higher is better)
- **Sortino Ratio**: Like Sharpe but only penalizes downside volatility
- **Calmar Ratio**: CAGR / Max Drawdown
- **Max Drawdown**: Largest peak-to-trough decline

### Tax Summary (Taxable Accounts Only)

- **Short-Term Gains**: Gains on positions held ≤ 365 days
- **Long-Term Gains**: Gains on positions held > 365 days
- **Qualified Dividends**: Taxed at LTCG rate
- **Ordinary Dividends**: Taxed at ordinary income rate
- **Wash Sales**: Losses disallowed due to repurchase within 30 days

### Trade History

- All trades with lot IDs for tax tracking
- HIFO/FIFO/LIFO lot selection
- Commission and slippage costs
- DRIP transactions

## Configuration Guide

### Account Types

**Taxable**
- Full tax modeling with ST/LT gains
- Wash-sale rule enforcement
- Year-end tax accrual
- Tax-aware rebalancing (prefer losses, defer gains)

**Traditional IRA**
- Tax-deferred growth
- Contribution caps enforced
- No wash-sale rules
- Taxes applied only in after-tax comparison view

**Roth IRA**
- Tax-free growth
- Contribution caps enforced
- No taxes on withdrawals

### Rebalancing Modes

**Calendar**: Rebalance on fixed schedule (M/Q/A)
**Drift**: Rebalance when positions drift > threshold
**Both**: Trigger on calendar OR drift
**Cashflow Only**: Rebalance only when deposits occur

### Lot Selection Methods

**HIFO (Highest In, First Out)**: Tax-optimized - sells highest cost basis first
**FIFO (First In, First Out)**: Sells oldest lots first
**LIFO (Last In, First Out)**: Sells newest lots first

## Testing

### Backend Tests

```bash
cd backend
source venv/bin/activate
pytest tests/ -v
pytest tests/ --cov=engine --cov-report=html
```

### Frontend Tests

```bash
cd frontend
npm run test
npm run test:e2e  # Playwright end-to-end tests
```

## Troubleshooting

### Backend won't start

- Check Python version: `python3 --version` (requires 3.9+)
- Verify dependencies: `pip install -r requirements.txt`
- Check port 8000 is available: `lsof -i :8000`

### Frontend won't start

- Check Node version: `node --version` (requires 16+)
- Clear cache: `rm -rf node_modules package-lock.json && npm install`
- Check port 5173 is available: `lsof -i :5173`

### No data available

- Run demo data generator: `python scripts/generate_demo_data.py`
- Check `backend/data/bars/` directory has CSV files
- Verify symbols in `backend/data/metadata.csv`

### Backtest fails

- Validate configuration: POST to `/api/backtest/validate`
- Check date ranges match available data
- Verify initial cash > 0
- Check symbols exist in data provider

## Next Steps

1. **Customize Tax Rates**: Edit account.tax settings for your situation
2. **Add Deposits**: Configure monthly/quarterly contributions
3. **Try Different Rebalancing**: Compare calendar vs drift vs both
4. **Compare Account Types**: Run same strategy in Taxable vs Roth
5. **Add More Symbols**: Expand universe to multi-asset portfolios
6. **Export Results**: Download CSV/JSON for further analysis

## Advanced Features

### Custom Data Providers

Implement the `DataProvider` interface in `backend/providers/`:

```python
from providers.base import DataProvider

class MyProvider(DataProvider):
    async def get_bars(self, symbol, start, end, freq):
        # Your implementation
        pass
```

### Adding Technical Signals

Add new signal types in `backend/engine/signals.py`:

```python
def calculate_my_indicator(self, prices, period):
    # Your indicator logic
    return indicator_values
```

### Custom Position Sizing

Extend `PositionSizingConfig` to support new methods like volatility targeting or risk parity.

## Support & Documentation

- **API Docs**: http://localhost:8000/docs (when running)
- **README**: See main README.md for architecture details
- **Examples**: Check `examples/` directory for sample configs
- **Tests**: Review `backend/tests/` for usage examples

## Performance Tips

- Use CSV provider for faster backtests (pre-downloaded data)
- Limit date ranges for initial testing
- Enable caching in data providers
- Use fewer symbols for faster iteration
- Run tests in parallel: `pytest -n auto`

Happy backtesting! 🚀
