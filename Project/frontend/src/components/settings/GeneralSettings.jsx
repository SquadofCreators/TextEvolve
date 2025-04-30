import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types'; // Import PropTypes
import { motion } from 'framer-motion';
import { useTheme } from '../../contexts/ThemeContext'; // Adjust path if needed
import ThemeToggle from '../utility/ThemeToggle'; // Adjust path if needed
import {
    FiGlobe, FiClock, FiType, FiSave, FiAlertTriangle, FiChevronDown // FiLoader removed
} from 'react-icons/fi';
import { MdInvertColors } from "react-icons/md";
import Loader from '../Loader'; // <-- Import the reusable Loader component

// Assuming sectionVariants is defined elsewhere for animations
// import { sectionVariants } from '../../utils/styleConstants'; // Adjust path
// Example variant if not imported:
const sectionVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" } },
    exit: { opacity: 0, y: -10, transition: { duration: 0.2, ease: "easeIn" } }
};

// Example Timezones (Keep example or replace with dynamic list generation)
const commonTimezones = [
    { value: 'Asia/Kolkata', label: 'India Standard Time (IST, UTC+5:30)' },
    { value: 'Europe/London', label: 'London (GMT/BST, UTC+0/1)' },
    { value: 'America/New_York', label: 'New York (EST/EDT, UTC-5/4)' },
    { value: 'America/Los_Angeles', label: 'Los Angeles (PST/PDT, UTC-8/7)' },
    { value: 'UTC', label: 'Coordinated Universal Time (UTC)' },
    // Consider adding more based on Intl.supportedValuesOf('timeZone') if browser support is sufficient
    // Example: Dynamically generate using:
    // Intl.supportedValuesOf('timeZone').map(tz => ({ value: tz, label: tz.replace(/_/g, ' ') }))
];

// Supported UI Languages
const supportedLanguages = [
    { code: 'en', name: 'English' },
    { code: 'ta', name: 'தமிழ் (Tamil)' },
    // Add other languages the UI actually supports
];

