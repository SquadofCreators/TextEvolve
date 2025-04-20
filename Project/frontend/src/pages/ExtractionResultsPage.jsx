import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { batchService } from '../services/batchService'; // Ensure functions are correct
import { textEnhanceService } from '../services/textEnhanceService';
import { translateService } from '../services/translateService';
import PageHeader from '../components/utility/PageHeader';

// Icons
import { FiLoader, FiAlertTriangle, FiInfo, FiCheckCircle } from 'react-icons/fi';

// Download Libraries
import jsPDF from 'jspdf';
import { Document, Packer, Paragraph, TextRun } from 'docx';
import { saveAs } from 'file-saver';

// Import the child components (ensure they exist)
import BatchInfoHeader from '../components/results/BatchInfoHeader';
import BatchMetricsSummary from '../components/results/BatchMetricsSummary';
import AggregatedTextViewer from '../components/results/AggregatedTextViewer';
import EnhancedTextViewer from '../components/results/EnhancedTextViewer';
import TranslationPanel from '../components/results/TranslationPanel';
import DocumentList from '../components/results/DocumentList';

// --- Helper Functions ---
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
    if (value === null || value === undefined) return null; // Return null, not 'N/A' for easier conditional rendering
    const percentage = Number(value) * 100;
    // Ensure it handles potential floating point inaccuracies for whole numbers
    const fixedPercentage = parseFloat(percentage.toFixed(decimals));
    return `${fixedPercentage}%`;
};


