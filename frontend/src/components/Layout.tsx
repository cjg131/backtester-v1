import { useEffect, useState, useRef } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Moon, Sun, Monitor, Sparkles, ChevronDown } from 'lucide-react';
import { useStrategyStore } from '@/stores/strategyStore';

export default function Layout() {
  const location = useLocation();
  const { theme, setTheme } = useStrategyStore();
  const [systemTheme, setSystemTheme] = useState<'light' | 'dark'>('dark');
  const [isThemeDropdownOpen, setIsThemeDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Detect system theme preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setSystemTheme(mediaQuery.matches ? 'dark' : 'light');

    const handleChange = (e: MediaQueryListEvent) => {
      setSystemTheme(e.matches ? 'dark' : 'light');
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Apply dark mode class to document
  useEffect(() => {
    const isDark = theme === 'dark' || (theme === 'system' && systemTheme === 'dark');
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme, systemTheme]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsThemeDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getThemeIcon = (themeType: 'light' | 'dark' | 'system') => {
    if (themeType === 'dark') return <Moon className="h-5 w-5" />;
    if (themeType === 'light') return <Sun className="h-5 w-5" />;
    return <Monitor className="h-5 w-5" />;
  };

  const getThemeLabel = (themeType: 'light' | 'dark' | 'system') => {
    if (themeType === 'dark') return 'Dark';
    if (themeType === 'light') return 'Light';
    return 'System';
  };
  
  const navItems = [
    { path: '/', label: 'Home' },
    { path: '/builder', label: 'Build Strategy' },
    { path: '/templates', label: 'Templates' },
    { path: '/compare', label: 'Compare' },
    { path: '/results', label: 'Results' },
  ];
  
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2 group">
              <div className="p-2 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-lg shadow-md group-hover:shadow-lg transition-all">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">StrategyLab</span>
            </Link>
            
            {/* Navigation */}
            <nav className="flex items-center space-x-1">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                    location.pathname === item.path
                      ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-md'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
              
              {/* Theme dropdown */}
              <div className="relative ml-2" ref={dropdownRef}>
                <button
                  onClick={() => setIsThemeDropdownOpen(!isThemeDropdownOpen)}
                  className="px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex items-center space-x-2"
                  aria-label="Change theme"
                >
                  <span className="text-gray-700 dark:text-gray-300">{getThemeIcon(theme)}</span>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{getThemeLabel(theme)}</span>
                  <ChevronDown className={`h-4 w-4 text-gray-700 dark:text-gray-300 transition-transform ${isThemeDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown menu */}
                {isThemeDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-40 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden z-50">
                    {(['system', 'dark', 'light'] as const).map((themeOption) => (
                      <button
                        key={themeOption}
                        onClick={() => {
                          setTheme(themeOption);
                          setIsThemeDropdownOpen(false);
                        }}
                        className={`w-full px-4 py-3 flex items-center space-x-3 transition-colors ${
                          theme === themeOption
                            ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                            : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        <span>{getThemeIcon(themeOption)}</span>
                        <span className="text-sm font-medium">{getThemeLabel(themeOption)}</span>
                        {theme === themeOption && (
                          <span className="ml-auto text-blue-600 dark:text-blue-400">✓</span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </nav>
          </div>
        </div>
      </header>
      
      {/* Main content */}
      <main className="flex-1">
        <Outlet />
      </main>
      
      {/* Footer */}
      <footer className="border-t border-gray-200 dark:border-gray-800 py-6 mt-auto bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
            <p>© {new Date().getFullYear()} <span className="font-semibold text-gray-900 dark:text-white">StrategyLab</span>. Production-ready tax-aware backtesting.</p>
            <p>Built with React, FastAPI, and Python</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
