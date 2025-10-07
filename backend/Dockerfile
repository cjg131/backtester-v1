# Use official Python 3.10 slim image
FROM python:3.10-slim

# Set working directory
WORKDIR /app

# Install system dependencies needed for pandas/numpy
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first (for caching)
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir --upgrade pip setuptools wheel && \
    pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Expose port (Render will set this dynamically)
EXPOSE 8000

# Start uvicorn with dynamic PORT from environment
CMD uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}
