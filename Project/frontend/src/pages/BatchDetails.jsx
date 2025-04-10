import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { format } from "date-fns"; // Keep for potential use if needed, but using toLocaleString now
import { batchService } from '../services/batchService'; // Use NEW service
import PageHeader from "../components/utility/PageHeader"; // Assuming exists
import PreviewModal from "../components/utility/PreviewModal"; // Assuming exists
import ConfirmationModal from "../components/utility/ConfirmationModal"; // Assuming exists
import SingleDocCard from "../components/SingleDocCard"; // Assuming exists and is updated
import MetaText from "../components/utility/MetaText"; // Assuming exists

// Icons
import { IoArrowForward } from "react-icons/io5";
import { LuCalendarDays, LuCalendarClock } from "react-icons/lu";
import { GrStorage } from "react-icons/gr";
import { MdFolderOpen, MdOutlineInfo } from "react-icons/md"; // Added Info icon
import { FaHashtag } from "react-icons/fa6";
import { FiLoader, FiAlertTriangle } from 'react-icons/fi'; // Added icons

// --- Helper Functions (Consider moving to utils) ---

// Format bytes (handling string BigInt)
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

// Format ISO date string using locale defaults
const formatDate = (isoString) => {
  if (!isoString) return 'N/A';
  try {
    return new Date(isoString).toLocaleString(undefined, {
        dateStyle: 'medium', timeStyle: 'short'
    });
  } catch (e) { return 'Invalid Date'; }
}

// Derive Backend Host URL from VITE_API_URL
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

// --- Component ---

