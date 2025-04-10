// src/pages/ExtractionResultsPage.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { batchService } from '../services/batchService'; 
import PageHeader from '../components/utility/PageHeader'; 
import MetaText from '../components/utility/MetaText'; 
import { RiCharacterRecognitionLine } from "react-icons/ri"; 

// Icons
import { FiLoader, FiAlertTriangle, FiDownload, FiFileText, FiCheckCircle, FiPercent, FiTarget, FiEye, FiInfo } from 'react-icons/fi';
import { LuCalendarDays, LuType, LuFileClock } from "react-icons/lu"; // Replaced Clock/Storage icons
import { MdFolderOpen } from "react-icons/md";
import { FaHashtag, FaFilePdf, FaFileWord } from "react-icons/fa6";

import jsPDF from 'jspdf';
import { Document, Packer, Paragraph, TextRun } from 'docx';
import { saveAs } from 'file-saver'; 

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

    // --- Download PDF ---
    const handleDownloadPdf = (textContent, filename) => {
      if (textContent === null || textContent === undefined) { alert("No text content available."); return; }
      try {
          const pdf = new jsPDF(); // Default: Portrait, pt, A4
          const pageHeight = pdf.internal.pageSize.height || pdf.internal.pageSize.getHeight();
          const pageWidth = pdf.internal.pageSize.width || pdf.internal.pageSize.getWidth();
          const margin = 20; // Define margin
          const maxLineWidth = pageWidth - margin * 2;
          let y = margin; // Start position

          pdf.setFontSize(11); // Set font size

          // Split text into lines that fit the page width
          const lines = pdf.splitTextToSize(textContent, maxLineWidth);

          lines.forEach(line => {
              if (y + 10 > pageHeight - margin) { // Check if new line exceeds page height
                  pdf.addPage(); // Add a new page
                  y = margin; // Reset y position
              }
              pdf.text(line, margin, y);
              y += 7; // Move cursor down (adjust line height as needed)
          });

          pdf.save(filename || `batch_results_${batchId}.pdf`);
      } catch (pdfError) {
          console.error("Error generating PDF:", pdfError);
          alert("Could not generate PDF file.");
      }
  };

  // --- Download DOCX ---
  const handleDownloadDocx = async (textContent, filename) => {
      if (textContent === null || textContent === undefined) { alert("No text content available."); return; }
      try {
          // Split content into paragraphs based on newline characters
          const paragraphs = textContent.split('\n').map(line =>
              new Paragraph({
                  children: [new TextRun(line)],
              })
          );

          const doc = new Document({
              sections: [{
                  properties: {}, // Default page setup
                  children: paragraphs,
              }],
          });

          // Use Packer to generate blob
          const blob = await Packer.toBlob(doc);
          // Use file-saver to trigger download
          saveAs(blob, filename || `batch_results_${batchId}.docx`);

      } catch (docxError) {
          console.error("Error generating DOCX:", docxError);
          alert("Could not generate DOCX file.");
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

      {/* Batch Info Header  */}
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
        {batch.status === 'COMPLETED' && (
          <div className="mb-6 p-4 bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-3">Overall Batch Summary</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                {/* Accuracy */}
                {formatMetric(batch.accuracy) !== null ? (
                    <div className="p-3 bg-green-50 dark:bg-green-900/30 rounded-md border border-green-200 dark:border-green-700">
                        <FiTarget className="mx-auto h-6 w-6 text-green-500 mb-1"/>
                        <p className="text-xs text-green-700 dark:text-green-300 font-medium">Accuracy</p>
                        <p className="text-xl font-bold text-green-600 dark:text-green-200">{formatMetric(batch.accuracy)}</p>
                    </div>
                ) : <div className="p-3 text-xs text-gray-400 italic flex items-center justify-center">Accuracy N/A</div>}

                {/* Word Count (NEW) */}
                {(batch.totalWordCount !== null && batch.totalWordCount !== undefined) ? (
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-md border border-blue-200 dark:border-blue-700"> <FiFileText className="mx-auto h-6 w-6 text-blue-500 mb-1"/> <p className="text-xs text-blue-700 dark:text-blue-300 font-medium">Total Words</p> <p className="text-xl font-bold text-blue-600 dark:text-blue-200">{batch.totalWordCount.toLocaleString()}</p> </div>
                ) : <div className="p-3 ... italic">Word Count N/A</div>}

                {/* Character Count (NEW) */}
                {(batch.totalCharacterCount !== null && batch.totalCharacterCount !== undefined) ? (
                      <div className="p-3 bg-purple-50 dark:bg-purple-900/30 rounded-md border border-purple-200 dark:border-purple-700"> <RiCharacterRecognitionLine className="mx-auto h-6 w-6 text-purple-500 mb-1"/> <p className="text-xs text-purple-700 dark:text-purple-300 font-medium">Total Characters</p> <p className="text-xl font-bold text-purple-600 dark:text-purple-200">{batch.totalCharacterCount.toLocaleString()}</p> </div>
                ) : <div className="p-3 ... italic">Character Count N/A</div>}
            </div>
          </div>
        )}


      {/* Aggregated Text Section (Only show if COMPLETED) */}
      {batch.status === 'COMPLETED' && (
        <div className="mb-6 bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200">Aggregated Extracted Text</h3>
                {/* --- Download Buttons --- */}
                <div className="flex flex-wrap gap-2">
                      <button onClick={() => handleDownloadText(batch.extractedContent, `batch_${batchId}_aggregated.txt`)} disabled={!batch.extractedContent} className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-600 text-white text-xs font-medium rounded-md hover:bg-gray-700 transition disabled:opacity-50" title={!batch.extractedContent ? "No text available" : "Download as TXT"} > <FiFileText size={14}/> TXT </button>
                      <button onClick={() => handleDownloadPdf(batch.extractedContent, `batch_${batchId}_aggregated.pdf`)} disabled={!batch.extractedContent} className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 text-white text-xs font-medium rounded-md hover:bg-red-700 transition disabled:opacity-50" title={!batch.extractedContent ? "No text available" : "Download as PDF"} > <FaFilePdf size={14}/> PDF </button>
                      <button onClick={() => handleDownloadDocx(batch.extractedContent, `batch_${batchId}_aggregated.docx`)} disabled={!batch.extractedContent} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-md hover:bg-blue-700 transition disabled:opacity-50" title={!batch.extractedContent ? "No text available" : "Download as DOCX"} > <FaFileWord size={14}/> DOCX </button>
                </div>
                  {/* ----------------------- */}
            </div>
            <div className="p-4 max-h-80 overflow-y-auto bg-gray-50 dark:bg-gray-900/50">
                  {batch.extractedContent ? ( <pre className="whitespace-pre-wrap break-words text-sm text-gray-700 dark:text-gray-300 font-mono"> {batch.extractedContent} </pre> )
                  : ( <p className="text-sm text-gray-500 dark:text-gray-400 italic text-center py-5"> No aggregated text content available for this batch. </p> )}
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
              const docWordCount = doc.wordCount ? doc.wordCount.toLocaleString() : 'N/A';
              const docCharacterCount = doc.characterCount ? doc.characterCount.toLocaleString() : 'N/A';
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
                                {docWordCount && <span>Words: <strong className="text-gray-700 dark:text-gray-300">{docWordCount}</strong></span>}
                                {docCharacterCount && <span>Chars: <strong className="text-gray-700 dark:text-gray-300">{docCharacterCount}</strong></span>}
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