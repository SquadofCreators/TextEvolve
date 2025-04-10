// src/pages/AnalyticsPage.jsx
import React, { useState, useEffect } from 'react';
import {
    FiTrendingUp, FiBarChart2, FiPieChart, FiRefreshCcw, FiLoader, FiAlertTriangle
} from 'react-icons/fi';
// Import a charting library (example: Recharts)
import { BarChart, Bar, LineChart, Line, PieChart, Pie, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';

// Import your services (assuming new functions are added)
import { batchService } from '../services/batchService'; // Or a dedicated analyticsService

// --- Helper Functions ---
const formatPercentage = (value, decimals = 0) => {
    if (value === null || value === undefined || isNaN(value)) return 'N/A';
    return `${(Number(value) * 100).toFixed(decimals)}%`;
}

const formatTrend = (value) => {
    if (value === null || value === undefined || isNaN(value)) return null; // Return null if no trend data
    const percentage = (Number(value) * 100).toFixed(0);
    const isPositive = Number(value) >= 0;
    return {
        text: `${isPositive ? '+' : ''}${percentage}%`,
        color: isPositive ? 'text-green-500' : 'text-red-500',
        iconRotation: isPositive ? '' : 'transform rotate-180'
    };
}

// Example colors for Pie chart
const PIE_COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82ca9d'];

function AnalyticsPage() {
    const [summaryData, setSummaryData] = useState(null);
    const [trendsData, setTrendsData] = useState([]);
    const [docTypeData, setDocTypeData] = useState([]);
    // Add state for table data if implementing: const [logData, setLogData] = useState({ documents: [], totalPages: 1, currentPage: 1 });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchAnalytics = async () => {
            setLoading(true);
            setError(null);
            try {
                // Fetch all analytics data concurrently
                const results = await Promise.allSettled([
                    batchService.getAnalyticsSummary(), // Replace with actual service call
                    batchService.getAnalyticsTrends({ period: 'month' }), // Example: fetch monthly trend
                    batchService.getAnalyticsDocTypes(),
                    // batchService.getDocumentsLog({ page: 1, limit: 10 }) // Fetch first page of logs
                ]);

                let fetchError = null;

                if (results[0].status === 'fulfilled') {
                    setSummaryData(results[0].value);
                } else {
                    console.error("Error fetching summary:", results[0].reason);
                    fetchError = fetchError || results[0].reason;
                }

                if (results[1].status === 'fulfilled') {
                    // Add formatting if needed, e.g., for date display on axis
                    setTrendsData(results[1].value.map(item => ({...item, date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) })));
                } else {
                    console.error("Error fetching trends:", results[1].reason);
                     fetchError = fetchError || results[1].reason;
                }

                 if (results[2].status === 'fulfilled') {
                    // Map data for Pie chart (name, value structure)
                    setDocTypeData(results[2].value.map(item => ({ name: item.type, value: item.count })));
                } else {
                    console.error("Error fetching doc types:", results[2].reason);
                    fetchError = fetchError || results[2].reason;
                }

                // Handle log data similarly if fetched

                if (fetchError) {
                    throw fetchError; // Throw the first encountered error
                }

            } catch (err) {
                console.error("Failed to load analytics:", err);
                setError(err.message || "Could not load analytics data.");
            } finally {
                setLoading(false);
            }
        };

        fetchAnalytics();
    }, []);

    // Calculate derived values safely
    const trendDocs = summaryData ? formatTrend(summaryData.docsConvertedTrend) : null;
    const trendAccuracy = summaryData ? formatTrend(summaryData.accuracyTrend) : null;
    // Add trends for other cards if available in summaryData

     if (loading) {
        return (
            <div className="flex-1 p-6 h-full flex items-center justify-center">
                <FiLoader className="animate-spin h-10 w-10 text-orange-500" />
            </div>
        );
    }

    if (error) {
        return (
             <div className="flex-1 p-6 h-full flex flex-col items-center justify-center bg-red-50 dark:bg-red-900/20 rounded-lg text-center">
                <FiAlertTriangle className="h-12 w-12 text-red-500 mb-4" />
                <p className="text-red-700 dark:text-red-300 font-semibold text-lg mb-2">Error Loading Analytics</p>
                <p className="text-red-600 dark:text-red-400">{error}</p>
                 {/* Optional: Add a retry button */}
            </div>
        );
    }

    return (
        <div className="flex-1 p-6 overflow-y-auto bg-gray-100 dark:bg-gray-800 rounded-lg">
            {/* Page Title (keep as is) */}
             <div className="mb-6"> {/* ... */} </div>

            {/* Stats Cards - Use fetched data */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {/* Documents Converted */}
                <div className="bg-white dark:bg-gray-900 rounded-lg shadow p-4">
                    {/* ... header ... */}
                     <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400">Total Documents</h2>
                     {/* ... icon ... */}
                    <p className="text-2xl font-bold text-gray-800 dark:text-gray-100 mt-2">
                        {summaryData?.totalDocuments?.toLocaleString() ?? 'N/A'}
                    </p>
                    {trendDocs && (
                         <p className={`text-sm ${trendDocs.color} mt-1 flex items-center gap-1`}>
                            <FiTrendingUp className={trendDocs.iconRotation} /> {trendDocs.text} this period
                         </p>
                    )}
                </div>

                {/* Average OCR Accuracy */}
                <div className="bg-white dark:bg-gray-900 rounded-lg shadow p-4">
                    {/* ... header ... */}
                     <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400">Average Accuracy</h2>
                     {/* ... icon ... */}
                    <p className="text-2xl font-bold text-gray-800 dark:text-gray-100 mt-2">
                       {formatPercentage(summaryData?.averageAccuracy)}
                    </p>
                     {trendAccuracy && (
                         <p className={`text-sm ${trendAccuracy.color} mt-1 flex items-center gap-1`}>
                            <FiTrendingUp className={trendAccuracy.iconRotation} /> {trendAccuracy.text} this period
                         </p>
                    )}
                </div>

                {/* Avg Docs / Day */}
                <div className="bg-white dark:bg-gray-900 rounded-lg shadow p-4">
                     {/* ... header ... */}
                     <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400">Avg Docs / Day</h2>
                     {/* ... icon ... */}
                    <p className="text-2xl font-bold text-gray-800 dark:text-gray-100 mt-2">
                         {summaryData?.averageDocsPerDay?.toLocaleString() ?? 'N/A'}
                    </p>
                     {/* Add trend display if available */}
                </div>

                {/* Pages Processed (requires schema change + API update) */}
                 <div className="bg-white dark:bg-gray-900 rounded-lg shadow p-4 opacity-60"> {/* Example: Dim if data unavailable */}
                      {/* ... header ... */}
                      <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400">Total Pages Processed</h2>
                      {/* ... icon ... */}
                    <p className="text-2xl font-bold text-gray-800 dark:text-gray-100 mt-2">
                         {summaryData?.totalPagesProcessed?.toLocaleString() ?? 'N/A*'}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">*Requires page count tracking</p>
                 </div>
            </div>

            {/* Charts / Detailed Analytics */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Conversion Trend Chart */}
                <div className="bg-white dark:bg-gray-900 rounded-lg shadow p-4 h-72 flex flex-col">
                    <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-4 flex-shrink-0"> Conversion Trends (Last Month) </h2>
                    <div className="flex-grow">
                        <ResponsiveContainer width="100%" height="100%">
                            {trendsData.length > 0 ? (
                                <LineChart data={trendsData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.3} />
                                    <XAxis dataKey="date" fontSize={10} />
                                    <YAxis fontSize={10} allowDecimals={false}/>
                                    <Tooltip />
                                    {/* <Legend /> */}
                                    <Line type="monotone" dataKey="count" name="Conversions" stroke="#ff7300" strokeWidth={2} dot={false} activeDot={{ r: 6 }} />
                                </LineChart>
                             ) : ( <p className="text-center text-gray-500 dark:text-gray-400 pt-10">No trend data available.</p> )}
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Document Type Distribution Chart */}
                 <div className="bg-white dark:bg-gray-900 rounded-lg shadow p-4 h-72 flex flex-col">
                    <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-4 flex-shrink-0">Document Types</h2>
                     <div className="flex-grow">
                         <ResponsiveContainer width="100%" height="100%">
                             {docTypeData.length > 0 ? (
                                 <PieChart>
                                     <Pie
                                         data={docTypeData}
                                         cx="50%"
                                         cy="50%"
                                         labelLine={false}
                                         outerRadius={80}
                                         fill="#8884d8"
                                         dataKey="value"
                                         label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                         fontSize={11}
                                     >
                                         {docTypeData.map((entry, index) => (
                                             <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                                         ))}
                                     </Pie>
                                     <Tooltip />
                                     {/* <Legend /> */}
                                 </PieChart>
                             ) : ( <p className="text-center text-gray-500 dark:text-gray-400 pt-10">No document type data available.</p> )}
                         </ResponsiveContainer>
                     </div>
                 </div>
            </div>

             {/* Detailed Log Table Placeholder - Requires separate data fetch & state */}
            <div className="mt-8 bg-white dark:bg-gray-900 rounded-lg shadow p-4">
                 <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-2"> Detailed Conversion Log (Placeholder) </h2>
                {/* Implement table with pagination using logData state */}
                 <p className="text-gray-500 dark:text-gray-400 text-sm">Implementation using `/api/documents/log` needed.</p>
             </div>

        </div>
    );
}

export default AnalyticsPage;