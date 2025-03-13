import React from 'react';

const SettingItem = ({ data = {}, isLast = false }) => {
  const { label = '', actionText = '', disabled = false } = data;

  return (
    <div className={`flex justify-between items-center ${!isLast ? "border-b border-gray-200 dark:border-gray-700 pb-3" : ""} ${disabled ? "opacity-40" : ""}`}>
      <span className="text-lg">{label}</span>
      <button 
        className={`${disabled ? "cursor-not-allowed opacity-50" : "hover:underline"} ${actionText.toLowerCase() === 'delete' ? "text-red-500 font-medium" : "text-orange-500"} text-lg`}
        disabled={disabled}
      >
        {actionText}
      </button>
    </div>
  );
};

export default SettingItem;
