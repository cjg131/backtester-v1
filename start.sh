#!/bin/bash

# Backtester v1 Startup Script

echo "🚀 Starting Backtester v1..."
echo ""

# Check if backend virtual environment exists
if [ ! -d "backend/venv" ]; then
    echo "📦 Creating Python virtual environment..."
    cd backend
    python3 -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt
    cd ..
    echo "✅ Backend dependencies installed"
    echo ""
fi

fi

# Start backend
echo "Starting backend on port 8000..."
cd backend
source venv/bin/activate
nohup uvicorn main:app --reload --port 8000 > /tmp/backend.log 2>&1 &
BACKEND_PID=$!
cd ..

# Wait a moment for backend to start
sleep 3

# Start frontend
echo "Starting frontend on port 5173..."
cd frontend
nohup npm run dev > /tmp/frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..

# Wait for services to start
sleep 5

echo ""
echo "Backtester is running!"
echo "Open: http://localhost:5173"
echo "API: http://localhost:8000"
echo ""
echo "Try backtesting:"
echo "   • TSLA (2020-2023) with weekly $200 deposits"
echo "   • SPY (2020-2024) with monthly $1000 deposits"
echo "   • Any US stock or ETF!"
echo ""
echo "Logs:"
echo "   • Backend: tail -f /tmp/backend.log"
echo "   • Frontend: tail -f /tmp/frontend.log"
echo ""
echo "To stop: pkill -f uvicorn && pkill -f vite"

# Store PIDs for cleanup
echo $BACKEND_PID > /tmp/backend.pid
echo $FRONTEND_PID > /tmp/frontend.pid

# Wait for Ctrl+C
trap "echo ''; echo 'Stopping services...'; kill $BACKEND_PID $FRONTEND_PID; exit" INT
wait
