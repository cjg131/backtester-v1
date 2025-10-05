import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Play, BookOpen, TrendingUp, Shield, Zap, Star, Info, ExternalLink, X, RefreshCw } from 'lucide-react';
import { STRATEGY_TEMPLATES, getTemplatesByCategory, type StrategyTemplate, type FundAlternative } from '@/data/strategyTemplates';
import { getSecurityInfo, type SecurityInfo } from '@/data/securityInfo';
import { useStrategyStore } from '@/stores/strategyStore';

const categoryIcons = {
  'Conservative': Shield,
  'Moderate': TrendingUp,
  'Aggressive': Zap,
  'Specialized': Star
};

const riskColors = {
  1: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200',
  2: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200',
  3: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200',
  4: 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-200',
  5: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-200'
};

export default function Templates() {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedTemplate, setSelectedTemplate] = useState<StrategyTemplate | null>(null);
  const [selectedSecurity, setSelectedSecurity] = useState<SecurityInfo | null>(null);
  const [fundAlternativesModal, setFundAlternativesModal] = useState<{
    symbol: string;
    alternatives: FundAlternative[];
    currentTemplate: StrategyTemplate;
  } | null>(null);
  const [modifiedTemplates, setModifiedTemplates] = useState<Record<string, StrategyTemplate>>({});
  const [templateCustomizations, setTemplateCustomizations] = useState<{
    accountType: string;
    dividendMode: string;
    depositAmount: number;
    depositCadence: string;
    rebalancingType: string;
    rebalancingFrequency: string;
    driftThreshold: number;
  }>({
    accountType: 'Taxable',
    dividendMode: 'DRIP',
    depositAmount: 500,
    depositCadence: 'monthly',
    rebalancingType: 'calendar',
    rebalancingFrequency: 'Q',
    driftThreshold: 5.0
  });
  const { setCurrentStrategy } = useStrategyStore();

  const filteredTemplates = selectedCategory 
    ? getTemplatesByCategory(selectedCategory)
    : STRATEGY_TEMPLATES;

  const categories = ['Conservative', 'Moderate', 'Aggressive', 'Specialized'];

  const handleUseTemplate = (template: StrategyTemplate) => {
    const config = {
      ...template.config,
      meta: {
        name: template.name,
        notes: template.description
      },
      // Apply customizations
      account: {
        ...template.config.account,
        type: templateCustomizations.accountType as any
      },
      dividends: {
        ...template.config.dividends,
        mode: templateCustomizations.dividendMode as any
      },
      deposits: {
        ...template.config.deposits,
        amount: templateCustomizations.depositAmount,
        cadence: templateCustomizations.depositCadence as any,
        day_rule: template.config.deposits?.day_rule || '1',
        market_day_everyday: template.config.deposits?.market_day_everyday || false
      },
      rebalancing: {
        ...template.config.rebalancing,
        type: templateCustomizations.rebalancingType as any,
        calendar: (templateCustomizations.rebalancingType === 'calendar' || templateCustomizations.rebalancingType === 'both') ? {
          period: templateCustomizations.rebalancingFrequency as any
        } : template.config.rebalancing.calendar,
        drift: (templateCustomizations.rebalancingType === 'drift' || templateCustomizations.rebalancingType === 'both') ? {
          abs_pct: templateCustomizations.driftThreshold / 100
        } : template.config.rebalancing.drift
      }
    };
    setCurrentStrategy(config);
  };

  // Update customizations when template is selected
  useEffect(() => {
    if (selectedTemplate) {
      setTemplateCustomizations({
        accountType: selectedTemplate.config.account.type,
        dividendMode: selectedTemplate.config.dividends.mode,
        depositAmount: selectedTemplate.config.deposits?.amount || 500,
        depositCadence: selectedTemplate.config.deposits?.cadence || 'monthly',
        rebalancingType: selectedTemplate.config.rebalancing.type,
        rebalancingFrequency: selectedTemplate.config.rebalancing.calendar?.period || 'Q',
        driftThreshold: (selectedTemplate.config.rebalancing.drift?.abs_pct || 0.05) * 100
      });
    }
  }, [selectedTemplate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
            Strategy Templates
          </h1>
          <p className="text-gray-600 dark:text-gray-400 max-w-2xl text-lg">
            Start with proven, research-backed investment strategies. Each template is pre-configured 
            with optimal settings and can be customized to fit your needs.
          </p>
        </div>

        {/* Category Filter */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setSelectedCategory('')}
              className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                selectedCategory === '' 
                  ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg shadow-blue-500/50' 
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:shadow-md border border-gray-200 dark:border-gray-700'
              }`}
            >
              All Templates
            </button>
            {categories.map((category) => {
              const Icon = categoryIcons[category as keyof typeof categoryIcons];
              return (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center space-x-2 ${
                    selectedCategory === category 
                      ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg shadow-blue-500/50' 
                      : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:shadow-md border border-gray-200 dark:border-gray-700'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{category}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Templates Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredTemplates.map((originalTemplate) => {
            const template = modifiedTemplates[originalTemplate.id] || originalTemplate;
            const Icon = categoryIcons[template.category as keyof typeof categoryIcons];
            return (
              <div key={template.id} className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 hover:shadow-2xl transition-all border border-gray-100 dark:border-gray-700">
                {/* Header */}
                <div className="flex items-start justify-between mb-6">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      <Icon className="h-6 w-6 text-blue-600" />
                      <h3 className="font-bold text-xl text-gray-900 dark:text-white">{template.name}</h3>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                      {template.description}
                    </p>
                  </div>
                </div>

                {/* Metadata */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
                    <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Risk Level</span>
                    <div className="flex items-center space-x-2 mt-2">
                      <span className={`px-3 py-1 rounded-lg text-sm font-bold ${riskColors[template.riskLevel]}`}>
                        {template.riskLevel}/5
                      </span>
                    </div>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
                    <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Time Horizon</span>
                    <p className="font-semibold text-gray-900 dark:text-white mt-2">{template.timeHorizon}</p>
                  </div>
                </div>

                {/* Asset Allocation */}
                <div className="mb-6" key={`allocation-${Object.keys(template.config.position_sizing.custom_weights || {}).join('-')}`}>
                  <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">Asset Allocation</h4>
                  <div className="space-y-2">
                    {Object.entries(template.config.position_sizing.custom_weights || {}).map(([symbol, weight]) => {
                      const securityInfo = getSecurityInfo(symbol);
                      const hasAlternatives = template.fundAlternatives && template.fundAlternatives[symbol];
                      return (
                        <div key={symbol} className="flex justify-between items-center bg-blue-50 dark:bg-blue-900/20 rounded-lg px-3 py-2">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => securityInfo && setSelectedSecurity(securityInfo)}
                              className={`font-semibold transition-colors ${
                                securityInfo 
                                  ? 'text-blue-600 dark:text-blue-400 hover:text-blue-700 cursor-pointer' 
                                  : 'text-gray-900 dark:text-gray-100'
                              }`}
                              disabled={!securityInfo}
                            >
                              {symbol}
                            </button>
                            <div className="flex items-center space-x-1">
                              {securityInfo && (
                                <Info className="h-3.5 w-3.5 text-gray-400" />
                              )}
                              {hasAlternatives && (
                                <button
                                  onClick={() => setFundAlternativesModal({
                                    symbol,
                                    alternatives: template.fundAlternatives![symbol],
                                    currentTemplate: template
                                  })}
                                  className="text-blue-500 hover:text-blue-600 transition-colors"
                                  title="View fund alternatives"
                                >
                                  <RefreshCw className="h-3.5 w-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                          <span className="font-bold text-gray-900 dark:text-white">{(weight * 100).toFixed(0)}%</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Tags */}
                <div className="mb-6">
                  <div className="flex flex-wrap gap-2">
                    {template.tags.slice(0, 4).map((tag) => (
                      <span key={tag} className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs font-medium rounded-lg">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex space-x-3">
                  <button
                    onClick={() => setSelectedTemplate(template)}
                    className="flex-1 px-6 py-3 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl font-semibold hover:bg-gray-200 dark:hover:bg-gray-600 transition-all"
                  >
                    Learn More
                  </button>
                  <Link
                    to="/builder"
                    onClick={() => handleUseTemplate(template)}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-blue-500/50 transition-all flex items-center justify-center space-x-2"
                  >
                    <Play className="h-4 w-4" />
                    <span>Use Template</span>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Template Detail Modal */}
      {selectedTemplate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-900 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold">{selectedTemplate.name}</h2>
                <button
                  onClick={() => setSelectedTemplate(null)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  ✕
                </button>
              </div>

              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {selectedTemplate.description}
              </p>

              <div className="grid grid-cols-2 gap-6 mb-6">
                <div>
                  <h3 className="font-semibold text-green-700 dark:text-green-300 mb-2">✅ Pros</h3>
                  <ul className="space-y-1 text-sm">
                    {selectedTemplate.pros.map((pro, index) => (
                      <li key={index} className="text-gray-600 dark:text-gray-400">• {pro}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold text-red-700 dark:text-red-300 mb-2">⚠️ Cons</h3>
                  <ul className="space-y-1 text-sm">
                    {selectedTemplate.cons.map((con, index) => (
                      <li key={index} className="text-gray-600 dark:text-gray-400">• {con}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="font-semibold mb-3">Customize Configuration</h3>
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Account Type */}
                    <div>
                      <label className="block text-sm font-medium mb-2">Account Type</label>
                      <select
                        value={templateCustomizations.accountType}
                        onChange={(e) => setTemplateCustomizations(prev => ({ ...prev, accountType: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-sm"
                      >
                        <option value="Taxable">Taxable</option>
                        <option value="Traditional IRA">Traditional IRA</option>
                        <option value="Roth IRA">Roth IRA</option>
                        <option value="529 Plan">529 Plan</option>
                      </select>
                      <p className="text-xs text-gray-500 mt-1">
                        {templateCustomizations.accountType === 'Taxable' && 'Flexible access, taxable gains'}
                        {templateCustomizations.accountType === 'Traditional IRA' && 'Tax-deferred growth, RMDs required'}
                        {templateCustomizations.accountType === 'Roth IRA' && 'Tax-free growth, contribution limits'}
                        {templateCustomizations.accountType === '529 Plan' && 'Tax-free for education expenses'}
                      </p>
                    </div>

                    {/* Dividend Strategy */}
                    <div>
                      <label className="block text-sm font-medium mb-2">Dividend Strategy</label>
                      <select
                        value={templateCustomizations.dividendMode}
                        onChange={(e) => setTemplateCustomizations(prev => ({ ...prev, dividendMode: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-sm"
                      >
                        <option value="DRIP">DRIP (Reinvest)</option>
                        <option value="CASH">Hold as Cash</option>
                      </select>
                      <p className="text-xs text-gray-500 mt-1">
                        {templateCustomizations.dividendMode === 'DRIP' && 'Automatic reinvestment for compounding'}
                        {templateCustomizations.dividendMode === 'CASH' && 'Strategic rebalancing with cash'}
                      </p>
                    </div>

                    {/* Deposit Cadence */}
                    <div>
                      <label className="block text-sm font-medium mb-2">Deposit Frequency</label>
                      <select
                        value={templateCustomizations.depositCadence}
                        onChange={(e) => setTemplateCustomizations(prev => ({ ...prev, depositCadence: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-sm"
                      >
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                        <option value="quarterly">Quarterly</option>
                        <option value="yearly">Yearly</option>
                      </select>
                    </div>

                    {/* Deposit Amount */}
                    <div>
                      <label className="block text-sm font-medium mb-2">Deposit Amount</label>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm">$</span>
                        <input
                          type="number"
                          min="0"
                          step="50"
                          value={templateCustomizations.depositAmount}
                          onChange={(e) => setTemplateCustomizations(prev => ({ ...prev, depositAmount: parseInt(e.target.value) || 0 }))}
                          className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-sm"
                        />
                        <span className="text-xs text-gray-500">per {
                          templateCustomizations.depositCadence === 'daily' ? 'day' :
                          templateCustomizations.depositCadence === 'weekly' ? 'week' :
                          templateCustomizations.depositCadence === 'monthly' ? 'month' :
                          templateCustomizations.depositCadence === 'quarterly' ? 'quarter' :
                          templateCustomizations.depositCadence === 'yearly' ? 'year' :
                          templateCustomizations.depositCadence
                        }</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        ${(templateCustomizations.depositAmount * (
                          templateCustomizations.depositCadence === 'daily' ? 365 :
                          templateCustomizations.depositCadence === 'weekly' ? 52 :
                          templateCustomizations.depositCadence === 'monthly' ? 12 :
                          templateCustomizations.depositCadence === 'quarterly' ? 4 : 1
                        )).toLocaleString()}/year
                      </p>
                    </div>

                    {/* Rebalancing Strategy */}
                    <div>
                      <label className="block text-sm font-medium mb-2">Rebalancing Strategy</label>
                      <select
                        value={templateCustomizations.rebalancingType}
                        onChange={(e) => setTemplateCustomizations(prev => ({ ...prev, rebalancingType: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-sm"
                      >
                        <option value="calendar">Calendar-Based</option>
                        <option value="drift">Drift-Based</option>
                        <option value="cashflow_only">Cashflow Only</option>
                        <option value="both">Calendar + Drift</option>
                      </select>
                      <p className="text-xs text-gray-500 mt-1">
                        {templateCustomizations.rebalancingType === 'calendar' && 'Rebalance on fixed schedule'}
                        {templateCustomizations.rebalancingType === 'drift' && 'Rebalance when allocations drift too far'}
                        {templateCustomizations.rebalancingType === 'cashflow_only' && 'Only rebalance when adding money'}
                        {templateCustomizations.rebalancingType === 'both' && 'Rebalance on schedule OR when drifting'}
                      </p>
                    </div>

                    {/* Rebalancing Frequency (only for calendar-based) */}
                    {(templateCustomizations.rebalancingType === 'calendar' || templateCustomizations.rebalancingType === 'both') && (
                      <div>
                        <label className="block text-sm font-medium mb-2">Rebalancing Frequency</label>
                        <select
                          value={templateCustomizations.rebalancingFrequency}
                          onChange={(e) => setTemplateCustomizations(prev => ({ ...prev, rebalancingFrequency: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-sm"
                        >
                          <option value="M">Monthly</option>
                          <option value="Q">Quarterly</option>
                          <option value="A">Annually</option>
                        </select>
                        <p className="text-xs text-gray-500 mt-1">
                          {templateCustomizations.rebalancingFrequency === 'M' && 'Rebalance every month (more frequent trading)'}
                          {templateCustomizations.rebalancingFrequency === 'Q' && 'Rebalance every quarter (balanced approach)'}
                          {templateCustomizations.rebalancingFrequency === 'A' && 'Rebalance annually (minimal trading)'}
                        </p>
                      </div>
                    )}

                    {/* Drift Threshold (only for drift-based) */}
                    {(templateCustomizations.rebalancingType === 'drift' || templateCustomizations.rebalancingType === 'both') && (
                      <div>
                        <label className="block text-sm font-medium mb-2">Drift Threshold</label>
                        <div className="flex items-center space-x-2">
                          <input
                            type="number"
                            min="1"
                            max="20"
                            step="0.5"
                            value={templateCustomizations.driftThreshold}
                            onChange={(e) => setTemplateCustomizations(prev => ({ ...prev, driftThreshold: parseFloat(e.target.value) || 5.0 }))}
                            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-sm"
                          />
                          <span className="text-sm">%</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {templateCustomizations.driftThreshold <= 2 && 'Very sensitive - frequent rebalancing'}
                          {templateCustomizations.driftThreshold > 2 && templateCustomizations.driftThreshold <= 5 && 'Balanced - moderate rebalancing'}
                          {templateCustomizations.driftThreshold > 5 && templateCustomizations.driftThreshold <= 10 && 'Conservative - less frequent rebalancing'}
                          {templateCustomizations.driftThreshold > 10 && 'Very conservative - rare rebalancing'}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          Rebalance when any asset drifts {templateCustomizations.driftThreshold}% from target allocation
                        </p>
                      </div>
                    )}
                  </div>

                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => setSelectedTemplate(null)}
                  className="flex-1 btn btn-secondary"
                >
                  Close
                </button>
                <Link
                  to="/builder"
                  onClick={() => {
                    handleUseTemplate(selectedTemplate);
                    setSelectedTemplate(null);
                  }}
                  className="flex-1 btn btn-primary flex items-center justify-center space-x-2"
                >
                  <Play className="h-4 w-4" />
                  <span>Use This Template</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Security Information Modal */}
      {selectedSecurity && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-900 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <div className="flex items-center space-x-3 mb-2">
                    <h2 className="text-2xl font-bold">{selectedSecurity.symbol}</h2>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      selectedSecurity.type === 'ETF' 
                        ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200'
                        : 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200'
                    }`}>
                      {selectedSecurity.type}
                    </span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${riskColors[selectedSecurity.riskLevel]}`}>
                      Risk: {selectedSecurity.riskLevel}/5
                    </span>
                  </div>
                  <h3 className="text-lg text-gray-600 dark:text-gray-400">{selectedSecurity.name}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-500">{selectedSecurity.category}</p>
                </div>
                <button
                  onClick={() => setSelectedSecurity(null)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              {/* Description */}
              <div className="mb-6">
                <p className="text-gray-700 dark:text-gray-300">{selectedSecurity.description}</p>
              </div>

              {/* Key Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {selectedSecurity.expenseRatio && (
                  <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Expense Ratio</p>
                    <p className="text-lg font-semibold">{selectedSecurity.expenseRatio}%</p>
                  </div>
                )}
                {selectedSecurity.dividendYield && (
                  <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Dividend Yield</p>
                    <p className="text-lg font-semibold">{selectedSecurity.dividendYield}%</p>
                  </div>
                )}
                {selectedSecurity.aum && (
                  <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Assets (AUM)</p>
                    <p className="text-lg font-semibold">{selectedSecurity.aum}</p>
                  </div>
                )}
                {selectedSecurity.inception && (
                  <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Inception</p>
                    <p className="text-lg font-semibold">{selectedSecurity.inception}</p>
                  </div>
                )}
              </div>

              {/* Top Holdings */}
              {selectedSecurity.topHoldings && (
                <div className="mb-6">
                  <h4 className="font-semibold mb-3">Top Holdings</h4>
                  <div className="space-y-2">
                    {selectedSecurity.topHoldings.slice(0, 5).map((holding, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span>{holding.name}</span>
                        <span className="font-medium">{holding.weight}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Sector Allocation */}
              {selectedSecurity.sectors && (
                <div className="mb-6">
                  <h4 className="font-semibold mb-3">Sector Allocation</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {selectedSecurity.sectors.slice(0, 6).map((sector, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span>{sector.name}</span>
                        <span className="font-medium">{sector.weight}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Pros and Cons */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h4 className="font-semibold text-green-700 dark:text-green-300 mb-3">✅ Pros</h4>
                  <ul className="space-y-1 text-sm">
                    {selectedSecurity.pros.map((pro, index) => (
                      <li key={index} className="text-gray-600 dark:text-gray-400">• {pro}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-red-700 dark:text-red-300 mb-3">⚠️ Cons</h4>
                  <ul className="space-y-1 text-sm">
                    {selectedSecurity.cons.map((con, index) => (
                      <li key={index} className="text-gray-600 dark:text-gray-400">• {con}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Key Features */}
              <div className="mb-6">
                <h4 className="font-semibold mb-3">Key Features</h4>
                <ul className="space-y-1 text-sm">
                  {selectedSecurity.keyFeatures.map((feature, index) => (
                    <li key={index} className="text-gray-600 dark:text-gray-400">• {feature}</li>
                  ))}
                </ul>
              </div>

              {/* Actions */}
              <div className="flex space-x-3">
                <button
                  onClick={() => setSelectedSecurity(null)}
                  className="flex-1 btn btn-secondary"
                >
                  Close
                </button>
                {selectedSecurity.website && (
                  <a
                    href={selectedSecurity.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 btn btn-primary flex items-center justify-center space-x-2"
                  >
                    <ExternalLink className="h-4 w-4" />
                    <span>View Official Page</span>
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Fund Alternatives Modal */}
      {fundAlternativesModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-900 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold">Fund Alternatives for {fundAlternativesModal.symbol}</h2>
                  <p className="text-gray-600 dark:text-gray-400 mt-1">
                    Choose a different fund that achieves the same investment goal
                  </p>
                </div>
                <button
                  onClick={() => setFundAlternativesModal(null)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              {/* Current Fund */}
              <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
                  Current: {fundAlternativesModal.symbol}
                </h3>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  {getSecurityInfo(fundAlternativesModal.symbol)?.name || fundAlternativesModal.symbol}
                </p>
              </div>

              {/* Fund Cards Comparison */}
              <div className="mb-6">
                <h3 className="font-semibold mb-4">Choose Your Alternative:</h3>
                
                {/* Current Fund Card */}
                <div className="mb-4 p-4 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 rounded-xl border-2 border-blue-200 dark:border-blue-700">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                        {fundAlternativesModal.symbol.slice(0, 2)}
                      </div>
                      <div>
                        <h4 className="font-bold text-blue-800 dark:text-blue-200">{fundAlternativesModal.symbol}</h4>
                        <p className="text-sm text-blue-600 dark:text-blue-300">
                          {getSecurityInfo(fundAlternativesModal.symbol)?.name || 'Current Selection'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="px-3 py-1 bg-blue-500 text-white text-xs font-medium rounded-full">
                        Currently Selected
                      </div>
                      <div className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                        {getSecurityInfo(fundAlternativesModal.symbol)?.expenseRatio || 'N/A'}% expense ratio
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h5 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">✅ Strengths</h5>
                      <div className="space-y-1">
                        {getSecurityInfo(fundAlternativesModal.symbol)?.pros.slice(0, 2).map((pro, i) => (
                          <div key={i} className="text-sm text-blue-700 dark:text-blue-300">• {pro}</div>
                        )) || <span className="text-sm text-blue-600">Template default choice</span>}
                      </div>
                    </div>
                    <div>
                      <h5 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">⚠️ Considerations</h5>
                      <div className="space-y-1">
                        {getSecurityInfo(fundAlternativesModal.symbol)?.cons.slice(0, 2).map((con, i) => (
                          <div key={i} className="text-sm text-blue-700 dark:text-blue-300">• {con}</div>
                        )) || <span className="text-sm text-blue-600">Standard risks apply</span>}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Alternative Fund Cards */}
                <div className="space-y-3">
                  {fundAlternativesModal.alternatives.map((alternative, index) => {
                    const currentER = getSecurityInfo(fundAlternativesModal.symbol)?.expenseRatio || 0;
                    const altER = alternative.expenseRatio || 0;
                    const isLowerCost = altER < currentER;
                    const isHigherCost = altER > currentER;
                    const isBestCost = altER === Math.min(...fundAlternativesModal.alternatives.map(a => a.expenseRatio || 0));
                    
                    return (
                      <div key={index} className={`relative p-4 rounded-xl border-2 transition-all hover:shadow-lg ${
                        isBestCost && isLowerCost 
                          ? 'bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-700' 
                          : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                      }`}>
                        
                        {/* Best Deal Badge */}
                        {isBestCost && isLowerCost && (
                          <div className="absolute -top-2 -right-2 px-3 py-1 bg-green-500 text-white text-xs font-bold rounded-full shadow-lg">
                            💰 Best Deal
                          </div>
                        )}
                        
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold ${
                              alternative.provider === 'Vanguard' ? 'bg-red-500' :
                              alternative.provider === 'Fidelity' ? 'bg-green-600' :
                              alternative.provider === 'Schwab' ? 'bg-blue-600' :
                              alternative.provider === 'iShares' ? 'bg-purple-600' :
                              alternative.provider === 'ARK' ? 'bg-indigo-600' :
                              'bg-gray-500'
                            }`}>
                              {alternative.symbol.slice(0, 2)}
                            </div>
                            <div>
                              <h4 className="font-bold text-lg">{alternative.symbol}</h4>
                              <p className="text-sm text-gray-600 dark:text-gray-400">{alternative.name}</p>
                              <div className="flex items-center space-x-2 mt-1">
                                <span className={`px-2 py-1 text-xs rounded-full ${
                                  alternative.provider === 'Vanguard' ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-200' :
                                  alternative.provider === 'Fidelity' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200' :
                                  alternative.provider === 'Schwab' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-200' :
                                  alternative.provider === 'iShares' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-200' :
                                  'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                                }`}>
                                  {alternative.provider}
                                </span>
                                <div className="flex items-center space-x-1">
                                  <span className={`text-lg font-bold ${isLowerCost ? 'text-green-600' : isHigherCost ? 'text-red-600' : 'text-gray-700 dark:text-gray-300'}`}>
                                    {alternative.expenseRatio}%
                                  </span>
                                  {isLowerCost && <span className="text-xs text-green-600 font-medium">↓ Lower</span>}
                                  {isHigherCost && <span className="text-xs text-red-600 font-medium">↑ Higher</span>}
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <button
                            onClick={() => {
                              // Update the template with the new fund
                              const currentWeights = fundAlternativesModal.currentTemplate.config.position_sizing.custom_weights || {};
                              const oldWeight = currentWeights[fundAlternativesModal.symbol] || 0;
                              
                              // Create new weights object with the alternative fund
                              const newWeights = { ...currentWeights };
                              delete newWeights[fundAlternativesModal.symbol]; // Remove old fund
                              newWeights[alternative.symbol] = oldWeight; // Add new fund with same weight
                              
                              // Update the fund alternatives mapping
                              const updatedFundAlternatives = { ...fundAlternativesModal.currentTemplate.fundAlternatives };
                              if (updatedFundAlternatives && updatedFundAlternatives[fundAlternativesModal.symbol]) {
                                const originalAlternatives = updatedFundAlternatives[fundAlternativesModal.symbol];
                                
                                // Create new alternatives list: remove the selected alternative, add the original fund
                                const newAlternatives = [
                                  // Add the original fund as an alternative
                                  {
                                    symbol: fundAlternativesModal.symbol,
                                    name: getSecurityInfo(fundAlternativesModal.symbol)?.name || fundAlternativesModal.symbol,
                                    reason: 'Original template choice',
                                    expenseRatio: getSecurityInfo(fundAlternativesModal.symbol)?.expenseRatio || 0,
                                    provider: getSecurityInfo(fundAlternativesModal.symbol)?.name?.includes('Vanguard') ? 'Vanguard' :
                                             getSecurityInfo(fundAlternativesModal.symbol)?.name?.includes('Fidelity') ? 'Fidelity' :
                                             getSecurityInfo(fundAlternativesModal.symbol)?.name?.includes('Schwab') ? 'Schwab' :
                                             getSecurityInfo(fundAlternativesModal.symbol)?.name?.includes('iShares') ? 'iShares' : 'Various'
                                  },
                                  // Add the other alternatives (excluding the one we just selected)
                                  ...originalAlternatives.filter(alt => alt.symbol !== alternative.symbol)
                                ];
                                
                                // Set alternatives for the new symbol
                                updatedFundAlternatives[alternative.symbol] = newAlternatives;
                                delete updatedFundAlternatives[fundAlternativesModal.symbol];
                              }
                              
                              // Update the template in the modal
                              const updatedTemplate = {
                                ...fundAlternativesModal.currentTemplate,
                                config: {
                                  ...fundAlternativesModal.currentTemplate.config,
                                  position_sizing: {
                                    ...fundAlternativesModal.currentTemplate.config.position_sizing,
                                    custom_weights: newWeights
                                  }
                                },
                                fundAlternatives: updatedFundAlternatives
                              };
                              
                              // Save the modified template
                              setModifiedTemplates(prev => ({
                                ...prev,
                                [updatedTemplate.id]: updatedTemplate
                              }));
                              
                              // Close both modals to return to template grid
                              setFundAlternativesModal(null);
                              setSelectedTemplate(null);
                              
                              console.log('Fund switched from', fundAlternativesModal.symbol, 'to', alternative.symbol);
                              console.log('Updated weights:', newWeights);
                              console.log('Saved modified template:', updatedTemplate.id);
                            }}
                            className={`px-6 py-2 rounded-lg font-medium transition-all ${
                              isBestCost && isLowerCost
                                ? 'bg-green-500 hover:bg-green-600 text-white shadow-lg'
                                : 'bg-primary-600 hover:bg-primary-700 text-white'
                            }`}
                          >
                            {isBestCost && isLowerCost ? '🚀 Switch to Best' : 'Switch to This'}
                          </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <h5 className="text-sm font-medium text-green-700 dark:text-green-300 mb-2">✅ Why Switch</h5>
                            <div className="space-y-1">
                              <div className="text-sm text-green-700 dark:text-green-300">• {alternative.reason}</div>
                              {alternative.expenseRatio === 0 && (
                                <div className="text-sm text-green-700 dark:text-green-300">• Zero expense ratio!</div>
                              )}
                              {alternative.provider === 'Fidelity' && (
                                <div className="text-sm text-green-700 dark:text-green-300">• No minimum investment</div>
                              )}
                              {alternative.provider === 'Schwab' && (
                                <div className="text-sm text-green-700 dark:text-green-300">• Schwab ecosystem benefits</div>
                              )}
                            </div>
                          </div>
                          <div>
                            <h5 className="text-sm font-medium text-orange-700 dark:text-orange-300 mb-2">⚠️ Trade-offs</h5>
                            <div className="space-y-1">
                              {alternative.expenseRatio && alternative.expenseRatio > 0.20 ? (
                                <div className="text-sm text-orange-700 dark:text-orange-300">• Higher fees than current</div>
                              ) : alternative.provider === 'ARK' ? (
                                <div className="text-sm text-orange-700 dark:text-orange-300">• Higher volatility expected</div>
                              ) : alternative.symbol.includes('MUB') || alternative.symbol.includes('MUNI') ? (
                                <div className="text-sm text-orange-700 dark:text-orange-300">• Tax reporting complexity</div>
                              ) : (
                                <div className="text-sm text-gray-600 dark:text-gray-400">• Similar risk profile</div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Actions */}
              <div className="flex space-x-3">
                <button
                  onClick={() => setFundAlternativesModal(null)}
                  className="flex-1 btn btn-secondary"
                >
                  Keep Original
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
