/**
 * API configuration
 */

// Use environment variable in production, fallback to relative URL for dev
export const API_BASE_URL = import.meta.env.VITE_API_URL || '';

export const API_ENDPOINTS = {
  backtest: API_BASE_URL ? `${API_BASE_URL}/api/backtest/run` : '/api/backtest/run',
  test: API_BASE_URL ? `${API_BASE_URL}/api/test` : '/api/test',
};
