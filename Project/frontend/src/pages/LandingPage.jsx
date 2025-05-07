import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';

// Asset Imports
import BannerImg from '../assets/images/banner-bg.jpg';
import TNLogo from '../assets/images/logos/tn-logo.svg';
import NMLogo from '../assets/images/logos/nm-logo.svg';
import NTLogo from '../assets/images/logos/nt-logo.svg';
import AULogo from '../assets/images/logos/au-logo.svg';

// Component Imports
import DocCard from '../components/DocCard';
import PreviewModal from '../components/utility/PreviewModal';

// Import Services
import { batchService } from '../services/batchService';
import { authService } from '../services/authService';
import { FiAlertTriangle, FiLogIn, FiLoader } from 'react-icons/fi';

// --- Local Helper Function Definitions ---

const formatBytes = (bytes, decimals = 1) => {
    if (bytes === undefined || bytes === null) return 'N/A';
    let numBytes;
    try { numBytes = BigInt(bytes); } catch (e) {
        const parsedNum = parseFloat(bytes);
        if (!isNaN(parsedNum)) { numBytes = BigInt(Math.round(parsedNum)); }
        else { return 'Invalid Size'; }
    }
    if (numBytes === 0n) return '0 Bytes';
    const k = 1024n; const dm = decimals < 0 ? 0 : decimals; const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    let i = 0; let size = numBytes;
    while (size >= k && i < sizes.length - 1) { size /= k; i++; }
    const numSize = Number(numBytes) / Number(k ** BigInt(i));
    return parseFloat(numSize.toFixed(dm)) + ' ' + sizes[i];
}

const formatDate = (isoString) => {
    if (!isoString) return 'N/A';
    try { return new Date(isoString).toLocaleString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }); }
    catch (e) { return 'Invalid Date'; }
}

/*
// getFileUrl function:
// Doc.storageKey from the backend is now the full direct preview URL.
// This function was previously used to construct full URLs from relative paths.
// If storageKey is already a full URL for previews, this function might only be needed
// if you have other use cases for converting relative paths.
// For the current preview/download flow, we will handle URLs explicitly.

const getFileUrl = (storageKey) => {
    if (!storageKey || typeof storageKey !== 'string') return null;

    // If storageKey is already a full URL, return it as is
    if (storageKey.startsWith('http://') || storageKey.startsWith('https://')) {
        return storageKey;
    }

    // Otherwise, construct the URL (assuming it's a relative path and you need to)
    // This part assumes VITE_API_URL is the base and /uploads is the folder
    const apiOrigin = import.meta.env.VITE_API_URL ? new URL(import.meta.env.VITE_API_URL).origin : 'http://localhost:5000';
    const uploadsBase = import.meta.env.VITE_API_URL_IMAGE_BASE || `${apiOrigin}/uploads`;
    const normalizedStorageKey = storageKey.replace(/\\/g, "/");
    const cleanStorageKey = normalizedStorageKey.startsWith('/') ? normalizedStorageKey.substring(1) : normalizedStorageKey;
    return `${uploadsBase.replace(/\/$/, '')}/${cleanStorageKey}`;
}
*/

// --- Component Definition ---

