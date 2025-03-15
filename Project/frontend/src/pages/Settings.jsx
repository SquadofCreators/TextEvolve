// src/pages/Settings.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { IoIosArrowBack } from "react-icons/io";
import SettingControl from '../components/utility/SettingControl';
import { useTheme } from '../contexts/ThemeContext';
import ThemeToggle from '../components/utility/ThemeToggle';
import { 
  accountSettingData, 
  displaySettingsData, 
  appPreferencesData, 
  notificationSettingsData,
  privacySettingsData
} from '../data/SettingsData';
import PageHeader from '../components/utility/PageHeader';

const Settings = () => {

  const { theme, setTheme } = useTheme();

  return (
    <div className="bg-gray-100 dark:bg-gray-900 rounded-xl shadow-lg p-2 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200">
      <div className="max-w-5xl mx-auto px-2 py-4">
        {/* Header Navigation */}
        <PageHeader 
          title="Settings" 
          link="/" 
          heading="Manage Your Preferences"
          description="Configure your account details, privacy settings, notifications, and more."
        />

        {/* Settings Sections */}
        <section className="space-y-10">
          {/* Account Settings */}
          <div className='bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 transition-colors duration-200'>
            <h2 className="text-2xl font-bold mb-4">Account Settings</h2>
            <div className="space-y-4">
              {accountSettingData.map((setting, index) => (
                <SettingControl 
                  key={index} 
                  data={setting} 
                  isLast={index === accountSettingData.length - 1}
                />
              ))}
            </div>
          </div>

          {/* App Preferences */}
          <div className='bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 transition-colors duration-200'>
            <h2 className="text-2xl font-bold mb-4">App Preferences</h2>
            {/* Theme */}
            <ThemeToggle theme={theme} setTheme={setTheme} />

            <div className="space-y-4">
              {appPreferencesData.map((setting, index) => (
                <SettingControl 
                  key={index} 
                  data={setting} 
                  isLast={index === appPreferencesData.length - 1}
                />
              ))}
            </div>
          </div>

          {/* Notification Settings */}
          <div className='bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 transition-colors duration-200'>
            <h2 className="text-2xl font-bold mb-4">Notification Settings</h2>
            <div className="space-y-4">
              {notificationSettingsData.map((setting, index) => (
                <SettingControl 
                  key={index} 
                  data={setting} 
                  isLast={index === notificationSettingsData.length - 1}
                />
              ))}
            </div>
          </div>

          {/* Privacy & Security */}
          <div className='bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 transition-colors duration-200'>
            <h2 className="text-2xl font-bold mb-4">Privacy & Security</h2>
            <div className="space-y-4">
              {
                privacySettingsData.map((setting, index) => (
                  <SettingControl
                    key={index}
                    data={setting}
                    isLast={index === privacySettingsData.length - 1}
                  />
                ))
              }
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Settings;
