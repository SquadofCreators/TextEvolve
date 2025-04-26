import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion'; // Added AnimatePresence for modal fade
import {
    FiX, FiChevronLeft, FiChevronRight, FiDownload, FiAlertCircle,
    FiFile, FiLoader, FiCheckCircle, FiImage, FiFileText, FiExternalLink, // Added relevant icons
} from 'react-icons/fi';
import { BsFileZip, BsFiletypeDoc, BsFiletypePdf } from "react-icons/bs"; // Specific file type icons
import JSZip from 'jszip'; // Ensure installed
import { batchService } from '../../services/batchService'; // Adjust path

// --- Helper Functions ---

// Trigger browser download from Blob
const triggerBlobDownload = (blob, filename) => {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
};

// Determine File Type (Enhanced with specific icons)
const getFileInfo = (fileObj) => {
    if (!fileObj) return { type: 'unknown', icon: FiFile, name: 'unknown file' };

    const mime = fileObj.mimeType || '';
    const name = fileObj.name || fileObj.fileName || `file_${fileObj.id?.substring(0, 6) ?? 'unknown'}`;
    const ext = name.split('.').pop()?.toLowerCase() || '';

    if (mime.startsWith('image/') || ['png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp', 'svg'].includes(ext)) {
        return { type: 'image', icon: FiImage, name };
    }
    if (mime === 'application/pdf' || ext === 'pdf') {
        return { type: 'pdf', icon: BsFiletypePdf, name };
    }
    if (mime.includes('wordprocessingml') || mime.includes('msword') || ['doc', 'docx'].includes(ext)) {
        return { type: 'doc', icon: BsFiletypeDoc, name };
    }
    if (mime.startsWith('text/') || ext === 'txt') {
        return { type: 'text', icon: FiFileText, name };
    }
    // Add more specific types if needed (e.g., zip, excel, powerpoint)

    return { type: 'unknown', icon: FiFile, name };
};

