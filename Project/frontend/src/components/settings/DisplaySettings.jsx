import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import ThemeToggle from '../utility/ThemeToggle';

const DisplaySettings = () => {

  const { theme, setTheme } = useTheme();

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 transition-colors border border-gray-200 dark:border-gray-500">
      <h2 className="text-2xl font-bold mb-6">Display Settings</h2>
      <div className="flex items-center justify-between">
        <span className="text-lg">Theme</span>

        <ThemeToggle theme={theme} setTheme={setTheme} />
      </div>
    </div>
  );
};

export default DisplaySettings;
