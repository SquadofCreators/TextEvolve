import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FiUser, FiCreditCard, FiFileText, FiMessageSquare, FiSliders,
    FiSearch, FiInfo, FiStar, FiLogOut, FiCheckCircle, FiAlertTriangle
} from 'react-icons/fi'; // Combined necessary icons
import { useAuth } from '../contexts/AuthContext'; // Adjust path if needed

// Import the section components
import AccountSettingsContent from '../components/settings/AccountSettings';
import GeneralSettingsContent from '../components/settings/GeneralSettings';
import ContactSettingsContent from '../components/settings/ContactSettings';
import PaymentSettingsContent from '../components/settings/PaymentSettings';
import SubscriptionSettingsContent from '../components/settings/SubscriptionSettings';
// import CommunitySettingsContent from '../components/settings/CommunitySettings'; // Uncomment if using

// Framer Motion Variants (optional, for content transition)
const contentVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" } },
    exit: { opacity: 0, y: -10, transition: { duration: 0.2, ease: "easeIn" } }
};

function SettingsPage() {
    const [activeTab, setActiveTab] = useState('account'); // Default to 'account' tab
    const { user, token, logout } = useAuth();

    // State for global notifications/status triggered by children
    const [saveStatus, setSaveStatus] = useState({ show: false, success: false, message: '', context: null });

    // Callback for children to show status messages
    const showSaveStatus = useCallback((success, message, context = null, duration = 4000) => {
        setSaveStatus({ show: true, success, message, context });
        setTimeout(() => setSaveStatus(prev => (prev.context === context ? { show: false, success: false, message: '', context: null } : prev)), duration);
    }, []); // Empty dependency array is correct here

    // Define Tabs based on the image and map to components
    const settingTabs = [
        { key: 'general', label: 'General', icon: FiSliders, Component: GeneralSettingsContent },
        { key: 'account', label: 'Account', icon: FiUser, Component: AccountSettingsContent }, // Moved Account after General
        { key: 'contact', label: 'Contact', icon: FiMessageSquare, Component: ContactSettingsContent },
        { key: 'payment', label: 'Payment', icon: FiCreditCard, Component: PaymentSettingsContent },
        { key: 'subscription', label: 'Subscription', icon: FiFileText, Component: SubscriptionSettingsContent },
        // { key: 'apiKeys', label: 'API Keys', icon: FiKey, Component: ApiKeysSettingsContent }, // Example if needed
        // { key: 'community', label: 'Community Profile', icon: FiUsers, Component: CommunitySettingsContent },
    ];

    // Find the component for the currently active tab
    const ActiveComponent = settingTabs.find(tab => tab.key === activeTab)?.Component;

    return (
        <div className="flex-1 h-full px-2 py-6 md:p-6 overflow-y-auto bg-gray-100 dark:bg-gray-900">
            <div className="container mx-auto max-w-6xl"> {/* Increased max-width slightly */}

                {/* Header Area */}
                <div className="flex flex-col sm:flex-row justify-between items-center mb-6 sm:mb-8 gap-4">
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-gray-100">
                        Settings
                    </h1>
                    {/* Top Right Elements from Image */}
                    <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
                        <div className="relative flex-grow sm:flex-grow-0">
                            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                            <input
                               type="search"
                               placeholder="Search settings..."
                               className="pl-9 pr-3 py-2 w-full sm:w-48 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-sm focus:outline-none focus:ring-1 focus:ring-orange-500 text-gray-900 dark:text-gray-100"
                            />
                        </div>
                         <button className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 flex-shrink-0" title="Tooltips display informative text when users hover over, focus on, or tap an element.">
                            <FiInfo className="w-5 h-5"/>
                        </button>
                        <button className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700 transition shadow-sm">
                            <FiStar className="w-4 h-4"/> Go Pro
                        </button>
                    </div>
                </div>

                {/* Horizontal Tab Navigation */}
                <div className="border-b border-gray-200 dark:border-gray-700 mb-6 sm:mb-8">
                    {/* Added overflow-x-auto for mobile scrolling */}
                    <nav className="-mb-px flex space-x-5 sm:space-x-8 overflow-x-auto" aria-label="Tabs">
                        {settingTabs.map(tab => (
                            <button
                                key={tab.key}
                                onClick={() => setActiveTab(tab.key)}
                                className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-orange-500 ${
                                    activeTab === tab.key
                                    ? 'border-orange-500 text-orange-600 dark:border-orange-400 dark:text-orange-400'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:border-gray-600'
                                }`}
                                aria-current={activeTab === tab.key ? 'page' : undefined}
                            >
                                {tab.label}
                                {/* Example Count */}
                                {tab.key === 'account' && <span className="ml-1.5 bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs font-semibold px-1.5 py-0.5 rounded-full hidden sm:inline-block">12</span>}
                            </button>
                        ))}
                    </nav>
                </div>

                {/* Main Content Area - Renders the active tab's component */}
                <main>
                    <AnimatePresence mode="wait">
                        {ActiveComponent ? (
                            <motion.div
                                key={activeTab} // Key changes trigger animation
                                variants={contentVariants}
                                initial="hidden"
                                animate="visible"
                                exit="exit"
                            >
                                {/* Pass necessary props down to the specific settings component */}
                                <ActiveComponent
                                    user={user} // Pass user data from context
                                    token={token} // Pass token if needed by services called within child
                                    logout={logout} // Pass logout if needed (e.g., in AccountSettings)
                                    showSaveStatus={showSaveStatus} // Pass status display function
                                    // Add other specific props based on which component is active if needed
                                />
                            </motion.div>
                        ) : (
                            <p className="text-center text-gray-500 dark:text-gray-400 py-10">Select a setting category.</p> // Fallback
                        )}
                    </AnimatePresence>
                </main>

                {/* --- Global Save Status Indicator --- */}
                <AnimatePresence>
                    {saveStatus.show && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
                            className={`fixed bottom-6 right-6 p-4 rounded-lg shadow-lg text-sm font-medium z-50 flex items-center border ${ saveStatus.success ? 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/70 dark:text-green-200 dark:border-green-700' : 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/70 dark:text-red-200 dark:border-red-700' }`} >
                            {saveStatus.success ? (<FiCheckCircle className="w-5 h-5 mr-2 flex-shrink-0"/>) : (<FiAlertTriangle className="w-5 h-5 mr-2 flex-shrink-0"/>)}
                            {saveStatus.message}
                        </motion.div>
                    )}
                </AnimatePresence>

            </div>
        </div>
    );
}

export default SettingsPage;


// =====================================================================
// Example Implementation for AccountSettingsContent (Needs to be in its own file)
// =====================================================================

