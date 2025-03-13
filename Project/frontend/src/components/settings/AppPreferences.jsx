import React from 'react';
import SelectSetting from './SelectSetting';

const AppPreferences = () => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 transition-colors border border-gray-200 dark:border-gray-500">
      <h2 className="text-2xl font-bold mb-6">App Preferences</h2>
      <div className="space-y-5">
        <SelectSetting label="Language" options={['English', 'Spanish', 'French']} />
        <SelectSetting label="Date Format" options={['MM/DD/YYYY', 'DD/MM/YYYY']} />
        <SelectSetting label="Default Output Format" options={['PDF', 'Word Document']} />
      </div>
    </div>
  );
};

export default AppPreferences;
