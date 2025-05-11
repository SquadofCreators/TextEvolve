// src/components/utility/PreviewModal.jsx

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FiX, FiChevronLeft, FiChevronRight, FiDownload, FiAlertCircle,
    FiFile, FiLoader, FiCheckCircle, FiImage, FiFileText, FiZap, FiRefreshCw // Added FiZap, FiRefreshCw
} from 'react-icons/fi';
import { BsFileZip, BsFiletypeDoc, BsFiletypePdf } from "react-icons/bs";
import JSZip from 'jszip';
import { batchService } from '../../services/batchService'; // Adjust path
import { ReactCompareSlider, ReactCompareSliderImage } from 'react-compare-slider'; // Import comparison slider

// --- Helper Functions (triggerBlobDownload, getFileInfo - keep as they are) ---
const triggerBlobDownload = (blob, filename) => {
    if (!blob) {
      console.error("triggerBlobDownload called with null or undefined blob");
      return;
    }
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename || 'download');
    document.body.appendChild(link);
    try {
      link.click();
    } catch (err) {
        console.error("Error triggering blob download click:", err);
    }
    document.body.removeChild(link);
    setTimeout(() => window.URL.revokeObjectURL(url), 100);
};

const getFileInfo = (fileObj) => {
    if (!fileObj) return { type: 'unknown', icon: FiFile, name: 'unknown file' };
    const mime = fileObj.mimeType || '';
    const name = fileObj.fileName || fileObj.name || `file_${fileObj.id?.substring(0, 6) ?? 'unknown'}`;
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
    return { type: 'unknown', icon: FiFile, name };
};


