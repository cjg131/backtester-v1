"""
Netlify serverless function for the backtester API.
This wraps the FastAPI backend for serverless deployment.
"""

import json
import sys
import os
from pathlib import Path

# Add the backend directory to Python path
backend_dir = Path(__file__).parent.parent.parent / "backend"
sys.path.insert(0, str(backend_dir))

from fastapi import FastAPI
from mangum import Mangum
from main import app

# Create the handler for Netlify
handler = Mangum(app, lifespan="off")

def lambda_handler(event, context):
    """Netlify function handler"""
    return handler(event, context)
