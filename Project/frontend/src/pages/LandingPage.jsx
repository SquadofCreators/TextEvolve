import React, { useState, useEffect, useCallback } from 'react'; // Added useCallback
import { useNavigate } from 'react-router-dom'; // For redirection
import { useTheme } from '../contexts/ThemeContext'; // Assuming this context exists

// Asset Imports (keep as is)
import BannerImg from '../assets/images/banner-bg.jpg';
import TNLogo from '../assets/images/logos/tn-logo.svg';
import NMLogo from '../assets/images/logos/nm-logo.svg';
import NTLogo from '../assets/images/logos/nt-logo.svg';
import AULogo from '../assets/images/logos/au-logo.svg';

// Component Imports (keep as is)
import DocCard from '../components/DocCard'; // Import the updated DocCard
import PreviewModal from '../components/utility/PreviewModal';

// Import NEW services
import { batchService } from '../services/batchService';
import { authService } from '../services/authService'; // To check login status
import { FiAlertTriangle, FiLogIn, FiLoader } from 'react-icons/fi'; // Added icons

// --- Local Helper Function Definitions ---

// Format bytes (handling string BigInt)
const formatBytes = (bytes, decimals = 2) => {
    if (bytes === undefined || bytes === null) return 'N/A';
    let numBytes;
    try {
        numBytes = BigInt(bytes);
    } catch (e) {
        const parsedNum = parseFloat(bytes);
        if (!isNaN(parsedNum)) { numBytes = BigInt(Math.round(parsedNum)); }
        else { return 'Invalid Size'; }
    }
    if (numBytes === 0n) return '0 Bytes';
    const k = 1024n;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    let i = 0;
    let size = numBytes;
    while (size >= k && i < sizes.length - 1) { size /= k; i++; }
    const numSize = Number(numBytes) / Number(k ** BigInt(i));
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
    try {
        const url = new URL(apiUrl);
        return url.origin;
    } catch (e) {
        console.error("Could not parse VITE_API_URL to derive host:", apiUrl, e);
        return 'http://localhost:5000';
    }
}
const BACKEND_HOST_URL = getBackendHostUrl();

// Construct full file URL - LOCALLY DEFINED WITH FIX
const getFileUrl = (storageKey) => {
    if (!storageKey || typeof storageKey !== 'string') {
        return null;
    }
    // --- FIX: Normalize path separators ---
    const normalizedStorageKey = storageKey.replace(/\\/g, '/'); // Replace backslashes
    // ------------------------------------
    const cleanStorageKey = normalizedStorageKey.startsWith('/')
        ? normalizedStorageKey.substring(1)
        : normalizedStorageKey;
    const fullUrl = `${BACKEND_HOST_URL}/uploads/${cleanStorageKey}`;
    return fullUrl;
};

// --- Component Definition ---

