import React, { useState, useEffect } from 'react';
import { FiX, FiChevronLeft, FiChevronRight } from 'react-icons/fi';

const HistoryModal = ({ isOpen, onClose, doc, modalType }) => {
  const [currentPage, setCurrentPage] = useState(0);

  // Reset page when doc or modalType changes.
  useEffect(() => {
    setCurrentPage(0);
  }, [doc, modalType]);

  if (!isOpen || !doc) return null;

  // Helper to generate file preview.
  const getFilePreview = (filePath) => {
    if (typeof filePath !== 'string') {
      return (
        <p className="text-gray-700 dark:text-gray-300">
          No preview available (invalid file data).
        </p>
      );
    }
    const lowerPath = filePath.toLowerCase();
    if (lowerPath.endsWith('.pdf')) {
      return (
        <embed
          src={filePath}
          type="application/pdf"
          className="w-full h-64 object-contain rounded border dark:border-gray-700"
        />
      );
    } else if (
      lowerPath.endsWith('.jpg') ||
      lowerPath.endsWith('.jpeg') ||
      lowerPath.endsWith('.png') ||
      lowerPath.endsWith('.gif')
    ) {
      return (
        <img
          src={filePath}
          alt="Document Preview"
          className="max-w-full max-h-64 object-contain rounded border dark:border-gray-700"
        />
      );
    }
    return (
      <p className="text-gray-700 dark:text-gray-300">
        No preview available for this file type.
      </p>
    );
  };

  // Generate pages based on modalType.
  const generatePages = () => {
    if (modalType === 'info') {
      // Single page with full details.
      return [
        <div key="info">
          <h3 className="text-xl font-bold mb-2 dark:text-gray-200">{doc.title}</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">Created On: {doc.createdOn}</p>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Last Modified: {doc.lastModified}</p>
          <p className="mt-2"><strong>File Type:</strong> {doc.fileType}</p>
          <p className="mt-2"><strong>Language:</strong> {doc.language}</p>
          <p className="mt-4">{doc.description}</p>
          <p className="mt-4"><strong>Document Type:</strong> {doc.docType}</p>
          <p className="mt-2"><strong>File Size:</strong> {doc.fileSize}</p>
        </div>
      ];
    } else if (modalType === 'view') {
      // Multi-page view modal.
      return [
        <div key="view1">
          <h3 className="text-xl font-bold mb-2 dark:text-gray-200">{doc.title}</h3>
          <div className="mb-4">{getFilePreview(doc.file)}</div>
          <p className="text-sm text-gray-500 dark:text-gray-400">Created On: {doc.createdOn}</p>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Last Modified: {doc.lastModified}</p>
        </div>,
        <div key="view2">
          <h3 className="text-xl font-bold mb-2 dark:text-gray-200">Document Details</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400"><strong>File Type:</strong> {doc.fileType}</p>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400"><strong>Language:</strong> {doc.language}</p>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400"><strong>Document Type:</strong> {doc.docType}</p>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400"><strong>File Size:</strong> {doc.fileSize}</p>
        </div>
      ];
    }
    return [];
  };

  const pages = generatePages();

  const handlePrev = () => {
    if (currentPage > 0) setCurrentPage((prev) => prev - 1);
  };

  const handleNext = () => {
    if (currentPage < pages.length - 1) setCurrentPage((prev) => prev + 1);
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      {/* Modal Overlay */}
      <div className="absolute inset-0 bg-black opacity-50" onClick={onClose}></div>
      {/* Modal Content */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-3xl w-full relative z-10 p-6">
        {/* Close Button */}
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-gray-100">
          <FiX className="w-6 h-6" />
        </button>
        {/* Header */}
        <div className="mb-4">
          <h2 className="text-2xl font-bold text-gray-700 dark:text-gray-200">
            {modalType === 'info' ? 'Document Information' : 'View Document Conversion Details'}
          </h2>
        </div>
        {/* Content */}
        <div className="min-h-[200px]">{pages[currentPage]}</div>
        {/* Pagination Controls (only if multiple pages) */}
        {pages.length > 1 && (
          <div className="flex justify-between items-center mt-6">
            <button
              onClick={handlePrev}
              disabled={currentPage === 0}
              className="flex items-center gap-2 text-orange-500 hover:underline disabled:opacity-50"
            >
              <FiChevronLeft className="w-5 h-5" />
              Previous
            </button>
            <span className="text-gray-500 dark:text-gray-400">
              Page {currentPage + 1} of {pages.length}
            </span>
            <button
              onClick={handleNext}
              disabled={currentPage === pages.length - 1}
              className="flex items-center gap-2 text-orange-500 hover:underline disabled:opacity-50"
            >
              Next
              <FiChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default HistoryModal;