// --- Preview Modal Component ---
const PreviewModal = ({
  isOpen, onClose, file, currentPage, totalPages, onPrev, onNext, filesList = [], showDownloadAll = true,
}) => {

  const [isZipping, setIsZipping] = useState(false);
  const [zipStatus, setZipStatus] = useState({ message: '', type: 'idle' }); // idle, loading, success, error
  const [isPreviewLoading, setIsPreviewLoading] = useState(true); // Track preview content loading

  // Close modal on Escape key
  useEffect(() => {
    const handleEscape = (event) => { if (event.key === 'Escape') onClose(); };
    if (isOpen) document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Reset preview loading state when file changes
  useEffect(() => {
      if (file) {
          setIsPreviewLoading(true);
          // For images/iframes, actual load state is harder to track without onLoad handlers,
          // so we'll use a small delay as a basic indicator or rely on browser rendering.
          // A simple timeout can hide the spinner after a short period.
          const timer = setTimeout(() => setIsPreviewLoading(false), 500); // Adjust delay as needed
          return () => clearTimeout(timer);
      }
  }, [file]);


  if (!isOpen) return null;

  const { type: fileType, icon: FileIcon, name: displayFileName } = getFileInfo(file);
  const previewUrl = file?.preview_url;
  const downloadUrl = file?.download_url || previewUrl; // Fallback to preview URL if download specific is missing

  // --- Action Handlers ---
  const handleDownload = () => {
    if (!downloadUrl) {
        setZipStatus({ message: 'No download URL available.', type: 'error' }); // Use status area
        setTimeout(() => setZipStatus({ message: '', type: 'idle' }), 3000);
        return;
    }
    // Create temporary link to trigger download
    const link = document.createElement('a');
    link.href = downloadUrl;
    // Attempt to set download attribute for filename, might be overridden by Content-Disposition
    link.download = displayFileName;
    // For cross-origin URLs where 'download' attribute might not work, opening in new tab is a fallback
    // link.target = '_blank';
    // link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadAll = async () => {
    if (!filesList || filesList.length === 0 || isZipping) return;

    setIsZipping(true);
    setZipStatus({ message: `Preparing ${filesList.length} files...`, type: 'loading' });

    const zip = new JSZip();
    const folderName = file?.batchName || "Downloaded_Files"; // Use batch name from current file if available
    const folder = zip.folder(folderName);
    let failedFilesInfo = [];
    let successCount = 0;

    // Limit concurrency to avoid overwhelming the browser/server (e.g., 5 at a time)
    const CONCURRENCY_LIMIT = 5;
    for (let i = 0; i < filesList.length; i += CONCURRENCY_LIMIT) {
        const batch = filesList.slice(i, i + CONCURRENCY_LIMIT);
        setZipStatus({ message: `Workspaceing files ${i + 1}-${Math.min(i + CONCURRENCY_LIMIT, filesList.length)} of ${filesList.length}...`, type: 'loading' });

        const promises = batch.map(async (fileObj) => {
            const { name: filenameToUse } = getFileInfo(fileObj);
            if (!fileObj.batchId || !fileObj.id) {
                console.warn(`Skipping ${filenameToUse}: Missing batchId or docId.`);
                failedFilesInfo.push({ name: filenameToUse, reason: 'Missing ID' });
                return null; // Indicate failure/skip
            }
            try {
                const blob = await batchService.downloadDocumentBlob(fileObj.batchId, fileObj.id);
                folder.file(filenameToUse, blob); // Add file to zip folder
                return fileObj.id; // Indicate success
            } catch (error) {
                console.error(`Error fetching blob for ${filenameToUse}:`, error);
                failedFilesInfo.push({ name: filenameToUse, reason: error.message || 'Fetch Failed' });
                return null; // Indicate failure
            }
        });

        const results = await Promise.allSettled(promises);
        successCount += results.filter(r => r.status === 'fulfilled' && r.value !== null).length;
    }

    if (successCount === 0) {
      setZipStatus({ message: `Failed to fetch any files. ${failedFilesInfo.length > 0 ? failedFilesInfo[0].reason : ''}`, type: 'error' });
      setTimeout(() => setZipStatus({ message: '', type: 'idle' }), 5000);
      setIsZipping(false);
      return;
    }

    setZipStatus({ message: 'Creating ZIP file...', type: 'loading' });

    try {
      const content = await zip.generateAsync({ type: 'blob' }, (metadata) => {
         // Optional: Update progress if needed, e.g., for very large zips
         // setZipStatus({ message: `Zipping... ${metadata.percent.toFixed(0)}%`, type: 'loading' });
      });
      const zipFilename = `${folderName.replace(/[^a-zA-Z0-9]/g, '_')}_${successCount}_files.zip`;
      triggerBlobDownload(content, zipFilename);
      let finalMessage = `Downloaded ${successCount} files.`;
      if (failedFilesInfo.length > 0) {
          finalMessage += ` Failed to include ${failedFilesInfo.length} file(s).`;
          // Log failed files for debugging, don't overwhelm user in message
          console.warn("Failed files:", failedFilesInfo);
      }
      setZipStatus({ message: finalMessage, type: 'success' });
      setTimeout(() => setZipStatus({ message: '', type: 'idle' }), 5000); // Clear after success

    } catch (zipError) {
      console.error("Error generating zip file:", zipError);
      setZipStatus({ message: 'Failed to generate ZIP file.', type: 'error' });
      setTimeout(() => setZipStatus({ message: '', type: 'idle' }), 5000);
    } finally {
      setIsZipping(false);
    }
  };

  // --- Render ---
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[999] flex items-center justify-center p-3 sm:p-4 bg-black/70 dark:bg-black/80 backdrop-blur-sm"
          onClick={onClose} // Close on backdrop click
        >
          {/* Modal Container: Stop propagation to prevent closing when clicking inside */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="relative z-[1000] bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-4xl lg:max-w-5xl max-h-[90vh] flex flex-col overflow-hidden border border-gray-200 dark:border-gray-700/50"
            onClick={(e) => e.stopPropagation()} // Prevent backdrop click closing
          >
            {/* Header */}
            <div className="flex-shrink-0 px-5 py-4 md:px-6 md:py-4 border-b border-gray-200 dark:border-gray-700/50 flex items-center justify-between gap-4">
               {/* File Info */}
               <div className="flex items-center gap-2 min-w-0">
                    <FileIcon className="w-5 h-5 text-orange-500 flex-shrink-0" />
                    <h2 className="text-base md:text-lg font-semibold text-gray-800 dark:text-gray-100 truncate" title={displayFileName}>
                        {displayFileName}
                    </h2>
               </div>
               {/* Action Buttons */}
               <div className="flex items-center flex-shrink-0 gap-2 md:gap-3">
                 <button
                    onClick={handleDownload} title={`Download ${displayFileName}`} disabled={!downloadUrl || isZipping}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium text-orange-600 dark:text-orange-400 hover:bg-orange-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-800 focus:ring-orange-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                 >
                    <FiDownload className="w-4 h-4" /><span className='hidden md:inline'>Download</span>
                 </button>
                 {showDownloadAll && filesList && filesList.length > 1 && (
                   <button
                    onClick={handleDownloadAll} title="Download All Files as ZIP" disabled={isZipping} aria-busy={isZipping}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-800 focus:ring-green-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                   >
                    {isZipping ? <FiLoader className="w-4 h-4 animate-spin" /> : <BsFileZip className="w-4 h-4" />}
                    <span className='hidden md:inline'>{isZipping ? 'Zipping...' : 'Download All'}</span>
                    <span className='md:hidden'>{isZipping ? <FiLoader className="w-4 h-4 animate-spin" /> : <BsFileZip className="w-4 h-4" />}</span> {/* Icon only on small screens */}
                   </button>
                 )}
                 <button
                    onClick={onClose} title="Close Preview (Esc)" aria-label="Close Preview"
                    className="p-1.5 rounded-full text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-800 focus:ring-gray-400 transition-colors"
                 > <FiX className="w-5 h-5" /> </button>
               </div>
            </div>

            {/* Download All Status Area */}
            <AnimatePresence>
                {zipStatus.type !== 'idle' && (
                     <motion.div
                        key="zip-status"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        aria-live="polite"
                        className={`px-5 py-2 text-sm font-medium flex items-center gap-2 border-b border-gray-200 dark:border-gray-700/50 ${
                           zipStatus.type === 'error' ? 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300' :
                           zipStatus.type === 'success' ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300' :
                           'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                        }`}
                     >
                        {zipStatus.type === 'loading' && <FiLoader className="w-4 h-4 animate-spin flex-shrink-0" />}
                        {zipStatus.type === 'success' && <FiCheckCircle className="w-4 h-4 flex-shrink-0" />}
                        {zipStatus.type === 'error' && <FiAlertCircle className="w-4 h-4 flex-shrink-0" />}
                        <span>{zipStatus.message}</span>
                     </motion.div>
                )}
            </AnimatePresence>


            {/* Preview Content Area */}
            <div className="p-2 sm:p-4 flex-1 overflow-auto flex items-center justify-center bg-gray-100 dark:bg-gray-900/80 relative min-h-[40vh] md:min-h-[50vh]">
              {/* Basic Loading Indicator for Preview */}
              {isPreviewLoading && !previewUrl && ( // Show only if no URL yet OR during initial load phase
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-100/50 dark:bg-gray-900/50 z-10">
                     <FiLoader className="w-8 h-8 text-orange-500 animate-spin"/>
                  </div>
              )}

              {!previewUrl ? (
                <div className="text-center p-10 text-gray-500 dark:text-gray-400"> <FiAlertCircle className="mx-auto h-12 w-12 text-yellow-500 mb-4" /> <p className="font-medium">Preview Unavailable</p><p className="text-sm mt-1">Could not load preview URL for this file.</p> </div>
              ) : fileType === 'image' ? (
                <img src={previewUrl} alt={`Preview of ${displayFileName}`} crossOrigin="anonymous" className="max-w-full max-h-[80vh] w-full object-contain rounded-md dark:bg-gray-700" onLoad={()=> setIsPreviewLoading(false)} onError={()=> setIsPreviewLoading(false)}/>
              ) : fileType === 'pdf' ? (
                <iframe src={`${previewUrl}#view=FitH`} // Added view parameter for better initial fit
                  className="w-full h-[80vh] max-w-full rounded border-none bg-white dark:bg-gray-600 shadow-inner" title={`PDF Preview: ${displayFileName}`}
                  onLoad={()=> setIsPreviewLoading(false)} onError={()=> setIsPreviewLoading(false)}/>
              ) : fileType === 'doc' ? (
                  // Using Google Docs Viewer (Keep caveats in mind)
                  <div className="w-full h-[80vh] flex flex-col items-center justify-center text-center p-4">
                      <iframe src={`https://docs.google.com/gview?url=${encodeURIComponent(previewUrl)}&embedded=true`}
                          className="w-full h-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-500" title={`Document Preview: ${displayFileName}`}
                          sandbox="allow-scripts allow-same-origin" onLoad={()=> setIsPreviewLoading(false)} onError={()=> setIsPreviewLoading(false)}/>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2"> Document preview powered by Google Docs Viewer. May not work for all files. <button onClick={handleDownload} className="text-orange-600 dark:text-orange-400 hover:underline ml-1">Download file</button> if preview fails. </p>
                  </div>
               ) : fileType === 'text' ? (
                   <div className="w-full h-full max-h-[80vh] p-4 overflow-auto bg-white dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600 shadow-inner">
                        <pre className="whitespace-pre-wrap text-sm text-gray-800 dark:text-gray-100 font-mono">
                            {file.extracted_content || <span className="italic text-gray-500 dark:text-gray-400">No text content extracted or available for preview.</span>}
                        </pre>
                   </div>
               ) : (
                 // Fallback for unknown/unsupported types
                 <div className="text-center p-10 text-gray-500 dark:text-gray-400">
                    <FileIcon className="mx-auto h-16 w-16 text-gray-400 dark:text-gray-500 mb-4" />
                    <p className="font-medium">Preview Not Available</p>
                    <p className="text-sm mt-1">Direct preview is not supported for this file type.</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">({displayFileName})</p>
                    <button onClick={handleDownload} className="mt-4 text-sm font-medium text-orange-600 dark:text-orange-400 hover:underline inline-flex items-center gap-1"> <FiDownload className="w-4 h-4"/> Download File </button>
                 </div>
              )}
            </div>

            {/* Footer & Pagination */}
            {totalPages > 1 && (
              <div className="flex-shrink-0 px-5 py-3 border-t border-gray-200 dark:border-gray-700/50 flex items-center justify-between text-sm">
                <button
                    onClick={onPrev} disabled={currentPage === 0 || isZipping}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-md text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-1 focus:ring-offset-1 dark:focus:ring-offset-gray-800 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    aria-label="Previous File"
                > <FiChevronLeft className="w-5 h-5" /> Previous </button>
                <span className="font-medium text-gray-600 dark:text-gray-300">{currentPage + 1} / {totalPages}</span>
                <button
                    onClick={onNext} disabled={currentPage >= totalPages - 1 || isZipping}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-md text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-1 focus:ring-offset-1 dark:focus:ring-offset-gray-800 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    aria-label="Next File"
                > Next <FiChevronRight className="w-5 h-5" /> </button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PreviewModal;