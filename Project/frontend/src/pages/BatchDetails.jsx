import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import {
  getBatch,
  getPreviewURL,
  getDownloadURL,
  deleteDocument,
} from "../services/documentServices";
import PageHeader from "../components/utility/PageHeader";
import PreviewModal from "../components/utility/PreviewModal";
import ConfirmationModal from "../components/utility/ConfirmationModal";
import { FiTrash2, FiFileText, FiEye, FiDownload } from "react-icons/fi";

// MetaText
import MetaText from "../components/utility/MetaText";

import { LuCalendarDays, LuCalendarClock } from "react-icons/lu";
import { GrStorage } from "react-icons/gr";
import { MdFolderOpen } from "react-icons/md";
import { FaRegFileLines, FaHashtag } from "react-icons/fa6";

const BatchDetails = () => {
  const { batchId } = useParams();
  const navigate = useNavigate();
  const [batch, setBatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  // State for preview modal (single document preview)
  const [previewModalDoc, setPreviewModalDoc] = useState(null);
  // State for confirmation modal for deletion
  const [confirmDoc, setConfirmDoc] = useState(null);

  useEffect(() => {
    async function fetchBatch() {
      try {
        const data = await getBatch(batchId);
        setBatch(data);
        setError("");
      } catch (err) {
        console.error("Error fetching batch details:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchBatch();
  }, [batchId]);

  const formatDate = (dateInput) => {
    if (!dateInput) return "N/A";
    try {
      const parsedDate = new Date(dateInput.$date || dateInput);
      if (isNaN(parsedDate.getTime())) return "N/A";
      return format(parsedDate, "PPP, p");
    } catch {
      return "N/A";
    }
  };

  // Converts bytes to MB with two decimal places.
  const formatBytesToMB = (bytes) => {
    if (!bytes || bytes <= 0) return "N/A";
    return (bytes / (1024 * 1024)).toFixed(2) + " MB";
  };

  // Handler to open preview modal for a document.
  const handlePreview = (doc) => {
    const preview_url = doc.preview_url || getPreviewURL(batch._id, doc.id);
    setPreviewModalDoc({ ...doc, preview_url });
  };

  // Request deletion: open the confirmation modal.
  const requestDeleteDocument = (doc) => {
    setConfirmDoc(doc);
  };

  // Handler for confirming deletion.
  const handleConfirmDelete = async () => {
    if (!confirmDoc) return;
    try {
      await deleteDocument(batch._id, confirmDoc.id);
      // Update UI by filtering out the deleted document.
      const updatedDocs = batch.documents.filter((d) => d.id !== confirmDoc.id);
      setBatch({ ...batch, documents: updatedDocs });
    } catch (error) {
      console.error("Deletion error:", error.message);
    } finally {
      setConfirmDoc(null);
    }
  };

  // Handler for cancelling deletion.
  const handleCancelDelete = () => {
    setConfirmDoc(null);
  };

  // Handler to proceed to text extraction.
  const handleTextExtraction = (doc) => {
    navigate(`/extract-text/${batch._id}`);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-gray-500">Loading batch details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col justify-center items-center h-screen">
        <p className="text-red-500 mb-4">{error}</p>
        <button
          onClick={() => navigate("/")}
          className="px-4 py-2 bg-blue-600 text-white rounded"
        >
          Back to Home
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 h-full px-1 py-6 md:p-6 overflow-y-auto bg-gray-100 dark:bg-gray-800 rounded-lg">
      <PageHeader title="Batch Details" />

      <div className="px-4 mb-8">
        <h2 className="text-3xl font-semibold text-gray-700 mb-4">{batch.name}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <MetaText icon={<FaHashtag/>} title="Created On" value={batch._id}/>

          <MetaText icon={<LuCalendarDays/>} title="Created On" value={formatDate(batch.created_on)}/>
          
          <MetaText icon={<LuCalendarClock/>} title="Modified On" value={formatDate(batch.modified_on)} />

          <MetaText icon={<GrStorage/>} title="Total File Size" value={formatBytesToMB(batch.total_file_size)} />

          <MetaText 
            icon={<MdFolderOpen/>} 
            title="Total Files" 
            value={batch.total_files > 1 ? batch.total_files + " Files" : batch.total_files + " File" } 
          />

          <MetaText icon={<FaRegFileLines/>} title="File Types" value={batch.file_types.join(", ")} />
        </div>
      </div>

      <div className="px-4 mb-8">
        <h2 className="text-2xl font-semibold text-gray-700 mb-4">
          Documents in Batch
        </h2>
        {batch.documents && batch.documents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {batch.documents.map((doc) => (
              <div
                key={doc.id}
                className="bg-white shadow rounded-lg p-4 relative"
              >
                {/* Document Details */}
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-gray-800 mb-2">
                    {doc.title || doc.name}
                  </h3>
                  
                  <div className="top-2 right-2 flex gap-4">
                    <button
                      onClick={() => handlePreview(doc)}
                      title="Preview"
                      className="text-blue-600 hover:text-blue-800 cursor-pointer"
                    >
                      <FiEye size={18} />
                    </button>
                    <a
                      href={doc.download_url || getDownloadURL(batch._id, doc.id)}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Download"
                      className="text-green-600 hover:text-green-800 cursor-pointer"
                    >
                      <FiDownload size={18} />
                    </a>
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">File Size:</span> {formatBytesToMB(doc.file_size)}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Uploaded On:</span>{" "}
                    {formatDate(doc.uploaded_on)}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">File Type:</span> {doc.file_type}
                  </p>
                </div>
                {/* Bottom Action Buttons */}
                <div className="mt-4 flex justify-between items-center">
                  <button
                    onClick={() => requestDeleteDocument(doc)}
                    className="flex items-center gap-1 text-red-500 hover:text-red-700 cursor-pointer"
                    title="Delete Document"
                  >
                    <FiTrash2 size={16} />
                    <span className="text-sm">Delete</span>
                  </button>
                  <button
                    onClick={() => handleTextExtraction(doc)}
                    className="flex items-center gap-1 text-blue-500 hover:text-blue-700 cursor-pointer"
                    title="Extract Text"
                  >
                    <FiFileText size={16} />
                    <span className="text-sm">Extract Text</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No documents found in this batch.</p>
        )}
      </div>

      {/* Preview Modal for single document */}
      {previewModalDoc && (
        <PreviewModal
          isOpen={true}
          onClose={() => setPreviewModalDoc(null)}
          file={previewModalDoc}
          currentPage={0}
          totalPages={1}
          onPrev={() => {}}
          onNext={() => {}}
          filesList={[previewModalDoc]}
          showDownloadAll={false}
        />
      )}

      {/* Confirmation Modal for deletion */}
      {confirmDoc && (
        <ConfirmationModal
          isOpen={true}
          title="Confirm Deletion"
          message={`Are you sure you want to delete "${confirmDoc.title || confirmDoc.name}"? This action cannot be undone.`}
          confirmText="Delete"
          cancelText="Cancel"
          variant="danger"
          onConfirm={handleConfirmDelete}
          onCancel={handleCancelDelete}
        />
      )}
    </div>
  );
};

export default BatchDetails;
