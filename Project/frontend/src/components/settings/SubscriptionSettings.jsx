import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
    FiCheckCircle, FiDollarSign, FiZap, FiCreditCard, FiCalendar, FiInfo, // Using FiInfo instead of FiBarChart2
    FiRefreshCw, FiXCircle, FiExternalLink, FiChevronRight, FiCheck, FiPackage // Added FiPackage
} from 'react-icons/fi';
import { Link } from 'react-router-dom'; // If billing history is an internal route

const sectionVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
    exit: { opacity: 0, transition: { duration: 0.2, ease: 'easeIn' } }
};

// --- Dummy Data (Replace with props/fetched data) ---
// (Keep dummy data structure as is for the example)
const dummyCurrentPlan = {
    id: 'plan_researcher', // Added ID for comparison
    name: 'Researcher Plan',
    price: '$15',
    interval: 'month',
    limits: { pages: 2000, batches: 50, apiCalls: 10000, storageGB: 10 },
    features: ['High Accuracy OCR', 'AI Polishing', 'Translation (5 Lang)', 'API Access', 'Email Support'],
};

const dummyUsageData = {
    pages: 1250, batches: 35, apiCalls: 4500, storageGB: 4.2,
    periodStart: '2025-04-01T00:00:00Z', periodEnd: '2025-04-30T23:59:59Z',
};

const dummyBillingInfo = {
    cardType: 'Visa', last4: '4242', nextBillingDate: '2025-05-01T00:00:00Z',
    billingHistoryUrl: '#' // Placeholder - Use internal route or Stripe portal link
};

const dummyAvailablePlans = [
     { id: 'plan_free', name: 'Free Tier', price: '$0', interval: 'month', limits: { pages: 100 }, features: ['Standard OCR', 'Limited Usage', 'Community Support'] },
     { id: 'plan_researcher', name: 'Researcher Plan', price: '$15', interval: 'month', limits: { pages: 2000 }, features: ['High Accuracy OCR', 'AI Polishing', 'API Access', 'Email Support'] },
     { id: 'plan_team', name: 'Team Plan', price: '$45', interval: 'month', limits: { pages: 10000 }, features: ['All Researcher Features', 'Collaboration Tools', 'Priority Support', 'Custom Integrations'] },
];
// --- End Dummy Data ---

