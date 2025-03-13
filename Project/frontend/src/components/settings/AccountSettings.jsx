// src/components/AccountSettings.jsx
import React from 'react';
import SettingItem from './SettingItem';
import { accountSettingData } from '../../data/SetiingsData';

const AccountSettings = () => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 transition-colors duration-200">
      <h2 className="text-2xl font-bold mb-6">Account Settings</h2>

      <div className="space-y-4">
        {accountSettingData.map((setting, index) => (
          <SettingItem 
            key={index} 
            data={setting}
          />
        ))}
      </div>
    </div>
  );
};

export default AccountSettings;
