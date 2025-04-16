// src/pages/ExtractionResultsPage.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { batchService } from '../services/batchService';
import { textEnhanceService } from '../services/textEnhanceService';
import { translateService } from '../services/translateService';
import PageHeader from '../components/utility/PageHeader';

// Icons
import { FiLoader, FiAlertTriangle, FiInfo } from 'react-icons/fi';

// Download Libraries
import jsPDF from 'jspdf';
import { Document, Packer, Paragraph, TextRun } from 'docx';
import { saveAs } from 'file-saver';

// Import the child components
import BatchInfoHeader from '../components/results/BatchInfoHeader';
import BatchMetricsSummary from '../components/results/BatchMetricsSummary';
import AggregatedTextViewer from '../components/results/AggregatedTextViewer';
import EnhancedTextViewer from '../components/results/EnhancedTextViewer';
import TranslationPanel from '../components/results/TranslationPanel';
import DocumentList from '../components/results/DocumentList';

// --- Helper Functions (Ensure they are fully defined or imported) ---
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
};

const formatDate = (isoString) => {
  if (!isoString) return 'N/A';
  try {
    return new Date(isoString).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
  } catch (e) { return 'Invalid Date'; }
};

const formatMetric = (value, decimals = 1) => {
    if (value === null || value === undefined) return null;
    const percentage = Number(value) * 100;
    return `${percentage % 1 === 0 ? percentage.toFixed(0) : percentage.toFixed(decimals)}%`;
};

// getFileUrl is primarily used by DocumentResultItem, ensure it's available there
// If DocumentResultItem is separate, it needs access to this function.
// If kept here, ensure DocumentResultItem imports it or receives it.
const getFileUrl = (storageKey) => {
    if (!storageKey || typeof storageKey !== 'string') return null;
    // Ensure environment variables are correctly accessed
    const apiOrigin = import.meta.env.VITE_API_URL ? new URL(import.meta.env.VITE_API_URL).origin : 'http://localhost:5000';
    const uploadsBase = import.meta.env.VITE_API_URL_IMAGE_BASE || `${apiOrigin}/uploads`;
    const normalizedStorageKey = storageKey.replace(/\\/g, "/");
    const cleanStorageKey = normalizedStorageKey.startsWith('/') ? normalizedStorageKey.substring(1) : normalizedStorageKey;
    return `${uploadsBase.replace(/\/$/, '')}/${cleanStorageKey}`;
};


