import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import ThemeToggle from '../utility/ThemeToggle';
import SettingItem from './SettingItem';
import {displaySettingsData} from '../../data/SettingsData';

const DisplaySettings = () => {

  const { theme, setTheme } = useTheme();

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 transition-colors border border-gray-200 dark:border-gray-500">
      <h2 className="text-2xl font-bold mb-6 space-y-4">Display Settings</h2>
      <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 pb-3 mb-5">
        <span className="text-lg">Theme</span>
        <ThemeToggle theme={theme} setTheme={setTheme} />
      </div>
      <div className="space-y-4">
        {
          displaySettingsData.map((data, index) => {
            return (
              <SettingItem key={index} data={data} isLast={index === displaySettingsData.length - 1} />
            );
          })
        }
      </div>
    </div>
  );
};

export default DisplaySettings;
