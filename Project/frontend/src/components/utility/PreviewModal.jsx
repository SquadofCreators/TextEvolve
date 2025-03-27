import React from 'react';
import { FiX, FiChevronLeft, FiChevronRight, FiDownload } from 'react-icons/fi';

const PreviewModal = ({
  isOpen,
  onClose,
  file,
  currentPage,
  totalPages,
  onPrev,
  onNext,
}) => {
  if (!isOpen || !file) return null;

  // ✅ Guess file type from filename or MIME type
  const getFileType = (typeOrFilename) => {
    if (!typeOrFilename) return 'unknown';

    // Handle MIME types
    if (typeOrFilename.startsWith('image/')) return 'image';
    if (typeOrFilename === 'application/pdf') return 'pdf';
    if (typeOrFilename === 'application/msword' || 
        typeOrFilename === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      return 'doc';
    }
    if (typeOrFilename === 'text/plain') return 'text';

    // Handle extensions
    const ext = typeOrFilename.split('.').pop().toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'bmp'].includes(ext)) return 'image';
    if (ext === 'pdf') return 'pdf';
    if (['doc', 'docx'].includes(ext)) return 'doc';
    if (ext === 'txt') return 'text';

    return 'unknown';
  };

  // ✅ Use MIME type or guess from filename
  const fileType = getFileType(file.fileType || file.filename);

  // ✅ Handle file download
  const handleDownload = () => {
    if (file.downloadUrl) {
      const link = document.createElement('a');
      link.href = file.downloadUrl;
      link.download = file.filename || 'download';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black opacity-80"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative z-10 bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-4xl h-auto max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-700 dark:text-gray-200 line-clamp-1">
            {file.title || 'Preview File'}
          </h2>
          <div className="flex items-center gap-4">
            {file.downloadUrl && (
              <button
                onClick={handleDownload}
                title="Download File"
                className="flex items-center gap-2 text-blue-500 hover:text-gray-100 bg-gray-50 hover:bg-blue-500 px-3 py-2 rounded-lg transition cursor-pointer"
              >
                <FiDownload className="w-5 h-5" />
                Download
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
          {/* ✅ Handle Image */}
          {fileType === 'image' ? (
            <img
              src={file.previewUrl}
              alt={file.filename}
              className="max-w-full h-[60vh] object-contain rounded"
            />
          ) : fileType === 'pdf' ? (
            <embed
              src={file.previewUrl}
              type="application/pdf"
              className="w-full min-h-[60vh] rounded"
            />
          ) : fileType === 'doc' ? (
            <iframe
              src={`https://docs.google.com/gview?url=${encodeURIComponent(file.previewUrl)}&embedded=true`}
              className="w-full min-h-[60vh] rounded"
              title="Document Preview"
            />
          ) : fileType === 'text' ? (
            <div className="w-full h-[60vh] p-4 overflow-y-auto bg-gray-100 dark:bg-gray-700 rounded">
              <pre className="whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300">
                {file.previewUrl}
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
