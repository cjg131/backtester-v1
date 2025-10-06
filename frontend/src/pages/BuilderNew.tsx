import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  Play, 
  Save, 
  AlertCircle, 
  Target, 
  TrendingUp, 
  DollarSign, 
  BarChart3,
  Settings,
  Plus,
  X,
  Info,
  CheckCircle
} from 'lucide-react';
import { useStrategyStore } from '@/stores/strategyStore';
import { POPULAR_ETFS } from '@/data/popularSymbols';
import type { StrategyConfig } from '@/types';
import { API_BASE_URL } from '@/config/api';

const getDefaultConfig = (): StrategyConfig => ({
  meta: {
    name: 'Untitled Strategy',
    notes: ''
  },
  period: {
    start: '2010-01-01',
    end: '2023-12-31',
    calendar: 'NYSE'
  },
  universe: {
    type: 'CUSTOM',
    symbols: ['SPY']
  },
  initial_cash: 10000,
  account: {
    type: 'Taxable',
    tax: {
      federal_ordinary: 0.22,
      federal_ltcg: 0.15,
      state: 0.05,
      qualified_dividend_pct: 0.8,
      apply_wash_sale: true,
      pay_taxes_from_external: false,
      withdrawal_tax_rate_for_ira: 0.25
    },
    contribution_caps: {
      enforce: true,
      ira: 7000,
      ira_catch_up: 1000,
      roth: 7000,
      roth_catch_up: 1000
    }
  },
  dividends: {
    mode: 'DRIP',
    reinvest_threshold_pct: 0
  },
  rebalancing: {
    type: 'calendar',
    calendar: {
      period: 'Q'
    }
  },
  orders: {
    timing: 'MOO'
  },
  lots: {
    method: 'HIFO'
  },
  frictions: {
    commission_per_trade: 0,
    slippage_bps: 5,
    use_actual_etf_er: true,
    equity_borrow_bps: 0
  },
  signals: [],
  rules: {
    entry: [],
    exit: []
  },
  position_sizing: {
    method: 'EQUAL_WEIGHT'
  },
  benchmark: ['SPY'],
  exports: {
    csv: true,
    json: true,
    pdf: false
  }
});

