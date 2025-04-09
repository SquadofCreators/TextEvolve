import React from "react";
import SelectSetting from "./SelectSetting";
import SettingItem from "./SettingItem";
import { appPreferencesData } from "../../data/SettingsData";

const AppPreferences = () => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 transition-colors border border-gray-200 dark:border-gray-500">
      <h2 className="text-2xl font-bold mb-6">App Preferences</h2>
      <div className="space-y-5">

        {appPreferencesData.map((setting, index) => (
          <SettingItem
            key={index}
            data={setting}
            isLast={index === appPreferencesData.length - 1}
          />
        ))}
      </div>
    </div>
  );
};

export default AppPreferences;
