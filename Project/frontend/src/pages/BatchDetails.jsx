import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { batchService } from '../services/batchService';
import PageHeader from "../components/utility/PageHeader";
import PreviewModal from "../components/utility/PreviewModal"; // Ensure this uses corrected download logic
import ConfirmationModal from "../components/utility/ConfirmationModal";
import SingleDocCard from "../components/SingleDocCard"; // Ensure this uses props correctly
import MetaText from "../components/utility/MetaText";
import { ocrProviders } from "../data/OcrFilters";

// Icons
import { IoArrowForward } from "react-icons/io5";
import { LuCalendarDays, LuCalendarClock } from "react-icons/lu";
import { GrStorage } from "react-icons/gr";
import { MdFolderOpen, MdOutlineInfo } from "react-icons/md";
import { FaHashtag } from "react-icons/fa6";
import { FiLoader, FiAlertTriangle } from 'react-icons/fi';
import { VscServerProcess } from "react-icons/vsc";


// --- Helper Functions ---

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

// Use VITE_API_URL (from frontend .env) directly when constructing download URL
const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/$/, '');


// --- Component ---

const BatchDetails = () => {
    const { batchId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();

    // State
    const [batch, setBatch] = useState(null); // Initialize as null
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [previewModalDoc, setPreviewModalDoc] = useState(null);
    const [confirmDoc, setConfirmDoc] = useState(null);
    const [selectedOcrProvider, setSelectedOcrProvider] = useState('google');

    // --- Data Fetching ---
    const fetchBatch = useCallback(async () => {
        if (!batchId) {
            setError("No Batch ID provided."); setLoading(false); return;
        }
        setLoading(true); setError("");
        try {
            // Fetched data doc.storageKey will be the full preview URL from backend
            const data = await batchService.getBatchById(batchId);
            setBatch(data); // Set the fetched batch data
            if (location.state?.message) {
                console.log("Message from previous page:", location.state.message);
                navigate(location.pathname, { replace: true, state: {} }); // Clear message
            }
        } catch (err) {
            console.error("Error fetching batch details:", err);
            let specificError = err.message || "Failed to load batch details.";
            if (err.status === 404) specificError = `Batch with ID ${batchId} not found.`;
            else if (err.status === 401 || err.status === 403) specificError = "You are not authorized to view this batch.";
            setError(specificError);
            setBatch(null); // Ensure batch is null on error
        } finally {
            setLoading(false);
        }
    }, [batchId, navigate, location]);

    useEffect(() => {
        fetchBatch();
    }, [fetchBatch]);

    // --- Event Handlers ---

    // UPDATED: Prepare data for PreviewModal (with safety check and corrected dependency)
    const handlePreview = useCallback((doc) => {
        // Safety check: Ensure batch and doc (with storageKey) are available
        if (!batch || !doc || !doc.storageKey) {
            const errorMsg = "Cannot preview document: Batch or Document data/URL is missing.";
            console.error(errorMsg, { batch, doc });
            setError(errorMsg);
            return;
        }

        // Construct the correct download URL (points to API endpoint)
        const downloadApiUrl = `${API_BASE_URL}/api/batches/${batch.id}/documents/${doc.id}/download`;

        setPreviewModalDoc({
            ...doc, // Pass original doc data (id, fileName, mimeType, etc.)
            batchId: batch.id, // Pass batchId needed for download service call
            batchName: batch.name, // Pass batch name (access directly, batch is non-null)
            name: doc.fileName, // For display
            preview_url: doc.storageKey, // Use the full preview URL from backend
            download_url: downloadApiUrl, // API endpoint URL (PreviewModal's handleDownload might not use this directly anymore)
        });
    }, [batch]); // *** DEPEND ON 'batch' OBJECT REFERENCE ***

    const requestDeleteDocument = (doc) => {
        setConfirmDoc(doc);
    };

    // Added useCallback and dependency
    const handleConfirmDelete = useCallback(async () => {
        if (!confirmDoc || !batch) return;
        const docIdToDelete = confirmDoc.id;
        // Optional: add a specific loading state for deletion
        try {
            const response = await batchService.deleteDocument(batch.id, docIdToDelete);
            // It's safer to re-fetch the batch after deletion for consistency
            // Or, update state carefully based on response:
            const updatedDocs = batch.documents.filter((d) => d.id !== docIdToDelete);
            setBatch(prevBatch => prevBatch ? ({ // Check prevBatch just in case
                ...prevBatch,
                documents: updatedDocs,
                // Use counts/size from response if available and reliable
                totalFileCount: response.batch?.totalFileCount ?? updatedDocs.length,
                totalFileSize: response.batch?.totalFileSize ?? prevBatch.totalFileSize
            }) : null);
            setError("");
        } catch (error) {
            console.error("Deletion error:", error);
            setError(`Failed to delete document: ${error.message || 'Unknown error'}`);
        } finally {
            setConfirmDoc(null);
        }
    }, [confirmDoc, batch]); // Depend on confirmDoc and batch

    const handleCancelDelete = () => {
        setConfirmDoc(null);
    };

    // --- Updated Extraction Handlers ---

    const handleExtractAll = useCallback(() => {
        // Added safety check for batch
        if (!batch || !batch.documents || batch.documents.length === 0) {
            setError("No documents available in the batch to extract text from."); return;
        };
        // doc.storageKey is already the full preview URL
        const imageUrls = batch.documents
            .map(doc => doc.storageKey)
            .filter(url => !!url); // Filter out any null/empty URLs

        if (imageUrls.length === 0) {
            setError("Could not get valid URLs for any documents in the batch."); return;
        }
        console.log(`Navigating to extraction page for Batch ${batch.id} using ${selectedOcrProvider} for ${imageUrls.length} images.`);
        navigate(`/extract-text/${batch.id}`, {
            state: {
                ocrProvider: selectedOcrProvider,
                imageUrls: imageUrls,
                // Access batch.name safely now
                batchName: batch.name || `Batch ${batch.id}`
            }
        });
    }, [batch, selectedOcrProvider, navigate]); // Dependencies

    const handleTextExtraction = useCallback((doc) => {
         // Added safety check for batch
        if (!batch || !doc) return;
        const imageUrl = doc.storageKey; // Use the full URL directly
        if (!imageUrl) {
            setError(`Could not get a valid URL for document: ${doc.fileName}`); return;
        }
        console.log(`Navigating to extraction page for Doc ${doc.id} (Batch ${batch.id}) using ${selectedOcrProvider}.`);
        navigate(`/extract-text/${batch.id}`, {
            state: {
                ocrProvider: selectedOcrProvider,
                imageUrls: [imageUrl],
                targetDocId: doc.id,
                // Access batch.name safely now
                batchName: batch.name || `Batch ${batch.id}`
            }
        });
    }, [batch, selectedOcrProvider, navigate]); // Dependencies

    // --- Render Logic ---

    if (loading) {
        return (
            <div className="flex flex-col justify-center items-center h-screen text-center p-4">
                <FiLoader className="animate-spin h-10 w-10 text-orange-500 mb-4" />
                <p className="text-gray-500 dark:text-gray-400">Loading batch details...</p>
            </div>
        );
    }

    // Render error AFTER loading is false
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

    // Render not found AFTER loading is false and no error, but batch is still null/undefined
    if (!batch) {
        return (
            <div className="flex justify-center items-center h-screen">
                <p className="text-gray-500 dark:text-gray-400">Batch data could not be loaded or was not found.</p>
            </div>
        );
    }

    // --- Main Component Render (only if loading=false, error="", batch exists) ---
    return (
        <div className="flex-1 h-full px-3 py-6 md:p-6 overflow-y-auto bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
            <PageHeader title="Batch Details" showBackArrow={true}/>

            {/* Batch Metadata Section */}
            <div className="p-4 md:p-6 mb-8 bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
                {/* Accessing batch.name is safe here because !batch check passed */}
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
                             <div className="relative w-full md:w-auto">
                                <label htmlFor="ocrProvider" className="sr-only">Select OCR Provider</label>
                                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                    <VscServerProcess className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                                </div>
                                <select
                                    id="ocrProvider" value={selectedOcrProvider} onChange={(e) => setSelectedOcrProvider(e.target.value)}
                                    className="block w-full pl-10 pr-8 py-2 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500 appearance-none"
                                    aria-label="Select OCR Provider"
                                >
                                    {ocrProviders.map(provider => (<option key={provider.value} value={provider.value}>{provider.label}</option>))}
                                </select>
                             </div>
                             <button
                                 type="button" onClick={handleExtractAll}
                                 disabled={!batch.documents || batch.documents.length === 0} // Simplified disable check
                                 className={`w-full md:w-auto flex items-center justify-center gap-2 px-4 py-2 font-semibold text-white transition-all rounded-md cursor-pointer text-sm ${ (!batch.documents || batch.documents.length === 0) ? 'bg-gray-400 cursor-not-allowed' : 'bg-orange-500 hover:bg-orange-600' }`}
                             >
                                 {batch.status === 'COMPLETED' ? 'Extract Again' : 'Extract Text from All'}
                                 <IoArrowForward className="text-base" />
                             </button>
                         </div>
                     )}
                     {/* ----------------------------- */}
                </div>

                {batch.documents && batch.documents.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {batch.documents.map((doc) => (
                            <SingleDocCard
                                key={doc.id}
                                doc={{
                                    ...doc,
                                    // Pass the full preview URL directly
                                    previewUrl: doc.storageKey,
                                }}
                                batchId={batch.id} // Pass batchId needed by some handlers potentially
                                onPreview={() => handlePreview(doc)} // Triggers modal setup
                                onDelete={() => requestDeleteDocument(doc)}
                                onExtract={() => handleTextExtraction(doc)}
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
            {/* Pass the 'previewModalDoc' state which now contains correctly formatted URLs and IDs */}
            {previewModalDoc && (
                <PreviewModal
                    isOpen={!!previewModalDoc}
                    onClose={() => setPreviewModalDoc(null)}
                    file={previewModalDoc}
                    currentPage={0}
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