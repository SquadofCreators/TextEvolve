import React from 'react';
import ToggleSetting from './ToggleSetting';

const NotificationSettings = () => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 transition-colors border border-gray-200 dark:border-gray-500">
      <h2 className="text-2xl font-bold mb-6">Notification Settings</h2>
      <div className="space-y-5">
        <ToggleSetting label="Email Notifications" defaultChecked={true} />
        <ToggleSetting label="SMS Alerts" defaultChecked={false} />
      </div>
    </div>
  );
};

export default NotificationSettings;
