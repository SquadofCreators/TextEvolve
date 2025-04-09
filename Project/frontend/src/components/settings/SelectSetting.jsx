import React from 'react';

const SelectSetting = ({ label, options }) => {
  return (
    <div className="flex justify-between items-center border-b border-gray-200 dark:border-gray-700 pb-3">
      <span className="text-lg">{label}</span>
      <select className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-lg focus:outline-none">
        {options.map((option, idx) => (
          <option key={idx}>{option}</option>
        ))}
      </select>
    </div>
  );
};

export default SelectSetting;
