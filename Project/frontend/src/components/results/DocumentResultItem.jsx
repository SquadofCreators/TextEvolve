// src/components/results/DocumentResultItem.jsx
import React, { useState, Fragment } from 'react'; // Added useState and Fragment
import { FiFileText, FiEye } from 'react-icons/fi';
import PreviewModal from '../utility/PreviewModal'; // Make sure this path is correct

// --- Helper functions ---
const formatMetric = (value, decimals = 1) => {
    if (value === null || value === undefined) return null;
    const percentage = Number(value) * 100;
    return `${percentage % 1 === 0 ? percentage.toFixed(0) : percentage.toFixed(decimals)}%`;
};

const getFileUrl = (storageKey) => {
    // Check if storageKey is valid
    if (!storageKey || typeof storageKey !== 'string') {
        return null;
    }
    // Backend now returns the complete and correct URL in storageKey.
    return storageKey;
};

const DocumentResultItem = React.memo(({ doc, onDownloadText }) => {
    const [isModalOpen, setIsModalOpen] = useState(false); // State for modal visibility

    const docAccuracy = formatMetric(doc.accuracy);
    const docWordCount = doc.wordCount ? doc.wordCount.toLocaleString() : null;
    const docCharacterCount = doc.characterCount ? doc.characterCount.toLocaleString() : null;
    const docStatusColor = doc.status === 'COMPLETED' ? 'text-green-500' : doc.status === 'FAILED' ? 'text-red-500' : 'text-yellow-500';
    
    // Get the file URL (PreviewModal will use doc.storageKey from the 'file' prop directly)
    const originalFileUrl = getFileUrl(doc.storageKey); 
    
    const canDownload = doc.extractedContent !== null && doc.extractedContent !== undefined && doc.status === 'COMPLETED';

    const openPreviewModal = () => {
        if (originalFileUrl) { // Only open if there's a URL
            setIsModalOpen(true);
        }
    };

    const closePreviewModal = () => {
        setIsModalOpen(false);
    };

    return (
        <Fragment> {/* Use Fragment because we are now returning a list item and a modal */}
            <li className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate" title={doc.fileName}>
                            {doc.fileName || `Document ${doc.id?.substring(0, 6) || 'N/A'}`}
                        </p>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500 dark:text-gray-400 mt-1">
                            <span>Status: <strong className={docStatusColor}>{doc.status || 'UNKNOWN'}</strong></span>
                            {docWordCount && <span>Words: <strong className="text-gray-700 dark:text-gray-300">{docWordCount}</strong></span>}
                            {docCharacterCount && <span>Chars: <strong className="text-gray-700 dark:text-gray-300">{docCharacterCount}</strong></span>}
                            {docAccuracy && <span>Acc: <strong className="text-gray-700 dark:text-gray-300">{docAccuracy}</strong></span>}
                            {doc.status === 'FAILED' && doc.errorMessage && <span className="text-red-500 text-xs" title={doc.errorMessage}> (Error)</span>}
                        </div>
                    </div>
                    <div className="flex-shrink-0 flex items-center gap-2 mt-2 sm:mt-0">
                        {originalFileUrl && ( // If there's a URL, show button to open PreviewModal
                            <button 
                                onClick={openPreviewModal} 
                                title="Preview File" // Generic title, modal will handle specific preview type
                                className="p-1.5 text-gray-500 hover:text-orange-600 dark:text-gray-400 dark:hover:text-orange-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
                            >
                                <FiEye size={16}/>
                            </button>
                        )}
                        <button
                            onClick={() => onDownloadText(doc.extractedContent, `${doc.fileName || doc.id}_extracted.txt`)}
                            disabled={!canDownload}
                            className="p-1.5 text-gray-500 hover:text-orange-600 dark:text-gray-400 dark:hover:text-orange-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title={!canDownload ? (doc.status !== 'COMPLETED' ? `Status: ${doc.status}` : "No extracted text") : "Download Extracted Text"}
                        >
                            <FiFileText size={16}/>
                        </button>
                    </div>
                </div>
                {doc.status === 'FAILED' && doc.errorMessage && (
                    <p className="mt-1 text-xs text-red-600 dark:text-red-400 truncate" title={doc.errorMessage}>
                        Error: {doc.errorMessage}
                    </p>
                )}
            </li>

            {/* Render the PreviewModal */}
            {/* It's controlled by isModalOpen state */}
            {isModalOpen && (
                 <PreviewModal
                    isOpen={isModalOpen} // Controls modal visibility and animations
                    onClose={closePreviewModal} // Function to close the modal
                    file={doc} // Pass the entire 'doc' object as the 'file' prop
                    currentPage={0} // For single file view from item
                    totalPages={1}    // For single file view from item
                    onPrev={() => {}} // No-op as it's a single file
                    onNext={() => {}} // No-op as it's a single file
                    filesList={[doc]} // Modal expects a list; provide current doc as a single-item list
                    showDownloadAll={false} // Typically false for a single item preview
                    onEnhancementComplete={(enhancedDocId, newEnhancedUrl) => {
                        // Placeholder: Implement if DocumentResultItem or its parent needs to react to this
                        console.log(`Enhancement complete for doc ${enhancedDocId}: ${newEnhancedUrl}`);
                        // You might want to update the 'doc' object or re-fetch data if enhancement changes it.
                    }}
                />
            )}
        </Fragment>
    );
});

export default DocumentResultItem;