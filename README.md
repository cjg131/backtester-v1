# Backtester v1

Production-ready web application for backtesting rules-based trading strategies with comprehensive tax-aware portfolio management.

## Features

- **Multi-Asset Support**: US stocks, ETFs, and bond ETFs
- **Account Types**: Taxable, Traditional IRA, Roth IRA with full tax modeling
- **Advanced Rebalancing**: Calendar-based, drift-based, or hybrid
- **Tax-Aware Trading**: HIFO/FIFO/LIFO lot selection, wash-sale rules, ST/LT gains tracking
- **Dividend Handling**: DRIP or cash with configurable reinvestment
- **Deposits/Cashflows**: Flexible scheduling with IRA contribution cap enforcement
- **Comprehensive Analytics**: TWR, IRR, Sharpe, Sortino, Calmar, drawdowns, tax reports
- **Multiple Data Providers**: CSV, yfinance, with extensible interface

## Quick Start

### Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt

# Optional: Configure data providers in .env
cp .env.example .env
# Edit .env with your API keys (optional, CSV provider works without keys)

# Run backend
uvicorn main:app --reload --port 8000
```

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Visit http://localhost:5173

## Configuration

### Environment Variables (.env)

```env
# Optional - only needed for external data providers
TIINGO_API_KEY=your_key_here
ALPHA_VANTAGE_API_KEY=your_key_here
POLYGON_API_KEY=your_key_here

# IRS Contribution Limits (update annually)
IRA_CONTRIBUTION_LIMIT=7000
IRA_CATCHUP_LIMIT=1000
ROTH_CONTRIBUTION_LIMIT=7000
ROTH_CATCHUP_LIMIT=1000
```

### IRS Contribution Caps

Update these constants in `backend/engine/constants.py` annually:

```python
IRA_CONTRIBUTION_LIMIT = 7000  # 2024 limit
IRA_CATCHUP_LIMIT = 1000       # Age 50+
ROTH_CONTRIBUTION_LIMIT = 7000
ROTH_CATCHUP_LIMIT = 1000
```

## Architecture

### Backend (Python/FastAPI)

- `engine/` - Core backtesting engine
  - `portfolio.py` - Portfolio management with per-lot accounting
  - `tax.py` - Tax calculation and wash-sale tracking
  - `rebalancer.py` - Tax-aware rebalancing logic
  - `signals.py` - Technical indicators and signal generation
  - `calendar.py` - NYSE market calendar
  - `metrics.py` - Performance analytics
- `providers/` - Data provider implementations
  - `base.py` - DataProvider interface
  - `csv_provider.py` - Local CSV data
  - `yfinance_provider.py` - Yahoo Finance integration
- `api/` - FastAPI endpoints

### Frontend (React/TypeScript)

- `src/stores/` - Zustand state management
- `src/pages/` - Main application pages
  - `Home.tsx` - Strategy list
  - `Builder.tsx` - Strategy configuration wizard
  - `Results.tsx` - Backtest results with tabs
- `src/components/` - Reusable UI components
- `src/types/` - TypeScript interfaces

## Adding New Data Providers

Implement the `DataProvider` interface in `backend/providers/base.py`:

```python
class MyProvider(DataProvider):
    async def get_bars(self, symbol: str, start: str, end: str, freq: str) -> List[Bar]:
        # Your implementation
        pass
    
    async def get_dividends(self, symbol: str, start: str, end: str) -> List[Dividend]:
        # Your implementation
        pass
    
    # ... implement other methods
```

Register in `backend/providers/__init__.py`.

## Testing

### Backend Tests

```bash
cd backend
pytest tests/ -v
pytest tests/ --cov=engine --cov-report=html
```

### Frontend Tests

```bash
cd frontend
npm run test
npm run test:e2e  # Playwright smoke tests
```

## Example Strategies

See `examples/` directory for sample configurations:

- `spy_buy_hold.json` - Simple buy-and-hold
- `60_40_rebalance.json` - 60/40 portfolio with quarterly rebalancing
- `momentum_top1.json` - Momentum strategy with monthly rotation

## Default Settings (Auto-Accept Mode)

- Order timing: Market-on-Open
- Lot method: HIFO (tax-optimized)
- Slippage: 5 bps per trade
- Commissions: $0
- Dividends: DRIP enabled
- Wash sale: Enabled for Taxable accounts
- Benchmark: SPY

## License

MIT
