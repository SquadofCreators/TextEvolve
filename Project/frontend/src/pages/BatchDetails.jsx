import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom"; // Added useLocation
// Removed date-fns import as it wasn't strictly needed with toLocaleString
import { batchService } from '../services/batchService';
import PageHeader from "../components/utility/PageHeader";
import PreviewModal from "../components/utility/PreviewModal";
import ConfirmationModal from "../components/utility/ConfirmationModal";
import SingleDocCard from "../components/SingleDocCard";
import MetaText from "../components/utility/MetaText";
import { ocrProviders } from "../data/OcrFilters"; // Import OCR providers

// Icons (ensure these are installed/available)
import { IoArrowForward } from "react-icons/io5";
import { LuCalendarDays, LuCalendarClock } from "react-icons/lu";
import { GrStorage } from "react-icons/gr";
import { MdFolderOpen, MdOutlineInfo } from "react-icons/md";
import { FaHashtag } from "react-icons/fa6";
import { FiLoader, FiAlertTriangle } from 'react-icons/fi';
import { VscServerProcess } from "react-icons/vsc"; // Icon for OCR selection


// --- Helper Functions (Consider moving to utils) ---

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
    size /= k;
    i++;
  }
  const numSize = Number(bytes) / Number(k ** BigInt(i));
  return parseFloat(numSize.toFixed(dm)) + ' ' + sizes[i];
}

const formatDate = (isoString) => {
  if (!isoString) return 'N/A';
  try {
    return new Date(isoString).toLocaleString(undefined, {
      dateStyle: 'medium', timeStyle: 'short'
    });
  } catch (e) { return 'Invalid Date'; }
}

const getBackendHostUrl = () => {
    // Prefer AI API URL if defined for consistency, fallback to API_URL
    const baseUrl = import.meta.env.VITE_AI_API_URL || import.meta.env.VITE_API_URL || 'http://localhost:5000';
    try { return new URL(baseUrl).origin; } catch (e) { return 'http://localhost:5000'; } // Adjust fallback if needed
}
const BACKEND_HOST_URL = getBackendHostUrl();

// Construct full file URL relative to the /uploads endpoint of the *main* API, not AI API
const getFileUrl = (storageKey) => {
    if (!storageKey) return null;
    // Use VITE_API_URL (or its origin) specifically for uploads if they are served from there
    const apiOrigin = import.meta.env.VITE_API_URL ? new URL(import.meta.env.VITE_API_URL).origin : BACKEND_HOST_URL;
    const uploadsBase = import.meta.env.VITE_API_URL_IMAGE_BASE || `${apiOrigin}/uploads`; // Use specific image base if defined

    const cleanStorageKey = storageKey.startsWith('/') ? storageKey.substring(1) : storageKey;
    // Ensure no double slashes if uploadsBase ends with / and cleanStorageKey starts with / (though unlikely now)
    return `${uploadsBase.replace(/\/$/, '')}/${cleanStorageKey}`;
}


// --- Component ---

