// src/pages/HistoryPage.jsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
// Removed useTheme as darkMode variable wasn't used directly in styling (Tailwind dark: handles it)
import {
    FiDownload, FiEye, FiInfo, FiLoader, FiAlertTriangle, FiInbox, FiCalendar, FiFileText,
    FiCheckCircle, FiXCircle, FiClock, FiSearch, FiFilter, FiXOctagon, FiClipboard, FiRotateCcw, FiGrid
} from 'react-icons/fi';
import { batchService } from '../services/batchService';
import HistoryModal from '../components/history/HistoryModal'; // Assuming this component is well-styled
import PageHeader from '../components/utility/PageHeader'; // Assuming this component exists

// --- Helper Functions ---

// Formats an ISO date string into a locale-specific readable format
const formatDate = (isoString) => {
    if (!isoString) return 'N/A';
    try {
        return new Date(isoString).toLocaleString(undefined, {
            year: 'numeric', month: 'short', day: 'numeric',
            hour: 'numeric', minute: '2-digit'
        });
    } catch (e) {
        console.error("Error formatting date:", isoString, e);
        return 'Invalid Date';
    }
};

// Returns styling className and icon based on document status
const getStatusBadge = (status) => {
    const baseStyle = 'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium';
    switch (status?.toUpperCase()) {
        case 'COMPLETED':
            return { icon: FiCheckCircle, text: 'Completed', className: `${baseStyle} bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300` };
        case 'FAILED':
            return { icon: FiXCircle, text: 'Failed', className: `${baseStyle} bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300` };
        case 'PROCESSING':
            return { icon: FiLoader, text: 'Processing', className: `${baseStyle} bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300`, animate: true };
        case 'PENDING':
            return { icon: FiClock, text: 'Pending', className: `${baseStyle} bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300` };
        default:
            return { icon: FiInfo, text: status || 'Unknown', className: `${baseStyle} bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300` };
    }
};

// --- Constants ---
const STATUS_OPTIONS = [
    { value: 'COMPLETED', label: 'Completed' },
    { value: 'FAILED', label: 'Failed' },
    { value: 'PROCESSING', label: 'Processing' },
    { value: 'PENDING', label: 'Pending' },
];

// --- Skeleton Components ---

const FilterSkeleton = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end animate-pulse">
        {[...Array(4)].map((_, i) => (
            <div key={i}>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-2"></div>
                <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
            </div>
        ))}
    </div>
);

const BatchCardSkeleton = () => (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 md:p-5 border border-gray-200 dark:border-gray-700 animate-pulse">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Left Side */}
            <div className="flex-grow min-w-0 space-y-2">
                <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-3/4"></div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/6"></div>
                    <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded-full w-1/5"></div>
                </div>
            </div>
            {/* Right Side (Actions) */}
            <div className="flex-shrink-0 flex items-center justify-start md:justify-end gap-3 md:gap-4 mt-3 md:mt-0">
                <div className="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded-md"></div>
                <div className="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded-md"></div>
            </div>
        </div>
    </div>
);

