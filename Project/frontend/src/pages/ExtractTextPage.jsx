// src/pages/ExtractTextPage.jsx

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom"; // Added useLocation
import {
  CheckCircle,
  Loader2,
  Circle,
  XCircle,
  Eye,
  AlertTriangle,
} from "lucide-react"; // Assuming these icons are used or install lucide-react
import PageHeader from "../components/utility/PageHeader";
import { batchService } from "../services/batchService";
// Import the CORRECT service object and functions
import { textExtractService } from "../services/textExtractService";
// Keep FiLoader/FiAlertTriangle if used in error display
import { FiLoader, FiAlertTriangle } from "react-icons/fi";

// --- Local Helper Definitions ---

// Construct full file URL - Ensure this points to where your files are served from
// Typically the main backend, not necessarily the AI backend.
const getFileUrl = (storageKey) => {
    if (!storageKey || typeof storageKey !== "string") {
        return null;
    }
    // Use specific image base URL from .env if defined, otherwise construct from main API URL
    const apiOrigin = import.meta.env.VITE_API_URL
        ? new URL(import.meta.env.VITE_API_URL).origin
        : 'http://localhost:5000'; // Fallback main API origin
    const uploadsBase = import.meta.env.VITE_API_URL_IMAGE_BASE || `${apiOrigin}/uploads`;

    const normalizedStorageKey = storageKey.replace(/\\/g, "/");
    const cleanStorageKey = normalizedStorageKey.startsWith("/")
        ? normalizedStorageKey.substring(1)
        : normalizedStorageKey;

    // Prevent double slashes
    const fullUrl = `${uploadsBase.replace(/\/$/, '')}/${cleanStorageKey}`;
    return fullUrl;
};


// --- Component Definition ---

// Define steps (can still be used for visual representation)
const steps = [
  { name: "Fetching Batch Info", key: "fetch" },
  { name: "Preparing Images", key: "prepare" },
  { name: "Extracting Text (AI)", key: "extract" },
  { name: "Saving Results", key: "save" },
  { name: "Completed", key: "complete" },
  { name: "Failed", key: "fail" }, // Add a fail state
];

