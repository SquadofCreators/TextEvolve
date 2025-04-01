import React, { useEffect, useState } from 'react';
import { FiX, FiChevronLeft, FiChevronRight, FiDownload } from 'react-icons/fi';
import JSZip from 'jszip';

import { BsFileZip } from "react-icons/bs";

const PreviewModal = ({
  isOpen,
  onClose,
  file,
  currentPage,
  totalPages,
  onPrev,
  onNext,
  filesList, // Array of all files for "Download All"
  showDownloadAll = true, // Show Download All button if more than one document is available
}) => {
  if (!isOpen || !file) return null;

  const [previewUrl, setPreviewUrl] = useState('');
  const [downloadUrl, setDownloadUrl] = useState('');

  useEffect(() => {
    if (file) {
      // Directly use the preview_url returned by the backend.
      setPreviewUrl(file.preview_url || '');
      setDownloadUrl(file.download_url || '');
    }
  }, [file]);

  const getFileType = (fileObj) => {
    const type = fileObj.file_type ? fileObj.file_type.toLowerCase() : '';
    if (type) {
      if (['png', 'jpg', 'jpeg', 'gif', 'bmp'].includes(type)) return 'image';
      if (type === 'pdf') return 'pdf';
      if (['doc', 'docx'].includes(type)) return 'doc';
      if (type === 'txt') return 'text';
    }
    const name = fileObj.title || fileObj.filename || '';
    const ext = name.split('.').pop().toLowerCase();
    if (['png', 'jpg', 'jpeg', 'gif', 'bmp'].includes(ext)) return 'image';
    if (ext === 'pdf') return 'pdf';
    if (['doc', 'docx'].includes(ext)) return 'doc';
    if (ext === 'txt') return 'text';
    return 'unknown';
  };

  const fileType = getFileType(file);

  const handleDownload = () => {
    const url = downloadUrl || previewUrl;
    if (!url) {
      alert('No download URL available.');
      return;
    }
    const link = document.createElement('a');
    link.href = url;
    link.download = file.title || file.filename || 'download';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadAll = async () => {
    if (!filesList || filesList.length === 0) {
      alert('No files available to download.');
      return;
    }

    const zip = new JSZip();
    const folder = zip.folder('Documents');

    const fetchFile = async (fileObj) => {
      try {
        const url = fileObj.download_url || fileObj.preview_url;
        const response = await fetch(url);
        const blob = await response.blob();
        folder.file(fileObj.title || fileObj.filename, blob);
      } catch (error) {
        console.error(`Error downloading ${fileObj.title || fileObj.filename}:`, error);
      }
    };

    await Promise.all(filesList.map(fetchFile));

    zip.generateAsync({ type: 'blob' }).then((content) => {
      const link = document.createElement('a');
      link.href = URL.createObjectURL(content);
      link.download = 'All_Documents.zip';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black opacity-80" onClick={onClose}></div>

      {/* Modal Container */}
      <div className="relative z-10 bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-4xl h-auto max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-700 dark:text-gray-200 truncate">
            {file.title || file.filename || 'Preview File'}
          </h2>
          <div className="flex items-center md:gap-4">
            <button
              onClick={handleDownload}
              title="Download File"
              className="flex items-center gap-2 text-blue-500 hover:text-gray-100 hover:bg-blue-500 md:px-3 py-2 rounded-lg transition cursor-pointer"
            >
              <FiDownload className="w-5 h-5" />
              <span className='hidden md:flex'>Download</span>
            </button>
            {showDownloadAll && filesList && filesList.length > 1 && (
              <button
                onClick={handleDownloadAll}
                title="Download All as Zip"
                className="flex items-center gap-2 text-green-500 hover:text-gray-100 hover:bg-green-500md: px-3 py-2 rounded-lg transition cursor-pointer"
              >
                <BsFileZip className="w-5 h-5" />
                <span className='hidden md:flex'>Download Zip</span>
              </button>
            )}
            <button
              onClick={onClose}
              title="Close Preview"
              className="text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg p-1.5 transition cursor-pointer"
            >
              <FiX className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Preview Area */}
        <div className="p-6 flex-1 overflow-auto flex items-center justify-center">
          {fileType === 'image' ? (
            previewUrl ? (
              <img
                src={previewUrl}
                alt={file.title || file.filename}
                className="max-w-full h-[60vh] object-contain rounded"
              />
            ) : (
              <div className="text-gray-700 dark:text-gray-300">No preview available.</div>
            )
          ) : fileType === 'pdf' ? (
            previewUrl ? (
              <iframe
                src={previewUrl}
                className="w-full min-h-[60vh] rounded"
                title="PDF Preview"
              />
            ) : (
              <div className="text-gray-700 dark:text-gray-300">No preview available.</div>
            )
          ) : fileType === 'doc' ? (
            previewUrl ? (
              <iframe
                src={`https://docs.google.com/gview?url=${encodeURIComponent(previewUrl)}&embedded=true`}
                className="w-full min-h-[60vh] rounded"
                title="Document Preview"
              />
            ) : (
              <div className="text-gray-700 dark:text-gray-300">No preview available.</div>
            )
          ) : fileType === 'text' ? (
            <div className="w-full h-[60vh] p-4 overflow-y-auto bg-gray-100 dark:bg-gray-700 rounded">
              <pre className="whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300">
                {file.extracted_content || 'Text preview not available.'}
              </pre>
            </div>
          ) : (
            <div className="flex items-center justify-center h-64">
              <p className="text-gray-700 dark:text-gray-300">
                🔴 Preview not available for this file type.
              </p>
            </div>
          )}
        </div>

        {/* Pagination & Footer */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <button
            onClick={onPrev}
            disabled={currentPage === 0}
            className="flex items-center gap-2 text-orange-500 hover:underline disabled:opacity-50 cursor-pointer"
          >
            <FiChevronLeft className="w-5 h-5" />
            Previous
          </button>
          <span className="text-gray-500 dark:text-gray-400">
            Page {currentPage + 1} of {totalPages}
          </span>
          <button
            onClick={onNext}
            disabled={currentPage === totalPages - 1}
            className="flex items-center gap-2 text-orange-500 hover:underline disabled:opacity-50 cursor-pointer"
          >
            Next
            <FiChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default PreviewModal;
