import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FiUser, FiSettings, FiKey, FiUsers, FiSave, FiAlertTriangle, FiTrash2,
    FiCheckCircle, FiLoader, FiMail, FiBriefcase, FiMapPin, FiBell, FiLogOut, FiChevronDown, FiChevronUp // Added icons
} from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext'; // Adjust path if needed

// Import the section components
// Ensure these paths are correct for your project structure
import AccountSettingsContent from '../components/settings/AccountSettings';
import PreferencesSettingsContent from '../components/settings/PreferencesSettings';
import ApiKeysSettingsContent from '../components/settings/ApiKeysSettings';
import CommunitySettingsContent from '../components/settings/CommunitySettings';


// --- Placeholder Services (Replace with your actual service imports if available) ---
const userService = { getProfile: async () => ({success: true, data: {}}), updateProfile: async () => ({success: true}), changePassword: async () => ({success: true}), deleteAccount: async () => ({success: true})};
const preferenceService = { getPrefs: async (token) => { return { success: true, data: { defaultFormat: 'pdf', defaultTranslationLang: 'en', enablePolishing: true, notifyOnCompletion: true } }; }, updatePrefs: async (token, data) => { return { success: true, message: 'Preferences saved.' }; } };
const apiKeyService = { getKeys: async (token) => { return { success: true, data: [{ id: 'key_1', prefix: 'TEK_abc...', createdAt: '2025-01-15T10:00:00Z', lastUsed: null }] }; }, generateKey: async (token) => { const newKey = `TEK_${Math.random().toString(36).substring(2, 10)}`; const newId = `key_${Date.now()}`; return { success: true, data: { id: newId, prefix: `${newKey.substring(0, 7)}...`, fullKey: newKey, createdAt: new Date().toISOString() }, message: 'New API Key Generated!' }; }, revokeKey: async (token, keyId) => { return { success: true, message: `Key ${keyId} revoked.` }; } };
// --- END PLACEHOLDERS ---

// Import styles or define variants
const sectionVariants = {
    hidden: { opacity: 0, height: 0, y: -10 },
    visible: { opacity: 1, height: 'auto', y: 0, transition: { duration: 0.3, ease: "easeInOut" } },
    exit: { opacity: 0, height: 0, y: -10, transition: { duration: 0.2, ease: "easeInOut" } }
};

