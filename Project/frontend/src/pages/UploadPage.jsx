import React, { useCallback, useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import PreviewModal from '../components/utility/PreviewModal';
import { uploadDocuments } from '../services/documentServices';
import { FiUpload, FiTrash, FiImage, FiFileText, FiFile } from 'react-icons/fi';
import { FaAngleLeft, FaAngleRight } from "react-icons/fa6";

function UploadPage() {
  const [files, setFiles] = useState([]);
  const [batchId, setBatchId] = useState(null);
  const [uploadStatus, setUploadStatus] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [previewModalIndex, setPreviewModalIndex] = useState(null);
  const [showDropzone, setShowDropzone] = useState(true);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const docsPerPage = 2;

  // Helper: Get file type icon based on MIME type
  const getFileTypeIcon = (type) => {
    if (type?.startsWith('image/')) return <FiImage className="w-6 h-6 text-blue-500" />;
    if (type === 'application/pdf') return <FiFileText className="w-6 h-6 text-red-500" />;
    if (type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')
      return <FiFile className="w-6 h-6 text-green-500" />;
    return <FiFileText className="w-6 h-6 text-gray-500" />;
  };

  // Dropzone: When files are dropped, update state with File objects and extra metadata
  const onDrop = useCallback((acceptedFiles) => {
    console.log("Files dropped:", acceptedFiles);
    const mappedFiles = acceptedFiles.map((file) => ({
      file, // Preserve the original File object
      preview: URL.createObjectURL(file),
      title: file.name,
      size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
    }));
    setFiles((prev) => [...prev, ...mappedFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': [],
      'image/png': [],
      'application/pdf': [],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': [],
    },
    multiple: true,
  });

  // Cleanup preview URLs on unmount
  useEffect(() => {
    return () => {
      files.forEach((item) => URL.revokeObjectURL(item.preview));
    };
  }, [files]);

  // Remove a file from selection
  const removeFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // Rename file title
  const renameFile = (index, newName) => {
    setFiles((prev) => {
      const updated = [...prev];
      updated[index].title = newName;
      return updated;
    });
  };

  // Handle file upload: build FormData and pass to service
  const handleUpload = async () => {
    if (files.length === 0) {
      setUploadStatus('No files selected for upload.');
      return;
    }
    setIsUploading(true);
    setUploadStatus('');

    const formData = new FormData();
    // Append the actual File objects stored in the 'file' property
    files.forEach((item) => formData.append('file', item.file));
    if (batchId) formData.append('batch_id', batchId);

    // Debug: log FormData entries (file content will not be printed)
    for (let pair of formData.entries()) {
      console.log(pair[0] + ', ', pair[1]);
    }

    try {
      const result = await uploadDocuments(formData);
      setBatchId(result.batch_id);
      setUploadedFiles((prev) => [...prev, ...result.documents]);
      setFiles([]); // Clear selected files after successful upload
      setUploadStatus(`Upload successful. Batch ID: ${result.batch_id}`);
      setShowDropzone(false);
      setCurrentPageIndex(0);
    } catch (error) {
      setUploadStatus(`Upload failed: ${error.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  // Reset state for a new batch
  const handleReset = () => {
    setFiles([]);
    setUploadedFiles([]);
    setUploadStatus('');
    setBatchId(null);
    setPreviewModalIndex(null);
    setShowDropzone(true);
    setCurrentPageIndex(0);
  };

  // Pagination: calculate pages for uploaded documents
  const totalPages = Math.ceil(uploadedFiles.length / docsPerPage);
  const startIndex = currentPageIndex * docsPerPage;
  const paginatedDocs = uploadedFiles.slice(startIndex, startIndex + docsPerPage);

  // Modal navigation handlers
  const closeModal = () => setPreviewModalIndex(null);
  const prevFile = () => setPreviewModalIndex((i) => (i > 0 ? i - 1 : i));
  const nextFile = () => setPreviewModalIndex((i) => (i < uploadedFiles.length - 1 ? i + 1 : i));

  return (
    <div className="h-full bg-gray-100 dark:bg-gray-900 py-6 px-4">
      <div className="max-w-3xl mx-auto p-6">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 text-center mb-6">
          Document Upload
        </h1>

        {/* Toggle Dropzone Button */}
        {uploadedFiles.length > 0 && (
          <div className="text-center mb-6">
            <button
              onClick={() => setShowDropzone(!showDropzone)}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded transition"
            >
              {showDropzone ? 'Hide Add Files' : 'Add More Files'}
            </button>
          </div>
        )}

        {/* Dropzone Area */}
        {showDropzone && (
          <div
            {...getRootProps()}
            className={`p-12 border-2 border-dashed rounded-lg text-center transition-colors ${
              isDragActive ? 'border-orange-500 bg-orange-50' : 'border-gray-300'
            }`}
          >
            <input {...getInputProps()} />
            <p className="text-xl text-gray-600 dark:text-gray-300">
              Drag & drop files here, or click to select files
            </p>
            <p className="mt-2 text-sm text-gray-500">
              Supported formats: JPG, PNG, PDF, DOCX
            </p>
          </div>
        )}

        {/* Selected Files List */}
        {files.length > 0 && (
          <div className="mt-6 space-y-4">
            <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200">
              Files to Upload
            </h2>
            {files.map((item, index) => (
              <div
                key={index}
                className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 p-3 rounded-lg shadow-md transition-transform hover:scale-105"
              >
                <div className="flex items-center gap-4">
                  {item.file.type?.startsWith('image/') ? (
                    <img src={item.preview} alt={item.title} className="w-12 h-12 object-cover rounded-lg" />
                  ) : (
                    <div className="w-12 h-12 flex items-center justify-center">
                      {getFileTypeIcon(item.file.type || '')}
                    </div>
                  )}
                  <div>
                    <input
                      type="text"
                      value={item.title}
                      onChange={(e) => renameFile(index, e.target.value)}
                      className="w-48 bg-transparent border-none text-gray-800 dark:text-gray-200 focus:outline-none"
                    />
                    <p className="text-sm text-gray-500">{item.size}</p>
                  </div>
                </div>
                <button onClick={() => removeFile(index)} title="Remove file">
                  <FiTrash className="w-6 h-6 text-red-500 hover:text-red-700" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Upload Button */}
        {files.length > 0 && (
          <div className="mt-6 text-center">
            <button
              onClick={handleUpload}
              disabled={isUploading}
              className={`px-6 py-2 rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition duration-300 ${
                isUploading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {isUploading ? 'Uploading...' : 'Upload Files'}
            </button>
          </div>
        )}

        {/* Upload Status */}
        {uploadStatus && <p className="mt-4 text-center text-sm text-gray-600">{uploadStatus}</p>}

        {/* Uploaded Documents with Pagination */}
        {uploadedFiles.length > 0 && (
          <div className="mt-10">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4">
              Uploaded Documents (Batch ID: {batchId})
            </h2>
            <div className="grid grid-cols-2 gap-4">
              {paginatedDocs.map((doc, index) => {
                const globalIndex = startIndex + index;
                return (
                  <div
                    key={doc.id}
                    className="border border-gray-300 dark:border-gray-700 rounded-lg overflow-hidden shadow-md transition-transform hover:scale-105 cursor-pointer"
                    onClick={() => setPreviewModalIndex(globalIndex)}
                  >
                    {doc.previewUrl ? (
                      <img src={doc.previewUrl} alt={doc.title} className="w-full h-32 object-cover" />
                    ) : (
                      <div className="flex items-center justify-center w-full h-32 bg-gray-200 dark:bg-gray-700">
                        <p className="text-sm text-gray-600 dark:text-gray-300">{doc.title}</p>
                      </div>
                    )}
                    <div className="p-3 bg-gray-50 dark:bg-gray-800">
                      <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 truncate">{doc.title}</h3>
                      <p className="text-sm text-gray-500">Size: {doc.fileSize}</p>
                      <p className="text-xs text-gray-400">
                        Uploaded: {new Date(doc.upload_date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
            {totalPages > 1 && (
              <div className="flex justify-center items-center mt-8 space-x-4">
                <button
                  onClick={() => setCurrentPageIndex((prev) => Math.max(prev - 1, 0))}
                  disabled={currentPageIndex === 0}
                  className="px-4 py-2 text-gray-700 hover:text-white disabled:hover:text-gray-700 bg-gray-300 hover:bg-orange-500 disabled:hover:bg-gray-300 rounded disabled:opacity-50 cursor-pointer disabled:cursor-no-drop"
                >
                  <FaAngleLeft className='inline-flex mb-0.5' /> Previous
                </button>
                <button
                  onClick={() => setCurrentPageIndex((prev) => Math.min(prev + 1, totalPages - 1))}
                  disabled={currentPageIndex === totalPages - 1}
                  className="px-4 py-2 text-gray-700 hover:text-white disabled:hover:text-gray-700 bg-gray-300 hover:bg-orange-500 disabled:hover:bg-gray-300 rounded disabled:opacity-50 cursor-pointer disabled:cursor-no-drop"
                >
                  Next <FaAngleRight className='inline-flex mb-0.5' />
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Preview Modal */}
      <PreviewModal
        isOpen={previewModalIndex !== null}
        onClose={() => setPreviewModalIndex(null)}
        file={uploadedFiles[previewModalIndex]}
        currentPage={previewModalIndex || 0}
        totalPages={uploadedFiles.length}
        onPrev={prevFile}
        onNext={nextFile}
      />
    </div>
  );
}

export default UploadPage;