function LandingPage() {
    const { darkMode } = useTheme();
    const navigate = useNavigate();

    // State remains the same
    const [batches, setBatches] = useState([]);
    const [loadingBatches, setLoadingBatches] = useState(true);
    const [batchesError, setBatchesError] = useState(null);
    const [isLoggedIn, setIsLoggedIn] = useState(null); // Initialize as null
    const [previewModalDocs, setPreviewModalDocs] = useState([]);
    const [previewModalIndex, setPreviewModalIndex] = useState(null);
    const [isPreviewLoading, setIsPreviewLoading] = useState(false);
    const [previewError, setPreviewError] = useState(null);

    // Effects remain the same
    useEffect(() => {
        window.scrollTo(0, 0);
        setIsLoggedIn(!!authService.getToken());
    }, []);

    useEffect(() => {
        if (isLoggedIn === null) return;
        async function fetchBatches() { /* ... fetch logic ... */
            setLoadingBatches(true); setBatchesError(null); setBatches([]);
            if (!isLoggedIn) { setBatchesError("Please log in to view recent batches."); setLoadingBatches(false); return; }
            try {
                const fetchedBatches = await batchService.getMyBatches();
                const sortedBatches = fetchedBatches.sort((a, b) => new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0));
                setBatches(sortedBatches.slice(0, 5)); setBatchesError(null);
            } catch (err) {
                console.error("Error fetching batches:", err); setBatchesError(err.message || "Failed to fetch batches.");
                if (err.status === 401 || err.status === 403) { authService.logout(); setIsLoggedIn(false); setBatchesError("Session expired. Please log in again."); }
            } finally { setLoadingBatches(false); }
        }
        fetchBatches();
    }, [isLoggedIn]);

    // Banner logos remain the same
    const bannerLogos = [ /* ... */
        { name: 'Tamil Nadu Govt.', logo: TNLogo, link: 'https://www.tn.gov.in/' },
        { name: 'Naan Mudhalvan', logo: NMLogo, link: 'https://naanmudhalvan.tn.gov.in/' },
        { name: 'Niral Thiruvizha', logo: NTLogo, link: 'https://niralthiruvizha.in/' },
        { name: 'Anna University', logo: AULogo, link: 'https://www.annauniv.edu/' },
    ];

    // handlePreview uses the LOCAL getFileUrl (which now has the fix)
    // handlePreview - Updated Error Handling
    const handlePreview = useCallback((batch) => { // Wrap in useCallback
      const fetchFullBatchAndShowPreview = async () => {
          setIsPreviewLoading(true);
          setPreviewError(null); // Clear previous preview errors specifically
          setBatchesError(null); // Also clear general batch errors if desired
          try {
              const fullBatch = await batchService.getBatchById(batch.id);
              if (fullBatch.documents && fullBatch.documents.length > 0) {
                  const docsWithUrls = fullBatch.documents.map((doc) => ({
                      ...doc,
                      batchId: fullBatch.id, // Add batchId to doc for context if needed by modal/download all
                      name: doc.fileName,
                      preview_url: getFileUrl(doc.storageKey),
                      download_url: getFileUrl(doc.storageKey),
                  }));
                  setPreviewModalDocs(docsWithUrls);
                  setPreviewModalIndex(0);
              } else {
                  // Use previewError state instead of alert
                  setPreviewError('No documents found in this batch to preview.');
              }
          } catch (error) {
              console.error("Error fetching batch details for preview:", error);
              // Use previewError state instead of alert
              setPreviewError(`Could not load documents for preview: ${error.message}`);
          } finally {
              setIsPreviewLoading(false);
          }
      }
      fetchFullBatchAndShowPreview();
    }, []); 


    // Other handlers remain the same
    const handleExtractData = (batch) => { navigate(`/extract-text/${batch.id}`); };
    const closeModal = () => setPreviewModalIndex(null);
    const prevDoc = () => setPreviewModalIndex((i) => (i !== null && i > 0 ? i - 1 : i));
    const nextDoc = () => setPreviewModalIndex((i) => (i !== null && i < previewModalDocs.length - 1 ? i + 1 : i));

    // --- Rendering ---
    return (
        <div className="px-4 py-6">
            {/* Banner Section */}
            <div className="relative rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 select-none shadow-lg mb-8">
                {/* Banner content exactly as you provided */}
                 <img src={BannerImg} alt="Banner" className="object-cover w-full h-56 md:h-64"/>
                 <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent dark:from-black/70 dark:via-black/30"></div>
                 <div className="absolute inset-0 flex flex-col items-center justify-between py-6 px-4 gap-3 text-white">
                   <div className="flex items-center justify-center flex-wrap gap-6 md:gap-8 filter drop-shadow"> {bannerLogos.map((logo, index) => ( <a key={index} href={logo.link} target="_blank" rel="noopener noreferrer" className="opacity-90 hover:opacity-100 transition-opacity"><img src={logo.logo} alt={logo.name} className="w-10 h-10 md:w-12 md:h-12" /></a> ))}</div>
                   <div className="text-center filter drop-shadow-lg"><h1 className="text-3xl md:text-4xl font-bold"> Digitize <span className="text-orange-400">History,</span> <br /> Empower the Future </h1><p className="hidden md:block text-base text-gray-200 mt-2 max-w-2xl mx-auto"> Transform your handwritten records and archival documents into accessible, searchable digital formats with our advanced AI-powered OCR solution. </p></div>
                   <div className="h-10 md:h-12"></div>
                 </div>
            </div>

            {/* Batches Section */}
            <div className="w-full px-1 mt-5">
                <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-100 mb-4">Recent Batches</h2>
                {isPreviewLoading && <div className="text-center text-orange-600 dark:text-orange-400 p-4"><FiLoader className="inline animate-spin mr-2"/> Loading preview data...</div>}
                {previewError && <div className="text-center text-red-600 dark:text-red-400 p-4 border border-red-300 dark:border-red-600 bg-red-50 dark:bg-red-900/30 rounded-md shadow-sm"><FiAlertTriangle className="inline mr-1 mb-0.5"/> {previewError}</div>}

                {loadingBatches ? ( <div className="text-center text-gray-500 dark:text-gray-400 p-6">Loading batches...</div>
                ) : batchesError ? ( <div className="text-center p-4 border border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/30 rounded-md shadow-sm"><p className="text-red-600 dark:text-red-300 font-semibold flex items-center justify-center gap-2"><FiAlertTriangle/> Error Loading Batches</p><p className="text-red-500 dark:text-red-400 text-sm mt-1">{batchesError}</p>{!isLoggedIn && (<button onClick={() => navigate('/login')} className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition text-sm inline-flex items-center gap-2"><FiLogIn /> Go to Login</button>)}</div>
                ) : batches.length > 0 ? (
                    // --- Grid Layout as per your last provided code ---
                    <div className="grid grid-cols-1 gap-4 md:gap-6">
                         {batches.map((batch) => (
                            <DocCard
                                key={batch.id}
                                data={batch} // Pass the batch object directly
                                onPreview={() => handlePreview(batch)}
                                onExtractData={() => handleExtractData(batch)}
                                // Pass the locally defined formatters
                                formatDate={formatDate}
                                formatBytes={formatBytes}
                            />
                         ))}
                    </div>
                    // ----------------------------------------------------
                ) : ( <div className="text-center space-y-4 p-6 border border-dashed border-gray-300 dark:border-gray-600 rounded-md"><p className="text-gray-500 dark:text-gray-400">You haven't created any batches yet.</p><button onClick={() => navigate('/upload')} className="px-6 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition">Upload Your First Batch</button></div> )}
            </div>

            {/* Preview Modal */}
            {previewModalIndex !== null && previewModalDocs.length > 0 && (
                <PreviewModal
                  isOpen={true} onClose={closeModal}
                  file={previewModalDocs[previewModalIndex]} // Pass the specific doc
                  currentPage={previewModalIndex} totalPages={previewModalDocs.length}
                  onPrev={prevDoc} onNext={nextDoc}
                  filesList={previewModalDocs} // Pass the whole list for Download All
                />
            )}
        </div>
    );
}

export default LandingPage;