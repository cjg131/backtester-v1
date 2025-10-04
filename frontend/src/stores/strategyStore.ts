/**
 * Zustand store for strategy management and backtest results
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { StrategyConfig, BacktestResult, SavedStrategy } from '@/types';

interface StrategyStore {
  // Saved strategies
  strategies: SavedStrategy[];
  currentStrategy: StrategyConfig | null;
  
  // Backtest results
  currentResult: BacktestResult | null;
  isRunning: boolean;
  
  // UI state
  theme: 'light' | 'dark';
  
  // Actions
  saveStrategy: (config: StrategyConfig) => void;
  loadStrategy: (id: string) => void;
  deleteStrategy: (id: string) => void;
  updateStrategy: (id: string, config: StrategyConfig) => void;
  setCurrentStrategy: (config: StrategyConfig | null) => void;
  
  runBacktest: (config: StrategyConfig) => Promise<void>;
  setResult: (result: BacktestResult | null) => void;
  
  toggleTheme: () => void;
  clearAll: () => void;
}

export const useStrategyStore = create<StrategyStore>()(
  persist(
    (set, get) => ({
      // Initial state
      strategies: [],
      currentStrategy: null,
      currentResult: null,
      isRunning: false,
      theme: 'dark',
      
      // Save a new strategy
      saveStrategy: (config) => {
        const newStrategy: SavedStrategy = {
          id: crypto.randomUUID(),
          config,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        
        set((state) => ({
          strategies: [...state.strategies, newStrategy],
          currentStrategy: config,
        }));
      },
      
      // Load a strategy
      loadStrategy: (id) => {
        const strategy = get().strategies.find((s) => s.id === id);
        if (strategy) {
          set({ currentStrategy: strategy.config });
        }
      },
      
      // Delete a strategy
      deleteStrategy: (id) => {
        set((state) => ({
          strategies: state.strategies.filter((s) => s.id !== id),
        }));
      },
      
      // Update an existing strategy
      updateStrategy: (id, config) => {
        set((state) => ({
          strategies: state.strategies.map((s) =>
            s.id === id
              ? { ...s, config, updated_at: new Date().toISOString() }
              : s
          ),
        }));
      },
      
      // Set current strategy
      setCurrentStrategy: (config) => {
        set({ currentStrategy: config });
      },
      
      // Run backtest
      runBacktest: async (config) => {
        set({ isRunning: true, currentResult: null });
        
        try {
          const response = await fetch('/api/backtest/run', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(config),
          });
          
          if (!response.ok) {
            throw new Error(`Backtest failed: ${response.statusText}`);
          }
          
          const result: BacktestResult = await response.json();
          
          set({ currentResult: result, isRunning: false });
          
          // Update last run time
          const strategyId = get().strategies.find(
            (s) => s.config.meta.name === config.meta.name
          )?.id;
          
          if (strategyId) {
            set((state) => ({
              strategies: state.strategies.map((s) =>
                s.id === strategyId
                  ? { ...s, last_run: new Date().toISOString() }
                  : s
              ),
            }));
          }
        } catch (error) {
          console.error('Backtest error:', error);
          set({ isRunning: false });
          throw error;
        }
      },
      
      // Set result directly
      setResult: (result) => {
        set({ currentResult: result });
      },
      
      // Toggle theme
      toggleTheme: () => {
        set((state) => ({
          theme: state.theme === 'light' ? 'dark' : 'light',
        }));
      },
      
      // Clear all data
      clearAll: () => {
        set({
          strategies: [],
          currentStrategy: null,
          currentResult: null,
        });
      },
    }),
    {
      name: 'backtester-storage',
      partialize: (state) => ({
        strategies: state.strategies,
        theme: state.theme,
      }),
    }
  )
);