const BatchDetails = () => {
  const { batchId } = useParams(); // Get batchId from route params
  const navigate = useNavigate();

  // State
  const [batch, setBatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [previewModalDoc, setPreviewModalDoc] = useState(null); // Document for single preview
  const [confirmDoc, setConfirmDoc] = useState(null); // Document for delete confirmation

  // --- Data Fetching ---
  const fetchBatch = useCallback(async () => {
    if (!batchId) {
        setError("No Batch ID provided.");
        setLoading(false);
        return;
    }
    setLoading(true);
    setError("");
    try {
      // Use the new service function
      const data = await batchService.getBatchById(batchId);
      setBatch(data); // The service now returns the formatted batch object
    } catch (err) {
      console.error("Error fetching batch details:", err);
      setError(err.message || "Failed to load batch details.");
      // Handle unauthorized or not found specifically if needed
      if (err.status === 404) {
          setError(`Batch with ID ${batchId} not found.`);
      } else if (err.status === 401 || err.status === 403) {
           setError("You are not authorized to view this batch. Please log in.");
           // Optional: Redirect to login after a delay or on button click
           // setTimeout(() => navigate('/login'), 3000);
      }
    } finally {
      setLoading(false);
    }
  }, [batchId]); // Dependency: batchId

  useEffect(() => {
    fetchBatch();
  }, [fetchBatch]); // Run fetchBatch when it changes (effectively on batchId change)

  // --- Event Handlers ---

  // Open preview modal for a specific document
  const handlePreview = (doc) => {
    const previewUrl = getFileUrl(doc.storageKey); // Construct URL
    if (previewUrl) {
         setPreviewModalDoc({
             ...doc,
             name: doc.fileName, // Use fileName for display name
             preview_url: previewUrl, // Use constructed URL for preview
             download_url: previewUrl, // Use same URL for download link in modal
         });
    } else {
        alert("Could not generate preview URL for this document.");
    }
  };

  // Initiate document deletion confirmation
  const requestDeleteDocument = (doc) => {
    setConfirmDoc(doc); // Store the whole doc object
  };

  // Confirm and execute document deletion
  const handleConfirmDelete = async () => {
    if (!confirmDoc || !batch) return;
    const docIdToDelete = confirmDoc.id;
    try {
      // Use the new service function
      const response = await batchService.deleteDocument(batch.id, docIdToDelete);

      // Update local state optimistically or based on response
      const updatedDocs = batch.documents.filter((d) => d.id !== docIdToDelete);
      // Update batch state with modified documents array and potentially updated counts/size from response
      setBatch({
          ...batch,
          documents: updatedDocs,
          totalFileCount: response.batch.totalFileCount ?? updatedDocs.length, // Use count from response if available
          totalFileSize: response.batch.totalFileSize ?? batch.totalFileSize // Use size from response if available
      });
      setError(""); // Clear any previous errors
    } catch (error) {
      console.error("Deletion error:", error);
      setError(`Failed to delete document: ${error.message}`);
    } finally {
      setConfirmDoc(null); // Close confirmation modal
    }
  };

  // Cancel document deletion
  const handleCancelDelete = () => {
    setConfirmDoc(null);
  };

  // Navigate to extraction page (using batch ID)
  const handleExtractAll = () => {
    if (!batch) return;
    navigate(`/extract-text/${batch.id}`); // Use 'id'
  };

  // Navigate to extraction page for a single doc (might be same page, different handling)
  const handleTextExtraction = (doc) => {
      if (!batch) return;
      // Assuming the extraction page can handle batchId and optionally docId
      navigate(`/extract-text/${batch.id}?docId=${doc.id}`);
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
            onClick={() => navigate("/")} // Navigate back home or to batches list
            className="px-5 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition"
         >
            Back to Home
         </button>
      </div>
    );
  }

   if (!batch) {
      // Should be caught by error handler, but as a fallback
      return (
         <div className="flex justify-center items-center h-screen">
            <p className="text-gray-500 dark:text-gray-400">Batch data not found.</p>
         </div>
      );
   }

  // --- Main Component Render ---
  return (
    <div className="flex-1 h-full px-1 py-6 md:p-6 overflow-y-auto bg-gray-100 dark:bg-gray-900 rounded-lg">
      <PageHeader title="Batch Details" showBackArrow={true}/>

      {/* Batch Metadata Section */}
      <div className="p-4 md:p-6 mb-8 bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
        <h2 className="text-2xl md:text-3xl font-semibold text-gray-800 dark:text-gray-100 mb-4 break-words">
            {batch.name || `Batch ${batch.id}`}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Use updated field names and formatters */}
          <MetaText icon={<FaHashtag />} title="Batch ID" value={batch.id} textSize="xs" canCopy={true} />
          <MetaText icon={<LuCalendarDays />} title="Created On" value={formatDate(batch.createdAt)} textSize="sm"/>
          <MetaText icon={<LuCalendarClock />} title="Last Modified" value={formatDate(batch.updatedAt)} textSize="sm"/>
          <MetaText icon={<MdFolderOpen />} title="Total Files" value={`${batch.totalFileCount ?? 0} File(s)`} textSize="sm"/>
          <MetaText icon={<GrStorage />} title="Total Size" value={formatBytes(batch.totalFileSize)} textSize="sm"/>
          <MetaText icon={<MdOutlineInfo />} title="Status" value={batch.status || 'N/A'} textSize="sm"/>
          {/* Removed "File Types" as it's not directly available */}
        </div>
      </div>

      {/* Documents Section */}
      <div className="p-4 md:p-6 bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
          <h2 className="text-xl md:text-2xl font-semibold text-gray-800 dark:text-gray-100">
            Documents ({batch.documents?.length ?? 0})
          </h2>
          {/* Conditional button based on batch status and document count (Extract Text from All | Extract Again) */}
          {
            batch.status === 'COMPLETED' && batch.documents?.length > 0 ? (
                <button
                type="button"
                onClick={handleExtractAll}
                className="w-full md:w-auto flex items-center justify-center gap-2 px-4 py-2 font-semibold text-white bg-orange-500 hover:bg-orange-600 transition-all rounded-md cursor-pointer text-sm"
              >
                Extract Again
                <IoArrowForward className="text-base" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleExtractAll}
                className="w-full md:w-auto flex items-center justify-center gap-2 px-4 py-2 font-semibold text-white bg-orange-500 hover:bg-orange-600 transition-all rounded-md cursor-pointer text-sm"
              >
                Extract Text from All
                <IoArrowForward className="text-base" />
              </button>
            )
          }
        </div>

        {batch.documents && batch.documents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Map over documents and pass data to SingleDocCard */}
            {batch.documents.map((doc) => (
              <SingleDocCard
                key={doc.id}
                doc={{
                    ...doc,
                    // Pass constructed URLs or let the card handle it
                    previewUrl: getFileUrl(doc.storageKey),
                    downloadUrl: getFileUrl(doc.storageKey)
                }}
                batchId={batch.id} // Pass current batch ID
                // Pass handlers
                onPreview={() => handlePreview(doc)}
                onDelete={() => requestDeleteDocument(doc)}
                onExtract={() => handleTextExtraction(doc)}
                // Pass formatters if SingleDocCard doesn't import/define them
                formatBytes={formatBytes}
                formatDate={formatDate}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-10">
             <p className="text-gray-500 dark:text-gray-400">No documents found in this batch.</p>
             <button
                 onClick={() => navigate('/upload')} // Link to upload page
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
          isOpen={true}
          onClose={() => setPreviewModalDoc(null)}
          // Pass the prepared doc object which includes preview_url/download_url
          file={previewModalDoc}
          // Since it's a single doc preview from card, these are simplified
          currentPage={0}
          totalPages={1}
          onPrev={() => {}} // No prev/next for single doc view
          onNext={() => {}}
          filesList={[previewModalDoc]} // List contains only the current doc
          showDownloadAll={false} // Don't show batch download in single preview
        />
      )}

      {/* Confirmation Modal */}
      {confirmDoc && (
        <ConfirmationModal
          isOpen={true}
          title="Confirm Deletion"
          message={`Are you sure you want to delete "${confirmDoc.fileName || confirmDoc.id}"? This action cannot be undone.`}
          confirmText="Delete"
          cancelText="Cancel"
          variant="danger" // Or your theme's danger variant
          onConfirm={handleConfirmDelete}
          onCancel={handleCancelDelete}
        />
      )}
    </div>
  );
};

export default BatchDetails;