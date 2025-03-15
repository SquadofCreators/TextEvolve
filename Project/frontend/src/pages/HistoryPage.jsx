import React, { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { FiDownload, FiEye, FiInfo } from 'react-icons/fi';
import docData from '../data/DocData';
import HistoryModal from '../components/history/HistoryModal';

function HistoryPage() {
  const { darkMode } = useTheme();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [modalType, setModalType] = useState('info'); // "info" or "view"

  const handleModalOpen = (doc, type) => {
    setSelectedDoc(doc);
    setModalType(type);
    setIsModalOpen(true);
  };

  return (
    <div className="bg-gray-100 dark:bg-gray-900 text-gray-700 dark:text-gray-300 min-h-screen transition-colors rounded-lg">
      <div className="mx-auto px-6 py-6">
        {/* Page Header */}
        <header className="mb-8 text-center">
          <h1 className="text-4xl font-extrabold mb-3 dark:text-gray-200">
            Conversion History
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Review your past document conversions with TextEvolve.
          </p>
        </header>

        {/* History List */}
        <div className="space-y-6">
          {docData.map((doc) => (
            <div
              key={doc.uniqueId}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6 transition-colors border border-gray-200 dark:border-gray-700"
            >
              <div className="flex flex-col sm:flex-row sm:items-center items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold mb-2 dark:text-gray-200">
                    {doc.title}
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Created On: {doc.createdOn}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    File Type: {doc.fileType}
                  </p>
                </div>
                <div className="flex items-center justify-center gap-6 w-max px-4 py-2 mt-4 sm:mt-0 bg-gray-100 dark:bg-gray-700 md:bg-transparent rounded-lg p-2">
                  <button
                    onClick={() => handleModalOpen(doc, 'info')}
                    className="flex items-center gap-2 text-gray-500 hover:text-orange-500 cursor-pointer"
                  >
                    <FiInfo className="w-5 h-5" />
                    <span className="hidden sm:inline">
                      Info
                    </span>
                  </button>
                  <button
                    onClick={() => handleModalOpen(doc, 'view')}
                    className="flex items-center gap-2 text-gray-500 hover:text-orange-500 cursor-pointer"
                  >
                    <FiEye className="w-5 h-5" />
                    
                    <span className="hidden sm:inline">
                      View
                    </span>
                  </button>
                  
                  <a
                    href={doc.file}
                    download
                    className="flex items-center gap-2 text-gray-500 hover:text-orange-500 cursor-pointer"
                  >
                    <FiDownload className="w-5 h-5" />
                    <span className="hidden sm:inline">
                      Download
                    </span>
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Common Modal */}
      <HistoryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        doc={selectedDoc}
        modalType={modalType}
      />
    </div>
  );
}

export default HistoryPage;
