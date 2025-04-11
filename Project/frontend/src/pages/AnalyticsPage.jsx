// src/pages/AnalyticsPage.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
    FiTrendingUp, FiBarChart2, FiBarChart, FiPieChart, FiRefreshCcw, FiLoader, FiAlertTriangle,
    FiChevronLeft, FiChevronRight, FiInbox, FiInfo, FiCheckCircle, FiXCircle, FiClock,
    FiTarget // Added FiTarget for Accuracy Trend Title
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
const formatPercentage = (value, decimals = 0) => {
    if (value === null || value === undefined || isNaN(value)) return 'N/A';
    return `${(Number(value) * 100).toFixed(decimals)}%`;
};

const formatTrend = (value) => {
    if (value === null || value === undefined || isNaN(value)) return null;
    const percentage = (Number(value) * 100).toFixed(0);
    const isPositive = Number(value) >= 0;
    return {
        text: `${isPositive ? '+' : ''}${percentage}%`,
        color: isPositive ? 'text-green-500' : 'text-red-500',
        iconRotation: isPositive ? '' : 'transform rotate-180'
    };
};

const formatDate = (isoString) => {
    if (!isoString) return 'N/A';
    try {
        return new Date(isoString).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
    } catch (e) { return 'Invalid Date'; }
};

const getStatusBadge = (status) => {
    switch (status) {
        case 'COMPLETED':
            return { icon: FiCheckCircle, text: 'Completed', color: 'text-green-700 dark:text-green-400 bg-green-100 dark:bg-green-900/30' };
        case 'FAILED':
            return { icon: FiXCircle, text: 'Failed', color: 'text-red-700 dark:text-red-400 bg-red-100 dark:bg-red-900/30' };
        case 'PROCESSING':
            return { icon: FiLoader, text: 'Processing', color: 'text-blue-700 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30', animate: true };
        case 'PENDING': case 'UPLOADED': case 'NEW':
            return { icon: FiClock, text: 'Pending', color: 'text-yellow-700 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/30' };
        default:
            return { icon: FiInfo, text: status || 'Unknown', color: 'text-gray-700 dark:text-gray-400 bg-gray-100 dark:bg-gray-700' };
    }
};

const PIE_COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82ca9d', '#FF5733', '#C70039'];

const ErrorDisplay = ({ message }) => (
    <div className="text-center py-4 px-2 text-red-600 dark:text-red-400 text-sm flex items-center justify-center gap-2">
        <FiAlertTriangle className="w-4 h-4" />
        <span>{message || "Failed to load data"}</span>
    </div>
);

const LoadingDisplay = ({ text = "Loading..." }) => (
     <div className="text-center py-4 px-2 text-gray-500 dark:text-gray-400 flex items-center justify-center gap-2 text-sm">
         <FiLoader className="animate-spin w-4 h-4" />
         <span>{text}</span>
     </div>
);

// Custom Tooltip for Charts
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-gray-700 dark:bg-gray-900 text-white text-xs p-2 rounded shadow-lg border border-gray-600 opacity-90">
        <p className="font-semibold mb-1">{label}</p>
        {payload.map((entry, index) => (
           <div key={`item-${index}`} className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color || entry.payload?.fill }}></span>
                <span style={{ color: entry.color || entry.payload?.fill }}>
                    {entry.name}: {entry.dataKey === 'avgAccuracy' ? formatPercentage(entry.value, 1) : entry.value.toLocaleString()}
                    {entry.payload?.percent ? ` (${(entry.payload.percent * 100).toFixed(0)}%)` : ''}
                </span>
           </div>
        ))}
      </div>
    );
  }
  return null;
};

