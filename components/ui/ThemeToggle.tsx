'use client';

import { useTheme } from '@/lib/theme-context';
import { Sun, Moon } from 'lucide-react';

export default function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();

  const toggleTheme = () => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
  };

  return (
    <div className="flex items-center gap-3">
      {/* Light Label */}
      <span className={`text-sm font-medium transition-colors ${
        resolvedTheme === 'light' ? 'text-gray-900' : 'text-gray-400 dark:text-slate-500'
      }`}>
        Light
      </span>

      {/* Toggle Switch */}
      <button
        onClick={toggleTheme}
        className="relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900"
        style={{
          backgroundColor: resolvedTheme === 'dark' ? '#f59e0b' : '#d1d5db'
        }}
        aria-label="Toggle theme"
      >
        <span
          className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-lg transition-transform ${
            resolvedTheme === 'dark' ? 'translate-x-6' : 'translate-x-1'
          }`}
        >
          {resolvedTheme === 'dark' ? (
            <Moon className="w-3 h-3 text-amber-500 m-auto mt-1" />
          ) : (
            <Sun className="w-3 h-3 text-gray-600 m-auto mt-1" />
          )}
        </span>
      </button>

      {/* Dark Label */}
      <span className={`text-sm font-medium transition-colors ${
        resolvedTheme === 'dark' ? 'text-slate-100 dark:text-slate-100' : 'text-gray-400'
      }`}>
        Dark
      </span>
    </div>
  );
}
