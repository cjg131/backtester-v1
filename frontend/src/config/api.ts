/**
 * API configuration
 */

// Use environment variable in production, fallback to relative URL for dev
const BASE_URL = import.meta.env.VITE_API_URL || '';

export const API_ENDPOINTS = {
  backtest: BASE_URL ? `${BASE_URL}/api/backtest/run` : '/api/backtest/run',
  test: BASE_URL ? `${BASE_URL}/api/test` : '/api/test',
};
