import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; // For redirection
import BannerImg from '../assets/images/banner-bg.jpg';

// Logos
import TNLogo from '../assets/images/logos/tn-logo.svg';
import NMLogo from '../assets/images/logos/nm-logo.svg';
import NTLogo from '../assets/images/logos/nt-logo.svg';
import AULogo from '../assets/images/logos/au-logo.svg';
import { useTheme } from '../contexts/ThemeContext';

import DocCard from '../components/DocCard';
import PreviewModal from '../components/utility/PreviewModal';
import {
  getAllBatches,
  getPreviewURL,
  getDownloadURL,
  downloadBatchDocuments,
} from '../services/documentServices';

const BASE_URL = import.meta.env.VITE_API_ENDPOINT;

function LandingPage() {
  const { darkMode } = useTheme();
  const navigate = useNavigate();

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

  // Preview modal state for individual documents in a batch
  const [previewModalDocs, setPreviewModalDocs] = useState([]);
  const [previewModalIndex, setPreviewModalIndex] = useState(null);

  useEffect(() => {
    async function fetchBatches() {
      try {
        const fetchedBatches = await getAllBatches();
  
        // Ensure dates are properly parsed and sorted in descending order
        const sortedBatches = fetchedBatches.sort((a, b) => {
          const dateA = new Date(b.modified_on.$date || b.created_on.$date || 0); // Swap a & b
          const dateB = new Date(a.modified_on.$date || a.created_on.$date || 0);
          return dateA - dateB;
        });
  
        setBatches([...sortedBatches.slice(0, 5)]); // Display latest 5 batches
        setBatchesError(null);
      } catch (err) {
        console.error("Error fetching batches:", err);
        setBatchesError(err.message);
      } finally {
        setLoadingBatches(false);
      }
    }
  
    fetchBatches();
  }, []);
  
  

  /**
   * When user clicks "Preview Docs" on a batch card,
   * map each document to include a preview_url and download_url.
   */
  const handlePreview = (batch) => {
    if (batch.documents && batch.documents.length > 0) {
      // Use the preview_url if returned; otherwise, fallback to helper functions.
      const docsWithPreview = batch.documents.map((doc) => ({
        ...doc,
        preview_url: doc.preview_url || getPreviewURL(batch._id, doc.id),
        download_url: doc.download_url || getDownloadURL(batch._id, doc.id),
      }));
      setPreviewModalDocs(docsWithPreview);
      setPreviewModalIndex(0);
    } else {
      alert('No documents in this batch.');
    }
  };

  /**
   * When user clicks "Download" on a batch card,
   * download all documents as a zip.
   */
  const handleDownload = async (batch) => {
    try {
      const blob = await downloadBatchDocuments(batch._id);
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch (error) {
      alert(error.message);
    }
  };

  // Extract Data
  const handleExtractData = (batch) => {
    navigate(`/extract-text/${batch._id}`)
  }

  // Modal navigation handlers for individual document preview
  const closeModal = () => setPreviewModalIndex(null);
  const prevDoc = () => setPreviewModalIndex((i) => (i > 0 ? i - 1 : i));
  const nextDoc = () =>
    setPreviewModalIndex((i) => (i < previewModalDocs.length - 1 ? i + 1 : i));

  return (
    <div className="px-4 py-6">
      {/* Banner Section */}
      <div className="relative rounded-xl overflow-hidden border border-gray-700 dark:border-none select-none">
        <img
          src={BannerImg}
          alt="Banner Image"
          className="object-cover w-full h-56 md:h-64 shadow-lg"
        />
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="absolute inset-0 flex flex-col items-center justify-around py-6 gap-3 text-gray-800 dark:text-gray-200">
          <div className="flex items-center gap-8">
            {bannerLogos.map((logo, index) => (
              <a
                key={index}
                href={logo.link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center"
              >
                <img
                  src={logo.logo}
                  alt={logo.name}
                  className="w-10 h-10 md:w-12 md:h-12 cursor-pointer"
                />
              </a>
            ))}
          </div>
          <h1 className="text-center text-3xl md:text-4xl font-bold text-gray-700">
            Digitize <span className="text-orange-500">History,</span> <br /> Empower the Future
          </h1>
          <p className="hidden md:block text-base text-gray-500 text-center max-w-2xl">
            Transform your handwritten records and archival documents into accessible, searchable digital formats with our advanced AI-powered OCR solution.
          </p>
        </div>
      </div>

      {/* Batches Section */}
      <div className="w-full px-1 mt-5">
        <h2 className="text-lg text-gray-500 dark:text-gray-100 mb-3">Recent Batches</h2>
        {loadingBatches ? (
          <p className="text-center text-gray-500">Loading batches...</p>
        ) : batchesError ? (
          <p className="text-center text-red-500">{batchesError}</p>
        ) : batches.length > 0 ? (
          <div className="grid grid-cols-1 gap-6">
            {batches.map((batch) => {
              const fileTypes = batch.file_types ? batch.file_types.join(', ') : '';
              const cardData = {
                Id: batch._id,
                Name: batch.name,
                "Created On": batch.created_on,
                "Modified On": batch.modified_on,
                "Total File Size": batch.total_file_size,
                "Total files": batch.total_files,
                "File Types": fileTypes,
                "download all docs zip": `${BASE_URL}/documents/download_batch_documents/${batch._id}`,
                "preview all docs": `${BASE_URL}/documents/preview_batch_documents/${batch._id}`,
              };
              return (
                <DocCard
                  key={batch._id}
                  data={cardData}
                  onPreview={() => handlePreview(batch)}
                  onDownload={() => handleDownload(batch)}
                  onExtractData={() => handleExtractData(batch)}
                />
              );
            })}
          </div>
        ) : (
          <div className="text-center space-y-4">
            <p className="text-gray-500">No batches found.</p>
            <button
              onClick={() => navigate('/upload')}
              className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
            >
              Start Upload Files
            </button>
          </div>
        )}
      </div>

      {/* Preview Modal for individual documents */}
      {previewModalIndex !== null && previewModalDocs.length > 0 && (
        <PreviewModal
          isOpen={true}
          onClose={closeModal}
          file={previewModalDocs[previewModalIndex]}
          currentPage={previewModalIndex}
          totalPages={previewModalDocs.length}
          onPrev={prevDoc}
          onNext={nextDoc}
          filesList={previewModalDocs}
        />
      )}
    </div>
  );
}

export default LandingPage;
