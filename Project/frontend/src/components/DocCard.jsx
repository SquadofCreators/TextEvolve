// src/components/DocCard.jsx

import React, { useState } from "react"; // Import useState
import { Link, useNavigate } from "react-router-dom";
import { LuCalendarClock } from "react-icons/lu";
import { GrStorage } from "react-icons/gr";
import { MdFolderOpen, MdOutlineInfo, MdDelete } from "react-icons/md";
import { FiEye, FiClipboard } from "react-icons/fi";
// Removed FaHashtag as it was commented out
import MetaText from '../components/utility/MetaText';
import ConfirmationModal from '../components/utility/ConfirmationModal'; // Import the modal

// Removed batchService import as it wasn't used directly in this component
// If onDeleteBatch relies on it, it should be handled in the parent component

// --- Default Formatters ---
const defaultFormatDate = (d) => d ? new Date(d).toLocaleString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }) : 'N/A';
const defaultFormatBytes = (b, decimals = 1) => {
    // Handle potential string input for BigInt conversion safely
    if (typeof b === 'string') {
        try {
            // Remove any non-digit characters before parsing (e.g., commas)
            const cleanedB = b.replace(/[^0-9]/g, '');
            if (cleanedB === '') return 'N/A'; // Handle empty string after cleaning
            b = BigInt(cleanedB);
        } catch (e) {
            console.error("Error converting string to BigInt:", b, e);
            return 'N/A';
        }
    } else if (typeof b === 'number') {
        // Convert number to BigInt if safe
        if (Number.isSafeInteger(b)) {
            b = BigInt(b);
        } else {
            // Handle potentially unsafe numbers or return N/A
            console.warn("Number might be too large for safe BigInt conversion:", b);
            // Fallback to number formatting if precision loss is acceptable, or return N/A
             const k = 1024; const dm = decimals < 0 ? 0 : decimals;
             const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']; let i = 0; let size = b;
             if (b === undefined || b === null || b < 0) return 'N/A';
             if (b === 0) return '0 Bytes';
             while (size >= k && i < sizes.length - 1) { size /= k; i++; }
             return parseFloat(size.toFixed(dm)) + ' ' + sizes[i];
        }
    }

    // Original BigInt logic
    if (b === undefined || b === null || typeof b !== 'bigint' || b < 0n) return 'N/A';
    if (b === 0n) return '0 Bytes';
    const k = 1024n; const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']; let i = 0; let size = b;
    while (size >= k && i < sizes.length - 1) { size /= k; i++; }
    // Convert to number for formatting, handle potential large numbers carefully
    // Use Number division for potentially more accurate floating point result
    const numSize = Number(b) / (1024 ** i);
    return parseFloat(numSize.toFixed(dm)) + ' ' + sizes[i];
}


// --- Status Styling ---
const getStatusInfo = (status) => {
    // Normalize status to uppercase for reliable matching
    const upperStatus = typeof status === 'string' ? status.toUpperCase() : 'UNKNOWN';
    switch (upperStatus) {
        case 'COMPLETED': return { text: "Completed", color: "text-green-800 dark:text-green-300", bg: "bg-green-100 dark:bg-green-900/40", ring: "ring-green-600/20 dark:ring-green-500/30" };
        case 'PROCESSING': return { text: "Processing", color: "text-blue-800 dark:text-blue-300", bg: "bg-blue-100 dark:bg-blue-900/40", ring: "ring-blue-600/20 dark:ring-blue-500/30" };
        case 'PENDING': return { text: "Pending", color: "text-yellow-800 dark:text-yellow-300", bg: "bg-yellow-100 dark:bg-yellow-900/40", ring: "ring-yellow-600/20 dark:ring-yellow-500/30" };
        case 'UPLOADED': return { text: "Uploaded", color: "text-yellow-800 dark:text-yellow-300", bg: "bg-yellow-100 dark:bg-yellow-900/40", ring: "ring-yellow-600/20 dark:ring-yellow-500/30" };
        case 'NEW': return { text: "New", color: "text-yellow-800 dark:text-yellow-300", bg: "bg-yellow-100 dark:bg-yellow-900/40", ring: "ring-yellow-600/20 dark:ring-yellow-500/30" };
        case 'FAILED': return { text: "Failed", color: "text-red-800 dark:text-red-300", bg: "bg-red-100 dark:bg-red-900/40", ring: "ring-red-600/20 dark:ring-red-500/30" };
        default: return { text: status || 'Unknown', color: "text-gray-800 dark:text-gray-300", bg: "bg-gray-100 dark:bg-gray-700", ring: "ring-gray-600/20 dark:ring-gray-500/30" };
    }
};


