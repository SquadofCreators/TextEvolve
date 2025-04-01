import React from 'react';
import { format } from 'date-fns';
import { IoMdOpen } from 'react-icons/io';
import { useNavigate } from 'react-router-dom';
import { LuCalendarDays, LuCalendarClock } from "react-icons/lu";
import { GrStorage } from "react-icons/gr";
import { MdFolderOpen } from "react-icons/md";
import { FaRegFileLines } from "react-icons/fa6";
import MetaText from '../components/utility/MetaText';
import { TbTextRecognition, TbTextScan2 } from "react-icons/tb";

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

function DocCard(
  { 
    data = {}, 
    onPreview = () => {}, 
    onDownload = () => {}, 
    onExtractData = () => {}, 
    onOpen = () => {} 
  }) {

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

  // Handle open batch
  const handleOpenBatch = (e) => {
    e.stopPropagation();
    onOpen();
    navigate(`/batch/${_id}`);
  };

  return (
    <div className="relative p-4 md:p-5 bg-slate-50 dark:bg-slate-800 rounded-md shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow cursor-pointer">
      {/* Top Row: Batch ID and Open Icon */}
      <div className="flex items-center justify-between mb-1">
        <p className="flex items-center gap-2 line-clamp-1 text-base text-gray-500 dark:text-gray-400">
          <span className='hidden md:flex'>Batch ID: </span>
          <span className="font-bold truncate">#{_id}</span>
        </p>
        <button
          type="button"
          className="hidden md:flex items-center gap-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer"
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

      {/* Batch Details using MetaText */}
      <div className="flex flex-col gap-2 mt-5">
        <MetaText 
          icon={<LuCalendarDays className="md:hidden text-base" />}
          title="Uploaded On"
          value={formatDate(created_on)}
        />
        <MetaText 
          icon={<LuCalendarClock className="md:hidden text-base" />}
          title="Last Modified"
          value={formatDate(modified_on)}
        />
        <MetaText 
          icon={<GrStorage className="md:hidden text-base" />}
          title="Total File Size"
          value={total_file_size && total_file_size > 0 
                    ? (total_file_size / 1024 / 1024).toFixed(2) + ' MB' 
                    : 'N/A'}
        />
        <MetaText 
          icon={<MdFolderOpen className="md:hidden text-base" />}
          title="Total Files"
          value={`${total_files ?? 'N/A'} ${total_files > 1 ? "files" : "file"}`}
        />
        {fileTypes && (
          <MetaText 
            icon={<FaRegFileLines className="md:hidden text-base" />}
            title="File Types"
            value={fileTypes}
          />
        )}
      </div>

      {/* Action Buttons */}
      <div className="mt-4 w-full flex md:justify-end gap-4">
        <button
          type="button"
          className="w-full flex md:hidden items-center justify-center gap-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 cursor-pointer"
          onClick={handleOpenBatch}
        >
          <span className="text-base">Open</span>
          <IoMdOpen className="text-lg" />
        </button>
        <button
          type="button"
          onClick={onPreview}
          className="w-full md:w-max hidden md:flex items-center justify-center gap-2 px-3 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 cursor-pointer"
        >
          Preview Docs
        </button>
        <button
          type="button"
          onClick={onExtractData}
          className="w-full md:w-max flex items-center justify-center gap-2 px-3 py-2 bg-orange-500 text-gray-100 rounded-md cursor-pointer"
        >
          Extract Text
          <TbTextScan2 className='text-lg' />
        </button>
      </div>
    </div>
  );
}

export default DocCard;
