// src/pages/ExtractionResultsPage.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { batchService } from '../services/batchService';
// --- Import the new service ---
import { textEnhanceService } from '../services/textEnhanceService';
import PageHeader from '../components/utility/PageHeader';
// MetaText might not be used here anymore, remove if confirmed unused
// import MetaText from '../components/utility/MetaText';
import { RiCharacterRecognitionLine } from "react-icons/ri";
import { TbSparkles } from "react-icons/tb"; // Icon for enhance button

// Icons
import { FiLoader, FiAlertTriangle, FiFileText, FiCheckCircle, FiEye, FiInfo } from 'react-icons/fi';
import { LuCalendarDays, LuFileClock } from "react-icons/lu";
import { MdFolderOpen } from "react-icons/md";
import { FaHashtag, FaFilePdf, FaFileWord } from "react-icons/fa6";

// Download Libraries
import jsPDF from 'jspdf';
import { Document, Packer, Paragraph, TextRun } from 'docx';
import { saveAs } from 'file-saver';

// --- Helper Functions (Keep as they are) ---

const formatBytes = (bytes, decimals = 2) => {
  if (typeof bytes === 'string') { try { bytes = BigInt(bytes); } catch (e) { return 'N/A'; } }
  if (bytes === undefined || bytes === null || bytes < 0n) return 'N/A';
  if (bytes === 0n) return '0 Bytes';
  const k = 1024n;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  let i = 0;
  let size = bytes;
  while (size >= k && i < sizes.length - 1) { size /= k; i++; }
  const numSize = Number(bytes) / Number(k ** BigInt(i));
  return parseFloat(numSize.toFixed(dm)) + ' ' + sizes[i];
}

const formatDate = (isoString) => {
  if (!isoString) return 'N/A';
  try {
    return new Date(isoString).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
  } catch (e) { return 'Invalid Date'; }
}

const getFileUrl = (storageKey) => {
    if (!storageKey || typeof storageKey !== 'string') return null;
    const apiOrigin = import.meta.env.VITE_API_URL ? new URL(import.meta.env.VITE_API_URL).origin : 'http://localhost:5000';
    const uploadsBase = import.meta.env.VITE_API_URL_IMAGE_BASE || `${apiOrigin}/uploads`;
    const normalizedStorageKey = storageKey.replace(/\\/g, "/");
    const cleanStorageKey = normalizedStorageKey.startsWith('/') ? normalizedStorageKey.substring(1) : normalizedStorageKey;
    return `${uploadsBase.replace(/\/$/, '')}/${cleanStorageKey}`;
}

const formatMetric = (value, decimals = 1) => {
    if (value === null || value === undefined) return null;
    const percentage = Number(value) * 100;
    return `${percentage % 1 === 0 ? percentage.toFixed(0) : percentage.toFixed(decimals)}%`;
};

// --- Sub-Component for Individual Document Results (Keep as is) ---

