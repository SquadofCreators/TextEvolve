// src/components/utility/PreviewModal.jsx

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FiX, FiChevronLeft, FiChevronRight, FiDownload, FiAlertCircle,
    FiFile, FiLoader, FiCheckCircle, FiImage, FiFileText, FiZap, FiRefreshCw
} from 'react-icons/fi';
import { BsFileZip, BsFiletypeDoc, BsFiletypePdf } from "react-icons/bs";
import JSZip from 'jszip';
import { batchService } from '../../services/batchService'; // Adjust path
import { ReactCompareSlider, ReactCompareSliderImage } from 'react-compare-slider';

// --- Helper Functions ---
const triggerBlobDownload = (blob, filename) => {
    if (!blob) { console.error("triggerBlobDownload: Blob is null/undefined."); return; }
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename || 'download');
    document.body.appendChild(link);
    try { link.click(); } catch (err) { console.error("triggerBlobDownload click error:", err); }
    document.body.removeChild(link);
    setTimeout(() => window.URL.revokeObjectURL(url), 100);
};

const getFileInfo = (fileObj) => {
    if (!fileObj) return { type: 'unknown', icon: FiFile, name: 'Unknown File', originalUrl: null, enhancedUrl: null, id: null, batchId: null, batchName: 'Files', extractedContent: null };
    const mime = fileObj.mimeType || '';
    const name = fileObj.fileName || fileObj.name || `file_${fileObj.id?.substring(0, 6) ?? 'unknown'}`;
    const ext = name.split('.').pop()?.toLowerCase() || '';
    let type = 'unknown', icon = FiFile;

    if (mime.startsWith('image/') || ['png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp', 'svg'].includes(ext)) {
        type = 'image'; icon = FiImage;
    } else if (mime === 'application/pdf' || ext === 'pdf') {
        type = 'pdf'; icon = BsFiletypePdf;
    } else if (mime.includes('wordprocessingml') || mime.includes('msword') || ['doc', 'docx'].includes(ext)) {
        type = 'doc'; icon = BsFiletypeDoc;
    } else if (mime.startsWith('text/') || ext === 'txt') {
        type = 'text'; icon = FiFileText;
    }
    return {
        type,
        icon,
        name,
        originalUrl: fileObj.storageKey,
        enhancedUrl: fileObj.enhancedStorageKey,
        id: fileObj.id,
        batchId: fileObj.batchId,
        batchName: fileObj.batchName,
        extractedContent: fileObj.extractedContent,
    };
};

