import { Link, useNavigate } from 'react-router-dom';
import { Plus, Play, Trash2, BarChart3, TrendingUp, Clock, BookOpen, GitCompare, Target } from 'lucide-react';
import { useStrategyStore } from '@/stores/strategyStore';
import { formatDistanceToNow } from 'date-fns';

export default function Home() {
  const navigate = useNavigate();
  const { strategies, deleteStrategy, loadStrategy, runBacktest, currentResult } = useStrategyStore();
  
  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    if (confirm('Are you sure you want to delete this strategy?')) {
      deleteStrategy(id);
    }
  };
  
  const handleRun = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    const strategy = strategies.find(s => s.id === id);
    if (!strategy) return;
    
    console.log('Running backtest for strategy:', strategy.config.meta.name);
    
    // Navigate immediately to show loading state
    navigate('/results');
    
    // Run backtest in background
    runBacktest(strategy.config);
  };
  
  const formatPercent = (value: number) => {
    return `${(value >= 0 ? '+' : '')}${(value * 100).toFixed(2)}%`;
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
            Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            Manage your strategies and track performance
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
          <Link
            to="/builder"
            className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-2xl shadow-xl p-6 hover:shadow-2xl transition-all group"
          >
            <Target className="h-8 w-8 mb-3 group-hover:scale-110 transition-transform" />
            <h3 className="font-bold text-lg mb-1">Build Strategy</h3>
            <p className="text-blue-100 text-sm">Create a new backtest</p>
          </Link>

          <Link
            to="/templates"
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 hover:shadow-2xl transition-all border border-gray-100 dark:border-gray-700 group"
          >
            <BookOpen className="h-8 w-8 mb-3 text-blue-600 group-hover:scale-110 transition-transform" />
            <h3 className="font-bold text-lg mb-1 text-gray-900 dark:text-white">Templates</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">Start with proven strategies</p>
          </Link>

          <Link
            to="/compare"
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 hover:shadow-2xl transition-all border border-gray-100 dark:border-gray-700 group"
          >
            <GitCompare className="h-8 w-8 mb-3 text-blue-600 group-hover:scale-110 transition-transform" />
            <h3 className="font-bold text-lg mb-1 text-gray-900 dark:text-white">Compare</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">Compare multiple strategies</p>
          </Link>

          {currentResult && (
            <Link
              to="/results"
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 hover:shadow-2xl transition-all border border-gray-100 dark:border-gray-700 group"
            >
              <BarChart3 className="h-8 w-8 mb-3 text-green-600 group-hover:scale-110 transition-transform" />
              <h3 className="font-bold text-lg mb-1 text-gray-900 dark:text-white">Latest Results</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">View recent backtest</p>
            </Link>
          )}
        </div>

        {/* Recent Result */}
        {currentResult && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 mb-8 border border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Latest Backtest</h2>
                <p className="text-gray-600 dark:text-gray-400">{currentResult.config.meta.name}</p>
              </div>
              <Link
                to="/results"
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-blue-500/50 transition-all"
              >
                View Full Results
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Total Return</p>
                <p className={`text-2xl font-bold mt-2 ${currentResult.metrics.twr >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatPercent(currentResult.metrics.twr)}
                </p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">CAGR</p>
                <p className={`text-2xl font-bold mt-2 ${currentResult.metrics.cagr >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatPercent(currentResult.metrics.cagr)}
                </p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Sharpe Ratio</p>
                <p className="text-2xl font-bold mt-2 text-gray-900 dark:text-white">
                  {currentResult.metrics.sharpe.toFixed(2)}
                </p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Max Drawdown</p>
                <p className="text-2xl font-bold mt-2 text-red-600">
                  {formatPercent(currentResult.metrics.max_drawdown)}
                </p>
              </div>
            </div>
          </div>
        )}
      
        {/* Strategies list */}
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Your Strategies</h2>
          <Link to="/builder" className="px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-blue-500/50 transition-all flex items-center space-x-2">
            <Plus className="h-5 w-5" />
            <span>Build Strategy</span>
          </Link>
        </div>
        
        {strategies.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-12 text-center border border-gray-100 dark:border-gray-700">
            <TrendingUp className="h-20 w-20 mx-auto mb-6 text-gray-400" />
            <h3 className="text-2xl font-bold mb-3 text-gray-900 dark:text-white">No strategies yet</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-8 text-lg">
              Create your first strategy to start backtesting
            </p>
            <Link to="/builder" className="px-8 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-blue-500/50 transition-all inline-flex items-center space-x-2">
              <Plus className="h-5 w-5" />
              <span>Build Strategy</span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {strategies.map((strategy) => (
              <div key={strategy.id} className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 hover:shadow-2xl transition-all border border-gray-100 dark:border-gray-700 flex flex-col">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="font-bold text-lg text-gray-900 dark:text-white h-14 mb-2">
                      {strategy.config.meta.name}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 h-10 line-clamp-2">
                      {strategy.config.meta.notes || 'No description'}
                    </p>
                  </div>
                  <button
                    onClick={(e) => handleDelete(strategy.id, e)}
                    className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors flex-shrink-0"
                    aria-label="Delete strategy"
                  >
                    <Trash2 className="h-5 w-5 text-red-600" />
                  </button>
                </div>
                
                <div className="space-y-3 mb-4 text-sm">
                  <div className="flex bg-gray-50 dark:bg-gray-700/50 rounded-lg p-2">
                    <span className="text-gray-600 dark:text-gray-400 w-24 flex-shrink-0">Symbols:</span>
                    <span className="font-semibold text-gray-900 dark:text-white text-right flex-1">
                      {strategy.config.universe.symbols.slice(0, 2).join(', ')}
                      {strategy.config.universe.symbols.length > 2 && ` +${strategy.config.universe.symbols.length - 2}`}
                    </span>
                  </div>
                  <div className="flex bg-gray-50 dark:bg-gray-700/50 rounded-lg p-2">
                    <span className="text-gray-600 dark:text-gray-400 w-24 flex-shrink-0">Account:</span>
                    <span className="font-semibold text-gray-900 dark:text-white text-right flex-1">
                      {strategy.config.account.type}
                    </span>
                  </div>
                  <div className="flex bg-gray-50 dark:bg-gray-700/50 rounded-lg p-2">
                    <span className="text-gray-600 dark:text-gray-400 w-24 flex-shrink-0">Deposits:</span>
                    <span className="font-semibold text-gray-900 dark:text-white text-right flex-1">
                      {strategy.config.deposits?.amount ? 
                        `$${strategy.config.deposits.amount.toLocaleString()}` : 
                        'None'
                      }
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mb-4">
                  <Clock className="h-3 w-3 mr-1" />
                  {formatDistanceToNow(new Date(strategy.updated_at), { addSuffix: true })}
                </div>
                
                <div className="flex space-x-3">
                  <Link
                    to={`/builder/${strategy.id}`}
                    className="flex-1 px-4 py-3 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl font-semibold hover:bg-gray-200 dark:hover:bg-gray-600 transition-all text-center"
                    onClick={() => loadStrategy(strategy.id)}
                  >
                    Edit
                  </Link>
                  <button
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-blue-500/50 transition-all flex items-center justify-center space-x-2"
                    onClick={(e) => handleRun(strategy.id, e)}
                  >
                    <Play className="h-4 w-4" />
                    <span>Run</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
