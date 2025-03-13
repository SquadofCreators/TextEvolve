import React from 'react';

const ToggleSetting = ({ label, defaultChecked }) => {
  return (
    <div className="flex justify-between items-center border-b border-gray-200 dark:border-gray-700 pb-3">
      <span className="text-lg">{label}</span>
      <label className="relative inline-flex items-center cursor-pointer">
        <input
          type="checkbox"
          defaultChecked={defaultChecked}
          className="sr-only peer"
        />
        <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-orange-500 dark:peer-focus:ring-orange-400 rounded-full peer dark:bg-gray-600 
          peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all 
          peer-checked:bg-orange-500"
        ></div>
      </label>
    </div>
  );
};

export default ToggleSetting;
