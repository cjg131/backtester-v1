#!/bin/bash
# Startup script for Railway deployment

# Use PORT environment variable if set, otherwise default to 8000
PORT=${PORT:-8000}

# Start uvicorn
exec uvicorn main:app --host 0.0.0.0 --port $PORT