const BatchDetails = () => {
  const { batchId } = useParams();
  const navigate = useNavigate();
  const location = useLocation(); // Get location state if coming back from extraction

  // State
  const [batch, setBatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [previewModalDoc, setPreviewModalDoc] = useState(null);
  const [confirmDoc, setConfirmDoc] = useState(null);
  // --- New State for OCR Selection ---
  const [selectedOcrProvider, setSelectedOcrProvider] = useState(ocrProviders[0]?.value || 'azure'); // Default to first provider or 'azure'

  // --- Data Fetching ---
  const fetchBatch = useCallback(async () => {
    if (!batchId) {
      setError("No Batch ID provided.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(""); // Clear previous errors on new fetch
    try {
      const data = await batchService.getBatchById(batchId);
      setBatch(data);
       // Check location state for messages from other pages (e.g., extraction started)
      if (location.state?.message) {
           // Display temporary message (consider a toast notification library)
           console.log("Message from previous page:", location.state.message);
           // Clear the state to prevent message persisting on refresh/re-render
           navigate(location.pathname, { replace: true, state: {} });
       }
    } catch (err) {
      console.error("Error fetching batch details:", err);
      let specificError = err.message || "Failed to load batch details.";
      if (err.status === 404) {
          specificError = `Batch with ID ${batchId} not found.`;
      } else if (err.status === 401 || err.status === 403) {
          specificError = "You are not authorized to view this batch. Please log in.";
      }
      setError(specificError);
    } finally {
      setLoading(false);
    }
  }, [batchId, navigate, location]); 

  useEffect(() => {
    fetchBatch();
  }, [fetchBatch]);

  // --- Event Handlers ---

  const handlePreview = (doc) => {
    const previewUrl = getFileUrl(doc.storageKey);
    if (previewUrl) {
        setPreviewModalDoc({
            ...doc,
            name: doc.fileName,
            preview_url: previewUrl,
            download_url: previewUrl,
        });
    } else {
        setError("Could not generate preview URL for this document."); // Show error feedback
        console.error("Failed URL generation for storageKey:", doc.storageKey);
    }
  };

  const requestDeleteDocument = (doc) => {
    setConfirmDoc(doc);
  };

  const handleConfirmDelete = async () => {
    if (!confirmDoc || !batch) return;
    const docIdToDelete = confirmDoc.id;
    // Add loading indicator specifically for delete if needed
    try {
      const response = await batchService.deleteDocument(batch.id, docIdToDelete);
      const updatedDocs = batch.documents.filter((d) => d.id !== docIdToDelete);
      setBatch({
        ...batch,
        documents: updatedDocs,
        // Use counts/size from response if available, otherwise recalculate (or just update count)
        totalFileCount: response.batch?.totalFileCount ?? updatedDocs.length,
        totalFileSize: response.batch?.totalFileSize ?? batch.totalFileSize // Keep old size if not returned, recalculating is harder client-side
      });
      setError("");
    } catch (error) {
      console.error("Deletion error:", error);
      setError(`Failed to delete document: ${error.message || 'Unknown error'}`);
    } finally {
      setConfirmDoc(null);
    }
  };

  const handleCancelDelete = () => {
    setConfirmDoc(null);
  };

  // --- Updated Extraction Handlers ---

  // Navigate to extraction page for the whole batch
  const handleExtractAll = () => {
    if (!batch || !batch.documents || batch.documents.length === 0) {
        setError("No documents available in the batch to extract text from.");
        return;
    };

    const imageUrls = batch.documents
      .map(doc => getFileUrl(doc.storageKey))
      .filter(url => url !== null); // Filter out any potentially null URLs

    if (imageUrls.length === 0) {
        setError("Could not generate valid URLs for any documents in the batch.");
        return;
    }

    console.log(`Navigating to extraction page for Batch ${batch.id} using ${selectedOcrProvider} for ${imageUrls.length} images.`);
    // Navigate to a dedicated page/component to handle the API call
    navigate(`/extract-text/${batch.id}`, {
        state: {
            ocrProvider: selectedOcrProvider,
            imageUrls: imageUrls, // Pass the list of URLs
            batchName: batch.name || `Batch ${batch.id}` // Pass batch name for display
        }
    });
  };

  // Navigate to extraction page for a single document
  const handleTextExtraction = (doc) => {
    if (!batch || !doc) return;

    const imageUrl = getFileUrl(doc.storageKey);
    if (!imageUrl) {
        setError(`Could not generate a valid URL for document: ${doc.fileName}`);
        return;
    }

    console.log(`Navigating to extraction page for Doc ${doc.id} (Batch ${batch.id}) using ${selectedOcrProvider}.`);
    // Navigate, passing single image details
    navigate(`/extract-text/${batch.id}`, {
        state: {
            ocrProvider: selectedOcrProvider,
            imageUrls: [imageUrl], // Pass URL as a single-item array
            targetDocId: doc.id, // Identify the specific document if needed on next page
            batchName: batch.name || `Batch ${batch.id}`
        }
    });
  };


  // --- Render Logic ---

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-screen text-center p-4">
        <FiLoader className="animate-spin h-10 w-10 text-orange-500 mb-4" />
        <p className="text-gray-500 dark:text-gray-400">Loading batch details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col justify-center items-center h-screen text-center p-4">
        <FiAlertTriangle className="h-12 w-12 text-red-500 mb-4" />
        <p className="text-red-600 dark:text-red-400 font-semibold mb-2">Error Loading Batch</p>
        <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
        <button
          onClick={() => navigate("/")}
          className="px-5 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition"
        >
          Back to Home
        </button>
      </div>
    );
  }

   if (!batch) {
     return (
       <div className="flex justify-center items-center h-screen">
         <p className="text-gray-500 dark:text-gray-400">Batch data not found.</p>
       </div>
     );
   }

  // --- Main Component Render ---
  return (
    <div className="flex-1 h-full px-3 py-6 md:p-6 overflow-y-auto bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
      <PageHeader title="Batch Details" showBackArrow={true}/>

      {/* Batch Metadata Section */}
      <div className="p-4 md:p-6 mb-8 bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
        <h2 className="text-2xl md:text-3xl font-semibold text-gray-800 dark:text-gray-100 mb-4 break-words">
            {batch.name || `Batch ${batch.id}`}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <MetaText icon={<FaHashtag />} title="Batch ID" value={batch.id} textSize="xs" canCopy={true} />
          <MetaText icon={<LuCalendarDays />} title="Created On" value={formatDate(batch.createdAt)} textSize="sm"/>
          <MetaText icon={<LuCalendarClock />} title="Last Modified" value={formatDate(batch.updatedAt)} textSize="sm"/>
          <MetaText icon={<MdFolderOpen />} title="Total Files" value={`${batch.totalFileCount ?? (batch.documents?.length ?? 0)} File(s)`} textSize="sm"/>
          <MetaText icon={<GrStorage />} title="Total Size" value={formatBytes(batch.totalFileSize)} textSize="sm"/>
          <MetaText icon={<MdOutlineInfo />} title="Status" value={batch.status || 'N/A'} textSize="sm"/>
        </div>
      </div>

      {/* Documents Section */}
      <div className="p-4 md:p-6 bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
          <h2 className="text-xl md:text-2xl font-semibold text-gray-800 dark:text-gray-100">
            Documents ({batch.documents?.length ?? 0})
          </h2>

          {/* --- OCR Selection and Action --- */}
          {batch.documents && batch.documents.length > 0 && (
             <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 w-full md:w-auto">
                {/* Dropdown for OCR Provider Selection */}
                 <div className="relative w-full md:w-auto">
                    <label htmlFor="ocrProvider" className="sr-only">Select OCR Provider</label>
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                        <VscServerProcess className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                    </div>
                    <select
                        id="ocrProvider"
                        value={selectedOcrProvider}
                        onChange={(e) => setSelectedOcrProvider(e.target.value)}
                        className="block w-full pl-10 pr-8 py-2 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500 appearance-none" // Added appearance-none for custom arrow potentially needed
                        aria-label="Select OCR Provider"
                    >
                        {ocrProviders.map(provider => (
                            <option key={provider.value} value={provider.value}>
                                {provider.label}
                            </option>
                        ))}
                    </select>
                     {/* You might need custom styling for the dropdown arrow if appearance-none is used */}
                     {/* <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none"> ... Arrow SVG ... </div> */}
                 </div>

                {/* Action Button */}
                <button
                    type="button"
                    onClick={handleExtractAll}
                    disabled={!batch || !batch.documents || batch.documents.length === 0} // Disable if no docs
                    className={`w-full md:w-auto flex items-center justify-center gap-2 px-4 py-2 font-semibold text-white transition-all rounded-md cursor-pointer text-sm ${
                        (!batch || !batch.documents || batch.documents.length === 0)
                            ? 'bg-gray-400 cursor-not-allowed'
                            : 'bg-orange-500 hover:bg-orange-600'
                    }`}
                >
                    {batch.status === 'COMPLETED' ? 'Extract Again' : 'Extract Text from All'}
                    <IoArrowForward className="text-base" />
                </button>
             </div>
          )}
          {/* --- End OCR Selection and Action --- */}

        </div>

        {batch.documents && batch.documents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {batch.documents.map((doc) => (
              <SingleDocCard
                key={doc.id}
                doc={{
                    ...doc,
                    // Generate URLs here or let the card do it if preferred
                    previewUrl: getFileUrl(doc.storageKey),
                    downloadUrl: getFileUrl(doc.storageKey)
                }}
                batchId={batch.id}
                onPreview={() => handlePreview(doc)}
                onDelete={() => requestDeleteDocument(doc)}
                onExtract={() => handleTextExtraction(doc)} // Use the updated single doc handler
                formatBytes={formatBytes}
                formatDate={formatDate}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-10">
            <p className="text-gray-500 dark:text-gray-400">No documents found in this batch.</p>
            <button
                onClick={() => navigate('/upload')}
                className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition text-sm"
            >
                Upload Documents
            </button>
          </div>
        )}
      </div>

      {/* Preview Modal */}
      {previewModalDoc && (
        <PreviewModal
          isOpen={!!previewModalDoc} // Use boolean coercion for clarity
          onClose={() => setPreviewModalDoc(null)}
          file={previewModalDoc}
          currentPage={0} // For single doc preview, always first/only page
          totalPages={1}
          onPrev={() => {}}
          onNext={() => {}}
          filesList={[previewModalDoc]}
          showDownloadAll={false}
        />
      )}

      {/* Confirmation Modal */}
      {confirmDoc && (
        <ConfirmationModal
          isOpen={!!confirmDoc}
          title="Confirm Deletion"
          message={`Are you sure you want to delete "${confirmDoc.fileName || confirmDoc.id}"? This action cannot be undone.`}
          confirmText="Delete"
          cancelText="Cancel"
          variant="danger"
          onConfirm={handleConfirmDelete}
          onCancel={handleCancelDelete}
        />
      )}
    </div>
  );
};

export default BatchDetails;