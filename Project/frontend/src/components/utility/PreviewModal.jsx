import React from 'react';
import { FiX, FiChevronLeft, FiChevronRight } from 'react-icons/fi';

const PreviewModal = ({
  isOpen,
  onClose,
  file,
  currentPage,
  totalPages,
  onPrev,
  onNext,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black opacity-80"
        onClick={onClose}
      />
      {/* Modal Container */}
      <div className="relative z-10 bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-4xl h-auto max-h-[90vh] overflow-hidden">
        {/* Close Button */}
        <button
          onClick={onClose}
          title="Close Preview"
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-gray-100"
        >
          <FiX className="w-6 h-6" />
        </button>

        {/* Modal Layout */}
        <div className="flex flex-col h-max">
          {/* Header */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-2xl font-bold text-gray-700 dark:text-gray-200">
              Preview File
            </h2>
          </div>

          {/* Preview Area */}
          <div className="p-6 flex-1 overflow-auto flex items-center justify-center">
            {file?.type?.startsWith('image/') ? (
              <img
                src={file.preview}
                alt={file.name}
                className="max-w-full h-[60vh] object-contain rounded"
              />
            ) : file?.type === 'application/pdf' ? (
              <embed
                src={file.preview}
                type="application/pdf"
                className="w-full min-h-[60vh] object-contain rounded"
              />
            ) : (
              <div className="flex items-center justify-center h-64">
                <p className="text-gray-700 dark:text-gray-300">
                  Preview not available for this file type.
                </p>
              </div>
            )}
          </div>

          {/* Pagination & Footer */}
          <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <button
              onClick={onPrev}
              disabled={currentPage === 0}
              className="flex items-center gap-2 text-orange-500 hover:underline disabled:opacity-50"
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
              className="flex items-center gap-2 text-orange-500 hover:underline disabled:opacity-50"
            >
              Next
              <FiChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PreviewModal;