// --- Helper: Usage Progress Bar Component (Keep as is) ---
const UsageBar = ({ label, used, limit, unit = '' }) => {
    const percentage = limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0;
    const isNearLimit = percentage > 85 && percentage < 100;
    const isOverLimit = percentage >= 100;

    let bgColor = 'bg-gradient-to-r from-orange-400 to-orange-600'; // Default gradient
    if (isNearLimit) bgColor = 'bg-gradient-to-r from-yellow-400 to-yellow-500';
    if (isOverLimit) bgColor = 'bg-gradient-to-r from-red-500 to-red-600';

    // Format numbers for readability
    const formatNumber = (num) => num.toLocaleString() ?? '0';

    return (
        <div className="mb-3 text-sm">
            <div className="flex justify-between mb-1 text-gray-600 dark:text-gray-400">
                <span>{label}</span>
                <span className={`font-medium ${isOverLimit ? 'text-red-600 dark:text-red-400' : (isNearLimit ? 'text-yellow-600 dark:text-yellow-400' : 'text-gray-700 dark:text-gray-300')}`}>
                    {formatNumber(used)}{unit} / {formatNumber(limit)}{unit} ({percentage}%)
                </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2 overflow-hidden">
                <div
                    className={`h-2 rounded-full transition-all duration-500 ease-out ${bgColor}`}
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

    // --- Placeholder Handlers (Keep logic, update alerts slightly) ---
    const handleUpdatePayment = () => {
        alert('Initiating payment method update... (Requires backend integration with Stripe Billing Portal or similar)');
        // Example: Redirect to a backend endpoint that generates a Stripe portal session
        // window.location.href = '/api/billing/manage-payment';
    };

    const handleViewHistory = () => {
        if (billingInfo.billingHistoryUrl && billingInfo.billingHistoryUrl !== '#') {
             alert(`Opening billing history... (Target: ${billingInfo.billingHistoryUrl})`);
             // If external link (like Stripe portal)
             window.open(billingInfo.billingHistoryUrl, '_blank');
             // If internal React Router link:
             // navigate(billingInfo.billingHistoryUrl);
        } else {
             alert('Billing history integration not available yet.');
        }
    };

     const handleChangePlan = (planId) => {
        const targetPlan = availablePlans.find(p => p.id === planId);
        if (!targetPlan || targetPlan.id === currentPlan.id) return;

        if (window.confirm(`Are you sure you want to switch to the ${targetPlan.name}? Review changes carefully before confirming.`)) {
            alert(`Switching to ${targetPlan.name}... (Requires backend API call to update subscription)`);
            // TODO: API call to change subscription plan (e.g., POST /api/subscription { planId: planId })
        }
     };

     const handleCancelSubscription = () => {
        if (window.confirm('Are you sure you want to cancel your subscription? This will likely take effect at the end of your current billing period.')) {
            alert('Cancelling subscription... (Requires backend API call)');
            // TODO: API call to cancel subscription (e.g., DELETE /api/subscription)
        }
     };

    // --- Helper: Format Date ---
    const formatDate = (isoString) => {
        if (!isoString) return 'N/A';
        try {
             // Using Intl for better locale support and formatting options
             return new Intl.DateTimeFormat(undefined, { // Use browser's default locale
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            }).format(new Date(isoString));
        } catch (e) { return 'Invalid Date'; }
    }

    // --- Render Logic ---
    return (
        <motion.div variants={sectionVariants} initial="hidden" animate="visible" exit="exit">
             {/* Increased spacing between sections */}
            <div className="space-y-10">

                {/* --- Combined Current Plan & Usage Section --- */}
                <section aria-labelledby="current-plan-heading" className="bg-white dark:bg-gray-800 p-6 md:p-8 rounded-lg shadow border border-gray-200 dark:border-gray-700">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Plan Details Column */}
                        <div className="lg:col-span-1">
                            <h3 id="current-plan-heading" className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
                                <FiPackage className="text-orange-500"/> Current Plan
                            </h3>
                            <div className="mb-4">
                                <span className="text-2xl font-bold text-orange-600 dark:text-orange-400">{currentPlan.name}</span>
                                <p className="text-lg font-semibold text-gray-700 dark:text-gray-200 mt-1">
                                    {currentPlan.price} <span className="text-sm font-normal text-gray-500 dark:text-gray-400">/ {currentPlan.interval}</span>
                                </p>
                            </div>
                            <div className="text-sm text-gray-700 dark:text-gray-300 space-y-2">
                                <p className="font-medium text-gray-800 dark:text-gray-100 mb-1">Key features:</p>
                                <ul className="space-y-1.5">
                                    {currentPlan.features.map((feature, index) => (
                                        <li key={index} className="flex items-center gap-2">
                                            <FiCheck className="w-4 h-4 text-green-500 flex-shrink-0"/>
                                            <span>{feature}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>

                        {/* Usage Column */}
                        <div className="lg:col-span-2">
                             <h4 className="text-base font-semibold text-gray-800 dark:text-gray-100 mb-1 flex items-center gap-2">
                                <FiInfo className="text-orange-500"/> Current Billing Period Usage
                             </h4>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mb-5">
                                Period: {formatDate(usageData.periodStart)} &mdash; {formatDate(usageData.periodEnd)}
                             </p>
                             <div className="space-y-5"> {/* Increased space between usage bars */}
                                <UsageBar label="Pages Processed" used={usageData.pages} limit={currentPlan.limits.pages} />
                                <UsageBar label="Batches Created" used={usageData.batches} limit={currentPlan.limits.batches} />
                                <UsageBar label="API Calls" used={usageData.apiCalls} limit={currentPlan.limits.apiCalls} />
                                <UsageBar label="Storage" used={usageData.storageGB} limit={currentPlan.limits.storageGB} unit=" GB" />
                             </div>
                        </div>
                    </div>
                </section>

                 {/* --- Billing Section --- */}
                <section aria-labelledby="billing-heading" className="bg-white dark:bg-gray-800 p-6 md:p-8 rounded-lg shadow border border-gray-200 dark:border-gray-700">
                    <h3 id="billing-heading" className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-6 flex items-center gap-2">
                        <FiDollarSign className="text-orange-500"/> Billing Information
                    </h3>
                    {/* Billing Details Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 mb-6">
                         {/* Payment Method */}
                         <div>
                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Payment Method</p>
                            <p className="text-base text-gray-700 dark:text-gray-200 font-medium flex items-center gap-2 mt-1">
                                <FiCreditCard className="text-orange-500 w-5 h-5"/>
                                {billingInfo.cardType} ending in {billingInfo.last4}
                            </p>
                        </div>
                         {/* Next Billing Date */}
                         <div>
                             <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Next Billing Date</p>
                            <p className="text-base text-gray-700 dark:text-gray-200 font-medium flex items-center gap-2 mt-1">
                                <FiCalendar className="text-orange-500 w-5 h-5"/>
                                {formatDate(billingInfo.nextBillingDate)}
                            </p>
                        </div>
                    </div>
                    {/* Billing Actions */}
                    <div className="flex flex-col sm:flex-row gap-3 border-t border-gray-200 dark:border-gray-700 pt-6">
                         <button
                            onClick={handleUpdatePayment}
                            className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-colors"
                         >
                           <FiRefreshCw className="w-4 h-4 mr-2"/> Update Payment Method
                         </button>
                         <button
                            onClick={handleViewHistory}
                            className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-colors"
                         >
                            <FiExternalLink className="w-4 h-4 mr-2"/> View Billing History
                         </button>
                    </div>
                     {/* Cancel Subscription Link */}
                     <div className="mt-6 text-center sm:text-right">
                         <button onClick={handleCancelSubscription} className="text-sm font-medium text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 focus:outline-none focus:underline inline-flex items-center gap-1">
                            <FiXCircle className="w-4 h-4"/> Cancel Subscription
                         </button>
                     </div>
                </section>

                {/* --- Change Plan Section --- */}
                <section aria-labelledby="change-plan-heading" className="bg-white dark:bg-gray-800 p-6 md:p-8 rounded-lg shadow border border-gray-200 dark:border-gray-700">
                    <h3 id="change-plan-heading" className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-6 flex items-center gap-2">
                        <FiZap className="text-orange-500"/> Available Plans
                    </h3>
                    {/* Responsive Grid for Plans */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        {availablePlans.map(plan => {
                            const isCurrent = plan.id === currentPlan.id;
                            const isUpgrade = !isCurrent && (plan.price === '$0' ? false : (currentPlan.price === '$0' || parseInt(plan.price.slice(1)) > parseInt(currentPlan.price.slice(1))));
                            const isDowngrade = !isCurrent && !isUpgrade;

                            return (
                                <div
                                    key={plan.id}
                                    // Enhanced card styling with hover effect and clear current plan indicator
                                    className={`relative p-5 rounded-lg border-2 transition-all duration-200 ${
                                        isCurrent
                                            ? 'bg-orange-50 dark:bg-orange-900/30 border-orange-500 dark:border-orange-600 shadow-lg'
                                            : 'bg-gray-50 dark:bg-gray-800/60 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-500 hover:shadow-md'
                                    }`}
                                >
                                    {/* Current Plan Badge */}
                                    {isCurrent && (
                                        <span className="absolute top-0 right-0 -mt-3 mr-3 bg-orange-600 text-white text-xs font-bold px-2.5 py-0.5 rounded-full shadow">Current</span>
                                    )}

                                    {/* Plan Details */}
                                    <p className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-1">{plan.name}</p>
                                    <p className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                                        {plan.price}
                                        <span className="text-sm font-normal text-gray-500 dark:text-gray-400"> / {plan.interval}</span>
                                    </p>
                                    <ul className="text-xs text-gray-600 dark:text-gray-300 space-y-1.5 mt-3 mb-5 min-h-[60px]"> {/* Min height for alignment */}
                                        {plan.features.slice(0, 3).map((f, i) => ( // Show up to 3 features
                                            <li key={i} className="flex items-center gap-1.5">
                                                <FiCheck className="w-3.5 h-3.5 text-green-500 flex-shrink-0"/> {f}
                                            </li>
                                        ))}
                                        {plan.features.length > 3 && <li className="text-gray-400 dark:text-gray-500 pt-1">... and more</li>}
                                    </ul>

                                    {/* Action Button */}
                                    {!isCurrent && (
                                        <button
                                            onClick={() => handleChangePlan(plan.id)}
                                            // Consistent button styling, primary for upgrade, secondary otherwise
                                            className={`w-full text-center text-sm font-semibold py-2 px-3 rounded-md transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-800 focus:ring-orange-500 ${
                                                isUpgrade
                                                    ? 'bg-orange-600 text-white hover:bg-orange-700'
                                                    : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 ring-1 ring-inset ring-gray-300 dark:ring-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600'
                                            }`}
                                        >
                                            {isUpgrade ? 'Upgrade Plan' : (isDowngrade ? 'Downgrade Plan' : 'Switch Plan')}
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </section>

            </div>
        </motion.div>
    );
}

export default SubscriptionSettingsContent;