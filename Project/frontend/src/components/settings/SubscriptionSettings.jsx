import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FiCheckCircle, FiDollarSign, FiZap, FiCreditCard, FiCalendar, FiBarChart2, FiRefreshCw, FiXCircle, FiExternalLink } from 'react-icons/fi';
import { Link } from 'react-router-dom'; // If billing history is an internal route

const sectionVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
  exit: { opacity: 0, transition: { duration: 0.2, ease: 'easeIn' } } // Removed y for simpler exit
};

// --- Dummy Data (Replace with props/fetched data) ---
const dummyCurrentPlan = {
    name: 'Researcher Plan',
    price: '$15', // Or price ID like price_xyz if using Stripe
    interval: 'month',
    limits: {
        pages: 2000,
        batches: 50,
        apiCalls: 10000,
        storageGB: 10,
    },
    features: ['High Accuracy OCR', 'AI Polishing', 'Translation (5 Lang)', 'API Access', 'Email Support'],
};

const dummyUsageData = {
    pages: 1250,
    batches: 35,
    apiCalls: 4500,
    storageGB: 4.2,
    periodStart: '2025-04-01T00:00:00Z',
    periodEnd: '2025-04-30T23:59:59Z',
};

const dummyBillingInfo = {
    cardType: 'Visa',
    last4: '4242',
    nextBillingDate: '2025-05-01T00:00:00Z',
    // billingHistoryUrl: '/settings/billing-history' // Example internal link
    billingHistoryUrl: '#' // Placeholder
};

const dummyAvailablePlans = [
     { id: 'plan_free', name: 'Free Tier', price: '$0', interval: 'month', limits: { pages: 100 }, features: ['Standard OCR', 'Limited Usage'] },
     { id: 'plan_researcher', name: 'Researcher Plan', price: '$15', interval: 'month', limits: { pages: 2000 }, features: ['High Accuracy OCR', 'AI Polishing', 'API Access'] },
     { id: 'plan_team', name: 'Team Plan', price: '$45', interval: 'month', limits: { pages: 10000 }, features: ['All Researcher Features', 'Collaboration', 'Priority Support'] },
]
// --- End Dummy Data ---


// --- Helper: Progress Bar ---
const UsageBar = ({ label, used, limit, unit = '' }) => {
    const percentage = limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0;
    const isNearLimit = percentage > 85;
    const isOverLimit = percentage >= 100;

    let bgColor = 'bg-orange-500'; // Default orange
    if (isNearLimit) bgColor = 'bg-yellow-500';
    if (isOverLimit) bgColor = 'bg-red-500';

    return (
        <div className="mb-3 text-sm">
            <div className="flex justify-between mb-1 text-gray-600 dark:text-gray-400">
                <span>{label}</span>
                <span>
                    {used}{unit} / {limit}{unit} ({percentage}%)
                </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2.5 overflow-hidden">
                <div
                    className={`h-2.5 rounded-full transition-all duration-300 ease-out ${bgColor}`}
                    style={{ width: `${percentage}%` }}
                ></div>
            </div>
        </div>
    );
};