// --- Main Component ---
function DocCard({
  data = {},
  onPreview,
  onViewResults,
  onDeleteBatch, // Prop to handle the actual deletion logic (passed from parent)
  formatDate = defaultFormatDate,
  formatBytes = defaultFormatBytes,
}) {

  const navigate = useNavigate();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false); // State for modal visibility

  const {
    id = 'N/A',
    name = 'Untitled Batch',
    updatedAt,
    totalFileSize, // Keep as is, formatBytes will handle it
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

  // Specific handler for View Results
  const handleViewResultsClick = (e) => {
      e.stopPropagation();
      e.preventDefault();
      if (onViewResults) {
          onViewResults(data);
      } else if (id !== 'N/A') {
          navigate(`/extraction-results/${id}`);
      }
  };

  // Extract Text button handler
  const handleExtractText = (e) => {
      e.stopPropagation();
      e.preventDefault();
      if (id !== 'N/A') {
          navigate(`/extract-text/${id}`);
      }
  };

  // --- Delete Handlers ---
  // Opens the confirmation modal
  const handleDeleteClick = (e) => {
    e.stopPropagation();
    e.preventDefault();
    setIsDeleteModalOpen(true); // Open the modal
  }

  // Called when user confirms deletion in the modal
  const handleConfirmDelete = () => {
    setIsDeleteModalOpen(false); // Close the modal
    if (onDeleteBatch) {
      onDeleteBatch(data); // Call the parent's delete function
    } else {
      console.warn("onDeleteBatch prop is not provided to DocCard for ID:", id);
    }
  }

  // Called when user cancels deletion in the modal
  const handleCancelDelete = () => {
    setIsDeleteModalOpen(false); // Close the modal
  }

  // Determine if the card should be interactive
  const isClickable = id !== 'N/A';

  return (
    <> {/* Use Fragment to wrap Link and Modal */}
      <Link
        to={isClickable ? `/batch/${id}` : '#'}
        onClick={!isClickable ? (e) => e.preventDefault() : undefined} // Prevent click action if not clickable
        className={`flex flex-col h-full bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 transition-all duration-200 group ${
          isClickable
            ? 'cursor-pointer hover:shadow-lg hover:ring-1 hover:ring-orange-400 dark:hover:ring-orange-500'
            : 'opacity-75 cursor-not-allowed' // Style for non-clickable state
        }`}
      >
        {/* Card Body */}
        <div className="p-5 flex-grow flex flex-col">

          {/* Top: Title and Status */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base sm:text-lg font-semibold text-gray-800 dark:text-gray-100 transition-colors line-clamp-1" title={name}>
              {name}
            </h3>
            {/* Optional: Move status badge here if desired */}
          </div>

          {/* Metadata Section */}
          <div className="space-y-2 text-sm flex-grow mb-4">
            <MetaText
              icon={<MdOutlineInfo className="text-gray-400 dark:text-gray-500"/>}
              title="Status"
              element={
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium ring-1 ring-inset ${statusInfo.bg} ${statusInfo.color} ${statusInfo.ring}`}>
                  {statusInfo.text}
                </span>
              }
              textSize="sm"
            />
            <MetaText
              icon={<MdFolderOpen className="text-gray-400 dark:text-gray-500"/>}
              title="Files"
              value={`${totalFileCount} File${totalFileCount !== 1 ? 's' : ''}`}
              textSize="sm"
            />
            <MetaText
              icon={<GrStorage className="text-gray-400 dark:text-gray-500"/>}
              title="Total Size"
              value={formatBytes(totalFileSize)} // Use the formatter
              textSize="sm"
            />
            <MetaText
              icon={<LuCalendarClock className="text-gray-400 dark:text-gray-500"/>}
              title="Last Updated"
              value={formatDate(updatedAt)}
              textSize="sm"
            />
          </div>

          {/* Action Footer */}
          <div className="mt-auto pt-3 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center gap-2">

             {/* Delete Button - Always show but disabled if not clickable? Or hide? Let's show it. */}
             <button
                type="button" // Important: prevent form submission if nested
                className={`flex items-center justify-center gap-1 px-3 h-8 text-xs font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors ${
                  isClickable
                    ? 'text-red-600 dark:text-red-400 bg-gray-100 dark:bg-gray-700 hover:bg-red-500 hover:text-white dark:hover:bg-red-600 focus:ring-red-400 dark:focus:ring-offset-gray-800 cursor-pointer'
                    : 'text-gray-400 dark:text-gray-500 bg-gray-200 dark:bg-gray-600 cursor-not-allowed' // Disabled style
                }`}
                onClick={isClickable ? handleDeleteClick : undefined} // Only trigger modal if clickable
                disabled={!isClickable} // Disable button visually and functionally
                title={isClickable ? "Delete this batch" : "Batch cannot be deleted"}
            >
                <MdDelete />
                <span>Delete</span>
            </button>


            <div className="flex items-center justify-end gap-2">
              {/* Preview Button */}
              {onPreview && isClickable && ( // Only show if action and ID exist
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
              {status === 'COMPLETED' && isClickable && ( // Only show if completed and ID exists
                <button
                  type="button"
                  onClick={handleViewResultsClick}
                  className="flex items-center justify-center gap-1 px-3 h-8 text-xs font-medium text-white bg-teal-600 dark:bg-teal-600 rounded-md hover:bg-teal-700 dark:hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 dark:focus:ring-offset-gray-800 transition-colors cursor-pointer"
                  title="View extraction results"
                >
                  <FiClipboard size={14} /> Results
                </button>
              )}

              {/* Extract Text Button */}
              {status !== 'COMPLETED' && isClickable && ( // Only show if not completed and ID exists
                <button
                  type="button"
                  onClick={handleExtractText}
                  className="flex items-center justify-center gap-1 px-3 h-8 text-xs font-medium text-white bg-orange-600 dark:bg-orange-600 rounded-md hover:bg-orange-700 dark:hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 dark:focus:ring-offset-gray-800 transition-colors cursor-pointer"
                  title="Extract text from documents"
                >
                  <FiClipboard size={14} /> Extract Text
                </button>
              )}
            </div>
          </div>
        </div>
      </Link>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        title="Confirm Deletion"
        message={`Are you sure you want to delete the batch "${name}"? This action cannot be undone.`}
        confirmText="Delete Batch"
        cancelText="Cancel"
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        variant="danger" // Use danger variant for delete confirmation
      />
    </>
  );
}

export default DocCard;