// Custom Label for Pie Chart
const RADIAN = Math.PI / 180;
const renderCustomizedPieLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index, name, value }) => {
  if (percent < 0.05) return null; // Adjust threshold
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return ( <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" fontSize={10} fontWeight="medium">{`${(percent * 100).toFixed(0)}%`}</text> );
};
// --- End Helper Functions/Components ---


function AnalyticsPage() {
    // --- State ---
    const [summaryData, setSummaryData] = useState(null);
    const [accuracyTrendsData, setAccuracyTrendsData] = useState([]); // Holds raw data [{ date: '...', avgAccuracy: ... }]
    const [docTypeData, setDocTypeData] = useState([]); // Holds raw data [{ type: '...', count: ... }]
    const [logData, setLogData] = useState([]);
    const [logPagination, setLogPagination] = useState({ currentPage: 1, totalPages: 1, limit: 10, totalDocuments: 0 });
    const [loading, setLoading] = useState({ summary: true, accuracyTrends: true, docTypes: true, log: true }); // Updated key
    const [error, setError] = useState({ summary: null, accuracyTrends: null, docTypes: null, log: null }); // Updated key
    const [trendPeriod, setTrendPeriod] = useState('month');
    const navigate = useNavigate();

    // --- Effects ---
    // Effect for Summary and DocTypes (runs once)
    useEffect(() => {
        const fetchStaticData = async () => {
             setLoading(prev => ({ ...prev, summary: true, docTypes: true }));
             setError(prev => ({ ...prev, summary: null, docTypes: null }));
             try {
                 const results = await Promise.allSettled([
                     analyticsService.getAnalyticsSummary(),
                     analyticsService.getAnalyticsDocTypes(),
                 ]);

                 if (results[0].status === 'fulfilled') { setSummaryData(results[0].value); }
                 else { throw results[0].reason; }

                 if (results[1].status === 'fulfilled') {
                     const docTypesResult = results[1].value;
                     if (Array.isArray(docTypesResult)) { setDocTypeData(docTypesResult); }
                     else { throw new Error("Invalid data format for doc types"); }
                 } else { throw results[1].reason; }

             } catch (err) {
                  console.error("Error fetching static analytics:", err);
                  setError(prev => ({ ...prev, summary: err.message || "Failed", docTypes: err.message || "Failed" }));
             } finally {
                  setLoading(prev => ({ ...prev, summary: false, docTypes: false }));
             }
        };
        fetchStaticData();
    }, []);

    // Effect for Accuracy Trends (runs on mount and when trendPeriod changes)
     useEffect(() => {
        const fetchAccuracyTrends = async () => {
            setLoading(prev => ({ ...prev, accuracyTrends: true }));
            setError(prev => ({ ...prev, accuracyTrends: null }));
            try {
                // ASSUMES analyticsService.getAccuracyTrends exists and fetches {date, avgAccuracy}
                const trendsResult = await analyticsService.getAccuracyTrends({ period: trendPeriod });
                 if (Array.isArray(trendsResult)) {
                     setAccuracyTrendsData(trendsResult);
                 } else {
                     throw new Error("Invalid data format for accuracy trends");
                 }
            } catch (err) {
                console.error(`Error fetching ${trendPeriod} accuracy trends:`, err);
                setError(prev => ({ ...prev, accuracyTrends: err.message || `Failed to load ${trendPeriod} accuracy trends` }));
                setAccuracyTrendsData([]);
            } finally {
                setLoading(prev => ({ ...prev, accuracyTrends: false }));
            }
        };
        fetchAccuracyTrends();
    }, [trendPeriod]);

    useEffect(() => {
      const fetchAccuracyTrends = async () => {
          // Set loading/error for ACCURACY trends
          setLoading(prev => ({ ...prev, accuracyTrends: true }));
          setError(prev => ({ ...prev, accuracyTrends: null }));
          try {
              // *** CALL THE CORRECT SERVICE FUNCTION ***
              const trendsResult = await analyticsService.getAccuracyTrends({ period: trendPeriod });
              if (Array.isArray(trendsResult)) {
                  // *** SET THE CORRECT STATE VARIABLE ***
                  setAccuracyTrendsData(trendsResult);
              } else {
                  throw new Error("Invalid data format for accuracy trends");
              }
          } catch (err) {
              console.error(`Error fetching ${trendPeriod} accuracy trends:`, err);
              // *** SET THE CORRECT ERROR STATE ***
              setError(prev => ({ ...prev, accuracyTrends: err.message || `Failed ...` }));
              setAccuracyTrendsData([]);
          } finally {
               // *** SET THE CORRECT LOADING STATE ***
              setLoading(prev => ({ ...prev, accuracyTrends: false }));
          }
      };
      fetchAccuracyTrends();
    }, [trendPeriod]);

     // Effect for Document Log
    useEffect(() => {
         const fetchLog = async () => {
             setLoading(prev => ({ ...prev, log: true }));
             setError(prev => ({ ...prev, log: null }));
             try {
                 const params = { page: logPagination.currentPage, limit: logPagination.limit };
                 const data = await analyticsService.getDocumentsLog(params);
                 if (data && Array.isArray(data.documents)) {
                     setLogData(data.documents);
                     setLogPagination(prev => ({ ...prev, currentPage: data.currentPage, totalPages: data.totalPages, totalDocuments: data.totalDocuments }));
                 } else { throw new Error("Invalid data format received for document log."); }
             } catch (err) {
                 console.error("Error fetching document log:", err);
                 setError(prev => ({ ...prev, log: err.message || "Failed to load document log" }));
                 setLogData([]);
             } finally {
                 setLoading(prev => ({ ...prev, log: false }));
             }
         };
         fetchLog();
    }, [logPagination.currentPage, logPagination.limit]);


    // --- Derived Values & Handlers ---
    const trendDocs = summaryData ? formatTrend(summaryData.docsConvertedTrend) : null;
    const trendAccuracy = summaryData ? formatTrend(summaryData.accuracyTrend) : null;

    const renderTrendPeriodSelector = () => (
      <div className="flex gap-1.5 sm:gap-2 mb-3 flex-shrink-0 flex-wrap">
         {['week', 'month', 'year'].map(periodOption => (
             <button key={periodOption} onClick={() => setTrendPeriod(periodOption)} disabled={loading.accuracyTrends} /* Use accuracy loading */ className={`...`}>
                 Last {periodOption.charAt(0).toUpperCase() + periodOption.slice(1)}
             </button>
         ))}
     </div>
  );

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= logPagination.totalPages && newPage !== logPagination.currentPage) {
            setLogPagination(prev => ({ ...prev, currentPage: newPage }));
        }
    };

    // --- Chart Data Transformation (useMemo) ---
    const lineChartData = useMemo(() => {
      const labels = accuracyTrendsData.map(item => { /* ... date formatting ... */ });
      const dataPoints = accuracyTrendsData.map(item => item.avgAccuracy); // Use avgAccuracy
      return { labels, datasets: [ { label: 'Avg Accuracy', data: dataPoints, /* ... styling ... */ } ] };
    }, [accuracyTrendsData, trendPeriod]);

    const pieChartData = useMemo(() => {
        const labels = docTypeData.map(item => item.type);
        const dataPoints = docTypeData.map(item => item.count);
        return { labels, datasets: [ { label: 'Document Types', data: dataPoints, backgroundColor: PIE_COLORS.slice(0, dataPoints.length), borderColor: '#ffffff', borderWidth: 1, } ] };
    }, [docTypeData]);

    // --- Chart Options ---
    const lineOptions = useMemo(() => ({
        responsive: true, maintainAspectRatio: false, plugins: {
            legend: { display: false }, title: { display: false },
            tooltip: { enabled: true, mode: 'index', intersect: false, backgroundColor: 'rgba(31, 41, 55, 0.8)', titleColor: '#ffffff', bodyColor: '#ffffff', padding: 8, boxPadding: 4, cornerRadius: 4, callbacks: { label: function(context) { let label = context.dataset.label || ''; if (label) label += ': '; if (context.parsed.y !== null) label += formatPercentage(context.parsed.y, 1); return label; } } }
        },
        scales: { x: { ticks: { font: { size: 10 }, color: '#6b7280' }, grid: { display: false }, border: { display: false } }, y: { ticks: { font: { size: 10 }, color: '#6b7280', callback: function(value) { return formatPercentage(value); } }, grid: { color: '#e5e7eb', borderDash: [3, 3] }, border: { display: false }, min: 0.5, max: 1.0 } },
        interaction: { mode: 'index', intersect: false },
        elements: { line: { tension: 0.3 } } // Smoother line
    }), []);

    const pieOptions = useMemo(() => ({
        responsive: true, maintainAspectRatio: false, plugins: {
            legend: { position: 'right', labels: { boxWidth: 10, font: { size: 12 }, color: '#4b5563' } }, // Needs adjustment for dark mode?
            title: { display: false },
            tooltip: { enabled: true, backgroundColor: 'rgba(31, 41, 55, 0.8)', titleColor: '#ffffff', bodyColor: '#ffffff', padding: 8, boxPadding: 4, cornerRadius: 4, callbacks: { label: function(context) { let label = context.label || ''; if (label) label += ': '; if (context.parsed !== null) label += context.parsed.toLocaleString() + ' file(s)'; const total = context.dataset.data.reduce((sum, value) => sum + value, 0); const percentage = total > 0 ? ((context.parsed / total) * 100).toFixed(0) + '%' : '0%'; label += ` (${percentage})`; return label; } } }
        }
    }), []);

    // --- Render Component ---
    return (
        <div className="flex-1 p-4 md:p-6 overflow-y-auto bg-gray-100 dark:bg-gray-900 rounded-lg">
            <PageHeader title="Analytics Dashboard" subtitle="View your document conversion statistics" />

            {/* --- Stats Cards Section --- */}
            <div className="mb-8">
                {loading.summary ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                         {[...Array(4)].map((_, i) => ( <div key={i} className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 h-28 animate-pulse border border-gray-200 dark:border-gray-700"><div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-3"></div><div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-1/2 mb-2"></div><div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div></div> ))}
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
                             {trendDocs && ( <p className={`text-xs ${trendDocs.color} mt-1 flex items-center gap-1`}><FiTrendingUp className={`w-3 h-3 ${trendDocs.iconRotation}`} /> {trendDocs.text} vs prev. period</p> )}
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
                              {trendAccuracy && ( <p className={`text-xs ${trendAccuracy.color} mt-1 flex items-center gap-1`}><FiTrendingUp className={`w-3 h-3 ${trendAccuracy.iconRotation}`} /> {trendAccuracy.text} vs prev. period</p> )}
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
                              <p className="text-xs text-gray-400 mt-1 invisible">placeholder</p>
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
                              <p className="text-xs text-gray-400 mt-1 invisible">placeholder</p>
                         </div>
                    </div>
                 ) : null }
            </div>

            {/* --- Charts Section --- */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Accuracy Trend Chart */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 min-h-[320px] h-80 flex flex-col border border-gray-100 dark:border-gray-700">
                    {/* Header: Title on left, Selector on right */}
                    <div className='flex flex-wrap justify-between items-center gap-2 mb-2'>
                         <h2 className="text-base font-semibold text-gray-700 dark:text-gray-200 flex items-center gap-2">
                             <FiTarget className="w-4 h-4 text-teal-500" />
                             Accuracy Trends
                         </h2>
                         {renderTrendPeriodSelector()}
                    </div>
                    {/* Content Area */}
                    <div className="flex-grow relative flex items-center justify-center"> {/* Center content vertically */}
                         {loading.accuracyTrends ? (
                             <LoadingDisplay text='Loading accuracy trends...' />
                         ) : error.accuracyTrends ? (
                             // Pass retry handler
                             <ErrorDisplay message={error.accuracyTrends} onRetry={() => setRetryCounter(c => c + 1)} />
                         ) : accuracyTrendsData.length > 0 ? (
                             // Ensure chart takes full height/width of container
                             <div className='absolute top-0 left-0 w-full h-full'>
                                  <Line options={lineOptions} data={lineChartData} />
                             </div>
                         ) : (
                             // Improved No Data State
                             <div className="text-center text-gray-500 dark:text-gray-400">
                                <FiBarChart className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500 mb-3 opacity-50" />
                                <p className="text-sm">No accuracy data available for this period.</p>
                            </div>
                         )}
                    </div>
                  </div>

                {/* Document Type Distribution Chart */}
                 <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 min-h-[320px] h-80 flex flex-col border border-gray-100 dark:border-gray-700">
                     <h2 className="text-base font-semibold text-gray-700 dark:text-gray-200 mb-4 flex-shrink-0">Document Types</h2>
                     <div className="flex-grow relative">
                          {loading.docTypes ? <LoadingDisplay text='Loading types...' />
                         : error.docTypes ? <ErrorDisplay message={error.docTypes} />
                         : docTypeData.length > 0 ? (
                               <Pie options={pieOptions} data={pieChartData} />
                         ) : ( <p className="text-center text-gray-500 dark:text-gray-400 pt-10 text-sm">No document type data available.</p> )}
                     </div>
                 </div>
            </div>

             {/* --- Detailed Log Table Section --- */}
            <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden border border-gray-100 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-200 p-4 border-b border-gray-100 dark:border-gray-700">
                    Detailed Document Log
                </h2>
                {loading.log ? ( <LoadingDisplay text="Loading log..." />
                ) : error.log ? ( <ErrorDisplay message={error.log} />
                ) : logData.length === 0 ? (
                     <div className="text-center py-10 px-6">
                         <FiInbox className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500 mb-3" />
                         <p className="text-gray-500 dark:text-gray-400 text-sm">No document logs found.</p>
                     </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="min-w-full text-sm divide-y divide-gray-100 dark:divide-gray-700">
                                <thead className="bg-gray-50 dark:bg-gray-700/50">
                                    <tr>
                                        <th scope="col" className="py-2 px-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Document</th>
                                        <th scope="col" className="py-2 px-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Batch</th>
                                        <th scope="col" className="py-2 px-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                                        <th scope="col" className="py-2 px-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Accuracy</th>
                                        <th scope="col" className="py-2 px-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Processed On</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-100 dark:divide-gray-700 text-gray-700 dark:text-gray-300">
                                    {logData.map((doc) => {
                                        const statusInfo = getStatusBadge(doc.status);
                                        return (
                                            <tr key={doc.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/40">
                                                <td className="py-2 px-3 whitespace-nowrap truncate max-w-[200px] sm:max-w-xs" title={doc.fileName}>
                                                     {/* Could potentially link to a document preview modal */}
                                                     {doc.fileName || 'N/A'}
                                                 </td>
                                                <td className="py-2 px-3 whitespace-nowrap truncate max-w-[200px] sm:max-w-xs" title={doc.batchName}>
                                                    {doc.batchId ? (
                                                        <Link to={`/batch/${doc.batchId}`} className="hover:text-orange-500 hover:underline">
                                                            {doc.batchName || 'N/A'}
                                                        </Link>
                                                    ) : (
                                                        doc.batchName || 'N/A'
                                                    )}
                                                 </td>
                                                <td className="py-2 px-3 whitespace-nowrap">
                                                     <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${statusInfo.color}`}>
                                                         <statusInfo.icon className={`w-3 h-3 ${statusInfo.animate ? 'animate-spin' : ''}`} />
                                                         {statusInfo.text}
                                                     </span>
                                                 </td>
                                                <td className="py-2 px-3 whitespace-nowrap text-center">
                                                     {formatPercentage(doc.accuracy)}
                                                 </td>
                                                <td className="py-2 px-3 whitespace-nowrap">
                                                     {formatDate(doc.updatedAt)} {/* Use updatedAt for processed time */}
                                                 </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                         {/* --- Pagination Controls --- */}
                        {logPagination.totalPages > 1 && (
                             <div className="flex items-center justify-between p-3 border-t border-gray-100 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400">
                                 <div>
                                     Page <strong>{logPagination.currentPage}</strong> of <strong>{logPagination.totalPages}</strong>
                                      <span className="ml-2 hidden sm:inline">({logPagination.totalDocuments.toLocaleString()} total documents)</span>
                                 </div>
                                 <div className="flex gap-1">
                                     <button
                                         onClick={() => handlePageChange(logPagination.currentPage - 1)}
                                         disabled={logPagination.currentPage <= 1 || loading.log}
                                         className="px-2 py-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                         aria-label="Previous Page"
                                     >
                                         <FiChevronLeft className="w-4 h-4" />
                                     </button>
                                     <button
                                         onClick={() => handlePageChange(logPagination.currentPage + 1)}
                                         disabled={logPagination.currentPage >= logPagination.totalPages || loading.log}
                                         className="px-2 py-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                         aria-label="Next Page"
                                     >
                                         <FiChevronRight className="w-4 h-4" />
                                     </button>
                                 </div>
                             </div>
                         )}
                     </>
                )}
            </div>
            {/* --- End Detailed Log Table Section --- */}

        </div>
    );
}

export default AnalyticsPage;