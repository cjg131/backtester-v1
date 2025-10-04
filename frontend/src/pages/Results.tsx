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
    if (!currentStrategy && !isRunning) {
      navigate('/');
    }
  }, [currentStrategy, isRunning, navigate]);
  
  if (isRunning) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mb-4"></div>
        <h2 className="text-xl font-semibold">Running backtest...</h2>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          This may take a few moments
        </p>
      </div>
    );
  }
  
  if (!currentResult) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <AlertCircle className="h-16 w-16 mx-auto mb-4 text-gray-400" />
        <h2 className="text-xl font-semibold mb-2">No results available</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Run a backtest to see results
        </p>
        <button
          onClick={() => navigate('/builder')}
          className="btn btn-primary"
        >
          Create Strategy
        </button>
      </div>
    );
  }
  
  const { metrics, equity_curve, trades, tax_summaries, warnings } = currentResult;
  
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
    
    return {
      date: new Date(point.date).toLocaleDateString(),
      value: point.portfolio_value,
      cash: point.cash,
      deposits: cumulativeDeposits,
    };
  });
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
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
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Backtest Results</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {currentResult.config.meta.name}
          </p>
        </div>
        <div className="flex gap-3">
          <button className="btn btn-outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </button>
          <button
            onClick={() => navigate('/builder')}
            className="btn btn-primary"
          >
            New Strategy
          </button>
        </div>
      </div>
      
      {/* Warnings */}
      {warnings && warnings.length > 0 && (
        <section className="card p-4 mb-6 bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800">
          <h3 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2 flex items-center">
            <AlertCircle className="h-4 w-4 mr-2" />
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
      <div className="border-b mb-6">
        <div className="flex space-x-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`pb-3 px-1 border-b-2 font-medium transition-colors ${
                activeTab === tab.id
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
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
          <section className="card p-6">
            <h2 className="text-xl font-semibold mb-4">Performance Metrics</h2>
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
          <section className="card p-6">
            <h2 className="text-xl font-semibold mb-4">Period Returns</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <MetricRow label="Best Month" value={formatPercent(metrics.best_month)} />
              <MetricRow label="Worst Month" value={formatPercent(metrics.worst_month)} />
              <MetricRow label="Best Quarter" value={formatPercent(metrics.best_quarter)} />
              <MetricRow label="Worst Quarter" value={formatPercent(metrics.worst_quarter)} />
            </div>
          </section>
          
          {/* Benchmark Comparison */}
          {metrics.alpha !== null && metrics.beta !== null && (
            <section className="card p-6">
              <h2 className="text-xl font-semibold mb-4">Benchmark Comparison</h2>
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
        </div>
      )}
      
      {activeTab === 'equity' && (
        <section className="card p-6">
          <h2 className="text-xl font-semibold mb-4">Equity Curve vs Total Deposits</h2>
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
            </LineChart>
          </ResponsiveContainer>
        </section>
      )}
      
      {activeTab === 'trades' && (
        <section className="card p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Trade History</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {trades.length} total trades
            </p>
          </div>
          <div className="overflow-x-auto max-h-96 overflow-y-auto">
            <table className="w-full">
              <thead className="sticky top-0 bg-white dark:bg-gray-900">
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
        <section className="card p-6">
          <h2 className="text-xl font-semibold mb-4">Tax Summary by Year</h2>
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
    <div className="flex justify-between py-1">
      <span className="text-gray-600 dark:text-gray-400">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
