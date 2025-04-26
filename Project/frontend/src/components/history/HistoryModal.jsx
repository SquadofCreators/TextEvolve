import React, { useState, useCallback } from 'react';
// Consolidate icon imports
import {
    FiX, FiInfo, FiFileText, FiCheckCircle, FiXCircle, FiLoader, FiClock, FiCopy, FiCheck // Added FiCopy, FiCheck
} from 'react-icons/fi';
import { LuCalendarDays, LuCalendarClock } from "react-icons/lu";
import { MdFolderOpen, MdOutlineInfo } from "react-icons/md";
import { FaHashtag } from "react-icons/fa6";
// Assuming these are used within the Metrics section if shown
import { RiCharacterRecognitionLine } from "react-icons/ri";
import { TbCurrentLocation } from "react-icons/tb";

// Assuming MetaText component is imported and styled appropriately
import MetaText from '../utility/MetaText';

// --- Helper Functions (Assume these are imported or defined globally/passed as props) ---
const formatDate = (isoString) => {
    if (!isoString) return 'N/A';
    try {
        // Using a slightly more detailed format
        return new Date(isoString).toLocaleString(undefined, {
            year: 'numeric', month: 'short', day: 'numeric',
            hour: 'numeric', minute: '2-digit', hour12: true // Example: Apr 26, 2025, 11:20 AM
        });
    } catch (e) {
        console.error("Error formatting date:", isoString, e);
        return 'Invalid Date';
    }
};

const getStatusBadge = (status) => {
    // Using consistent badge style definition from previous examples
    const baseStyle = 'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium';
    switch (status?.toUpperCase()) {
        case 'COMPLETED':
            return { icon: FiCheckCircle, text: 'Completed', className: `${baseStyle} bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300` };
        case 'FAILED':
            return { icon: FiXCircle, text: 'Failed', className: `${baseStyle} bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300` };
        case 'PROCESSING':
            return { icon: FiLoader, text: 'Processing', className: `${baseStyle} bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300`, animate: true };
        case 'PENDING': case 'UPLOADED': case 'NEW':
            return { icon: FiClock, text: 'Pending', className: `${baseStyle} bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300` };
        default:
            return { icon: FiInfo, text: status || 'Unknown', className: `${baseStyle} bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300` };
    }
};

