// src/pages/ExtractTextPage.jsx

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
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
import { FiLoader, FiAlertTriangle } from "react-icons/fi"; // Keep FiLoader/FiAlertTriangle if used

// --- REMOVE Utility Import ---
// import { getFileUrl } from '../utils/urlUtils.js';

// --- ADD Local Helper Definitions ---

// Derive Backend Host URL from VITE_API_URL
const getBackendHostUrl = () => {
  const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
  try {
    const url = new URL(apiUrl);
    return url.origin;
  } catch (e) {
    console.error("Could not parse VITE_API_URL to derive host:", apiUrl, e);
    return "http://localhost:5000";
  }
};
const BACKEND_HOST_URL = getBackendHostUrl();

// Construct full file URL - LOCALLY DEFINED WITH FIX
const getFileUrl = (storageKey) => {
  if (!storageKey || typeof storageKey !== "string") {
    return null;
  }
  // FIX: Normalize path separators
  const normalizedStorageKey = storageKey.replace(/\\/g, "/");
  const cleanStorageKey = normalizedStorageKey.startsWith("/")
    ? normalizedStorageKey.substring(1)
    : normalizedStorageKey;
  const fullUrl = `${BACKEND_HOST_URL}/uploads/${cleanStorageKey}`;
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

  // State definitions remain the same
  const [batchName, setBatchName] = useState("");
  const [documents, setDocuments] = useState([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState("Initializing...");
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [processedCount, setProcessedCount] = useState(0);

  const processingStepsCount = steps.length - 2;

  // --- Main Extraction Process (Uses LOCAL getFileUrl) ---
  const startExtraction = useCallback(async () => {
    if (!batchId) {
      setError("No Batch ID found.");
      return;
    }
    setIsProcessing(true);
    setError(null);
    setProcessedCount(0);
    setProgress(0);
    setCurrentStepIndex(0);
    setStatusMessage("Fetching batch information...");

    let fetchedBatch;
    let imageUrlsMap = new Map();

    try {
      // 1. Fetch Batch Data
      fetchedBatch = await batchService.getBatchById(batchId);
      if (
        !fetchedBatch ||
        !fetchedBatch.documents ||
        fetchedBatch.documents.length === 0
      ) {
        throw new Error(
          "No documents found in this batch or batch is invalid."
        );
      }
      setBatchName(fetchedBatch.name);
      setDocuments(fetchedBatch.documents);
      const totalDocs = fetchedBatch.documents.length;
      setProgress(Math.round((1 / (processingStepsCount + 1)) * 100));
      setCurrentStepIndex(1);
      setStatusMessage("Preparing image URLs...");

      // 2. Prepare Image URLs (Uses the LOCAL getFileUrl now)
      imageUrlsMap = new Map();
      const urls = fetchedBatch.documents
        .map((doc) => {
          const url = getFileUrl(doc.storageKey); // Using local fixed function
          if (!url) {
            console.warn(`Could not generate URL for doc ${doc.id}`);
            return null;
          }
          imageUrlsMap.set(url, doc.id);
          return url;
        })
        .filter((url) => url !== null);

      if (urls.length === 0) {
        throw new Error("Could not generate valid URLs for any documents.");
      }

      // Update Batch Status to PROCESSING
      try {
        await batchService.updateBatch(batchId, { status: "PROCESSING" });
      } catch (updateError) {
        console.warn(
          "Could not update batch status to PROCESSING:",
          updateError
        );
      }

      setProgress(Math.round((2 / (processingStepsCount + 1)) * 100));
      setCurrentStepIndex(2);
      setStatusMessage(`Sending ${urls.length} images to AI for extraction...`);

      // 3. Call External OCR Service
      const ocrResults = await textExtractService.extractTextFromImages(urls);

      // 4. Process Results and Update Documents
      setCurrentStepIndex(3);
      let localProcessedCount = 0;
      let anyUpdateFailed = false;
      const initialProgress = progress; // Store progress before starting updates

      for (const [imageUrl, result] of Object.entries(ocrResults)) {
        const docId = imageUrlsMap.get(imageUrl);
        if (!docId) {
          console.warn(`Could not map OCR result URL back: ${imageUrl}`);
          continue;
        }
        const docFileName =
          fetchedBatch.documents.find((d) => d.id === docId)?.fileName || docId;
        setStatusMessage(
          `Saving results for "${docFileName}" (${
            localProcessedCount + 1
          }/${totalDocs})...`
        );

        const payload = {
          status: "COMPLETED",
          extractedContent: result.extracted_text, // Use actual key from OCR response
          accuracy:
            typeof result.accuracy === "number" ? result.accuracy : null,
          precision:
            typeof result.precision === "number" ? result.precision : null, // If provided
          loss: typeof result.loss === "number" ? result.loss : null, // If provided
          // --- ADD COUNTS ---
          // Use the exact keys from your OCR API response object ('result')
          wordCount:
            typeof result.word_count === "number" ? result.word_count : null,
          characterCount:
            typeof result.character_count === "number"
              ? result.character_count
              : null,
        };

        try {
          await batchService.updateDocumentResults(batchId, docId, payload);
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
                  (localProcessedCount / totalDocs) * saveStepRange
              ),
              99
            )
          );
        } catch (docUpdateError) {
          /* ... handle individual update error ... */
          console.error(
            `Failed to update document ${docId} ("${docFileName}"):`,
            docUpdateError
          );
          setError(`Failed to save result for "${docFileName}".`);
          anyUpdateFailed = true;
          try {
            await batchService.updateDocumentResults(batchId, docId, {
              status: "FAILED",
            });
          } catch {}
        }
      }

      // 5. Finalize
      setCurrentStepIndex(4);
      setProgress(100);
      const finalBatchStatus = anyUpdateFailed ? "FAILED" : "COMPLETED";
      setStatusMessage(
        anyUpdateFailed
          ? "Processing finished with some errors."
          : "Processing completed successfully!"
      );

      try {
        await batchService.updateBatch(batchId, { status: finalBatchStatus });
        if (finalBatchStatus === "COMPLETED") {
          await batchService.aggregateBatchMetrics(batchId);
        }
      } catch (finalUpdateError) {
        /* ... handle final update error ... */
        console.error("Failed to update final batch status:", finalUpdateError);
        setError(
          error
            ? error + " | " + `Failed to update final batch status.`
            : `Failed to update final batch status.`
        );
      }
      setIsProcessing(false);
    } catch (err) {
      /* ... Main error handling ... */
      console.error("Extraction process failed:", err);
      setError(err.message || "An unknown error occurred during extraction.");
      setCurrentStepIndex(steps.findIndex((s) => s.key === "fail"));
      setIsProcessing(false);
      if (batchId) {
        try {
          await batchService.updateBatch(batchId, { status: "FAILED" });
        } catch {}
      }
    }
  }, [batchId, navigate]); // Added navigate to dependencies

  // Start extraction on mount
  useEffect(() => {
    startExtraction();
  }, [startExtraction]);

  // --- Actions (Remain the same) ---
  const handleViewResults = () => {
    navigate(`/extraction-results/${batchId}`);
  };
  const handleGoBack = () => {
    if (isProcessing) {
      console.log("Navigating back during processing");
    }
    navigate(-1);
  };

  // Determine visual step index
  const displayStepIndex = error
    ? steps.findIndex((s) => s.key === "fail")
    : currentStepIndex;
  const isCompleted =
    displayStepIndex === steps.findIndex((s) => s.key === "complete");
  const isFailed =
    displayStepIndex === steps.findIndex((s) => s.key === "fail");

  // --- Render ---
  return (
    <div className="flex-1 h-full p-4 md:p-6 overflow-y-auto bg-gray-100 dark:bg-gray-800 rounded-lg">
      <PageHeader title="Text Extraction Progress" showBackArrow={true} />

      <div className="max-w-2xl mx-auto">
        {/* Header Info */}
        <div className="mt-6 mb-8 text-center">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">
            {" "}
            Processing Batch{" "}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {" "}
            Name:{" "}
            <span className="font-medium text-gray-700 dark:text-gray-300">
              {batchName || "Loading..."}
            </span>{" "}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {" "}
            ID:{" "}
            <span className="font-medium text-indigo-600 dark:text-indigo-400 break-all">
              {batchId}
            </span>{" "}
          </p>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 mb-2 overflow-hidden">
          <div
            className={`h-full rounded-full transition-width duration-300 ease-linear ${
              isCompleted
                ? "bg-green-500"
                : isFailed
                ? "bg-red-500"
                : "bg-indigo-600"
            }`}
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        <div className="text-center text-sm font-medium text-gray-700 dark:text-gray-300 mb-8">
          {" "}
          {statusMessage} ({progress.toFixed(0)}%){" "}
        </div>

        {/* Steps Indicator */}
        <div className="space-y-4 mb-10">
          {steps.map((step, index) => {
            if (step.key === "fail" && !error) return null;
            if (step.key === "complete" && error) return null;
            const isActive = index === displayStepIndex;
            const isCompletedStep = index < displayStepIndex && !isFailed;
            const finalComplete = step.key === "complete" && isCompleted;
            return (
              <div
                key={step.key || index}
                className={`flex items-center gap-3 md:gap-4 transition-opacity duration-300 ${
                  !isCompletedStep && !isActive && !finalComplete
                    ? "opacity-50"
                    : ""
                }`}
              >
                {" "}
                <div className="flex-shrink-0">
                  {" "}
                  {finalComplete || (step.key === "complete" && isCompleted) ? (
                    <CheckCircle className="w-6 h-6 text-green-500" />
                  ) : isFailed && step.key === "fail" ? (
                    <AlertTriangle className="w-6 h-6 text-red-500" />
                  ) : isCompletedStep ? (
                    <CheckCircle className="w-6 h-6 text-green-500" />
                  ) : isActive && isProcessing ? (
                    <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
                  ) : (
                    <Circle className="w-6 h-6 text-gray-300 dark:text-gray-600" />
                  )}{" "}
                </div>{" "}
                <div
                  className={`text-sm md:text-base font-medium ${
                    finalComplete || (step.key === "complete" && isCompleted)
                      ? "text-green-600 dark:text-green-400"
                      : isFailed && step.key === "fail"
                      ? "text-red-600 dark:text-red-400"
                      : isCompletedStep
                      ? "text-gray-700 dark:text-gray-300"
                      : isActive
                      ? "text-indigo-600 dark:text-indigo-400"
                      : "text-gray-400 dark:text-gray-500"
                  }`}
                >
                  {" "}
                  {step.name} {isActive && isProcessing && "..."}{" "}
                </div>{" "}
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
              onClick={handleGoBack}
              className="w-full sm:w-auto px-6 py-2.5 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors duration-200 text-sm font-medium flex items-center justify-center gap-2 cursor-pointer"
            >
              <XCircle size={18} /> Cancel
            </button>
          ) : isCompleted ? (
            <>
              <button
                onClick={handleGoBack}
                className="w-full sm:w-auto px-6 py-2.5 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors duration-200 text-sm font-medium flex items-center justify-center gap-2 cursor-pointer"
              >
                Back to Batch
              </button>
              <button
                onClick={handleViewResults}
                className="w-full sm:w-auto px-6 py-2.5 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors duration-200 text-sm font-medium flex items-center justify-center gap-2 cursor-pointer"
              >
                <Eye size={18} /> View Results
              </button>{" "}
            </>
          ) : (
            <>
              {" "}
              <button
                onClick={handleGoBack}
                className="w-full sm:w-auto px-6 py-2.5 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors duration-200 text-sm font-medium flex items-center justify-center gap-2 cursor-pointer"
              >
                Back to Batch
              </button>{" "}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExtractTextPage;
