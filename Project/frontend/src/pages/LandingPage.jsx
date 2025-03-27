import React, { useState, useEffect } from 'react';
import BannerImg from '../assets/images/banner-bg.jpg';

// Logos
import TNLogo from '../assets/images/logos/tn-logo.svg';
import NMLogo from '../assets/images/logos/nm-logo.svg';
import NTLogo from '../assets/images/logos/nt-logo.svg';
import AULogo from '../assets/images/logos/au-logo.svg';
import { useTheme } from '../contexts/ThemeContext';

import DocCard from '../components/DocCard';
import PreviewModal from '../components/utility/PreviewModal';
import { getAllBatches, getPreviewURL } from '../services/documentServices';

function LandingPage() {
  const { darkMode } = useTheme();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Banner logos
  const bannerLogos = [
    { name: 'Tamil Nadu Govt.', logo: TNLogo, link: 'https://www.tn.gov.in/' },
    { name: 'Naan Mudhalvan', logo: NMLogo, link: 'https://naanmudhalvan.tn.gov.in/' },
    { name: 'Niral Thiruvizha', logo: NTLogo, link: 'https://niralthiruvizha.in/' },
    { name: 'Anna University', logo: AULogo, link: 'https://www.annauniv.edu/' },
  ];

  // Batches state: latest 5 batches only
  const [batches, setBatches] = useState([]);
  const [loadingBatches, setLoadingBatches] = useState(true);
  const [batchesError, setBatchesError] = useState(null);

  // Preview modal state for documents in a batch
  const [previewModalDocs, setPreviewModalDocs] = useState([]);
  const [previewModalIndex, setPreviewModalIndex] = useState(null);

  // Fetch batches on mount
  useEffect(() => {
    async function fetchBatches() {
      try {
        const fetchedBatches = await getAllBatches();
        const sortedBatches = fetchedBatches.sort((a, b) => {
          const dateA = new Date(a.lastModified || a.createdOn || 0);
          const dateB = new Date(b.lastModified || b.createdOn || 0);
          return dateB - dateA;
        });
        setBatches(sortedBatches.slice(0, 5));
        setBatchesError(null);
      } catch (err) {
        console.error('Error fetching batches:', err);
        setBatchesError(err.message);
      } finally {
        setLoadingBatches(false);
      }
    }
    fetchBatches();
  }, []);

  // When a batch card is clicked, open the preview modal with its documents.
  // Ensure each document has a valid previewUrl.
  const handleBatchClick = (batch) => {
    if (batch.documents && batch.documents.length > 0) {
      const docsWithPreview = batch.documents.map((doc) => ({
        ...doc,
        previewUrl: doc.previewUrl || getPreviewURL(doc.id),
      }));
      setPreviewModalDocs(docsWithPreview);
      setPreviewModalIndex(0);
    } else {
      alert('No documents in this batch.');
    }
  };

  // Modal navigation handlers
  const closeModal = () => setPreviewModalIndex(null);
  const prevDoc = () =>
    setPreviewModalIndex((i) => (i > 0 ? i - 1 : i));
  const nextDoc = () =>
    setPreviewModalIndex((i) =>
      i < previewModalDocs.length - 1 ? i + 1 : i
    );

  return (
    <div className="pb-12">
      {/* Banner Section */}
      <div className="relative rounded-xl overflow-hidden border border-gray-700 dark:border-none select-none">
        <img src={BannerImg} alt="Banner Image" className="object-cover w-full h-64 shadow-lg" />
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="absolute inset-0 flex flex-col items-center justify-around py-6 gap-3 text-gray-800 dark:text-gray-200">
          <div className="flex items-center gap-8">
            {bannerLogos.map((logo, index) => (
              <a key={index} href={logo.link} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center">
                <img src={logo.logo} alt={logo.name} className="w-10 h-10 md:w-12 md:h-12 cursor-pointer" />
              </a>
            ))}
          </div>
          <h1 className="text-center text-2xl md:text-4xl font-bold text-gray-800">
            Digitize <span className="text-orange-500">History,</span> <br /> Empower the Future
          </h1>
          <p className="hidden md:block text-base text-gray-500 text-center max-w-2xl">
            Transform your handwritten records and archival documents into accessible, searchable digital formats with our advanced AI-powered OCR solution.
          </p>
        </div>
      </div>

      {/* Batches Section */}
      <div className="max-w-5xl mx-auto px-4 mt-10">
        <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-6">Recent Batches</h2>
        {loadingBatches ? (
          <p className="text-center text-gray-500">Loading batches...</p>
        ) : batchesError ? (
          <p className="text-center text-red-500">{batchesError}</p>
        ) : batches.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {batches.map((batch) => (
              <div key={batch.id}>
                <DocCard
                  data={{
                    uniqueId: batch.id,
                    title: batch.name,
                    description: `Documents: ${batch.documentCount} | Total Size: ${batch.totalFileSize} | File Types: ${batch.fileTypes.join(', ')}`,
                    language: "Batch",
                    createdOn: batch.createdOn,
                    lastModified: batch.lastModified,
                    fileSize: batch.totalFileSize,
                    fileType: batch.fileTypes.join(', '),
                    preview: null, // Optionally add a representative image or icon for batch summary
                  }}
                />
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-500">No batches found.</p>
        )}
      </div>

      {/* Preview Modal for documents */}
      {previewModalIndex !== null && previewModalDocs.length > 0 && (
        <PreviewModal
          isOpen={previewModalIndex !== null}
          onClose={closeModal}
          file={previewModalDocs[previewModalIndex]}
          currentPage={previewModalIndex}
          totalPages={previewModalDocs.length}
          onPrev={prevDoc}
          onNext={nextDoc}
        />
      )}
    </div>
  );
}

export default LandingPage;
