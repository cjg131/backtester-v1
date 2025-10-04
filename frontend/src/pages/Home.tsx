import { Link } from 'react-router-dom';
import { Plus, Play, Trash2, Calendar, TrendingUp } from 'lucide-react';
import { useStrategyStore } from '@/stores/strategyStore';
import { formatDistanceToNow } from 'date-fns';

export default function Home() {
  const { strategies, deleteStrategy, loadStrategy } = useStrategyStore();
  
  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    if (confirm('Are you sure you want to delete this strategy?')) {
      deleteStrategy(id);
    }
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Hero section */}
      <div className="mb-12 text-center">
        <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary-600 to-blue-600 bg-clip-text text-transparent">
          Tax-Aware Portfolio Backtesting
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          Backtest rules-based strategies with comprehensive tax modeling, 
          multiple account types, and advanced rebalancing capabilities.
        </p>
      </div>
      
      {/* Quick stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Strategies</p>
              <p className="text-3xl font-bold mt-1">{strategies.length}</p>
            </div>
            <TrendingUp className="h-10 w-10 text-primary-600 opacity-20" />
          </div>
        </div>
        
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Account Types</p>
              <p className="text-3xl font-bold mt-1">3</p>
            </div>
            <Calendar className="h-10 w-10 text-primary-600 opacity-20" />
          </div>
        </div>
        
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Data Providers</p>
              <p className="text-3xl font-bold mt-1">2</p>
            </div>
            <Play className="h-10 w-10 text-primary-600 opacity-20" />
          </div>
        </div>
      </div>
      
      {/* Strategies list */}
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-bold">Your Strategies</h2>
        <Link to="/builder" className="btn btn-primary flex items-center space-x-2">
          <Plus className="h-4 w-4" />
          <span>New Strategy</span>
        </Link>
      </div>
      
      {strategies.length === 0 ? (
        <div className="card p-12 text-center">
          <TrendingUp className="h-16 w-16 mx-auto mb-4 text-gray-400" />
          <h3 className="text-xl font-semibold mb-2">No strategies yet</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Create your first strategy to start backtesting
          </p>
          <Link to="/builder" className="btn btn-primary inline-flex items-center space-x-2">
            <Plus className="h-4 w-4" />
            <span>Create Strategy</span>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {strategies.map((strategy) => (
            <div key={strategy.id} className="card p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-1">
                    {strategy.config.meta.name}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                    {strategy.config.meta.notes || 'No description'}
                  </p>
                </div>
                <button
                  onClick={(e) => handleDelete(strategy.id, e)}
                  className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                  aria-label="Delete strategy"
                >
                  <Trash2 className="h-4 w-4 text-red-600" />
                </button>
              </div>
              
              <div className="space-y-2 mb-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Symbols:</span>
                  <span className="font-medium">
                    {strategy.config.universe.symbols.join(', ')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Account:</span>
                  <span className="font-medium">{strategy.config.account.type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Period:</span>
                  <span className="font-medium">
                    {strategy.config.period.start} to {strategy.config.period.end}
                  </span>
                </div>
              </div>
              
              <div className="text-xs text-gray-500 dark:text-gray-500 mb-4">
                Updated {formatDistanceToNow(new Date(strategy.updated_at), { addSuffix: true })}
              </div>
              
              <div className="flex space-x-2">
                <Link
                  to={`/builder/${strategy.id}`}
                  className="flex-1 btn btn-secondary text-center text-sm"
                  onClick={() => loadStrategy(strategy.id)}
                >
                  Edit
                </Link>
                <Link
                  to="/results"
                  className="flex-1 btn btn-primary text-center text-sm flex items-center justify-center space-x-1"
                  onClick={() => loadStrategy(strategy.id)}
                >
                  <Play className="h-3 w-3" />
                  <span>Run</span>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Features section */}
      <div className="mt-16">
        <h2 className="text-2xl font-bold mb-8 text-center">Key Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/20 rounded-lg flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="h-6 w-6 text-primary-600" />
            </div>
            <h3 className="font-semibold mb-2">Tax-Aware Trading</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              HIFO lot selection, wash-sale tracking, and year-end tax accrual
            </p>
          </div>
          
          <div className="text-center">
            <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/20 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Calendar className="h-6 w-6 text-primary-600" />
            </div>
            <h3 className="font-semibold mb-2">Multiple Account Types</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Taxable, Traditional IRA, and Roth IRA with contribution caps
            </p>
          </div>
          
          <div className="text-center">
            <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/20 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Play className="h-6 w-6 text-primary-600" />
            </div>
            <h3 className="font-semibold mb-2">Advanced Rebalancing</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Calendar, drift-based, or hybrid rebalancing with tax optimization
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
