// src/components/SettingItem.jsx
import React from 'react';

const SettingItem = ({ data = {} }) => {
  const { label = '', actionText = '', disabled = false } = data;

  return (
    <div className={`flex justify-between items-center border-b border-gray-200 dark:border-gray-700 pb-3 ${disabled ? "opacity-40" : ""}`}>
      <span className="text-lg">{label}</span>
      <button 
        className={`${actionText.toLowerCase() === 'delete' ? "text-red-500 font-medium" : "text-orange-500"} hover:underline text-lg`}
      >
        {actionText}
      </button>
    </div>
  );
};

export default SettingItem;
