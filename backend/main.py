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

# Load environment variables
load_dotenv()

# Get Twelve Data API key from environment
TWELVEDATA_API_KEY = os.getenv('TWELVEDATA_API_KEY', '')

app = FastAPI(
    title="Backtester v1 API",
    description="Production-ready backtesting engine with tax-aware portfolio management",
    version="1.0.0"
)

# CORS middleware - Allow all origins for now (can restrict later)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins
    allow_credentials=False,  # Must be False when allow_origins is "*"
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize data provider
if not TWELVEDATA_API_KEY:
    raise ValueError("TWELVEDATA_API_KEY environment variable is required")

twelvedata_provider = TwelveDataProvider(api_key=TWELVEDATA_API_KEY)
current_provider = twelvedata_provider


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


@app.post("/backtest/run")
@app.post("/api/backtest/run")
async def run_backtest(config: StrategyConfig):
    """Run a backtest with the given configuration"""
    try:
        # Use Twelve Data provider to download data on-demand
        runner = StrategyRunner(twelvedata_provider)
        result = await runner.run(config)
        
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
