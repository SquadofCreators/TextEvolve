import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { Link } from 'react-router-dom';
import { IoIosArrowBack } from "react-icons/io";
import AccountSettings from '../components/settings/AccountSettings';
import AppPreferences from '../components/settings/AppPreferences';
import DisplaySettings from '../components/settings/DisplaySettings';
import NotificationSettings from '../components/settings/NotificationSettings';
import PrivacySecurity from '../components/settings/PrivacySecurity';

const Settings = () => {
  const { darkMode, toggleTheme } = useTheme();

  return (
    <div className="bg-gray-50 dark:bg-gray-900 rounded-xl shadow-lg p-2 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200">
      <div className="max-w-5xl mx-auto px-2 py-4">
        <div className='flex justify-between px-2 mb-8'>
          <Link 
          className="flex items-center gap-0.5 text-gray-600 dark:text-gray-300 hover:text-orange-500 transition-colors"
          to="/"
          >
            <IoIosArrowBack className="text-lg" />
            <span className="font-medium">Back</span>
          </Link>
          <h1 className="text-xl font-extrabold dark:text-gray-200">Settings</h1>
        </div>

        {/* Page Header */}
        <header className="mb-10 text-center">
          <p className="text-lg text-gray-500 dark:text-gray-400">
            Customize your TextEvolve experience
          </p>
        </header>

        {/* Settings Sections */}
        <section className="space-y-10">
          <AccountSettings />
          <AppPreferences />
          <DisplaySettings darkMode={darkMode} toggleTheme={toggleTheme} />
          <NotificationSettings />
          <PrivacySecurity />
        </section>
      </div>
    </div>
  );
};

export default Settings;