const DocumentResultItem = React.memo(({ doc, onDownloadText }) => {
    const docAccuracy = formatMetric(doc.accuracy);
    const docWordCount = doc.wordCount ? doc.wordCount.toLocaleString() : null;
    const docCharacterCount = doc.characterCount ? doc.characterCount.toLocaleString() : null;
    const docStatusColor = doc.status === 'COMPLETED' ? 'text-green-500' : doc.status === 'FAILED' ? 'text-red-500' : 'text-yellow-500';
    const originalFileUrl = getFileUrl(doc.storageKey);
    const canDownload = doc.extractedContent !== null && doc.extractedContent !== undefined && doc.status === 'COMPLETED';

    return (
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
                    {originalFileUrl && (
                        <a href={originalFileUrl} target="_blank" rel="noopener noreferrer" title="View Original File" className="p-1.5 text-gray-500 hover:text-orange-600 dark:text-gray-400 dark:hover:text-orange-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors">
                            <FiEye size={16}/>
                        </a>
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
    );
});


// --- Main Component ---

const ExtractionResultsPage = () => {
  const { batchId } = useParams();
  const navigate = useNavigate();

  // Core State
  const [batch, setBatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // --- State for Text Enhancement ---
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [enhanceError, setEnhanceError] = useState(null);
  const [enhancedAggregatedText, setEnhancedAggregatedText] = useState(null);

  // --- Data Fetching ---
  const fetchBatchResults = useCallback(async () => {
    if (!batchId) {
      setError("No Batch ID provided.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    // Reset enhance state on fetch
    setEnhancedAggregatedText(null);
    setEnhanceError(null);
    setIsEnhancing(false);
    try {
      const data = await batchService.getBatchById(batchId);
      if (!data || !data.id) throw new Error("Received invalid batch data structure.");
      setBatch(data);
    } catch (err) {
      console.error("Error fetching batch results:", err);
      let specificError = err.message || "Failed to load batch results.";
      if (err.status === 404) specificError = `Batch with ID ${batchId} not found.`;
      else if (err.status === 401 || err.status === 403) specificError = "You are not authorized to view these results.";
      setError(specificError);
    } finally {
      setLoading(false);
    }
  }, [batchId]);

  useEffect(() => {
    fetchBatchResults();
  }, [fetchBatchResults]);

  // --- Download Handlers (Keep as is, defined above component) ---
  const handleDownloadText = useCallback((textContent, filename) => {
    if (textContent === null || textContent === undefined) { alert("No text content available."); return; }
    try {
      const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
      saveAs(blob, filename || `extracted_text_${batchId}.txt`);
    } catch (e) { console.error("DL Text Error:", e); alert("Could not prepare TXT.");}
  }, [batchId]);

  const handleDownloadPdf = useCallback((textContent, filename) => {
    if (textContent === null || textContent === undefined) { alert("No text content available."); return; }
    try {
        const pdf = new jsPDF();
        const pageHeight = pdf.internal.pageSize.height || pdf.internal.pageSize.getHeight();
        const pageWidth = pdf.internal.pageSize.width || pdf.internal.pageSize.getWidth();
        const margin = 20; const maxLineWidth = pageWidth - margin * 2; let y = margin;
        pdf.setFontSize(11); const lines = pdf.splitTextToSize(textContent, maxLineWidth);
        lines.forEach(line => {
            if (y + 10 > pageHeight - margin) { pdf.addPage(); y = margin; }
            pdf.text(line, margin, y); y += 7;
        });
        pdf.save(filename || `batch_results_${batchId}.pdf`);
    } catch (e) { console.error("DL PDF Error:", e); alert("Could not generate PDF.");}
  }, [batchId]);

  const handleDownloadDocx = useCallback(async (textContent, filename) => {
    if (textContent === null || textContent === undefined) { alert("No text content available."); return; }
    try {
        const paragraphs = textContent.split('\n').map(line => new Paragraph({ children: [new TextRun(line)] }));
        const doc = new Document({ sections: [{ children: paragraphs }] });
        const blob = await Packer.toBlob(doc);
        saveAs(blob, filename || `batch_results_${batchId}.docx`);
    } catch (e) { console.error("DL DOCX Error:", e); alert("Could not generate DOCX."); }
  }, [batchId]);

  // --- Text Enhance Handler ---
  const handleEnhanceText = useCallback(async () => {
    if (!batch?.extractedContent) {
        alert("No aggregated text available to enhance.");
        return;
    }
    setIsEnhancing(true);
    setEnhanceError(null);
    // Optionally reset previous result: setEnhancedAggregatedText(null);

    try {
        const result = await textEnhanceService.enhanceTextWithGemini(batch.extractedContent);
        setEnhancedAggregatedText(result.enhanced_text); // Assuming service returns { enhanced_text: '...' }
    } catch (err) {
        console.error("Text Enhancement Error:", err);
        setEnhanceError(err.message || "Failed to enhance text.");
        setEnhancedAggregatedText(null); // Clear previous result on error
    } finally {
        setIsEnhancing(false);
    }
  }, [batch?.extractedContent]); // Recreate if extracted content changes


  // --- Render Logic ---

  const renderContent = () => {
    // Loading/Error/No Batch states (keep as before)
    if (loading) return ( <div className='flex flex-col items-center justify-center h-full text-center'><FiLoader className="animate-spin h-10 w-10 text-orange-500 mb-4" /><p className="text-gray-500 dark:text-gray-400">Loading results...</p></div> );
    if (error) return ( <div className="flex flex-col items-center justify-center h-full text-center"><FiAlertTriangle className="h-12 w-12 text-red-500 mb-4" /><p className="text-red-600 dark:text-red-400 font-semibold mb-2">Error Loading Results</p><p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p><button onClick={() => navigate(`/batch/${batchId}`)} className="px-5 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition">Back to Batch</button></div> );
    if (!batch) return <p className="text-gray-500 dark:text-gray-400 text-center mt-10">Batch data not loaded.</p>;

    // Batch not finished state (keep as before)
    if (!['COMPLETED', 'FAILED', 'PARTIAL_FAILURE'].includes(batch.status)) {
      return ( <div className="flex flex-col items-center justify-center h-full text-center"><FiInfo className="h-12 w-12 text-blue-500 mb-4" /><p className="text-blue-600 dark:text-blue-400 font-semibold mb-2">Extraction Not Finished</p><p className="text-gray-600 dark:text-gray-400 mb-6">Batch status: <strong className="ml-1">{batch.status || 'PROCESSING'}</strong>.<br/> Please wait or check back later.</p><button onClick={() => navigate(`/batch/${batchId}`)} className="px-5 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition">View Batch Details</button></div> );
    }

    const aggregatedContent = batch.extractedContent;
    const canEnhance = aggregatedContent && !isEnhancing;

    return (
      <>
        {/* Batch Info Header (keep as before) */}
        <div className="mb-6 p-4 bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
            <h2 className="text-xl md:text-2xl font-semibold text-gray-800 dark:text-gray-100 mb-2 break-words">{batch.name || `Batch ${batch.id}`}</h2>
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-gray-500 dark:text-gray-400">
                <span>ID: <span className="font-medium text-gray-700 dark:text-gray-300">{batch.id}</span></span>
                <span>Files: <span className="font-medium text-gray-700 dark:text-gray-300">{batch.totalFileCount ?? (batch.documents?.length ?? 0)}</span></span>
                <span>Processed: <span className="font-medium text-gray-700 dark:text-gray-300">{formatDate(batch.updatedAt)}</span></span>
                <span>Status: <strong className={`ml-1 ${batch.status === 'COMPLETED' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>{batch.status}</strong></span>
            </div>
        </div>

        {/* Overall Metrics (keep as before) */}
        {(batch.status === 'COMPLETED' || batch.status === 'PARTIAL_FAILURE') && (batch.accuracy !== null || batch.totalWordCount !== null || batch.totalCharacterCount !== null) && (
          <div className="mb-6 p-4 bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-3">Overall Summary</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
              {batch.accuracy !== null && batch.accuracy !== undefined ? ( <div className="p-3 bg-green-50 dark:bg-green-900/30 rounded-md border border-green-200 dark:border-green-700"><FiCheckCircle className="mx-auto h-6 w-6 text-green-500 mb-1"/><p className="text-xs text-green-700 dark:text-green-300 font-medium">Avg. Accuracy</p><p className="text-xl font-bold text-green-600 dark:text-green-200">{formatMetric(batch.accuracy)}</p></div> ) : <div className="p-3 text-xs text-gray-400 italic flex items-center justify-center border rounded-md dark:border-gray-700">Accuracy N/A</div>}
              {(batch.totalWordCount !== null && batch.totalWordCount !== undefined) ? ( <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-md border border-blue-200 dark:border-blue-700"> <FiFileText className="mx-auto h-6 w-6 text-blue-500 mb-1"/> <p className="text-xs text-blue-700 dark:text-blue-300 font-medium">Total Words</p> <p className="text-xl font-bold text-blue-600 dark:text-blue-200">{batch.totalWordCount.toLocaleString()}</p> </div> ) : <div className="p-3 text-xs text-gray-400 italic flex items-center justify-center border rounded-md dark:border-gray-700">Word Count N/A</div>}
              {(batch.totalCharacterCount !== null && batch.totalCharacterCount !== undefined) ? ( <div className="p-3 bg-purple-50 dark:bg-purple-900/30 rounded-md border border-purple-200 dark:border-purple-700"> <RiCharacterRecognitionLine className="mx-auto h-6 w-6 text-purple-500 mb-1"/> <p className="text-xs text-purple-700 dark:text-purple-300 font-medium">Total Chars</p> <p className="text-xl font-bold text-purple-600 dark:text-purple-200">{batch.totalCharacterCount.toLocaleString()}</p> </div> ) : <div className="p-3 text-xs text-gray-400 italic flex items-center justify-center border rounded-md dark:border-gray-700">Char Count N/A</div>}
            </div>
          </div>
        )}

        {/* Aggregated Text Section --- MODIFIED --- */}
        {(batch.status === 'COMPLETED' || batch.status === 'PARTIAL_FAILURE') && aggregatedContent && (
          <div className="mb-6 bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 overflow-hidden">
              {/* Header with Actions */}
              <div className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200">Aggregated Extracted Text</h3>
                  {/* Action Buttons Group */}
                  <div className="flex flex-wrap gap-2">
                      {/* Enhance Button */}
                      <button
                         onClick={handleEnhanceText}
                         disabled={!canEnhance}
                         className={`flex items-center gap-1.5 px-3 py-1.5 text-white text-xs font-medium rounded-md transition ${canEnhance ? 'bg-teal-600 hover:bg-teal-700' : 'bg-gray-400 cursor-not-allowed'}`}
                         title={canEnhance ? "Correct grammar and spelling" : (isEnhancing ? "Enhancing..." : "No text to enhance")}
                       >
                          {isEnhancing ? <FiLoader className="animate-spin" size={14}/> : <TbSparkles size={14}/>}
                          {isEnhancing ? 'Enhancing...' : 'Enhance'}
                       </button>
                       {/* Original Download Buttons */}
                      <button onClick={() => handleDownloadText(aggregatedContent, `batch_${batchId}_aggregated.txt`)} className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-600 text-white text-xs font-medium rounded-md hover:bg-gray-700 transition" title="Download Original as TXT"> <FiFileText size={14}/> TXT </button>
                      <button onClick={() => handleDownloadPdf(aggregatedContent, `batch_${batchId}_aggregated.pdf`)} className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 text-white text-xs font-medium rounded-md hover:bg-red-700 transition" title="Download Original as PDF"> <FaFilePdf size={14}/> PDF </button>
                      <button onClick={() => handleDownloadDocx(aggregatedContent, `batch_${batchId}_aggregated.docx`)} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-md hover:bg-blue-700 transition" title="Download Original as DOCX"> <FaFileWord size={14}/> DOCX </button>
                  </div>
              </div>
              {/* Original Text Display */}
              <div className="p-4 max-h-80 overflow-y-auto bg-gray-50 dark:bg-gray-900/50">
                  <pre className="whitespace-pre-wrap break-words text-sm text-gray-700 dark:text-gray-300 font-mono">
                      {aggregatedContent}
                  </pre>
              </div>
          </div>
        )}

        {/* --- NEW: Enhanced Text Section --- */}
        {enhancedAggregatedText && (
          <div className="mb-6 bg-white dark:bg-gray-800 rounded-lg shadow border border-emerald-200 dark:border-emerald-700 overflow-hidden">
              {/* Header for Enhanced Text */}
              <div className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-semibold text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
                    <TbSparkles/> Enhanced Text
                  </h3>
                  {/* Download Buttons for Enhanced Text */}
                  <div className="flex flex-wrap gap-2">
                      <button onClick={() => handleDownloadText(enhancedAggregatedText, `batch_${batchId}_enhanced.txt`)} className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-600 text-white text-xs font-medium rounded-md hover:bg-gray-700 transition" title="Download Enhanced as TXT"> <FiFileText size={14}/> TXT </button>
                      <button onClick={() => handleDownloadPdf(enhancedAggregatedText, `batch_${batchId}_enhanced.pdf`)} className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 text-white text-xs font-medium rounded-md hover:bg-red-700 transition" title="Download Enhanced as PDF"> <FaFilePdf size={14}/> PDF </button>
                      <button onClick={() => handleDownloadDocx(enhancedAggregatedText, `batch_${batchId}_enhanced.docx`)} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-md hover:bg-blue-700 transition" title="Download Enhanced as DOCX"> <FaFileWord size={14}/> DOCX </button>
                  </div>
              </div>
              {/* Enhanced Text Display */}
              <div className="p-4 max-h-80 overflow-y-auto bg-emerald-50 dark:bg-emerald-900/30">
                  <pre className="whitespace-pre-wrap break-words text-sm text-gray-800 dark:text-gray-200 font-mono">
                      {enhancedAggregatedText}
                  </pre>
              </div>
          </div>
        )}

        {/* Enhancement Error Display */}
        {enhanceError && (
            <div className="mb-6 p-3 rounded-md bg-red-50 dark:bg-red-900/30 border border-red-300 dark:border-red-700 text-center">
                <p className="text-sm text-red-600 dark:text-red-300 flex items-center justify-center gap-2">
                    <FiAlertTriangle /> Enhancement Failed: {enhanceError}
                </p>
            </div>
        )}
        {/* --- End Enhancement Section --- */}


        {/* Individual Document Results Section (Keep as before) */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 p-4 border-b border-gray-200 dark:border-gray-700">
            Individual Document Results ({batch.documents?.length ?? 0})
          </h3>
          {batch.documents && batch.documents.length > 0 ? (
            <ul className="divide-y divide-gray-100 dark:divide-gray-700">
              {batch.documents.map((doc) => (
                <DocumentResultItem key={doc.id} doc={doc} onDownloadText={handleDownloadText}/>
              ))}
            </ul>
          ) : (
            <p className="text-center text-sm text-gray-500 dark:text-gray-400 p-6 italic">
              No individual document details available.
            </p>
          )}
        </div>
      </>
    );
  };

  // --- Final Render ---
  return (
    <div className="flex-1 p-4 md:p-6 h-full overflow-y-auto bg-gray-50 dark:bg-gray-900">
      <PageHeader title="Extraction Results" showBackArrow={true} backPath={`/batch/${batchId}`} />
      {renderContent()}
    </div>
  );
};

export default ExtractionResultsPage;