// --- History Page Component ---
function HistoryPage() {
    const navigate = useNavigate();

    // State
    const [batches, setBatches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedBatch, setSelectedBatch] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filters, setFilters] = useState({ status: '', startDate: '', endDate: '' });
    const [retryCounter, setRetryCounter] = useState(0); // For potential retry logic

    // Fetch Batch History Effect
    useEffect(() => {
        const fetchHistory = async () => {
            setLoading(true);
            setError(''); // Clear previous errors on new fetch
            try {
                const fetchedBatches = await batchService.getMyBatches();

                if (!Array.isArray(fetchedBatches)) {
                    console.error("HistoryPage: Fetched data is not an array:", fetchedBatches); // Keep specific logs for debugging API issues
                    throw new Error("Received invalid data format from server.");
                }

                // Sort by creation date descending (newest first) - Robust check for invalid dates
                fetchedBatches.sort((a, b) => {
                    const dateA = a?.createdAt ? new Date(a.createdAt) : null;
                    const dateB = b?.createdAt ? new Date(b.createdAt) : null;

                    if (!dateA || isNaN(dateA.getTime())) return 1; // Invalid dateA comes last
                    if (!dateB || isNaN(dateB.getTime())) return -1; // Invalid dateB comes last

                    return dateB - dateA; // Newest first
                });

                setBatches(fetchedBatches);

            } catch (err) {
                console.error("HistoryPage: Error fetching batch history:", err); // Keep error log
                let errorMessage = err.message || 'Failed to load history. Please try again.';
                const status = err?.response?.status || err?.status;
                if (status === 401 || status === 403) {
                    errorMessage = "Unauthorized access. Please log in again.";
                    // Consider redirecting: navigate('/login');
                } else if (err?.response?.data?.message) {
                    errorMessage = err.response.data.message;
                }
                setError(errorMessage);
                setBatches([]); // Clear potentially stale data on error

            } finally {
                setLoading(false);
            }
        };

        fetchHistory();
        // Dependency array includes navigate (best practice if used inside) and retryCounter
    }, [navigate, retryCounter]);

    // Filtered batches based on search term and filters
    const filteredBatches = useMemo(() => {
        return batches.filter(batch => {
            // Search Term Filter (Batch Name)
            if (searchTerm.trim()) {
                const batchName = batch?.name?.toLowerCase() || '';
                if (!batchName.includes(searchTerm.trim().toLowerCase())) {
                    return false;
                }
            }

            // Status Filter
            if (filters.status && batch?.status !== filters.status) {
                return false;
            }

            // Date Filters
            const startDate = filters.startDate ? new Date(filters.startDate) : null;
            const endDate = filters.endDate ? new Date(filters.endDate) : null;

            if (startDate || endDate) {
                try {
                    const createdAt = batch?.createdAt ? new Date(batch.createdAt) : null;
                    if (!createdAt || isNaN(createdAt.getTime())) return false; // Skip if invalid date

                    // Adjust dates for accurate comparison (start of day, end of day)
                    if (startDate) startDate.setHours(0, 0, 0, 0);
                    if (endDate) endDate.setHours(23, 59, 59, 999);

                    const afterStart = startDate ? createdAt >= startDate : true;
                    const beforeEnd = endDate ? createdAt <= endDate : true;

                    if (!(afterStart && beforeEnd)) {
                        return false;
                    }
                } catch (e) {
                    console.warn("Could not parse batch creation date during filtering:", batch?.createdAt);
                    return false; // Exclude if date parsing fails
                }
            }

            return true; // Include batch if all checks pass
        });
    }, [batches, searchTerm, filters]);

    // Handlers
    const handleFilterChange = useCallback((e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    }, []);

    const handleSearchChange = useCallback((e) => {
        setSearchTerm(e.target.value);
    }, []);

    const clearFiltersAndSearch = useCallback(() => {
        setSearchTerm('');
        setFilters({ status: '', startDate: '', endDate: '' });
    }, []);

    const handleRetry = useCallback(() => {
        setRetryCounter(c => c + 1);
    }, []);

    const handleInfoModalOpen = useCallback((batch) => {
        setSelectedBatch(batch);
        setIsModalOpen(true);
    }, []);

    const handleModalClose = useCallback(() => {
        setIsModalOpen(false);
        // Delay clearing selectedBatch slightly for modal fade-out transition if needed
        setTimeout(() => setSelectedBatch(null), 300);
    }, []);

    const handleViewResults = useCallback((batchId) => {
        navigate(`/extraction-results/${batchId}`);
    }, [navigate]);

    // Derived State
    const isFiltered = useMemo(() => searchTerm.trim() || filters.status || filters.startDate || filters.endDate, [searchTerm, filters]);

    // --- Render Logic ---

    // Loading State with Skeletons
    if (loading) {
        return (
            <div className="flex-1 h-full p-4 md:p-6 lg:p-8 space-y-6 md:space-y-8 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
                <PageHeader title="Conversion History" subtitle="Review and filter your past document batches" isLoading />
                <div className="mb-6 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700">
                    <FilterSkeleton />
                </div>
                <div className="space-y-4">
                    {[...Array(3)].map((_, i) => <BatchCardSkeleton key={i} />)}
                </div>
            </div>
        );
    }

    // Error State
    if (error) {
        return (
            <div className="flex-1 p-6 h-full flex flex-col items-center justify-center bg-red-50 dark:bg-red-900/20 rounded-lg text-center border border-red-200 dark:border-red-700/50">
                <FiAlertTriangle className="h-14 w-14 text-red-500 dark:text-red-400 mb-4" />
                <p className="text-red-700 dark:text-red-300 font-semibold text-lg mb-2">Error Loading History</p>
                <p className="text-red-600 dark:text-red-400 text-sm mb-6">{error}</p>
                <button
                    onClick={handleRetry}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md border border-red-300 dark:border-red-600 text-red-700 dark:text-red-300 bg-white dark:bg-gray-800 hover:bg-red-50 dark:hover:bg-red-900/30 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
                >
                    <FiRotateCcw className="w-4 h-4" />
                    Retry
                </button>
            </div>
        );
    }

    // Main Content (Data Loaded Successfully)
    return (
        <div className="flex-1 h-full p-4 md:p-6 lg:p-8 space-y-6 md:space-y-8 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 overflow-y-auto">
            <PageHeader title="Conversion History" subtitle="Review and filter your past document batches" />

            {/* --- Search and Filter Controls --- */}
            <div className="mb-4 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
                    {/* Search Input (Takes more space) */}
                    <div className="sm:col-span-2 lg:col-span-2">
                        <label htmlFor="search-term" className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Search by Name</label>
                        <div className="relative">
                            <FiSearch className="absolute inset-y-0 left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                            <input
                                type="text"
                                id="search-term"
                                placeholder="Enter batch name..."
                                value={searchTerm}
                                onChange={handleSearchChange}
                                className="w-full pl-10 pr-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-orange-500 focus:border-orange-500 placeholder-gray-400 dark:placeholder-gray-500"
                            />
                        </div>
                    </div>

                    {/* Status Filter */}
                    <div>
                        <label htmlFor="filter-status" className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Status</label>
                        <select
                            id="filter-status"
                            name="status"
                            value={filters.status}
                            onChange={handleFilterChange}
                            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-orange-500 focus:border-orange-500"
                        >
                            <option value="">All Statuses</option>
                            {STATUS_OPTIONS.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                    </div>

                    {/* Date Filters */}
                    <div>
                        <label htmlFor="filter-start-date" className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Created After</label>
                        <input
                            type="date"
                            id="filter-start-date"
                            name="startDate"
                            value={filters.startDate}
                            onChange={handleFilterChange}
                            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-orange-500 focus:border-orange-500"
                            max={filters.endDate || undefined} // Prevent start date after end date
                        />
                    </div>
                    <div>
                        <label htmlFor="filter-end-date" className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Created Before</label>
                        <input
                            type="date"
                            id="filter-end-date"
                            name="endDate"
                            value={filters.endDate}
                            onChange={handleFilterChange}
                            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-orange-500 focus:border-orange-500"
                            min={filters.startDate || undefined} // Prevent end date before start date
                        />
                    </div>

                    {/* Clear Button (Only show if filters/search active - Spans full width on small screens below filters) */}
                    {isFiltered && (
                        <div className="sm:col-start-2 lg:col-start-auto flex justify-end mt-2 sm:mt-0 sm:self-end">
                            <button
                                onClick={clearFiltersAndSearch}
                                className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-md transition-colors border border-red-200 dark:border-red-700/50"
                                title="Clear all search and filter criteria"
                            >
                                <FiXOctagon className="w-4 h-4" />
                                Clear All
                            </button>
                        </div>
                    )}
                </div>
            </div>
            {/* --- End Search and Filter Controls --- */}


            {/* --- History List or Empty State --- */}
            <div className="mt-4">
                {filteredBatches.length === 0 ? (
                    <div className="text-center py-16 px-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700">
                        <FiInbox className="mx-auto h-16 w-16 text-gray-400 dark:text-gray-500 mb-5 opacity-70" />
                        <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-2">
                            {isFiltered ? 'No Batches Match Your Criteria' : 'Your Conversion History is Empty'}
                        </h3>
                        <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto text-sm mb-6">
                            {isFiltered
                                ? 'Try adjusting your search or filter settings to find the batches you\'re looking for.'
                                : "It looks like you haven't processed any batches yet. Upload some documents to see your history here."}
                        </p>
                        {isFiltered ? (
                            <button
                                onClick={clearFiltersAndSearch}
                                className="px-5 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition duration-200 text-sm font-medium"
                            >
                                Clear Filters & Search
                            </button>
                        ) : (
                            <button
                                onClick={() => navigate('/upload')} // Assuming '/upload' is the correct route
                                className="px-5 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition duration-200 text-sm font-medium"
                            >
                                Upload Documents
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="space-y-4">
                        {/* Map over filteredBatches */}
                        {filteredBatches.map((batch) => {
                            const statusInfo = getStatusBadge(batch.status);
                            return (
                                <div key={batch.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 p-4 md:p-5 border border-gray-100 dark:border-gray-700">
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                        {/* Batch Info (Left Side) */}
                                        <div className="flex-grow min-w-0">
                                            {/* Batch Name - Link to results if completed? */}
                                            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 truncate mb-1" title={batch.name}>
                                                {batch.name || `Batch #${batch.id.substring(0, 8)}...`}
                                            </h2>
                                            {/* Metadata */}
                                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
                                                <span className='flex items-center gap-1 whitespace-nowrap'><FiCalendar className="w-3.5 h-3.5" /> {formatDate(batch.createdAt)}</span>
                                                <span className='flex items-center gap-1 whitespace-nowrap'><FiFileText className="w-3.5 h-3.5" /> {batch.totalFileCount ?? 0} File(s)</span>
                                                {/* Status Badge */}
                                                <span className={statusInfo.className}>
                                                    <statusInfo.icon className={`w-3.5 h-3.5 ${statusInfo.animate ? 'animate-spin' : ''}`} />
                                                    {statusInfo.text}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Actions (Right Side) - Ensure buttons are distinct */}
                                        <div className="flex-shrink-0 flex flex-wrap items-center justify-start md:justify-end gap-2 md:gap-3 mt-3 md:mt-0">
                                            {/* Info Button */}
                                            <button
                                                onClick={() => handleInfoModalOpen(batch)}
                                                title="View Batch Info"
                                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40 rounded-md transition-colors border border-blue-200 dark:border-blue-700/50"
                                            >
                                                <FiInfo className="w-4 h-4" />
                                                <span>Info</span>
                                            </button>

                                            {/* View Results Button (Conditional) */}
                                            {batch.status === 'COMPLETED' && (
                                                <button
                                                    onClick={() => handleViewResults(batch.id)}
                                                    title="View Extraction Results"
                                                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-teal-600 dark:text-teal-400 hover:bg-teal-100 dark:hover:bg-teal-900/40 rounded-md transition-colors border border-teal-200 dark:border-teal-700/50"
                                                >
                                                    <FiClipboard className="w-4 h-4" />
                                                    <span>Results</span>
                                                </button>
                                            )}
                                            {/* Add Download button or other actions if needed */}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Modal for Info (Render only when needed) */}
            {isModalOpen && selectedBatch && (
                <HistoryModal
                    isOpen={isModalOpen}
                    onClose={handleModalClose} // Use dedicated close handler
                    batch={selectedBatch}
                />
            )}
        </div>
    );
}

export default HistoryPage;