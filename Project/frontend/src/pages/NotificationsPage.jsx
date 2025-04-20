// src/pages/NotificationsPage.jsx
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext'; // Adjust path
import PageHeader from '../components/utility/PageHeader'; // Adjust path
import {
    FiBell, FiCheckCircle, FiAlertTriangle, FiInfo, FiCreditCard,
    FiMoreVertical, FiCheck, FiLoader // Added FiLoader
} from "react-icons/fi";

// --- Helper: Time Ago Formatter (Keep as before or use a library) ---
const formatTimeAgo = (dateString) => {
    // ... (implementation from previous step) ...
    if (!dateString) return '';
    try {
        const date = new Date(dateString);
        const now = new Date();
        const seconds = Math.round((now - date) / 1000);
        const minutes = Math.round(seconds / 60);
        const hours = Math.round(minutes / 60);
        const days = Math.round(hours / 24);

        if (seconds < 5) return `just now`;
        if (seconds < 60) return `${seconds}s ago`;
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        if (days < 7) return `${days}d ago`;
        return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    } catch (e) {
        console.error("Error formatting date:", e);
        return new Date(dateString).toLocaleDateString(); // Fallback
    }
};

// --- Notification Item Component (Revised with `dark:`, ideally separate file) ---
function NotificationItem({ notification, darkMode, onMarkReadToggle, onDelete }) {
    const { id, type, title, timestamp, read, link, details } = notification;
    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef(null);

    const getIcon = () => {
        const iconClass = "w-5 h-5 flex-shrink-0"; // Consistent size
        switch (type) {
            // Apply dark mode text colors for icons
            case 'BATCH_COMPLETE': return <FiCheckCircle className={`${iconClass} text-green-600 dark:text-green-400`} />;
            case 'BATCH_FAILED': return <FiAlertTriangle className={`${iconClass} text-red-600 dark:text-red-400`} />;
            case 'BILLING_REMINDER':
            case 'BILLING_ISSUE': return <FiCreditCard className={`${iconClass} text-yellow-500 dark:text-yellow-400`} />;
            case 'ANNOUNCEMENT': return <FiInfo className={`${iconClass} text-blue-600 dark:text-blue-400`} />;
            default: return <FiBell className={`${iconClass} text-gray-500 dark:text-gray-400`} />;
        }
    };

    // Click outside logic (no theme changes needed)
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleMenuToggle = (e) => {
        e.preventDefault(); e.stopPropagation();
        setMenuOpen(prev => !prev);
    };

    const handleActionClick = (e, actionFn) => {
         e.preventDefault(); e.stopPropagation();
         actionFn();
         setMenuOpen(false);
    }

    const WrapperComponent = link ? Link : 'div';
    const wrapperProps = link ? { to: link } : {};

    return (
        <WrapperComponent
            {...wrapperProps}
            className={`relative flex items-start gap-4 p-4 rounded-lg border transition-colors duration-200 ease-in-out group ${
                read
                    // Read state: More subtle background difference
                    ? 'bg-white dark:bg-gray-800/60 border-gray-200 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/80'
                    // Unread state: Using subtle orange tint
                    : 'bg-orange-50/60 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800/40 hover:bg-orange-50 dark:hover:bg-orange-900/30'
            } ${link ? 'cursor-pointer' : 'cursor-default'}`}
        >
            {/* Unread Indicator Dot - Theme consistent */}
            {!read && (
                <span
                  className="absolute top-4 left-2 w-2 h-2 bg-orange-500 dark:bg-orange-400 rounded-full"
                  title="Unread"
                  aria-hidden="true"
                ></span>
            )}

            {/* Icon - Place icon slightly differently based on read status */}
            <div className={`flex-shrink-0 mt-0.5 ${!read ? 'ml-4' : ''}`}>
                {getIcon()}
            </div>

            {/* Content - Apply text colors */}
            <div className="flex-grow">
                <p className={`text-sm font-medium text-gray-900 dark:text-gray-100 ${!read ? 'font-semibold': ''}`}>{title}</p>
                {details && <p className="text-sm mt-1 text-gray-600 dark:text-gray-400">{details}</p>}
                <p className="text-xs mt-1.5 text-gray-500 dark:text-gray-400">{formatTimeAgo(timestamp)}</p>
            </div>

            {/* Actions Menu - Apply button hover colors */}
            <div className="relative flex-shrink-0" ref={menuRef}>
                <button
                    onClick={handleMenuToggle}
                    className={`p-1 rounded-full transition-colors text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-gray-100`}
                    aria-label="Notification actions"
                    aria-haspopup="true"
                    aria-expanded={menuOpen}
                >
                    <FiMoreVertical className="h-4 w-4" />
                </button>
                {menuOpen && (
                    <div className="absolute top-full right-0 mt-1 w-44 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 z-10 py-1">
                        <ul>
                            <li>
                                <button
                                    onClick={(e) => handleActionClick(e, () => onMarkReadToggle(id, read))}
                                    className="w-full text-left px-3 py-1.5 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 text-gray-700 dark:text-gray-200"
                                >
                                   <FiCheck className="w-4 h-4" /> {read ? 'Mark as unread' : 'Mark as read'}
                                </button>
                            </li>
                            <li>
                                <button
                                    onClick={(e) => handleActionClick(e, () => onDelete(id))}
                                    className="w-full text-left px-3 py-1.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 flex items-center gap-2"
                                >
                                    <FiAlertTriangle className="w-4 h-4"/> Delete
                                </button>
                            </li>
                        </ul>
                    </div>
                )}
            </div>
        </WrapperComponent>
    );
}

