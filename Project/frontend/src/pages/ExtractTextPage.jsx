// src/pages/ExtractTextPage.jsx

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  CheckCircle,
  Loader2,
  Circle,
  XCircle,
  Eye,
  AlertTriangle,
} from "lucide-react";
import PageHeader from "../components/utility/PageHeader";
import { batchService } from "../services/batchService";
import { textExtractService } from "../services/textExtractService";
import { FiLoader, FiAlertTriangle } from "react-icons/fi";

// --- Local Helper Definitions ---

// This function is kept in case other parts of the system provide relative storageKeys.
// However, for the primary logic in this component, if d.storageKey is already absolute,
// this function should NOT be used on it for comparison with other absolute URLs.
const getFileUrl = (storageKey) => {
    if (!storageKey || typeof storageKey !== "string") {
        return null;
    }

    // If storageKey is ALREADY a full URL, return it directly to prevent double prefixing
    try {
        new URL(storageKey); // Check if it's a valid, absolute URL
        // It might be a URL from a different origin than VITE_API_URL (e.g. cloud storage direct URL)
        // For this function's purpose, if it's absolute, we assume it's the one to use.
        return storageKey;
    } catch (_) {
        // Not a full URL, so proceed to construct it
    }

    const apiOrigin = import.meta.env.VITE_API_URL
        ? new URL(import.meta.env.VITE_API_URL).origin
        : 'http://localhost:5000'; // Fallback main API origin
    const uploadsBase = import.meta.env.VITE_API_URL_IMAGE_BASE || `${apiOrigin}/uploads`;

    const normalizedStorageKey = storageKey.replace(/\\/g, "/");
    const cleanStorageKey = normalizedStorageKey.startsWith("/")
        ? normalizedStorageKey.substring(1)
        : normalizedStorageKey;

    const fullUrl = `${uploadsBase.replace(/\/$/, '')}/${cleanStorageKey}`;
    return fullUrl;
};


