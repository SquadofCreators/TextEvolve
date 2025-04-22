// src/components/settings/PreferencesSettings.jsx
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiLoader, FiSave, FiBell, FiChevronDown } from 'react-icons/fi';
import { selectStyles, checkboxStyles, buttonPrimaryStyles, sectionVariants } from '../../utils/styleConstants'; // Adjust path
import ThemeToggle from '../utility/ThemeToggle';
import { useTheme } from '../../contexts/ThemeContext';

function PreferencesSettingsContent({ token, initialPrefsData, isSavingPrefs, onSavePrefs, showSaveStatus }) {
    const [preferencesData, setPreferencesData] = useState(initialPrefsData);

    const { theme, setTheme } = useTheme();

    // Sync with initial data if it loads after mount
    useEffect(() => {
        setPreferencesData(initialPrefsData);
    }, [initialPrefsData]);

    const handlePrefsChange = (e) => {
        const { name, value, type, checked } = e.target;
        setPreferencesData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSavePrefs(preferencesData); // Call parent handler to save
    };

    return (
        <motion.section key="preferences" variants={sectionVariants} initial="hidden" animate="visible" exit="exit">
             {/* Use form tag here for semantics */}
             <form onSubmit={handleSubmit} className="space-y-6">
                <div className="flex flex-col gap-6">
                    <div>
                        <label htmlFor="defaultFormat" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Default Export Format</label>
                        <div className="relative">
                            <select name="defaultFormat" id="defaultFormat" value={preferencesData.defaultFormat} onChange={handlePrefsChange} className={selectStyles}>
                                <option value="pdf">Searchable PDF</option>
                                <option value="docx">Word (.docx)</option>
                                <option value="txt">Plain Text (.txt)</option>
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700 dark:text-gray-400"><FiChevronDown className="w-4 h-4" /></div>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Default download format.</p>
                    </div>
                    <div>
                        <label htmlFor="defaultTranslationLang" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Default Translation Language</label>
                         <div className="relative">
                             <select name="defaultTranslationLang" id="defaultTranslationLang" value={preferencesData.defaultTranslationLang} onChange={handlePrefsChange} className={selectStyles}>
                                 <option value="en">English</option> <option value="ta">Tamil</option> <option value="es">Spanish</option> <option value="fr">French</option> <option value="de">German</option> <option value="hi">Hindi</option> {/* TODO: Add more */}
                             </select>
                             <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700 dark:text-gray-400"><FiChevronDown className="w-4 h-4" /></div>
                         </div>
                         <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Pre-selects language.</p>
                    </div>
                </div>
                <div className="space-y-4 pt-4 border-t dark:border-gray-700">
                    <div className="flex items-center justify-between">
                        <p>
                            <span className="font-medium text-gray-700 dark:text-gray-200">Theme</span>
                            <span className="text-xs text-gray-500 dark:text-gray-400"> (Light/Dark)</span>
                        </p>
                        <ThemeToggle theme={theme} setTheme={setTheme}/>
                    </div>
                </div>
                <div className="space-y-4 pt-4 border-t dark:border-gray-700">
                    <div className="flex items-start">
                        <div className="flex items-center h-5"><input id="enablePolishing" name="enablePolishing" type="checkbox" checked={preferencesData.enablePolishing} onChange={handlePrefsChange} className={checkboxStyles}/></div>
                        <div className="ml-3 text-sm"><label htmlFor="enablePolishing" className="font-medium text-gray-700 dark:text-gray-200">Enable AI Text Polishing</label><p className="text-xs text-gray-500 dark:text-gray-400">Attempt AI improvements by default.</p></div>
                    </div>
                    <div className="flex items-start">
                        <div className="flex items-center h-5"><input id="notifyOnCompletion" name="notifyOnCompletion" type="checkbox" checked={preferencesData.notifyOnCompletion} onChange={handlePrefsChange} className={checkboxStyles}/></div>
                        <div className="ml-3 text-sm"><label htmlFor="notifyOnCompletion" className="font-medium text-gray-700 dark:text-gray-200">Email Notifications</label><p className="text-xs text-gray-500 dark:text-gray-400">Receive email on batch completion.</p></div>
                    </div>
                </div>
                 <button type="submit" className={buttonPrimaryStyles} disabled={isSavingPrefs}>
                    {isSavingPrefs ? <><FiLoader className="w-4 h-4 mr-2 animate-spin"/> Saving...</> : <> <FiSave className="w-4 h-4 mr-2"/> Save Preferences </>}
                 </button>
                 {/* Status message will be shown by the parent's indicator */}
             </form>
        </motion.section>
    );
}
export default PreferencesSettingsContent;