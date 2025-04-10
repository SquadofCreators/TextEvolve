// src/pages/ExtractionResultsPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { batchService } from '../services/batchService'; // Use NEW service
import PageHeader from '../components/utility/PageHeader'; // Assuming exists
import MetaText from '../components/utility/MetaText'; // Assuming exists

// Icons
import { FiLoader, FiAlertTriangle, FiDownload, FiFileText, FiCheckCircle, FiPercent, FiTarget, FiTrendingDown, FiEye, FiInfo } from 'react-icons/fi';
import { LuCalendarDays } from "react-icons/lu";
import { MdFolderOpen } from "react-icons/md";

// --- Helper Functions (Import from utils or define here) ---

// Format bytes
const formatBytes = (bytes, decimals = 2) => {
  if (typeof bytes === 'string') {
    try { bytes = BigInt(bytes); } catch (e) { return 'N/A'; }
  }
  if (bytes === undefined || bytes === null || bytes < 0n) return 'N/A';
  if (bytes === 0n) return '0 Bytes';
  const k = 1024n;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  let i = 0;
  let size = bytes;
  while (size >= k && i < sizes.length - 1) {
    size /= k; i++;
  }
  const numSize = Number(bytes) / Number(k ** BigInt(i));
  return parseFloat(numSize.toFixed(dm)) + ' ' + sizes[i];
}

// Format ISO date string
const formatDate = (isoString) => {
  if (!isoString) return 'N/A';
  try {
    return new Date(isoString).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
  } catch (e) { return 'Invalid Date'; }
}

// Derive Backend Host URL
const getBackendHostUrl = () => {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    try { return new URL(apiUrl).origin; } catch (e) { return 'http://localhost:5000'; }
}
const BACKEND_HOST_URL = getBackendHostUrl();

// Construct full file URL
const getFileUrl = (storageKey) => {
    if (!storageKey) return null;
    const cleanStorageKey = storageKey.startsWith('/') ? storageKey.substring(1) : storageKey;
    return `${BACKEND_HOST_URL}/uploads/${cleanStorageKey}`;
}

// Format Metric (e.g., Accuracy, Precision) as Percentage
const formatMetric = (value, decimals = 1) => {
    if (value === null || value === undefined) return null; // Return null if not available
    const percentage = Number(value) * 100;
    // Avoid showing .0 for whole numbers
    return `${percentage % 1 === 0 ? percentage.toFixed(0) : percentage.toFixed(decimals)}%`;
};

// Format Loss Metric
const formatLoss = (value, decimals = 4) => {
     if (value === null || value === undefined) return null;
     return Number(value).toFixed(decimals);
}


// --- Component ---