function GeneralSettingsContent({ initialData, onSave, isSavingGeneral, showSaveStatus }) {
    const { theme, setTheme } = useTheme(); // Get theme context

    // --- State for settings ---
    const [settings, setSettings] = useState({
        // Default values, will be overridden by initialData
        appLanguage: 'en',
        timezone: 'Asia/Kolkata', // Consider defaulting based on Intl.DateTimeFormat().resolvedOptions().timeZone
        fontSize: 'default',
        ...initialData // Merge initial data loaded by parent
    });

    // Effect to synchronize state if initialData prop changes after mount
    useEffect(() => {
        // Only update if initialData actually has values, prevent overwriting defaults unnecessarily
        if (initialData && Object.keys(initialData).length > 0) {
            setSettings(prev => ({ ...prev, ...initialData }));
        }
    }, [initialData]);

    // --- Handlers ---

    // General change handler for select dropdowns
    const handleChange = (e) => {
        const { name, value } = e.target;
        setSettings(prev => ({ ...prev, [name]: value }));
        // Optionally, trigger side effects immediately (like changing language)
        // if (name === 'appLanguage') { /* i18n.changeLanguage(value); */ }
    };

    // Handler specifically for font size buttons
    const handleFontSizeChange = (size) => {
        setSettings(prev => ({ ...prev, fontSize: size }));
        // Apply the font size change globally (example using class on root element)
        try {
            const root = document.documentElement;
            root.classList.remove('text-sm', 'text-lg'); // Remove previous size classes
            if(size === 'small') {
                root.classList.add('text-sm');
            } else if (size === 'large') {
                root.classList.add('text-lg');
            }
            console.log("Applied font size class:", size);
            // Persist preference locally?
            // localStorage.setItem('preferredFontSize', size);
        } catch (error) {
            console.error("Failed to apply font size class:", error);
        }
    };

    // Handle form submission to save settings
    const handleSave = (e) => {
        e.preventDefault(); // Prevent default form submission
        if (onSave) {
            onSave(settings); // Call the parent save handler passed via props
        } else {
            console.warn("GeneralSettingsContent: onSave handler not provided.");
            // Optionally show a status message if showSaveStatus is available
            if (showSaveStatus) {
                showSaveStatus(false, "Save function not configured.", "save_error", 3000);
            }
        }
    };

    // --- Render Logic ---
    return (
        <motion.section
            key="general"
            variants={sectionVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            // Apply card styling to the motion section wrapper
            className="bg-white dark:bg-gray-800 p-6 md:p-8 rounded-lg shadow border border-gray-200 dark:border-gray-700"
            aria-labelledby="general-settings-heading" // Add accessibility label
        >
            <h2 id="general-settings-heading" className="sr-only">General Settings</h2>
            {/* Use form for semantic grouping */}
            <form onSubmit={handleSave}>
                {/* Container for setting rows with vertical dividers */}
                <div className="divide-y divide-gray-200 dark:divide-gray-700 space-y-6 md:space-y-8">

                    {/* --- App Theme Setting Row --- */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-3 pt-6 md:pt-8 first:pt-0">
                        {/* Left Column: Label & Description */}
                        <div className="md:col-span-2">
                            <label className="flex items-center text-base font-semibold text-gray-900 dark:text-gray-100">
                                <MdInvertColors className="w-5 h-5 mr-2 text-orange-500 flex-shrink-0" aria-hidden="true"/>
                                Appearance
                            </label>
                            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                Choose how the application looks. Changes apply instantly.
                            </p>
                        </div>
                        {/* Right Column: Control */}
                        <div className="md:col-span-1 flex items-center md:justify-end">
                            {/* Assuming ThemeToggle handles its own labels */}
                            <ThemeToggle theme={theme} setTheme={setTheme} />
                        </div>
                    </div>

                    {/* --- App Language Setting Row --- */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-3 pt-6 md:pt-8 first:pt-0">
                        {/* Left Column: Label & Description */}
                        <div className="md:col-span-2">
                            <label htmlFor="appLanguage" className="flex items-center text-base font-semibold text-gray-900 dark:text-gray-100">
                                <FiGlobe className="w-5 h-5 mr-2 text-orange-500 flex-shrink-0" aria-hidden="true"/>
                                Language
                            </label>
                            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                Select the display language for the interface.
                            </p>
                        </div>
                        {/* Right Column: Control */}
                        <div className="md:col-span-1 flex items-center md:justify-end">
                            <div className="relative w-full max-w-xs">
                                <select
                                    id="appLanguage"
                                    name="appLanguage"
                                    value={settings.appLanguage}
                                    onChange={handleChange}
                                    // Integrated select styles using Tailwind
                                    className="block w-full appearance-none rounded-md border border-gray-300 dark:border-gray-600 shadow-sm py-2 pl-3 pr-10 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-orange-500 focus:border-orange-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                >
                                    {supportedLanguages.map(lang => (
                                        <option key={lang.code} value={lang.code}>{lang.name}</option>
                                    ))}
                                </select>
                                {/* Chevron Icon */}
                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500 dark:text-gray-400">
                                    <FiChevronDown className="w-5 h-5" aria-hidden="true"/>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* --- Timezone Setting Row --- */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-3 pt-6 md:pt-8 first:pt-0">
                        {/* Left Column: Label & Description */}
                        <div className="md:col-span-2">
                            <label htmlFor="timezone" className="flex items-center text-base font-semibold text-gray-900 dark:text-gray-100">
                                <FiClock className="w-5 h-5 mr-2 text-orange-500 flex-shrink-0" aria-hidden="true"/>
                                Timezone
                            </label>
                            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                Affects how dates and times (e.g., batch creation time) are displayed.
                            </p>
                        </div>
                        {/* Right Column: Control */}
                        <div className="md:col-span-1 flex items-center md:justify-end">
                            <div className="relative w-full max-w-xs">
                                <select
                                    id="timezone"
                                    name="timezone"
                                    value={settings.timezone}
                                    onChange={handleChange}
                                    // Integrated select styles using Tailwind
                                    className="block w-full appearance-none rounded-md border border-gray-300 dark:border-gray-600 shadow-sm py-2 pl-3 pr-10 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-orange-500 focus:border-orange-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                >
                                    {/* Add a default/placeholder if needed */}
                                    {/* <option value="" disabled>Select timezone</option> */}
                                    {commonTimezones.map(tz => (
                                        <option key={tz.value} value={tz.value}>{tz.label}</option>
                                    ))}
                                </select>
                                 {/* Chevron Icon */}
                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500 dark:text-gray-400">
                                    <FiChevronDown className="w-5 h-5" aria-hidden="true"/>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* --- Font Size Setting Row --- */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-3 pt-6 md:pt-8 first:pt-0">
                        {/* Left Column: Label & Description */}
                        <div className="md:col-span-2">
                            {/* Use label association with the button group */}
                            <label id="fontSizeLabel" className="flex items-center text-base font-semibold text-gray-900 dark:text-gray-100">
                                <FiType className="w-5 h-5 mr-2 text-orange-500 flex-shrink-0" aria-hidden="true"/>
                                Text Size
                            </label>
                            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                Adjust the application's base font size for readability. Affects most text.
                            </p>
                        </div>
                        {/* Right Column: Control - Segmented Button Group */}
                        <div className="md:col-span-1 flex items-center md:justify-end">
                            {/* Add role and aria-labelledby to the group */}
                            <div className="inline-flex space-x-1 bg-gray-100 dark:bg-gray-900 p-1 rounded-lg" role="group" aria-labelledby="fontSizeLabel">
                                {['small', 'default', 'large'].map((size) => (
                                    <button
                                        key={size}
                                        type="button"
                                        onClick={() => handleFontSizeChange(size)}
                                        className={`px-3 py-1.5 rounded-md text-xs font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-1 dark:focus-visible:ring-offset-gray-900 transition-colors duration-150 capitalize ${
                                            settings.fontSize === size
                                                ? 'bg-white dark:bg-gray-700 text-orange-600 dark:text-orange-400 shadow' // Active style
                                                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200' // Inactive style
                                        }`}
                                        aria-pressed={settings.fontSize === size} // Indicate selection state
                                    >
                                        {size}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                </div> {/* End of settings rows container */}

                {/* --- Save Action Area --- */}
                <div className="flex justify-end pt-8 mt-8 border-t border-gray-200 dark:border-gray-700">
                    <button
                        type="submit"
                        // Apply Tailwind classes directly for primary button style
                        className="inline-flex items-center justify-center px-5 py-2 border border-transparent text-sm font-semibold rounded-md shadow-sm text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-800 focus:ring-orange-500 disabled:opacity-60 disabled:cursor-not-allowed transition-colors duration-150"
                        style={{ minWidth: '190px' }} // Adjusted min-width for longer text
                        disabled={isSavingGeneral} // Disable button while saving
                        aria-live="polite" // Announce loading state changes
                    >
                        {isSavingGeneral ? (
                            <>
                                {/* Use the Loader component */}
                                <Loader className="w-4 h-4 text-white mr-2"/>
                                <span>Saving...</span>
                            </>
                        ) : (
                            <>
                                <FiSave className="w-4 h-4 mr-2" aria-hidden="true"/>
                                <span>Save General Settings</span>
                            </>
                        )}
                    </button>
                </div>

            </form>
        </motion.section>
    );
}

// Add PropTypes for GeneralSettingsContent
GeneralSettingsContent.propTypes = {
  /** Initial settings data loaded by the parent component */
  initialData: PropTypes.shape({
    appLanguage: PropTypes.string,
    timezone: PropTypes.string,
    fontSize: PropTypes.oneOf(['small', 'default', 'large']),
  }),
  /** Callback function triggered when the save button is clicked. Receives the current settings state. */
  onSave: PropTypes.func.isRequired,
  /** Boolean indicating if the saving operation is currently in progress */
  isSavingGeneral: PropTypes.bool,
  /** Function to display global status messages (optional) */
  showSaveStatus: PropTypes.func,
};

GeneralSettingsContent.defaultProps = {
  initialData: {},
  isSavingGeneral: false,
};


export default GeneralSettingsContent;