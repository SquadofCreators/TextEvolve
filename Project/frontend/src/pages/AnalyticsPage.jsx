// src/pages/AnalyticsPage.jsx
import React, { useState, useEffect } from 'react';
import {
    FiTrendingUp, FiBarChart2, FiPieChart, FiRefreshCcw, FiLoader, FiAlertTriangle
} from 'react-icons/fi';
// Import Recharts components
import {
    LineChart, Line, PieChart, Pie, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';

// Import your analytics service and potentially PageHeader
import { analyticsService } from '../services/analyticsService';
import PageHeader from '../components/utility/PageHeader'; // Assuming component exists

// --- Helper Functions ---
const formatPercentage = (value, decimals = 0) => {
    if (value === null || value === undefined || isNaN(value)) return 'N/A';
    return `${(Number(value) * 100).toFixed(decimals)}%`;
}

const formatTrend = (value) => {
    if (value === null || value === undefined || isNaN(value)) return null;
    const percentage = (Number(value) * 100).toFixed(0);
    const isPositive = Number(value) >= 0;
    return {
        text: `${isPositive ? '+' : ''}${percentage}%`,
        color: isPositive ? 'text-green-500' : 'text-red-500',
        iconRotation: isPositive ? '' : 'transform rotate-180'
    };
}

// Example colors for Pie chart
const PIE_COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82ca9d', '#FF5733', '#C70039'];

// Component to render error messages within sections
const ErrorDisplay = ({ message }) => (
    <div className="text-center py-4 px-2 text-red-600 dark:text-red-400 text-sm flex items-center justify-center gap-2">
        <FiAlertTriangle className="w-4 h-4" />
        <span>{message || "Failed to load data"}</span>
    </div>
);

// Component to render loading state within sections
const LoadingDisplay = ({ text = "Loading..." }) => (
     <div className="text-center py-4 px-2 text-gray-500 dark:text-gray-400 flex items-center justify-center gap-2 text-sm">
         <FiLoader className="animate-spin w-4 h-4" />
         <span>{text}</span>
     </div>
);
// --- End Helper Functions ---


function AnalyticsPage() {
    // State for each data piece + loading/error per section
    const [summaryData, setSummaryData] = useState(null);
    const [trendsData, setTrendsData] = useState([]);
    const [docTypeData, setDocTypeData] = useState([]);
    const [loading, setLoading] = useState({ summary: true, trends: true, docTypes: true });
    const [error, setError] = useState({ summary: null, trends: null, docTypes: null });
    const [trendPeriod, setTrendPeriod] = useState('month'); // State for trend period

    // Effect for Summary and DocTypes (runs once on mount)
    useEffect(() => {
        const fetchStaticData = async () => {
             setLoading(prev => ({ ...prev, summary: true, docTypes: true }));
             setError(prev => ({ ...prev, summary: null, docTypes: null }));

              const results = await Promise.allSettled([
                 analyticsService.getAnalyticsSummary(),
                 analyticsService.getAnalyticsDocTypes(),
             ]);

             // Process Summary
             if (results[0].status === 'fulfilled') {
                 setSummaryData(results[0].value);
             } else {
                 console.error("Error fetching summary:", results[0].reason);
                 setError(prev => ({ ...prev, summary: results[0].reason?.message || "Failed to load summary" }));
             }
             setLoading(prev => ({ ...prev, summary: false }));

             // Process Doc Types
              if (results[1].status === 'fulfilled') {
                 const docTypesResult = results[1].value;
                 if (Array.isArray(docTypesResult)) {
                     setDocTypeData(docTypesResult.map(item => ({ name: item.type, value: item.count })));
                 } else {
                     console.error("Error fetching doc types: API did not return an array.", docTypesResult);
                     setError(prev => ({ ...prev, docTypes: "Invalid data format received for doc types" }));
                     setDocTypeData([]);
                 }
             } else {
                  console.error("Error fetching doc types:", results[1].reason);
                  setError(prev => ({ ...prev, docTypes: results[1].reason?.message || "Failed to load document types" }));
             }
             setLoading(prev => ({ ...prev, docTypes: false }));
        };
        fetchStaticData();
    }, []); // Empty dependency array: runs only once on mount

    // Effect for Trends (runs on mount and when trendPeriod changes)
     useEffect(() => {
        const fetchTrends = async () => {
            setLoading(prev => ({ ...prev, trends: true }));
            setError(prev => ({ ...prev, trends: null })); // Clear previous trend error
            try {
                const trendsResult = await analyticsService.getAnalyticsTrends({ period: trendPeriod });
                 if (Array.isArray(trendsResult)) {
                     setTrendsData(trendsResult.map(item => ({
                         ...item,
                         // Format date based on period for better axis labels
                         date: trendPeriod === 'year'
                             ? new Date(item.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short' })
                             : new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                     })));
                 } else {
                     console.error("Error fetching trends: API did not return an array.", trendsResult);
                     setError(prev => ({ ...prev, trends: "Invalid data format received for trends" }));
                     setTrendsData([]);
                 }
            } catch (err) {
                console.error(`Error fetching ${trendPeriod} trends:`, err);
                setError(prev => ({ ...prev, trends: err.message || `Failed to load ${trendPeriod} trends` }));
                setTrendsData([]); // Clear data on error
            } finally {
                setLoading(prev => ({ ...prev, trends: false }));
            }
        };
        fetchTrends();
    }, [trendPeriod]); // Re-run this effect when trendPeriod changes

    // Calculate derived values for summary cards safely
    const trendDocs = summaryData ? formatTrend(summaryData.docsConvertedTrend) : null;
    const trendAccuracy = summaryData ? formatTrend(summaryData.accuracyTrend) : null;
    // Add more derived trends here if summaryData provides them

    // Function to render Trend Period selection buttons
    const renderTrendPeriodSelector = () => (
        <div className="flex gap-1.5 sm:gap-2 mb-3 flex-shrink-0 flex-wrap">
            {['week', 'month', 'year'].map(periodOption => (
                <button
                    key={periodOption}
                    onClick={() => setTrendPeriod(periodOption)}
                    disabled={loading.trends} // Disable while trends are loading
                    className={`px-2.5 py-1 text-xs rounded transition-colors ${trendPeriod === periodOption
                        ? 'bg-orange-500 text-white font-medium shadow-sm'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50'}`}
                >
                    Last {periodOption.charAt(0).toUpperCase() + periodOption.slice(1)}
                </button>
            ))}
        </div>
    );

    // --- Render Component ---
    return (
        <div className="flex-1 p-4 md:p-6 overflow-y-auto bg-gray-100 dark:bg-gray-900 rounded-lg">
            <PageHeader title="Analytics Dashboard" subtitle="View your document conversion statistics" />

            {/* --- Stats Cards Section --- */}
            <div className="mb-8">
                {loading.summary ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                         {/* Render 4 Skeleton Cards Placeholder */}
                         {[...Array(4)].map((_, i) => (
                             <div key={i} className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 h-28 animate-pulse border border-gray-200 dark:border-gray-700">
                                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-3"></div>
                                  <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-1/2 mb-2"></div>
                                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
                             </div>
                         ))}
                    </div>
                ) : error.summary ? (
                     <ErrorDisplay message={error.summary} />
                ) : summaryData ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                        {/* Total Documents Card */}
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border border-gray-100 dark:border-gray-700">
                             <div className="flex items-center justify-between mb-1">
                                 <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Documents</h2>
                                 <FiBarChart2 className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                             </div>
                             <p className="text-3xl font-bold text-gray-800 dark:text-gray-100 mt-2">
                                 {summaryData.totalDocuments?.toLocaleString() ?? '0'}
                             </p>
                             {trendDocs && (
                                 <p className={`text-xs ${trendDocs.color} mt-1 flex items-center gap-1`}>
                                     <FiTrendingUp className={`w-3 h-3 ${trendDocs.iconRotation}`} /> {trendDocs.text} vs prev. period
                                 </p>
                             )}
                         </div>

                        {/* Average Accuracy Card */}
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border border-gray-100 dark:border-gray-700">
                              <div className="flex items-center justify-between mb-1">
                                 <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400">Average Accuracy</h2>
                                 <FiPieChart className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                             </div>
                             <p className="text-3xl font-bold text-gray-800 dark:text-gray-100 mt-2">
                                {formatPercentage(summaryData.averageAccuracy)}
                             </p>
                              {trendAccuracy && (
                                 <p className={`text-xs ${trendAccuracy.color} mt-1 flex items-center gap-1`}>
                                     <FiTrendingUp className={`w-3 h-3 ${trendAccuracy.iconRotation}`} /> {trendAccuracy.text} vs prev. period
                                 </p>
                             )}
                         </div>

                        {/* Avg Docs / Day Card */}
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border border-gray-100 dark:border-gray-700">
                             <div className="flex items-center justify-between mb-1">
                                 <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400">Avg Docs / Day</h2>
                                 <FiRefreshCcw className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                             </div>
                             <p className="text-3xl font-bold text-gray-800 dark:text-gray-100 mt-2">
                                {summaryData.averageDocsPerDay?.toLocaleString() ?? 'N/A'}
                             </p>
                              <p className="text-xs text-gray-400 mt-1 invisible">placeholder</p> {/* Maintain height */}
                         </div>

                         {/* Total Batches Card */}
                         <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border border-gray-100 dark:border-gray-700">
                              <div className="flex items-center justify-between mb-1">
                                 <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Batches</h2>
                                  <FiBarChart2 className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                             </div>
                             <p className="text-3xl font-bold text-gray-800 dark:text-gray-100 mt-2">
                                 {summaryData.totalBatches?.toLocaleString() ?? '0'}
                             </p>
                              <p className="text-xs text-gray-400 mt-1 invisible">placeholder</p> {/* Maintain height */}
                         </div>
                    </div>
                 ) : null /* Render nothing if no summary data and no error/loading */}
            </div>

            {/* --- Charts Section --- */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Conversion Trend Chart */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 min-h-[320px] h-80 flex flex-col border border-gray-100 dark:border-gray-700">
                    <div className='flex flex-wrap justify-between items-center gap-2 mb-2'> {/* Use flex-wrap */}
                         <h2 className="text-base font-semibold text-gray-700 dark:text-gray-200 flex-shrink-0 mr-2"> Conversion Trends </h2>
                         {renderTrendPeriodSelector()}
                    </div>
                    <div className="flex-grow">
                         {loading.trends ? <LoadingDisplay text='Loading trends...' />
                         : error.trends ? <ErrorDisplay message={error.trends} />
                         : trendsData.length > 0 ? (
                             <ResponsiveContainer width="100%" height="100%">
                                 <LineChart data={trendsData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                                     <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                                     <XAxis dataKey="date" fontSize={10} tick={{ fill: '#6b7280' }} tickLine={false} axisLine={false} />
                                     <YAxis fontSize={10} allowDecimals={false} tick={{ fill: '#6b7280' }} tickLine={false} axisLine={false}/>
                                     <Tooltip wrapperClassName="text-xs" contentStyle={{ backgroundColor: 'rgba(31, 41, 55, 0.8)', border: 'none', borderRadius: '4px', fontSize: '12px', padding: '4px 8px' }} itemStyle={{ color: '#f3f4f6'}}/>
                                     <Line type="monotone" dataKey="count" name="Conversions" stroke="#f97316" strokeWidth={2} dot={false} activeDot={{ r: 5, strokeWidth: 0, fill: '#f97316' }} />
                                 </LineChart>
                             </ResponsiveContainer>
                         ) : ( <p className="text-center text-gray-500 dark:text-gray-400 pt-10 text-sm">No trend data available for this period.</p> )}
                    </div>
                </div>

                {/* Document Type Distribution Chart */}
                 <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 min-h-[320px] h-80 flex flex-col border border-gray-100 dark:border-gray-700">
                     <h2 className="text-base font-semibold text-gray-700 dark:text-gray-200 mb-4 flex-shrink-0">Document Types</h2>
                     <div className="flex-grow">
                          {loading.docTypes ? <LoadingDisplay text='Loading types...' />
                         : error.docTypes ? <ErrorDisplay message={error.docTypes} />
                         : docTypeData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                 <PieChart>
                                      <Pie
                                          data={docTypeData} dataKey="value" nameKey="name"
                                          cx="50%" cy="50%" innerRadius={60} outerRadius={90}
                                          paddingAngle={1}
                                          labelLine={false}
                                          // Custom label with percentage - adjust positioning/styling as needed
                                          label={({ cx, cy, midAngle, innerRadius, outerRadius, percent, index, name }) => {
                                                const radius = innerRadius + (outerRadius - innerRadius) * 0.4; // Position label inside slice
                                                const x = cx + radius * Math.cos(-midAngle * Math.PI / 180);
                                                const y = cy + radius * Math.sin(-midAngle * Math.PI / 180);
                                                // Only show label if percentage is significant
                                                if (percent < 0.05) return null;
                                                return ( <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" fontSize={10} fontWeight="medium"> {`${(percent * 100).toFixed(0)}%`} </text> );
                                           }}
                                      >
                                          {docTypeData.map((entry, index) => (
                                              <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} stroke="#fff" strokeWidth={1} />
                                          ))}
                                      </Pie>
                                      <Tooltip wrapperClassName="text-xs" contentStyle={{ backgroundColor: 'rgba(31, 41, 55, 0.8)', border: 'none', borderRadius: '4px', fontSize: '12px', padding: '4px 8px' }} itemStyle={{ color: '#f3f4f6'}} formatter={(value, name) => [`${value.toLocaleString()} file(s)`, name]}/>
                                      {/* Optional: Add a Legend if needed */}
                                      {/* <Legend /> */}
                                 </PieChart>
                            </ResponsiveContainer>
                         ) : ( <p className="text-center text-gray-500 dark:text-gray-400 pt-10 text-sm">No document type data available.</p> )}
                     </div>
                 </div>
            </div>

             {/* Detailed Log Table Placeholder */}
            <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow p-4 border border-gray-100 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-2"> Detailed Conversion Log (Placeholder) </h2>
                <p className="text-gray-500 dark:text-gray-400 text-sm">Implement table using data from `/api/analytics/documents-log`.</p>
                 {/* TODO: Add table implementation with pagination */}
             </div>

        </div>
    );
}

export default AnalyticsPage;