const PreviewModal = ({
    isOpen, onClose, file: currentFileProp, currentPage, totalPages, onPrev, onNext,
    filesList = [], showDownloadAll = true,
    onEnhancementComplete,
}) => {
    const [isZipping, setIsZipping] = useState(false);
    const [isSingleDownloading, setIsSingleDownloading] = useState(false);
    const [operationStatus, setOperationStatus] = useState({ message: '', type: 'idle' });
    
    const [isOriginalImageLoading, setIsOriginalImageLoading] = useState(true);
    const [hasOriginalLoadFailed, setHasOriginalLoadFailed] = useState(false);
    const [isEnhancedImageLoading, setIsEnhancedImageLoading] = useState(true);
    const [hasEnhancedLoadFailed, setHasEnhancedLoadFailed] = useState(false);

    const [currentEnhancedUrlInModal, setCurrentEnhancedUrlInModal] = useState(null);
    const [isEnhancing, setIsEnhancing] = useState(false);
    const [enhancementModel, setEnhancementModel] = useState("REAL-ESRGAN 2x");
    const availableModels = ["REAL-ESRGAN 2x", "REAL-ESRGAN 4x"];

    const fileInfo = useMemo(() => getFileInfo(currentFileProp), [currentFileProp]);
    const { 
        type: fileType, 
        icon: FileIcon, 
        name: displayFileName, 
        originalUrl, 
        id: docId, 
        batchId 
    } = fileInfo;

    useEffect(() => {
        if (currentFileProp) {
            setCurrentEnhancedUrlInModal(currentFileProp.enhancedStorageKey || null);
            setIsOriginalImageLoading(true); 
            setHasOriginalLoadFailed(false);
            setIsEnhancedImageLoading(true); 
            setHasEnhancedLoadFailed(false);
            setIsEnhancing(false);
            setOperationStatus({ message: '', type: 'idle' });
        }
    }, [currentFileProp]);

    useEffect(() => {
        const handleEscape = (event) => { if (event.key === 'Escape') onClose(); };
        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
        }
        return () => document.removeEventListener('keydown', handleEscape);
    }, [isOpen, onClose]);

    if (!isOpen || !currentFileProp) return null;

    const handleDownload = useCallback(async () => {
        if (!docId || !batchId || isSingleDownloading || isZipping || isEnhancing) return;
        setIsSingleDownloading(true);
        setOperationStatus({ message: `Downloading ${displayFileName}...`, type: 'loading' });
        try {
            const blob = await batchService.downloadDocumentBlob(batchId, docId);
            triggerBlobDownload(blob, displayFileName);
            setOperationStatus({ message: `${displayFileName} downloaded.`, type: 'success' });
        } catch (error) {
            setOperationStatus({ message: `Download failed: ${error.message}`, type: 'error' });
        } finally {
            setIsSingleDownloading(false);
            setTimeout(() => setOperationStatus({ message: '', type: 'idle' }), 5000);
        }
    }, [docId, batchId, displayFileName, isSingleDownloading, isZipping, isEnhancing]);

    const handleDownloadAll = useCallback(async () => {
        if (!filesList || filesList.length === 0 || isZipping || isSingleDownloading || isEnhancing) return;
        setIsZipping(true);
        setOperationStatus({ message: `Preparing ${filesList.length} files...`, type: 'loading' });
        const zip = new JSZip();
        const folderName = currentFileProp?.batchName || fileInfo.batchName || "Downloaded_Files";
        const folder = zip.folder(folderName);
        let failedFilesInfo = []; let successCount = 0;
        const CONCURRENCY_LIMIT = 5;
        for (let i = 0; i < filesList.length; i += CONCURRENCY_LIMIT) {
            const currentBatchFiles = filesList.slice(i, i + CONCURRENCY_LIMIT);
            setOperationStatus({ message: `Processing files ${i + 1}-${Math.min(i + CONCURRENCY_LIMIT, filesList.length)} of ${filesList.length}...`, type: 'loading' });
            const promises = currentBatchFiles.map(async (fileToZip) => {
                const itemInfo = getFileInfo(fileToZip);
                if (!itemInfo.batchId || !itemInfo.id) {
                    failedFilesInfo.push({ name: itemInfo.name, reason: 'Missing ID' }); return null;
                }
                try {
                    const blob = await batchService.downloadDocumentBlob(itemInfo.batchId, itemInfo.id);
                    folder.file(itemInfo.name, blob); return itemInfo.id;
                } catch (error) {
                    failedFilesInfo.push({ name: itemInfo.name, reason: error.message || 'Fetch Failed' }); return null;
                }
            });
            const results = await Promise.allSettled(promises);
            successCount += results.filter(r => r.status === 'fulfilled' && r.value !== null).length;
        }
        if (successCount === 0 && filesList.length > 0) {
            setOperationStatus({ message: `Failed to fetch any files for ZIP.`, type: 'error' });
        } else if (filesList.length === 0) {
            setOperationStatus({ message: `No files to ZIP.`, type: 'info' });
        } else {
            setOperationStatus({ message: 'Creating ZIP file...', type: 'loading' });
            try {
                const content = await zip.generateAsync({ type: 'blob' });
                const zipFilename = `${folderName.replace(/[^a-zA-Z0-9_]/g, '_')}_${successCount}_files.zip`;
                triggerBlobDownload(content, zipFilename);
                let finalMessage = `Downloaded ${successCount} of ${filesList.length} files as ZIP.`;
                if (failedFilesInfo.length > 0) {
                    finalMessage += ` ${failedFilesInfo.length} file(s) failed.`;
                    console.warn("Failed files during ZIP creation:", failedFilesInfo);
                }
                setOperationStatus({ message: finalMessage, type: 'success' });
            } catch (zipError) {
                console.error("Error generating zip file:", zipError);
                setOperationStatus({ message: 'Failed to generate ZIP file.', type: 'error' });
            }
        }
        setIsZipping(false); 
        setTimeout(() => setOperationStatus({ message: '', type: 'idle' }), 5000);
    }, [filesList, isZipping, isSingleDownloading, isEnhancing, currentFileProp?.batchName, fileInfo.batchName]);

    const handleEnhanceImage = useCallback(async () => {
        if (!docId || !batchId || !originalUrl || fileType !== 'image' || isEnhancing) return;
        setIsEnhancing(true);
        setOperationStatus({ message: `Enhancing with ${enhancementModel}...`, type: 'loading' });
        // Reset loading states for a new enhancement attempt
        setIsOriginalImageLoading(true); // Original might need to be re-evaluated by slider
        setHasOriginalLoadFailed(false);
        setIsEnhancedImageLoading(true);
        setHasEnhancedLoadFailed(false);
        try {
            const pyApiResponse = await batchService.enhanceSingleImagePyApi(originalUrl, enhancementModel);
            if (pyApiResponse && pyApiResponse.status === 'success' && pyApiResponse.output_url) {
                setOperationStatus({ message: 'Enhancement successful. Saving...', type: 'loading' });
                const updatedDoc = await batchService.setDocumentEnhancedKey(batchId, docId, pyApiResponse.output_url);
                setCurrentEnhancedUrlInModal(updatedDoc.enhancedStorageKey); // Update state with new URL
                setOperationStatus({ message: 'Enhanced image saved!', type: 'success' });
                if (onEnhancementComplete) {
                    onEnhancementComplete(docId, updatedDoc.enhancedStorageKey);
                }
            } else {
                throw new Error(pyApiResponse?.message || 'Enhancement API failed or no output URL.');
            }
        } catch (error) {
            console.error("Error during image enhancement process:", error);
            setOperationStatus({ message: `Enhancement Error: ${error.message}`, type: 'error' });
            setHasEnhancedLoadFailed(true); // Mark enhanced as failed if API call fails
        } finally {
            setIsEnhancing(false);
            // Do not turn off original image loading here, let its onLoad/onError handle it.
            // If enhanced failed, its loading state is also handled by its own onError or above.
            setTimeout(() => setOperationStatus({ message: '', type: 'idle' }), 6000);
        }
    }, [docId, batchId, originalUrl, fileType, isEnhancing, enhancementModel, onEnhancementComplete]);

    // This determines if the general loading overlay for the content area should be shown
    const showOverallLoader = useMemo(() => {
        if (fileType !== 'image' && fileType !== 'pdf' && fileType !== 'doc') return false; // No loader for text/unknown
        
        if (fileType === 'image') {
            if (currentEnhancedUrlInModal && originalUrl) { // Slider mode
                return isOriginalImageLoading || isEnhancedImageLoading;
            }
            return isOriginalImageLoading; // Single image mode
        }
        return isOriginalImageLoading; // For PDF/DOC, uses original image loading state
    }, [fileType, originalUrl, currentEnhancedUrlInModal, isOriginalImageLoading, isEnhancedImageLoading]);


    const renderPreviewContent = () => {
        const isOriginalUrlValid = originalUrl && typeof originalUrl === 'string';
        const isEnhancedUrlValid = currentEnhancedUrlInModal && typeof currentEnhancedUrlInModal === 'string';

        if (fileType === 'image') {
            if (isEnhancedUrlValid && isOriginalUrlValid) {
                // Both images are available for comparison
                return (
                    <ReactCompareSlider
                        key={docId + '-' + currentEnhancedUrlInModal} // Force re-mount on URL change
                        itemOne={
                            <ReactCompareSliderImage
                                src={originalUrl}
                                alt="Original Image"
                                crossOrigin="anonymous"
                                onLoad={() => setIsOriginalImageLoading(false)}
                                onError={() => {
                                    console.error("PreviewModal: Failed to load ORIGINAL image for slider. URL:", originalUrl);
                                    setIsOriginalImageLoading(false);
                                    setHasOriginalLoadFailed(true);
                                }}
                            />
                        }
                        itemTwo={
                            <ReactCompareSliderImage
                                src={currentEnhancedUrlInModal}
                                alt="Enhanced Image"
                                crossOrigin="anonymous"
                                onLoad={() => setIsEnhancedImageLoading(false)}
                                onError={() => {
                                    console.error("PreviewModal: Failed to load ENHANCED image for slider. URL:", currentEnhancedUrlInModal);
                                    setIsEnhancedImageLoading(false);
                                    setHasEnhancedLoadFailed(true);
                                }}
                            />
                        }
                        className="max-w-full max-h-full w-full h-full" // Ensure slider fills its container
                        style={{ visibility: showOverallLoader ? 'hidden' : 'visible' }}
                    />
                );
            } else if (isOriginalUrlValid) {
                // Only original image is available
                return (
                    <img
                        src={originalUrl}
                        alt={hasOriginalLoadFailed ? "Failed to load original image" : `Preview of ${displayFileName}`}
                        crossOrigin="anonymous"
                        className="max-w-full max-h-full object-contain"
                        onLoad={() => setIsOriginalImageLoading(false)}
                        onError={() => {
                            console.error("PreviewModal: Failed to load single original image. URL:", originalUrl);
                            setIsOriginalImageLoading(false);
                            setHasOriginalLoadFailed(true);
                        }}
                        style={{ visibility: isOriginalImageLoading ? 'hidden' : 'visible' }}
                    />
                );
            }
        }

        // PDF, DOC, TEXT, and Fallbacks (ensure these also respect the overall loader if desired)
        const commonIframeVisibility = { visibility: isOriginalImageLoading ? 'hidden' : 'visible' };

        if (fileType === 'pdf' && isOriginalUrlValid) {
            return <iframe src={`${originalUrl}#toolbar=0&navpanes=0&scrollbar=0`} title={`PDF Preview: ${displayFileName}`} className="w-full h-full border-none" onLoad={() => setIsOriginalImageLoading(false)} onError={() => { console.error("PreviewModal: Failed to load PDF.", originalUrl); setIsOriginalImageLoading(false); setHasOriginalLoadFailed(true); }} style={commonIframeVisibility} />;
        }
        if (fileType === 'doc' && isOriginalUrlValid) {
            return (
                <div className="w-full h-full flex flex-col items-center justify-center">
                    <iframe src={`https://docs.google.com/gview?url=${encodeURIComponent(originalUrl)}&embedded=true`} title={`Document Preview: ${displayFileName}`} sandbox="allow-scripts allow-same-origin" className="w-full h-full border-none" onLoad={() => setIsOriginalImageLoading(false)} onError={() => { console.error("PreviewModal: Failed to load Google Docs preview.", originalUrl); setIsOriginalImageLoading(false); setHasOriginalLoadFailed(true);}} style={commonIframeVisibility} />
                    {!isOriginalImageLoading && !hasOriginalLoadFailed && <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 absolute bottom-1 left-1/2 -translate-x-1/2 bg-slate-100/70 dark:bg-slate-900/70 px-2 py-0.5 rounded">Preview via Google Docs. <button onClick={handleDownload} className="text-orange-600 dark:text-orange-400 hover:underline ml-1">Download</button></p>}
                    {hasOriginalLoadFailed && <p className="text-sm text-red-500">Google Docs preview failed. Try downloading.</p>}
                </div>
            );
        }
        if (fileType === 'text' && fileInfo.extractedContent) {
            // For text, loading is instant, turn off overall loader if it was on for 'image' type that switched to text
            if (isOriginalImageLoading) useEffect(() => { setIsOriginalImageLoading(false); }, []); 
            return (
                <div className="w-full h-full p-4 overflow-auto bg-white dark:bg-slate-700 rounded border border-slate-200 dark:border-slate-600">
                    <pre className="whitespace-pre-wrap text-sm text-slate-800 dark:text-slate-100 font-mono">{fileInfo.extractedContent}</pre>
                </div>
            );
        }
        
        // Fallback for unavailable previews or invalid URLs for known types
         if (isOriginalImageLoading) useEffect(() => { setIsOriginalImageLoading(false); }, []); // Ensure loader off for fallback
        return (
            <div className="text-center p-10 text-slate-500 dark:text-slate-400">
                <FileIcon className="mx-auto h-16 w-16 text-slate-400 dark:text-slate-500 mb-4" />
                <p className="font-medium">
                    {fileType === 'image' && !isOriginalUrlValid ? 'Image Not Available' : 'Preview Not Available'}
                </p>
                {(hasOriginalLoadFailed && fileType ==='image') && <p className="text-xs text-red-400">Original image failed to load.</p> }
                <p className="text-sm mt-1">({displayFileName})</p>
                {isOriginalUrlValid && <button onClick={handleDownload} className="mt-4 text-sm font-medium text-orange-600 dark:text-orange-400 hover:underline inline-flex items-center gap-1"> <FiDownload className="w-4 h-4" /> Download File </button>}
            </div>
        );
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[999] flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-md"
                    onClick={onClose} // Close on backdrop click
                >
                    <motion.div
                        initial={{ scale: 0.95, y: 10, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} exit={{ scale: 0.95, y: 10, opacity: 0 }}
                        transition={{ duration: 0.2, ease: "circOut" }}
                        className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-4xl lg:max-w-5xl xl:max-w-6xl max-h-[95vh] flex flex-col overflow-hidden border border-slate-300 dark:border-slate-700"
                        onClick={(e) => e.stopPropagation()} // Prevent backdrop click closing modal
                    >
                        {/* Header */}
                        <div className="flex-shrink-0 px-4 py-3 md:px-5 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2.5 min-w-0"> {/* Min width 0 for truncate to work */}
                                <FileIcon className="w-5 h-5 text-orange-500 flex-shrink-0" />
                                <h2 className="text-md md:text-lg font-medium text-slate-700 dark:text-slate-100 truncate" title={displayFileName}>
                                    {displayFileName}
                                </h2>
                            </div>
                            <div className="flex items-center flex-shrink-0 gap-1.5 md:gap-2">
                                {fileType === 'image' && originalUrl && (
                                    <>
                                        <select
                                            value={enhancementModel}
                                            onChange={(e) => setEnhancementModel(e.target.value)}
                                            disabled={isEnhancing}
                                            className="px-2 py-1 text-xs border border-slate-300 dark:border-slate-600 rounded-md bg-slate-50 dark:bg-slate-700 text-slate-700 dark:text-slate-200 focus:ring-1 focus:ring-orange-500 focus:border-orange-500 disabled:opacity-60"
                                        >
                                            {availableModels.map(model => (
                                                <option key={model} value={model}>{model.replace('REAL-ESRGAN ', '')}</option>
                                            ))}
                                        </select>
                                        <button
                                            onClick={handleEnhanceImage}
                                            title={currentEnhancedUrlInModal ? "Re-enhance Image" : "Enhance Image"}
                                            disabled={isEnhancing || isZipping || isSingleDownloading || !originalUrl || hasOriginalLoadFailed}
                                            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium text-purple-600 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-slate-700 focus:outline-none focus:ring-1 focus:ring-purple-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {isEnhancing ? <FiLoader className="w-3.5 h-3.5 animate-spin" /> : (currentEnhancedUrlInModal ? <FiRefreshCw className="w-3.5 h-3.5" /> : <FiZap className="w-3.5 h-3.5" />)}
                                            <span className='hidden sm:inline'>{isEnhancing ? 'Enhancing...' : (currentEnhancedUrlInModal ? 'Re-Enhance' : 'Enhance')}</span>
                                        </button>
                                    </>
                                )}
                                {originalUrl && 
                                    <button
                                        onClick={handleDownload}
                                        title={`Download ${displayFileName}`}
                                        disabled={isZipping || isSingleDownloading || isEnhancing}
                                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium text-orange-600 dark:text-orange-400 hover:bg-orange-100 dark:hover:bg-slate-700 focus:outline-none focus:ring-1 focus:ring-orange-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isSingleDownloading ? <FiLoader className="w-3.5 h-3.5 animate-spin" /> : <FiDownload className="w-3.5 h-3.5" />}
                                        <span className='hidden sm:inline'>{isSingleDownloading ? 'Downloading...' : 'Download'}</span>
                                    </button>
                                }
                                {showDownloadAll && filesList && filesList.length > 1 && (
                                    <button
                                        onClick={handleDownloadAll}
                                        title="Download All Files as ZIP"
                                        disabled={isZipping || isSingleDownloading || isEnhancing}
                                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-slate-700 focus:outline-none focus:ring-1 focus:ring-green-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isZipping ? <FiLoader className="w-3.5 h-3.5 animate-spin" /> : <BsFileZip className="w-3.5 h-3.5" />}
                                        <span className='hidden sm:inline'>{isZipping ? 'Zipping...' : 'Download All'}</span>
                                    </button>
                                )}
                                <button
                                    onClick={onClose} title="Close Preview (Esc)" aria-label="Close Preview"
                                    className="p-1.5 rounded-full text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-600/80 focus:outline-none focus:ring-1 focus:ring-slate-400 transition-colors"
                                > <FiX className="w-4 h-4" /> </button>
                            </div>
                        </div>

                        {/* Status Area */}
                        <AnimatePresence>
                            {operationStatus.type !== 'idle' && (
                                <motion.div
                                    key="operation-status-bar" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                                    className={`flex-shrink-0 px-4 py-1.5 text-xs font-medium flex items-center gap-2 border-b border-slate-200 dark:border-slate-700 ${operationStatus.type === 'error' ? 'bg-red-100 dark:bg-red-700/30 text-red-700 dark:text-red-300' : operationStatus.type === 'success' ? 'bg-green-100 dark:bg-green-700/30 text-green-700 dark:text-green-300' : 'bg-blue-100 dark:bg-blue-700/30 text-blue-700 dark:text-blue-300'}`}
                                >
                                    {operationStatus.type === 'loading' && <FiLoader className="w-3.5 h-3.5 animate-spin flex-shrink-0" />}
                                    {operationStatus.type === 'success' && <FiCheckCircle className="w-3.5 h-3.5 flex-shrink-0" />}
                                    {operationStatus.type === 'error' && <FiAlertCircle className="w-3.5 h-3.5 flex-shrink-0" />}
                                    <span>{operationStatus.message}</span>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Preview Content Area - This div will grow and shrink */}
                        <div className="flex-1 min-h-0 p-2 sm:p-3 overflow-hidden flex items-center justify-center bg-slate-100 dark:bg-slate-900/70 relative">
                           {/* Inner wrapper for centering and ensuring images don't exceed this block */}
                           <div className="w-full h-full flex items-center justify-center">
                                {showOverallLoader && fileType !== 'text' && (
                                     <div className="absolute inset-0 flex items-center justify-center bg-slate-100/50 dark:bg-slate-900/50 z-10"> {/* z-10 so it's above content but below modal controls */}
                                        <FiLoader className="w-8 h-8 text-orange-500 animate-spin" />
                                    </div>
                                )}
                                {renderPreviewContent()}
                           </div>
                        </div>

                        {/* Footer & Pagination */}
                        {totalPages > 1 && (
                            <div className="flex-shrink-0 px-4 py-2 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
                                <button onClick={onPrev} disabled={currentPage === 0 || isZipping || isSingleDownloading || isEnhancing} className="flex items-center gap-1 px-2.5 py-1 rounded-md text-orange-600 dark:text-orange-400 hover:bg-orange-100 dark:hover:bg-slate-700 disabled:opacity-50"> <FiChevronLeft className="w-4 h-4" /> Prev </button>
                                <span className="font-medium text-slate-600 dark:text-slate-300">{currentPage + 1} / {totalPages}</span>
                                <button onClick={onNext} disabled={currentPage >= totalPages - 1 || isZipping || isSingleDownloading || isEnhancing} className="flex items-center gap-1 px-2.5 py-1 rounded-md text-orange-600 dark:text-orange-400 hover:bg-orange-100 dark:hover:bg-slate-700 disabled:opacity-50"> Next <FiChevronRight className="w-4 h-4" /> </button>
                            </div>
                        )}
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default PreviewModal;