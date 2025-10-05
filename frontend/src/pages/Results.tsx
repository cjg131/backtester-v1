import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  TrendingUp, 
  TrendingDown, 
  Percent,
  Download,
  AlertCircle
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { useStrategyStore } from '@/stores/strategyStore';

export default function Results() {
  const navigate = useNavigate();
  const { currentResult, currentStrategy, isRunning } = useStrategyStore();
  const [activeTab, setActiveTab] = useState<'overview' | 'equity' | 'trades' | 'tax'>('overview');
  
  useEffect(() => {
    if (!currentResult && !isRunning) {
      console.log('No results available, redirecting to home');
      navigate('/');
    }
  }, [currentResult, isRunning, navigate]);
  
  if (isRunning) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mb-6"></div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Running backtest...</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-2 text-lg">
            This may take a few moments
          </p>
        </div>
      </div>
    );
  }
  
  if (!currentResult) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-20 w-20 mx-auto mb-6 text-gray-400" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">No results available</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-8 text-lg">
            Run a backtest to see results
          </p>
          <button
            onClick={() => navigate('/builder')}
            className="px-8 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-blue-500/50 transition-all"
          >
            Build Strategy
          </button>
        </div>
      </div>
    );
  }
  
  const { metrics, equity_curve, trades, tax_summaries, warnings, benchmark_metrics, benchmark_equity } = currentResult;
  
  // Create benchmark lookup map for efficient merging
  const benchmarkMap = new Map<string, Record<string, number>>();
  if (benchmark_equity) {
    Object.entries(benchmark_equity).forEach(([symbol, data]) => {
      data.forEach(point => {
        benchmarkMap.set(point.date, { ...benchmarkMap.get(point.date) || {}, [symbol]: point.value });
      });
    });
  }
  
  // Prepare chart data with cumulative deposits
  // Calculate deposits based on the deposit schedule, not cash changes
  let cumulativeDeposits = currentResult.config.initial_cash;
  const depositAmount = currentResult.config.deposits?.amount || 0;
  const depositCadence = currentResult.config.deposits?.cadence;
  
  const startDate = new Date(currentResult.config.period.start);
  
  const chartData = equity_curve.map((point, index) => {
    if (index > 0 && depositAmount > 0) {
      const currentDate = new Date(point.date);
      
      // Calculate how many deposits should have occurred by this date
      let expectedDeposits = 0;
      
      if (depositCadence === 'daily' || depositCadence === 'every_market_day') {
        expectedDeposits = index; // One per trading day
      } else if (depositCadence === 'weekly') {
        // Count Mondays since start
        const daysSinceStart = Math.floor((currentDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        expectedDeposits = Math.floor(daysSinceStart / 7);
      } else if (depositCadence === 'monthly') {
        // Count months since start
        const monthsDiff = (currentDate.getFullYear() - startDate.getFullYear()) * 12 + 
                          (currentDate.getMonth() - startDate.getMonth());
        expectedDeposits = Math.max(0, monthsDiff);
      } else if (depositCadence === 'quarterly') {
        // Count quarters since start
        const quartersDiff = Math.floor(((currentDate.getFullYear() - startDate.getFullYear()) * 12 + 
                                       (currentDate.getMonth() - startDate.getMonth())) / 3);
        expectedDeposits = Math.max(0, quartersDiff);
      } else if (depositCadence === 'yearly') {
        // Count years since start
        expectedDeposits = Math.max(0, currentDate.getFullYear() - startDate.getFullYear());
      }
      
      // Update cumulative deposits based on expected count
      cumulativeDeposits = currentResult.config.initial_cash + (expectedDeposits * depositAmount);
    }
    
    // Add benchmark values if available
    const benchmarkValues = benchmarkMap.get(point.date) || {};
    
    return {
      date: new Date(point.date).toLocaleDateString(),
      value: point.portfolio_value,
      cash: point.cash,
      deposits: cumulativeDeposits,
      ...benchmarkValues, // Add benchmark values dynamically (e.g., SPY: 12345)
    };
  });
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };
  
  const formatPercent = (value: number) => {
    return `${(value * 100).toFixed(2)}%`;
  };
  
  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'equity', label: 'Equity Curve' },
    { id: 'trades', label: 'Trades' },
    { id: 'tax', label: 'Tax Summary' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">Backtest Results</h1>
            <p className="text-gray-600 dark:text-gray-400 text-lg font-medium">
              {currentResult.config.meta.name}
            </p>
          </div>
          <div className="flex gap-3">
            <button className="px-6 py-3 bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-all flex items-center space-x-2 shadow-md">
              <Download className="h-5 w-5" />
              <span>Export</span>
            </button>
            <button
              onClick={() => navigate('/builder')}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-blue-500/50 transition-all"
            >
              Build Strategy
            </button>
          </div>
        </div>
      
        {/* Warnings */}
        {warnings && warnings.length > 0 && (
          <section className="bg-yellow-50 dark:bg-yellow-900/20 rounded-2xl shadow-lg p-6 mb-6 border-2 border-yellow-200 dark:border-yellow-800">
            <h3 className="font-bold text-yellow-800 dark:text-yellow-200 mb-4 flex items-center text-lg">
              <AlertCircle className="h-5 w-5 mr-2" />
              Warnings
            </h3>
          <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
            {warnings.map((warning, i) => (
              <li key={i}>• {warning}</li>
            ))}
          </ul>
        </section>
      )}
      
      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <MetricCard
          label="Total Return"
          value={formatPercent(metrics.twr)}
          icon={metrics.twr >= 0 ? TrendingUp : TrendingDown}
          positive={metrics.twr >= 0}
        />
        <MetricCard
          label="CAGR"
          value={formatPercent(metrics.cagr)}
          icon={Percent}
          positive={metrics.cagr >= 0}
        />
        <MetricCard
          label="Sharpe Ratio"
          value={metrics.sharpe.toFixed(2)}
          icon={TrendingUp}
        />
        <MetricCard
          label="Max Drawdown"
          value={formatPercent(metrics.max_drawdown)}
          icon={TrendingDown}
          positive={false}
        />
      </div>
      
        {/* Tabs */}
        <div className="mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-2 inline-flex space-x-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-6 py-3 rounded-xl font-semibold text-sm transition-all ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg shadow-blue-500/50'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      
      {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Performance Metrics */}
            <section className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-100 dark:border-gray-700">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Performance Metrics</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <MetricRow label="Total Return" value={formatPercent(metrics.twr)} />
              <MetricRow label="CAGR" value={formatPercent(metrics.cagr)} />
              <MetricRow label="IRR" value={formatPercent(metrics.irr)} />
              <MetricRow label="Annual Volatility" value={formatPercent(metrics.annual_vol)} />
              <MetricRow label="Sharpe Ratio" value={metrics.sharpe.toFixed(2)} />
              <MetricRow label="Sortino Ratio" value={metrics.sortino.toFixed(2)} />
              <MetricRow label="Calmar Ratio" value={metrics.calmar.toFixed(2)} />
              <MetricRow label="Max Drawdown" value={formatPercent(metrics.max_drawdown)} />
              <MetricRow label="Hit Ratio" value={formatPercent(metrics.hit_ratio)} />
            </div>
          </section>
          
            {/* Period Returns */}
            <section className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-100 dark:border-gray-700">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Period Returns</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <MetricRow label="Best Month" value={formatPercent(metrics.best_month)} />
              <MetricRow label="Worst Month" value={formatPercent(metrics.worst_month)} />
              <MetricRow label="Best Quarter" value={formatPercent(metrics.best_quarter)} />
              <MetricRow label="Worst Quarter" value={formatPercent(metrics.worst_quarter)} />
            </div>
          </section>
          
            {/* Benchmark Comparison */}
            {metrics.alpha !== null && metrics.beta !== null && (
              <section className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-100 dark:border-gray-700">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Relative Performance vs Benchmark</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <MetricRow label="Alpha" value={formatPercent(metrics.alpha || 0)} />
                <MetricRow label="Beta" value={(metrics.beta || 0).toFixed(2)} />
                {metrics.tracking_error && (
                  <MetricRow label="Tracking Error" value={formatPercent(metrics.tracking_error)} />
                )}
                {metrics.information_ratio && (
                  <MetricRow label="Information Ratio" value={metrics.information_ratio.toFixed(2)} />
                )}
                </div>
              </section>
            )}

            {/* Benchmark Performance */}
            {benchmark_metrics && Object.keys(benchmark_metrics).length > 0 && (
              <section className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-100 dark:border-gray-700">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Benchmark Performance</h2>
              {Object.entries(benchmark_metrics).map(([symbol, benchMetrics]) => (
                <div key={symbol} className="mb-6 last:mb-0">
                  <h3 className="text-lg font-medium mb-4 text-blue-600 dark:text-blue-400">{symbol}</h3>
                  
                  {/* Side-by-side comparison */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Portfolio Column */}
                    <div>
                      <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-3">Your Strategy</h4>
                      <div className="space-y-2">
                        <MetricRow label="Total Return" value={formatPercent(metrics.twr)} />
                        <MetricRow label="CAGR" value={formatPercent(metrics.cagr)} />
                        <MetricRow label="Sharpe Ratio" value={metrics.sharpe.toFixed(2)} />
                        <MetricRow label="Max Drawdown" value={formatPercent(metrics.max_drawdown)} />
                      </div>
                    </div>
                    
                    {/* Benchmark Column */}
                    <div>
                      <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-3">{symbol}</h4>
                      <div className="space-y-2">
                        <MetricRow label="Total Return" value={formatPercent(benchMetrics.twr)} />
                        <MetricRow label="CAGR" value={formatPercent(benchMetrics.cagr)} />
                        <MetricRow label="Sharpe Ratio" value={benchMetrics.sharpe.toFixed(2)} />
                        <MetricRow label="Max Drawdown" value={formatPercent(benchMetrics.max_drawdown)} />
                      </div>
                    </div>
                  </div>

                  {/* Comparison Summary */}
                  <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <div className="text-gray-600 dark:text-gray-400">Outperformance</div>
                        <div className={`font-semibold ${(metrics.twr - benchMetrics.twr) > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatPercent(metrics.twr - benchMetrics.twr)}
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-600 dark:text-gray-400">CAGR Diff</div>
                        <div className={`font-semibold ${(metrics.cagr - benchMetrics.cagr) > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatPercent(metrics.cagr - benchMetrics.cagr)}
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-600 dark:text-gray-400">Sharpe Diff</div>
                        <div className={`font-semibold ${(metrics.sharpe - benchMetrics.sharpe) > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {(metrics.sharpe - benchMetrics.sharpe).toFixed(2)}
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-600 dark:text-gray-400">DD Improvement</div>
                        <div className={`font-semibold ${(metrics.max_drawdown - benchMetrics.max_drawdown) > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatPercent(metrics.max_drawdown - benchMetrics.max_drawdown)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </section>
          )}
        </div>
      )}
      
        {activeTab === 'equity' && (
          <section className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-100 dark:border-gray-700">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Equity Curve vs Total Deposits</h2>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-800" />
              <XAxis 
                dataKey="date" 
                className="text-xs"
                tick={{ fill: 'currentColor' }}
              />
              <YAxis 
                className="text-xs"
                tick={{ fill: 'currentColor' }}
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'var(--tooltip-bg)',
                  border: '1px solid var(--tooltip-border)',
                  borderRadius: '8px',
                }}
                formatter={(value: number) => formatCurrency(value)}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="value" 
                stroke="#0ea5e9" 
                name="Portfolio Value"
                strokeWidth={2}
                dot={false}
              />
              <Line 
                type="monotone" 
                dataKey="deposits" 
                stroke="#10b981" 
                name="Total Deposits"
                strokeWidth={2}
                dot={false}
                strokeDasharray="5 5"
              />
              {/* Add benchmark lines dynamically */}
              {benchmark_equity && Object.keys(benchmark_equity).map((symbol, idx) => {
                const colors = ['#f59e0b', '#8b5cf6', '#ec4899']; // Orange, purple, pink for multiple benchmarks
                return (
                  <Line 
                    key={symbol}
                    type="monotone" 
                    dataKey={symbol}
                    stroke={colors[idx % colors.length]}
                    name={symbol}
                    strokeWidth={2}
                    dot={false}
                    strokeDasharray="3 3"
                  />
                );
              })}
              </LineChart>
            </ResponsiveContainer>
          </section>
        )}
      
        {activeTab === 'trades' && (
          <section className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-100 dark:border-gray-700">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Trade History</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 font-semibold">
                {trades.length} total trades
              </p>
            </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr className="border-b">
                  <th className="pb-2 font-medium">Date</th>
                  <th className="pb-2 font-medium">Symbol</th>
                  <th className="pb-2 font-medium">Action</th>
                  <th className="pb-2 font-medium text-right">Quantity</th>
                  <th className="pb-2 font-medium text-right">Price</th>
                  <th className="pb-2 font-medium text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {trades.map((trade) => (
                  <tr key={trade.trade_id} className={trade.action === 'DIVIDEND' ? 'bg-blue-50 dark:bg-blue-900/10' : ''}>
                    <td className="py-2">{trade.date}</td>
                    <td className="py-2 font-medium">{trade.symbol}</td>
                    <td className="py-2">
                      <span className={`px-2 py-1 rounded text-xs ${
                        trade.action === 'BUY' || trade.action === 'DRIP'
                          ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200'
                          : trade.action === 'DIVIDEND'
                          ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200'
                          : 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200'
                      }`}>
                        {trade.action}
                      </span>
                    </td>
                    <td className="py-2 text-right">
                      {trade.action === 'DIVIDEND' ? `${trade.quantity.toFixed(2)} shares` : trade.quantity.toFixed(2)}
                    </td>
                    <td className="py-2 text-right">
                      {trade.action === 'DIVIDEND' ? `$${trade.price.toFixed(4)}/sh` : formatCurrency(trade.price)}
                    </td>
                    <td className="py-2 text-right">
                      {trade.action === 'DIVIDEND' 
                        ? <span className="text-green-600 dark:text-green-400">+{formatCurrency(trade.total_cost)}</span>
                        : formatCurrency(Math.abs(trade.total_cost))
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
      
        {activeTab === 'tax' && (
          <section className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-100 dark:border-gray-700">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Tax Summary by Year</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="pb-2 font-medium">Year</th>
                  <th className="pb-2 font-medium text-right">Short-term Gains</th>
                  <th className="pb-2 font-medium text-right">Long-term Gains</th>
                  <th className="pb-2 font-medium text-right">Qualified Dividends</th>
                  <th className="pb-2 font-medium text-right">Total Tax</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {tax_summaries.map((summary) => (
                  <tr key={summary.year}>
                    <td className="py-2 font-medium">{summary.year}</td>
                    <td className="py-2 text-right">{formatCurrency(summary.short_term_gains)}</td>
                    <td className="py-2 text-right">{formatCurrency(summary.long_term_gains)}</td>
                    <td className="py-2 text-right">{formatCurrency(summary.qualified_dividends)}</td>
                    <td className="py-2 text-right font-medium">{formatCurrency(summary.total_tax)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          </section>
        )}
      </div>
    </div>
  );
}

// Helper components
function MetricCard({ 
  label, 
  value, 
  icon: Icon, 
  positive 
}: { 
  label: string; 
  value: string; 
  icon: any; 
  positive?: boolean;
}) {
  return (
    <div className="card p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400">{label}</p>
          <p className={`text-lg font-semibold ${
            positive === undefined 
              ? 'text-gray-900 dark:text-gray-100'
              : positive 
              ? 'text-green-600 dark:text-green-400' 
              : 'text-red-600 dark:text-red-400'
          }`}>
            {value}
          </p>
        </div>
        <Icon className="h-5 w-5 text-gray-400" />
      </div>
    </div>
  );
}

function MetricRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-5 border border-gray-200 dark:border-gray-600">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">{label}</p>
          <p className="text-xl font-bold mt-2 text-gray-900 dark:text-white">{value}</p>
        </div>
      </div>
    </div>
  );
}
