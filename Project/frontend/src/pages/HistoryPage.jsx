import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom'; 
import { useTheme } from '../contexts/ThemeContext'; 
import { FiDownload, FiEye, FiInfo, FiLoader, FiAlertTriangle, FiInbox, FiCalendar, FiFileText, FiCheckCircle, FiXCircle, FiClock, FiSearch, FiFilter, FiXOctagon, FiClipboard  } from 'react-icons/fi'; 
import { batchService } from '../services/batchService'; 
import HistoryModal from '../components/history/HistoryModal';
import PageHeader from '../components/utility/PageHeader'; 

// Helper function to format date (add if not available elsewhere)
const formatDate = (isoString) => {
    if (!isoString) return 'N/A';
    try {
        return new Date(isoString).toLocaleString(undefined, {
            dateStyle: 'medium',
            timeStyle: 'short',
        });
    } catch (e) {
        return 'Invalid Date';
    }
};

// Helper to get status badge styles
const getStatusBadge = (status) => {
    switch (status) {
        case 'COMPLETED':
            return { icon: FiCheckCircle, text: 'Completed', color: 'text-green-700 dark:text-green-400 bg-green-100 dark:bg-green-900/30' };
        case 'FAILED':
            return { icon: FiXCircle, text: 'Failed', color: 'text-red-700 dark:text-red-400 bg-red-100 dark:bg-red-900/30' };
        case 'PROCESSING':
            return { icon: FiLoader, text: 'Processing', color: 'text-blue-700 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30', animate: true };
        case 'PENDING':
            return { icon: FiClock, text: 'Pending', color: 'text-yellow-700 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/30' };
        default:
            return { icon: FiInfo, text: status || 'Unknown', color: 'text-gray-700 dark:text-gray-400 bg-gray-100 dark:bg-gray-700' };
    }
};

// Status Options for filtering
const STATUS_OPTIONS = [
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'FAILED', label: 'Failed' },
  { value: 'PROCESSING', label: 'Processing' },
  { value: 'PENDING', label: 'Pending' },
];



