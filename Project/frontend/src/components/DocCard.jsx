import React from "react";
import { Link } from "react-router-dom"; // Import Link for navigation
import { format } from "date-fns"; // Keep if formatDate prop isn't passed, but prefer prop
import { IoMdOpen } from 'react-icons/io'; // Keep if needed, but replaced by Link
import { LuCalendarDays, LuCalendarClock } from "react-icons/lu";
import { GrStorage } from "react-icons/gr";
import { MdFolderOpen, MdOutlineInfo } from "react-icons/md"; // Added Info icon for status
import { FaHashtag } from "react-icons/fa6";
import { TbTextScan2 } from "react-icons/tb";
import { FiEye } from "react-icons/fi"; // For Preview button icon

import MetaText from '../components/utility/MetaText'; // Assuming this component exists

/**
 * DocCard Component: Displays a summary card for a single batch.
 * Used on pages like LandingPage to show recent batches.
 *
 * Props:
 * - data: Batch object with fields (id, name, createdAt, updatedAt, totalFileCount, totalFileSize, status).
 * - onPreview: Function to call when "Preview Docs" button is clicked, passes the batch object.
 * - onExtractData: Function to call when "Extract Text" button is clicked, passes the batch object.
 * - formatDate: Function to format date strings (ISO).
 * - formatBytes: Function to format file sizes (expects bytes as string/BigInt).
 */
function DocCard({
  data = {},
  onPreview = () => {},
  onExtractData = () => {},
  // Expect formatters as props
  formatDate = (d) => d ? new Date(d).toLocaleString() : 'N/A',
  formatBytes = (b) => b ? `${b} Bytes` : 'N/A',
}) {

  // Destructure with fallbacks using the correct expected keys
  const id = data.id || 'N/A';
  const name = data.name || 'Untitled Batch';
  const createdAt = data.createdAt;
  const updatedAt = data.updatedAt;
  const totalFileSize = data.totalFileSize; // Passed as string from backend
  const totalFileCount = data.totalFileCount ?? 0; // Use nullish coalescing for count
  const status = data.status || 'UNKNOWN';

  // Determine status color (example)
  const getStatusColor = (status) => {
      switch (status) {
          case 'COMPLETED': return "text-green-600 dark:text-green-400";
          case 'PROCESSING': return "text-blue-600 dark:text-blue-400";
          case 'PENDING':
          case 'UPLOADED':
          case 'NEW': return "text-yellow-600 dark:text-yellow-400";
          case 'FAILED': return "text-red-600 dark:text-red-400";
          default: return "text-gray-600 dark:text-gray-400";
      }
  };
  const statusColor = getStatusColor(status);

  return (
    // Make the entire card link to the batch details page for better accessibility
    <Link
      to={`/batch/${id}`}
      className="block relative p-4 md:p-5 bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 hover:shadow-lg hover:border-gray-300 dark:hover:border-gray-600 transition-all duration-200 group"
    >
      {/* Top Row: Batch ID */}
      <div className="mb-3">
        <p className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
          <FaHashtag />
          <span className="font-medium truncate">{id}</span>
        </p>
      </div>

      {/* Title */}
      {/* Link is now on the parent, so this doesn't need to be a Link itself */}
      <h3 className="text-xl md:text-2xl font-bold text-gray-800 dark:text-gray-100 line-clamp-2 mb-3 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
        {name}
      </h3>

      {/* Batch Details using MetaText */}
      <div className="flex flex-col gap-1.5 mb-4">
        <MetaText
          icon={<MdOutlineInfo className="text-base" />}
          title="Status"
          value={<span className={`font-medium ${statusColor}`}>{status}</span>}
          textSize="sm"
        />
        <MetaText
          icon={<MdFolderOpen className="text-base" />}
          title="Files"
          value={`${totalFileCount} File${totalFileCount !== 1 ? 's' : ''}`} // Handle pluralization
          textSize="sm"
        />
        <MetaText
          icon={<GrStorage className="text-base" />}
          title="Total Size"
          value={formatBytes(totalFileSize)} // Use the passed formatter
          textSize="sm"
        />
        <MetaText
          icon={<LuCalendarDays className="text-base" />}
          title="Created"
          value={formatDate(createdAt)} // Use the passed formatter
          textSize="sm"
        />
        <MetaText
          icon={<LuCalendarClock className="text-base" />}
          title="Modified"
          value={formatDate(updatedAt)} // Use the passed formatter
          textSize="sm"
        />
        {/* Removed File Types */}
      </div>

      {/* Action Buttons */}
      {/* Stop propagation prevents the Link wrapper from navigating when clicking buttons */}
      <div className="mt-auto pt-3 border-t border-gray-100 dark:border-gray-700 w-full flex flex-col sm:flex-row justify-end gap-3">
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); e.preventDefault(); onPreview(data); }} // Prevent Link navigation
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 cursor-pointer transition-colors text-sm"
          title="Preview documents in this batch"
        >
          <FiEye size={16} /> Preview Docs
        </button>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); e.preventDefault(); onExtractData(data); }} // Prevent Link navigation
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-3 py-1.5 bg-orange-500 text-white rounded-md hover:bg-orange-600 cursor-pointer transition-colors text-sm"
          title="Extract text from documents in this batch"
        >
          <TbTextScan2 size={16} /> Extract Text
        </button>
      </div>
    </Link> // End Link wrapper
  );
}

export default DocCard;