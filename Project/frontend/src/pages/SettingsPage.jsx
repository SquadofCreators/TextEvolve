import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiUser, FiSettings, FiUsers, FiSave, FiAlertTriangle, FiTrash2, FiCheckCircle } from 'react-icons/fi';
import PageHeader from '../components/utility/PageHeader';

function SettingsPage() {
    const [activeTab, setActiveTab] = useState('account'); // 'account', 'preferences', 'community'

    const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });

    // --- State for Preferences Section ---
    const [preferences, setPreferences] = useState({
        defaultFormat: 'pdf',
        defaultTranslationLang: 'en',
        enablePolishing: true,
    });

    // --- State for Community Section ---
    const [communitySettings, setCommunitySettings] = useState({ publicName: '', visibility: 'private' });

    // --- Loading / Saving State ---
    // Removed isSavingProfile state
    const [isSavingPrefs, setIsSavingPrefs] = useState(false);
    const [isSavingCommunity, setIsSavingCommunity] = useState(false);
    const [saveStatus, setSaveStatus] = useState({ show: false, success: false, message: '' });

    // TODO: Fetch initial data for preferences and community settings
    useEffect(() => {
        console.log("Fetching initial settings data...");
        // setPreferences(...)
        // setCommunitySettings(...)
    }, []);

    // --- Handlers ---
    // Removed handleProfileChange
    const handlePasswordChange = (e) => setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
    const handlePrefsChange = (e) => {
        const { name, value, type, checked } = e.target;
        setPreferences(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };
    const handleCommunityChange = (e) => setCommunitySettings({ ...communitySettings, [e.target.name]: e.target.value });

    const showSaveStatus = (success, message) => {
        setSaveStatus({ show: true, success, message });
        setTimeout(() => setSaveStatus({ show: false, success: false, message: '' }), 3000);
    };

    // --- TODO: Implement actual API calls ---
    // Removed handleSaveProfile

    const handlePasswordSubmit = async (e) => {
        e.preventDefault(); // Prevent default if using a form around password fields
        // TODO: Add validation (passwords match, complexity?)
        console.log("Changing Password:", passwordData);
        // --- Replace with API Call ---
        alert("Password change functionality not implemented yet.");
        // Reset fields after attempt?
        // setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        // Show success/error status
    };


    const handleSavePreferences = async (e) => {
        e.preventDefault();
        setIsSavingPrefs(true);
        console.log("Saving Preferences:", preferences);
        await new Promise(res => setTimeout(res, 1000)); // Simulate
        const success = true;
        setIsSavingPrefs(false);
        showSaveStatus(success, success ? 'Preferences saved!' : 'Failed to save preferences.');
    };

    const handleSaveCommunity = async (e) => {
        e.preventDefault();
        setIsSavingCommunity(true);
        console.log("Saving Community Settings:", communitySettings);
        await new Promise(res => setTimeout(res, 1000)); // Simulate
        const success = true;
        setIsSavingCommunity(false);
        showSaveStatus(success, success ? 'Community settings saved!' : 'Failed to save settings.');
    };

    const handleDeleteAccount = () => {
        if (window.confirm('Are you absolutely sure you want to delete your account? This action cannot be undone.')) {
            console.log("Deleting account...");
            // --- Replace with API Call ---
            alert("Account deletion feature not implemented yet.");
            // Handle logout and redirect after successful deletion
        }
    }

    // --- Animation Variants ---
    const sectionVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
        exit: { opacity: 0, y: -20, transition: { duration: 0.3, ease: 'easeIn' } }
    };


    return (
        <div className='flex-1 h-full p-6 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700'>
            <div className='h-full flex flex-col'>
                <PageHeader
                    title="Settings"
                    link="/"
                />
                <div className='flex flex-col md:flex-row gap-8 lg:gap-12 overflow-y-scroll'>
                    {/* Sidebar */}
                    <aside className="md:w-1/4 lg:w-1/5 sticky top-0 h-full p-4">
                        <nav className="space-y-2">
                            <button onClick={() => setActiveTab('account')} className={`flex items-center w-full px-4 py-2.5 text-left rounded-lg transition-colors duration-200 ${activeTab === 'account' ? 'bg-orange-100 text-orange-700 font-semibold' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800'}`} >
                                <FiUser className="w-5 h-5 mr-3 flex-shrink-0" /> Account
                            </button>
                            <button onClick={() => setActiveTab('preferences')} className={`flex items-center w-full px-4 py-2.5 text-left rounded-lg transition-colors duration-200 ${activeTab === 'preferences' ? 'bg-orange-100 text-orange-700 font-semibold' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800'}`} >
                                <FiSettings className="w-5 h-5 mr-3 flex-shrink-0" /> Preferences
                            </button>
                            <button onClick={() => setActiveTab('community')} className={`flex items-center w-full px-4 py-2.5 text-left rounded-lg transition-colors duration-200 ${activeTab === 'community' ? 'bg-orange-100 text-orange-700 font-semibold' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800'}`} >
                                <FiUsers className="w-5 h-5 mr-3 flex-shrink-0" /> Community
                            </button>
                        </nav>
                    </aside>

                    {/* Content Area */}
                    <div className='flex-1'>
                        <AnimatePresence mode="wait">
                            {/* Account Section - MODIFIED */}
                            {activeTab === 'account' && (
                                <motion.section key="account" variants={sectionVariants} initial="hidden" animate="visible" exit="exit">
                                    <h2 className="text-2xl font-semibold text-gray-800 mb-6">Account Management</h2>
                                    <div className="space-y-10 p-6 md:p-8">

                                        {/* Change Password Section */}
                                        <div id="change-password">
                                            <h3 className="text-lg font-semibold text-gray-800 mb-4">Change Password</h3>
                                            {/* Optional: Wrap just this part in a form if submitting together */}
                                            <form onSubmit={handlePasswordSubmit} className="space-y-4">
                                                <div>
                                                    <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                                                    <input type="password" name="currentPassword" id="currentPassword" value={passwordData.currentPassword} onChange={handlePasswordChange} className="form-input" required autoComplete="current-password" />
                                                </div>
                                                <div>
                                                    <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                                                    <input type="password" name="newPassword" id="newPassword" value={passwordData.newPassword} onChange={handlePasswordChange} className="form-input" required autoComplete="new-password"/>
                                                </div>
                                                <div>
                                                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                                                    <input type="password" name="confirmPassword" id="confirmPassword" value={passwordData.confirmPassword} onChange={handlePasswordChange} className="form-input" required autoComplete="new-password"/>
                                                </div>
                                                {/* TODO: Add password validation feedback */}
                                                <button type="submit" className="btn-secondary"> {/* Use submit type */}
                                                    Update Password
                                                </button>
                                            </form>
                                        </div>

                                        {/* Delete Account Section */}
                                        <div id="delete-account">
                                            <hr className="my-6 border-red-200"/>
                                            <h3 className="text-lg font-semibold text-red-600 mb-4">Delete Account</h3>
                                            <p className="text-sm text-gray-600 mb-4">Permanently delete your account and all associated data, including processed documents linked to your account. This action cannot be undone.</p>
                                            <button type="button" onClick={handleDeleteAccount} className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500">
                                                <FiTrash2 className="w-4 h-4 mr-2" /> Delete My Account
                                            </button>
                                        </div>
                                    </div>
                                </motion.section>
                            )}

                            {/* Preferences Section (No Changes) */}
                            {activeTab === 'preferences' && (
                                <motion.section key="preferences" variants={sectionVariants} initial="hidden" animate="visible" exit="exit">
                                    <h2 className="text-2xl font-semibold text-gray-800 mb-6">Processing Preferences</h2>
                                    <form onSubmit={handleSavePreferences} className="space-y-6 bg-white p-6 md:p-8 rounded-lg shadow border border-gray-100">
                                        <div>
                                            <label htmlFor="defaultFormat" className="block text-sm font-medium text-gray-700 mb-1">Default Export Format</label>
                                            <select name="defaultFormat" id="defaultFormat" value={preferences.defaultFormat} onChange={handlePrefsChange} className="form-select">
                                                <option value="pdf">PDF</option>
                                                <option value="docx">Word (.docx)</option>
                                                <option value="txt">Plain Text (.txt)</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label htmlFor="defaultTranslationLang" className="block text-sm font-medium text-gray-700 mb-1">Default Translation Language</label>
                                            {/* TODO: Populate with actual language options */}
                                            <select name="defaultTranslationLang" id="defaultTranslationLang" value={preferences.defaultTranslationLang} onChange={handlePrefsChange} className="form-select">
                                                <option value="en">English</option>
                                                <option value="es">Spanish</option>
                                                <option value="fr">French</option>
                                                <option value="de">German</option>
                                                <option value="hi">Hindi</option>
                                                <option value="ta">Tamil</option>
                                            </select>
                                        </div>
                                        <div className="flex items-center">
                                            <input type="checkbox" name="enablePolishing" id="enablePolishing" checked={preferences.enablePolishing} onChange={handlePrefsChange} className="h-4 w-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"/>
                                            <label htmlFor="enablePolishing" className="ml-2 block text-sm text-gray-900">Enable AI Text Polishing (Gemini) by Default</label>
                                        </div>
                                        <button type="submit" className="btn-primary" disabled={isSavingPrefs}>
                                            {isSavingPrefs ? 'Saving...' : <> <FiSave className="w-4 h-4 mr-2"/> Save Preferences </>}
                                        </button>
                                    </form>
                                </motion.section>
                            )}

                            {/* Community Section (No Changes) */}
                            {activeTab === 'community' && (
                                <motion.section key="community" variants={sectionVariants} initial="hidden" animate="visible" exit="exit">
                                    <h2 className="text-2xl font-semibold text-gray-800 mb-6">Community Settings</h2>
                                    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-lg mb-6">
                                        <p className="text-sm text-yellow-700">The TextEvolve Community feature is currently under development. Settings will appear here soon!</p>
                                    </div>
                                    <form onSubmit={handleSaveCommunity} className="space-y-6 bg-white p-6 md:p-8 rounded-lg shadow border border-gray-100 opacity-50 pointer-events-none">
                                        <div>
                                            <label htmlFor="publicName" className="block text-sm font-medium text-gray-700 mb-1">Public Profile Name</label>
                                            <input type="text" name="publicName" id="publicName" value={communitySettings.publicName} onChange={handleCommunityChange} className="form-input" placeholder="How you'll appear to others" disabled />
                                        </div>
                                        <div>
                                            <label htmlFor="visibility" className="block text-sm font-medium text-gray-700 mb-1">Profile Visibility</label>
                                            <select name="visibility" id="visibility" value={communitySettings.visibility} onChange={handleCommunityChange} className="form-select" disabled>
                                                <option value="public">Public</option>
                                                <option value="private">Private</option>
                                            </select>
                                        </div>
                                        <button type="submit" className="btn-primary" disabled={true}>
                                            <FiSave className="w-4 h-4 mr-2" /> Save Community Settings
                                        </button>
                                    </form>
                                </motion.section>
                            )}
                        </AnimatePresence>                        
                    </div>
                </div>
            </div>
        </div>
    );
}

export default SettingsPage;