import { useState, useEffect } from 'react';
import { Plus, X, Play, BarChart3 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useStrategyStore } from '@/stores/strategyStore';
import type { StrategyConfig, BacktestResult } from '@/types';

interface ComparisonStrategy {
  id: string;
  name: string;
  config: StrategyConfig;
  result?: BacktestResult;
  isRunning: boolean;
  color: string;
}

const CHART_COLORS = [
  '#3B82F6', // Blue
  '#EF4444', // Red  
  '#10B981', // Green
  '#F59E0B', // Yellow
  '#8B5CF6', // Purple
  '#F97316', // Orange
];

export default function Compare() {
  const { strategies } = useStrategyStore();
  const [comparisonStrategies, setComparisonStrategies] = useState<ComparisonStrategy[]>([]);
  const [availableStrategies, setAvailableStrategies] = useState(strategies);

  useEffect(() => {
    setAvailableStrategies(strategies.filter(s => 
      !comparisonStrategies.some(cs => cs.id === s.id)
    ));
  }, [strategies, comparisonStrategies]);

  const addStrategy = (strategyId: string) => {
    const strategy = strategies.find(s => s.id === strategyId);
    if (!strategy) return;

    const newComparison: ComparisonStrategy = {
      id: strategy.id,
      name: strategy.config.meta.name,
      config: strategy.config,
      isRunning: false,
      color: CHART_COLORS[comparisonStrategies.length % CHART_COLORS.length]
    };

    setComparisonStrategies([...comparisonStrategies, newComparison]);
  };

  const removeStrategy = (strategyId: string) => {
    setComparisonStrategies(comparisonStrategies.filter(s => s.id !== strategyId));
  };

  const runComparison = async (strategyId: string) => {
    const strategy = comparisonStrategies.find(s => s.id === strategyId);
    if (!strategy) return;

    // Update running state
    setComparisonStrategies(prev => 
      prev.map(s => s.id === strategyId ? { ...s, isRunning: true } : s)
    );

    try {
      const response = await fetch('/api/backtest/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(strategy.config)
      });

      if (!response.ok) throw new Error('Backtest failed');
      
      const result: BacktestResult = await response.json();
      
      // Update with results
      setComparisonStrategies(prev => 
        prev.map(s => s.id === strategyId ? { ...s, result, isRunning: false } : s)
      );
    } catch (error) {
      console.error('Backtest error:', error);
      setComparisonStrategies(prev => 
        prev.map(s => s.id === strategyId ? { ...s, isRunning: false } : s)
      );
    }
  };

  const runAllComparisons = async () => {
    for (const strategy of comparisonStrategies) {
      if (!strategy.result && !strategy.isRunning) {
        await runComparison(strategy.id);
      }
    }
  };

  // Prepare chart data
  const chartData = comparisonStrategies
    .filter(s => s.result)
    .reduce((acc, strategy) => {
      strategy.result!.equity_curve.forEach((point, index) => {
        if (!acc[index]) {
          acc[index] = { date: new Date(point.date).toLocaleDateString() };
        }
        acc[index][strategy.name] = point.portfolio_value;
      });
      return acc;
    }, [] as any[]);

  // Calculate performance metrics comparison
  const performanceComparison = comparisonStrategies
    .filter(s => s.result)
    .map(s => ({
      name: s.name,
      color: s.color,
      finalValue: s.result!.equity_curve[s.result!.equity_curve.length - 1]?.portfolio_value || 0,
      totalReturn: s.result!.metrics.twr,
      cagr: s.result!.metrics.cagr,
      sharpe: s.result!.metrics.sharpe,
      maxDrawdown: s.result!.metrics.max_drawdown,
      volatility: s.result!.metrics.annual_vol
    }));

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
            Strategy Comparison
          </h1>
          <p className="text-gray-600 dark:text-gray-400 max-w-2xl text-lg">
            Compare multiple strategies side-by-side to see which performs best under different conditions.
          </p>
        </div>

        {/* Add Strategy Section */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 mb-6 border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Select Strategies to Compare</h2>
            {comparisonStrategies.length > 1 && (
              <button
                onClick={runAllComparisons}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-blue-500/50 transition-all flex items-center space-x-2"
                disabled={comparisonStrategies.some(s => s.isRunning)}
              >
                <Play className="h-4 w-4" />
                <span>Run All Comparisons</span>
              </button>
            )}
          </div>

          {availableStrategies.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {availableStrategies.map((strategy) => (
                <div key={strategy.id} className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-5 hover:shadow-md transition-all border border-gray-200 dark:border-gray-600">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{strategy.config.meta.name}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    {strategy.config.universe.symbols.join(', ')}
                  </p>
                  <button
                    onClick={() => addStrategy(strategy.id)}
                    className="w-full px-4 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg font-medium hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-all flex items-center justify-center space-x-2"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Add to Comparison</span>
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-600 dark:text-gray-400 text-center py-8">
              {comparisonStrategies.length > 0 
                ? "All available strategies are already in the comparison"
                : "No saved strategies available. Create some strategies first."
              }
            </p>
          )}
        </div>

        {/* Comparison Strategies */}
        {comparisonStrategies.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 mb-6 border border-gray-100 dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Strategies in Comparison</h2>
            <div className="space-y-4">
              {comparisonStrategies.map((strategy) => (
                <div key={strategy.id} className="flex items-center justify-between p-5 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-600">
                  <div className="flex items-center space-x-4">
                    <div 
                      className="w-5 h-5 rounded-full shadow-md"
                      style={{ backgroundColor: strategy.color }}
                    />
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">{strategy.name}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {strategy.config.universe.symbols.join(', ')} • {strategy.config.account.type}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    {strategy.result ? (
                      <span className="text-sm font-semibold text-green-600 dark:text-green-400 px-3 py-1 bg-green-100 dark:bg-green-900/20 rounded-lg">✓ Complete</span>
                    ) : strategy.isRunning ? (
                      <span className="text-sm font-semibold text-blue-600 dark:text-blue-400 px-3 py-1 bg-blue-100 dark:bg-blue-900/20 rounded-lg">Running...</span>
                    ) : (
                      <button
                        onClick={() => runComparison(strategy.id)}
                        className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg font-semibold hover:shadow-lg hover:shadow-blue-500/50 transition-all flex items-center space-x-2"
                      >
                        <Play className="h-4 w-4" />
                        <span>Run</span>
                      </button>
                    )}
                    <button
                      onClick={() => removeStrategy(strategy.id)}
                      className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Results */}
        {performanceComparison.length > 0 && (
          <>
            {/* Performance Metrics Table */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 mb-6 border border-gray-100 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Performance Comparison</h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b-2 border-gray-200 dark:border-gray-700">
                      <th className="text-left pb-4 font-bold text-gray-700 dark:text-gray-300">Strategy</th>
                      <th className="text-right pb-4 font-bold text-gray-700 dark:text-gray-300">Final Value</th>
                      <th className="text-right pb-4 font-bold text-gray-700 dark:text-gray-300">Total Return</th>
                      <th className="text-right pb-4 font-bold text-gray-700 dark:text-gray-300">CAGR</th>
                      <th className="text-right pb-4 font-bold text-gray-700 dark:text-gray-300">Sharpe Ratio</th>
                      <th className="text-right pb-4 font-bold text-gray-700 dark:text-gray-300">Max Drawdown</th>
                      <th className="text-right pb-4 font-bold text-gray-700 dark:text-gray-300">Volatility</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {performanceComparison
                      .sort((a, b) => b.totalReturn - a.totalReturn)
                      .map((perf, index) => (
                      <tr key={perf.name} className={index === 0 ? 'bg-green-50 dark:bg-green-900/20' : 'hover:bg-gray-50 dark:hover:bg-gray-700/30'}>
                        <td className="py-4 flex items-center space-x-3">
                          <div 
                            className="w-4 h-4 rounded-full shadow-md"
                            style={{ backgroundColor: perf.color }}
                          />
                          <span className="font-semibold text-gray-900 dark:text-white">{perf.name}</span>
                          {index === 0 && <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 px-3 py-1 rounded-full font-bold">🏆 Best</span>}
                        </td>
                        <td className="text-right py-4 font-bold text-gray-900 dark:text-white">
                          ${perf.finalValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </td>
                        <td className="text-right py-4">
                          <span className={`font-semibold ${perf.totalReturn >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                            {perf.totalReturn >= 0 ? '+' : ''}{(perf.totalReturn * 100).toFixed(1)}%
                          </span>
                        </td>
                        <td className="text-right py-4">
                          <span className={`font-semibold ${perf.cagr >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                            {perf.cagr >= 0 ? '+' : ''}{(perf.cagr * 100).toFixed(1)}%
                          </span>
                        </td>
                        <td className="text-right py-4 font-medium text-gray-900 dark:text-white">
                          {perf.sharpe.toFixed(2)}
                        </td>
                        <td className="text-right py-4 font-semibold text-red-600 dark:text-red-400">
                          -{(Math.abs(perf.maxDrawdown) * 100).toFixed(1)}%
                        </td>
                        <td className="text-right py-4 font-medium text-gray-900 dark:text-white">
                          {(perf.volatility * 100).toFixed(1)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Equity Curve Chart */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-100 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Equity Curve Comparison</h2>
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12 }}
                    interval="preserveStartEnd"
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                  />
                  <Tooltip 
                    formatter={(value: number) => [`$${value.toLocaleString()}`, '']}
                    labelFormatter={(label) => `Date: ${label}`}
                  />
                  <Legend />
                  {comparisonStrategies
                    .filter(s => s.result)
                    .map((strategy) => (
                    <Line
                      key={strategy.id}
                      type="monotone"
                      dataKey={strategy.name}
                      stroke={strategy.color}
                      strokeWidth={2}
                      dot={false}
                    />
                  ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