export default function Builder() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { strategies, saveStrategy, updateStrategy, setCurrentStrategy, runBacktest, isRunning, currentStrategy } = useStrategyStore();
  
  const [config, setConfig] = useState<StrategyConfig>(getDefaultConfig());
  const [errors, setErrors] = useState<string[]>([]);
  const [activeStep, setActiveStep] = useState(0);
  const [symbolInput, setSymbolInput] = useState('');

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
      const healthCheck = await fetch(`${API_BASE_URL}/health`, { method: 'GET' });
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
      let current: any = newConfig;
      
      // Create intermediate objects if they don't exist
      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]] || typeof current[keys[i]] !== 'object') {
          current[keys[i]] = {};
        }
        current = current[keys[i]];
      }
      
      current[keys[keys.length - 1]] = value;
      
      // Special handling: when switching to CUSTOM_WEIGHTS, initialize weights if missing
      if (path === 'position_sizing.method' && value === 'CUSTOM_WEIGHTS') {
        if (!newConfig.position_sizing.custom_weights) {
          newConfig.position_sizing.custom_weights = {};
        }
        // Initialize any missing symbols with equal weight
        const numSymbols = newConfig.universe.symbols.length;
        if (numSymbols > 0) {
          const equalWeight = 1.0 / numSymbols;
          newConfig.universe.symbols.forEach((symbol: string) => {
            if (!(symbol in newConfig.position_sizing.custom_weights)) {
              newConfig.position_sizing.custom_weights[symbol] = equalWeight;
            }
          });
        }
      }
      
      // Special handling: when updating symbols list in CUSTOM_WEIGHTS mode
      if (path === 'universe.symbols' && newConfig.position_sizing.method === 'CUSTOM_WEIGHTS') {
        if (!newConfig.position_sizing.custom_weights) {
          newConfig.position_sizing.custom_weights = {};
        }
        
        // Remove weights for symbols no longer in the list
        const symbolSet = new Set(value);
        Object.keys(newConfig.position_sizing.custom_weights).forEach((symbol) => {
          if (!symbolSet.has(symbol)) {
            delete newConfig.position_sizing.custom_weights[symbol];
          }
        });
        
        // Add missing symbols with equal weight
        const numSymbols = value.length;
        if (numSymbols > 0) {
          const equalWeight = 1.0 / numSymbols;
          value.forEach((symbol: string) => {
            if (!(symbol in newConfig.position_sizing.custom_weights)) {
              newConfig.position_sizing.custom_weights[symbol] = equalWeight;
            }
          });
        }
      }
      
      return newConfig;
    });
  };

  const steps = [
    { id: 'basic', title: 'Strategy Info', icon: Target, description: 'Name and describe your strategy' },
    { id: 'universe', title: 'Select Assets', icon: BarChart3, description: 'Choose your investment universe' },
    { id: 'allocation', title: 'Allocation', icon: TrendingUp, description: 'Set position sizing method' },
    { id: 'account', title: 'Account Setup', icon: DollarSign, description: 'Configure account details' },
    { id: 'advanced', title: 'Advanced', icon: Settings, description: 'Fine-tune your strategy' }
  ];

  // Keyboard navigation - press Enter to go to next step
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInInput = ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName);
      
      console.log('Key pressed:', e.key, 'In input:', isInInput, 'Target:', target.tagName);
      
      // Only trigger if Enter is pressed and not in an input/textarea/select
      if (e.key === 'Enter' && !isInInput) {
        e.preventDefault();
        console.log('Enter pressed outside input, advancing step. Current step:', activeStep);
        
        // If on last step and can run backtest, trigger run
        if (activeStep === steps.length - 1 && !isRunning && config.universe.symbols.length > 0) {
          console.log('Running backtest from Enter key');
          handleRun();
        } 
        // Otherwise go to next step
        else if (activeStep < steps.length - 1) {
          console.log('Moving to next step:', activeStep + 1);
          setActiveStep(activeStep + 1);
        }
      }
    };

    console.log('Adding keyboard listener');
    document.addEventListener('keydown', handleKeyPress);
    return () => {
      console.log('Removing keyboard listener');
      document.removeEventListener('keydown', handleKeyPress);
    };
  }, [activeStep, isRunning, config.universe.symbols.length, handleRun]);

  const StepIndicator = ({ step, index, isActive, isCompleted }: any) => {
    const Icon = step.icon;
    return (
      <div className={`flex items-center ${index < steps.length - 1 ? 'flex-1' : ''}`}>
        <div className="flex flex-col items-center">
          <div className={`
            w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all duration-300
            ${isCompleted 
              ? 'bg-green-500 border-green-500 text-white' 
              : isActive 
                ? 'bg-blue-500 border-blue-500 text-white' 
                : 'bg-gray-100 border-gray-300 text-gray-400 dark:bg-gray-700 dark:border-gray-600'
            }
          `}>
            {isCompleted ? <CheckCircle className="h-6 w-6" /> : <Icon className="h-6 w-6" />}
          </div>
          <div className="mt-2 text-center">
            <div className={`text-sm font-medium ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'}`}>
              {step.title}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-500 max-w-20">
              {step.description}
            </div>
          </div>
        </div>
        {index < steps.length - 1 && (
          <div className={`flex-1 h-0.5 mx-4 ${index < activeStep ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-600'}`} />
        )}
      </div>
    );
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

        {/* Progress Steps */}
        <div className="mb-12">
          <div className="flex items-center justify-between max-w-4xl mx-auto">
            {steps.map((step, index) => (
              <StepIndicator
                key={step.id}
                step={step}
                index={index}
                isActive={index === activeStep}
                isCompleted={index < activeStep}
              />
            ))}
          </div>
        </div>

        {/* Error Display */}
        {errors.length > 0 && (
          <div className="mb-8 max-w-4xl mx-auto">
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6">
              <div className="flex items-start space-x-3">
                <AlertCircle className="h-6 w-6 text-red-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="font-semibold text-red-900 dark:text-red-200 mb-2">Configuration Errors</h3>
                  <ul className="text-sm text-red-800 dark:text-red-300 space-y-1">
                    {errors.map((error, i) => (
                      <li key={i} className="flex items-start">
                        <span className="mr-2">•</span>
                        <span>{error}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="max-w-4xl mx-auto">
          {/* Step 0: Basic Information */}
          {activeStep === 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 mb-8">
              <div className="flex items-center mb-6">
                <Target className="h-8 w-8 text-blue-500 mr-3" />
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Strategy Information</h2>
                  <p className="text-gray-600 dark:text-gray-400">Give your strategy a name and description</p>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Strategy Name
                  </label>
                  <input
                    type="text"
                    value={config.meta.name}
                    onChange={(e) => updateConfig('meta.name', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="Enter a memorable name for your strategy"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Description (Optional)
                  </label>
                  <textarea
                    value={config.meta.notes}
                    onChange={(e) => updateConfig('meta.notes', e.target.value)}
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                    placeholder="Describe your investment strategy, goals, or methodology..."
                  />
                </div>

                {/* Backtest Period */}
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Backtest Period
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Start Date
                      </label>
                      <input
                        type="date"
                        value={config.period.start}
                        onChange={(e) => updateConfig('period.start', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        End Date
                      </label>
                      <input
                        type="date"
                        value={config.period.end}
                        onChange={(e) => updateConfig('period.end', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      />
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-3">
                    Choose the date range for your backtest. Default: 2010-2023
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Step 1: Universe Selection */}
          {activeStep === 1 && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 mb-8">
              <div className="flex items-center mb-6">
                <BarChart3 className="h-8 w-8 text-blue-500 mr-3" />
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Select Your Assets</h2>
                  <p className="text-gray-600 dark:text-gray-400">Choose the ETFs and stocks for your portfolio</p>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                    Asset Symbols
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={symbolInput}
                      onChange={(e) => setSymbolInput(e.target.value.toUpperCase())}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const symbol = symbolInput.trim();
                          if (symbol && !config.universe.symbols.includes(symbol)) {
                            updateConfig('universe.symbols', [...config.universe.symbols, symbol]);
                            setSymbolInput('');
                          }
                        }
                      }}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="Type a ticker symbol and press Enter to add (e.g., VTI)"
                    />
                    <div className="absolute right-3 top-3">
                      <Plus className="h-5 w-5 text-gray-400" />
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                    Type each ticker symbol and press Enter to add it to your portfolio.
                  </p>
                </div>

                {/* Popular ETFs */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Popular ETFs</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {Object.entries(POPULAR_ETFS).map(([category, symbols]) => (
                      <div key={category} className="space-y-2">
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 capitalize">
                          {category.replace('_', ' ')}
                        </h4>
                        <div className="flex flex-wrap gap-1">
                          {symbols.map((symbol) => (
                            <button
                              key={symbol}
                              onClick={() => {
                                const currentSymbols = config.universe.symbols;
                                if (!currentSymbols.includes(symbol)) {
                                  updateConfig('universe.symbols', [...currentSymbols, symbol]);
                                }
                              }}
                              className={`px-3 py-1 text-xs rounded-full border transition-all ${
                                config.universe.symbols.includes(symbol)
                                  ? 'bg-blue-500 text-white border-blue-500'
                                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-blue-50 dark:hover:bg-gray-600'
                              }`}
                            >
                              {symbol}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Selected Assets Preview */}
                {config.universe.symbols.length > 0 && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4">
                    <h4 className="text-sm font-semibold text-blue-800 dark:text-blue-200 mb-2">
                      Selected Assets ({config.universe.symbols.length})
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {config.universe.symbols.map((symbol) => (
                        <div key={symbol} className="flex items-center bg-white dark:bg-gray-700 rounded-lg px-3 py-1 border">
                          <span className="text-sm font-medium text-gray-900 dark:text-white mr-2">{symbol}</span>
                          <button
                            onClick={() => {
                              updateConfig('universe.symbols', config.universe.symbols.filter(s => s !== symbol));
                            }}
                            className="text-gray-400 hover:text-red-500 transition-colors"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 2: Allocation Method */}
          {activeStep === 2 && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 mb-8">
              <div className="flex items-center mb-6">
                <TrendingUp className="h-8 w-8 text-blue-500 mr-3" />
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Portfolio Allocation</h2>
                  <p className="text-gray-600 dark:text-gray-400">Choose how to allocate your investments</p>
                </div>
              </div>

              <div className="space-y-6">
                {/* Allocation Method Selection */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
                    Allocation Method
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div 
                      className={`p-4 border-2 rounded-xl cursor-pointer transition-all ${
                        config.position_sizing.method === 'EQUAL_WEIGHT'
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-200 dark:border-gray-600 hover:border-blue-300'
                      }`}
                      onClick={() => updateConfig('position_sizing.method', 'EQUAL_WEIGHT')}
                    >
                      <div className="flex items-center mb-2">
                        <div className={`w-4 h-4 rounded-full border-2 mr-3 ${
                          config.position_sizing.method === 'EQUAL_WEIGHT'
                            ? 'border-blue-500 bg-blue-500'
                            : 'border-gray-300'
                        }`}>
                          {config.position_sizing.method === 'EQUAL_WEIGHT' && (
                            <div className="w-2 h-2 bg-white rounded-full mx-auto mt-0.5"></div>
                          )}
                        </div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">Equal Weight</h3>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 ml-7">
                        Allocate funds equally across all selected assets
                      </p>
                    </div>

                    <div 
                      className={`p-4 border-2 rounded-xl cursor-pointer transition-all ${
                        config.position_sizing.method === 'CUSTOM_WEIGHTS'
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-200 dark:border-gray-600 hover:border-blue-300'
                      }`}
                      onClick={() => updateConfig('position_sizing.method', 'CUSTOM_WEIGHTS')}
                    >
                      <div className="flex items-center mb-2">
                        <div className={`w-4 h-4 rounded-full border-2 mr-3 ${
                          config.position_sizing.method === 'CUSTOM_WEIGHTS'
                            ? 'border-blue-500 bg-blue-500'
                            : 'border-gray-300'
                        }`}>
                          {config.position_sizing.method === 'CUSTOM_WEIGHTS' && (
                            <div className="w-2 h-2 bg-white rounded-full mx-auto mt-0.5"></div>
                          )}
                        </div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">Custom Weights</h3>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 ml-7">
                        Set specific percentage allocations for each asset
                      </p>
                    </div>
                  </div>
                </div>

                {/* Custom Weights Configuration */}
                {config.position_sizing.method === 'CUSTOM_WEIGHTS' && config.universe.symbols.length > 0 && (
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      Set Asset Allocations
                    </h3>
                    <div className="space-y-4">
                      {config.universe.symbols.map((symbol) => {
                        const currentWeight = config.position_sizing.custom_weights?.[symbol] || 0;
                        return (
                          <div key={symbol} className="flex items-center space-x-4">
                            <div className="w-20 font-medium text-gray-900 dark:text-white">
                              {symbol}
                            </div>
                            <div className="flex-1">
                              <input
                                type="range"
                                min="0"
                                max="100"
                                value={currentWeight * 100}
                                onChange={(e) => {
                                  const newWeight = parseFloat(e.target.value) / 100;
                                  updateConfig(`position_sizing.custom_weights.${symbol}`, newWeight);
                                }}
                                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-600"
                              />
                            </div>
                            <div className="w-20">
                              <input
                                type="number"
                                min="0"
                                max="100"
                                step="0.1"
                                value={(currentWeight * 100).toFixed(1)}
                                onChange={(e) => {
                                  const newWeight = parseFloat(e.target.value) / 100;
                                  updateConfig(`position_sizing.custom_weights.${symbol}`, newWeight);
                                }}
                                className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                              />
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400 w-8">%</div>
                          </div>
                        );
                      })}
                      
                      {/* Total Allocation Display */}
                      <div className="border-t pt-4 mt-4">
                        <div className="flex justify-between items-center">
                          <span className="font-semibold text-gray-900 dark:text-white">Total Allocation:</span>
                          <span className={`font-bold text-lg ${
                            Math.abs(Object.values(config.position_sizing.custom_weights || {}).reduce((sum, weight) => sum + weight, 0) - 1) < 0.001
                              ? 'text-green-600'
                              : 'text-red-600'
                          }`}>
                            {(Object.values(config.position_sizing.custom_weights || {}).reduce((sum, weight) => sum + weight, 0) * 100).toFixed(1)}%
                          </span>
                        </div>
                        {Math.abs(Object.values(config.position_sizing.custom_weights || {}).reduce((sum, weight) => sum + weight, 0) - 1) >= 0.001 && (
                          <p className="text-sm text-red-600 mt-1">
                            Allocations should total 100%
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Equal Weight Preview */}
                {config.position_sizing.method === 'EQUAL_WEIGHT' && config.universe.symbols.length > 0 && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-200 mb-4">
                      Equal Weight Allocation Preview
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                      {config.universe.symbols.map((symbol) => (
                        <div key={symbol} className="bg-white dark:bg-gray-700 rounded-lg p-3 text-center">
                          <div className="font-semibold text-gray-900 dark:text-white">{symbol}</div>
                          <div className="text-blue-600 dark:text-blue-400 font-medium">
                            {(100 / config.universe.symbols.length).toFixed(1)}%
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 3: Account Setup */}
          {activeStep === 3 && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 mb-8">
              <div className="flex items-center mb-6">
                <DollarSign className="h-8 w-8 text-blue-500 mr-3" />
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Account Setup</h2>
                  <p className="text-gray-600 dark:text-gray-400">Configure your investment account details</p>
                </div>
              </div>

              <div className="space-y-8">
                {/* Account Type Selection */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
                    Account Type
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                      { value: 'Taxable', name: 'Taxable Account', description: 'Standard brokerage account' },
                      { value: 'Traditional IRA', name: 'Traditional IRA', description: 'Tax-deferred retirement' },
                      { value: 'Roth IRA', name: 'Roth IRA', description: 'Tax-free growth' },
                      { value: '529 Plan', name: '529 Plan', description: 'Education savings' }
                    ].map((account) => (
                      <div
                        key={account.value}
                        className={`p-4 border-2 rounded-xl cursor-pointer transition-all ${
                          config.account.type === account.value
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                            : 'border-gray-200 dark:border-gray-600 hover:border-blue-300'
                        }`}
                        onClick={() => updateConfig('account.type', account.value)}
                      >
                        <div className="flex items-center mb-2">
                          <div className={`w-4 h-4 rounded-full border-2 mr-3 ${
                            config.account.type === account.value
                              ? 'border-blue-500 bg-blue-500'
                              : 'border-gray-300'
                          }`}>
                            {config.account.type === account.value && (
                              <div className="w-2 h-2 bg-white rounded-full mx-auto mt-0.5"></div>
                            )}
                          </div>
                          <h3 className="font-semibold text-gray-900 dark:text-white text-sm">{account.name}</h3>
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-400 ml-7">
                          {account.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Initial Investment Amount */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                    Initial Investment Amount
                  </label>
                  <div className="relative max-w-md">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 text-lg">$</span>
                    </div>
                    <input
                      type="number"
                      min="1000"
                      step="1000"
                      value={config.initial_cash || 10000}
                      onChange={(e) => updateConfig('initial_cash', parseInt(e.target.value) || 10000)}
                      className="w-full pl-8 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-lg font-medium focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="10000"
                    />
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                    Starting amount to invest in your portfolio
                  </p>
                </div>

                {/* Regular Deposits */}
                <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Regular Deposits (Optional)
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Deposit Amount */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                        Deposit Amount
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <span className="text-gray-500">$</span>
                        </div>
                        <input
                          type="number"
                          min="0"
                          step="50"
                          value={config.deposits?.amount || 500}
                          onChange={(e) => updateConfig('deposits.amount', parseInt(e.target.value) || 0)}
                          className="w-full pl-8 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                          placeholder="500"
                        />
                      </div>
                    </div>

                    {/* Deposit Frequency */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                        Frequency
                      </label>
                      <select
                        value={config.deposits?.cadence || 'monthly'}
                        onChange={(e) => updateConfig('deposits.cadence', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      >
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                        <option value="quarterly">Quarterly</option>
                        <option value="yearly">Yearly</option>
                      </select>
                    </div>
                  </div>

                  {/* Annual Deposit Preview */}
                  {(config.deposits?.amount || 0) > 0 && (
                    <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <div className="text-sm text-blue-800 dark:text-blue-200">
                        <span className="font-medium">Annual deposits: </span>
                        ${((config.deposits?.amount || 0) * (
                          config.deposits?.cadence === 'daily' ? 365 :
                          config.deposits?.cadence === 'weekly' ? 52 :
                          config.deposits?.cadence === 'monthly' ? 12 :
                          config.deposits?.cadence === 'quarterly' ? 4 : 1
                        )).toLocaleString()}
                      </div>
                    </div>
                  )}
                </div>

                {/* Tax Settings */}
                <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Tax Configuration
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Federal Ordinary Tax Rate
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          min="0"
                          max="50"
                          step="1"
                          value={(config.account.tax?.federal_ordinary || 0.22) * 100}
                          onChange={(e) => updateConfig('account.tax.federal_ordinary', parseFloat(e.target.value) / 100)}
                          className="w-full px-3 py-2 pr-8 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        />
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                          <span className="text-gray-500 text-sm">%</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Capital Gains Tax Rate
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          min="0"
                          max="30"
                          step="1"
                          value={(config.account.tax?.federal_ltcg || 0.15) * 100}
                          onChange={(e) => updateConfig('account.tax.federal_ltcg', parseFloat(e.target.value) / 100)}
                          className="w-full px-3 py-2 pr-8 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        />
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                          <span className="text-gray-500 text-sm">%</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        State Tax Rate
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          min="0"
                          max="15"
                          step="0.5"
                          value={(config.account.tax?.state || 0.05) * 100}
                          onChange={(e) => updateConfig('account.tax.state', parseFloat(e.target.value) / 100)}
                          className="w-full px-3 py-2 pr-8 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        />
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                          <span className="text-gray-500 text-sm">%</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4">
                    <label className="flex items-start group">
                      <input
                        type="checkbox"
                        checked={config.account.tax?.apply_wash_sale !== false}
                        onChange={(e) => updateConfig('account.tax.apply_wash_sale', e.target.checked)}
                        className="w-4 h-4 mt-0.5 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                      />
                      <div className="ml-2 flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-700 dark:text-gray-300">
                            Apply tax-aware optimization (recommended)
                          </span>
                          <div className="relative group/tooltip">
                            <Info className="h-4 w-4 text-blue-500 hover:text-blue-600 cursor-help" />
                            <div className="absolute left-0 bottom-full mb-2 hidden group-hover/tooltip:block w-80 p-4 bg-gray-900 dark:bg-gray-800 text-white text-xs rounded-lg shadow-xl z-50 border border-gray-700">
                              <div className="font-semibold mb-2">Tax-Aware Optimization</div>
                              <div className="space-y-2 text-gray-300">
                                <p><strong>• Tax-Loss Harvesting:</strong> Strategically realizes losses to offset gains</p>
                                <p><strong>• HIFO Lot Selection:</strong> Sells highest-cost shares first to minimize gains</p>
                                <p><strong>• Wash Sale Avoidance:</strong> Prevents buying back within 30 days of a loss</p>
                                <p><strong>• Long-Term Preference:</strong> Favors holding positions &gt;1 year for lower tax rates</p>
                                <p className="pt-2 border-t border-gray-700">When enabled, the backtester makes trading decisions that minimize your tax burden, showing more realistic after-tax returns.</p>
                              </div>
                              <div className="absolute left-4 top-full w-2 h-2 bg-gray-900 dark:bg-gray-800 border-r border-b border-gray-700 transform rotate-45 -mt-1"></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Advanced Settings */}
          {activeStep === 4 && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 mb-8">
              <div className="flex items-center mb-6">
                <Settings className="h-8 w-8 text-blue-500 mr-3" />
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Advanced Settings</h2>
                  <p className="text-gray-600 dark:text-gray-400">Fine-tune your strategy with advanced options</p>
                </div>
              </div>

              <div className="space-y-8">
                {/* Rebalancing Configuration */}
                <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Rebalancing Strategy
                  </h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                        Rebalancing Type
                      </label>
                      <select
                        value={config.rebalancing?.type || 'calendar'}
                        onChange={(e) => updateConfig('rebalancing.type', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      >
                        <option value="calendar">Calendar-Based</option>
                        <option value="drift">Drift-Based</option>
                        <option value="cashflow_only">Cashflow Only</option>
                        <option value="both">Calendar + Drift</option>
                      </select>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                        {config.rebalancing?.type === 'calendar' && 'Rebalance on a fixed schedule'}
                        {config.rebalancing?.type === 'drift' && 'Rebalance when allocations drift too far'}
                        {config.rebalancing?.type === 'cashflow_only' && 'Only rebalance when adding money'}
                        {config.rebalancing?.type === 'both' && 'Rebalance on schedule OR when drifting'}
                      </p>
                    </div>

                    {/* Calendar Rebalancing Frequency */}
                    {(config.rebalancing?.type === 'calendar' || config.rebalancing?.type === 'both') && (
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                          Rebalancing Frequency
                        </label>
                        <select
                          value={config.rebalancing?.calendar?.period || 'Q'}
                          onChange={(e) => updateConfig('rebalancing.calendar.period', e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        >
                          <option value="M">Monthly</option>
                          <option value="Q">Quarterly</option>
                          <option value="A">Annually</option>
                        </select>
                      </div>
                    )}

                    {/* Drift Threshold */}
                    {(config.rebalancing?.type === 'drift' || config.rebalancing?.type === 'both') && (
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                          Drift Threshold
                        </label>
                        <div className="flex items-center space-x-4">
                          <input
                            type="range"
                            min="1"
                            max="20"
                            step="0.5"
                            value={((config.rebalancing?.drift?.abs_pct ?? 0.05) * 100)}
                            onChange={(e) => {
                              const value = parseFloat(e.target.value) / 100;
                              // Ensure drift object exists
                              if (!config.rebalancing.drift) {
                                updateConfig('rebalancing.drift', { abs_pct: value });
                              } else {
                                updateConfig('rebalancing.drift.abs_pct', value);
                              }
                            }}
                            className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-600"
                          />
                          <div className="w-24">
                            <input
                              type="number"
                              min="1"
                              max="20"
                              step="0.5"
                              value={((config.rebalancing?.drift?.abs_pct ?? 0.05) * 100).toFixed(1)}
                              onChange={(e) => {
                                const value = parseFloat(e.target.value) / 100;
                                // Ensure drift object exists
                                if (!config.rebalancing.drift) {
                                  updateConfig('rebalancing.drift', { abs_pct: value });
                                } else {
                                  updateConfig('rebalancing.drift.abs_pct', value);
                                }
                              }}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            />
                          </div>
                          <span className="text-sm text-gray-500">%</span>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                          Trigger rebalancing when any asset drifts {((config.rebalancing?.drift?.abs_pct ?? 0.05) * 100).toFixed(1)}% from target
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Dividend Handling */}
                <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Dividend Handling
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div 
                      className={`p-4 border-2 rounded-xl cursor-pointer transition-all ${
                        config.dividends?.mode === 'DRIP'
                          ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                          : 'border-gray-200 dark:border-gray-600 hover:border-green-300'
                      }`}
                      onClick={() => updateConfig('dividends.mode', 'DRIP')}
                    >
                      <div className="flex items-center mb-2">
                        <div className={`w-4 h-4 rounded-full border-2 mr-3 ${
                          config.dividends?.mode === 'DRIP'
                            ? 'border-green-500 bg-green-500'
                            : 'border-gray-300'
                        }`}>
                          {config.dividends?.mode === 'DRIP' && (
                            <div className="w-2 h-2 bg-white rounded-full mx-auto mt-0.5"></div>
                          )}
                        </div>
                        <h4 className="font-semibold text-gray-900 dark:text-white">DRIP (Reinvest)</h4>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 ml-7">
                        Automatically reinvest dividends for compounding
                      </p>
                    </div>

                    <div 
                      className={`p-4 border-2 rounded-xl cursor-pointer transition-all ${
                        config.dividends?.mode === 'CASH'
                          ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                          : 'border-gray-200 dark:border-gray-600 hover:border-green-300'
                      }`}
                      onClick={() => updateConfig('dividends.mode', 'CASH')}
                    >
                      <div className="flex items-center mb-2">
                        <div className={`w-4 h-4 rounded-full border-2 mr-3 ${
                          config.dividends?.mode === 'CASH'
                            ? 'border-green-500 bg-green-500'
                            : 'border-gray-300'
                        }`}>
                          {config.dividends?.mode === 'CASH' && (
                            <div className="w-2 h-2 bg-white rounded-full mx-auto mt-0.5"></div>
                          )}
                        </div>
                        <h4 className="font-semibold text-gray-900 dark:text-white">Hold as Cash</h4>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 ml-7">
                        Keep dividends as cash for strategic rebalancing
                      </p>
                    </div>
                  </div>
                </div>

                {/* Benchmark Selection */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                    Benchmark (Optional)
                  </label>
                  <input
                    type="text"
                    value={config.benchmark?.join(', ') || 'SPY'}
                    onChange={(e) => updateConfig('benchmark', e.target.value.split(',').map(s => s.trim()).filter(s => s))}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="SPY"
                  />
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                    Compare your strategy against a benchmark (e.g., SPY for S&P 500)
                  </p>
                </div>

                {/* Trading Costs */}
                <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Trading Costs
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                        Commission per Trade
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <span className="text-gray-500">$</span>
                        </div>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={config.frictions?.commission_per_trade || 0}
                          onChange={(e) => updateConfig('frictions.commission_per_trade', parseFloat(e.target.value) || 0)}
                          className="w-full pl-8 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                          placeholder="0.00"
                        />
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                        Most brokers offer $0 commission trades
                      </p>
                    </div>
                  </div>
                </div>

                {/* Strategy Summary */}
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    🎯 Strategy Summary
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Assets:</span>
                      <span className="ml-2 font-medium text-gray-900 dark:text-white">
                        {config.universe.symbols.length} selected
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Allocation:</span>
                      <span className="ml-2 font-medium text-gray-900 dark:text-white">
                        {config.position_sizing.method === 'EQUAL_WEIGHT' ? 'Equal Weight' : 'Custom Weights'}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Account:</span>
                      <span className="ml-2 font-medium text-gray-900 dark:text-white">
                        {config.account.type}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Rebalancing:</span>
                      <span className="ml-2 font-medium text-gray-900 dark:text-white">
                        {config.rebalancing?.type === 'calendar' ? 'Calendar-Based' :
                         config.rebalancing?.type === 'drift' ? 'Drift-Based' :
                         config.rebalancing?.type === 'both' ? 'Calendar + Drift' : 'Cashflow Only'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between items-center">
            <button
              onClick={() => setActiveStep(Math.max(0, activeStep - 1))}
              disabled={activeStep === 0}
              className={`px-6 py-3 rounded-xl font-medium transition-all ${
                activeStep === 0
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              Previous
            </button>

            <div className="flex space-x-4">
              <button
                onClick={handleSave}
                className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-xl font-medium transition-all flex items-center space-x-2"
              >
                <Save className="h-5 w-5" />
                <span>Save Strategy</span>
              </button>

              {activeStep < steps.length - 1 ? (
                <button
                  onClick={() => setActiveStep(Math.min(steps.length - 1, activeStep + 1))}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-all"
                >
                  Next Step
                </button>
              ) : (
                <button
                  onClick={handleRun}
                  disabled={isRunning || config.universe.symbols.length === 0}
                  className={`px-8 py-3 rounded-xl font-medium transition-all flex items-center space-x-2 ${
                    isRunning || config.universe.symbols.length === 0
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white shadow-lg'
                  }`}
                >
                  {isRunning ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>Running...</span>
                    </>
                  ) : (
                    <>
                      <Play className="h-5 w-5" />
                      <span>Run Backtest</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
