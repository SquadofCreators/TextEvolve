// src/components/DocCard.jsx
import React, { useState, useRef, useEffect } from 'react';
import { FiShare2, FiChevronDown } from 'react-icons/fi';

function DocCard({ data }) {
  const {
    title,
    description,
    uniqueId,
    docType,
    language,
    createdOn,
    lastModified,
    fileSize,
    fileType,
  } = data;

  // State to handle download dropdown toggle
  const [downloadOpen, setDownloadOpen] = useState(false);

  const toggleDownload = () => {
    setDownloadOpen(!downloadOpen);
  };

  // Placeholder download handler function
  const downloadAs = (format) => {
    alert(`Downloading as ${format}`);
    setDownloadOpen(false);
  };

  // Ref to detect clicks outside the download dropdown
  const downloadRef = useRef(null);

  useEffect(() => {
    const handleClickOutsideDownload = (e) => {
      if (downloadOpen && downloadRef.current && !downloadRef.current.contains(e.target)) {
        setDownloadOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutsideDownload);
    return () => {
      document.removeEventListener('mousedown', handleClickOutsideDownload);
    };
  }, [downloadOpen]);

  return (
    <div
      className="relative rounded-lg border border-gray-200 shadow-md p-4 w-full bg-white text-gray-800 dark:bg-gray-900 dark:text-gray-100"
    >
      <div className='flex items-center justify-between mb-2'>
        {/* Unique ID */}
        <p className="text-sm font-medium">
            <span className="text-gray-400">Unique ID:</span>
            <span className="ml-1">{uniqueId}</span>
        </p>
        
        {/* Share Button on Top Right */}
        <button
            className="rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors cursor-pointer p-2"
            onClick={() => alert('Share functionality')}
            title="Share Document"
        >
            <FiShare2 className="text-base" />
        </button>
      </div>

      {/* Title */}
      <h3 className="font-bold text-lg mb-2 line-clamp-1">{title}</h3>

      {/* Description */}
      <p className="text-gray-500 text-sm mb-4 line-clamp-3">{description}</p>

      {/* Document Meta Info */}
      <div className="text-sm space-y-1 mb-4">
        <p className="font-medium">
          <span className="text-gray-500 font-normal">Language:</span> {language}
        </p>
        <p className="font-medium">
          <span className="text-gray-500 font-normal">Created On:</span> {createdOn}
        </p>
        <p className="font-medium">
          <span className="text-gray-500 font-normal">Last Modified:</span> {lastModified}
        </p>
        <p className="font-medium">
          <span className="text-gray-500 font-normal">File Size:</span> {fileSize}
        </p>
        <p className="font-medium">
          <span className="text-gray-500 font-normal">File Type:</span> {fileType}
        </p>
      </div>

      {/* Download Dropdown Container */}
      <div className="w-full flex justify-end relative" ref={downloadRef}
      >
        <button
          onClick={toggleDownload}
          className="flex items-center gap-1 px-4 py-1.5 rounded bg-orange-500 text-white font-semibold hover:bg-orange-600 transition-colors cursor-pointer"
        >
          Download <FiChevronDown className="w-4 h-4" />
        </button>
        {downloadOpen && (
          <div 
            className="absolute top-8 right-0 mt-2 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded shadow-md z-10"
        >
            <button
              onClick={() => downloadAs('PDF')}
              className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-sm cursor-pointer"
            >
              Download as PDF
            </button>
            <button
              onClick={() => downloadAs('DOCX')}
              className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-sm cursor-pointer"
            >
              Download as DOCX
            </button>
            <button
              onClick={() => downloadAs('TXT')}
              className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-sm cursor-pointer"
            >
              Download as TXT
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default DocCard;
