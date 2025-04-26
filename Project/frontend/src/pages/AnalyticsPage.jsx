// src/pages/AnalyticsPage.jsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
    FiTrendingUp, FiBarChart2, FiBarChart, FiPieChart, FiRefreshCcw, FiLoader, FiAlertTriangle,
    FiChevronLeft, FiChevronRight, FiInbox, FiInfo, FiCheckCircle, FiXCircle, FiClock,
    FiTarget, // Accuracy Trend Title
    FiCalendar, // Added for Avg Docs/Day
    FiDatabase, // Added for Total Batches
    FiFileText, // Added for Total Documents
    FiActivity, // Added for Average Accuracy
    FiGrid // Added for consistency
} from 'react-icons/fi';

// --- Chart.js Imports ---
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, PointElement, LineElement, ArcElement, Title, Tooltip, Legend, Filler
} from 'chart.js';
import { Line, Pie } from 'react-chartjs-2';
// --- End Chart.js Imports ---

// Import services and components
import { analyticsService } from '../services/analyticsService'; // Assumes getAccuracyTrends is added
import PageHeader from '../components/utility/PageHeader'; // Assuming component exists

// --- Chart.js Registration ---
ChartJS.register( CategoryScale, LinearScale, PointElement, LineElement, ArcElement, Title, Tooltip, Legend, Filler );
// --- End Registration ---

// --- Helper Functions ---

// Formats a number as a percentage string
const formatPercentage = (value, decimals = 0) => {
    if (value === null || value === undefined || isNaN(value)) return 'N/A';
    // Ensure value is treated as a number before calculations
    const numericValue = Number(value);
    if (isNaN(numericValue)) return 'N/A';
    return `${(numericValue * 100).toFixed(decimals)}%`;
};

// Formats a trend value into text, color, and icon rotation
const formatTrend = (value) => {
    if (value === null || value === undefined || isNaN(value)) return null;
    const numericValue = Number(value);
    if (isNaN(numericValue)) return null;

    const percentage = (numericValue * 100).toFixed(0);
    const isPositive = numericValue >= 0;
    const isNeutral = numericValue === 0;

    let color = 'text-gray-500 dark:text-gray-400'; // Neutral default
    if (numericValue > 0) color = 'text-green-600 dark:text-green-400';
    if (numericValue < 0) color = 'text-red-600 dark:text-red-400';

    return {
        text: `${isPositive ? '+' : ''}${percentage}%`,
        color: color,
        // Rotate icon down for negative trend, keep neutral otherwise
        iconRotation: numericValue < 0 ? 'transform rotate-90' : ''
    };
};

// Formats an ISO date string into a locale-specific readable format
const formatDate = (isoString) => {
    if (!isoString) return 'N/A';
    try {
        // Use more specific options for clarity
        return new Date(isoString).toLocaleString(undefined, {
            year: 'numeric', month: 'short', day: 'numeric',
            hour: 'numeric', minute: '2-digit'
        });
    } catch (e) {
        console.error("Error formatting date:", isoString, e);
        return 'Invalid Date';
    }
};

// Returns styling and icon based on document status
const getStatusBadge = (status) => {
    // Consistent badge styling
    const baseStyle = 'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium';
    switch (status?.toUpperCase()) { // Added safety check and normalization
        case 'COMPLETED':
            return { icon: FiCheckCircle, text: 'Completed', className: `${baseStyle} bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300` };
        case 'FAILED':
            return { icon: FiXCircle, text: 'Failed', className: `${baseStyle} bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300` };
        case 'PROCESSING':
            return { icon: FiLoader, text: 'Processing', className: `${baseStyle} bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300`, animate: true };
        case 'PENDING': case 'UPLOADED': case 'NEW':
            return { icon: FiClock, text: 'Pending', className: `${baseStyle} bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300` };
        default:
            return { icon: FiInfo, text: status || 'Unknown', className: `${baseStyle} bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300` };
    }
};

