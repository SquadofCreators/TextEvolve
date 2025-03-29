import React from 'react';
import { format } from 'date-fns';
import { IoMdOpen } from 'react-icons/io';
import { useNavigate } from 'react-router-dom';

/**
 * Safely format a date.
 * If the date is an object with a $date property, that value is used.
 * Returns a formatted string like "March 15, 2025, 09:35 AM" or "N/A" if invalid.
 */
function formatDate(dateInput) {
  if (!dateInput) return 'N/A';
  const dateString =
    typeof dateInput === 'object' && dateInput.$date ? dateInput.$date : dateInput;
  try {
    const parsedDate = new Date(dateString);
    if (isNaN(parsedDate.getTime())) return 'N/A';
    return format(parsedDate, 'PPP, p');
  } catch {
    return 'N/A';
  }
}

function DocCard({ data = {}, onPreview = () => {}, onDownload = () => {}, onOpen = () => {} }) {
  // Use fallback values in case keys come in different casing.
  const _id = data._id || data.Id || 'N/A';
  const name = data.name || data.Name || 'Untitled Batch';
  const created_on = data.created_on || data['Created On'];
  const modified_on = data.modified_on || data['Modified On'];
  const total_file_size = data.total_file_size || data['Total File Size'];
  const total_files = data.total_files || data['Total files'];
  const file_types = data.file_types || data['File Types'];
  
  const fileTypes = Array.isArray(file_types) ? file_types.join(', ') : file_types || 'N/A';

  const navigate = useNavigate();

  // handle open batch
  const handleOpenBatch = (e) => {
    e.stopPropagation();
    onOpen();
    navigate(`/batch/${_id}`);

  };

  return (
    <div className="relative p-5 bg-slate-50 dark:bg-slate-800 rounded-md shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow cursor-pointer">
      {/* Top Row: Batch ID and Open Icon */}
      <div className="flex items-center justify-between mb-1">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Batch ID: <span className="font-bold">#{_id}</span>
        </p>
        <button
          type="button"
          className="flex items-center gap-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer"
          onClick={handleOpenBatch}
        >
          <span className="text-xs">Open</span>
          <IoMdOpen className="text-sm" />
        </button>
      </div>

      {/* Title */}
      <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-200 line-clamp-1 mb-2 mt-4">
        {name}
      </h3>

      {/* Batch Details */}
      <div className="flex flex-col gap-2 mt-5">
        <p className="text-sm text-gray-600 dark:text-gray-300">
          <span className="font-medium">Uploaded On:</span> {formatDate(created_on)}
        </p>
        <p className="text-sm text-gray-600 dark:text-gray-300">
          <span className="font-medium">Last Modified:</span> {formatDate(modified_on)}
        </p>
        <p className="text-sm text-gray-600 dark:text-gray-300">
          <span className="font-medium">Total File Size:</span>{' '}
          {total_file_size && total_file_size > 0
            ? (total_file_size / 1024 / 1024).toFixed(2) + ' MB'
            : 'N/A'}
        </p>
        <p className="text-sm text-gray-600 dark:text-gray-300">
          <span className="font-medium">Total Files:</span> {total_files ?? 'N/A'}
        </p>
        {fileTypes && (
          <p className="text-sm text-gray-600 dark:text-gray-300">
            <span className="font-medium">File Types:</span> {fileTypes}
          </p>
        )}
      </div>

      {/* Action Buttons */}
      <div className="mt-4 w-full flex justify-end gap-4">
        <button
          type="button"
          onClick={onPreview}
          className="px-3 py-2 text-sm font-medium text-white bg-orange-500 rounded-md hover:bg-orange-600 focus:outline-none"
        >
          Preview All Docs
        </button>
        <button
          type="button"
          onClick={onDownload}
          className="px-3 py-2 text-sm font-medium bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 focus:outline-none"
        >
          Download All Docs
        </button>
      </div>
    </div>
  );
}

export default DocCard;
