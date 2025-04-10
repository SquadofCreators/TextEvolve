import React from 'react';
import { RiCharacterRecognitionLine } from "react-icons/ri"; 
import { TbCurrentLocation } from "react-icons/tb"; 
import { FiX, FiInfo, FiFileText, FiCheckCircle, FiXCircle, FiLoader, FiClock, FiCalendar } from 'react-icons/fi'; // Keep/add necessary icons
import MetaText from '../utility/MetaText'

import { LuCalendarDays, LuCalendarClock } from "react-icons/lu";
import { GrStorage } from "react-icons/gr";
import { MdFolderOpen, MdOutlineInfo } from "react-icons/md"; // Added Info icon
import { FaHashtag } from "react-icons/fa6";

// Helper function to format date (import from utils or define/pass as prop)
const formatDate = (isoString) => {
    if (!isoString) return 'N/A';
    try {
        return new Date(isoString).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
    } catch (e) { return 'Invalid Date'; }
};

// Helper to get status badge styles (import from utils or define/pass as prop)
const getStatusBadge = (status) => {
    switch (status) {
        case 'COMPLETED':
            return { icon: FiCheckCircle, text: 'Completed', color: 'text-green-700 dark:text-green-400 bg-green-100 dark:bg-green-900/30' };
        case 'FAILED':
            return { icon: FiXCircle, text: 'Failed', color: 'text-red-700 dark:text-red-400 bg-red-100 dark:bg-red-900/30' };
        case 'PROCESSING':
            return { icon: FiLoader, text: 'Processing', color: 'text-blue-700 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30', animate: true };
        case 'PENDING': case 'UPLOADED': case 'NEW': // Group similar pending states
            return { icon: FiClock, text: 'Pending', color: 'text-yellow-700 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/30' };
        default:
            return { icon: FiInfo, text: status || 'Unknown', color: 'text-gray-700 dark:text-gray-400 bg-gray-100 dark:bg-gray-700' };
    }
};

// Accept `batch` prop instead of `doc`
const HistoryModal = ({ isOpen, onClose, batch }) => {
    // Removed currentPage state and useEffect - no longer needed for 'info' only modal

    if (!isOpen || !batch) return null; // Use batch prop here

    // Get status badge info
    const statusInfo = getStatusBadge(batch.status);

    // Format accuracy if available
    const formattedAccuracy = (batch.accuracy !== null && batch.accuracy !== undefined)
        ? `${(batch.accuracy * 100).toFixed(1)}%`
        : 'N/A';

    return (
        // Use a slightly improved modal structure (similar to PreviewModal)
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
            {/* Modal Content */}
            <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between flex-shrink-0 p-4 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-2xl font-extrabold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                        {
                          batch.name ?? 'Batch Information'
                        }
                    </h3>
                    <button
                        onClick={onClose}
                        title="Close (Esc)"
                        className="text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white rounded-full text-sm p-1.5 transition-colors"
                    >
                        <FiX className="w-5 h-5" />
                        <span className="sr-only">Close modal</span>
                    </button>
                </div>

                {/* Body - Display Batch Info */}
                <div className="p-5 space-y-4 overflow-y-auto">
                    {/* Use batch fields */}

                    <MetaText
                        icon={<FaHashtag className="w-4 h-4 text-gray-500" />}
                        title="Batch ID"
                        value={batch.id}
                    />

                    <MetaText
                        icon={<LuCalendarDays className="w-4 h-4 text-gray-500" />}
                        title="Created On"
                        value={formatDate(batch.createdAt)}
                    />

                    <MetaText
                        icon={<LuCalendarClock className="w-4 h-4 text-gray-500" />}
                        title="Last Updated"
                        value={formatDate(batch.updatedAt)}
                    />

                    <MetaText
                        icon={<MdFolderOpen className="w-4 h-4 text-gray-500" />}
                        title="File Count"
                        value={batch.totalFileCount > 1 ? `${batch.totalFileCount} files` : `${batch.totalFileCount} file` || 'N/A'}
                    />
                    
                    <MetaText
                        icon={<MdOutlineInfo className="w-4 h-4 text-gray-500" />}
                        title="Status"
                        element={
                          <p className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${statusInfo.color}`}>
                              {statusInfo.text}
                          </p>
                        }
                    />

                     {/* Display metrics only if completed/failed and available */}
                     {(batch.status === 'COMPLETED' || batch.status === 'FAILED') && (batch.accuracy !== null || batch.totalWordCount !== null || batch.totalCharacterCount !== null) && (
                        <div className="pt-4 mt-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
                          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Summary Metrics</h4>
                          
                          <MetaText
                              icon={<TbCurrentLocation className="w-4 h-4 text-gray-500" />}
                              title="Avg Accuracy"
                              value={formattedAccuracy ?? 'N/A'}
                          />

                          <MetaText
                              icon={<FiFileText className="w-4 h-4 text-gray-500" />}
                              title="Total Words"
                              value={batch.totalWordCount?.toLocaleString() ?? 'N/A'}
                          />

                          <MetaText
                              icon={<RiCharacterRecognitionLine className="w-4 h-4 text-gray-500" />}
                              title="Total Characters"
                              value={batch.totalCharacterCount?.toLocaleString() ?? 'N/A'}
                          />
                        </div>
                    )}

                    {/* Removed file preview logic */}
                    {/* Removed fields that are not in the batch object like language, description, docType etc. */}
                </div>

                 {/* Footer - Simple Close Button */}
                <div className="flex items-center justify-end p-4 border-t border-gray-200 dark:border-gray-700 rounded-b flex-shrink-0">
                    <button
                        onClick={onClose}
                        type="button"
                        className="px-5 py-2 text-sm font-medium text-center text-white bg-orange-600 rounded-lg hover:bg-orange-700 focus:ring-4 focus:outline-none focus:ring-orange-300 dark:bg-orange-500 dark:hover:bg-orange-600 dark:focus:ring-orange-800 transition duration-150"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default HistoryModal;