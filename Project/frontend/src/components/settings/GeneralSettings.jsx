import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../../contexts/ThemeContext'; // Adjust path if needed
import ThemeToggle from '../utility/ThemeToggle'; // Adjust path if needed
import { FiGlobe, FiClock, FiType, FiSave, FiLoader, FiAlertTriangle, FiChevronDown } from 'react-icons/fi'; // Added icons
import { MdInvertColors } from "react-icons/md";

import { sectionVariants, selectStyles, buttonPrimaryStyles } from '../../utils/styleConstants'; // Adjust path

// Example Timezones (In reality, use a library like moment-timezone or Intl API for a full list)
const commonTimezones = [
  { value: 'Asia/Kolkata', label: 'India Standard Time (IST, UTC+5:30)' },
  { value: 'Europe/London', label: 'London (GMT/BST, UTC+0/1)' },
  { value: 'America/New_York', label: 'New York (EST/EDT, UTC-5/4)' },
  { value: 'America/Los_Angeles', label: 'Los Angeles (PST/PDT, UTC-8/7)' },
  { value: 'UTC', label: 'Coordinated Universal Time (UTC)' },
];

// Supported UI Languages
const supportedLanguages = [
    { code: 'en', name: 'English' },
    { code: 'ta', name: 'தமிழ் (Tamil)' },
    // Add other languages UI supports
];

function GeneralSettingsContent({ initialData, onSave, isSavingGeneral, showSaveStatus }) {
  const { theme, setTheme } = useTheme();
  const [settings, setSettings] = useState({
    appLanguage: 'en',
    timezone: 'Asia/Kolkata',
    fontSize: 'default', // 'small', 'default', 'large'
    ...initialData // Merge initial data loaded by parent
  });

  // Sync with prop changes
  useEffect(() => {
    setSettings(prev => ({ ...prev, ...initialData }));
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSettings(prev => ({ ...prev, [name]: value }));
  };

  // Handler specifically for font size buttons
  const handleFontSizeChange = (size) => {
      setSettings(prev => ({ ...prev, fontSize: size }));
      // TODO: Implement logic to actually change app font size
      // This usually involves setting a class on the <html> or <body> element
      // E.g., document.documentElement.classList.remove('text-sm', 'text-lg');
      // if(size === 'small') document.documentElement.classList.add('text-sm');
      // if(size === 'large') document.documentElement.classList.add('text-lg');
      console.log("Font size preference set to:", size);
  };


  const handleSave = (e) => {
    e.preventDefault();
    onSave(settings); // Call parent save handler
  };

  // Helper for font size button style
  const fontSizeButtonStyle = (size) => {
      const base = "px-3 py-1 border rounded-md text-xs font-medium transition-colors duration-150";
      const active = "bg-orange-500 border-orange-500 text-white shadow-sm";
      const inactive = "bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600";
      return `${base} ${settings.fontSize === size ? active : inactive}`;
  }

  return (
    <motion.section key="general" variants={sectionVariants} initial="hidden" animate="visible" exit="exit">
      {/* Use form for semantics, even if save button is separate */}
      <form onSubmit={handleSave} className="space-y-8 bg-white dark:bg-gray-800 p-6 md:p-8 rounded-lg shadow border border-gray-200 dark:border-gray-700">

        {/* --- App Theme --- */}
        <div className="flex items-center justify-between pb-4 border-b dark:border-gray-700">
          <div>
              <label className="flex items-center text-base font-medium text-gray-700 dark:text-gray-200">
                <MdInvertColors className="w-4 h-4 mr-2 text-orange-500"/>
                 Appearance Theme
              </label>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Switch between light and dark mode.</p>
          </div>
          <ThemeToggle theme={theme} setTheme={setTheme} />
        </div>

        {/* --- App Language --- */}
        <div className="flex items-center justify-between pb-4 border-b dark:border-gray-700">
          <div className=''>
            <label htmlFor="appLanguage" className="flex items-center text-base font-medium text-gray-700 dark:text-gray-200 mb-1">
                <FiGlobe className="w-4 h-4 mr-2 text-orange-500"/> Application Language
            </label>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Select the display language for the TextEvolve interface.</p>
          </div>
            <div className="relative max-w-xs">
                <select
                    id="appLanguage"
                    name="appLanguage"
                    value={settings.appLanguage}
                    onChange={handleChange}
                    className={selectStyles}
                >
                    {supportedLanguages.map(lang => (
                        <option key={lang.code} value={lang.code}>{lang.name}</option>
                    ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700 dark:text-gray-400"><FiChevronDown className="w-4 h-4" /></div>
            </div>
        </div>

        {/* --- Timezone --- */}
        <div className="flex items-center justify-between pb-4 border-b dark:border-gray-700s">
          <div>
            <label htmlFor="timezone" className="flex items-center text-base font-medium text-gray-700 dark:text-gray-200 mb-1">
                <FiClock className="w-4 h-4 mr-2 text-orange-500"/> Timezone
            </label>
             <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Affects how dates and times (like batch creation) are displayed.</p>
          </div>
          <div className="relative max-w-xs">
              <select
                  id="timezone"
                  name="timezone"
                  value={settings.timezone}
                  onChange={handleChange}
                  className={selectStyles}
              >
                {/* Add a default option */}
                <option value="" disabled>Select your timezone</option>
                  {commonTimezones.map(tz => (
                      <option key={tz.value} value={tz.value}>{tz.label}</option>
                  ))}
                  {/* Consider adding more or using Intl.supportedValuesOf('timeZone') */}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700 dark:text-gray-400"><FiChevronDown className="w-4 h-4" /></div>
          </div>
        </div>

        {/* --- Accessibility: Font Size --- */}
        <div className="flex items-center justify-between pb-4 border-b dark:border-gray-700">
          <div>
            <label className="flex items-center text-base font-medium text-gray-700 dark:text-gray-200 mb-1">
              <FiType className="w-4 h-4 mr-2 text-orange-500"/> Text Size
            </label>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">Adjust the application's base font size for readability.</p>
          </div>
          <div className="flex items-center space-x-2">
            <button type="button" onClick={() => handleFontSizeChange('small')} className={fontSizeButtonStyle('small')}>Small</button>
            <button type="button" onClick={() => handleFontSizeChange('default')} className={fontSizeButtonStyle('default')}>Default</button>
            <button type="button" onClick={() => handleFontSizeChange('large')} className={fontSizeButtonStyle('large')}>Large</button>
          </div>
        </div>

        {/* --- Save Button --- */}
        <div className="pt-4">
            <button type="submit" className={buttonPrimaryStyles} disabled={isSavingGeneral}>
                {isSavingGeneral ? <><FiLoader className="w-4 h-4 mr-2 animate-spin"/> Saving...</> : <> <FiSave className="w-4 h-4 mr-2"/> Save General Settings </>}
            </button>
             {/* Status message will be shown by the parent's indicator */}
        </div>

      </form>
    </motion.section>
  );
}

export default GeneralSettingsContent;