const ExtractTextPage = () => {
  const { batchId } = useParams();
  const navigate = useNavigate();
  const location = useLocation(); // Use location to get state passed from navigation

  // State definitions
  const [batchName, setBatchName] = useState("");
  const [documents, setDocuments] = useState([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState("Initializing...");
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [processedCount, setProcessedCount] = useState(0);

  const processingStepsCount = steps.length - 2; // Exclude Complete/Fail from count


  // --- Main Extraction Process ---
  const startExtraction = useCallback(async () => {
    // --- Get data passed via navigation state ---
    const navState = location.state;
    if (!navState || !navState.ocrProvider || !navState.imageUrls || navState.imageUrls.length === 0) {
        setError("Extraction cannot start. Required information (OCR Provider, Image URLs) was not received.");
        setIsProcessing(false);
        setCurrentStepIndex(steps.findIndex(s => s.key === 'fail')); // Go to fail state
        return;
    }
    const { ocrProvider, imageUrls, batchName: navBatchName } = navState;
    // --- End Get data ---

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
    setBatchName(navBatchName || `Batch ${batchId}`); // Use name from state if available

    let fetchedBatch; // Use this to cross-reference doc IDs if needed
    let imageUrlsMap = new Map(); // To map results back to doc IDs

    try {
      // 1. Fetch Batch Data (Optional but good for validation/getting doc IDs)
      // You might already have the necessary info (imageUrls) from navState,
      // but fetching confirms the batch exists and helps map results to DB IDs.
      fetchedBatch = await batchService.getBatchById(batchId);
      if (!fetchedBatch || !fetchedBatch.documents) {
        throw new Error("Batch data could not be retrieved or is invalid.");
      }
      setDocuments(fetchedBatch.documents); // Store original docs info
      const totalDocs = imageUrls.length; // Use count from passed URLs
      setProgress(Math.round((1 / (processingStepsCount + 1)) * 100));
      setCurrentStepIndex(1); // Moving to "Preparing Images" (already done, step represents state)

      // 2. Prepare Image URLs Map (map URL back to document ID)
      // Use the passed imageUrls, but map them to fetched document IDs
      imageUrls.forEach(url => {
          // Find the original document that corresponds to this URL
          const doc = fetchedBatch.documents.find(d => getFileUrl(d.storageKey) === url);
          if (doc) {
              imageUrlsMap.set(url, doc.id);
          } else {
              console.warn(`Could not map URL back to a document ID: ${url}`);
              // Decide how to handle this - maybe map URL to itself?
              imageUrlsMap.set(url, url); // Fallback: use URL as key if no doc ID found
          }
      });

      // Update Batch Status to PROCESSING
      try {
        await batchService.updateBatch(batchId, { status: "PROCESSING" });
      } catch (updateError) {
        console.warn("Could not update batch status to PROCESSING:", updateError);
        // Proceed anyway, but log the warning
      }

      setProgress(Math.round((2 / (processingStepsCount + 1)) * 100));
      setCurrentStepIndex(2); // Moving to "Extracting Text"
      setStatusMessage(`Sending ${totalDocs} image(s) to ${ocrProvider === 'google' ? 'Google' : 'Azure'} AI...`);


      // 3. Call Correct External OCR Service based on ocrProvider
      let ocrResults;
      const isSingleImage = imageUrls.length === 1;

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

      // Check if ocrResults is valid
       if (!ocrResults || typeof ocrResults !== 'object') {
           throw new Error("Received invalid or empty response from the OCR service.");
       }


      // 4. Process Results and Update Documents
      setCurrentStepIndex(3); // Moving to "Saving Results"
      let localProcessedCount = 0;
      let anyUpdateFailed = false;
      const resultEntries = Object.entries(ocrResults);

      // Ensure totalDocs reflects the number of results received if it differs
      const totalResultsToProcess = resultEntries.length;
      if (totalResultsToProcess !== totalDocs) {
          console.warn(`Number of results (${totalResultsToProcess}) differs from number of URLs sent (${totalDocs}).`);
      }


      for (const [imageUrl, result] of resultEntries) {
        // Attempt to get DB document ID, fallback to URL if mapping failed
        const docIdOrUrlKey = imageUrlsMap.get(imageUrl) || imageUrl;
        const isActualDocId = docIdOrUrlKey !== imageUrl; // Check if we have a real ID

        const docFileName = isActualDocId
                ? fetchedBatch.documents.find(d => d.id === docIdOrUrlKey)?.fileName || docIdOrUrlKey
                : "Result for unmapped URL";

        setStatusMessage(
            `Saving results for "${docFileName}" (${localProcessedCount + 1}/${totalResultsToProcess})...`
        );

        // Handle cases where the result might indicate an error for that specific image
        const isResultError = result && typeof result.error === 'string';
        const payload = {
          status: isResultError ? "FAILED" : "COMPLETED",
          extractedContent: isResultError ? null : result?.extracted_text, // Use actual key
          accuracy: (!isResultError && typeof result?.accuracy === "number") ? result.accuracy : null,
          // Add counts only if result is not an error and they exist
          wordCount: (!isResultError && typeof result?.word_count === "number") ? result.word_count : null,
          characterCount: (!isResultError && typeof result?.character_count === "number") ? result.character_count : null,
          // Add other fields like precision, loss if your OCR service provides them
          // precision: (!isResultError && typeof result.precision === "number") ? result.precision : null,
          // loss: (!isResultError && typeof result.loss === "number") ? result.loss : null,
          errorMessage: isResultError ? result.error : null // Store specific error if present
        };

        // Only update if we have an actual document ID
        if (isActualDocId) {
            try {
                await batchService.updateDocumentResults(batchId, docIdOrUrlKey, payload);
            } catch (docUpdateError) {
                console.error(`Failed to update document ${docIdOrUrlKey} ("${docFileName}"):`, docUpdateError);
                setError(`Failed to save result for "${docFileName}".`);
                anyUpdateFailed = true;
                // Optionally try marking as failed in DB again if primary update failed
                try {
                    await batchService.updateDocumentResults(batchId, docIdOrUrlKey, { status: "FAILED", errorMessage: docUpdateError.message || "Update failed" });
                } catch { /* Ignore nested error */ }
            }
        } else {
             console.warn(`Skipping DB update for result associated with URL (no Doc ID found): ${imageUrl}`);
             // If even one result couldn't be mapped back, consider the batch partially failed?
             // Or just log it. For now, let's just log.
        }

        localProcessedCount++;
        setProcessedCount(localProcessedCount);

        // Update progress proportionally within the "Saving" step range
        const saveStepStartProgress = (2 / (processingStepsCount + 1)) * 100;
        const saveStepEndProgress = (3 / (processingStepsCount + 1)) * 100;
        const saveStepRange = saveStepEndProgress - saveStepStartProgress;
        setProgress(
          Math.min(
            Math.round(
              saveStepStartProgress +
                (localProcessedCount / totalResultsToProcess) * saveStepRange
            ),
            99 // Cap progress at 99 until finalization
          )
        );
      }

      // 5. Finalize
      const finalBatchStatus = anyUpdateFailed ? "PARTIAL_FAILURE" : "COMPLETED"; // Or use FAILED if any single update failed
      setCurrentStepIndex(anyUpdateFailed ? steps.findIndex(s => s.key === 'fail') : steps.findIndex(s => s.key === 'complete'));
      setProgress(100);
      setStatusMessage(
        anyUpdateFailed
          ? "Processing finished with some errors."
          : "Processing completed successfully!"
      );
      setError(anyUpdateFailed ? (error || "Some documents could not be saved.") : null); // Set final error message if needed


      try {
        await batchService.updateBatch(batchId, { status: finalBatchStatus });
        // Only aggregate if fully completed without errors? Or always? Depends on logic.
        if (finalBatchStatus === "COMPLETED") {
          await batchService.aggregateBatchMetrics(batchId);
        }
      } catch (finalUpdateError) {
        console.error("Failed to update final batch status:", finalUpdateError);
        setError(
          (error ? error + " | " : "") + `Failed to update final batch status.`
        );
         // Ensure UI reflects failure state if final update fails
         setCurrentStepIndex(steps.findIndex(s => s.key === 'fail'));
      }

    } catch (err) {
      // --- Main error handling ---
      console.error("Extraction process failed:", err);
      setError(err.message || "An unknown error occurred during extraction.");
      setCurrentStepIndex(steps.findIndex(s => s.key === 'fail')); // Go to fail state
      // Attempt to mark batch as FAILED in DB
      if (batchId) {
          try {
              await batchService.updateBatch(batchId, { status: "FAILED" });
          } catch { /* Ignore nested error */ }
      }
    } finally {
        setIsProcessing(false); // Ensure processing stops on success or failure
    }
  }, [batchId, navigate, location.state]); // Add location.state as dependency

  // Start extraction on mount if state is present
  useEffect(() => {
    if (location.state?.ocrProvider && location.state?.imageUrls) {
        startExtraction();
    } else if (!isProcessing) {
        // Handle case where component is loaded directly without state
        setError("Required information to start extraction is missing. Please go back to the batch details page.");
        setCurrentStepIndex(steps.findIndex(s => s.key === 'fail'));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startExtraction]); // Rerun if startExtraction changes (due to batchId/navState)


  // --- Actions ---
  const handleViewResults = () => {
    // Navigate to results page (assuming it exists)
    navigate(`/extraction-results/${batchId}`);
  };
  const handleGoBack = () => {
    // Navigate back to the previous page (Batch Details)
    navigate(-1);
  };


  // Determine visual step index and completion/failure status
  const displayStepIndex = error && !isProcessing
    ? steps.findIndex((s) => s.key === "fail")
    : currentStepIndex;
  const isCompleted = !isProcessing && displayStepIndex === steps.findIndex((s) => s.key === "complete");
  const isFailed = !isProcessing && displayStepIndex === steps.findIndex((s) => s.key === "fail");


  // --- Render ---
  return (
    <div className="flex-1 h-full p-4 md:p-6 overflow-y-auto bg-gray-100 dark:bg-gray-800 rounded-lg">
      <PageHeader title="Extraction Progress" showBackArrow={true} />

      <div className="px-3 max-w-2xl mx-auto">
        {/* Header Info */}
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

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 mb-2 overflow-hidden">
          <div
            className={`h-full rounded-full transition-width duration-300 ease-linear ${
              isCompleted
                ? "bg-orange-500"
                : isFailed
                ? "bg-red-500"
                : "bg-orange-400 animate-pulse" // Add pulse when processing
            }`}
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        <div className="text-center text-sm font-medium text-gray-700 dark:text-gray-300 mb-8">
           {statusMessage} ({progress.toFixed(0)}%)
        </div>

        {/* Steps Indicator */}
        <div className="space-y-4 mb-10">
            {/* Filter steps dynamically based on error status */}
            {steps
                .filter(step => !(step.key === 'fail' && !isFailed)) // Hide Fail unless it's the active/final state
                .filter(step => !(step.key === 'complete' && isFailed)) // Hide Complete if failed
                .map((step, index, filteredSteps) => {
                    // Adjust indices based on filtered list if needed, or use keys
                    const isActive = step.key === steps[displayStepIndex]?.key;
                    const isCompletedStep = steps.findIndex(s => s.key === step.key) < displayStepIndex && !isFailed;
                    const isFinalStateIcon = (step.key === 'complete' && isCompleted) || (step.key === 'fail' && isFailed);

                    return (
                        <div
                            key={step.key || index}
                            className={`flex items-center gap-3 md:gap-4 transition-opacity duration-300 ${
                                !isCompletedStep && !isActive && !isFinalStateIcon ? "opacity-50" : ""
                            }`}
                        >
                            <div className="flex-shrink-0">
                                {isFinalStateIcon ? (
                                    step.key === 'complete' ? <CheckCircle className="w-6 h-6 text-orange-500" /> : <AlertTriangle className="w-6 h-6 text-red-500" />
                                ) : isCompletedStep ? (
                                    <CheckCircle className="w-6 h-6 text-orange-500" />
                                ) : isActive && isProcessing ? (
                                    <Loader2 className="w-6 h-6 text-orange-500 animate-spin" />
                                ) : (
                                    <Circle className="w-6 h-6 text-gray-300 dark:text-gray-600" />
                                )}
                            </div>
                            <div
                                className={`text-sm md:text-base font-medium ${
                                    isFinalStateIcon ? (step.key === 'complete' ? "text-orange-600 dark:text-orange-400" : "text-red-600 dark:text-red-400") :
                                    isCompletedStep ? "text-gray-700 dark:text-gray-300" :
                                    isActive ? "text-orange-400 dark:text-orange-400" :
                                    "text-gray-400 dark:text-gray-500"
                                }`}
                            >
                                {step.name} {isActive && isProcessing && "..."}
                            </div>
                        </div>
                    );
                })}
        </div>


        {/* Error Display Area */}
        {error && !isProcessing && (
          <div className="mb-6 p-3 rounded-md bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 text-center">
            <p className="text-sm text-red-600 dark:text-red-300 flex items-center justify-center gap-2">
              <FiAlertTriangle /> {error}
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mt-6 border-t border-gray-200 dark:border-gray-700 pt-6">
          {isProcessing ? (
             <button
              // Consider disabling cancel or making it more complex (backend support needed)
              onClick={handleGoBack}
              title="Cannot cancel processing currently. Go back to view batch status."
              className="w-full sm:w-auto px-6 py-2.5 bg-gray-400 text-white rounded-md transition-colors duration-200 text-sm font-medium flex items-center justify-center gap-2 cursor-not-allowed"
              disabled // Simple approach: disable cancel during processing
            >
              <Loader2 size={18} className="animate-spin" /> Processing...
            </button>
          ) : isCompleted ? ( // Only show View Results if completed successfully
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
          ) : ( // Failed or initial state (before processing started due to error)
            <>
              <button
                onClick={handleGoBack}
                className="w-full sm:w-auto px-6 py-2.5 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors duration-200 text-sm font-medium flex items-center justify-center gap-2 cursor-pointer"
              >
                Back to Batch
              </button>
               {/* Optionally add a Retry button if failed */}
               {isFailed && (
                    <button
                        onClick={startExtraction} // Re-trigger the extraction
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