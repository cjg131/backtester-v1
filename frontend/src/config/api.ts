/**
 * API configuration
 */

// Use environment variable in production, fallback to relative URL for dev
export const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export const API_ENDPOINTS = {
  backtest: `${API_BASE_URL}/backtest/run`,
};