// Not used directly in this component, but keep if DocumentList needs it separately
const getFileUrl = (storageKey) => {
    if (!storageKey || typeof storageKey !== 'string') return null;
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

    // State for enhanced text (will hold client-side aggregated result)
    const [enhancedAggregatedText, setEnhancedAggregatedText] = useState(null);
    const [isEnhancing, setIsEnhancing] = useState(false);
    const [enhanceError, setEnhanceError] = useState(null);
    const [enhanceSuccess, setEnhanceSuccess] = useState(false);

    // State for translation
    const [supportedLangs, setSupportedLangs] = useState([]);
    const [selectedLang, setSelectedLang] = useState(null);
    const [transSource, setTransSource] = useState('aggregated'); // Source 'aggregated' or 'enhanced'
    const [translatedText, setTranslatedText] = useState(null); // Holds the single translated text block
    const [isTranslating, setIsTranslating] = useState(false);
    const [translateError, setTranslateError] = useState(null);
    const [translateSuccess, setTranslateSuccess] = useState(false);

    // --- Data Fetching Callbacks ---
    const fetchBatchResults = useCallback(async () => {
        if (!batchId) {
            setError("No Batch ID provided."); setLoading(false); return;
        }
        setLoading(true); setError("");
        // Clear specific operational states, but potentially keep loaded text if desired (here we clear)
        setEnhancedAggregatedText(null);
        setEnhanceError(null); setIsEnhancing(false); setEnhanceSuccess(false);
        setTranslatedText(null);
        setTranslateError(null); setIsTranslating(false); setTranslateSuccess(false);
        // Consider if selectedLang/transSource should be reset

        try {
            const data = await batchService.getBatchById(batchId);
            if (!data || !data.id) throw new Error("Received invalid batch data structure.");
            setBatch(data);

            // --- Load Existing Per-Document Data (Simplified Check) ---
            if (data.documents && data.documents.length > 0) {
                // Check first doc for enhanced text
                if(data.documents[0].enhancedText) {
                    // If found, aggregate ALL available enhanced texts for display
                    const allEnhanced = data.documents
                        .map(doc => doc.enhancedText || '') // Use empty string if one is null
                        .join("\n\n-----\n\n"); // Simple aggregation
                     setEnhancedAggregatedText(allEnhanced);
                }
                // Check first doc for translated text
                if(data.documents[0].translatedText) {
                    setTranslatedText(data.documents[0].translatedText);
                    // NOTE: This doesn't know the language it was translated TO.
                    // A more robust solution would store language with the text or check all docs.
                }
            }
            // --- End Load Existing ---

        } catch (err) {
            console.error("Error fetching batch results:", err);
            let specificError = err.message || "Failed to load batch results.";
            if (err.response?.status === 404) specificError = `Batch with ID ${batchId} not found.`;
            else if (err.response?.status === 401 || err.response?.status === 403) specificError = "You are not authorized to view these results.";
            setError(specificError);
            setBatch(null); // Clear batch data on error
        } finally {
            setLoading(false);
        }
    }, [batchId]);

    const fetchSupportedLanguages = useCallback(async () => {
         try {
             const langData = await translateService.getSupportedLanguages();
             if (langData && langData.dictionary) {
                 const options = Object.keys(langData.dictionary).map(code => ({
                     value: code,
                     label: langData.dictionary[code].name
                 }));
                 setSupportedLangs(options);
             } else {
                 console.warn("Supported languages response format unexpected:", langData);
                 setSupportedLangs([]);
             }
         } catch (err) {
             console.error("Error fetching supported languages:", err);
              setSupportedLangs([]);
         }
     }, []);

    // --- Effects for Data Fetching ---
    useEffect(() => {
        fetchBatchResults();
    }, [fetchBatchResults]); // fetchBatchResults dependency is stable due to useCallback

    useEffect(() => {
        fetchSupportedLanguages();
    }, [fetchSupportedLanguages]); // fetchSupportedLanguages dependency is stable

    // --- Download Handler Callbacks ---
    const handleDownloadText = useCallback((textContent, filename) => {
        if (textContent === null || textContent === undefined) { alert("No text content available."); return; }
        try {
            const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
            saveAs(blob, filename || `download_${batchId}.txt`);
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
            const textToProcess = String(textContent);
            const lines = pdf.splitTextToSize(textToProcess, maxLineWidth);
            lines.forEach(line => {
                if (y + 10 > pageHeight - margin) { pdf.addPage(); y = margin; }
                pdf.text(line, margin, y);
                y += 7; // Line height
            });
            pdf.save(filename || `download_${batchId}.pdf`);
        } catch (e) { console.error("DL PDF Error:", e); alert("Could not generate PDF."); }
    }, [batchId]);

    const handleDownloadDocx = useCallback(async (textContent, filename) => {
        if (textContent === null || textContent === undefined) { alert("No text content available."); return; }
        try {
            const textToProcess = String(textContent);
            const paragraphs = textToProcess.split('\n').map(line => new Paragraph({ children: [new TextRun(line)] }));
            const doc = new Document({ sections: [{ children: paragraphs }] });
            const blob = await Packer.toBlob(doc);
            saveAs(blob, filename || `download_${batchId}.docx`);
        } catch (e) { console.error("DL DOCX Error:", e); alert("Could not generate DOCX."); }
    }, [batchId]);

    // --- Text Enhance Handler (REWRITTEN for Per-Document) ---
    const handleEnhanceText = useCallback(async () => {
        if (!batch?.documents || batch.documents.length === 0) {
            alert("No documents found in the batch to enhance.");
            return;
        }

        setIsEnhancing(true);
        setEnhanceError(null);
        setEnhanceSuccess(false);
        // Use a temporary object to hold new enhanced texts before updating state/batch
        const enhancedResultsMap = new Map();

        try {
            const enhancePromises = batch.documents.map(async (doc) => {
                if (!doc.extractedContent) {
                    console.warn(`Skipping enhancement for doc ${doc.id}: no extracted content.`);
                    // Store existing enhanced text if available, otherwise null
                    enhancedResultsMap.set(doc.id, doc.enhancedText || null);
                    return { docId: doc.id, status: 'skipped' };
                }

                // 1. Enhance
                const enhanceResult = await textEnhanceService.enhanceTextWithGemini(doc.extractedContent);
                if (!enhanceResult || typeof enhanceResult.enhanced_text !== 'string') {
                    // Store null or existing text on failure? Let's store null.
                     enhancedResultsMap.set(doc.id, doc.enhancedText || null);
                    throw new Error(`Enhancement invalid format for doc ${doc.id}`);
                }
                const currentEnhancedText = enhanceResult.enhanced_text;
                enhancedResultsMap.set(doc.id, currentEnhancedText); // Store successful result

                // 2. Save (async, don't wait here, handle results later)
                return batchService.updateDocumentResults(batchId, doc.id, { enhancedText: currentEnhancedText });
            });

            // Wait for all enhancement AND saving attempts
            const results = await Promise.allSettled(enhancePromises);

            // Check results
            const failedOperations = results.filter(r => r.status === 'rejected');

             // Aggregate the final text for display from our results map
             const finalAggregatedEnhancedText = batch.documents
                 .map(doc => enhancedResultsMap.get(doc.id) || '') // Use map, fallback to empty string
                 .join("\n\n-----\n\n"); // Use same separator
             setEnhancedAggregatedText(finalAggregatedEnhancedText);

             // Update batch state locally to reflect new document texts (optional but good for consistency)
             setBatch(prevBatch => ({
                ...prevBatch,
                documents: prevBatch.documents.map(doc => ({
                    ...doc,
                    enhancedText: enhancedResultsMap.get(doc.id) ?? doc.enhancedText // Update with new or keep old
                }))
             }));


            if (failedOperations.length > 0) {
                console.error("Some documents failed enhancement/saving:", failedOperations);
                // Provide specific error details if possible
                const errorDetails = failedOperations.map(f => f.reason?.message || 'Unknown error').join('; ');
                setEnhanceError(`Enhancement/save failed for ${failedOperations.length} document(s). Details: ${errorDetails.substring(0, 200)}...`); // Limit length
            } else {
                setEnhanceSuccess(true);
                setTimeout(() => setEnhanceSuccess(false), 3000);
            }

        } catch (err) {
            // Catch errors from the initial loop setup or Promise.allSettled itself (less likely)
            console.error("Error during batch enhancement process:", err);
            setEnhanceError(err.message || "An error occurred during the enhancement process.");
            // Don't clear aggregated text here, partial results might be displayed
        } finally {
            setIsEnhancing(false);
        }
    }, [batch?.documents, batchId]); // Dependencies

    // --- Translate Text Handler (Save Per-Document - same as before) ---
    const handleTranslateText = useCallback(async () => {
        // Determine source text: Use aggregated original or aggregated enhanced (state)
        const sourceText = transSource === 'enhanced' && enhancedAggregatedText ? enhancedAggregatedText : batch?.extractedContent;
        if (!sourceText) { alert("No source text available for translation."); return; }
        if (!selectedLang?.value) { alert("Please select a target language."); return; }

        setIsTranslating(true); setTranslateError(null); setTranslatedText(null); setTranslateSuccess(false);

        try {
            // 1. Translate the selected source text block
            const targetLangCode = selectedLang.value;
            const result = await translateService.translateText(sourceText, [targetLangCode]);

            if (result?.translations?.length > 0 && typeof result.translations[0].text === 'string') {
                const newTranslatedText = result.translations[0].text;
                setTranslatedText(newTranslatedText); // Update UI optimistically

                // 2. Save the *same* translation result to EACH document
                if (batch?.documents?.length > 0) {
                    const updatePromises = batch.documents.map(doc =>
                        batchService.updateDocumentResults(batchId, doc.id, { translatedText: newTranslatedText })
                            .catch(err => ({ docId: doc.id, error: err.message || "Unknown save error" }))
                    );
                    const results = await Promise.allSettled(updatePromises);
                    const failedSaves = results.filter(r => r.status === 'rejected' || (r.status === 'fulfilled' && r.value?.error));

                    if (failedSaves.length === 0) {
                        setTranslateSuccess(true);
                        setTimeout(() => setTranslateSuccess(false), 3000);
                         // Update local batch state optimistically (optional)
                         setBatch(prevBatch => ({
                            ...prevBatch,
                            documents: prevBatch.documents.map(doc => ({ ...doc, translatedText: newTranslatedText }))
                         }));
                    } else {
                        console.error("Failed to save translation for some documents:", failedSaves);
                        setTranslateError(`Translation succeeded, but failed to save for ${failedSaves.length} document(s).`);
                         // Update local state partially (optional)
                          setBatch(prevBatch => ({
                            ...prevBatch,
                            documents: prevBatch.documents.map(doc => {
                                const failed = failedSaves.some(f => f.status === 'fulfilled' && f.value?.docId === doc.id);
                                return { ...doc, translatedText: failed ? doc.translatedText : newTranslatedText };
                            })
                         }));
                    }
                } else {
                    // Translation succeeded but nothing to save to
                    setTranslateSuccess(true); // Still show success for translation API call
                    setTimeout(() => setTranslateSuccess(false), 3000);
                }
            } else {
                throw new Error("Translation returned an unexpected format or missing text.");
            }
        } catch (err) {
            console.error("Translation Error:", err);
            setTranslateError(err.message || "Failed to translate text.");
            setTranslatedText(null); // Clear on error
        } finally {
            setIsTranslating(false);
        }
    }, [
        batch?.extractedContent, batch?.documents, // Need documents for saving
        enhancedAggregatedText, // Need state for source
        transSource, selectedLang, batchId // Need batchId for saving
    ]); // Dependencies


    // --- State Setters for Child Components ---
    const handleSelectLang = useCallback((langOption) => {
        setSelectedLang(langOption);
        setTranslatedText(null); // Clear previous translation when lang changes
        setTranslateError(null);
        setTranslateSuccess(false);
    }, []);

    const handleSetSource = useCallback((sourceValue) => {
        setTransSource(sourceValue);
        setTranslatedText(null); // Clear previous translation when source changes
        setTranslateError(null);
        setTranslateSuccess(false);
    }, []);

    // --- Render Logic ---
    const renderContent = () => {
        if (loading) return ( 'Loading...'/* Loading indicator */ );
        if (error) return ('Error Loading' /* Error display */ );
        if (!batch) return <p className="text-center mt-10">Batch data not available.</p>;
        // Check if processing is finished
        if (!['COMPLETED', 'FAILED', 'PARTIAL_FAILURE'].includes(batch.status)) {
            return ('Process Completed' /* Processing/Pending message */ );
        }

        const aggregatedContent = batch.extractedContent;
        // Determine if enhance button should be enabled
        const canEnhance = batch?.documents?.length > 0 && !isEnhancing; // Enable if docs exist

        return (
            <div className=''>
                <BatchInfoHeader batch={batch} formatDate={formatDate} formatBytes={formatBytes} />
                <BatchMetricsSummary batch={batch} formatMetric={formatMetric} />

                {/* Text Viewers Container */}
                {(aggregatedContent) && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                         {/* Aggregated Text */}
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
                         {/* Enhanced Text (Displays client-aggregated state) */}
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
                {/* Enhance Feedback */}
                 {enhanceSuccess && (
                     <div className="mb-6 p-3 text-center text-sm text-green-600 dark:text-green-300 bg-green-50 dark:bg-green-900/20 rounded-md">
                         <FiCheckCircle className="inline mr-1 h-4 w-4"/> Document(s) enhanced and saved successfully.
                     </div>
                 )}
                 {enhanceError && (
                     <div className="mb-6 p-3 text-center text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-md">
                         <FiAlertTriangle className="inline mr-1 h-4 w-4"/> {enhanceError}
                     </div>
                 )}

                {/* Translation Panel */}
                 {(aggregatedContent || enhancedAggregatedText) && (
                     <TranslationPanel
                         aggregatedText={aggregatedContent} // Original aggregated
                         enhancedText={enhancedAggregatedText} // Client-aggregated enhanced
                         supportedLanguages={supportedLangs}
                         selectedLang={selectedLang}
                         transSource={transSource}
                         isTranslating={isTranslating}
                         translatedResult={translatedText} // State for translated text
                         translationError={translateError}
                         translationSuccess={translateSuccess}
                         onTranslate={handleTranslateText}
                         onSelectLang={handleSelectLang}
                         onSetSource={handleSetSource}
                         onDownloadText={handleDownloadText}
                         onDownloadPdf={handleDownloadPdf}
                         onDownloadDocx={handleDownloadDocx}
                         batchId={batchId}
                     />
                 )}

                 {/* Document List */}
                 {batch.documents && batch.documents.length > 0 && (
                     <DocumentList
                         documents={batch.documents} // Pass full documents array
                         formatDate={formatDate}
                         formatBytes={formatBytes}
                         formatMetric={formatMetric}
                         onDownloadText={handleDownloadText}
                     />
                 )}
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