// --- Component Definition ---

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
  // documents state is set but not directly used for iteration logic for URLs,
  // imageUrls from navState is the primary source for what to process.
  // It's useful for mapping results back if IDs are needed.
  // const [documents, setDocuments] = useState([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState("Initializing...");
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [processedCount, setProcessedCount] = useState(0);

  const processingStepsCount = steps.length - 2;


  const startExtraction = useCallback(async () => {
    const navState = location.state;
    if (!navState || !navState.ocrProvider || !navState.imageUrls || navState.imageUrls.length === 0) {
        setError("Extraction cannot start. Required information (OCR Provider, Image URLs) was not received.");
        setIsProcessing(false);
        setCurrentStepIndex(steps.findIndex(s => s.key === 'fail'));
        return;
    }
    const { ocrProvider, imageUrls, batchName: navBatchName } = navState;

    if (!batchId) {
        setError("No Batch ID found in URL.");
        return;
    }

    setIsProcessing(true);
    setError(null);
    setProcessedCount(0);
    setProgress(0);
    setCurrentStepIndex(0);
    setStatusMessage("Fetching batch information...");
    setBatchName(navBatchName || `Batch ${batchId}`);

    let fetchedBatch;
    let imageUrlsMap = new Map();

    try {
      fetchedBatch = await batchService.getBatchById(batchId);
      if (!fetchedBatch || !fetchedBatch.documents) {
        throw new Error("Batch data could not be retrieved or is invalid.");
      }
      // setDocuments(fetchedBatch.documents); // Storing documents if needed for other metadata

      const totalDocs = imageUrls.length;
      setProgress(Math.round((1 / (processingStepsCount + 1)) * 100));
      setCurrentStepIndex(1);

      // --- Step 2: Prepare Image URLs Map (map URL back to document ID) ---
      // CRITICAL ASSUMPTION: Both `url` from `navState.imageUrls` AND `d.storageKey`
      // from `WorkspaceedBatch.documents` are expected to be FULL, ABSOLUTE URLs
      // that are directly comparable for the same resource.
      imageUrls.forEach(urlFromNav => {
          const doc = fetchedBatch.documents.find(d => {
              // If d.storageKey itself might be relative or need construction, use getFileUrl:
              // const dbDocUrl = getFileUrl(d.storageKey);
              // return dbDocUrl === urlFromNav;

              // If d.storageKey is ALREADY an absolute URL, compare directly:
              return d.storageKey === urlFromNav;
          });

          if (doc) {
              imageUrlsMap.set(urlFromNav, doc.id);
          } else {
              console.warn(`Could not map URL from navigation state back to a fetched document ID: ${urlFromNav}. Document storageKey might differ or not be an exact match.`);
              // Fallback: use URL as key if no doc ID found. This means results for this URL
              // might not be saved against a specific document ID in your DB later.
              imageUrlsMap.set(urlFromNav, urlFromNav);
          }
      });
      // --- End Step 2 Correction ---

      try {
        await batchService.updateBatch(batchId, { status: "PROCESSING" });
      } catch (updateError) {
        console.warn("Could not update batch status to PROCESSING:", updateError);
      }

      setProgress(Math.round((2 / (processingStepsCount + 1)) * 100));
      setCurrentStepIndex(2);
      setStatusMessage(`Sending ${totalDocs} image(s) to ${ocrProvider === 'google' ? 'Google' : 'Azure'} AI...`);

      let ocrResults;
      const isSingleImage = imageUrls.length === 1;

      // The `imageUrls` (array of full URLs from navState) are passed directly to the service. This is correct.
      if (ocrProvider === 'google') {
          if (isSingleImage) {
              ocrResults = await textExtractService.googleOcrSingleImage(imageUrls[0]);
          } else {
              ocrResults = await textExtractService.googleOcrMultipleImages(imageUrls);
          }
      } else if (ocrProvider === 'azure') {
          if (isSingleImage) {
              ocrResults = await textExtractService.azureOcrSingleImage(imageUrls[0]);
          } else {
              ocrResults = await textExtractService.azureOcrMultipleImages(imageUrls);
          }
      } else {
          throw new Error(`Unsupported OCR provider specified: ${ocrProvider}`);
      }

       if (!ocrResults || typeof ocrResults !== 'object' || Object.keys(ocrResults).length === 0) {
           // Check if it's an error structure from the service for a single image failure
           if (isSingleImage && ocrResults && typeof ocrResults.error === 'string') {
               // This is a valid error response for a single image, handle it as such
               // Reconstruct it to match the multi-image result structure for consistent processing
               ocrResults = { [imageUrls[0]]: ocrResults };
           } else {
               throw new Error("Received invalid, empty, or unexpectedly structured response from the OCR service.");
           }
       }

      setCurrentStepIndex(3);
      let localProcessedCount = 0;
      let anyUpdateFailed = false;
      const resultEntries = Object.entries(ocrResults); // Keys of ocrResults should be the full image URLs sent

      const totalResultsToProcess = resultEntries.length;
      if (totalResultsToProcess === 0 && imageUrls.length > 0) {
        // This case implies the OCR service might have failed entirely before returning structured results
        throw new Error("OCR service returned no results for the provided images.");
      }
      if (totalResultsToProcess !== totalDocs && Object.keys(ocrResults).length > 0) { // only warn if we have some results
          console.warn(`Number of results (${totalResultsToProcess}) differs from number of URLs sent (${totalDocs}). Processing received results.`);
      }

      for (const [imageUrlFromResult, resultData] of resultEntries) {
        // imageUrlFromResult is the key from OCR results, expected to be a full URL.
        const docIdOrUrlKey = imageUrlsMap.get(imageUrlFromResult) || imageUrlFromResult;
        const isActualDocId = docIdOrUrlKey !== imageUrlFromResult && !docIdOrUrlKey.startsWith('http');


        const docFileName = isActualDocId && fetchedBatch?.documents
                ? fetchedBatch.documents.find(d => d.id === docIdOrUrlKey)?.fileName || `Document ID ${docIdOrUrlKey}`
                : `Result for ${imageUrlFromResult.substring(imageUrlFromResult.lastIndexOf('/') + 1)}`;


        setStatusMessage(
            `Saving results for "${docFileName}" (${localProcessedCount + 1}/${totalResultsToProcess})...`
        );

        const isResultError = resultData && typeof resultData.error === 'string';
        const payload = {
          status: isResultError ? "FAILED" : "COMPLETED",
          extractedContent: isResultError ? null : resultData?.extracted_text,
          accuracy: (!isResultError && typeof resultData?.accuracy === "number") ? resultData.accuracy : null,
          wordCount: (!isResultError && typeof resultData?.word_count === "number") ? resultData.word_count : null,
          characterCount: (!isResultError && typeof resultData?.character_count === "number") ? resultData.character_count : null,
          errorMessage: isResultError ? resultData.error : null
        };

        if (isActualDocId) {
            try {
                await batchService.updateDocumentResults(batchId, docIdOrUrlKey, payload);
            } catch (docUpdateError) {
                console.error(`Failed to update document ${docIdOrUrlKey} ("${docFileName}"):`, docUpdateError);
                setError(prev => (prev ? prev + "; " : "") + `Failed to save for "${docFileName}".`);
                anyUpdateFailed = true;
                try {
                    await batchService.updateDocumentResults(batchId, docIdOrUrlKey, { status: "FAILED", errorMessage: docUpdateError.message || "Update failed" });
                } catch { /* Ignore nested error */ }
            }
        } else {
             console.warn(`Skipping DB update for result associated with URL (no mapped Doc ID found): ${imageUrlFromResult}`);
             // If this URL was not in `imageUrlsMap` with a proper ID, it means mapping failed earlier.
             // This could be an issue if `imageUrls` (from navState) and `doc.storageKey` (from DB) aren't perfectly aligned.
        }

        localProcessedCount++;
        setProcessedCount(localProcessedCount);

        const saveStepStartProgress = (currentStepIndex -1 / (processingStepsCount + 1)) * 100; // currentStepIndex is 3 (save)
        const saveStepEndProgress = (currentStepIndex / (processingStepsCount + 1)) * 100;
        const saveStepRange = saveStepEndProgress - saveStepStartProgress;

        setProgress(
          Math.min(
            Math.round(
              saveStepStartProgress +
                (localProcessedCount / totalResultsToProcess) * saveStepRange
            ),
            99
          )
        );
      }

      const finalBatchStatus = anyUpdateFailed ? "PARTIAL_FAILURE" : "COMPLETED";
      setCurrentStepIndex(anyUpdateFailed ? steps.findIndex(s => s.key === 'fail') : steps.findIndex(s => s.key === 'complete'));
      setProgress(100);
      setStatusMessage(
        anyUpdateFailed
          ? "Processing finished with some errors."
          : "Processing completed successfully!"
      );
      // Keep existing error if anyUpdateFailed, or set specific "could not be saved" message
      if (anyUpdateFailed && !error) {
        setError("Some documents could not be saved correctly.");
      } else if (!anyUpdateFailed) {
        setError(null); // Clear errors if successful
      }


      try {
        await batchService.updateBatch(batchId, { status: finalBatchStatus });
        if (finalBatchStatus === "COMPLETED" || finalBatchStatus === "PARTIAL_FAILURE") { // Aggregate even on partial
          await batchService.aggregateBatchMetrics(batchId);
        }
      } catch (finalUpdateError) {
        console.error("Failed to update final batch status or aggregate metrics:", finalUpdateError);
        setError(
          (error ? error + " | " : "") + `Failed to update final batch status/metrics.`
        );
         setCurrentStepIndex(steps.findIndex(s => s.key === 'fail'));
      }

    } catch (err) {
      console.error("Extraction process failed:", err);
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
  }, [batchId, navigate, location.state]); // location.state contains imageUrls and ocrProvider

  useEffect(() => {
    if (location.state?.ocrProvider && location.state?.imageUrls && !isProcessing && progress === 0 && !error) { // Added more conditions to prevent re-runs
        startExtraction();
    } else if (!isProcessing && !location.state?.imageUrls && !error) { // if no state and not already error/processing
        setError("Required information to start extraction is missing. Please go back to the batch details page.");
        setCurrentStepIndex(steps.findIndex(s => s.key === 'fail'));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startExtraction, location.state, isProcessing, progress, error]);


  const handleViewResults = () => {
    navigate(`/extraction-results/${batchId}`);
  };
  const handleGoBack = () => {
    navigate(-1);
  };

  const displayStepIndex = error && !isProcessing && currentStepIndex !== steps.findIndex(s => s.key === 'complete')
    ? steps.findIndex((s) => s.key === "fail")
    : currentStepIndex;
  const isUltimatelyCompleted = !isProcessing && displayStepIndex === steps.findIndex((s) => s.key === "complete");
  const isUltimatelyFailed = !isProcessing && displayStepIndex === steps.findIndex((s) => s.key === "fail");


  return (
    <div className="flex-1 h-full p-4 md:p-6 overflow-y-auto bg-gray-100 dark:bg-gray-800 rounded-lg">
      <PageHeader title="Extraction Progress" showBackArrow={true} backPath={`/batch/${batchId}`} /> {/* Added specific back path */}

      <div className="px-3 max-w-2xl mx-auto">
        <div className="mt-6 mb-8 text-center">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">
             Processing Batch
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
             Name:{" "}
            <span className="font-medium text-gray-700 dark:text-gray-300">
              {batchName || "Loading..."}
            </span>
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
             ID:{" "}
            <span className="font-medium text-orange-600 dark:text-orange-400 break-all">
              {batchId}
            </span>
          </p>
        </div>

        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 mb-2 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ease-linear ${ // Changed transition-width to transition-all
              isUltimatelyCompleted
                ? "bg-orange-500"
                : isUltimatelyFailed
                ? "bg-red-500"
                : "bg-orange-400 animate-pulse"
            }`}
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        <div className="text-center text-sm font-medium text-gray-700 dark:text-gray-300 mb-8">
           {statusMessage} ({progress.toFixed(0)}%)
        </div>

        <div className="space-y-4 mb-10">
            {steps
                .filter(step => !(step.key === 'fail' && !isUltimatelyFailed))
                .filter(step => !(step.key === 'complete' && isUltimatelyFailed))
                .map((step) => {
                    const isActiveCurrentStep = step.key === steps[displayStepIndex]?.key;
                    const isPastStep = steps.findIndex(s => s.key === step.key) < displayStepIndex && !isUltimatelyFailed;
                    const isFinalStateIconToShow = (step.key === 'complete' && isUltimatelyCompleted) || (step.key === 'fail' && isUltimatelyFailed);

                    return (
                        <div
                            key={step.key}
                            className={`flex items-center gap-3 md:gap-4 transition-opacity duration-300 ${
                                !isPastStep && !isActiveCurrentStep && !isFinalStateIconToShow ? "opacity-50" : ""
                            }`}
                        >
                            <div className="flex-shrink-0">
                                {isFinalStateIconToShow ? (
                                    step.key === 'complete' ? <CheckCircle className="w-6 h-6 text-orange-500" /> : <AlertTriangle className="w-6 h-6 text-red-500" />
                                ) : isPastStep ? (
                                    <CheckCircle className="w-6 h-6 text-orange-500" />
                                ) : isActiveCurrentStep && isProcessing ? (
                                    <Loader2 className="w-6 h-6 text-orange-500 animate-spin" />
                                ) : (
                                    <Circle className="w-6 h-6 text-gray-300 dark:text-gray-600" />
                                )}
                            </div>
                            <div
                                className={`text-sm md:text-base font-medium ${
                                    isFinalStateIconToShow ? (step.key === 'complete' ? "text-orange-600 dark:text-orange-400" : "text-red-600 dark:text-red-400") :
                                    isPastStep ? "text-gray-700 dark:text-gray-300" :
                                    isActiveCurrentStep ? "text-orange-400 dark:text-orange-400" :
                                    "text-gray-400 dark:text-gray-500"
                                }`}
                            >
                                {step.name} {isActiveCurrentStep && isProcessing && "..."}
                            </div>
                        </div>
                    );
                })}
        </div>


        {error && !isProcessing && ( // Show error if error is present and not processing
          <div className="mb-6 p-3 rounded-md bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 text-center">
            <p className="text-sm text-red-600 dark:text-red-300 flex items-center justify-center gap-2">
              <FiAlertTriangle /> {error}
            </p>
          </div>
        )}

        <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mt-6 border-t border-gray-200 dark:border-gray-700 pt-6">
          {isProcessing ? (
             <button
              onClick={handleGoBack}
              title="Processing in progress. Go back to view batch status or wait."
              className="w-full sm:w-auto px-6 py-2.5 bg-gray-400 text-white rounded-md transition-colors duration-200 text-sm font-medium flex items-center justify-center gap-2 opacity-70"
              // disabled // Consider if truly disabled or just informational
            >
              <Loader2 size={18} className="animate-spin" /> Processing...
            </button>
          ) : isUltimatelyCompleted ? (
            <>
              <button
                onClick={handleGoBack}
                className="w-full sm:w-auto px-6 py-2.5 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors duration-200 text-sm font-medium flex items-center justify-center gap-2 cursor-pointer"
              >
                Back to Batch
              </button>
              <button
                onClick={handleViewResults}
                className="w-full sm:w-auto px-6 py-2.5 bg-orange-500 text-white rounded-md hover:bg-orange-600 transition-colors duration-200 text-sm font-medium flex items-center justify-center gap-2 cursor-pointer"
              >
                <Eye size={18} /> View Results
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleGoBack}
                className="w-full sm:w-auto px-6 py-2.5 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors duration-200 text-sm font-medium flex items-center justify-center gap-2 cursor-pointer"
              >
                Back to Batch
              </button>
               {isUltimatelyFailed && ( // Only show Retry if it's definitively failed
                    <button
                        onClick={() => { // Reset states before retrying
                            setError(null);
                            setProgress(0);
                            setCurrentStepIndex(0);
                            setStatusMessage("Initializing retry...");
                            startExtraction();
                        }}
                        className="w-full sm:w-auto px-6 py-2.5 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors duration-200 text-sm font-medium flex items-center justify-center gap-2 cursor-pointer"
                    >
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