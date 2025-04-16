// src/pages/LandingPage.jsx

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
import DocCard from '../components/DocCard'; // Use the updated DocCard
import PreviewModal from '../components/utility/PreviewModal';

// Import Services
import { batchService } from '../services/batchService';
import { authService } from '../services/authService';
import { FiAlertTriangle, FiLogIn, FiLoader } from 'react-icons/fi';

// --- Local Helper Function Definitions ---

const formatBytes = (bytes, decimals = 1) => { // Defaulted decimals to 1 for card
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

const getFileUrl = (storageKey) => {
    if (!storageKey || typeof storageKey !== 'string') return null;
    const apiOrigin = import.meta.env.VITE_API_URL ? new URL(import.meta.env.VITE_API_URL).origin : 'http://localhost:5000';
    const uploadsBase = import.meta.env.VITE_API_URL_IMAGE_BASE || `${apiOrigin}/uploads`;
    const normalizedStorageKey = storageKey.replace(/\\/g, "/");
    const cleanStorageKey = normalizedStorageKey.startsWith('/') ? normalizedStorageKey.substring(1) : normalizedStorageKey;
    return `${uploadsBase.replace(/\/$/, '')}/${cleanStorageKey}`;
}

// --- Component Definition ---

function LandingPage() {
    const { darkMode } = useTheme(); // Assuming darkMode is used for styling elsewhere
    const navigate = useNavigate();

    // State
    const [batches, setBatches] = useState([]);
    const [loadingBatches, setLoadingBatches] = useState(true);
    const [batchesError, setBatchesError] = useState(null);
    const [isLoggedIn, setIsLoggedIn] = useState(null);
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
                // Don't set an error, just show logged-out state
                // setBatchesError("Please log in to view recent batches.");
                setLoadingBatches(false);
                return;
            }
            try {
                const fetchedBatches = await batchService.getMyBatches();
                // Sort by most recently updated/created
                const sortedBatches = fetchedBatches.sort((a, b) =>
                    new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0)
                );
                setBatches(sortedBatches.slice(0, 8)); // Show up to 8 recent batches for grid layout
                setBatchesError(null);
            } catch (err) {
                console.error("Error fetching batches:", err);
                setBatchesError(err.message || "Failed to fetch batches.");
                // If unauthorized, log out and update state
                if (err.status === 401 || err.status === 403) {
                    authService.logout(); // Assuming this clears token/user info
                    setIsLoggedIn(false);
                    setBatchesError("Session expired. Please log in again.");
                }
            } finally {
                setLoadingBatches(false);
            }
        }
        fetchBatches();
    }, [isLoggedIn]); // Dependency: re-fetch if login status changes

    // Banner logos (keep as is)
    const bannerLogos = [
        { name: 'Tamil Nadu Govt.', logo: TNLogo, link: 'https://www.tn.gov.in/' },
        { name: 'Naan Mudhalvan', logo: NMLogo, link: 'https://naanmudhalvan.tn.gov.in/' },
        { name: 'Niral Thiruvizha', logo: NTLogo, link: 'https://niralthiruvizha.in/' },
        { name: 'Anna University', logo: AULogo, link: 'https://www.annauniv.edu/' },
    ];

    // Preview handler (keep as is)
    const handlePreview = useCallback(async (batch) => {
        setIsPreviewLoading(true); setPreviewError(null); setBatchesError(null);
        try {
            const fullBatch = await batchService.getBatchById(batch.id);
            if (fullBatch.documents && fullBatch.documents.length > 0) {
                const docsWithUrls = fullBatch.documents.map((doc) => ({
                    ...doc, batchId: fullBatch.id, name: doc.fileName,
                    preview_url: getFileUrl(doc.storageKey), download_url: getFileUrl(doc.storageKey),
                }));
                setPreviewModalDocs(docsWithUrls); setPreviewModalIndex(0);
            } else { setPreviewError('No documents found in this batch to preview.'); }
        } catch (error) {
            console.error("Error fetching batch details for preview:", error);
            setPreviewError(`Could not load documents for preview: ${error.message}`);
        } finally { setIsPreviewLoading(false); }
    }, []);

    // Navigate to results page
    const handleViewResults = useCallback((batch) => {
        navigate(`/extraction-results/${batch.id}`);
    }, [navigate]);

    // Modal controls (keep as is)
    const closeModal = () => setPreviewModalIndex(null);
    const prevDoc = () => setPreviewModalIndex((i) => (i !== null && i > 0 ? i - 1 : i));
    const nextDoc = () => setPreviewModalIndex((i) => (i !== null && i < previewModalDocs.length - 1 ? i + 1 : i));

    // --- Rendering ---
    return (
        <div className="px-4 py-6 md:px-4 md:py-4"> {/* Adjusted padding */}
            {/* Banner Section (keep as is) */}
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

                {/* Loading/Error States for Preview */}
                {isPreviewLoading && <div className="text-center text-orange-600 dark:text-orange-400 p-4 mb-4"><FiLoader className="inline animate-spin mr-2"/> Loading preview data...</div>}
                {previewError && <div className="text-center text-red-600 dark:text-red-400 p-4 mb-4 border border-red-300 dark:border-red-600 bg-red-50 dark:bg-red-900/30 rounded-md shadow-sm"><FiAlertTriangle className="inline mr-1 mb-0.5"/> {previewError}</div>}

                {/* Main Batches Display */}
                {loadingBatches ? (
                     <div className="text-center text-gray-500 dark:text-gray-400 p-6"><FiLoader className="inline animate-spin mr-2"/> Loading batches...</div>
                ) : batchesError ? (
                    <div className="text-center p-4 border border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/30 rounded-md shadow-sm">
                        <p className="text-red-600 dark:text-red-300 font-semibold flex items-center justify-center gap-2"><FiAlertTriangle/> Error Loading Batches</p>
                        <p className="text-red-500 dark:text-red-400 text-sm mt-1">{batchesError}</p>
                        {/* Show login button only if the error is auth-related or explicitly not logged in */}
                        {(!isLoggedIn || batchesError.includes("log in")) && (
                            <button onClick={() => navigate('/login')} className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition text-sm inline-flex items-center gap-2"><FiLogIn /> Go to Login</button>
                        )}
                    </div>
                ) : !isLoggedIn ? (
                     <div className="text-center space-y-4 p-6 border border-dashed border-gray-300 dark:border-gray-600 rounded-md">
                        <p className="text-gray-500 dark:text-gray-400">Please log in to view your batches.</p>
                        <button onClick={() => navigate('/login')} className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition">Log In</button>
                    </div>
                ) : batches.length > 0 ? (
                    // --- MODIFIED Responsive Grid Layout ---
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
                         {batches.map((batch) => (
                             <DocCard
                                 key={batch.id}
                                 data={batch}
                                 onPreview={() => handlePreview(batch)}
                                 // onExtractData prop is removed here
                                 onViewResults={() => handleViewResults(batch)}
                                 formatDate={formatDate}
                                 formatBytes={formatBytes}
                             />
                         ))}
                    </div>
                    // ----------------------------------------
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
                  file={previewModalDocs[previewModalIndex]}
                  currentPage={previewModalIndex} totalPages={previewModalDocs.length}
                  onPrev={prevDoc} onNext={nextDoc}
                  filesList={previewModalDocs}
                />
            )}
        </div>
    );
}

export default LandingPage;