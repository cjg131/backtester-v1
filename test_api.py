#!/usr/bin/env python3
"""
Quick test script to verify the backend API is working
"""

import requests
import json

# Test the health endpoint
print("Testing backend health...")
try:
    response = requests.get("https://strategylab-backend-production.up.railway.app/api/health")
    print(f"Health Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
except Exception as e:
    print(f"Health check failed: {e}")

print("\n" + "="*50 + "\n")

# Test a simple backtest
print("Testing simple backtest...")
backtest_config = {
    "universe": {
        "symbols": ["SPY"]
    },
    "period": {
        "start": "2023-01-01",
        "end": "2024-01-01",
        "calendar": "NYSE"
    },
    "initial_cash": 10000,
    "position_sizing": {
        "method": "EQUAL_WEIGHT"
    },
    "rebalancing": {
        "frequency": "MONTHLY",
        "day_of_month": 1
    },
    "frictions": {
        "commission_per_trade": 0.0,
        "commission_pct": 0.0,
        "bid_ask_spread": 0.0,
        "use_actual_etf_er": False
    },
    "account": {
        "type": "TAXABLE",
        "contribution_caps": {
            "enforce": False,
            "ira": 6500,
            "roth": 6500
        }
    },
    "benchmark": ["SPY"]
}

try:
    response = requests.post(
        "https://strategylab-backend-production.up.railway.app/api/backtest/run",
        json=backtest_config,
        timeout=60
    )
    print(f"Backtest Status: {response.status_code}")
    if response.status_code == 200:
        result = response.json()
        print("✅ Backtest successful!")
        print(f"Final portfolio value: ${result.get('final_portfolio_value', 'N/A'):,.2f}")
        print(f"Total return: {result.get('total_return', 'N/A'):.2%}")
    else:
        print(f"❌ Backtest failed: {response.text}")
except Exception as e:
    print(f"❌ Backtest request failed: {e}")
