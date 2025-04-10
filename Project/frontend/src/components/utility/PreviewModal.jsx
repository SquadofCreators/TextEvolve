import React, { useState, useEffect } from 'react';
import { FiX, FiChevronLeft, FiChevronRight, FiDownload, FiAlertCircle, FiFile } from 'react-icons/fi';
import JSZip from 'jszip'; // Ensure installed: npm install jszip
import { BsFileZip } from "react-icons/bs";
import { batchService } from '../../services/batchService';


// Helper function to trigger browser download from a Blob
const triggerBlobDownload = (blob, filename) => { /* ... as before ... */
  const url = window.URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.setAttribute('download', filename); document.body.appendChild(link); link.click(); document.body.removeChild(link); window.URL.revokeObjectURL(url);
};


const PreviewModal = ({
  isOpen, onClose, file, currentPage, totalPages, onPrev, onNext, filesList, showDownloadAll = true,
}) => {

  const [isZipping, setIsZipping] = useState(false); // Loading state for zip download

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape') onClose();
    };
    if (isOpen) document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen || !file) return null;

  // Determine File Type (Prioritize mimeType)
  const getFileType = (fileObj) => {
    const mime = fileObj?.mimeType || '';
    const name = fileObj?.name || fileObj?.fileName || '';
    const ext = name.split('.').pop()?.toLowerCase() || '';

    if (mime.startsWith('image/')) return 'image';
    if (mime === 'application/pdf') return 'pdf';
    if (mime.includes('wordprocessingml') || mime.includes('msword') || ['doc', 'docx'].includes(ext)) return 'doc';
    if (mime.startsWith('text/') || ext === 'txt') return 'text';
    if (['png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp'].includes(ext)) return 'image';
    if (ext === 'pdf') return 'pdf';

    return 'unknown';
  };

  const fileType = getFileType(file);
  // Use URLs directly from the file prop, assuming parent constructed them correctly
  const previewUrl = file.preview_url;
  const downloadUrl = file.download_url || previewUrl;
  const displayFileName = file.name || file.fileName || `file_${file.id?.substring(0, 6) ?? 'unknown'}`;

  // --- Action Handlers ---
  const handleDownload = () => {
    if (!downloadUrl) {
      alert('No download URL available for this file.');
      return;
    }
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = displayFileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // handleDownloadAll - UPDATED to use batchService
  const handleDownloadAll = async () => {
    if (!filesList || filesList.length === 0) { alert('No files available.'); return; }
    if (isZipping) return; // Prevent concurrent zipping

    setIsZipping(true); // Set loading state
    setPreviewError(null); // Clear previous errors if displaying them
    console.log("Starting Download All via Blob Service...");
    // User feedback - maybe use a less intrusive method than alert later
    // alert("Preparing ZIP file... This may take a moment.");

    const zip = new JSZip();
    const folderName = file.batchName || "Documents"; // Requires batchName passed in file prop
    const folder = zip.folder(folderName);
    let failedFiles = [];

    // Use Promise.allSettled to attempt downloading all blobs via the service
    const downloadPromises = filesList.map(async (fileObj) => {
        const filenameToUse = fileObj.name || fileObj.fileName || `file_${fileObj.id}`;
        // Make sure each fileObj in filesList has batchId and id
        if (!fileObj.batchId || !fileObj.id) {
            console.warn(`Skipping ${filenameToUse}: Missing batchId or docId.`);
            failedFiles.push(`${filenameToUse} (Missing ID)`);
            return Promise.resolve(); // Resolve promise for this file
        }
        try {
            const blob = await batchService.downloadDocumentBlob(fileObj.batchId, fileObj.id);
            folder.file(filenameToUse, blob);
            console.log(`Added ${filenameToUse} to zip.`);
        } catch (error) {
            console.error(`Error fetching blob for ${filenameToUse}:`, error);
            failedFiles.push(`${filenameToUse} (${error.message || 'Fetch Failed'})`);
        }
    });

    await Promise.allSettled(downloadPromises);
    console.log("Blob fetching complete. Generating zip...");

    if (Object.keys(folder.files).length === 0) {
        alert("Failed to fetch any files for the ZIP archive. Please check console for errors.");
        setIsZipping(false);
        return;
    }

    try {
        const content = await zip.generateAsync({ type: 'blob' }, (metadata) => {
             // Optional: Update progress state here if needed
             // console.log("Zipping progress: " + metadata.percent.toFixed(2) + " %");
        });
        const zipFilename = `${folderName.replace(/ /g, '_')}_${new Date().toISOString().split('T')[0]}.zip`;
        triggerBlobDownload(content, zipFilename); // Use helper
        console.log("Zip download triggered.");
        if (failedFiles.length > 0) {
            // Use a less intrusive notification method ideally
            alert(`ZIP download started. Failed to include ${failedFiles.length} file(s):\n- ${failedFiles.join('\n- ')}`);
        }
    } catch (zipError) {
         console.error("Error generating zip file:", zipError);
         alert("Failed to generate the ZIP file.");
    } finally {
         setIsZipping(false); // Reset loading state
    }
  };


  // --- Render ---
  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-2 md:p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      {/* Modal Container */}
      <div className="relative z-[1000] bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl h-auto max-h-[95vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex-shrink-0 p-4 md:p-5 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between gap-2">
           <h2 className="text-lg md:text-xl font-semibold text-gray-800 dark:text-gray-100 truncate" title={displayFileName}>
             {displayFileName}
           </h2>
           {/* Action Buttons */}
           <div className="flex items-center flex-shrink-0 gap-2 md:gap-3">
                <button onClick={handleDownload} title="Download File" disabled={!downloadUrl} className="flex items-center gap-1.5 text-orange-600 hover:text-white dark:text-orange-400 dark:hover:text-white hover:bg-orange-600 dark:hover:bg-orange-500 px-2 py-1.5 rounded-md transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed text-sm"><FiDownload className="w-4 h-4" /><span className='hidden md:inline'>Download</span></button>
                {showDownloadAll && filesList && filesList.length > 1 && (<button onClick={handleDownloadAll} title="Download All as Zip" className="flex items-center gap-1.5 text-green-600 hover:text-white dark:text-green-400 dark:hover:text-white hover:bg-green-600 dark:hover:bg-green-500 px-2 py-1.5 rounded-md transition-colors cursor-pointer text-sm"><BsFileZip className="w-4 h-4" /><span className='hidden md:inline'>Download All (.zip)</span></button>)}
                <button onClick={onClose} title="Close Preview (Esc)" className="text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full p-1.5 transition-colors cursor-pointer"><FiX className="w-5 h-5" /></button>
           </div>
        </div>

        {/* Preview Area */}
        <div className="p-2 md:p-4 flex-1 overflow-auto flex items-center justify-center bg-gray-100 dark:bg-gray-900 min-h-[50vh]">
          {!previewUrl ? (
             <div className="text-center p-10"> <FiAlertCircle className="mx-auto h-12 w-12 text-yellow-500 mb-4" /> <p className="text-gray-600 dark:text-gray-400">No preview URL available.</p> </div>
          ) : fileType === 'image' ? (
              <img src={previewUrl} alt={displayFileName} crossOrigin="anonymous" className="max-w-2xl w-full object-contain rounded shadow-md"/>
          ) : fileType === 'pdf' ? (
              // Added title attribute for accessibility
              <iframe src={previewUrl} crossOrigin="anonymous" className="w-full max-w-full rounded border-none" title={`PDF Preview: ${displayFileName}`}/>
          ) : fileType === 'doc' ? (
               <div className="text-center p-6 bg-yellow-50 dark:bg-yellow-900/30 rounded-md border border-yellow-200 dark:border-yellow-700">
                  <FiAlertCircle className="mx-auto h-8 w-8 text-yellow-600 dark:text-yellow-400 mb-3" />
                  <p className="text-sm text-yellow-800 dark:text-yellow-200 mb-2"> Direct preview for Word documents requires the file to be publicly accessible by Google and may be unreliable. </p>
                  <iframe src={`https://docs.google.com/gview?url=${encodeURIComponent(previewUrl)}&embedded=true`} crossOrigin="anonymous" className="w-full h-[60vh] rounded border mt-2" title={`Document Preview: ${displayFileName}`} sandbox="allow-scripts allow-same-origin"/>
                  <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-2">If preview fails, please use the Download button.</p>
               </div>
          ) : fileType === 'text' ? (
               <div className="w-full h-full max-h-[75vh] p-4 overflow-y-auto bg-white dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600">
                 <pre className="whitespace-pre-wrap text-sm text-gray-800 dark:text-gray-200 font-mono">
                     {(file.extracted_content !== null && file.extracted_content !== undefined && file.extracted_content !== '') ? file.extracted_content : <span className="italic text-gray-500 dark:text-gray-400">No text content available for preview.</span>}
                 </pre>
               </div>
          ) : (
               <div className="text-center p-10"> <FiFile className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500 mb-4" /> <p className="text-gray-600 dark:text-gray-400">Preview not available for this file type.</p> <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">({displayFileName})</p> <button onClick={handleDownload} className="mt-4 text-sm text-orange-600 dark:text-orange-400 hover:underline"> Download File </button> </div>
          )}
        </div>

        {/* Footer & Pagination */}
        {totalPages > 1 && (
           <div className="flex-shrink-0 p-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between text-sm">
             <button onClick={onPrev} disabled={currentPage === 0} className="flex items-center gap-1 text-orange-600 dark:text-orange-400 hover:underline disabled:opacity-50 disabled:cursor-not-allowed"><FiChevronLeft className="w-4 h-4" />Previous</button>
             <span className="text-gray-500 dark:text-gray-400">{currentPage + 1} / {totalPages}</span>
             <button onClick={onNext} disabled={currentPage >= totalPages - 1} className="flex items-center gap-1 text-orange-600 dark:text-orange-400 hover:underline disabled:opacity-50 disabled:cursor-not-allowed">Next<FiChevronRight className="w-4 h-4" /></button>
           </div>
        )}
      </div>
    </div>
  );
};

export default PreviewModal;