// --- Main Subscription Settings Component ---
function SubscriptionSettingsContent({ /* Props would replace dummy data */ }) {

    // TODO: Replace dummy data with props or fetched state
    const currentPlan = dummyCurrentPlan;
    const usageData = dummyUsageData;
    const billingInfo = dummyBillingInfo;
    const availablePlans = dummyAvailablePlans;

    // Placeholder handlers - link these to actual logic/API calls/Stripe integration
    const handleUpdatePayment = () => {
        alert('Redirecting to update payment method... (Not Implemented)');
        // Example: window.location.href = '/api/billing/manage-payment'; (backend redirects to Stripe)
    };

    const handleViewHistory = () => {
        if (billingInfo.billingHistoryUrl && billingInfo.billingHistoryUrl !== '#') {
             // Use React Router's navigate if it's an internal link
            alert(`Navigating to Billing History... (Not Implemented - Target: ${billingInfo.billingHistoryUrl})`);
             // navigate(billingInfo.billingHistoryUrl);
        } else {
            alert('Billing history integration not available yet.');
        }
    };

     const handleChangePlan = (planId) => {
        if (planId === currentPlan.id) return; // Already on this plan
         if (window.confirm(`Are you sure you want to switch to the ${availablePlans.find(p=>p.id === planId)?.name || 'selected plan'}?`)){
             alert(`Switching to plan ${planId}... (Not Implemented)`);
             // TODO: API call to change subscription plan
         }
     };

    const handleCancelSubscription = () => {
        if (window.confirm('Are you sure you want to cancel your subscription? This action may be irreversible depending on the plan.')) {
            alert('Cancelling subscription... (Not Implemented)');
            // TODO: API call to cancel subscription
        }
    };

    // Format date helper
    const formatDate = (isoString) => {
        if (!isoString) return 'N/A';
        try { return new Date(isoString).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }); }
        catch (e) { return 'Invalid Date'; }
    }

    // Base Tailwind styles (Consider moving to a constants file)
    const cardStyle = "bg-white dark:bg-gray-800 p-6 rounded-lg shadow border border-gray-200 dark:border-gray-700";
    const headingStyle = "text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4";
    const buttonPrimaryStyles = "inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50";
    const buttonSecondaryStyles = "inline-flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50";
    const buttonDangerTextStyles = "text-sm font-medium text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 focus:outline-none focus:underline";


    return (
        <motion.div variants={sectionVariants} initial="hidden" animate="visible" exit="exit">
            <div className="space-y-8">

                {/* --- Current Plan Section --- */}
                <div className={cardStyle}>
                    <h3 className={headingStyle}>Current Plan</h3>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
                        <span className="text-xl font-bold text-orange-600 dark:text-orange-400">{currentPlan.name}</span>
                        <span className="text-lg font-semibold text-gray-700 dark:text-gray-200">
                            {currentPlan.price} / {currentPlan.interval}
                        </span>
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-300 space-y-1 mb-5">
                        <p className="font-medium mb-2">Includes:</p>
                        <ul className="list-disc list-inside space-y-1 pl-2">
                            {currentPlan.features.map((feature, index) => (
                                <li key={index} className="flex items-center">
                                    <FiCheckCircle className="w-3.5 h-3.5 mr-2 text-green-500 flex-shrink-0"/>
                                    <span>{feature}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                     {/* Button might go elsewhere, maybe near available plans */}
                     {/* <button className={buttonSecondaryStyles + " text-xs py-1.5 px-3"}>Change Plan</button> */}
                </div>

                {/* --- Usage Section --- */}
                <div className={cardStyle}>
                    <h3 className={headingStyle}>Current Billing Period Usage</h3>
                     <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                        Period: {formatDate(usageData.periodStart)} - {formatDate(usageData.periodEnd)}
                    </p>
                    <div className="space-y-4">
                        <UsageBar label="Pages Processed" used={usageData.pages} limit={currentPlan.limits.pages} />
                        <UsageBar label="Batches Created" used={usageData.batches} limit={currentPlan.limits.batches} />
                        <UsageBar label="API Calls Used" used={usageData.apiCalls} limit={currentPlan.limits.apiCalls} />
                        <UsageBar label="Storage Used" used={usageData.storageGB} limit={currentPlan.limits.storageGB} unit=" GB" />
                    </div>
                </div>

                 {/* --- Billing Section --- */}
                <div className={cardStyle}>
                    <h3 className={headingStyle}>Billing</h3>
                    <div className="space-y-4">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                            <div className="text-sm">
                                <p className="text-gray-500 dark:text-gray-400">Payment Method</p>
                                <p className="text-gray-700 dark:text-gray-200 font-medium flex items-center gap-2 mt-1">
                                    <FiCreditCard className="text-orange-500"/> {billingInfo.cardType} ending in {billingInfo.last4}
                                </p>
                            </div>
                            <button onClick={handleUpdatePayment} className={buttonSecondaryStyles + " text-xs py-1.5 px-3 mt-2 sm:mt-0"}>
                                Update Payment Method
                            </button>
                        </div>
                        <hr className="dark:border-gray-600"/>
                         <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                            <div className="text-sm">
                                <p className="text-gray-500 dark:text-gray-400">Next Billing Date</p>
                                <p className="text-gray-700 dark:text-gray-200 font-medium flex items-center gap-2 mt-1">
                                    <FiCalendar className="text-orange-500"/> {formatDate(billingInfo.nextBillingDate)}
                                </p>
                            </div>
                             <button onClick={handleViewHistory} className={buttonSecondaryStyles + " text-xs py-1.5 px-3 mt-2 sm:mt-0"}>
                                View Billing History
                             </button>
                        </div>
                    </div>
                </div>

                 {/* --- Change Plan Section --- */}
                 <div className={cardStyle}>
                     <h3 className={headingStyle}>Available Plans</h3>
                     <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                         {availablePlans.map(plan => (
                            <div key={plan.id} className={`p-4 rounded-lg border ${plan.id === currentPlan.id ? 'bg-orange-50 dark:bg-orange-900/30 border-orange-300 dark:border-orange-700' : 'bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600'}`}>
                                 <p className="font-semibold text-gray-800 dark:text-gray-100">{plan.name}</p>
                                 <p className="text-lg font-bold text-gray-900 dark:text-white my-1">{plan.price}<span className="text-xs font-normal text-gray-500 dark:text-gray-400">/{plan.interval}</span></p>
                                 <ul className="text-xs text-gray-600 dark:text-gray-300 space-y-1 mt-2 mb-4">
                                     {plan.features.slice(0, 2).map((f, i) => <li key={i} className="flex items-center gap-1.5"><FiCheckCircle className="w-3 h-3 text-green-500"/> {f}</li>)}
                                     {plan.features.length > 2 && <li className="text-gray-400 dark:text-gray-500">...and more</li>}
                                 </ul>
                                 {plan.id === currentPlan.id ? (
                                     <span className="block w-full text-center text-sm font-medium text-green-600 dark:text-green-400 py-1.5">Current Plan</span>
                                 ) : (
                                    <button
                                        onClick={() => handleChangePlan(plan.id)}
                                        className={`w-full text-center text-sm font-medium py-1.5 px-3 rounded-md transition-colors ${plan.price === '$0' || currentPlan.price === '$0' || parseInt(plan.price.slice(1)) > parseInt(currentPlan.price.slice(1)) ? 'bg-orange-100 text-orange-700 hover:bg-orange-200 dark:bg-orange-800/50 dark:text-orange-200 dark:hover:bg-orange-800' : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500'}`}
                                    >
                                        {/* Basic logic for Upgrade/Downgrade label */}
                                        {plan.price === '$0' ? 'Downgrade' :
                                        currentPlan.price === '$0' || parseInt(plan.price.slice(1)) > parseInt(currentPlan.price.slice(1)) ? 'Upgrade' : 'Switch Plan'}
                                    </button>
                                 )}
                            </div>
                         ))}
                     </div>
                 </div>


                {/* --- Cancel Subscription Section --- */}
                <div className="mt-10 pt-6 border-t dark:border-gray-700 text-center">
                     <button onClick={handleCancelSubscription} className={buttonDangerTextStyles}>
                        Cancel Subscription
                     </button>
                 </div>

            </div>
        </motion.div>
    );
}

export default SubscriptionSettingsContent;