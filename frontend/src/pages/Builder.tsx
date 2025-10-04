import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Play, Save, AlertCircle } from 'lucide-react';
import { useStrategyStore } from '@/stores/strategyStore';
import { POPULAR_ETFS } from '@/data/popularSymbols';
import type { StrategyConfig } from '@/types';

export default function Builder() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { strategies, saveStrategy, updateStrategy, setCurrentStrategy, runBacktest, isRunning } = useStrategyStore();
  
  const [config, setConfig] = useState<StrategyConfig>(getDefaultConfig());
  const [errors, setErrors] = useState<string[]>([]);
  
  useEffect(() => {
    if (id) {
      const strategy = strategies.find((s) => s.id === id);
      if (strategy) {
        setConfig(strategy.config);
      }
    }
  }, [id, strategies]);
  
  const handleSave = () => {
    if (id) {
      updateStrategy(id, config);
    } else {
      saveStrategy(config);
    }
    navigate('/');
  };
  
  const handleRun = async () => {
    setErrors([]);
    try {
      setCurrentStrategy(config);
      await runBacktest(config);
      navigate('/results');
    } catch (error) {
      setErrors([error instanceof Error ? error.message : 'Backtest failed']);
    }
  };
  
  const updateConfig = (path: string, value: any) => {
    setConfig((prev) => {
      const keys = path.split('.');
      const newConfig = JSON.parse(JSON.stringify(prev));
      let current = newConfig;
      
      for (let i = 0; i < keys.length - 1; i++) {
        current = current[keys[i]];
      }
      
      current[keys[keys.length - 1]] = value;
      return newConfig;
    });
  };
  
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">
          {id ? 'Edit Strategy' : 'Create New Strategy'}
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Configure your backtesting strategy with tax-aware portfolio management
        </p>
      </div>
      
      {errors.length > 0 && (
        <div className="card p-4 mb-6 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
          <div className="flex items-start space-x-2">
            <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-red-900 dark:text-red-200 mb-1">Errors</h3>
              <ul className="text-sm text-red-800 dark:text-red-300 space-y-1">
                {errors.map((error, i) => (
                  <li key={i}>• {error}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
      
      <div className="space-y-6">
        {/* Basic Info */}
        <section className="card p-6">
          <h2 className="text-xl font-semibold mb-4">Basic Information</h2>
          <div className="space-y-4">
            <div>
              <label className="label">Strategy Name</label>
              <input
                type="text"
                className="input"
                value={config.meta.name}
                onChange={(e) => updateConfig('meta.name', e.target.value)}
                placeholder="My Strategy"
              />
            </div>
            
            <div>
              <label className="label">Notes</label>
              <textarea
                className="input"
                rows={3}
                value={config.meta.notes}
                onChange={(e) => updateConfig('meta.notes', e.target.value)}
                placeholder="Strategy description..."
              />
            </div>
          </div>
        </section>
        
        {/* Universe */}
        <section className="card p-6">
          <h2 className="text-xl font-semibold mb-4">Universe</h2>
          <div className="space-y-4">
            <div>
              <label className="label">Symbols (comma-separated)</label>
              <input
                type="text"
                className="input"
                value={config.universe.symbols.join(', ')}
                onChange={(e) => updateConfig('universe.symbols', e.target.value.split(',').map(s => s.trim().toUpperCase()))}
                placeholder="SPY, QQQ, VTI"
              />
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Enter ticker symbols separated by commas
              </p>
              
              {/* Popular ETF Categories */}
              <div className="mt-3">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Popular ETFs:</p>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(POPULAR_ETFS).slice(0, 4).map(([category, symbols]) => (
                    <div key={category} className="text-xs">
                      <span className="text-gray-600 dark:text-gray-400">{category}:</span>
                      {symbols.slice(0, 3).map((symbol) => (
                        <button
                          key={symbol}
                          type="button"
                          onClick={() => {
                            const currentSymbols = config.universe.symbols;
                            if (!currentSymbols.includes(symbol)) {
                              updateConfig('universe.symbols', [...currentSymbols, symbol]);
                            }
                          }}
                          className="ml-1 px-1 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded hover:bg-blue-200 dark:hover:bg-blue-900/50"
                        >
                          {symbol}
                        </button>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
        
        {/* Period */}
        <section className="card p-6">
          <h2 className="text-xl font-semibold mb-4">Backtest Period</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Start Date</label>
              <input
                type="date"
                className="input"
                value={config.period.start}
                onChange={(e) => updateConfig('period.start', e.target.value)}
              />
            </div>
            
            <div>
              <label className="label">End Date</label>
              <input
                type="date"
                className="input"
                value={config.period.end}
                onChange={(e) => updateConfig('period.end', e.target.value)}
              />
            </div>
          </div>
        </section>
        
        {/* Account */}
        <section className="card p-6">
          <h2 className="text-xl font-semibold mb-4">Account Configuration</h2>
          <div className="space-y-4">
            <div>
              <label className="label">Initial Cash</label>
              <input
                type="number"
                className="input"
                value={config.initial_cash}
                onChange={(e) => updateConfig('initial_cash', parseFloat(e.target.value))}
                placeholder="100000"
              />
            </div>
            
            <div>
              <label className="label">Account Type</label>
              <select
                className="input"
                value={config.account.type}
                onChange={(e) => updateConfig('account.type', e.target.value)}
              >
                <option value="Taxable">Taxable</option>
                <option value="Traditional IRA">Traditional IRA</option>
                <option value="Roth IRA">Roth IRA</option>
              </select>
            </div>
            
            {config.account.type === 'Taxable' && (
              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div>
                  <label className="label">Federal Ordinary Rate</label>
                  <input
                    type="number"
                    step="0.01"
                    className="input"
                    value={config.account.tax.federal_ordinary}
                    onChange={(e) => updateConfig('account.tax.federal_ordinary', parseFloat(e.target.value))}
                  />
                </div>
                
                <div>
                  <label className="label">Federal LTCG Rate</label>
                  <input
                    type="number"
                    step="0.01"
                    className="input"
                    value={config.account.tax.federal_ltcg}
                    onChange={(e) => updateConfig('account.tax.federal_ltcg', parseFloat(e.target.value))}
                  />
                </div>
                
                <div>
                  <label className="label">State Tax Rate</label>
                  <input
                    type="number"
                    step="0.01"
                    className="input"
                    value={config.account.tax.state}
                    onChange={(e) => updateConfig('account.tax.state', parseFloat(e.target.value))}
                  />
                </div>
                
                <div className="flex items-center space-x-2 pt-6">
                  <input
                    type="checkbox"
                    id="wash-sale"
                    checked={config.account.tax.apply_wash_sale}
                    onChange={(e) => updateConfig('account.tax.apply_wash_sale', e.target.checked)}
                    className="rounded"
                  />
                  <label htmlFor="wash-sale" className="text-sm">
                    Apply Wash Sale Rules
                  </label>
                </div>
              </div>
            )}
          </div>
        </section>
        
        {/* Rebalancing */}
        <section className="card p-6">
          <h2 className="text-xl font-semibold mb-4">Rebalancing</h2>
          <div className="space-y-4">
            <div>
              <label className="label">Rebalancing Type</label>
              <select
                className="input"
                value={config.rebalancing.type}
                onChange={(e) => updateConfig('rebalancing.type', e.target.value)}
              >
                <option value="calendar">Calendar</option>
                <option value="drift">Drift</option>
                <option value="both">Both</option>
                <option value="cashflow_only">Cashflow Only</option>
              </select>
            </div>
            
            {(config.rebalancing.type === 'calendar' || config.rebalancing.type === 'both') && (
              <div>
                <label className="label">Calendar Period</label>
                <select
                  className="input"
                  value={config.rebalancing.calendar?.period || 'M'}
                  onChange={(e) => updateConfig('rebalancing.calendar', { period: e.target.value })}
                >
                  <option value="M">Monthly</option>
                  <option value="Q">Quarterly</option>
                  <option value="A">Annually</option>
                </select>
              </div>
            )}
            
            {(config.rebalancing.type === 'drift' || config.rebalancing.type === 'both') && (
              <div>
                <label className="label">Drift Threshold (%)</label>
                <input
                  type="number"
                  step="0.01"
                  className="input"
                  value={config.rebalancing.drift?.abs_pct || 0.05}
                  onChange={(e) => updateConfig('rebalancing.drift', { abs_pct: parseFloat(e.target.value) })}
                  placeholder="0.05"
                />
              </div>
            )}
          </div>
        </section>
        
        {/* Deposits */}
        <section className="card p-6">
          <h2 className="text-xl font-semibold mb-4">Deposits (Optional)</h2>
          <div className="space-y-4">
            <div>
              <label className="label">Deposit Cadence</label>
              <select
                className="input"
                value={config.deposits?.cadence || 'monthly'}
                onChange={(e) => updateConfig('deposits', { 
                  ...config.deposits,
                  cadence: e.target.value,
                  amount: config.deposits?.amount || 0
                })}
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly (Mondays)</option>
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="yearly">Yearly</option>
                <option value="every_market_day">Every Market Day</option>
              </select>
            </div>
            
            <div>
              <label className="label">Deposit Amount</label>
              <input
                type="number"
                className="input"
                value={config.deposits?.amount || 0}
                onChange={(e) => updateConfig('deposits', {
                  ...config.deposits,
                  cadence: config.deposits?.cadence || 'monthly',
                  amount: parseFloat(e.target.value)
                })}
                placeholder="500"
              />
            </div>
          </div>
        </section>
        
        {/* Actions */}
        <div className="flex space-x-4">
          <button
            onClick={handleSave}
            className="btn btn-secondary flex items-center space-x-2"
          >
            <Save className="h-4 w-4" />
            <span>Save Strategy</span>
          </button>
          
          <button
            onClick={handleRun}
            disabled={isRunning}
            className="btn btn-primary flex items-center space-x-2"
          >
            <Play className="h-4 w-4" />
            <span>{isRunning ? 'Running...' : 'Run Backtest'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

function getDefaultConfig(): StrategyConfig {
  return {
    meta: {
      name: 'Untitled Strategy',
      notes: '',
    },
    universe: {
      type: 'CUSTOM',
      symbols: ['SPY'],
    },
    period: {
      start: '2010-01-01',
      end: '2024-12-31',
      calendar: 'NYSE',
    },
    initial_cash: 100000,
    account: {
      type: 'Taxable',
      tax: {
        federal_ordinary: 0.32,
        federal_ltcg: 0.15,
        state: 0.06,
        qualified_dividend_pct: 0.8,
        apply_wash_sale: true,
        pay_taxes_from_external: false,
        withdrawal_tax_rate_for_ira: 0.25,
      },
      contribution_caps: {
        enforce: true,
        ira: 7000,
        ira_catch_up: 1000,
        roth: 7000,
        roth_catch_up: 1000,
      },
    },
    dividends: {
      mode: 'DRIP',
      reinvest_threshold_pct: 0,
    },
    rebalancing: {
      type: 'calendar',
      calendar: {
        period: 'Q',
      },
    },
    orders: {
      timing: 'MOO',
    },
    lots: {
      method: 'HIFO',
    },
    frictions: {
      commission_per_trade: 0,
      slippage_bps: 5,
      use_actual_etf_er: true,
      equity_borrow_bps: 0,
    },
    signals: [],
    rules: {
      entry: [],
      exit: [],
    },
    position_sizing: {
      method: 'EQUAL_WEIGHT',
    },
    benchmark: ['SPY'],
    exports: {
      csv: true,
      json: true,
      pdf: false,
    },
  };
}
