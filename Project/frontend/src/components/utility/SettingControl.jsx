// src/components/SettingControl.jsx
import React from 'react';

const SettingControl = ({ data = {}, isLast = false }) => {
  const { label = '', actionText, inputField, disabled = false } = data;

  let control = null;

  if (inputField === 'button') {
    control = (
      <button 
        className={`${disabled ? "cursor-not-allowed opacity-50" : "hover:underline"} ${typeof actionText === 'string' && actionText.toLowerCase() === 'delete' ? "text-red-500 font-medium" : "text-orange-500"} text-lg`}
        disabled={disabled}
      >
        {actionText}
      </button>
    );
  } else if (inputField === 'toggle') {
    control = (
      <label className={`relative inline-flex items-center cursor-pointer ${disabled ? "cursor-not-allowed" : ""}`}>
        <input 
          type="checkbox" 
          defaultChecked={data.isChecked} 
          disabled={disabled} 
          className="sr-only peer" 
        />
        <div className="w-11 h-6 bg-gray-300 dark:bg-gray-600 rounded-full peer 
          peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-orange-500 dark:peer-focus:ring-orange-400
          peer-checked:bg-orange-500
          after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full peer-checked:after:border-white">
        </div>
      </label>
    );
  } else if (inputField === 'select') {
    // If actionText is an array, use it as options; otherwise, use the value as the sole option.
    const options = Array.isArray(actionText) ? actionText : [actionText];
    control = (
      <select 
        disabled={disabled} 
        className="px-2 py-1 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100"
      >
        {options.map((opt, idx) => (
          <option key={idx} value={opt}>{opt}</option>
        ))}
      </select>
    );
  }

  return (
    <div className={`flex justify-between items-center ${!isLast ? "border-b border-gray-200 dark:border-gray-700 pb-3" : ""} ${disabled ? "opacity-40" : ""}`}>
      <span className="text-lg">{label}</span>
      {control}
    </div>
  );
};

export default SettingControl;
