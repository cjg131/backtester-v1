"""
FastAPI backend for Backtester v1.
Provides endpoints for running backtests and managing strategies.
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from typing import Dict, Any
import json
import math
from pydantic import BaseModel
from typing import Dict, Any
import os
from dotenv import load_dotenv

from engine.models import StrategyConfig, BacktestResult
from engine.runner import StrategyRunner
from providers.twelvedata_provider import TwelveDataProvider
from providers.yfinance_provider import YFinanceProvider

# Load environment variables from .env file (for local development)
load_dotenv()

# Get Twelve Data API key from environment
# Railway sets this directly, .env is only for local dev
# Try multiple ways to get the API key
TWELVEDATA_API_KEY = os.getenv('TWELVEDATA_API_KEY') or os.environ.get('TWELVEDATA_API_KEY', '') or '35bfb2983b7445e189ef9f60ea14c5e8'

# Debug: Print all environment variables that contain 'TWELVE' or 'API'
print("=== Environment Variable Debug ===")
for key in os.environ:
    if 'TWELVE' in key.upper() or 'API' in key.upper():
        print(f"Found env var: {key} = {os.environ[key][:20]}..." if len(os.environ[key]) > 20 else f"Found env var: {key} = {os.environ[key]}")
print(f"TWELVEDATA_API_KEY present: {bool(TWELVEDATA_API_KEY)}")
if TWELVEDATA_API_KEY:
    print(f"API key starts with: {TWELVEDATA_API_KEY[:8]}...")
print("===================================")

app = FastAPI(
    title="Backtester v1 API",
    description="Production-ready backtesting engine with tax-aware portfolio management",
    version="1.0.1"
)

# CORS middleware - Allow all origins (bulletproof for development)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,  # Must be False with wildcard
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize data provider - prefer TwelveData if API key available, fallback to YFinance
if TWELVEDATA_API_KEY:
    print(f"Initializing TwelveData provider with API key: {TWELVEDATA_API_KEY[:8]}...")
    twelvedata_provider = TwelveDataProvider(api_key=TWELVEDATA_API_KEY)
    current_provider = twelvedata_provider
else:
    print("No TwelveData API key found, using YFinance provider (free)...")
    yfinance_provider = YFinanceProvider()
    current_provider = yfinance_provider


def clean_json_data(obj):
    """Recursively clean data to handle NaN/inf values for JSON serialization"""
    from datetime import date, datetime
    
    if isinstance(obj, dict):
        return {k: clean_json_data(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [clean_json_data(item) for item in obj]
    elif isinstance(obj, float):
        if math.isnan(obj) or math.isinf(obj):
            return None
        return obj
    elif isinstance(obj, (date, datetime)):
        return obj.isoformat()
    else:
        return obj


@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "status": "ok",
        "service": "Backtester v1",
        "version": "1.0.0"
    }


@app.get("/health")
async def health_check():
    """Simple health check"""
    return {
        "status": "healthy",
        "service": "Backtester v1"
    }


@app.get("/api/health")
async def health():
    """Detailed health check"""
    return {
        "status": "healthy",
        "providers": {
            "twelvedata": "available" if TWELVEDATA_API_KEY else "missing_api_key"
        }
    }

@app.get("/test")
async def test_cors():
    """Simple CORS test endpoint"""
    return {"message": "CORS is working!", "timestamp": "2025-10-06T23:15:00Z"}

@app.post("/api/test")
async def test_post():
    """Test POST endpoint"""
    return {"message": "POST is working!", "timestamp": "2025-10-19T09:50:00Z"}


@app.post("/backtest/run")
@app.post("/api/backtest/run")
async def run_backtest(config: StrategyConfig):
    """Run a backtest with the given configuration"""
    try:
        print(f"=== BACKTEST STARTED ===")
        print(f"Symbols: {config.universe.symbols}")
        print(f"Period: {config.period.start} to {config.period.end}")
        print(f"Initial Cash: ${config.initial_cash:,.2f}")
        
        # Use current data provider (TwelveData or YFinance)
        runner = StrategyRunner(current_provider)
        print(f"Running backtest with {current_provider.__class__.__name__}...")
        result = await runner.run(config)
        print(f"=== BACKTEST COMPLETED ===")
        if result.equity_curve:
            final_value = result.equity_curve[-1].get('portfolio_value', 0)
            print(f"Final Value: ${final_value:,.2f}")
        
        # Convert result to dict and handle NaN/inf values
        result_dict = result.dict()
        result_dict = clean_json_data(result_dict)
        
        return JSONResponse(content=result_dict)
    except Exception as e:
        import traceback
        print(f"BACKTEST ERROR: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/backtest/validate")
async def validate_config(config: StrategyConfig) -> Dict[str, Any]:
    """
    Validate a strategy configuration without running it.
    
    Args:
        config: Strategy configuration to validate
        
    Returns:
        Validation result with any warnings or errors
    """
    warnings = []
    errors = []
    
    # Basic validation
    if config.initial_cash <= 0:
        errors.append("Initial cash must be positive")
    
    if not config.universe.symbols:
        errors.append("Universe must contain at least one symbol")
    
    if config.period.start >= config.period.end:
        errors.append("Start date must be before end date")
    
    # Check for contribution cap issues
    if config.deposits and config.account.contribution_caps.enforce:
        if config.account.type.value in ["Traditional IRA", "Roth IRA"]:
            annual_deposits = 0
            
            # Estimate annual deposits
            if config.deposits.cadence == "monthly":
                annual_deposits = config.deposits.amount * 12
            elif config.deposits.cadence == "quarterly":
                annual_deposits = config.deposits.amount * 4
            elif config.deposits.cadence == "yearly":
                annual_deposits = config.deposits.amount
            
            cap = config.account.contribution_caps.ira
            if annual_deposits > cap:
                warnings.append(
                    f"Annual deposits (${annual_deposits:,.0f}) exceed IRA cap (${cap:,.0f})"
                )
    
    return {
        "valid": len(errors) == 0,
        "errors": errors,
        "warnings": warnings
    }


@app.get("/api/providers/symbols")
async def get_available_symbols(provider: str = "csv") -> Dict[str, Any]:
    """
    Get available symbols from a data provider.
    
    Args:
        provider: Provider name (csv, yfinance)
        
    Returns:
        List of available symbols
    """
    try:
        if provider == "csv":
            symbols = await csv_provider.get_symbols("CUSTOM")
        elif provider == "yfinance":
            symbols = []  # YFinance doesn't provide universe
        else:
            raise HTTPException(status_code=400, detail="Unknown provider")
        
        return {
            "provider": provider,
            "symbols": symbols,
            "count": len(symbols)
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/data/check")
async def check_data_availability(
    symbols: str,
    start: str,
    end: str,
    provider: str = "csv"
) -> Dict[str, Any]:
    """
    Check data availability for symbols.
    
    Args:
        symbols: Comma-separated list of symbols
        start: Start date (YYYY-MM-DD)
        end: End date (YYYY-MM-DD)
        provider: Provider name
        
    Returns:
        Data availability status for each symbol
    """
    symbol_list = [s.strip() for s in symbols.split(",")]
    
    selected_provider = csv_provider if provider == "csv" else yfinance_provider
    
    results = {}
    
    for symbol in symbol_list:
        try:
            bars = await selected_provider.get_bars(symbol, start, end)
            dividends = await selected_provider.get_dividends(symbol, start, end)
            
            results[symbol] = {
                "available": len(bars) > 0,
                "bars_count": len(bars),
                "dividends_count": len(dividends),
                "start_date": bars[0].date if bars else None,
                "end_date": bars[-1].date if bars else None
            }
        
        except Exception as e:
            results[symbol] = {
                "available": False,
                "error": str(e)
            }
    
    return results


@app.get("/api/examples")
async def get_example_configs() -> Dict[str, Any]:
    """Get example strategy configurations"""
    
    examples = {
        "spy_buy_hold": {
            "meta": {
                "name": "SPY Buy & Hold",
                "notes": "Simple buy-and-hold strategy with SPY"
            },
            "universe": {
                "type": "CUSTOM",
                "symbols": ["SPY"]
            },
            "period": {
                "start": "2010-01-01",
                "end": "2024-12-31",
                "calendar": "NYSE"
            },
            "initial_cash": 100000,
            "account": {
                "type": "Taxable",
                "tax": {
                    "federal_ordinary": 0.32,
                    "federal_ltcg": 0.15,
                    "state": 0.06,
                    "qualified_dividend_pct": 0.8,
                    "apply_wash_sale": True,
                    "pay_taxes_from_external": False
                }
            },
            "dividends": {
                "mode": "DRIP"
            },
            "rebalancing": {
                "type": "cashflow_only"
            },
            "position_sizing": {
                "method": "EQUAL_WEIGHT"
            },
            "benchmark": ["SPY"]
        },
        
        "60_40_portfolio": {
            "meta": {
                "name": "60/40 Portfolio",
                "notes": "60% SPY, 40% AGG with quarterly rebalancing"
            },
            "universe": {
                "type": "CUSTOM",
                "symbols": ["SPY", "AGG"]
            },
            "period": {
                "start": "2010-01-01",
                "end": "2024-12-31",
                "calendar": "NYSE"
            },
            "initial_cash": 100000,
            "account": {
                "type": "Roth IRA"
            },
            "deposits": {
                "cadence": "monthly",
                "amount": 500,
                "day_rule": "FIRST_BUSINESS_DAY"
            },
            "dividends": {
                "mode": "DRIP"
            },
            "rebalancing": {
                "type": "calendar",
                "calendar": {
                    "period": "Q"
                }
            },
            "position_sizing": {
                "method": "EQUAL_WEIGHT"
            },
            "benchmark": ["SPY"]
        }
    }
    
    return examples


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