function SettingsPage() {
    const [activeTab, setActiveTab] = useState('account'); // Default tab
    const { user, token, logout } = useAuth();

    // State for data fetched by parent
    const [preferencesData, setPreferencesData] = useState(null); // <-- State variable IS named preferencesData
    const [apiKeysData, setApiKeysData] = useState([]);
    const [newlyGeneratedKey, setNewlyGeneratedKey] = useState(null);

    // Loading & Status State
    const [isLoading, setIsLoading] = useState({ prefs: true, apiKeys: true });
    const [isSaving, setIsSaving] = useState({ prefs: false, apiKey: false, revoke: null });
    const [saveStatus, setSaveStatus] = useState({ show: false, success: false, message: '', context: null });

    // --- Fetch Initial Data ---
    useEffect(() => {
        const fetchData = async () => {
             if (!token) { setIsLoading({ prefs: false, apiKeys: false }); return; }
             setIsLoading({ prefs: true, apiKeys: true }); let loadError = null;
             // Fetch Prefs
             try { const prefsRes = await preferenceService.getPrefs(token); if (prefsRes.success) setPreferencesData(prefsRes.data); else throw new Error(prefsRes.message || 'Failed to load preferences'); } catch (error) { loadError = `Preferences load failed: ${error.message}`; } finally { setIsLoading(prev => ({ ...prev, prefs: false })); }
             // Fetch Keys
             try { const keysRes = await apiKeyService.getKeys(token); if (keysRes.success) setApiKeysData(keysRes.data || []); else throw new Error(keysRes.message || 'Failed to load API keys'); } catch (error) { loadError = (loadError ? loadError + '; ' : '') + `API Keys load failed: ${error.message}`; } finally { setIsLoading(prev => ({ ...prev, apiKeys: false })); }
             // Show error if any occurred
             if(loadError) { showSaveStatus(false, loadError, 'load_error'); }
        };
        fetchData();
    // Added showSaveStatus to dependency array if it's defined outside or via props
    }, [token, /* showSaveStatus (if needed) */]);

    // --- Handlers passed down ---
    const showSaveStatus = useCallback((success, message, context = null, duration = 3000) => {
        setSaveStatus({ show: true, success, message, context });
        setTimeout(() => setSaveStatus(prev => (prev.context === context ? { show: false, success: false, message: '', context: null } : prev)), duration);
    }, []); // Empty dependency array is correct here

    const handleSavePrefs = useCallback(async (updatedPrefsData) => {
        setIsSaving(prev => ({ ...prev, prefs: true }));
        try {
            const res = await preferenceService.updatePrefs(token, updatedPrefsData);
            if (!res.success) throw new Error(res.message || 'Saving failed');
            setPreferencesData(updatedPrefsData);
            showSaveStatus(true, 'Preferences saved!', 'prefs');
        } catch (error) { console.error("Prefs save error:", error); showSaveStatus(false, `Prefs save failed: ${error.message}`, 'prefs'); }
        finally { setIsSaving(prev => ({ ...prev, prefs: false })); }
    }, [token, showSaveStatus]);

    const handleGenerateApiKey = useCallback(async () => {
         setIsSaving(prev => ({ ...prev, apiKey: true })); setNewlyGeneratedKey(null); showSaveStatus(false, '', 'apiKey');
         try {
            const res = await apiKeyService.generateKey(token);
            if (!res.success) throw new Error(res.message || 'Failed');
            setApiKeysData(prev => [res.data, ...prev]);
            setNewlyGeneratedKey(res.data.fullKey);
            showSaveStatus(true, 'New Key Generated! Copy it now.', 'apiKey', 15000);
         } catch (error) { console.error("API Key gen error:", error); showSaveStatus(false, `Key gen failed: ${error.message}`, 'apiKey'); }
         finally { setIsSaving(prev => ({ ...prev, apiKey: false })); }
    }, [token, showSaveStatus]);

    const handleRevokeApiKey = useCallback(async (keyId) => {
         if (!window.confirm(`Revoke API key ${keyId.substring(0, 6)}...?`)) return;
         setIsSaving(prev => ({ ...prev, revoke: keyId })); setNewlyGeneratedKey(null); showSaveStatus(false, '', 'apiKey');
         try {
            const res = await apiKeyService.revokeKey(token, keyId);
             if (!res.success) throw new Error(res.message || 'Failed');
             setApiKeysData(prev => prev.filter(key => key.id !== keyId));
             showSaveStatus(true, `API Key revoked.`, 'apiKey');
         } catch (error) { console.error(`API Key revoke error:`, error); showSaveStatus(false, `Revoke failed: ${error.message}`, 'apiKey'); }
         finally { setIsSaving(prev => ({ ...prev, revoke: null })); }
    }, [token, showSaveStatus]);

    const copyToClipboard = useCallback((text) => {
         navigator.clipboard.writeText(text)
             .then(() => showSaveStatus(true, 'Copied!', 'apiKey', 1500))
             .catch(err => showSaveStatus(false, 'Copy failed.', 'apiKey'));
     }, [showSaveStatus]);

    // Define Tab structure including Components
    const settingTabs = [
        { key: 'account', label: 'Account Management', icon: FiUser, Component: AccountSettingsContent },
        { key: 'preferences', label: 'Preferences', icon: FiSettings, Component: PreferencesSettingsContent },
        { key: 'apiKeys', label: 'API Keys', icon: FiKey, Component: ApiKeysSettingsContent },
        { key: 'community', label: 'Community Profile', icon: FiUsers, Component: CommunitySettingsContent },
    ];

    // --- Props for Content Components ---
    const accountProps = { showSaveStatus, logout };
    // *** THIS IS THE FIX for the ReferenceError ***
    const prefsProps = {
        token,
        initialPrefsData: preferencesData, // <-- Use the correct state variable 'preferencesData'
        isSavingPrefs: isSaving.prefs,
        onSavePrefs: handleSavePrefs,
        showSaveStatus
    };
    // **********************************************
    const apiKeyProps = { token, initialKeysData: apiKeysData, isLoadingKeys: isLoading.apiKeys, isSavingApiKey: isSaving.apiKey, isSavingRevoke: isSaving.revoke, onGenerateKey: handleGenerateApiKey, onRevokeKey: handleRevokeApiKey, newlyGeneratedKey, copyToClipboard, showSaveStatus };
    const communityProps = { /* Add props needed for CommunitySettingsContent if any */ };

    // Map tab keys to their respective props
    const tabToPropsMap = {
        account: accountProps,
        preferences: prefsProps,
        apiKeys: apiKeyProps,
        community: communityProps,
    };

    // --- Render Loading State ---
    if (isLoading.prefs || isLoading.apiKeys) {
        return ( <div className="flex items-center justify-center h-[calc(100vh-10rem)]"><FiLoader className="w-10 h-10 text-orange-500 animate-spin" /></div> );
    }

    // --- Main Render ---
    return (
        <div className="container mx-auto max-w-7xl py-10 px-4 sm:px-6 lg:px-8 min-h-[calc(100vh-80px)]">
            <motion.h1
                initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
                className="text-3xl font-bold text-center mb-8 text-gray-800 dark:text-gray-100"
            >
                Settings
            </motion.h1>

            {/* --- Mobile Navigation (Accordion with Content) --- */}
            {/* This section correctly renders content below header when active */}
            <div className="md:hidden space-y-2 mb-6">
                {settingTabs.map(tab => {
                    const isOpen = activeTab === tab.key;
                    const ContentComponent = tab.Component;
                    // Get props using the corrected map
                    const contentProps = tabToPropsMap[tab.key] || {};

                    return (
                        <div key={`${tab.key}-mobile`} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                            {/* Accordion Header Button */}
                            <button onClick={() => setActiveTab(prev => (prev === tab.key ? null : tab.key))} className="flex justify-between items-center w-full px-4 py-3 text-left focus:outline-none focus-visible:ring focus-visible:ring-orange-500 focus-visible:ring-opacity-75" aria-expanded={isOpen} >
                                <span className="flex items-center">
                                    <tab.icon className={`w-5 h-5 mr-3 flex-shrink-0 transition-colors ${isOpen ? 'text-orange-600 dark:text-orange-400' : 'text-gray-500 dark:text-gray-400'}`} />
                                    <span className={`text-md font-semibold transition-colors ${isOpen ? 'text-orange-700 dark:text-orange-300' : 'text-gray-700 dark:text-gray-200'}`}> {tab.label} </span>
                                </span>
                                <span className="ml-6 flex items-center text-gray-500 dark:text-gray-400"> {isOpen ? <FiChevronUp /> : <FiChevronDown /> } </span>
                            </button>
                            {/* Accordion Content (Animated) */}
                            <AnimatePresence initial={false}>
                                {isOpen && ContentComponent && (
                                    <motion.section key={`${tab.key}-content`} variants={sectionVariants} initial="hidden" animate="visible" exit="exit" className="border-t border-gray-200 dark:border-gray-700 overflow-hidden" aria-hidden={!isOpen} >
                                        <div className="p-4 md:p-6">
                                             <ContentComponent {...contentProps} />
                                        </div>
                                    </motion.section>
                                )}
                            </AnimatePresence>
                        </div> );
                })}
                 <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700"> {/* Mobile Logout Button */} <button onClick={() => { if (window.confirm('Are you sure?')) logout(); }} className="flex items-center justify-center w-full px-4 py-2.5 text-left rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30 dark:hover:text-red-300 transition-colors" > <FiLogOut className="w-5 h-5 mr-3 flex-shrink-0" /> Logout </button> </div>
            </div>

            {/* --- Desktop Layout (Sidebar + Content) --- */}
            <div className="hidden md:flex md:flex-row gap-8 lg:gap-12">
                {/* Desktop Sidebar Navigation */}
                <aside className="md:w-1/4 lg:w-1/5">
                    <nav className="space-y-1.5 sticky top-24">
                        {settingTabs.map(tab => (
                            <button key={tab.key} onClick={() => setActiveTab(tab.key)} className={`flex items-center w-full px-4 py-2.5 text-left rounded-lg transition-colors duration-200 text-sm font-medium ${ activeTab === tab.key ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300 font-semibold' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100'}`} > <tab.icon className="w-5 h-5 mr-3 flex-shrink-0" /> {tab.label} </button>
                        ))}
                        <button onClick={() => { if (window.confirm('Are you sure?')) logout(); }} className="flex items-center w-full px-4 py-2.5 text-left rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30 dark:hover:text-red-300 mt-6" > <FiLogOut className="w-5 h-5 mr-3 flex-shrink-0" /> Logout </button>
                    </nav>
                </aside>

                {/* Content Area */}
                {/* Added 'hidden md:block' was correct, keeping it */}
                <main className="flex-1 min-w-0 hidden md:block">
                     <AnimatePresence mode="wait">
                         {settingTabs.map(tab => (
                             activeTab === tab.key && tab.Component && (
                                 <motion.div key={tab.key} variants={sectionVariants} initial="hidden" animate="visible" exit="exit" >
                                     <tab.Component {...(tabToPropsMap[tab.key] || {})} />
                                 </motion.div>
                             )
                         ))}
                     </AnimatePresence>
                </main>
            </div>

            {/* --- Global Save Status Indicator --- */}
            <AnimatePresence> {saveStatus.show && ( <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className={`fixed top-20 right-6 p-4 rounded-lg shadow-lg text-sm font-medium z-50 flex items-center border ${ saveStatus.success ? 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/70 dark:text-green-200 dark:border-green-700' : 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/70 dark:text-red-200 dark:border-red-700' }`} > {saveStatus.success ? (<FiCheckCircle className="w-5 h-5 mr-2 flex-shrink-0"/>) : (<FiAlertTriangle className="w-5 h-5 mr-2 flex-shrink-0"/>)} {saveStatus.message} </motion.div> )} </AnimatePresence>
        </div>
    );
}

export default SettingsPage;