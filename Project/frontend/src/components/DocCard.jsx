// src/components/DocCard.jsx

import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { LuCalendarClock } from "react-icons/lu";
import { GrStorage } from "react-icons/gr";
import { MdFolderOpen, MdOutlineInfo } from "react-icons/md";
import { FiEye, FiClipboard } from "react-icons/fi";
import MetaText from '../components/utility/MetaText'; // Keep assuming this component handles icon+text nicely

// --- Default Formatters ---
const defaultFormatDate = (d) => d ? new Date(d).toLocaleString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }) : 'N/A';
const defaultFormatBytes = (b, decimals = 1) => {
    if (typeof b === 'string') { try { b = BigInt(b); } catch (e) { return 'N/A'; } }
    if (b === undefined || b === null || b < 0n) return 'N/A';
    if (b === 0n) return '0 Bytes';
    const k = 1024n; const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']; let i = 0; let size = b;
    while (size >= k && i < sizes.length - 1) { size /= k; i++; }
    const numSize = Number(b) / Number(k ** BigInt(i));
    return parseFloat(numSize.toFixed(dm)) + ' ' + sizes[i];
}

// --- Status Styling ---
const getStatusInfo = (status) => {
    switch (status) {
        case 'COMPLETED': return { text: "Completed", color: "text-green-800 dark:text-green-300", bg: "bg-green-100 dark:bg-green-900/40", ring: "ring-green-600/20 dark:ring-green-500/30" };
        case 'PROCESSING': return { text: "Processing", color: "text-blue-800 dark:text-blue-300", bg: "bg-blue-100 dark:bg-blue-900/40", ring: "ring-blue-600/20 dark:ring-blue-500/30" };
        case 'PENDING':
        case 'UPLOADED':
        case 'NEW': return { text: status, color: "text-yellow-800 dark:text-yellow-300", bg: "bg-yellow-100 dark:bg-yellow-900/40", ring: "ring-yellow-600/20 dark:ring-yellow-500/30" };
        case 'FAILED': return { text: "Failed", color: "text-red-800 dark:text-red-300", bg: "bg-red-100 dark:bg-red-900/40", ring: "ring-red-600/20 dark:ring-red-500/30" };
        default: return { text: status || 'Unknown', color: "text-gray-800 dark:text-gray-300", bg: "bg-gray-100 dark:bg-gray-700", ring: "ring-gray-600/20 dark:ring-gray-500/30" };
    }
};

// --- Main Component ---
function DocCard({
  data = {},
  onPreview,
  onViewResults,
  formatDate = defaultFormatDate,
  formatBytes = defaultFormatBytes,
}) {

  const navigate = useNavigate();

  const {
    id = 'N/A',
    name = 'Untitled Batch',
    updatedAt,
    totalFileSize,
    totalFileCount = 0,
    status = 'UNKNOWN',
  } = data;

  const statusInfo = getStatusInfo(status);

  // Prevent Link navigation when clicking buttons
  const handleButtonClick = (e, action) => {
      e.stopPropagation();
      e.preventDefault();
      if (action) action(data);
  };

  // Specific handler for View Results (can navigate directly or use prop)
  const handleViewResultsClick = (e) => {
      e.stopPropagation();
      e.preventDefault();
      if (onViewResults) {
          onViewResults(data);
      } else if (id !== 'N/A') {
          navigate(`/extraction-results/${id}`);
      }
  };

  return (
    <Link
      to={id !== 'N/A' ? `/batch/${id}` : '#'} // Prevent linking if ID is missing
      className={`flex flex-col h-full bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 hover:shadow-lg hover:ring-1 hover:ring-orange-400 dark:hover:ring-orange-500 transition-all duration-200 group ${id === 'N/A' ? 'pointer-events-none opacity-75' : 'cursor-pointer'}`}
    >
      {/* Card Body */}
      <div className="p-5 flex-grow flex flex-col">

        {/* Top: Title and Status */}
        <div className="mb-4">
          <h3 className="text-base sm:text-lg font-semibold text-gray-800 dark:text-gray-100 transition-colors line-clamp-2 mb-1.5" title={name}>
            {name}
          </h3>
           <span
                title={`Status: ${statusInfo.text}`}
                className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium ring-1 ring-inset ${statusInfo.bg} ${statusInfo.color} ${statusInfo.ring}`}
            >
                <MdOutlineInfo className="mr-1 -ml-0.5" /> {statusInfo.text}
            </span>
        </div>

        {/* Metadata Section */}
        <div className="space-y-2 text-sm flex-grow mb-4"> {/* flex-grow pushes footer */}
            <MetaText
              icon={<MdFolderOpen className="text-gray-400 dark:text-gray-500"/>}
              value={`${totalFileCount} File${totalFileCount !== 1 ? 's' : ''}`}
              textSize="xs"
            />
            <MetaText
              icon={<GrStorage className="text-gray-400 dark:text-gray-500"/>}
              value={formatBytes(totalFileSize)}
              textSize="xs"
            />
            <MetaText
              icon={<LuCalendarClock className="text-gray-400 dark:text-gray-500"/>}
              value={`Updated ${formatDate(updatedAt)}`}
              textSize="xs"
            />
        </div>

        {/* Action Footer */}
        <div className="mt-auto pt-3 border-t border-gray-100 dark:border-gray-700 flex justify-end items-center gap-2">
            {/* Preview Button */}
            {onPreview && (
                <button
                    type="button"
                    onClick={(e) => handleButtonClick(e, onPreview)}
                    className="flex items-center justify-center gap-1 px-3 h-8 text-xs font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 dark:focus:ring-offset-gray-800 transition-colors cursor-pointer"
                    title="Preview documents"
                >
                    <FiEye size={14} /> Preview
                </button>
            )}

            {/* View Results Button */}
            {status === 'COMPLETED' && (
              <button
                type="button"
                onClick={handleViewResultsClick}
                className="flex items-center justify-center gap-1 px-3 h-8 text-xs font-medium text-white bg-teal-600 dark:bg-teal-600 rounded-md hover:bg-teal-700 dark:hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 dark:focus:ring-offset-gray-800 transition-colors cursor-pointer"
                title="View extraction results"
              >
                <FiClipboard size={14} /> Results
              </button>
            )}
        </div>
      </div>
    </Link>
  );
}

export default DocCard;