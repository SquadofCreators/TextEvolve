// src/pages/ExtractTextPage.jsx

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
    CheckCircle,
    Loader2,
    Circle,
    AlertTriangle as LucideAlertTriangle,
    Eye,
} from "lucide-react";
import PageHeader from "../components/utility/PageHeader";
import { batchService } from "../services/batchService";
import { textExtractService } from "../services/textExtractService";
import { FiAlertTriangle } from 'react-icons/fi';
import { ocrProviders } from '../data/OcrFilters'; // Import to get provider details

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
    const [currentOcrProviderLabel, setCurrentOcrProviderLabel] = useState('');

    const processingStepsCount = steps.length - 2;

    const getOcrProviderLabel = useCallback((providerValue) => {
        const provider = ocrProviders.find(p => p.value === providerValue);
        return provider ? provider.label : providerValue || 'Selected AI';
    }, []);

    const startExtraction = useCallback(async () => {
        const navState = location.state;
        if (!navState || !navState.ocrProvider || !navState.documentsToProcess || navState.documentsToProcess.length === 0) {
            setError("Extraction cannot start. Required info (OCR Provider, Documents to Process) not received from previous page.");
            setIsProcessing(false);
            setCurrentStepIndex(steps.findIndex(s => s.key === 'fail'));
            return;
        }

        const { ocrProvider, documentsToProcess, batchName: navBatchName } = navState;
        const imageUrlsForOcr = documentsToProcess.map(doc => doc.url);
        setTotalDocumentsToProcess(imageUrlsForOcr.length);
        setCurrentOcrProviderLabel(getOcrProviderLabel(ocrProvider));

        if (!batchId) {
            setError("No Batch ID found in URL.");
            setCurrentStepIndex(steps.findIndex(s => s.key === 'fail'));
            return;
        }

        setIsProcessing(true);
        setError(null);
        setProcessedCount(0);
        setProgress(0);
        setCurrentStepIndex(0);
        setStatusMessage("Fetching batch information...");
        setBatchName(navBatchName || `Batch ${batchId}`);

        const urlToDocIdMap = new Map();
        documentsToProcess.forEach(docInfo => {
            if (docInfo && docInfo.url && docInfo.docId) {
                urlToDocIdMap.set(docInfo.url, { id: docInfo.docId, fileName: docInfo.fileName, sourceUsed: docInfo.sourceUsed });
            } else {
                console.warn("[ExtractTextPage] Invalid item in documentsToProcess from navigation state:", docInfo);
            }
        });

        try {
            setProgress(Math.round((1 / (processingStepsCount + 1)) * 100));
            setCurrentStepIndex(1);
            setStatusMessage("Preparing images for AI processing...");

            try {
                await batchService.updateBatch(batchId, { status: "PROCESSING" });
            } catch (updateError) {
                console.warn("[ExtractTextPage] Could not update batch status to PROCESSING:", updateError);
            }

            setProgress(Math.round((2 / (processingStepsCount + 1)) * 100));
            setCurrentStepIndex(2);
            setStatusMessage(`Sending ${imageUrlsForOcr.length} image(s) to ${getOcrProviderLabel(ocrProvider)}...`);

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
            } else if (ocrProvider === 'textevolve_v1') { // ✨ Changed from 'custom_tamil'
                ocrResults = isSingleImage
                    ? await textExtractService.customOcrSingleImage(imageUrlsForOcr[0])
                    : await textExtractService.customOcrMultipleImages(imageUrlsForOcr);
            } else {
                throw new Error(`Unsupported OCR provider: ${ocrProvider}`);
            }
            
            console.log("[ExtractTextPage] OCR Results Received:", ocrResults);

            if (!ocrResults || typeof ocrResults !== 'object' || Object.keys(ocrResults).length === 0) {
                if (isSingleImage && ocrResults && typeof ocrResults.error === 'string') {
                    ocrResults = { [imageUrlsForOcr[0]]: ocrResults };
                } else {
                    const emptyResultsWithErrors = {};
                    imageUrlsForOcr.forEach(url => {
                        emptyResultsWithErrors[url] = { error: "OCR service returned no data for this image." };
                    });
                    ocrResults = emptyResultsWithErrors;
                    console.warn("[ExtractTextPage] OCR service returned empty or invalid results, creating error entries for each image.");
                }
            }

            setCurrentStepIndex(3);
            let localProcessedCount = 0;
            let anyUpdateFailed = false;
            let successfulExtractions = 0;
            
            for (const imageUrlToProcess of imageUrlsForOcr) {
                localProcessedCount++;
                setProcessedCount(localProcessedCount);

                const docDetails = urlToDocIdMap.get(imageUrlToProcess);
                const docIdToUpdate = docDetails?.id;
                const originalFileName = docDetails?.fileName || `File for ${imageUrlToProcess.substring(imageUrlToProcess.lastIndexOf('/') + 1)}`;
                
                setStatusMessage(`Saving results for "${originalFileName}" (${localProcessedCount}/${imageUrlsForOcr.length})...`);

                const resultData = ocrResults[imageUrlToProcess];
                const isResultError = !resultData || (resultData && typeof resultData.error === 'string');
                const extractedTextFromOCR = resultData?.extracted_text;

                const payload = {
                    status: isResultError ? "FAILED" : "COMPLETED",
                    extractedContent: (!isResultError && extractedTextFromOCR && extractedTextFromOCR.trim() !== "") ? extractedTextFromOCR : null,
                    accuracy: (!isResultError && typeof resultData?.accuracy === "number") ? resultData.accuracy : null,
                    wordCount: (!isResultError && typeof resultData?.word_count === "number") ? resultData.word_count : null,
                    characterCount: (!isResultError && typeof resultData?.character_count === "number") ? resultData.character_count : null,
                    errorMessage: isResultError ? `OCR Error (${docDetails?.sourceUsed || 'unknown source'}): ${resultData?.error || "Unknown OCR error"}` : null,
                };

                if (!isResultError && payload.extractedContent) {
                    successfulExtractions++;
                }
                
                if (docIdToUpdate) {
                    try {
                        await batchService.updateDocumentResults(batchId, docIdToUpdate, payload);
                    } catch (docUpdateError) {
                        console.error(`[ExtractTextPage] Failed to update document ${docIdToUpdate} ("${originalFileName}"):`, docUpdateError);
                        setError(prev => (prev ? prev + "; " : "") + `Save failed for "${originalFileName}".`);
                        anyUpdateFailed = true;
                        try {
                            await batchService.updateDocumentResults(batchId, docIdToUpdate, { status: "FAILED", errorMessage: `DB Update Error: ${docUpdateError.message || "Update failed"}` });
                        } catch { /* Ignore nested error */ }
                    }
                } else {
                    console.warn(`[ExtractTextPage] Skipping DB update for OCR result from URL: ${imageUrlToProcess} (No mapped Doc ID).`);
                    setError(prev => (prev ? prev + "; " : "") + `Could not map result for one image to DB.`);
                    anyUpdateFailed = true;
                }

                const saveStepStartProgress = ( (steps.findIndex(s => s.key === 'save') -1) / (processingStepsCount + 1) ) * 100;
                const saveStepEndProgress = ( (steps.findIndex(s => s.key === 'save')) / (processingStepsCount + 1) ) * 100;
                const saveStepTotal = saveStepEndProgress - saveStepStartProgress;

                setProgress(
                    Math.min( Math.round(saveStepStartProgress + (localProcessedCount / imageUrlsForOcr.length) * saveStepTotal), 99)
                );
            }

            const allIntendedDocsFailed = successfulExtractions === 0 && imageUrlsForOcr.length > 0;
            const finalBatchStatus = anyUpdateFailed ? (allIntendedDocsFailed ? "FAILED" : "PARTIAL_FAILURE") : "COMPLETED";

            setCurrentStepIndex(finalBatchStatus === "FAILED" || (anyUpdateFailed && allIntendedDocsFailed) ? steps.findIndex(s => s.key === 'fail') : steps.findIndex(s => s.key === 'complete'));
            setProgress(100);
            setStatusMessage(
                finalBatchStatus === "FAILED" ? "Processing failed for all documents." :
                finalBatchStatus === "PARTIAL_FAILURE" ? "Processing finished with some errors." :
                "Processing completed successfully!"
            );
            
            if (anyUpdateFailed && !error) {
                setError("Some documents could not be processed or saved correctly.");
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [batchId, location.state, getOcrProviderLabel]);

    useEffect(() => {
        const navState = location.state;
        if (navState?.ocrProvider && navState?.documentsToProcess && navState.documentsToProcess.length > 0 && !isProcessing && progress === 0 && !error) {
            startExtraction();
        } else if (!isProcessing && progress === 0 && (!navState?.documentsToProcess || navState.documentsToProcess.length === 0) && !error) {
            setError("Required information to start extraction is missing. Please go back to the batch details page and try again.");
            setCurrentStepIndex(steps.findIndex(s => s.key === 'fail'));
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [location.state]);


    const handleViewResults = () => navigate(`/extraction-results/${batchId}`, { replace: true });
    const handleGoBack = () => navigate(`/batch/${batchId}`);

    const displayStepIndex = error && !isProcessing && currentStepIndex !== steps.findIndex(s => s.key === 'complete')
        ? steps.findIndex((s) => s.key === "fail")
        : currentStepIndex;
    const isUltimatelyCompleted = !isProcessing && displayStepIndex === steps.findIndex((s) => s.key === "complete");
    const isUltimatelyFailed = !isProcessing && displayStepIndex === steps.findIndex((s) => s.key === "fail");

    // --- JSX Render ---
    // (Keep your existing JSX structure, I'm just showing the top part with the OCR provider label for context)
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
                    {/* Display current OCR Provider Label */}
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        OCR Provider: <span className="font-medium text-slate-700 dark:text-slate-300">{currentOcrProviderLabel || "Loading..."}</span>
                    </p>
                     {totalDocumentsToProcess > 0 && (
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                            (Processed {processedCount} / {totalDocumentsToProcess} in current save step)
                        </p>
                    )}
                </div>

                {/* Rest of your JSX for progress bar, steps, error messages, buttons */}
                {/* ... (Keep your existing JSX structure) ... */}
                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3 mb-2 overflow-hidden">
                    <div
                        className={`h-full rounded-full transition-all duration-300 ease-linear ${
                            isUltimatelyCompleted ? "bg-green-500" :
                            isUltimatelyFailed ? "bg-red-500" :
                            "bg-orange-500 animate-pulse"
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
                                <button onClick={() => { setError(null); setProgress(0); setCurrentStepIndex(0); setStatusMessage("Initializing retry..."); setProcessedCount(0); startExtraction(); }}
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