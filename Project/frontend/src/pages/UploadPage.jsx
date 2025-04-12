import React, { useCallback, useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { useNavigate, Link } from 'react-router-dom';
import { FiTrash, FiImage, FiFileText, FiFile, FiUploadCloud, FiXCircle, FiCheckCircle, FiLoader, FiAlertTriangle } from 'react-icons/fi'; // Added more icons
import { IoArrowForward } from "react-icons/io5";

// Import NEW services
import { batchService } from '../services/batchService';
import { authService } from '../services/authService'; // To check login status

// --- Helper Functions (Consider moving to a utils file) ---

// Format bytes (assuming BigInt conversion needed if input is string)
const formatBytes = (bytes, decimals = 2) => {
  if (typeof bytes === 'string') {
    try { bytes = BigInt(bytes); } catch (e) { return 'N/A'; }
  }
  if (bytes === undefined || bytes === null || bytes < 0n) return 'N/A';
  if (bytes === 0n) return '0 Bytes';
  const k = 1024n;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  let i = 0;
  let size = bytes;
  while (size >= k && i < sizes.length - 1) {
    size /= k;
    i++;
  }
  const numSize = Number(bytes) / Number(k ** BigInt(i));
  return parseFloat(numSize.toFixed(dm)) + ' ' + sizes[i];
}

// Format ISO date string
const formatDate = (isoString) => {
  if (!isoString) return 'N/A';
  try {
    return new Date(isoString).toLocaleString(undefined, { // Use locale defaults
        year: 'numeric', month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });
  } catch (e) { return 'Invalid Date'; }
}

// --- Component ---

function UploadPage() {
  // State for files selected in dropzone
  const [files, setFiles] = useState([]); // { file: File, preview: string, title: string, size: string }

  // State for the new batch being created
  const [batchName, setBatchName] = useState('');
  const [createdBatchId, setCreatedBatchId] = useState(null); // Store ID after creation

  // Upload process state
  const [uploadStatus, setUploadStatus] = useState({ message: '', type: 'idle' }); // idle, loading, success, error
  const [isUploading, setIsUploading] = useState(false);

  // State for list of existing batches
  const [batches, setBatches] = useState([]);
  const [loadingBatches, setLoadingBatches] = useState(true);
  const [batchesError, setBatchesError] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const navigate = useNavigate();

  // --- Fetch Existing Batches ---
  const fetchBatches = useCallback(async () => {
    if (!authService.getToken()) {
      setIsLoggedIn(false);
      setBatchesError("Please log in to manage batches.");
      setLoadingBatches(false);
      setBatches([]);
      return;
    }
    setIsLoggedIn(true);
    setLoadingBatches(true);
    setBatchesError(null);
    try {
      const fetchedBatches = await batchService.getMyBatches();
      const sortedBatches = fetchedBatches.sort((a, b) =>
        new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0)
      );
      setBatches(sortedBatches);
    } catch (error) {
      console.error("Failed to fetch batches:", error);
      setBatchesError(error.message || "Could not load existing batches.");
      if (error.status === 401 || error.status === 403) {
            authService.logout(); // Clear token
            setIsLoggedIn(false);
            setBatchesError("Session expired. Please log in again.");
      }
    } finally {
      setLoadingBatches(false);
    }
  }, []); // useCallback dependency

  // Fetch batches on mount and when login status might change
  useEffect(() => {
    fetchBatches();
  }, [fetchBatches]); // Dependency includes the function itself now

  // --- Dropzone Logic ---
  const onDrop = useCallback((acceptedFiles) => {
    const mappedFiles = acceptedFiles.map((file) => ({
      file,
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : null, // Only create preview for images
      title: file.name,
      size: formatBytes(BigInt(file.size)), // Format size immediately
    }));
    setFiles((prev) => [...prev, ...mappedFiles]);
    setUploadStatus({ message: '', type: 'idle' }); // Clear status when new files added
    setCreatedBatchId(null); // Reset created batch ID if adding more files
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { // Match backend allowed types
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/gif': ['.gif'],
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    },
    multiple: true,
  });

  // Cleanup preview URLs
  useEffect(() => {
    return () => {
      files.forEach((item) => {
        if (item.preview) URL.revokeObjectURL(item.preview);
      });
    };
  }, [files]);

  // --- File/Batch Management Handlers ---

  const removeFile = (index) => {
    setFiles((prev) => {
      const newFiles = prev.filter((_, i) => i !== index);
      if (newFiles.length === 0) {
        setUploadStatus({ message: '', type: 'idle' }); // Clear status if no files left
        setCreatedBatchId(null);
      }
      return newFiles;
    });
  };

  const renameFile = (index, newName) => {
    setFiles((prev) => {
      const updated = [...prev];
      // Ensure index is valid
      if (updated[index]) {
        updated[index].title = newName;
      }
      return updated;
    });
  };

  const handleUpload = async () => {
    if (files.length === 0 || !batchName.trim()) {
      setUploadStatus({ message: 'Please select files and enter a batch name.', type: 'error' });
      return;
    }
    setIsUploading(true);
    setUploadStatus({ message: 'Creating batch...', type: 'loading' });
    setCreatedBatchId(null); // Reset previous success ID

    let newBatchId = null;

    try {
      // 1. Create the batch first
      const createResponse = await batchService.createBatch(batchName.trim());
      newBatchId = createResponse.id; // Get ID from response
      setCreatedBatchId(newBatchId); // Store the new batch ID
      console.log("Batch created:", createResponse);
      setUploadStatus({ message: `Batch '${batchName}' created (ID: ${newBatchId}). Uploading files...`, type: 'loading' });

      // 2. Prepare FormData for file upload
      const formData = new FormData();
      files.forEach((item) => formData.append('documents', item.file)); // Key is 'documents'

      // 3. Upload files to the newly created batch
      const uploadResponse = await batchService.uploadDocuments(newBatchId, files.map(f => f.file)); // Pass File objects
      console.log("Files uploaded:", uploadResponse);

      setUploadStatus({ message: `${files.length} file(s) successfully uploaded to batch '${batchName}'.`, type: 'success' });
      setFiles([]); // Clear selected files
      setBatchName(''); // Clear batch name input
      // No need to hide dropzone, user might want to create another batch

      // 4. Refresh the list of existing batches to include the new one
      await fetchBatches();

    } catch (error) {
      console.error("Upload process failed:", error);
      let errorMsg = error.message || 'An unknown error occurred.';
      if (newBatchId && error.message.includes('upload')) {
         errorMsg = `Batch '${batchName}' created, but file upload failed: ${error.message}. You can try uploading again to this batch (ID: ${newBatchId}) later.`;
         // Don't clear files or batch name in this case, let user retry? Or clear batch name?
         setBatchName(''); // Clear batch name so they don't accidentally reuse it
      } else if (!newBatchId && error.message.includes('create')) {
         errorMsg = `Failed to create batch: ${error.message}`;
      }
      setUploadStatus({ message: errorMsg, type: 'error' });
    } finally {
      setIsUploading(false);
    }
  };

  // Reset for a completely new upload session
  const handleReset = () => {
    setFiles([]);
    setBatchName('');
    setUploadStatus({ message: '', type: 'idle' });
    setCreatedBatchId(null);
    setIsUploading(false);
  };

  // Navigate to view/extract the newly created batch
  const handleViewBatch = () => {
    if (!createdBatchId) return;
    navigate(`/batch/${createdBatchId}`); // Navigate to a batch detail route
  };

  // Delete an existing batch
  const handleDeleteBatch = async (batchIdToDelete, batchNameToDelete) => {
    if (!window.confirm(`Are you sure you want to delete the batch "${batchNameToDelete || batchIdToDelete}"?\nThis action cannot be undone.`)) return;
    try {
      setBatchesError(null); // Clear previous errors
      await batchService.deleteBatch(batchIdToDelete);
      setBatches((prev) => prev.filter((batch) => batch.id !== batchIdToDelete));
      // If deleting the currently created batch, reset relevant state
      if (batchIdToDelete === createdBatchId) {
         setCreatedBatchId(null);
         setUploadStatus({ message: `Batch "${batchNameToDelete || batchIdToDelete}" deleted.`, type: 'info' });
      }
    } catch (error) {
      console.error(`Error deleting batch ${batchIdToDelete}:`, error);
      setBatchesError(`Failed to delete batch: ${error.message}`);
    }
  };

  // Helper for icon based on file type (simplified)
  const getFileTypeIcon = (file) => {
    const type = file?.type || '';
    if (type.startsWith('image/')) return <FiImage className="w-8 h-8 text-orange-500" />;
    if (type === 'application/pdf') return <FiFileText className="w-8 h-8 text-red-500" />;
    if (type.includes('word')) return <FiFileText className="w-8 h-8 text-orange-500" />;
    return <FiFile className="w-8 h-8 text-gray-500" />;
  };

  // --- Render ---

  return (
    <div className="flex-1 p-6 h-full overflow-y-auto bg-gray-100 dark:bg-gray-800 rounded-lg">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-gray-100 text-center mb-6">
          Create New Batch & Upload Documents
        </h1>

        {/* --- Upload Section --- */}
        <div className="rounded-lg mb-8">

          {/* Batch Name Input */}
          <div className="mb-4">
            <label htmlFor="batchName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              New Batch Name
            </label>
            <input
              type="text"
              id="batchName"
              value={batchName}
              onChange={(e) => setBatchName(e.target.value)}
              placeholder="e.g., 'Historical Records Q1' or 'Meeting Notes April'"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              disabled={isUploading}
            />
          </div>

          {/* Dropzone */}
          <div
            {...getRootProps()}
            className={`p-8 md:p-12 border-2 border-dashed rounded-lg text-center cursor-pointer select-none transition-colors duration-200 ease-in-out ${
              isDragActive
                ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/30'
                : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
            }`}
          >
            <input {...getInputProps()} disabled={isUploading} />
            <FiUploadCloud className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500 mb-3" />
            <p className="text-base font-medium text-gray-600 dark:text-gray-300">
              {isDragActive ? 'Drop the files here ...' : "Drag 'n' drop files here, or click to select"}
            </p>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Supports: JPG, PNG, GIF, PDF, DOC, DOCX (Max 50MB per file)
            </p>
          </div>

          {/* Selected Files Preview Area */}
          {files.length > 0 && (
            <div className="mt-6">
              <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-3">
                Files Selected ({files.length}):
              </h3>
              <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                {files.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 p-3 rounded-lg shadow-sm"
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="flex-shrink-0">
                        {item.preview ? (
                          <img
                            src={item.preview}
                            alt="Preview"
                            className="w-10 h-10 object-cover rounded"
                            onLoad={() => URL.revokeObjectURL(item.preview)} // Revoke after load
                          />
                        ) : (
                          <div className="w-10 h-10 flex items-center justify-center bg-gray-200 dark:bg-gray-600 rounded">
                             {getFileTypeIcon(item.file)}
                          </div>
                        )}
                      </div>
                      <div className="flex-grow min-w-0">
                         {/* Allow renaming the display title */}
                         <input
                            type="text"
                            value={item.title}
                            onChange={(e) => renameFile(index, e.target.value)}
                            className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate bg-transparent border-b border-transparent focus:border-orange-500 focus:outline-none w-full"
                            disabled={isUploading}
                            title={item.title} // Show full name on hover
                         />
                        <p className="text-xs text-gray-500 dark:text-gray-400">{item.size}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => removeFile(index)}
                      title="Remove file"
                      className="ml-2 flex-shrink-0 text-gray-400 hover:text-red-500 disabled:opacity-50"
                      disabled={isUploading}
                    >
                      <FiXCircle className="w-5 h-5" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Upload Action Buttons */}
              <div className="mt-6 flex flex-col sm:flex-row justify-center items-center gap-4">
                <button
                  onClick={handleUpload}
                  disabled={isUploading || !batchName.trim()}
                  className={`px-6 py-2 rounded-lg text-white font-medium transition duration-200 flex items-center justify-center gap-2 ${
                    isUploading || !batchName.trim()
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-orange-600 hover:bg-orange-700'
                  }`}
                >
                  {isUploading ? (
                    <> <FiLoader className="animate-spin h-5 w-5 mr-2"/> Uploading... </>
                  ) : (
                    <> <FiUploadCloud className="h-5 w-5 mr-1"/> Upload {files.length} File(s) </>
                  )}
                </button>
                 <button
                    onClick={handleReset}
                    disabled={isUploading}
                    className="px-4 py-2 rounded-lg text-gray-600 dark:text-gray-300 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 transition duration-200 disabled:opacity-50"
                    title="Clear selection and batch name"
                 >
                    Clear Selection
                 </button>
              </div>
            </div>
          )}

          {/* Upload Status */}
          {uploadStatus.message && (
            <div className={`mt-4 text-center p-3 rounded-md text-sm ${
              uploadStatus.type === 'success' ? 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300' :
              uploadStatus.type === 'error' ? 'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300' :
              uploadStatus.type === 'loading' ? 'bg-orange-100 dark:bg-orange-900/50 text-orange-700 dark:text-orange-300' :
              'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
            }`}>
              {uploadStatus.type === 'success' && <FiCheckCircle className="inline mr-2 mb-0.5"/>}
              {uploadStatus.type === 'error' && <FiAlertTriangle className="inline mr-2 mb-0.5"/>}
              {uploadStatus.type === 'loading' && <FiLoader className="inline animate-spin mr-2 mb-0.5"/>}
              {uploadStatus.message}
            </div>
          )}

          {/* View Newly Created Batch Button */}
          {uploadStatus.type === 'success' && createdBatchId && (
            <div className="mt-4 text-center">
              <button
                onClick={handleViewBatch}
                className="flex items-center justify-center mx-auto gap-2 px-5 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition cursor-pointer"
              >
                View Batch & Extract Data
                <IoArrowForward />
              </button>
            </div>
          )}
        </div> {/* End Upload Section */}


        {/* --- Existing Batches Section --- */}
        <div className="mt-10">
          <h2 className="text-xl md:text-2xl font-semibold text-gray-700 dark:text-gray-200 mb-4">
            Existing Batches
          </h2>
          {loadingBatches ? (
            <div className="text-center text-gray-500 dark:text-gray-400"> <FiLoader className="inline animate-spin mr-2"/> Loading batches...</div>
          ) : batchesError ? (
            <div className="text-center p-4 border border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/30 rounded-md">
                <p className="text-red-600 dark:text-red-300 font-semibold flex items-center justify-center gap-2"><FiAlertTriangle/> Could not load batches</p>
                <p className="text-red-500 dark:text-red-400 text-sm mt-1">{batchesError}</p>
                {!isLoggedIn && (
                    <button
                        onClick={() => navigate('/login')}
                        className="mt-3 px-3 py-1 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition text-sm"
                    >
                        Go to Login
                    </button>
                 )}
            </div>
          ) : batches.length > 0 ? (
            <ul className="space-y-3">
              {batches.map((batch) => (
                <li key={batch.id} className={`flex flex-col md:flex-row justify-between items-start p-4 border rounded-lg transition-colors duration-300 ${
                  batch.id === createdBatchId ? 'bg-orange-50 dark:bg-orange-900/30 border-orange-300 dark:border-orange-700' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                }`}>
                  <div className="w-full flex flex-col mb-2 sm:mb-0">
                    <Link to={`/batch/${batch.id}`} className="hover:underline">
                        <p className="font-semibold text-base text-gray-900 dark:text-gray-100">
                          {batch.name || `Batch ${batch.id.substring(0, 8)}...`}
                        </p>
                    </Link>
                    <div className="w-full flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500 dark:text-gray-400 mt-1">
                        <span>Files: {batch.totalFileCount ?? 0}</span>
                        <span>Size: {formatBytes(batch.totalFileSize)}</span>
                        <span>Status: <span className={`font-medium ${batch.status === 'COMPLETED' ? 'text-green-600 dark:text-green-400' : batch.status === 'FAILED' ? 'text-red-600 dark:text-red-400' : 'text-yellow-600 dark:text-yellow-400'}`}>{batch.status || 'N/A'}</span></span>
                        <span>Created: {formatDate(batch.createdAt)}</span>
                    </div>
                  </div>
                  <div className="w-full md:w-max flex items-center justify-end md:justify-between gap-3 flex-shrink-0">
                    
                    <button
                      onClick={() => handleDeleteBatch(batch.id, batch.name)}
                      className="flex items-center justify-center gap-1 px-3 py-2 md:py-3 text-white bg-red-500 dark:bg-red-500 hover:text-red-200 dark:hover:text-red-200 rounded-md transition duration-200 cursor-pointer"
                      title="Delete Batch"
                    >
                      {/* <span className='text-sm md:hidden'>
                        Delete Batch
                      </span> */}
                      <FiTrash />
                    </button>

                    <Link 
                      to={`/batch/${batch.id}`} title="View Batch Details" 
                      className="flex items-center justify-center gap-1 px-3 py-2 md:py-3 text-white bg-blue-600 dark:bg-blue-500 hover:text-blue-200 dark:hover:text-blue-200 rounded-md transition duration-200"
                    >
                      {/* <span className='text-sm md:hidden'>
                        View & Extract
                      </span> */}
                      <IoArrowForward />
                    </Link>
                    
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-center text-gray-600 dark:text-gray-400 p-4 border border-dashed border-gray-300 dark:border-gray-600 rounded-md">
              No batches found. Upload some documents to get started!
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default UploadPage;