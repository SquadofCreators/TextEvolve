import React, { useCallback, useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import PreviewModal from '../components/utility/PreviewModal';
import { uploadDocuments } from '../services/documentServices';

function UploadPage() {
  const [files, setFiles] = useState([]);
  const [previewModalIndex, setPreviewModalIndex] = useState(null);
  const [uploadStatus, setUploadStatus] = useState('');
  const [uploadResult, setUploadResult] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  // 🟠 Dropzone setup
  const onDrop = useCallback((acceptedFiles) => {
    const mappedFiles = acceptedFiles.map((file) =>
      Object.assign(file, {
        preview: URL.createObjectURL(file), // ✅ Create a local preview URL
      })
    );
    setFiles((prevFiles) => [...prevFiles, ...mappedFiles]);
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

  // 🧹 Cleanup memory leaks on unmount
  useEffect(() => {
    return () => {
      files.forEach((file) => URL.revokeObjectURL(file.preview));
    };
  }, [files]);

  // ✅ Close Modal
  const closeModal = () => setPreviewModalIndex(null);

  // ✅ Handle Next and Previous in Modal
  const prevFile = () => setPreviewModalIndex((prev) => (prev > 0 ? prev - 1 : prev));
  const nextFile = () => setPreviewModalIndex((prev) => (prev < files.length - 1 ? prev + 1 : prev));

  // ✅ Handle Upload Result Mapping
  const handleUpload = async () => {
    if (files.length === 0) {
      setUploadStatus('No files selected for upload.');
      return;
    }

    setIsUploading(true);
    setUploadStatus('');

    try {
      // Upload files using the service
      const result = await uploadDocuments(files);

      // ✅ Map result correctly
      const mappedResults = result.documents.map((doc, index) => ({
        ...doc,
        preview: doc.preview || files[index]?.preview || '', // Use file_url from backend
        fileType: doc.fileType || getFileType(doc.filename),
        uploadDate: new Date(doc.lastModified?.$date || 0).toLocaleString(), // Format date
      }));

      setUploadResult({
        ...result,
        documents: mappedResults,
      });

      setUploadStatus(`Upload successful. Batch ID: ${result.batch_id}`);
      
      // ✅ Remove auto-open preview after upload
      setPreviewModalIndex(null); 
    } catch (error) {
      setUploadStatus(`Upload failed: ${error.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  // ✅ Reset State
  const handleReset = () => {
    setFiles([]);
    setUploadResult(null);
    setUploadStatus('');
    setPreviewModalIndex(null);
  };

  return (
    <div className="min-h-full flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-900 rounded-xl shadow-lg p-4 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200">

      {/* 🟠 Drag & Drop Area */}
      {!uploadResult && files.length === 0 && (
        <div
          {...getRootProps()}
          className="border-4 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-8 w-full max-w-lg text-center cursor-pointer transition-colors hover:border-orange-500"
        >
          <input {...getInputProps()} />
          {isDragActive ? (
            <p className="text-lg text-gray-600 dark:text-gray-300">Drop the files here ...</p>
          ) : (
            <p className="text-lg text-gray-600 dark:text-gray-300">
              Drag 'n' drop some files here, or click to select files
            </p>
          )}
          <div className="mt-4">
            <p className="text-gray-500 dark:text-gray-400">
              Supported formats: JPG, PNG, PDF, DOCX
            </p>
          </div>
        </div>
      )}

      {/* 🔵 Upload Button */}
      {files.length > 0 && !uploadResult && (
        <div className="mt-4 flex flex-col items-center">
          <button
            onClick={handleUpload}
            disabled={isUploading}
            className={`px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isUploading ? 'Uploading...' : 'Upload Files'}
          </button>
          {uploadStatus && (
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
              {uploadStatus}
            </p>
          )}
        </div>
      )}

      {/* 🟢 Uploaded Document Details */}
      {uploadResult && (
        <div className="mt-6 w-full max-w-lg">
          <h3 className="text-xl font-semibold mb-4 text-gray-700 dark:text-gray-200">
            Upload Result
          </h3>
          <p>
            <strong>Batch ID:</strong> {uploadResult.batch_id}
          </p>

          <div className="grid grid-cols-2 gap-4 mt-4">
            {uploadResult.documents.map((doc, index) => (
              <div
                key={index}
                className="relative border border-gray-300 dark:border-gray-700 rounded-lg overflow-hidden shadow-md transition-transform transform hover:scale-105 cursor-pointer"
                onClick={() => setPreviewModalIndex(index)} // ✅ Open on click only
              >
                {/* ✅ File Preview */}
                {doc.preview ? (
                  <img
                    src={doc.preview}
                    alt={doc.id || 'File'}
                    className="w-full h-24 object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center w-full h-24 bg-gray-200 dark:bg-gray-700">
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      {doc.title || 'Unknown File'}
                    </p>
                  </div>
                )}

                {/* ✅ File Details */}
                <div className="p-3 bg-gray-50 dark:bg-gray-800">
                  <div className="flex items-center justify-between">
                    <span className="w-full text-gray-700 dark:text-gray-300 font-medium truncate">
                      {doc.title || 'Untitled'}
                    </span>
                  </div>
                  <div className="flex flex-col text-xs text-gray-500 dark:text-gray-400 mt-1">
                    <span>
                      File Size: {doc.fileSize ? `${doc.fileSize}` : 'Unknown Size'}
                    </span>
                    <span>
                      {doc.uploadDate || 'Upload date not available'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload New Files Button */}
      {uploadResult && (
        <button
          onClick={handleReset}
          className="mt-4 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded transition-colors cursor-pointer"
        >
          Upload New Files
        </button>
      )}

      {/* 🔴 Preview Modal */}
      <PreviewModal
        isOpen={previewModalIndex !== null}
        onClose={closeModal}
        file={uploadResult?.documents[previewModalIndex]}
        currentPage={previewModalIndex || 0}
        totalPages={uploadResult?.documents.length || 0}
        onPrev={prevFile}
        onNext={nextFile}
      />
    </div>
  );
}

export default UploadPage;