// --- History Modal Component ---
const HistoryModal = ({ isOpen, onClose, batch }) => {
    const [isCopied, setIsCopied] = useState(false);

    // Copy Batch ID to clipboard
    const handleCopy = useCallback(() => {
        if (batch?.id) {
            navigator.clipboard.writeText(batch.id)
                .then(() => {
                    setIsCopied(true);
                    setTimeout(() => setIsCopied(false), 2000); // Reset after 2 seconds
                })
                .catch(err => {
                    console.error('Failed to copy batch ID: ', err);
                    // Optionally show an error message to the user
                });
        }
    }, [batch?.id]);


    // Early return if modal shouldn't be open or no batch data
    if (!isOpen || !batch) return null;

    // Prepare status info and formatted accuracy
    const statusInfo = getStatusBadge(batch.status);
    const formattedAccuracy = (batch.accuracy !== null && !isNaN(Number(batch.accuracy)))
        ? `${(Number(batch.accuracy) * 100).toFixed(1)}%` // Ensure accuracy is treated as number
        : 'N/A';

    const showMetrics = (batch.status === 'COMPLETED' || batch.status === 'FAILED') &&
                        (batch.accuracy !== null || batch.totalWordCount !== null || batch.totalCharacterCount !== null);

    // Unique ID for aria-labelledby
    const modalTitleId = `history-modal-title-${batch.id}`;

    return (
        <div
            className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-gray-900/60 dark:bg-gray-900/80 backdrop-blur-sm animate-fade-in"
            role="dialog" // Accessibility: Role
            aria-modal="true" // Accessibility: Indicates it's a modal
            aria-labelledby={modalTitleId} // Accessibility: Links to title
        >
            {/* Modal Content Container */}
            <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden border border-gray-200 dark:border-gray-700">

                {/* Header */}
                <div className="flex items-center justify-between flex-shrink-0 px-5 py-4 border-b border-gray-200 dark:border-gray-700">
                    <h3
                        id={modalTitleId} // Accessibility: Target for aria-labelledby
                        className="text-lg font-semibold text-gray-900 dark:text-gray-100 truncate pr-4" // Allow truncation
                        title={batch.name ?? 'Batch Information'} // Show full name on hover
                    >
                        {batch.name || `Batch Information`}
                    </h3>
                    <button
                        onClick={onClose}
                        title="Close (Esc)"
                        aria-label="Close modal" // Accessibility: Label for screen readers
                        className="text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-600 dark:hover:text-gray-300 rounded-full p-1.5 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-800 focus:ring-orange-500"
                    >
                        <FiX className="w-5 h-5" />
                    </button>
                </div>

                {/* Body - Scrollable Content */}
                <div className="px-5 py-5 space-y-4 overflow-y-auto flex-grow"> {/* Use flex-grow for body */}

                    {/* Batch ID with Copy Button */}
                    <div className="flex items-center justify-between">
                        <MetaText
                            icon={<FaHashtag className="w-4 h-4 text-gray-500 dark:text-gray-400" />}
                            title="Batch ID"
                            value={batch.id}
                            valueClassName="truncate font-mono text-sm" // Style for ID
                        />
                        <button
                            onClick={handleCopy}
                            title={isCopied ? "Copied!" : "Copy Batch ID"}
                            aria-label={isCopied ? "Batch ID Copied" : "Copy Batch ID"}
                            className={`ml-3 p-1.5 rounded-md transition-all duration-150 ease-in-out ${
                                isCopied
                                ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-300 focus:ring-green-500'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 focus:ring-orange-500'
                            } focus:outline-none focus:ring-2 focus:ring-offset-1 dark:focus:ring-offset-gray-800`}
                        >
                            {isCopied ? <FiCheck className="w-4 h-4" /> : <FiCopy className="w-4 h-4" />}
                        </button>
                    </div>

                    {/* Other Batch Info */}
                    <MetaText
                        icon={<LuCalendarDays className="w-4 h-4 text-gray-500 dark:text-gray-400" />}
                        title="Created On"
                        value={formatDate(batch.createdAt)}
                    />
                    <MetaText
                        icon={<LuCalendarClock className="w-4 h-4 text-gray-500 dark:text-gray-400" />}
                        title="Last Updated"
                        value={formatDate(batch.updatedAt)}
                    />
                     <MetaText
                        icon={<MdFolderOpen className="w-4 h-4 text-gray-500 dark:text-gray-400" />}
                        title="File Count"
                        value={batch.totalFileCount !== undefined ? `${batch.totalFileCount} file${batch.totalFileCount !== 1 ? 's' : ''}` : 'N/A'}
                    />
                    <MetaText
                        icon={<MdOutlineInfo className="w-4 h-4 text-gray-500 dark:text-gray-400" />}
                        title="Status"
                        // Embed the status badge directly using the 'element' prop
                        element={
                            <span className={statusInfo.className}>
                                <statusInfo.icon className={`w-3.5 h-3.5 ${statusInfo.animate ? 'animate-spin' : ''}`} />
                                {statusInfo.text}
                            </span>
                        }
                    />

                    {/* Conditional Metrics Section */}
                    {showMetrics && (
                        <div className="pt-4 mt-4 border-t border-gray-200 dark:border-gray-700 space-y-3">
                            <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-3">
                                Summary Metrics
                            </h4>
                            {/* Display metrics only if available */}
                            {batch.accuracy !== null && !isNaN(Number(batch.accuracy)) && (
                                <MetaText
                                    icon={<TbCurrentLocation className="w-4 h-4 text-gray-500 dark:text-gray-400" />}
                                    title="Avg Accuracy"
                                    value={formattedAccuracy}
                                    valueClassName="font-medium text-gray-800 dark:text-gray-200"
                                />
                            )}
                            {batch.totalWordCount !== null && batch.totalWordCount >= 0 && (
                                <MetaText
                                    icon={<FiFileText className="w-4 h-4 text-gray-500 dark:text-gray-400" />}
                                    title="Total Words"
                                    value={batch.totalWordCount?.toLocaleString() ?? 'N/A'}
                                />
                            )}
                            {batch.totalCharacterCount !== null && batch.totalCharacterCount >= 0 && (
                                <MetaText
                                    icon={<RiCharacterRecognitionLine className="w-4 h-4 text-gray-500 dark:text-gray-400" />}
                                    title="Total Characters"
                                    value={batch.totalCharacterCount?.toLocaleString() ?? 'N/A'}
                                />
                            )}
                        </div>
                    )}
                </div>

                {/* Footer (Optional - can be removed if header close is sufficient) */}
                {/* Example: If you wanted a dedicated close button here */}
                {/* <div className="flex items-center justify-end p-4 border-t border-gray-200 dark:border-gray-700 flex-shrink-0 bg-gray-50 dark:bg-gray-800/50 rounded-b-lg">
                    <button
                        onClick={onClose}
                        type="button"
                        className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-800 focus:ring-orange-500 transition duration-150"
                    >
                        Close
                    </button>
                </div> */}

            </div> {/* End Modal Content Container */}
        </div> // End Modal Backdrop
    );
};

export default HistoryModal;