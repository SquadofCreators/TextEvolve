import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import DocumentCard from '../components/utility/DocumentCard'; 
import { FiSearch, FiPlusCircle, FiFilter, FiLoader, FiAlertCircle } from 'react-icons/fi';

// --- Dummy Data (Replace with API Fetch) ---
const dummyDocs = [
  { id: '1', title: '18th Century Land Grant Document (Tamil)', description: 'Transcription and analysis of a land grant document from the Tanjore region, detailing property boundaries and ownership.', authorName: 'Researcher One', sharedDate: '2025-04-10T10:00:00Z', language: 'Tamil', period: '18th Century', tags: ['land grant', 'tanjore', 'manuscript'], commentCount: 5 },
  { id: '2', title: 'French Colonial Correspondence Snippet', description: 'A short letter discussing trade matters found in Pondicherry archives.', authorName: 'HistoryBuff22', sharedDate: '2025-04-15T14:30:00Z', language: 'French', period: '19th Century', tags: ['colonialism', 'trade', 'correspondence'], commentCount: 2 },
  { id: '3', title: 'Early English Parish Records - Notes', description: 'Preliminary digitization and notes on birth records from a parish in England.', authorName: 'GenealogyFan', sharedDate: '2025-04-14T09:15:00Z', language: 'English', tags: ['genealogy', 'parish records', 'england'], commentCount: 0 },
  { id: '4', title: 'Latin Manuscript Fragment Analysis', description: 'Discussing the potential origin and content of a fragmented Latin text processed via TextEvolve.', authorName: 'Classicist User', sharedDate: '2025-04-12T11:00:00Z', language: 'Latin', period: 'Medieval', tags: ['fragment', 'latin', 'medieval'], commentCount: 8 },
  // Add more dummy documents
];
// -----------------------------------------


function CommunityPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({}); // Placeholder for filter state
  const [documents, setDocuments] = useState([]); // Start empty
  const [isLoading, setIsLoading] = useState(true); // Loading state
  const [error, setError] = useState(null);

  // --- TODO: Data Fetching Logic ---
  useEffect(() => {
    setIsLoading(true);
    setError(null);
    // Replace with actual API call using searchTerm and filters
    console.log("Fetching documents with term:", searchTerm, "and filters:", filters);
    const fetchDocs = async () => {
      try {
        // Simulate API delay
        await new Promise(res => setTimeout(res, 1000));
        // Filter dummy data based on searchTerm (basic example)
        const filteredDocs = dummyDocs.filter(doc =>
            doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            doc.description.toLowerCase().includes(searchTerm.toLowerCase())
            // Add logic here to filter based on the `filters` state object
        );
        setDocuments(filteredDocs);
      } catch (err) {
        console.error("Failed to fetch documents:", err);
        setError("Could not load documents. Please try again later.");
        setDocuments([]); // Clear documents on error
      } finally {
        setIsLoading(false);
      }
    };
    fetchDocs();
  }, [searchTerm, filters]); // Refetch when search or filters change

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    // Add debounce here if needed for performance
  };

  const handleShareClick = () => {
    // TODO: Implement navigation to share page or open share modal
    alert('Navigate to document sharing page/modal (not implemented)');
  };

  const handleFilterChange = (filterType, value) => {
     // TODO: Implement filter state update logic
     console.log("Filter change:", filterType, value);
     setFilters(prev => ({ ...prev, [filterType]: value }));
  };


  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.07 } } // Stagger card appearance
  };

  return (
    <div className="container mx-auto max-w-7xl py-12 px-4 md:px-6 min-h-[calc(100vh-80px)]">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
            <motion.h1
                className="text-3xl md:text-4xl font-bold text-gray-800"
                initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
            >
                TextEvolve Community
            </motion.h1>
            <motion.button
                onClick={handleShareClick}
                className="inline-flex items-center bg-orange-600 hover:bg-orange-700 text-white py-2.5 px-6 rounded-full text-sm font-semibold transition-colors duration-300 shadow-md hover:shadow-lg"
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            >
                <FiPlusCircle className="w-5 h-5 mr-2"/>
                Share Your Document
            </motion.button>
        </div>
        <motion.p
            className="text-gray-600 mb-10 text-center sm:text-left"
             initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
        >
             Explore digitized documents, insights, and research shared by the TextEvolve community.
             <a href="#community-guidelines" className="text-orange-600 hover:underline ml-2 text-sm">(Community Guidelines)</a> {/* Placeholder link */}
        </motion.p>

        {/* Search and Filter Bar */}
        <motion.div
            className="mb-10 p-4 bg-white rounded-lg shadow border border-gray-100 flex flex-col md:flex-row gap-4 items-center"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
        >
            <div className="relative flex-grow w-full md:w-auto">
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                    type="text"
                    placeholder="Search documents by title, description, tags..."
                    value={searchTerm}
                    onChange={handleSearchChange}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500 text-sm"
                />
            </div>
            {/* TODO: Implement Filter Dropdowns/Modals */}
            <button className="flex items-center justify-center w-full md:w-auto px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500">
                 <FiFilter className="w-4 h-4 mr-2"/>
                Filters
            </button>
        </motion.div>

        {/* Document List / Feed */}
        <div className="community-feed">
            <AnimatePresence mode="wait">
                {isLoading ? (
                    <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex justify-center items-center py-20 text-gray-500">
                         <FiLoader className="w-8 h-8 mr-3 animate-spin text-orange-500"/> Loading documents...
                     </motion.div>
                 ) : error ? (
                     <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex justify-center items-center py-20 text-red-600 bg-red-50 p-4 rounded-md border border-red-200">
                        <FiAlertCircle className="w-6 h-6 mr-3"/> {error}
                    </motion.div>
                ) : documents.length > 0 ? (
                    <motion.div
                        key="documents"
                        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                    >
                        {documents.map(doc => (
                            <DocumentCard key={doc.id} doc={doc} />
                        ))}
                     </motion.div>
                ) : (
                     <motion.div key="no-results" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center py-20 text-gray-500">
                        No documents found matching your criteria. Try sharing one!
                     </motion.div>
                 )}
             </AnimatePresence>
        </div>
         {/* TODO: Add Pagination if list is long */}
    </div>
  );
}

export default CommunityPage;