const ExtractionResultsPage = () => {
  const { batchId } = useParams();
  const navigate = useNavigate();

  // State
  const [batch, setBatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // --- Data Fetching ---
  const fetchBatchResults = useCallback(async () => {
    if (!batchId) {
        setError("No Batch ID provided.");
        setLoading(false);
        return;
    }
    setLoading(true);
    setError("");
    try {
      // Fetch batch data including documents and results
      const data = await batchService.getBatchById(batchId);
      // Basic check if data structure is as expected
      if (!data || !data.id) {
          throw new Error("Received invalid batch data structure.");
      }
      setBatch(data);
    } catch (err) {
      console.error("Error fetching batch results:", err);
      setError(err.message || "Failed to load batch results.");
      if (err.status === 404) {
          setError(`Batch with ID ${batchId} not found.`);
      } else if (err.status === 401 || err.status === 403) {
           setError("You are not authorized to view these results. Please log in.");
           // Consider redirecting: // navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  }, [batchId]); // Re-fetch if batchId changes

  useEffect(() => {
    fetchBatchResults();
  }, [fetchBatchResults]);

  // --- Download Handlers ---

  // Download text content as a .txt file
  const handleDownloadText = (textContent, filename) => {
    if (textContent === null || textContent === undefined) {
        alert("No text content available to download.");
        return;
    }
    try {
        const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename || `extracted_text_${batchId}.txt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    } catch (downloadError) {
         console.error("Error creating download blob:", downloadError);
         alert("Could not prepare the file for download.");
    }
  };

  // --- Render Logic ---

  if (loading) {
    return (
      <div className="flex-1 p-6 h-full overflow-y-auto bg-gray-100 dark:bg-gray-800 rounded-lg">
        <div className='flex flex-col items-center justify-center h-full'>
          <FiLoader className="animate-spin h-10 w-10 text-orange-500 mb-4" />
          <p className="text-gray-500 dark:text-gray-400">Loading extraction results...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 p-6 h-full overflow-y-auto bg-gray-100 dark:bg-gray-800 rounded-lg">
         <FiAlertTriangle className="h-12 w-12 text-red-500 mb-4" />
         <p className="text-red-600 dark:text-red-400 font-semibold mb-2">Error Loading Results</p>
         <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
         <button
            onClick={() => navigate(-1)} // Go back
            className="px-5 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition"
         >
            Go Back
         </button>
      </div>
    );
  }

   if (!batch) {
      return (
         <div className="flex-1 p-6 h-full overflow-y-auto bg-gray-100 dark:bg-gray-800 rounded-lg">
            <p className="text-gray-500 dark:text-gray-400">Batch data could not be loaded.</p>
         </div>
      );
   }

   // Check Batch Status
   if (batch.status !== 'COMPLETED' && batch.status !== 'FAILED') {
       return (
         <div className="flex-1 p-6 h-full overflow-y-auto bg-gray-100 dark:bg-gray-800 rounded-lg">
             <FiInfo className="h-12 w-12 text-orange-500 mb-4" />
             <p className="text-orange-600 dark:text-orange-400 font-semibold mb-2">Extraction Not Complete</p>
             <p className="text-gray-600 dark:text-gray-400 mb-6">
                 The text extraction process for batch "{batch.name}" is currently in status:
                 <strong className="ml-1">{batch.status || 'UNKNOWN'}</strong>.
                 <br/> Please wait for it to complete before viewing results.
             </p>
             <button
                onClick={() => navigate(`/batch/${batchId}`)} // Go to batch details
                className="px-5 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition"
             >
                View Batch Details
             </button>
         </div>
       );
   }

   // --- Main Results Display ---
  return (
    <div className="flex-1 p-6 h-full overflow-y-auto bg-gray-100 dark:bg-gray-800 rounded-lg">
      <PageHeader title="Extraction Results" showBackArrow={true} backPath={`/batch/${batchId}`} />

      {/* Batch Info Header */}
      <div className="mb-6 p-4 bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
         <h2 className="text-xl md:text-2xl font-semibold text-gray-800 dark:text-gray-100 mb-2 break-words">
             {batch.name || `Batch ${batch.id}`}
         </h2>
         <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-gray-500 dark:text-gray-400">
            <span>ID: <span className="font-medium text-gray-700 dark:text-gray-300">{batch.id}</span></span>
            <span>Files: <span className="font-medium text-gray-700 dark:text-gray-300">{batch.totalFileCount ?? 0}</span></span>
            <span>Completed: <span className="font-medium text-gray-700 dark:text-gray-300">{formatDate(batch.updatedAt)}</span></span>
         </div>
      </div>

      {/* Handle Failed Extraction State */}
       {batch.status === 'FAILED' && (
           <div className="mb-6 p-4 rounded-md bg-red-50 dark:bg-red-900/30 border border-red-300 dark:border-red-700 text-center">
                <p className="text-sm text-red-600 dark:text-red-300 flex items-center justify-center gap-2">
                    <FiAlertTriangle/> Text extraction failed for this batch. Check individual document statuses or logs for details.
                </p>
            </div>
       )}

       {/* Overall Metrics (Only show if COMPLETED and metrics exist) */}
        {batch.status === 'COMPLETED' && (batch.accuracy !== null || batch.precision !== null || batch.loss !== null) && (
            <div className="mb-6 p-4 bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-3">Overall Batch Metrics</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                    {formatMetric(batch.accuracy) ? (
                        <div className="p-3 bg-green-50 dark:bg-green-900/30 rounded-md border border-green-200 dark:border-green-700">
                            <FiTarget className="mx-auto h-6 w-6 text-green-500 mb-1"/>
                            <p className="text-xs text-green-700 dark:text-green-300 font-medium">Accuracy</p>
                            <p className="text-xl font-bold text-green-600 dark:text-green-200">{formatMetric(batch.accuracy)}</p>
                        </div>
                    ) : <div className="p-3 text-xs text-gray-400 italic">Accuracy N/A</div>}
                    {formatMetric(batch.precision) ? (
                        <div className="p-3 bg-orange-50 dark:bg-orange-900/30 rounded-md border border-orange-200 dark:border-orange-700">
                            <FiCheckCircle className="mx-auto h-6 w-6 text-orange-500 mb-1"/>
                            <p className="text-xs text-orange-700 dark:text-orange-300 font-medium">Precision</p>
                            <p className="text-xl font-bold text-orange-600 dark:text-orange-200">{formatMetric(batch.precision)}</p>
                        </div>
                     ) : <div className="p-3 text-xs text-gray-400 italic">Precision N/A</div>}
                     {formatLoss(batch.loss) ? (
                         <div className="p-3 bg-yellow-50 dark:bg-yellow-900/30 rounded-md border border-yellow-200 dark:border-yellow-700">
                            <FiTrendingDown className="mx-auto h-6 w-6 text-yellow-500 mb-1"/>
                            <p className="text-xs text-yellow-700 dark:text-yellow-300 font-medium">Loss</p>
                            <p className="text-xl font-bold text-yellow-600 dark:text-yellow-200">{formatLoss(batch.loss)}</p>
                        </div>
                     ) : <div className="p-3 text-xs text-gray-400 italic">Loss N/A</div>}
                </div>
            </div>
        )}


      {/* Aggregated Text Section (Only show if COMPLETED) */}
       {batch.status === 'COMPLETED' && (
            <div className="mb-6 bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="p-4 flex justify-between items-center border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200">Aggregated Extracted Text</h3>
                    <button
                        onClick={() => handleDownloadText(batch.extractedContent, `batch_aggregated_${batchId}.txt`)}
                        disabled={!batch.extractedContent}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-600 text-white text-xs font-medium rounded-md hover:bg-orange-700 transition disabled:opacity-50"
                        title={!batch.extractedContent ? "No aggregated text available" : "Download aggregated text"}
                    >
                        <FiDownload size={14}/> Download (.txt)
                    </button>
                </div>
                <div className="p-4 max-h-80 overflow-y-auto bg-gray-50 dark:bg-gray-900/50">
                    {batch.extractedContent ? (
                         <pre className="whitespace-pre-wrap break-words text-sm text-gray-700 dark:text-gray-300 font-mono">
                            {batch.extractedContent}
                         </pre>
                    ) : (
                         <p className="text-sm text-gray-500 dark:text-gray-400 italic text-center py-5">
                            No aggregated text content available for this batch.
                         </p>
                    )}
                </div>
            </div>
       )}


      {/* Individual Document Results Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 p-4 border-b border-gray-200 dark:border-gray-700">
            Individual Document Results ({batch.documents?.length ?? 0})
        </h3>
        {batch.documents && batch.documents.length > 0 ? (
          <ul className="divide-y divide-gray-100 dark:divide-gray-700">
            {batch.documents.map((doc) => {
              const docAccuracy = formatMetric(doc.accuracy);
              const docPrecision = formatMetric(doc.precision);
              const docStatusColor = doc.status === 'COMPLETED' ? 'text-green-500' : doc.status === 'FAILED' ? 'text-red-500' : 'text-yellow-500';
              const originalFileUrl = getFileUrl(doc.storageKey);

              return (
                <li key={doc.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                        {/* Left side: Filename and basic info */}
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate" title={doc.fileName}>
                                {doc.fileName || `Document ${doc.id.substring(0,6)}...`}
                            </p>
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500 dark:text-gray-400 mt-1">
                               <span>Status: <strong className={docStatusColor}>{doc.status}</strong></span>
                               {docAccuracy && <span>Acc: <strong className="text-gray-700 dark:text-gray-300">{docAccuracy}</strong></span>}
                               {docPrecision && <span>Prec: <strong className="text-gray-700 dark:text-gray-300">{docPrecision}</strong></span>}
                            </div>
                        </div>
                         {/* Right side: Actions */}
                         <div className="flex-shrink-0 flex items-center gap-2 mt-2 sm:mt-0">
                             {originalFileUrl && (
                                <a href={originalFileUrl} target="_blank" rel="noopener noreferrer" title="View Original File" className="p-1.5 text-orange-600 hover:bg-orange-100 dark:text-orange-400 dark:hover:bg-orange-900/50 rounded-md transition-colors">
                                    <FiEye size={16}/>
                                </a>
                             )}
                             <button
                                onClick={() => handleDownloadText(doc.extractedContent, `${doc.fileName || doc.id}_extracted.txt`)}
                                disabled={!doc.extractedContent || doc.status !== 'COMPLETED'}
                                className="p-1.5 text-orange-600 hover:bg-orange-100 dark:text-orange-400 dark:hover:bg-orange-900/50 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                title={!doc.extractedContent ? "No extracted text" : "Download Extracted Text"}
                            >
                                <FiFileText size={16}/>
                            </button>
                         </div>
                    </div>
                     {/* Optionally show individual extracted text snippet here if needed */}
                     {/* {doc.extractedContent && (
                        <div className="mt-2 p-2 bg-gray-50 dark:bg-gray-700 rounded max-h-20 overflow-hidden relative group">
                            <pre className="text-xs text-gray-600 dark:text-gray-300 whitespace-pre-wrap break-words font-mono">{doc.extractedContent}</pre>
                            <div className="absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-gray-50 dark:from-gray-700 to-transparent group-hover:hidden"></div>
                        </div>
                     )} */}
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="text-center text-sm text-gray-500 dark:text-gray-400 p-6 italic">
            No individual document details available for this batch.
          </p>
        )}
      </div>
    </div>
  );
};

export default ExtractionResultsPage;