function LandingPage() {
    const { darkMode } = useTheme();
    const navigate = useNavigate();

    // State
    const [batches, setBatches] = useState([]);
    const [loadingBatches, setLoadingBatches] = useState(true);
    const [batchesError, setBatchesError] = useState(null);
    const [isLoggedIn, setIsLoggedIn] = useState(null); // null: unknown, true: logged in, false: not logged in
    const [previewModalDocs, setPreviewModalDocs] = useState([]);
    const [previewModalIndex, setPreviewModalIndex] = useState(null);
    const [isPreviewLoading, setIsPreviewLoading] = useState(false);
    const [previewError, setPreviewError] = useState(null);

    // Check login status on mount
    useEffect(() => {
        window.scrollTo(0, 0);
        setIsLoggedIn(!!authService.getToken());
    }, []);

    // Fetch batches when login status is determined
    useEffect(() => {
        if (isLoggedIn === null) return; // Wait until login status is known

        async function fetchBatches() {
            setLoadingBatches(true); setBatchesError(null); setBatches([]);
            if (!isLoggedIn) {
                setLoadingBatches(false);
                return;
            }
            try {
                const fetchedBatches = await batchService.getMyBatches();
                const sortedBatches = fetchedBatches.sort((a, b) =>
                    new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0)
                );
                setBatches(sortedBatches.slice(0, 6));
                setBatchesError(null);
            } catch (err) {
                console.error("Error fetching batches:", err);
                let errorMessage = err.message || "Failed to fetch batches.";
                if (err.status === 401 || err.status === 403) {
                    authService.logout();
                    setIsLoggedIn(false); // Update login state
                    errorMessage = "Session expired or unauthorized. Please log in again.";
                }
                setBatchesError(errorMessage);
            } finally {
                setLoadingBatches(false);
            }
        }
        fetchBatches();
    }, [isLoggedIn]);

    const bannerLogos = [
        { name: 'Tamil Nadu Govt.', logo: TNLogo, link: 'https://www.tn.gov.in/' },
        { name: 'Naan Mudhalvan', logo: NMLogo, link: 'https://naanmudhalvan.tn.gov.in/' },
        { name: 'Niral Thiruvizha', logo: NTLogo, link: 'https://niralthiruvizha.in/' },
        { name: 'Anna University', logo: AULogo, link: 'https://www.annauniv.edu/' },
    ];

    const handlePreview = useCallback(async (batch) => {
        setIsPreviewLoading(true); setPreviewError(null); setBatchesError(null);
        try {
            const fullBatch = await batchService.getBatchById(batch.id);
            if (fullBatch.documents && fullBatch.documents.length > 0) {
                // Get the base API URL from environment variables or a default
                // Ensure VITE_API_URL is set in your .env file (e.g., VITE_API_URL=https://api.textevolve.in)
                const apiBaseUrl = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/$/, '');

                const docsWithUrls = fullBatch.documents.map((doc) => ({
                    ...doc, // doc object from backend; doc.storageKey is the full public URL for preview
                    batchId: fullBatch.id, // Pass batchId for context if needed by modal/download all
                    batchName: fullBatch.name, // Pass batchName for "Download All" zip filename
                    name: doc.fileName, // Use original fileName
                    // doc.storageKey from backend is now the full direct URL for previewing (e.g., https://.../uploads/file.jpg)
                    preview_url: doc.storageKey,
                    // Construct download_url to point to your backend's dedicated download API endpoint
                    download_url: `${apiBaseUrl}/api/batches/${fullBatch.id}/documents/${doc.id}/download`,
                }));
                setPreviewModalDocs(docsWithUrls);
                setPreviewModalIndex(0);
            } else {
                setPreviewError('No documents found in this batch to preview.');
            }
        } catch (error) {
            console.error("Error fetching batch details for preview:", error);
            let errorMessage = error.message || "Failed to load documents for preview.";
             if (error.status === 401 || error.status === 403) {
                errorMessage = "Session expired or unauthorized. Please log in again to view documents.";
                // authService.logout(); // Consider if auto-logout is desired here
                // setIsLoggedIn(false); // Reflect change immediately
            }
            setPreviewError(errorMessage);
        } finally {
            setIsPreviewLoading(false);
        }
    }, [navigate]); // Added navigate as a dependency in case you use it for redirection on auth errors

    const handleViewResults = useCallback((batch) => {
        navigate(`/extraction-results/${batch.id}`);
    }, [navigate]);

    const handleDeleteBatch = useCallback(async (batch) => {
        if (!window.confirm(`Are you sure you want to delete the batch "${batch.name || batch.id}"?\nThis action cannot be undone.`)) return;
        setLoadingBatches(true);
        setBatchesError(null);
        try {
            await batchService.deleteBatch(batch.id);
            // Re-fetch batches to update the list
            const updatedBatches = await batchService.getMyBatches();
             const sortedBatches = updatedBatches.sort((a, b) =>
                new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0)
            );
            setBatches(sortedBatches.slice(0, 6));
        } catch (error) {
            console.error(`Error deleting batch ${batch.id}:`, error);
            setBatchesError(`Failed to delete batch: ${error.message}`);
        } finally {
            setLoadingBatches(false);
        }
    }, []);


    const closeModal = () => setPreviewModalIndex(null);
    const prevDoc = () => setPreviewModalIndex((i) => (i !== null && i > 0 ? i - 1 : i));
    const nextDoc = () => setPreviewModalIndex((i) => (i !== null && i < previewModalDocs.length - 1 ? i + 1 : i));

    return (
        <div className="px-4 py-6 md:px-4 md:py-4">
            {/* Banner Section */}
            <div className="relative rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 select-none shadow-lg mb-10 md:mb-5">
                <img src={BannerImg} alt="Digitization Banner" className="object-cover w-full h-56 md:h-64"/>
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent dark:from-black/80 dark:via-black/40"></div>
                <div className="absolute inset-0 flex flex-col items-center justify-between py-6 px-4 gap-3 text-white">
                    <div className="flex items-center justify-center flex-wrap gap-6 md:gap-8 filter drop-shadow">
                        {bannerLogos.map((logo, index) => ( <a key={index} href={logo.link} target="_blank" rel="noopener noreferrer" className="opacity-90 hover:opacity-100 transition-opacity"><img src={logo.logo} alt={logo.name} className="w-10 h-10 md:w-12 md:h-12" /></a> ))}
                    </div>
                    <div className="text-center filter drop-shadow-lg">
                        <h1 className="text-3xl md:text-4xl font-bold">Digitize <span className="text-orange-400">History,</span> <br /> Empower the Future</h1>
                        <p className="hidden md:block text-base text-gray-200 mt-2 max-w-2xl mx-auto">Transform handwritten records and archival documents into accessible, searchable digital formats.</p>
                    </div>
                    <div className="h-10 md:h-12"></div> {/* Spacer */}
                </div>
            </div>

            {/* Recent Batches Section */}
            <div className="w-full px-1 mt-5">
                <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-5">Recent Batches</h2>

                {isPreviewLoading && <div className="text-center text-orange-600 dark:text-orange-400 p-4 mb-4"><FiLoader className="inline animate-spin mr-2"/> Loading preview data...</div>}
                {previewError && <div className="text-center text-red-600 dark:text-red-400 p-4 mb-4 border border-red-300 dark:border-red-600 bg-red-50 dark:bg-red-900/30 rounded-md shadow-sm"><FiAlertTriangle className="inline mr-1 mb-0.5"/> {previewError}</div>}

                {loadingBatches ? (
                     <div className="text-center text-gray-500 dark:text-gray-400 p-6"><FiLoader className="inline animate-spin mr-2"/> Loading batches...</div>
                ) : batchesError ? (
                    <div className="text-center p-4 border border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/30 rounded-md shadow-sm">
                        <p className="text-red-600 dark:text-red-300 font-semibold flex items-center justify-center gap-2"><FiAlertTriangle/> Error Loading Batches</p>
                        <p className="text-red-500 dark:text-red-400 text-sm mt-1">{batchesError}</p>
                        {(!isLoggedIn || batchesError.includes("log in") || batchesError.includes("unauthorized")) && (
                            <button onClick={() => navigate('/login')} className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition text-sm inline-flex items-center gap-2"><FiLogIn /> Go to Login</button>
                        )}
                    </div>
                ) : !isLoggedIn ? (
                     <div className="text-center space-y-4 p-6 border border-dashed border-gray-300 dark:border-gray-600 rounded-md">
                        <p className="text-gray-500 dark:text-gray-400">Please log in to view your batches.</p>
                        <button onClick={() => navigate('/login')} className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition">Log In</button>
                    </div>
                ) : batches.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
                         {batches.map((batch) => (
                             <DocCard
                                 key={batch.id}
                                 data={batch}
                                 onPreview={() => handlePreview(batch)}
                                 onViewResults={() => handleViewResults(batch)}
                                 onDeleteBatch={() => handleDeleteBatch(batch)}
                                 formatDate={formatDate}
                                 formatBytes={formatBytes}
                             />
                         ))}
                    </div>
                ) : (
                     <div className="text-center space-y-4 p-6 border border-dashed border-gray-300 dark:border-gray-600 rounded-md">
                        <p className="text-gray-500 dark:text-gray-400">You haven't created any batches yet.</p>
                        <button onClick={() => navigate('/upload')} className="px-6 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition">Upload Your First Batch</button>
                    </div>
                 )}
            </div>

            {/* Preview Modal */}
            {previewModalIndex !== null && previewModalDocs.length > 0 && (
                <PreviewModal
                  isOpen={true} onClose={closeModal}
                  file={previewModalDocs[previewModalIndex]} // Contains preview_url and download_url
                  currentPage={previewModalIndex} totalPages={previewModalDocs.length}
                  onPrev={prevDoc} onNext={nextDoc}
                  filesList={previewModalDocs} // Used for "Download All"
                />
            )}
        </div>
    );
}

export default LandingPage;