// More vibrant but accessible colors for the Pie chart
const PIE_COLORS = [
    '#16a34a', // green-600
    '#2563eb', // blue-600
    '#ca8a04', // yellow-600
    '#ea580c', // orange-600
    '#6d28d9', // violet-700
    '#db2777', // pink-600
    '#0d9488', // teal-600
    '#4b5563', // gray-600
];

// Enhanced Error Display Component
const ErrorDisplay = ({ message, onRetry }) => (
    <div className="text-center py-6 px-4 text-red-700 dark:text-red-400 text-sm flex flex-col items-center justify-center gap-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800/30">
        <FiAlertTriangle className="w-8 h-8 text-red-500 dark:text-red-400" />
        <span className='font-medium'>{message || "An error occurred while loading data."}</span>
        {onRetry && (
            <button
                onClick={onRetry}
                className="mt-2 px-3 py-1.5 text-xs font-medium rounded-md border border-red-300 dark:border-red-600 text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-800/30 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
            >
                Retry
            </button>
        )}
    </div>
);

// Enhanced Loading Display Component
const LoadingDisplay = ({ text = "Loading..." }) => (
     <div className="text-center py-8 px-4 text-gray-500 dark:text-gray-400 flex flex-col items-center justify-center gap-3">
         <FiLoader className="animate-spin w-6 h-6 text-blue-500" />
         <span className='text-sm font-medium'>{text}</span>
     </div>
);

// Skeleton Loader for Stats Cards
const StatCardSkeleton = () => (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 h-32 border border-gray-200 dark:border-gray-700 animate-pulse">
        <div className="flex justify-between items-center mb-2">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
            <div className="h-6 w-6 bg-gray-300 dark:bg-gray-600 rounded"></div>
        </div>
        <div className="h-8 bg-gray-300 dark:bg-gray-600 rounded w-3/4 mb-3"></div>
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
    </div>
);

// Skeleton Loader for Chart Areas
const ChartSkeleton = () => (
    <div className="w-full h-full flex items-center justify-center bg-gray-50 dark:bg-gray-700/30 rounded-md animate-pulse">
        <FiBarChart className="w-12 h-12 text-gray-300 dark:text-gray-600" />
    </div>
);


