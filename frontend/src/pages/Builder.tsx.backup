import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  Play, 
  Save, 
  AlertCircle, 
  Target, 
  TrendingUp, 
  DollarSign, 
  Calendar, 
  BarChart3,
  Zap,
  Settings,
  Plus,
  X,
  Info
} from 'lucide-react';
import { useStrategyStore } from '@/stores/strategyStore';
import { POPULAR_ETFS } from '@/data/popularSymbols';
import type { StrategyConfig } from '@/types';

export default function Builder() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { strategies, saveStrategy, updateStrategy, setCurrentStrategy, runBacktest, isRunning, currentStrategy } = useStrategyStore();
  
  const [config, setConfig] = useState<StrategyConfig>(getDefaultConfig());
  const [errors, setErrors] = useState<string[]>([]);
  
  useEffect(() => {
    if (id) {
      // Loading an existing strategy by ID
      const strategy = strategies.find((s) => s.id === id);
      if (strategy) {
        setConfig(strategy.config);
      }
    } else if (currentStrategy) {
      // Loading from currentStrategy (e.g., from template with fund switch)
      setConfig(currentStrategy);
      // Clear currentStrategy after loading to avoid conflicts
      setCurrentStrategy(null);
    }
  }, [id, strategies, currentStrategy, setCurrentStrategy]);
  
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
    console.log('Starting backtest with config:', config);
    
    // First check if backend is accessible
    try {
      console.log('Testing backend connectivity...');
      const healthCheck = await fetch('/api/health', { method: 'GET' });
      console.log('Health check response:', healthCheck.status);
      if (!healthCheck.ok) {
        throw new Error(`Backend not accessible: ${healthCheck.status}`);
      }
    } catch (error) {
      console.error('Backend connectivity error:', error);
      setErrors(['Backend server is not running. Please start the backend server first.']);
      return;
    }
    
    try {
      setCurrentStrategy(config);
      console.log('Running backtest...');
      await runBacktest(config);
      console.log('Backtest completed, navigating to results');
      navigate('/results');
    } catch (error) {
      console.error('Backtest error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Backtest failed';
      setErrors([errorMessage]);
      
      // Don't navigate away on error, stay on builder page
      console.log('Staying on builder page due to error');
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Hero Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mb-4">
            <BarChart3 className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-3">
            {id ? 'Edit Your Strategy' : 'Build Your Strategy'}
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Create a powerful, tax-aware investment strategy with our intuitive builder
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
        
        {/* Position Sizing */}
        <section className="card p-6">
          <h2 className="text-xl font-semibold mb-4">Position Sizing</h2>
          <div className="space-y-4">
            <div>
              <label className="label">Allocation Method</label>
              <select
                className="input"
                value={config.position_sizing.method}
                onChange={(e) => updateConfig('position_sizing.method', e.target.value)}
              >
                <option value="EQUAL_WEIGHT">Equal Weight</option>
                <option value="CUSTOM_WEIGHTS">Custom Weights</option>
              </select>
            </div>
            
            {config.position_sizing.method === 'CUSTOM_WEIGHTS' && (
              <div>
                <label className="label">Custom Allocations (%)</label>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  Specify what percentage to allocate to each symbol. Values will be normalized to 100%.
                </p>
                <div className="space-y-2">
                  {config.universe.symbols.map((symbol) => (
                    <div key={symbol} className="flex items-center space-x-3">
                      <span className="w-16 text-sm font-medium">{symbol}:</span>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        className="input flex-1"
                        value={((config.position_sizing.custom_weights?.[symbol] || 0) * 100).toFixed(1)}
                        onChange={(e) => {
                          const weight = parseFloat(e.target.value) / 100;
                          const currentWeights = config.position_sizing.custom_weights || {};
                          updateConfig('position_sizing.custom_weights', {
                            ...currentWeights,
                            [symbol]: weight
                          });
                        }}
                        placeholder="0.0"
                      />
                      <span className="text-sm text-gray-500">%</span>
                    </div>
                  ))}
                </div>
                <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    <strong>Total: {
                      Object.values(config.position_sizing.custom_weights || {})
                        .reduce((sum: number, weight: number) => sum + (weight || 0), 0) * 100
                    }%</strong>
                    {Object.values(config.position_sizing.custom_weights || {}).reduce((sum: number, weight: number) => sum + (weight || 0), 0) !== 1 && 
                      " (will be normalized to 100%)"
                    }
                  </p>
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
                <option value="529 Plan">529 Plan</option>
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
            
            {config.account.type === '529 Plan' && (
              <div className="pt-4 border-t">
                <div className="mb-4">
                  <label className="label">State</label>
                  <select
                    className="input"
                    value={config.account.state || 'CA'}
                    onChange={(e) => updateConfig('account.state', e.target.value)}
                  >
                    <option value="AL">Alabama</option>
                    <option value="AZ">Arizona</option>
                    <option value="AR">Arkansas</option>
                    <option value="CA">California</option>
                    <option value="CO">Colorado</option>
                    <option value="CT">Connecticut</option>
                    <option value="FL">Florida</option>
                    <option value="GA">Georgia</option>
                    <option value="IL">Illinois</option>
                    <option value="IN">Indiana</option>
                    <option value="NY">New York</option>
                    <option value="TX">Texas</option>
                    <option value="PA">Pennsylvania</option>
                    <option value="OH">Ohio</option>
                    <option value="MI">Michigan</option>
                    <option value="NJ">New Jersey</option>
                    <option value="VA">Virginia</option>
                    <option value="WA">Washington</option>
                    <option value="NC">North Carolina</option>
                    <option value="MA">Massachusetts</option>
                  </select>
                </div>
                
                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <h4 className="font-medium text-sm mb-2">🎓 529 Plan Tax Benefits</h4>
                  <div className="text-sm text-green-700 dark:text-green-300">
                    {(() => {
                      const stateBenefits: Record<string, {deduction: number | string, rate: number}> = {
                        'CA': { deduction: 0, rate: 9.3 },
                        'NY': { deduction: 10000, rate: 10.9 },
                        'TX': { deduction: 0, rate: 0 },
                        'FL': { deduction: 0, rate: 0 },
                        'PA': { deduction: 16000, rate: 3.07 },
                        'IL': { deduction: 10000, rate: 4.95 },
                        'OH': { deduction: 4000, rate: 3.99 },
                        'GA': { deduction: 4000, rate: 5.75 },
                        'NC': { deduction: 0, rate: 5.25 },
                        'MI': { deduction: 5000, rate: 4.25 },
                        'NJ': { deduction: 0, rate: 10.75 },
                        'VA': { deduction: 4000, rate: 5.75 },
                        'WA': { deduction: 0, rate: 0 },
                        'AZ': { deduction: 4000, rate: 4.5 },
                        'MA': { deduction: 1000, rate: 5.0 },
                        'IN': { deduction: 5000, rate: 3.23 },
                        'CO': { deduction: 'Full', rate: 4.55 },
                        'AL': { deduction: 5000, rate: 5.0 }
                      };
                      const state = config.account.state || 'CA';
                      const benefits = stateBenefits[state] || { deduction: 0, rate: 0 };
                      
                      if (benefits.rate === 0) {
                        return <p><strong>No state income tax</strong> - 529 contributions grow tax-free federally</p>;
                      } else if (benefits.deduction === 0) {
                        return <p><strong>No state deduction</strong> - but earnings grow tax-free (State rate: {benefits.rate}%)</p>;
                      } else if (benefits.deduction === 'Full') {
                        return <p><strong>Full state deduction</strong> - all contributions deductible (State rate: {benefits.rate}%)</p>;
                      } else {
                        const deductionNum = benefits.deduction as number;
                        return <p><strong>Up to ${deductionNum.toLocaleString()} deduction</strong> - saves ~${Math.round(deductionNum * benefits.rate / 100)} in state taxes</p>;
                      }
                    })()}
                  </div>
                  <p className="text-xs text-green-600 dark:text-green-400 mt-2">
                    💡 All 529 earnings grow federally tax-free when used for qualified education expenses
                  </p>
                </div>
                
                <div className="mt-4">
                  <details className="group">
                    <summary className="flex items-center justify-between cursor-pointer p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors">
                      <span className="font-medium text-blue-800 dark:text-blue-200 flex items-center">
                        📚 What are Qualified Education Expenses?
                      </span>
                      <svg className="w-5 h-5 text-blue-600 dark:text-blue-300 transition-transform group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </summary>
                    
                    <div className="mt-3 p-4 bg-white dark:bg-gray-800 rounded-lg border border-blue-200 dark:border-blue-800">
                      <div className="space-y-4 text-sm">
                        <div>
                          <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2 flex items-center">
                            🎓 College & University (Unlimited)
                          </h4>
                          <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-1 ml-4">
                            <li>Tuition and mandatory fees</li>
                            <li>Room and board (if enrolled at least half-time)</li>
                            <li>Required books, supplies, and equipment</li>
                            <li>Computer/software for educational use</li>
                            <li>Special needs services</li>
                          </ul>
                        </div>
                        
                        <div>
                          <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2 flex items-center">
                            🏫 K-12 Private School (Up to $10,000/year)
                          </h4>
                          <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-1 ml-4">
                            <li>Tuition at elementary or secondary schools</li>
                            <li>Private, public, or religious schools</li>
                            <li>Homeschool expenses in some states</li>
                          </ul>
                        </div>
                        
                        <div>
                          <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2 flex items-center">
                            🛠️ Apprenticeships & Trade Schools
                          </h4>
                          <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-1 ml-4">
                            <li>Registered apprenticeship programs</li>
                            <li>Trade and vocational schools</li>
                            <li>Certification programs</li>
                          </ul>
                        </div>
                        
                        <div>
                          <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2 flex items-center">
                            💰 Student Loans (Up to $10,000 lifetime)
                          </h4>
                          <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-1 ml-4">
                            <li>Repay qualified student loans</li>
                            <li>For beneficiary or their siblings</li>
                            <li>Principal and interest payments</li>
                          </ul>
                        </div>
                        
                        <div className="border-t pt-3 mt-4">
                          <div className="flex items-start space-x-2">
                            <span className="text-red-500 font-bold">⚠️</span>
                            <div>
                              <p className="font-medium text-red-700 dark:text-red-300">Non-Qualified Withdrawals</p>
                              <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                                Earnings withdrawn for non-qualified expenses are subject to income tax + 10% penalty
                              </p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                          <p className="text-xs text-green-700 dark:text-green-300">
                            <strong>💡 Pro Tip:</strong> 529 plans are incredibly flexible! You can change beneficiaries to family members, 
                            and unused funds can be rolled to Roth IRAs (with some restrictions) starting in 2024.
                          </p>
                        </div>
                      </div>
                    </div>
                  </details>
                </div>
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
        
        {/* Dividend Handling */}
        <section className="card p-6">
          <h2 className="text-xl font-semibold mb-4">Dividend Handling</h2>
          <div className="space-y-4">
            <div>
              <label className="label">Dividend Strategy</label>
              <select
                className="input"
                value={config.dividends.mode}
                onChange={(e) => updateConfig('dividends.mode', e.target.value)}
              >
                <option value="DRIP">DRIP (Dividend Reinvestment Plan)</option>
                <option value="CASH">Hold as Cash</option>
              </select>
            </div>
            
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              {config.dividends.mode === 'DRIP' ? (
                <div>
                  <h4 className="font-medium text-sm mb-2">📈 DRIP (Recommended for Growth)</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Dividends are immediately reinvested into the same stock that paid them. 
                    This maximizes compounding but may cause your portfolio to drift from target allocations.
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                    <strong>Best for:</strong> Single-stock strategies or when you want maximum compounding
                  </p>
                </div>
              ) : (
                <div>
                  <h4 className="font-medium text-sm mb-2">💰 Hold as Cash (Strategic Rebalancing)</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Dividends accumulate as cash and get deployed during the next rebalancing cycle 
                    to the most underweighted securities. This maintains your target allocations.
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                    <strong>Best for:</strong> Multi-asset portfolios where you want to maintain precise allocations
                  </p>
                </div>
              )}
            </div>
            
            {config.dividends.mode === 'CASH' && (
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  💡 <strong>Pro Tip:</strong> With "{config.deposits?.cadence || 'monthly'}" deposits, 
                  dividend cash will be combined with new deposits and allocated to underweighted positions 
                  during each rebalancing cycle.
                </p>
              </div>
            )}
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
