// src/components/utility/ThemeToggle.jsx
import React from 'react';
import { FiSun, FiMoon, FiMonitor } from 'react-icons/fi';

/**
 * Props:
 *  theme (string)      - 'light' | 'dark' | 'system'
 *  setTheme (function) - updates the theme
 */
function ThemeToggle({ theme, setTheme }) {
  return (

    <div className="flex items-center justify-between w-full space-x-2 border-b border-gray-200 dark:border-gray-700 pb-3 mb-3">
      <span className='text-lg text-gray-800 dark:text-gray-100'>
        Theme
      </span>
      <div className="flex items-center justify-center space-x-1 border border-gray-300 dark:border-gray-700 rounded-full p-1">
        {/* Light Mode */}
        <button
          onClick={() => setTheme('light')}
          className={`p-1.5 rounded-full transition-colors cursor-pointer ${
            theme === 'light' ? 'bg-gray-200 dark:bg-gray-600' : ''
          }`}
          title="Light Mode"
        >
          <FiSun className="w-4 h-4" />
        </button>

        {/* System Mode */}
        <button
          onClick={() => setTheme('system')}
          className={`p-1.5 rounded-full transition-colors cursor-pointer ${
            theme === 'system' ? 'bg-gray-200 dark:bg-gray-600' : ''
          }`}
          title="System / Auto"
        >
          <FiMonitor className="w-4 h-4" />
        </button>

        {/* Dark Mode */}
        <button
          onClick={() => setTheme('dark')}
          className={`p-1.5 rounded-full transition-colors cursor-pointer ${
            theme === 'dark' ? 'bg-gray-200 dark:bg-gray-600' : ''
          }`}
          title="Dark Mode"
        >
          <FiMoon className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export default ThemeToggle;