// --- Analytics Page Component ---
function AnalyticsPage() {
    // --- State ---
    const [summaryData, setSummaryData] = useState(null);
    const [accuracyTrendsData, setAccuracyTrendsData] = useState([]);
    const [docTypeData, setDocTypeData] = useState([]);
    const [logData, setLogData] = useState([]);
    const [logPagination, setLogPagination] = useState({ currentPage: 1, totalPages: 1, limit: 10, totalDocuments: 0 });
    const [loading, setLoading] = useState({ summary: true, accuracyTrends: true, docTypes: true, log: true });
    const [error, setError] = useState({ summary: null, accuracyTrends: null, docTypes: null, log: null });
    const [trendPeriod, setTrendPeriod] = useState('month');
    const [retryCounter, setRetryCounter] = useState(0); // For triggering retries
    const navigate = useNavigate();

    // --- Data Fetching Effects ---

    // Fetch Summary and DocTypes (runs once on mount)
    useEffect(() => {
        const fetchStaticData = async () => {
             setLoading(prev => ({ ...prev, summary: true, docTypes: true }));
             setError(prev => ({ ...prev, summary: null, docTypes: null }));
             try {
                 const results = await Promise.allSettled([
                     analyticsService.getAnalyticsSummary(),
                     analyticsService.getAnalyticsDocTypes(),
                 ]);

                 // Process Summary Result
                 if (results[0].status === 'fulfilled' && results[0].value) {
                     setSummaryData(results[0].value);
                 } else {
                      console.error("Failed to fetch summary:", results[0].reason);
                      setError(prev => ({ ...prev, summary: results[0].reason?.message || "Failed to load summary stats" }));
                 }

                 // Process DocTypes Result
                 if (results[1].status === 'fulfilled' && Array.isArray(results[1].value)) {
                     setDocTypeData(results[1].value);
                 } else {
                     console.error("Failed to fetch doc types:", results[1].reason);
                      setError(prev => ({ ...prev, docTypes: results[1].reason?.message || "Failed to load document types" }));
                 }

             } catch (err) { // Catch any unexpected errors during Promise.allSettled or setup
                  console.error("Error fetching static analytics:", err);
                  // Set a generic error if specific ones weren't caught
                  setError(prev => ({
                      ...prev,
                      summary: prev.summary || "An unexpected error occurred",
                      docTypes: prev.docTypes || "An unexpected error occurred"
                  }));
             } finally {
                  setLoading(prev => ({ ...prev, summary: false, docTypes: false }));
             }
        };
        fetchStaticData();
    }, []); // Empty dependency array ensures this runs only once

    // Fetch Accuracy Trends (runs on mount, when trendPeriod changes, or when retryCounter increments)
    useEffect(() => {
        const fetchAccuracyTrends = async () => {
            setLoading(prev => ({ ...prev, accuracyTrends: true }));
            setError(prev => ({ ...prev, accuracyTrends: null })); // Clear previous error on new fetch attempt
            try {
                const trendsResult = await analyticsService.getAccuracyTrends({ period: trendPeriod });
                 if (Array.isArray(trendsResult)) {
                     setAccuracyTrendsData(trendsResult);
                 } else {
                     // Handle cases where the API might return non-array success responses unexpectedly
                     throw new Error("Received invalid data format for accuracy trends.");
                 }
            } catch (err) {
                console.error(`Error fetching ${trendPeriod} accuracy trends:`, err);
                setError(prev => ({ ...prev, accuracyTrends: err.message || `Failed to load ${trendPeriod} accuracy trends` }));
                setAccuracyTrendsData([]); // Clear data on error
            } finally {
                setLoading(prev => ({ ...prev, accuracyTrends: false }));
            }
        };
        fetchAccuracyTrends();
    }, [trendPeriod, retryCounter]); // Dependencies: refetch if period changes or retry is triggered


     // Fetch Document Log (runs on mount and when pagination changes)
    useEffect(() => {
         const fetchLog = async () => {
             setLoading(prev => ({ ...prev, log: true }));
             setError(prev => ({ ...prev, log: null }));
             try {
                 const params = { page: logPagination.currentPage, limit: logPagination.limit };
                 const data = await analyticsService.getDocumentsLog(params);

                 if (data && Array.isArray(data.documents) && typeof data.currentPage === 'number' && typeof data.totalPages === 'number' && typeof data.totalDocuments === 'number') {
                     setLogData(data.documents);
                     // Ensure pagination state is updated correctly
                     setLogPagination(prev => ({
                         ...prev, // Keep limit
                         currentPage: data.currentPage,
                         totalPages: data.totalPages,
                         totalDocuments: data.totalDocuments
                     }));
                 } else {
                     throw new Error("Invalid data format received for document log.");
                 }
             } catch (err) {
                 console.error("Error fetching document log:", err);
                 setError(prev => ({ ...prev, log: err.message || "Failed to load document log" }));
                 setLogData([]); // Clear log data on error
                 // Reset pagination on error? Optional, but might be safer.
                 // setLogPagination(prev => ({ ...prev, currentPage: 1, totalPages: 1, totalDocuments: 0 }));
             } finally {
                 setLoading(prev => ({ ...prev, log: false }));
             }
         };
         fetchLog();
         // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [logPagination.currentPage, logPagination.limit]); // Dependencies: refetch if page or limit changes


    // --- Derived Values & Handlers ---
    const trendDocs = useMemo(() => summaryData ? formatTrend(summaryData.docsConvertedTrend) : null, [summaryData]);
    const trendAccuracy = useMemo(() => summaryData ? formatTrend(summaryData.accuracyTrend) : null, [summaryData]);

    // Handler for retrying accuracy trend fetch
    const handleRetryAccuracy = useCallback(() => {
        setRetryCounter(c => c + 1); // Increment counter to trigger the useEffect
    }, []);

    // Handler for changing log page
    const handlePageChange = useCallback((newPage) => {
        if (newPage >= 1 && newPage <= logPagination.totalPages && newPage !== logPagination.currentPage) {
            setLogPagination(prev => ({ ...prev, currentPage: newPage }));
        }
    }, [logPagination.currentPage, logPagination.totalPages]);


    // --- Chart Data Transformation (useMemo) ---
    const lineChartData = useMemo(() => {
        const labels = accuracyTrendsData.map(item =>
            new Date(item.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
        );
        const dataPoints = accuracyTrendsData.map(item => item.avgAccuracy);

        return {
            labels,
            datasets: [{
                label: 'Avg Accuracy',
                data: dataPoints,
                borderColor: '#0d9488', // teal-600
                backgroundColor: 'rgba(13, 148, 136, 0.1)', // Light teal fill
                fill: true, // Fill area under the line
                tension: 0.4, // Smoother curve
                pointBackgroundColor: '#0d9488', // teal-600
                pointBorderColor: '#ffffff',
                pointHoverBackgroundColor: '#ffffff',
                pointHoverBorderColor: '#0d9488', // teal-600
                pointRadius: 3,
                pointHoverRadius: 6,
            }]
        };
    }, [accuracyTrendsData]);

    const pieChartData = useMemo(() => {
        const labels = docTypeData.map(item => item.type || 'Unnamed Type'); // Handle potential null/undefined types
        const dataPoints = docTypeData.map(item => item.count || 0); // Handle potential null/undefined counts

        return {
            labels,
            datasets: [{
                label: 'Document Types',
                data: dataPoints,
                backgroundColor: PIE_COLORS.slice(0, dataPoints.length),
                borderColor: '#ffffff', // White border for separation
                borderWidth: 2,
                hoverOffset: 8 // Slightly expand slice on hover
            }]
        };
    }, [docTypeData]);


    // --- Chart Options (useMemo) ---
    // Define colors for light/dark mode for chart elements
    const gridColor = 'rgba(229, 231, 235, 0.5)'; // gray-200 with alpha
    const tickColor = '#6b7280'; // gray-500
    const darkGridColor = 'rgba(75, 85, 99, 0.3)'; // gray-600 with alpha
    const darkTickColor = '#9ca3af'; // gray-400
    const tooltipBgColor = 'rgba(17, 24, 39, 0.85)'; // gray-900 with alpha
    const tooltipDarkBgColor = 'rgba(31, 41, 55, 0.85)'; // gray-800 with alpha

    const lineOptions = useMemo(() => ({
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            title: { display: false },
            tooltip: {
                enabled: true,
                mode: 'index', // Show tooltip for all datasets at that index
                intersect: false, // Tooltip triggers even if not directly hovering over point
                backgroundColor: tooltipBgColor, // Use variable
                titleColor: '#ffffff',
                bodyColor: '#ffffff',
                padding: 10,
                cornerRadius: 4,
                boxPadding: 5,
                bodyFont: { size: 11 },
                titleFont: { size: 12, weight: 'bold'},
                callbacks: {
                    label: function(context) {
                        let label = context.dataset.label || '';
                        if (label) label += ': ';
                        if (context.parsed.y !== null) {
                            label += formatPercentage(context.parsed.y, 1); // Use helper
                        }
                        return label;
                    }
                }
            }
        },
        scales: {
            x: {
                ticks: {
                    font: { size: 10 },
                    color: tickColor, // Use variable
                    maxRotation: 0, // Prevent label rotation on denser charts
                    autoSkip: true, // Skip labels if too dense
                    maxTicksLimit: 7 // Limit number of visible ticks
                },
                grid: { display: false },
                border: { display: false }
            },
            y: {
                ticks: {
                    font: { size: 10 },
                    color: tickColor, // Use variable
                    callback: function(value) { return formatPercentage(value, 0); } // Use helper
                },
                grid: {
                    color: gridColor, // Use variable
                    borderDash: [4, 4], // Dashed grid lines
                },
                border: { display: false },
                 // Adjust min/max slightly for better visualization if needed
                 // min: 0.5, max: 1.0 // Keep if accuracy always > 50%
                suggestedMin: 0, // Or start from 0 if accuracy can be lower
                suggestedMax: 1,
            }
        },
        interaction: {
            mode: 'index',
            intersect: false,
        },
        elements: {
            line: {
                tension: 0.4 // Smoother line remains
            }
        }
        // Apply dark mode overrides directly if needed, though Tailwind handles parent bg
        // Chart.js doesn't directly support Tailwind's dark: prefix in options
        // Requires more complex setup or JS detection of dark mode to swap colors
    }), []); // No dark mode specific color variables here, relies on parent for bg contrast


    const pieOptions = useMemo(() => ({
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'right', // Position legend to the right
                labels: {
                    boxWidth: 12,
                    padding: 15, // Add padding between legend items
                    font: { size: 12 },
                    color: tickColor, // Use consistent tick color for legend text
                     // Use a generator for dark mode compatibility if needed
                }
            },
            title: { display: false },
            tooltip: {
                enabled: true,
                backgroundColor: tooltipBgColor, // Use variable
                titleColor: '#ffffff',
                bodyColor: '#ffffff',
                padding: 10,
                cornerRadius: 4,
                boxPadding: 5,
                 bodyFont: { size: 11 },
                 titleFont: { size: 12, weight: 'bold'},
                callbacks: {
                    label: function(context) {
                        let label = context.label || '';
                        let value = context.parsed || 0;
                        const total = context.dataset.data.reduce((sum, val) => sum + (val || 0), 0);
                        const percentage = total > 0 ? ((value / total) * 100).toFixed(0) + '%' : '0%';

                        if (label) label += ': ';
                        label += value.toLocaleString() + ' (' + percentage + ')';
                        return label;
                    }
                }
            }
        },
        // cutout: '60%', // Uncomment for Doughnut chart effect
    }), []); // No dark mode specific color variables here


    // --- Render Component ---
    return (
        // Use flex-1 and overflow-y-auto if this is within a flex container layout
        <div className="flex-1 p-4 md:p-6 lg:p-8 bg-gray-50 dark:bg-gray-900 space-y-6 md:space-y-8">
            <PageHeader title="Analytics Dashboard" subtitle="Overview of your document conversion performance" />

            {/* --- Stats Cards Section --- */}
            <div className="mb-6 md:mb-8">
                {loading.summary ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-6">
                         {[...Array(4)].map((_, i) => <StatCardSkeleton key={i} />)}
                    </div>
                ) : error.summary ? (
                     <ErrorDisplay message={error.summary} />
                ) : summaryData ? (
                    // Responsive grid: 1 col mobile, 2 cols tablet, 4 cols desktop+
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-6">
                        {/* Card Component (Example: Total Documents) */}
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-5 border border-gray-100 dark:border-gray-700 transition hover:shadow-md">
                             <div className="flex items-center justify-between mb-2">
                                 <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Documents</h3>
                                 <FiFileText className="w-5 h-5 text-blue-500 dark:text-blue-400" />
                             </div>
                             <p className="text-3xl font-bold text-gray-800 dark:text-gray-100">
                                 {summaryData.totalDocuments?.toLocaleString() ?? '0'}
                             </p>
                             {trendDocs && (
                               <p className={`text-xs ${trendDocs.color} mt-2 flex items-center gap-1`}>
                                  <FiTrendingUp className={`w-3.5 h-3.5 ${trendDocs.iconRotation}`} />
                                  <span>{trendDocs.text}</span>
                                  <span className="text-gray-400 dark:text-gray-500 ml-1 hidden sm:inline">vs prev. period</span>
                                </p>
                             )}
                             {!trendDocs && <div className="h-[24px] mt-2"></div> /* Placeholder for consistent height */}
                         </div>

                        {/* Average Accuracy Card */}
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-5 border border-gray-100 dark:border-gray-700 transition hover:shadow-md">
                              <div className="flex items-center justify-between mb-2">
                                 <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Average Accuracy</h3>
                                 <FiActivity className="w-5 h-5 text-green-500 dark:text-green-400" />
                             </div>
                             <p className="text-3xl font-bold text-gray-800 dark:text-gray-100">
                                {formatPercentage(summaryData.averageAccuracy, 1)}
                             </p>
                              {trendAccuracy && (
                                <p className={`text-xs ${trendAccuracy.color} mt-2 flex items-center gap-1`}>
                                   <FiTrendingUp className={`w-3.5 h-3.5 ${trendAccuracy.iconRotation}`} />
                                   <span>{trendAccuracy.text}</span>
                                   <span className="text-gray-400 dark:text-gray-500 ml-1 hidden sm:inline">vs prev. period</span>
                                </p>
                             )}
                             {!trendAccuracy && <div className="h-[24px] mt-2"></div>}
                         </div>

                         {/* Avg Docs / Day Card */}
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-5 border border-gray-100 dark:border-gray-700 transition hover:shadow-md">
                             <div className="flex items-center justify-between mb-2">
                                 <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Avg Docs / Day</h3>
                                 <FiCalendar className="w-5 h-5 text-yellow-500 dark:text-yellow-400" />
                             </div>
                             <p className="text-3xl font-bold text-gray-800 dark:text-gray-100">
                                {summaryData.averageDocsPerDay?.toLocaleString(undefined, { maximumFractionDigits: 1 }) ?? 'N/A'}
                             </p>
                              {/* Placeholder for consistent height if no trend info */}
                              <div className="h-[24px] mt-2"></div>
                         </div>

                         {/* Total Batches Card */}
                         <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-5 border border-gray-100 dark:border-gray-700 transition hover:shadow-md">
                              <div className="flex items-center justify-between mb-2">
                                 <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Batches</h3>
                                  <FiDatabase className="w-5 h-5 text-purple-500 dark:text-purple-400" />
                             </div>
                             <p className="text-3xl font-bold text-gray-800 dark:text-gray-100">
                                 {summaryData.totalBatches?.toLocaleString() ?? '0'}
                             </p>
                             {/* Placeholder for consistent height */}
                              <div className="h-[24px] mt-2"></div>
                         </div>
                    </div>
                 ) : null /* Handles initial state before loading finishes or if summaryData is null */}
            </div>

            {/* --- Charts Section --- */}
             {/* Responsive grid: 1 col mobile, 2 cols tablet+ */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">

                {/* Accuracy Trend Chart Card */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 md:p-6 border border-gray-100 dark:border-gray-700 flex flex-col min-h-[380px] h-[420px]"> {/* Fixed height, flex-col */}
                    {/* Header: Title & Period Selector */}
                    <div className='flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4 flex-shrink-0'>
                         <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                             <FiTarget className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                             Accuracy Trends
                         </h2>
                         {/* Trend Period Selector */}
                         <div className="flex gap-1.5 sm:gap-2 flex-shrink-0">
                             {['week', 'month', 'year'].map(periodOption => (
                                 <button
                                     key={periodOption}
                                     onClick={() => setTrendPeriod(periodOption)}
                                     disabled={loading.accuracyTrends}
                                     className={`px-3 py-1 text-xs font-medium rounded-md transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-800 focus:ring-blue-500
                                         ${trendPeriod === periodOption
                                             ? 'bg-blue-600 text-white shadow-sm'
                                             : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'}
                                         ${loading.accuracyTrends ? 'opacity-50 cursor-not-allowed' : ''}
                                     `}
                                 >
                                     Last {periodOption.charAt(0).toUpperCase() + periodOption.slice(1)}
                                 </button>
                             ))}
                         </div>
                    </div>

                    {/* Chart Area: Takes remaining space */}
                    <div className="flex-grow relative min-h-0"> {/* min-h-0 prevents flex item overflow */}
                         {loading.accuracyTrends ? (
                             <ChartSkeleton />
                         ) : error.accuracyTrends ? (
                             <ErrorDisplay message={error.accuracyTrends} onRetry={handleRetryAccuracy} />
                         ) : accuracyTrendsData.length > 0 ? (
                             // Position absolute ensures Line chart fills the relative container
                             <div className='absolute top-0 left-0 w-full h-full'>
                                  <Line options={lineOptions} data={lineChartData} />
                             </div>
                         ) : (
                             // Improved No Data State
                             <div className="h-full flex flex-col items-center justify-center text-center text-gray-500 dark:text-gray-400 p-4">
                                <FiBarChart className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500 mb-3 opacity-50" />
                                <p className="text-sm font-medium">No accuracy data available</p>
                                <p className="text-xs text-gray-400 dark:text-gray-500">Try selecting a different time period.</p>
                            </div>
                         )}
                    </div>
                  </div>

                {/* Document Type Distribution Chart Card */}
                 <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 md:p-6 border border-gray-100 dark:border-gray-700 flex flex-col min-h-[380px] h-[420px]">
                     <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4 flex-shrink-0 flex items-center gap-2">
                        <FiPieChart className="w-5 h-5 text-orange-500 dark:text-orange-400" />
                        Document Types
                     </h2>
                     <div className="flex-grow relative min-h-0">
                          {loading.docTypes ? <ChartSkeleton />
                         : error.docTypes ? <ErrorDisplay message={error.docTypes} /> // Add retry if applicable
                         : docTypeData.length > 0 ? (
                              <div className='absolute top-0 left-0 w-full h-full'>
                                  <Pie options={pieOptions} data={pieChartData} />
                              </div>
                         ) : (
                             <div className="h-full flex flex-col items-center justify-center text-center text-gray-500 dark:text-gray-400 p-4">
                                <FiInbox className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500 mb-3 opacity-50" />
                                <p className="text-sm font-medium">No document type data</p>
                                <p className="text-xs text-gray-400 dark:text-gray-500">Upload documents to see distribution here.</p>
                            </div>
                         )}
                     </div>
                 </div>
            </div>

             {/* --- Detailed Log Table Section --- */}
            <div className="mt-6 md:mt-8 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                 {/* Table Header */}
                <div className="px-4 py-3 md:px-6 md:py-4 border-b border-gray-100 dark:border-gray-700">
                    <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                        <FiGrid className="w-5 h-5 text-gray-500 dark:text-gray-400"/>
                        Detailed Document Log
                    </h2>
                </div>

                {/* Table Content Area */}
                {loading.log ? ( <LoadingDisplay text="Loading document log..." />
                ) : error.log ? ( <ErrorDisplay message={error.log} /> // Add retry if applicable for logs
                ) : logData.length === 0 ? (
                     <div className="text-center py-12 px-6">
                         <FiInbox className="mx-auto h-14 w-14 text-gray-400 dark:text-gray-500 mb-4 opacity-60" />
                         <p className="text-gray-600 dark:text-gray-400 text-base font-medium mb-1">No document logs found</p>
                         <p className="text-gray-500 dark:text-gray-500 text-sm">Processed documents will appear here.</p>
                     </div>
                ) : (
                    <>
                        {/* Responsive Table Wrapper */}
                        <div className="overflow-x-auto">
                            <table className="min-w-full text-sm divide-y divide-gray-100 dark:divide-gray-700">
                                {/* Table Head */}
                                <thead className="bg-gray-50 dark:bg-gray-700/50">
                                    <tr>
                                        {/* Increased padding, centered text where appropriate */}
                                        <th scope="col" className="py-3 px-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Document</th>
                                        <th scope="col" className="py-3 px-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Batch</th>
                                        <th scope="col" className="py-3 px-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Status</th>
                                        <th scope="col" className="py-3 px-4 text-center text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Accuracy</th>
                                        <th scope="col" className="py-3 px-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Processed On</th>
                                    </tr>
                                </thead>
                                {/* Table Body */}
                                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-100 dark:divide-gray-700">
                                    {logData.map((doc) => {
                                        const statusInfo = getStatusBadge(doc.status);
                                        return (
                                            <tr key={doc.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors duration-100">
                                                {/* Use max-w with truncate, provide full title */}
                                                <td className="py-3 px-4 whitespace-nowrap max-w-[200px] md:max-w-xs lg:max-w-sm xl:max-w-md truncate" title={doc.fileName}>
                                                     <span className="text-gray-800 dark:text-gray-200 font-medium">{doc.fileName || 'N/A'}</span>
                                                 </td>
                                                <td className="py-3 px-4 whitespace-nowrap max-w-[150px] md:max-w-xs truncate" title={doc.batchName}>
                                                    {doc.batchId ? (
                                                        // Clearer link styling
                                                        <Link
                                                            to={`/batch/${doc.batchId}`}
                                                            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 hover:underline transition-colors duration-150"
                                                        >
                                                            {doc.batchName || `Batch ${doc.batchId}`}
                                                        </Link>
                                                    ) : (
                                                        <span className="text-gray-600 dark:text-gray-400">{doc.batchName || 'N/A'}</span>
                                                    )}
                                                 </td>
                                                <td className="py-3 px-4 whitespace-nowrap">
                                                     {/* Badge using className from helper */}
                                                     <span className={statusInfo.className}>
                                                         <statusInfo.icon className={`w-3.5 h-3.5 ${statusInfo.animate ? 'animate-spin' : ''}`} />
                                                         {statusInfo.text}
                                                     </span>
                                                 </td>
                                                <td className="py-3 px-4 whitespace-nowrap text-center">
                                                     {/* Consistent text color */}
                                                     <span className="text-gray-700 dark:text-gray-300 font-medium">{formatPercentage(doc.accuracy)}</span>
                                                 </td>
                                                <td className="py-3 px-4 whitespace-nowrap text-gray-600 dark:text-gray-400">
                                                     {formatDate(doc.updatedAt)} {/* Use updatedAt */}
                                                 </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                         {/* --- Pagination Controls --- */}
                        {logPagination.totalPages > 1 && (
                             <div className="flex flex-col sm:flex-row items-center justify-between p-3 md:p-4 border-t border-gray-100 dark:border-gray-700 text-xs text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50">
                                 {/* Page Info */}
                                 <div className="mb-2 sm:mb-0">
                                     Page <span className="font-semibold">{logPagination.currentPage}</span> of <span className="font-semibold">{logPagination.totalPages}</span>
                                      <span className="ml-2 hidden md:inline">({logPagination.totalDocuments.toLocaleString()} total documents)</span>
                                 </div>
                                 {/* Navigation Buttons */}
                                 <div className="flex gap-2">
                                     <button
                                         onClick={() => handlePageChange(logPagination.currentPage - 1)}
                                         disabled={logPagination.currentPage <= 1 || loading.log}
                                         className="px-2.5 py-1.5 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150 flex items-center gap-1"
                                         aria-label="Previous Page"
                                     >
                                         <FiChevronLeft className="w-4 h-4" />
                                         <span className='hidden sm:inline'>Prev</span>
                                     </button>
                                     <button
                                         onClick={() => handlePageChange(logPagination.currentPage + 1)}
                                         disabled={logPagination.currentPage >= logPagination.totalPages || loading.log}
                                         className="px-2.5 py-1.5 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150 flex items-center gap-1"
                                         aria-label="Next Page"
                                     >
                                          <span className='hidden sm:inline'>Next</span>
                                         <FiChevronRight className="w-4 h-4" />
                                     </button>
                                 </div>
                             </div>
                         )}
                     </>
                )}
            </div> {/* End Table Section */}

        </div> // End Main Page Container
    );
}

export default AnalyticsPage;