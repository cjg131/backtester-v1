#!/bin/bash
# Startup script for Railway deployment

# Use PORT environment variable if set, otherwise default to 8000
PORT=${PORT:-8000}

# Debug: Print all environment variables
echo "=== All Environment Variables ==="
env | sort
echo "=================================="

# Explicitly export TWELVEDATA_API_KEY if it exists
if [ ! -z "$TWELVEDATA_API_KEY" ]; then
    echo "TWELVEDATA_API_KEY is set in environment"
    export TWELVEDATA_API_KEY
else
    echo "WARNING: TWELVEDATA_API_KEY is not set"
fi

# Start uvicorn
exec uvicorn main:app --host 0.0.0.0 --port $PORT
