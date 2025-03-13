import React from 'react';
import SettingItem from './SettingItem';

const PrivacySecurity = () => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 transition-colors border border-gray-200 dark:border-gray-500">
      <h2 className="text-2xl font-bold mb-6">Privacy & Security</h2>
      <div className="space-y-5">
        <SettingItem label="Two-Factor Authentication" actionText="Enable" />
        <SettingItem label="Manage Data Exports" actionText="Export" />
      </div>
    </div>
  );
};

export default PrivacySecurity;