// --- Preview Modal Component ---
const PreviewModal = ({
    isOpen, onClose, file, currentPage, totalPages, onPrev, onNext,
    filesList = [], showDownloadAll = true,
    onEnhancementComplete, // Callback: (docId, newEnhancedStorageKey) => void
}) => {
    const [isZipping, setIsZipping] = useState(false);
    const [isSingleDownloading, setIsSingleDownloading] = useState(false);
    const [previewStatus, setPreviewStatus] = useState({ message: '', type: 'idle' }); // Renamed from zipStatus for general use
    const [isPreviewLoading, setIsPreviewLoading] = useState(true);

    // --- State for Enhancement ---
    const [currentEnhancedUrl, setCurrentEnhancedUrl] = useState(file?.enhancedStorageKey || null);
    const [isEnhancing, setIsEnhancing] = useState(false);
    const [enhancementModel, setEnhancementModel] = useState("REAL-ESRGAN 2x");
    const availableModels = ["REAL-ESRGAN 2x", "REAL-ESRGAN 4x"];

    const { type: fileType, icon: FileIcon, name: displayFileName } = useMemo(() => getFileInfo(file), [file]);

    // Update currentEnhancedUrl if the file prop changes (e.g., navigating to a different file)
    useEffect(() => {
        setCurrentEnhancedUrl(file?.enhancedStorageKey || null);
        // Reset enhancement specific loading when file changes
        setIsEnhancing(false); 
        setPreviewStatus({ message: '', type: 'idle' }); // Clear previous enhancement messages
    }, [file]);


    useEffect(() => {
        const handleEscape = (event) => { if (event.key === 'Escape') onClose(); };
        if (isOpen) document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [isOpen, onClose]);

    useEffect(() => {
        if (file) {
            setIsPreviewLoading(true);
            if (fileType !== 'image' && fileType !== 'pdf' && fileType !== 'doc') {
                const timer = setTimeout(() => setIsPreviewLoading(false), 300);
                return () => clearTimeout(timer);
            }
        }
    }, [file, fileType]);


    if (!isOpen || !file) return null;

    // file.storageKey is the original image (full URL from backend)
    // file.preview_url was previously used, but storageKey is more direct for original
    const originalImageUrl = file.storageKey;

    const handleDownload = useCallback(async () => {
        if (!file || !file.batchId || !file.id || isSingleDownloading || isZipping) return;
        const currentDocId = file.id;
        const currentBatchId = file.batchId;
        const currentDisplayFileName = displayFileName;
        setIsSingleDownloading(true);
        setPreviewStatus({ message: `Downloading ${currentDisplayFileName}...`, type: 'loading' });
        try {
            const blob = await batchService.downloadDocumentBlob(currentBatchId, currentDocId);
            triggerBlobDownload(blob, currentDisplayFileName);
            setPreviewStatus({ message: `${currentDisplayFileName} downloaded.`, type: 'success' });
        } catch (error) {
            setPreviewStatus({ message: `Download failed: ${error.message}`, type: 'error' });
        } finally {
            setIsSingleDownloading(false);
            setTimeout(() => setPreviewStatus({ message: '', type: 'idle' }), 5000);
        }
    }, [file, displayFileName, isSingleDownloading, isZipping]);

    const handleDownloadAll = useCallback(async () => {
        // (Your existing handleDownloadAll logic - ensure it's compatible)
        // ... (Ensure it uses setPreviewStatus for feedback) ...
        if (!filesList || filesList.length === 0 || isZipping || isSingleDownloading) return;
        setIsZipping(true);
        setPreviewStatus({ message: `Preparing ${filesList.length} files...`, type: 'loading' });
        const zip = new JSZip();
        const folderName = file?.batchName || "Downloaded_Files";
        const folder = zip.folder(folderName);
        let failedFilesInfo = []; let successCount = 0;
        const CONCURRENCY_LIMIT = 5;
        for (let i = 0; i < filesList.length; i += CONCURRENCY_LIMIT) {
            const batchOfFiles = filesList.slice(i, i + CONCURRENCY_LIMIT);
            setPreviewStatus({ message: `Processing files ${i + 1}-${Math.min(i + CONCURRENCY_LIMIT, filesList.length)}...`, type: 'loading' });
            const promises = batchOfFiles.map(async (fileToZip) => {
                const { name: filenameToUse } = getFileInfo(fileToZip);
                if (!fileToZip.batchId || !fileToZip.id) {
                    failedFilesInfo.push({ name: filenameToUse, reason: 'Missing ID' }); return null;
                }
                try {
                    const blob = await batchService.downloadDocumentBlob(fileToZip.batchId, fileToZip.id);
                    folder.file(filenameToUse, blob); return fileToZip.id;
                } catch (error) {
                    failedFilesInfo.push({ name: filenameToUse, reason: error.message || 'Fetch Failed' }); return null;
                }
            });
            const results = await Promise.allSettled(promises);
            successCount += results.filter(r => r.status === 'fulfilled' && r.value !== null).length;
        }
        if (successCount === 0) {
            setPreviewStatus({ message: `Failed to fetch any files.`, type: 'error' });
            setTimeout(() => setPreviewStatus({ message: '', type: 'idle' }), 5000); setIsZipping(false); return;
        }
        setPreviewStatus({ message: 'Creating ZIP file...', type: 'loading' });
        try {
            const content = await zip.generateAsync({ type: 'blob' });
            const zipFilename = `${folderName.replace(/[^a-zA-Z0-9_]/g, '_')}_${successCount}_files.zip`;
            triggerBlobDownload(content, zipFilename);
            let finalMessage = `Downloaded ${successCount} files.`;
            if (failedFilesInfo.length > 0) finalMessage += ` ${failedFilesInfo.length} failed.`;
            setPreviewStatus({ message: finalMessage, type: 'success' });
        } catch (zipError) {
            setPreviewStatus({ message: 'Failed to generate ZIP.', type: 'error' });
        } finally {
            setIsZipping(false); setTimeout(() => setPreviewStatus({ message: '', type: 'idle' }), 5000);
        }
    }, [filesList, isZipping, isSingleDownloading, file?.batchName]);

    // --- Enhancement Handler ---
    const handleEnhanceImage = useCallback(async () => {
        if (!file || !originalImageUrl || fileType !== 'image' || isEnhancing) return;

        setIsEnhancing(true);
        setPreviewStatus({ message: `Enhancing with ${enhancementModel}...`, type: 'loading' });

        try {
            // 1. Call Python API
            const pyApiResponse = await batchService.enhanceSingleImagePyApi(originalImageUrl, enhancementModel);

            if (pyApiResponse && pyApiResponse.status === 'success' && pyApiResponse.output_url) {
                setPreviewStatus({ message: 'Enhancement successful. Saving...', type: 'loading' });
                // 2. Save enhanced_url to our backend
                await batchService.setDocumentEnhancedKey(file.batchId, file.id, pyApiResponse.output_url);
                setCurrentEnhancedUrl(pyApiResponse.output_url); // Update UI immediately
                setPreviewStatus({ message: 'Enhanced image saved!', type: 'success' });

                // Notify parent component
                if (onEnhancementComplete) {
                    onEnhancementComplete(file.id, pyApiResponse.output_url);
                }
            } else {
                throw new Error(pyApiResponse?.message || 'Enhancement failed or no output URL received.');
            }
        } catch (error) {
            console.error("Error during image enhancement process:", error);
            setPreviewStatus({ message: `Enhancement Error: ${error.message}`, type: 'error' });
        } finally {
            setIsEnhancing(false);
            setTimeout(() => setPreviewStatus({ message: '', type: 'idle' }), 6000); // Keep message a bit longer
        }
    }, [file, originalImageUrl, fileType, isEnhancing, enhancementModel, onEnhancementComplete]);


    const renderPreviewContent = () => {
        if (isPreviewLoading && !(fileType === 'image' && (originalImageUrl || currentEnhancedUrl))) { // Don't show global loader if image itself will show one
            return (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-100/50 dark:bg-gray-900/50 z-10">
                    <FiLoader className="w-8 h-8 text-orange-500 animate-spin" />
                </div>
            );
        }

        if (!originalImageUrl && !currentEnhancedUrl) {
             return <div className="text-center p-10 text-gray-500 dark:text-gray-400"> <FiAlertCircle className="mx-auto h-12 w-12 text-yellow-500 mb-4" /> <p className="font-medium">Preview Unavailable</p><p className="text-sm mt-1">Image URL not found.</p> </div>;
        }

        if (fileType === 'image' && currentEnhancedUrl && originalImageUrl) {
            return (
                <ReactCompareSlider
                    itemOne={<ReactCompareSliderImage src={originalImageUrl} alt="Original Image" style={{ filter: isPreviewLoading ? 'blur(5px)' : 'none' }} onLoad={() => setIsPreviewLoading(false)} onError={() => setIsPreviewLoading(false)} />}
                    itemTwo={<ReactCompareSliderImage src={currentEnhancedUrl} alt="Enhanced Image" style={{ filter: isPreviewLoading ? 'blur(5px)' : 'none' }} onLoad={() => setIsPreviewLoading(false)} onError={() => setIsPreviewLoading(false)} />}
                    className="w-full max-h-[calc(80vh-40px)] h-auto" // Adjust max height as needed
                    style={{ width: '100%', height: '100%' }}
                />
            );
        } else if (fileType === 'image' && originalImageUrl) {
            return <img src={originalImageUrl} alt={`Preview of ${displayFileName}`} crossOrigin="anonymous" className="max-w-full max-h-[80vh] w-auto h-auto object-contain rounded-md dark:bg-gray-700" onLoad={() => setIsPreviewLoading(false)} onError={() => { setIsPreviewLoading(false); console.error("Failed to load image preview:", originalImageUrl) }} />;
        } else if (fileType === 'pdf') {
            return <iframe src={`${originalImageUrl}#view=FitH`} className="w-full h-[80vh] max-w-full rounded border-none bg-white dark:bg-gray-600 shadow-inner" title={`PDF Preview: ${displayFileName}`} onLoad={() => setIsPreviewLoading(false)} onError={() => { setIsPreviewLoading(false); console.error("Failed to load PDF preview:", originalImageUrl) }} />;
        } else if (fileType === 'doc') {
            return (
                <div className="w-full h-[80vh] flex flex-col items-center justify-center text-center p-4">
                    <iframe src={`https://docs.google.com/gview?url=${encodeURIComponent(originalImageUrl)}&embedded=true`} className="w-full h-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-500" title={`Document Preview: ${displayFileName}`} sandbox="allow-scripts allow-same-origin" onLoad={() => setIsPreviewLoading(false)} onError={() => { setIsPreviewLoading(false); console.error("Failed to load Google Docs preview:", originalImageUrl) }} />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2"> Preview via Google Docs. <button onClick={handleDownload} className="text-orange-600 dark:text-orange-400 hover:underline ml-1">Download file</button> if preview fails. </p>
                </div>
            );
        } else if (fileType === 'text' && file.extractedContent) {
             setIsPreviewLoading(false); // Text content is immediate
            return (
                <div className="w-full h-full max-h-[80vh] p-4 overflow-auto bg-white dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600 shadow-inner">
                    <pre className="whitespace-pre-wrap text-sm text-gray-800 dark:text-gray-100 font-mono">{file.extractedContent}</pre>
                </div>
            );
        } else {
            setIsPreviewLoading(false); // Fallback, no preview
            return (
                <div className="text-center p-10 text-gray-500 dark:text-gray-400">
                    <FileIcon className="mx-auto h-16 w-16 text-gray-400 dark:text-gray-500 mb-4" />
                    <p className="font-medium">Preview Not Supported</p>
                    <p className="text-sm mt-1">({displayFileName})</p>
                    <button onClick={handleDownload} className="mt-4 text-sm font-medium text-orange-600 dark:text-orange-400 hover:underline inline-flex items-center gap-1"> <FiDownload className="w-4 h-4" /> Download File </button>
                </div>
            );
        }
    };


    // --- Render ---
    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="fixed inset-0 z-[999] flex items-center justify-center p-3 sm:p-4 bg-black/70 dark:bg-black/80 backdrop-blur-sm"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                        transition={{ duration: 0.2, ease: 'easeOut' }}
                        className="relative z-[1000] bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-4xl lg:max-w-5xl xl:max-w-6xl max-h-[90vh] flex flex-col overflow-hidden border border-gray-200 dark:border-gray-700/50"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="flex-shrink-0 px-5 py-4 md:px-6 md:py-4 border-b border-gray-200 dark:border-gray-700/50 flex items-center justify-between gap-4">
                            <div className="flex items-center gap-2 min-w-0">
                                <FileIcon className="w-5 h-5 text-orange-500 flex-shrink-0" />
                                <h2 className="text-base md:text-lg font-semibold text-gray-800 dark:text-gray-100 truncate" title={displayFileName}>
                                    {displayFileName}
                                </h2>
                            </div>
                            <div className="flex items-center flex-shrink-0 gap-2 md:gap-3">
                                {/* --- ENHANCEMENT CONTROLS (If image and not currently enhanced or user wants to re-enhance) --- */}
                                {fileType === 'image' && originalImageUrl && (
                                    <>
                                        <select
                                            value={enhancementModel}
                                            onChange={(e) => setEnhancementModel(e.target.value)}
                                            disabled={isEnhancing}
                                            className="px-2 py-1.5 text-xs md:text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 focus:ring-orange-500 focus:border-orange-500 disabled:opacity-60"
                                        >
                                            {availableModels.map(model => (
                                                <option key={model} value={model}>{model.replace('REAL-ESRGAN ', '')}</option>
                                            ))}
                                        </select>
                                        <button
                                            onClick={handleEnhanceImage}
                                            title={currentEnhancedUrl ? "Re-enhance Image" : "Enhance Image"}
                                            disabled={isEnhancing || isZipping || isSingleDownloading}
                                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium text-purple-600 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-800 focus:ring-purple-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {isEnhancing ? <FiLoader className="w-4 h-4 animate-spin" /> : (currentEnhancedUrl ? <FiRefreshCw className="w-4 h-4" /> : <FiZap className="w-4 h-4" />)}
                                            <span className='hidden md:inline'>{isEnhancing ? 'Enhancing...' : (currentEnhancedUrl ? 'Re-enhance' : 'Enhance')}</span>
                                        </button>
                                    </>
                                )}
                                {/* --- END ENHANCEMENT CONTROLS --- */}

                                <button
                                    onClick={handleDownload}
                                    title={`Download ${displayFileName}`}
                                    disabled={isZipping || isSingleDownloading || isEnhancing}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium text-orange-600 dark:text-orange-400 hover:bg-orange-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-800 focus:ring-orange-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isSingleDownloading ? <FiLoader className="w-4 h-4 animate-spin" /> : <FiDownload className="w-4 h-4" />}
                                    <span className='hidden md:inline'>{isSingleDownloading ? 'Downloading...' : 'Download'}</span>
                                </button>
                                {showDownloadAll && filesList && filesList.length > 1 && (
                                    <button
                                        onClick={handleDownloadAll}
                                        title="Download All Files as ZIP"
                                        disabled={isZipping || isSingleDownloading || isEnhancing}
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-800 focus:ring-green-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isZipping ? <FiLoader className="w-4 h-4 animate-spin" /> : <BsFileZip className="w-4 h-4" />}
                                        <span className='hidden md:inline'>{isZipping ? 'Zipping...' : 'All'}</span>
                                    </button>
                                )}
                                <button
                                    onClick={onClose} title="Close Preview (Esc)" aria-label="Close Preview"
                                    className="p-1.5 rounded-full text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-800 focus:ring-gray-400 transition-colors"
                                > <FiX className="w-5 h-5" /> </button>
                            </div>
                        </div>

                        {/* Status Area (for downloads and enhancements) */}
                        <AnimatePresence>
                            {previewStatus.type !== 'idle' && (
                                <motion.div
                                    key="preview-status" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                                    className={`px-5 py-2 text-sm font-medium flex items-center gap-2 border-b border-gray-200 dark:border-gray-700/50 ${previewStatus.type === 'error' ? 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300' : previewStatus.type === 'success' ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300' : 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'}`}
                                >
                                    {previewStatus.type === 'loading' && <FiLoader className="w-4 h-4 animate-spin flex-shrink-0" />}
                                    {previewStatus.type === 'success' && <FiCheckCircle className="w-4 h-4 flex-shrink-0" />}
                                    {previewStatus.type === 'error' && <FiAlertCircle className="w-4 h-4 flex-shrink-0" />}
                                    <span>{previewStatus.message}</span>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Preview Content Area */}
                        <div className="p-1 sm:p-2 flex-1 overflow-auto flex items-center justify-center bg-gray-100 dark:bg-gray-900/80 relative min-h-[50vh] md:min-h-[60vh]">
                           {renderPreviewContent()}
                        </div>

                        {/* Footer & Pagination */}
                        {totalPages > 1 && (
                            <div className="flex-shrink-0 px-5 py-3 border-t border-gray-200 dark:border-gray-700/50 flex items-center justify-between text-sm">
                                <button onClick={onPrev} disabled={currentPage === 0 || isZipping || isSingleDownloading || isEnhancing} className="flex items-center gap-1 px-3 py-1.5 rounded-md text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-gray-700 disabled:opacity-50"> <FiChevronLeft className="w-5 h-5" /> Previous </button>
                                <span className="font-medium text-gray-600 dark:text-gray-300">{currentPage + 1} / {totalPages}</span>
                                <button onClick={onNext} disabled={currentPage >= totalPages - 1 || isZipping || isSingleDownloading || isEnhancing} className="flex items-center gap-1 px-3 py-1.5 rounded-md text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-gray-700 disabled:opacity-50"> Next <FiChevronRight className="w-5 h-5" /> </button>
                            </div>
                        )}
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default PreviewModal;