// --- Main Notifications Page Component ---
function NotificationsPage() {
    const { darkMode } = useTheme(); // Use theme context
    const [notifications, setNotifications] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // --- Mock Data (Keep as is or fetch) ---
    const mockNotifications = [
        // ... (same mock data as previous step) ...
        { id: 'n1', type: 'BATCH_COMPLETE', title: 'Batch "Meeting Notes Q1" processed', timestamp: '2025-04-19T21:30:00Z', read: false, link: '/batch/b123', details: '3 out of 3 files successfully converted.' },
        { id: 'n2', type: 'BILLING_REMINDER', title: 'Subscription Renewal Soon', timestamp: '2025-04-18T15:00:00Z', read: false, link: '/billing', details: 'Your TextEvolve Pro plan renews in 3 days.' },
        { id: 'n3', type: 'BATCH_FAILED', title: 'Batch "Old Letters Scan" failed', timestamp: '2025-04-18T09:15:00Z', read: true, link: '/batch/b120', details: '1 file (scan_05.jpg) could not be processed due to poor quality.' },
        { id: 'n4', type: 'ANNOUNCEMENT', title: 'New Feature: PDF/A Support', timestamp: '2025-04-17T11:00:00Z', read: true, link: '/support/article/pdf-options', details: 'You can now export documents in PDF/A format for long-term archiving.' },
        { id: 'n5', type: 'BATCH_COMPLETE', title: 'Batch "Client Contracts" processed', timestamp: '2025-04-16T18:45:00Z', read: true, link: '/batch/b115', details: 'All 15 files successfully converted.' },
    ];
    // --- End Mock Data ---

    // --- Fetching Logic (Keep as is or implement API call) ---
    useEffect(() => {
        setIsLoading(true);
        setError(null);
        setTimeout(() => {
            try {
                const sortedNotifications = mockNotifications.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
                setNotifications(sortedNotifications);
                setIsLoading(false);
            } catch(err) {
                setError("Could not load notifications.");
                setIsLoading(false);
            }
        }, 800);
        // TODO: Replace timeout with actual API fetch
    }, []);

    // --- Action Handlers (Keep as is, add API calls) ---
    const handleMarkAllRead = () => {
        // TODO: API Call
        console.log("API CALL: Mark all as read");
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    };
    const handleMarkOneRead = (id, currentReadStatus) => {
        // TODO: API Call
        console.log(`API CALL: Mark notification ${id} as ${!currentReadStatus ? 'read' : 'unread'}`);
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: !currentReadStatus } : n));
    };
    const handleDeleteNotification = (id) => {
        // TODO: API Call
        console.log(`API CALL: Delete notification ${id}`);
        setNotifications(prev => prev.filter(n => n.id !== id));
    };

    // --- Derived State ---
    const unreadCount = useMemo(() => notifications.filter(n => !n.read).length, [notifications]);

    // --- Render ---
    return (
        // Base page styling using dark: prefixes
        <div className={`min-h-screen bg-gray-50 text-gray-700 dark:bg-gray-900 dark:text-gray-300 transition-colors duration-300 ease-in-out`}>
            <div className="mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
                {/* Page Header - Assuming it handles its own theming */}
                <PageHeader title="Notifications" link="/" />

                {/* Toolbar - Apply dark: prefixes */}
                <div className="my-6 flex justify-end items-center border-b border-gray-200 dark:border-gray-700 pb-4">
                    {notifications.length > 0 && !isLoading && (
                        <button
                            onClick={handleMarkAllRead}
                            disabled={unreadCount === 0 || isLoading}
                            className={`text-sm font-medium transition-all duration-200 flex items-center gap-1.5 ${
                                unreadCount > 0 && !isLoading
                                // Consistent orange accent for button text
                                ? 'text-orange-600 hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-300'
                                // Disabled state colors
                                : 'text-gray-400 dark:text-gray-500 cursor-not-allowed'
                            }`}
                        >
                           <FiCheck size={16}/> Mark all as read ({unreadCount})
                        </button>
                    )}
                </div>

                {/* Notification List Area - Apply dark: prefixes */}
                <div className="space-y-3">
                    {isLoading ? (
                         // Loading Skeleton - Apply dark: prefixes to background colors
                        <div className="space-y-3">
                            {[...Array(3)].map((_, i) => (
                                <div key={i} className={`p-4 rounded-lg border animate-pulse bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700`}>
                                    <div className="flex gap-4">
                                        <div className="w-5 h-5 rounded-full bg-gray-300 dark:bg-gray-700"></div>
                                        <div className="flex-grow space-y-2">
                                            <div className="h-4 rounded w-3/4 bg-gray-300 dark:bg-gray-700"></div>
                                            <div className="h-3 rounded w-1/2 bg-gray-300 dark:bg-gray-700"></div>
                                            <div className="h-2.5 rounded w-1/4 bg-gray-300 dark:bg-gray-700"></div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : error ? (
                        // Error State - Apply dark: prefixes
                        <div className={`text-center py-10 px-6 rounded-lg border bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-700/50`}>
                            <FiAlertTriangle className="mx-auto h-10 w-10 text-red-500 dark:text-red-400 mb-3" />
                            <p className="text-lg font-medium mb-1 text-red-800 dark:text-red-200">Error Loading Notifications</p>
                            <p className="text-red-700 dark:text-red-300">{error}</p>
                        </div>
                    ) : notifications.length === 0 ? (
                        // Empty State - Apply dark: prefixes
                        <div className={`text-center py-16 px-6 rounded-lg border bg-gray-100 border-gray-200 dark:bg-gray-800 dark:border-gray-700`}>
                           <FiBell className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500 mb-4" />
                           <p className="text-lg font-medium mb-2 text-gray-700 dark:text-gray-300">All Caught Up!</p>
                           <p className="text-gray-600 dark:text-gray-400">You have no new notifications.</p>
                         </div>
                    ) : (
                        // Render Notification Items
                        notifications.map(notification => (
                            <NotificationItem
                                key={notification.id}
                                notification={notification}
                                darkMode={darkMode} // Pass darkMode if needed internally by NotificationItem (though prefixes handle it)
                                onMarkReadToggle={handleMarkOneRead}
                                onDelete={handleDeleteNotification}
                            />
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}

export default NotificationsPage;