function HistoryPage() {
    const { darkMode } = useTheme(); 
    const navigate = useNavigate(); 

    // State for data, loading, error, and modal
    const [batches, setBatches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedBatch, setSelectedBatch] = useState(null);
   
    const [searchTerm, setSearchTerm] = useState(''); 
    const [filters, setFilters] = useState({
      status: '',
      startDate: '',
      endDate: '',
    });

    useEffect(() => {
      const fetchHistory = async () => {
          console.log("HistoryPage: Starting fetchHistory...");
          setLoading(true);
          setError('');
          try {
              console.log("HistoryPage: Calling batchService.getMyBatches...");
              const fetchedBatches = await batchService.getMyBatches();
              console.log("HistoryPage: API call successful, received:", fetchedBatches);

              if (!Array.isArray(fetchedBatches)) {
                  console.error("HistoryPage: Fetched data is not an array:", fetchedBatches);
                  throw new Error("Received invalid data format from server.");
              }

              // Sort by creation date descending (newest first)
              fetchedBatches.sort((a, b) => {
                  const dateA = new Date(a.createdAt);
                  const dateB = new Date(b.createdAt);
                  if (isNaN(dateA.getTime()) || isNaN(dateB.getTime())) return 0;
                  return dateB - dateA;
              });

              console.log("HistoryPage: Setting batches state.");
              setBatches(fetchedBatches); // Set batches state here

          } catch (err) {
              console.error("HistoryPage: Error fetching batch history:", err);
              let errorMessage = err.message || 'Failed to load history. Please try again.';
              // Check for specific HTTP status codes if available (depends on apiClient setup)
              const status = err?.response?.status || err?.status;
              if (status === 401 || status === 403) {
                 errorMessage = "Unauthorized. Please ensure you are logged in.";
                 // Optional: navigate('/login'); // Uncomment if you want redirection
              } else if (err?.response?.data?.message) {
                  errorMessage = err.response.data.message; // Use server's message if provided
              }
              setError(errorMessage);

          } finally {
              console.log("HistoryPage: Setting loading to false.");
              setLoading(false); // This ensures loading stops
          }
      };

      fetchHistory();
    }, [navigate]);

    
    // Filtered batches based on search term and status
    const filteredBatches = useMemo(() => {
        let tempBatches = [...batches];
        
        // Apply search term (filter by batch name)
        if (searchTerm.trim()) {
          tempBatches = tempBatches.filter(batch =>
              batch.name.toLowerCase().includes(searchTerm.toLowerCase())
          );
        }

        // Apply status filter
        if (filters.status) {
          tempBatches = tempBatches.filter(batch => batch.status === filters.status);
        }

        // Apply date filters
        const startDate = filters.startDate ? new Date(filters.startDate) : null;
        const endDate = filters.endDate ? new Date(filters.endDate) : null;

        // Adjust dates for comparison: start date from 00:00, end date until 23:59
        if (startDate) startDate.setHours(0, 0, 0, 0);
        if (endDate) endDate.setHours(23, 59, 59, 999);

        if (startDate || endDate) {
          tempBatches = tempBatches.filter(batch => {
              try {
                 const createdAt = new Date(batch.createdAt);
                 // Check if createdAt is a valid date before comparing
                 if (isNaN(createdAt.getTime())) return false;

                 const afterStart = startDate ? createdAt >= startDate : true;
                 const beforeEnd = endDate ? createdAt <= endDate : true;
                 return afterStart && beforeEnd;
              } catch(e) {
                  // Handle potential invalid date strings in batch.createdAt
                  console.warn("Could not parse batch creation date:", batch.createdAt);
                  return false;
              }
          });
        }

        return tempBatches;
    }, [batches, searchTerm, filters]);

    // Handle changes in filter inputs
    const handleFilterChange = (e) => {
      const { name, value } = e.target;
      setFilters(prev => ({ ...prev, [name]: value }));
    };

    // Clear all filters and search
    const clearFiltersAndSearch = () => {
      setSearchTerm('');
      setFilters({ status: '', startDate: '', endDate: '' });
    };

    // Check if any filters are active
    const isFiltered = searchTerm.trim() || filters.status || filters.startDate || filters.endDate;

    // Modal handler (only for 'info' now)
    const handleInfoModalOpen = (batch) => {
        setSelectedBatch(batch);
        // setModalType('info'); // Not needed if only one type
        setIsModalOpen(true);
    };

    // Navigation handler for "View Details"
    const handleViewDetails = (batchId) => {
        navigate(`/batch/${batchId}`); // Navigate to the batch detail page
    };

    const handleViewResults = (batchId) => {
      navigate(`/extraction-results/${batchId}`); // Navigate to the results page
    };

    // Render Loading State
    if (loading) {
        return (
            <div className="flex-1 p-6 h-full flex items-center justify-center bg-gray-100 dark:bg-gray-900 rounded-lg">
                <FiLoader className="animate-spin h-10 w-10 text-orange-500" />
            </div>
        );
        // TODO: Implement Skeleton Loading for better UX
    }

    // Render Error State
    if (error) {
        return (
            <div className="flex-1 p-6 h-full flex flex-col items-center justify-center bg-red-50 dark:bg-red-900/20 rounded-lg text-center">
                <FiAlertTriangle className="h-12 w-12 text-red-500 mb-4" />
                <p className="text-red-700 dark:text-red-300 font-semibold text-lg mb-2">Error Loading History</p>
                <p className="text-red-600 dark:text-red-400">{error}</p>
            </div>
        );
    }

    // Render Main Content
    return (
        <div className="flex-1 h-full p-4 md:p-6 overflow-y-auto bg-gray-50 dark:bg-gray-900 rounded-lg">
          <PageHeader title="Conversion History" subtitle="Review and filter your past document batches" />

          {/* --- Search and Filter Controls --- */}
          <div className="mb-6 p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                  {/* Search Input */}
                  <div className="md:col-span-2 lg:col-span-1">
                      <label htmlFor="search-term" className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Search by Name</label>
                      <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <FiSearch className="w-4 h-4 text-gray-400" />
                          </div>
                          <input
                              type="text"
                              id="search-term"
                              placeholder="Enter batch name..."
                              value={searchTerm}
                              onChange={(e) => setSearchTerm(e.target.value)}
                              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-orange-500 focus:border-orange-500"
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
                          className="w-full px-2 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-orange-500 focus:border-orange-500"
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
                          className="w-full px-2 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-orange-500 focus:border-orange-500"
                          max={filters.endDate || undefined}
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
                          className="w-full px-2 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-orange-500 focus:border-orange-500"
                          min={filters.startDate || undefined}
                      />
                  </div>

                  {/* Clear Button (Only show if filters/search active) */}
                  {isFiltered && (
                      <div className="lg:col-start-4 flex justify-end">
                          <button
                              onClick={clearFiltersAndSearch}
                              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-md transition-colors border border-red-200 dark:border-red-700/50"
                          >
                              <FiXOctagon className="w-4 h-4" />
                              Clear All
                          </button>
                      </div>
                  )}
              </div>
          </div>
          {/* --- End Search and Filter Controls --- */}


          {/* History List or Empty State */}
          <div className="mt-6">
              {/* Use filteredBatches here */}
              {filteredBatches.length === 0 ? (
                  <div className="text-center py-16 px-6 bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
                      <FiInbox className="mx-auto h-16 w-16 text-gray-400 dark:text-gray-500 mb-5" />
                      <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-2">
                          {isFiltered ? 'No Batches Match Criteria' : 'No History Yet'}
                      </h3>
                      <p className="text-gray-500 dark:text-gray-400">
                          {isFiltered
                              ? 'Try adjusting your search or filter settings.'
                              : "You haven't processed any batches. Upload some documents to get started!"}
                      </p>
                      {!isFiltered && ( // Show upload button only if no filters are applied
                          <button
                              onClick={() => navigate('/upload')}
                              className="mt-6 px-5 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition duration-200 text-sm font-medium"
                          > Upload Documents </button>
                      )}
                      {isFiltered && ( // Show clear filters button if filters are applied and list is empty
                          <button
                              onClick={clearFiltersAndSearch}
                              className="mt-6 px-5 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition duration-200 text-sm font-medium"
                          > Clear Filters & Search </button>
                      )}
                  </div>
              ) : (
                  <div className="space-y-4">
                      {/* Map over filteredBatches */}
                      {filteredBatches.map((batch) => {
                        const statusInfo = getStatusBadge(batch.status);
                        return (
                            <div key={batch.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 p-4 md:p-5 border border-gray-200 dark:border-gray-700"> {/* Example Card Styling */}
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    {/* Batch Info */}
                                    <div className="flex-grow min-w-0"> {/* Example Info Styling */}
                                        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 truncate mb-1" title={batch.name}>
                                            {batch.name || `Batch ${batch.id.substring(0, 8)}...`}
                                        </h2>
                                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
                                            <span className='flex items-center gap-1'><FiCalendar className="w-3 h-3" /> {formatDate(batch.createdAt)}</span>
                                            <span className='flex items-center gap-1'><FiFileText className="w-3 h-3" /> {batch.totalFileCount ?? 0} File(s)</span>
                                            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${statusInfo.color}`}>
                                                <statusInfo.icon className={`w-3 h-3 ${statusInfo.animate ? 'animate-spin' : ''}`} />
                                                {statusInfo.text}
                                            </span>
                                        </div>
                                    </div>
                                    {/* Actions */}
                                    <div className="flex-shrink-0 flex items-center justify-start md:justify-end gap-3 md:gap-4 mt-3 md:mt-0"> 
                                        <button 
                                          onClick={() => handleInfoModalOpen(batch)} 
                                          title="View Info" 
                                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-md transition-colors cursor-pointer"
                                        > 
                                          <FiInfo className="w-4 h-4" /> 
                                          <span>Info</span> 
                                        </button>
                                        
                                        {/* <button onClick={() => handleViewDetails(batch.id)} title="View Details" className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/30 rounded-md transition-colors"> <FiEye className="w-4 h-4" /> <span>Details</span> </button> */}

                                        {/* View Results Button */}
                                        {batch.status === 'COMPLETED' && (
                                                <button
                                                    onClick={() => handleViewResults(batch.id)}
                                                    title="View Results"
                                                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-teal-600 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-900/30 rounded-md transition-colors cursor-pointer"
                                                    >
                                                    <FiClipboard className="w-4 h-4" />
                                                    <span>Results</span>
                                                </button>
                                            )}
                                    </div>
                                </div>
                            </div>
                        );
                      })}
                  </div>
              )}
          </div>

          {/* Modal for Info */}
          {selectedBatch && (
                <HistoryModal
                  isOpen={isModalOpen}
                  onClose={() => setIsModalOpen(false)}
                  batch={selectedBatch} 
                />
          )}
        </div>
    );
}

export default HistoryPage;