import { Outlet, Link, useLocation } from 'react-router-dom';
import { Moon, Sun, TrendingUp } from 'lucide-react';
import { useStrategyStore } from '@/stores/strategyStore';

export default function Layout() {
  const location = useLocation();
  const { theme, toggleTheme } = useStrategyStore();
  
  const navItems = [
    { path: '/', label: 'Home' },
    { path: '/builder', label: 'Builder' },
    { path: '/results', label: 'Results' },
  ];
  
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-white/95 dark:bg-gray-900/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:supports-[backdrop-filter]:bg-gray-900/60">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2">
              <TrendingUp className="h-6 w-6 text-primary-600" />
              <span className="text-xl font-bold">Backtester v1</span>
            </Link>
            
            {/* Navigation */}
            <nav className="flex items-center space-x-6">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`text-sm font-medium transition-colors hover:text-primary-600 ${
                    location.pathname === item.path
                      ? 'text-primary-600'
                      : 'text-gray-600 dark:text-gray-400'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
              
              {/* Theme toggle */}
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                aria-label="Toggle theme"
              >
                {theme === 'dark' ? (
                  <Sun className="h-5 w-5" />
                ) : (
                  <Moon className="h-5 w-5" />
                )}
              </button>
            </nav>
          </div>
        </div>
      </header>
      
      {/* Main content */}
      <main className="flex-1">
        <Outlet />
      </main>
      
      {/* Footer */}
      <footer className="border-t py-6 mt-auto">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
            <p>© 2024 Backtester v1. Production-ready tax-aware backtesting.</p>
            <p>Built with React, FastAPI, and Python</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
