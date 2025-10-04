#!/bin/bash

echo "🚀 Setting up Backtester v1..."

# Check if Python 3.9+ is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is required. Please install Python 3.9+ first."
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is required. Please install Node.js 18+ first."
    exit 1
fi

echo "✅ Prerequisites found"

# Backend setup
echo "📦 Setting up backend..."
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
echo "✅ Backend dependencies installed"

# Frontend setup
echo "📦 Setting up frontend..."
cd ../frontend
npm install
echo "✅ Frontend dependencies installed"

echo ""
echo "🎉 Setup complete!"
echo ""
echo "To start the application:"
echo "1. Backend: cd backend && source venv/bin/activate && uvicorn main:app --reload --port 8000"
echo "2. Frontend: cd frontend && npm run dev"
echo "3. Open: http://localhost:5173"
echo ""
echo "📊 Try backtesting TSLA, SPY, or any US stock/ETF!"