// --- Main Component ---
const ExtractionResultsPage = () => {
    const { batchId } = useParams();
    const navigate = useNavigate();

    // --- State ---
    const [batch, setBatch] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [isEnhancing, setIsEnhancing] = useState(false);
    const [enhanceError, setEnhanceError] = useState(null);
    const [enhancedAggregatedText, setEnhancedAggregatedText] = useState(null);
    const [supportedLangs, setSupportedLangs] = useState([]);
    const [selectedLang, setSelectedLang] = useState(null);
    const [transSource, setTransSource] = useState('aggregated');
    const [translatedText, setTranslatedText] = useState(null);
    const [isTranslating, setIsTranslating] = useState(false);
    const [translateError, setTranslateError] = useState(null);

    // --- Data Fetching Callbacks ---
    const fetchBatchResults = useCallback(async () => {
        if (!batchId) {
            setError("No Batch ID provided."); setLoading(false); return;
        }
        setLoading(true); setError("");
        // Reset states
        setEnhancedAggregatedText(null); setEnhanceError(null); setIsEnhancing(false);
        setTranslatedText(null); setTranslateError(null); setSelectedLang(null);
        setTransSource('aggregated');

        try {
            const data = await batchService.getBatchById(batchId);
            if (!data || !data.id) throw new Error("Received invalid batch data structure.");
            setBatch(data);
        } catch (err) {
            console.error("Error fetching batch results:", err);
            let specificError = err.message || "Failed to load batch results.";
            if (err.response?.status === 404) specificError = `Batch with ID ${batchId} not found.`;
            else if (err.response?.status === 401 || err.response?.status === 403) specificError = "You are not authorized to view these results.";
            setError(specificError);
        } finally {
            setLoading(false);
        }
    }, [batchId]);

    const fetchSupportedLanguages = useCallback(async () => {
        try {
            const langData = await translateService.getSupportedLanguages();
            // Ensure you are drilling down correctly into the API response structure
            if (langData && langData.dictionary) { // Adjust if structure is different e.g. langData.data.dictionary
                const options = Object.keys(langData.dictionary).map(code => ({
                    value: code,
                    label: langData.dictionary[code].name
                }));
                setSupportedLangs(options);
            } else {
                 console.warn("Supported languages response format might be unexpected:", langData);
                 setSupportedLangs([]); // Set empty if format is wrong
            }
        } catch (err) {
            console.error("Error fetching supported languages:", err);
             setSupportedLangs([]); // Ensure it's an empty array on error
        }
    }, []);

    // --- Effects for Data Fetching ---
    useEffect(() => {
        fetchBatchResults();
    }, [fetchBatchResults]);

    useEffect(() => {
        fetchSupportedLanguages();
    }, [fetchSupportedLanguages]);

    // --- Download Handler Callbacks ---
    const handleDownloadText = useCallback((textContent, filename) => {
        if (textContent === null || textContent === undefined) { alert("No text content available."); return; }
        try {
            const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
            saveAs(blob, filename || `extracted_text_${batchId}.txt`);
        } catch (e) { console.error("DL Text Error:", e); alert("Could not prepare TXT."); }
    }, [batchId]);

    const handleDownloadPdf = useCallback((textContent, filename) => {
        if (textContent === null || textContent === undefined) { alert("No text content available."); return; }
        try {
            const pdf = new jsPDF();
            const pageHeight = pdf.internal.pageSize.height || pdf.internal.pageSize.getHeight();
            const pageWidth = pdf.internal.pageSize.width || pdf.internal.pageSize.getWidth();
            const margin = 20;
            const maxLineWidth = pageWidth - margin * 2;
            let y = margin;
            pdf.setFontSize(11);
            // Handle potential non-string content (though unlikely here)
            const textToProcess = String(textContent);
            const lines = pdf.splitTextToSize(textToProcess, maxLineWidth);
            lines.forEach(line => {
                if (y + 10 > pageHeight - margin) { pdf.addPage(); y = margin; }
                pdf.text(line, margin, y);
                y += 7; // Line height
            });
            pdf.save(filename || `batch_results_${batchId}.pdf`);
        } catch (e) { console.error("DL PDF Error:", e); alert("Could not generate PDF."); }
    }, [batchId]);

    const handleDownloadDocx = useCallback(async (textContent, filename) => {
        if (textContent === null || textContent === undefined) { alert("No text content available."); return; }
        try {
            const textToProcess = String(textContent);
            const paragraphs = textToProcess.split('\n').map(line => new Paragraph({ children: [new TextRun(line)] }));
            const doc = new Document({ sections: [{ children: paragraphs }] });
            const blob = await Packer.toBlob(doc);
            saveAs(blob, filename || `batch_results_${batchId}.docx`);
        } catch (e) { console.error("DL DOCX Error:", e); alert("Could not generate DOCX."); }
    }, [batchId]);

    // --- Text Enhance Handler ---
    const handleEnhanceText = useCallback(async () => {
        if (!batch?.extractedContent) {
             alert("No aggregated text available to enhance."); return;
        }
        setIsEnhancing(true); setEnhanceError(null);
        try {
            const result = await textEnhanceService.enhanceTextWithGemini(batch.extractedContent);
            // Check the actual structure of the response from your service
            if (result && typeof result.enhanced_text === 'string') {
                 setEnhancedAggregatedText(result.enhanced_text);
            } else {
                 throw new Error("Enhancement response did not contain expected 'enhanced_text' string.");
            }
        } catch (err) {
            console.error("Text Enhancement Error:", err);
            setEnhanceError(err.message || "Failed to enhance text.");
            setEnhancedAggregatedText(null); // Clear on error
        } finally {
            setIsEnhancing(false);
        }
    }, [batch?.extractedContent]);

    // --- Translate Text Handler ---
    const handleTranslateText = useCallback(async () => {
        const sourceText = transSource === 'enhanced' && enhancedAggregatedText ? enhancedAggregatedText : batch?.extractedContent;
        if (!sourceText) {
            alert("No source text available for translation."); return;
        }
        if (!selectedLang?.value) { // Check selectedLang has a value property
            alert("Please select a target language."); return;
        }
        setIsTranslating(true); setTranslateError(null); setTranslatedText(null);
        try {
            // Ensure selectedLang.value is passed correctly
            const result = await translateService.translateText(sourceText, [selectedLang.value]);
            // Check the actual response structure
            if (result?.translations?.length > 0 && typeof result.translations[0].text === 'string') {
                setTranslatedText(result.translations[0].text);
            } else {
                throw new Error("Translation returned an unexpected format or missing text.");
            }
        } catch (err) {
            console.error("Translation Error:", err);
            setTranslateError(err.message || "Failed to translate text.");
            setTranslatedText(null);
        } finally {
            setIsTranslating(false);
        }
    }, [batch?.extractedContent, enhancedAggregatedText, transSource, selectedLang]);

    // --- State Setters for Child Components ---
    const handleSelectLang = useCallback((langOption) => {
        setSelectedLang(langOption); // langOption is the { value: '...', label: '...' } object
        setTranslatedText(null); setTranslateError(null);
    }, []);

    const handleSetSource = useCallback((sourceValue) => {
        setTransSource(sourceValue);
        setTranslatedText(null); setTranslateError(null);
    }, []);

    // --- Render Logic ---
    const renderContent = () => {
        // Restore actual JSX for loading/error/pending states
        if (loading) return (
            <div className='flex flex-col items-center justify-center h-full text-center'>
                <FiLoader className="animate-spin h-10 w-10 text-orange-500 mb-4" />
                <p className="text-gray-500 dark:text-gray-400">Loading results...</p>
            </div>
         );
        if (error) return (
            <div className="flex flex-col items-center justify-center h-full text-center">
                <FiAlertTriangle className="h-12 w-12 text-red-500 mb-4" />
                <p className="text-red-600 dark:text-red-400 font-semibold mb-2">Error Loading Results</p>
                <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
                <button onClick={() => navigate(`/batch/${batchId}`)} className="px-5 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition">Back to Batch</button>
            </div>
        );
        if (!batch) return (
            <p className="text-gray-500 dark:text-gray-400 text-center mt-10">Batch data not loaded.</p>
        );
        if (!['COMPLETED', 'FAILED', 'PARTIAL_FAILURE'].includes(batch.status)) {
            return (
                 <div className="flex flex-col items-center justify-center h-full text-center">
                    <FiInfo className="h-12 w-12 text-blue-500 mb-4" />
                    <p className="text-blue-600 dark:text-blue-400 font-semibold mb-2">Extraction Not Finished</p>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">
                         Batch status: <strong className="ml-1">{batch.status || 'PROCESSING'}</strong>.<br/> Please wait or check back later.
                    </p>
                     <button onClick={() => navigate(`/batch/${batchId}`)} className="px-5 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition">View Batch Details</button>
                </div>
            );
        }

        const aggregatedContent = batch.extractedContent;
        const canEnhance = !!aggregatedContent && !isEnhancing;

        return (
            <div className=''>
                <BatchInfoHeader batch={batch} />

                <BatchMetricsSummary batch={batch} />

                {/* --- Container for Aggregated and Enhanced Text --- */}
                {(aggregatedContent) && (
                     <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">

                        {/* Aggregated Text Viewer Wrapper */}
                        <div className={enhancedAggregatedText ? 'lg:col-span-1' : 'lg:col-span-2'}>
                            <AggregatedTextViewer
                                content={aggregatedContent}
                                isEnhancing={isEnhancing}
                                canEnhance={canEnhance}
                                onEnhance={handleEnhanceText}
                                onDownloadText={handleDownloadText}
                                onDownloadPdf={handleDownloadPdf}
                                onDownloadDocx={handleDownloadDocx}
                                batchId={batchId}
                            />
                        </div>

                        {/* Enhanced Text Viewer Wrapper */}
                        {enhancedAggregatedText && (
                            <div className="lg:col-span-1">
                                <EnhancedTextViewer
                                    content={enhancedAggregatedText}
                                    onDownloadText={handleDownloadText}
                                    onDownloadPdf={handleDownloadPdf}
                                    onDownloadDocx={handleDownloadDocx}
                                    batchId={batchId}
                                />
                            </div>
                         )}
                    </div>
                )}
                {/* Display enhance error */}
                {enhanceError && (
                    <div className="mb-6 p-3 text-center text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-md">
                        <FiAlertTriangle className="inline mr-1 h-4 w-4"/> Enhancement failed: {enhanceError}
                    </div>
                )}
                {/* --- End of Text Viewers Container --- */}


                {/* Translation Panel */}
                 {(aggregatedContent || enhancedAggregatedText) && (
                     <TranslationPanel
                         aggregatedText={aggregatedContent}
                         enhancedText={enhancedAggregatedText}
                         supportedLanguages={supportedLangs} // Ensure this is populated correctly
                         selectedLang={selectedLang}
                         transSource={transSource}
                         isTranslating={isTranslating}
                         translatedResult={translatedText}
                         translationError={translateError}
                         onTranslate={handleTranslateText}
                         onSelectLang={handleSelectLang} // Passed correctly
                         onSetSource={handleSetSource}
                         onDownloadText={handleDownloadText} // Passed correctly
                         onDownloadPdf={handleDownloadPdf} // Passed correctly
                         onDownloadDocx={handleDownloadDocx} // Passed correctly
                         batchId={batchId}
                     />
                 )}

                <DocumentList
                    documents={batch.documents}
                    onDownloadText={handleDownloadText} // Passed correctly
                />
            </div>
        );
    };

    // --- Final Render ---
    return (
        <div className="flex-1 p-4 md:p-6 h-full overflow-y-auto bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
            <PageHeader title="Extraction Results" showBackArrow={true} backPath={batch ? `/batch/${batchId}` : '/'} />
            {renderContent()}
        </div>
    );
};

export default ExtractionResultsPage;