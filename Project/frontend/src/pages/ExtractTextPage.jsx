// src/pages/ExtractTextPage.jsx

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
    CheckCircle,
    Loader2,
    Circle,
    AlertTriangle as LucideAlertTriangle, // Renamed to avoid conflict with FiAlertTriangle
    Eye,
} from "lucide-react";
import PageHeader from "../components/utility/PageHeader";
import { batchService } from "../services/batchService";
import { textExtractService } from "../services/textExtractService";
import { FiAlertTriangle } from 'react-icons/fi'; // Keep this if used elsewhere, or unify

const steps = [
    { name: "Fetching Batch Info", key: "fetch" },
    { name: "Preparing Images", key: "prepare" },
    { name: "Extracting Text (AI)", key: "extract" },
    { name: "Saving Results", key: "save" },
    { name: "Completed", key: "complete" },
    { name: "Failed", key: "fail" },
];

const ExtractTextPage = () => {
    const { batchId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();

    const [batchName, setBatchName] = useState("");
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [progress, setProgress] = useState(0);
    const [statusMessage, setStatusMessage] = useState("Initializing...");
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState(null);
    const [processedCount, setProcessedCount] = useState(0);
    const [totalDocumentsToProcess, setTotalDocumentsToProcess] = useState(0);

    const processingStepsCount = steps.length - 2; // Exclude complete and fail for step calculation

    const startExtraction = useCallback(async () => {
        const navState = location.state;
        // --- MODIFIED: Check for documentsToProcess ---
        if (!navState || !navState.ocrProvider || !navState.documentsToProcess || navState.documentsToProcess.length === 0) {
            setError("Extraction cannot start. Required info (OCR Provider, Documents to Process) not received from previous page.");
            setIsProcessing(false);
            setCurrentStepIndex(steps.findIndex(s => s.key === 'fail'));
            return;
        }
        // --- END MODIFICATION ---

        const { ocrProvider, documentsToProcess, batchName: navBatchName } = navState;
        const imageUrlsForOcr = documentsToProcess.map(doc => doc.url); // Get URLs to send to OCR
        setTotalDocumentsToProcess(imageUrlsForOcr.length);


        if (!batchId) {
            setError("No Batch ID found in URL.");
            setCurrentStepIndex(steps.findIndex(s => s.key === 'fail'));
            return;
        }

        setIsProcessing(true);
        setError(null);
        setProcessedCount(0);
        setProgress(0);
        setCurrentStepIndex(0); // Start at "Fetching Batch Info"
        setStatusMessage("Fetching batch information...");
        setBatchName(navBatchName || `Batch ${batchId}`);

        // --- MODIFIED: Create a map from processed URL to its original docId ---
        const urlToDocIdMap = new Map();
        documentsToProcess.forEach(docInfo => {
            if (docInfo && docInfo.url && docInfo.docId) {
                urlToDocIdMap.set(docInfo.url, { id: docInfo.docId, fileName: docInfo.fileName, sourceUsed: docInfo.sourceUsed });
            } else {
                console.warn("[ExtractTextPage] Invalid item in documentsToProcess from navigation state:", docInfo);
            }
        });
        console.log("[ExtractTextPage] Created urlToDocIdMap:", urlToDocIdMap);
        // --- END MODIFICATION ---

        try {
            // Step 0: Fetch Batch Info (Optional, primarily for display or if not all info passed in navState)
            // For now, we assume batchName from navState is enough for display.
            // If you need other batch details, fetch them here.
            // const fetchedBatch = await batchService.getBatchById(batchId);
            // if (!fetchedBatch) throw new Error("Batch data could not be retrieved.");

            setProgress(Math.round((1 / (processingStepsCount + 1)) * 100));
            setCurrentStepIndex(1); // "Preparing Images"
            setStatusMessage("Preparing images for AI processing...");

            try {
                await batchService.updateBatch(batchId, { status: "PROCESSING" });
            } catch (updateError) {
                console.warn("[ExtractTextPage] Could not update batch status to PROCESSING:", updateError);
            }

            setProgress(Math.round((2 / (processingStepsCount + 1)) * 100));
            setCurrentStepIndex(2); // "Extracting Text (AI)"
            setStatusMessage(`Sending ${imageUrlsForOcr.length} image(s) to ${ocrProvider === 'google' ? 'Google' : 'Azure'} AI...`);

            let ocrResults;
            const isSingleImage = imageUrlsForOcr.length === 1;

            if (ocrProvider === 'google') {
                ocrResults = isSingleImage 
                    ? await textExtractService.googleOcrSingleImage(imageUrlsForOcr[0]) 
                    : await textExtractService.googleOcrMultipleImages(imageUrlsForOcr);
            } else if (ocrProvider === 'azure') {
                ocrResults = isSingleImage 
                    ? await textExtractService.azureOcrSingleImage(imageUrlsForOcr[0]) 
                    : await textExtractService.azureOcrMultipleImages(imageUrlsForOcr);
            } else {
                throw new Error(`Unsupported OCR provider: ${ocrProvider}`);
            }
            
            console.log("[ExtractTextPage] OCR Results Received:", ocrResults);

            if (!ocrResults || typeof ocrResults !== 'object' || Object.keys(ocrResults).length === 0) {
                if (isSingleImage && ocrResults && typeof ocrResults.error === 'string') {
                    ocrResults = { [imageUrlsForOcr[0]]: ocrResults }; // Wrap single error for consistent processing
                } else {
                    throw new Error("Invalid or empty response from OCR service.");
                }
            }

            setCurrentStepIndex(3); // "Saving Results"
            let localProcessedCount = 0;
            let anyUpdateFailed = false;
            const resultEntries = Object.entries(ocrResults);
            const totalResultsFromOcr = resultEntries.length;

            if (totalResultsFromOcr === 0 && imageUrlsForOcr.length > 0) {
                throw new Error("OCR service returned no results for the images.");
            }

            for (const [imageUrlFromResult, resultData] of resultEntries) {
                localProcessedCount++;
                setProcessedCount(localProcessedCount);
                
                // --- MODIFIED: Use urlToDocIdMap to get the correct document ID ---
                const docDetails = urlToDocIdMap.get(imageUrlFromResult);
                const docIdToUpdate = docDetails?.id;
                const originalFileName = docDetails?.fileName || `File for ${imageUrlFromResult.substring(imageUrlFromResult.lastIndexOf('/') + 1)}`;
                // --- END MODIFICATION ---

                setStatusMessage(`Saving results for "${originalFileName}" (${localProcessedCount}/${totalResultsFromOcr})...`);

                const isResultError = resultData && typeof resultData.error === 'string';
                const payload = {
                    status: isResultError ? "FAILED" : "COMPLETED",
                    extractedContent: isResultError ? null : resultData?.extracted_text,
                    accuracy: (!isResultError && typeof resultData?.accuracy === "number") ? resultData.accuracy : null,
                    wordCount: (!isResultError && typeof resultData?.word_count === "number") ? resultData.word_count : null,
                    characterCount: (!isResultError && typeof resultData?.character_count === "number") ? resultData.character_count : null,
                    // Store error from OCR if any
                    errorMessage: isResultError ? `OCR Error (${docDetails?.sourceUsed || 'unknown source'}): ${resultData.error}` : null,
                    // Optionally store which source was used for this extraction
                    // lastExtractionSource: docDetails?.sourceUsed 
                };
                
                if (docIdToUpdate) { // Only update if we have a valid docId
                    try {
                        console.log(`[ExtractTextPage] Updating DB for docId: ${docIdToUpdate}, URL: ${imageUrlFromResult}, Payload:`, payload);
                        await batchService.updateDocumentResults(batchId, docIdToUpdate, payload);
                    } catch (docUpdateError) {
                        console.error(`[ExtractTextPage] Failed to update document ${docIdToUpdate} ("${originalFileName}"):`, docUpdateError);
                        setError(prev => (prev ? prev + "; " : "") + `Save failed for "${originalFileName}".`);
                        anyUpdateFailed = true;
                        try { // Attempt to mark doc as FAILED in DB if update fails
                            await batchService.updateDocumentResults(batchId, docIdToUpdate, { status: "FAILED", errorMessage: `DB Update Error: ${docUpdateError.message || "Update failed"}` });
                        } catch { /* Ignore nested error on marking as FAILED */ }
                    }
                } else {
                    console.warn(`[ExtractTextPage] Skipping DB update for OCR result from URL: ${imageUrlFromResult} (No mapped Doc ID). This should not happen if documentsToProcess was correctly passed and mapped.`);
                    setError(prev => (prev ? prev + "; " : "") + `Could not map result for one image to DB.`);
                    anyUpdateFailed = true; // Consider this a failure in the overall process
                }

                // Progress calculation within the "Saving Results" step
                const saveStepStartProgress = ( (steps.findIndex(s => s.key === 'save') -1) / (processingStepsCount + 1) ) * 100;
                const saveStepEndProgress = ( (steps.findIndex(s => s.key === 'save')) / (processingStepsCount + 1) ) * 100;
                const saveStepTotal = saveStepEndProgress - saveStepStartProgress;

                setProgress(
                    Math.min( Math.round(saveStepStartProgress + (localProcessedCount / totalResultsFromOcr) * saveStepTotal), 99)
                );
            }

            const finalBatchStatus = anyUpdateFailed ? "PARTIAL_FAILURE" : "COMPLETED";
            setCurrentStepIndex(anyUpdateFailed ? steps.findIndex(s => s.key === 'fail') : steps.findIndex(s => s.key === 'complete'));
            setProgress(100);
            setStatusMessage(anyUpdateFailed ? "Processing finished with some errors." : "Processing completed successfully!");
            if (anyUpdateFailed && !error) { // Set a general error if individual file errors occurred but no overall process error
                setError("Some documents could not be saved correctly. Check console for details.");
            } else if (!anyUpdateFailed) {
                setError(null);
            }

            try {
                await batchService.updateBatch(batchId, { status: finalBatchStatus });
                if (finalBatchStatus === "COMPLETED" || finalBatchStatus === "PARTIAL_FAILURE") {
                    await batchService.aggregateBatchMetrics(batchId);
                }
            } catch (finalUpdateError) {
                console.error("[ExtractTextPage] Failed to update final batch status or aggregate metrics:", finalUpdateError);
                setError((prevError) => (prevError ? prevError + " | " : "") + `Failed to update final batch status/metrics.`);
                setCurrentStepIndex(steps.findIndex(s => s.key === 'fail'));
            }

        } catch (err) {
            console.error("[ExtractTextPage] Extraction process failed:", err);
            setError(err.message || "An unknown error occurred during extraction.");
            setCurrentStepIndex(steps.findIndex(s => s.key === 'fail'));
            if (batchId) {
                try {
                    await batchService.updateBatch(batchId, { status: "FAILED", errorMessage: err.message });
                } catch { /* Ignore nested error */ }
            }
        } finally {
            setIsProcessing(false);
        }
    }, [batchId, location.state]); // Removed navigate from deps as it's stable, added isProcessing, progress, error

    useEffect(() => {
        const navState = location.state;
        // Check for documentsToProcess instead of imageUrls directly
        if (navState?.ocrProvider && navState?.documentsToProcess && navState.documentsToProcess.length > 0 && !isProcessing && progress === 0 && !error) {
            console.log("[ExtractTextPage] useEffect: Valid navigation state found, starting extraction.", navState);
            startExtraction();
        } else if (!isProcessing && (!navState?.documentsToProcess || navState.documentsToProcess.length === 0) && !error) {
            console.error("[ExtractTextPage] useEffect: Required information (documentsToProcess) missing in navigation state.");
            setError("Required information to start extraction is missing. Please go back to the batch details page and try again.");
            setCurrentStepIndex(steps.findIndex(s => s.key === 'fail'));
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [location.state]); // Only re-run if location.state changes. startExtraction is memoized with location.state.


    const handleViewResults = () => navigate(`/extraction-results/${batchId}`, { replace: true });
    const handleGoBack = () => navigate(`/batch/${batchId}`); // Go back to specific batch

    const displayStepIndex = error && !isProcessing && currentStepIndex !== steps.findIndex(s => s.key === 'complete')
        ? steps.findIndex((s) => s.key === "fail")
        : currentStepIndex;
    const isUltimatelyCompleted = !isProcessing && displayStepIndex === steps.findIndex((s) => s.key === "complete");
    const isUltimatelyFailed = !isProcessing && displayStepIndex === steps.findIndex((s) => s.key === "fail");

    return (
        <div className="flex-1 h-full p-4 md:p-6 overflow-y-auto bg-slate-100 dark:bg-slate-900 rounded-lg">
            <PageHeader title="Extraction Progress" showBackArrow={true} backPath={`/batch/${batchId}`} />

            <div className="px-3 max-w-2xl mx-auto">
                <div className="mt-6 mb-8 text-center">
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2">
                        Processing Batch
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        Name: <span className="font-medium text-slate-700 dark:text-slate-300">{batchName || "Loading..."}</span>
                    </p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        ID: <span className="font-medium text-orange-600 dark:text-orange-400 break-all">{batchId}</span>
                    </p>
                     {totalDocumentsToProcess > 0 && (
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                            ({processedCount} / {totalDocumentsToProcess} documents processed in current save step)
                        </p>
                    )}
                </div>

                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3 mb-2 overflow-hidden">
                    <div
                        className={`h-full rounded-full transition-all duration-300 ease-linear ${
                            isUltimatelyCompleted ? "bg-green-500" :
                            isUltimatelyFailed ? "bg-red-500" :
                            "bg-orange-500 animate-pulse" // Changed for better visibility
                        }`}
                        style={{ width: `${progress}%` }}
                    ></div>
                </div>
                <div className="text-center text-sm font-medium text-slate-700 dark:text-slate-300 mb-8">
                    {statusMessage} ({progress.toFixed(0)}%)
                </div>

                <div className="space-y-4 mb-10">
                    {steps
                        .filter(step => !(step.key === 'fail' && !isUltimatelyFailed))
                        .filter(step => !(step.key === 'complete' && isUltimatelyFailed))
                        .map((step, idx) => {
                            const isActiveCurrentStep = idx === displayStepIndex;
                            const isPastStep = idx < displayStepIndex && !isUltimatelyFailed;
                            const isFinalStateIconToShow = (step.key === 'complete' && isUltimatelyCompleted) || (step.key === 'fail' && isUltimatelyFailed);

                            return (
                                <div key={step.key} className={`flex items-center gap-3 md:gap-4 transition-opacity duration-300 ${!isPastStep && !isActiveCurrentStep && !isFinalStateIconToShow ? "opacity-60" : ""}`}>
                                    <div className="flex-shrink-0">
                                        {isFinalStateIconToShow ? (
                                            step.key === 'complete' ? <CheckCircle className="w-6 h-6 text-green-500" /> : <LucideAlertTriangle className="w-6 h-6 text-red-500" />
                                        ) : isPastStep ? (
                                            <CheckCircle className="w-6 h-6 text-green-500" />
                                        ) : isActiveCurrentStep && isProcessing ? (
                                            <Loader2 className="w-6 h-6 text-orange-500 animate-spin" />
                                        ) : (
                                            <Circle className="w-6 h-6 text-slate-300 dark:text-slate-600" />
                                        )}
                                    </div>
                                    <div className={`text-sm md:text-base font-medium ${isFinalStateIconToShow ? (step.key === 'complete' ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400") : isPastStep ? "text-slate-700 dark:text-slate-300" : isActiveCurrentStep ? "text-orange-500 dark:text-orange-400" : "text-slate-400 dark:text-slate-500"}`}>
                                        {step.name} {isActiveCurrentStep && isProcessing && "..."}
                                    </div>
                                </div>
                            );
                        })}
                </div>

                {error && !isProcessing && (
                    <div className="mb-6 p-3 rounded-md bg-red-100 dark:bg-red-900/40 border border-red-300 dark:border-red-700/60 text-center">
                        <p className="text-sm text-red-700 dark:text-red-300 flex items-center justify-center gap-2">
                            <FiAlertTriangle /> {error}
                        </p>
                    </div>
                )}

                <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mt-6 border-t border-slate-200 dark:border-slate-700 pt-6">
                    {isProcessing ? (
                        <button onClick={handleGoBack} title="Processing in progress. Go back to view batch status or wait." className="w-full sm:w-auto px-6 py-2.5 bg-slate-400 text-white rounded-md transition-colors duration-200 text-sm font-medium flex items-center justify-center gap-2 opacity-80">
                            <Loader2 size={18} className="animate-spin" /> Processing...
                        </button>
                    ) : isUltimatelyCompleted ? (
                        <>
                            <button onClick={handleGoBack} className="w-full sm:w-auto px-6 py-2.5 bg-slate-500 text-white rounded-md hover:bg-slate-600 transition-colors duration-200 text-sm font-medium flex items-center justify-center gap-2 cursor-pointer">
                                Back to Batch
                            </button>
                            <button onClick={handleViewResults} className="w-full sm:w-auto px-6 py-2.5 bg-orange-500 text-white rounded-md hover:bg-orange-600 transition-colors duration-200 text-sm font-medium flex items-center justify-center gap-2 cursor-pointer">
                                <Eye size={18} /> View Results
                            </button>
                        </>
                    ) : (
                        <>
                            <button onClick={handleGoBack} className="w-full sm:w-auto px-6 py-2.5 bg-slate-500 text-white rounded-md hover:bg-slate-600 transition-colors duration-200 text-sm font-medium flex items-center justify-center gap-2 cursor-pointer">
                                Back to Batch
                            </button>
                            {isUltimatelyFailed && (
                                <button onClick={() => { setError(null); setProgress(0); setCurrentStepIndex(0); setStatusMessage("Initializing retry..."); startExtraction(); }}
                                    className="w-full sm:w-auto px-6 py-2.5 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors duration-200 text-sm font-medium flex items-center justify-center gap-2 cursor-pointer">
                                    Retry Extraction
                                </button>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ExtractTextPage;