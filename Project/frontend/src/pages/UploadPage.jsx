// src/pages/UploadPage.jsx
import React, { useCallback, useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import PreviewModal from '../components/utility/PreviewModal';

function UploadPage() {
  const [files, setFiles] = useState([]);
  // previewModalIndex is null when no modal is open; otherwise it holds the index of the file to preview.
  const [previewModalIndex, setPreviewModalIndex] = useState(null);

  const onDrop = useCallback((acceptedFiles) => {
    const mappedFiles = acceptedFiles.map((file) =>
      Object.assign(file, { preview: URL.createObjectURL(file) })
    );
    setFiles((prevFiles) => [...prevFiles, ...mappedFiles]);
    // If no modal is open, automatically open preview for the first new file.
    if (previewModalIndex === null && mappedFiles.length > 0) {
      setPreviewModalIndex(0);
    }
    console.log('Uploaded files:', acceptedFiles);
  }, [previewModalIndex]);

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

  // Cleanup object URLs to prevent memory leaks.
  useEffect(() => {
    return () => {
      files.forEach((file) => URL.revokeObjectURL(file.preview));
    };
  }, [files]);

  // Modal handlers
  const closeModal = () => setPreviewModalIndex(null);

  const prevFile = () => {
    setPreviewModalIndex((prev) => (prev > 0 ? prev - 1 : prev));
  };

  const nextFile = () => {
    setPreviewModalIndex((prev) => (prev < files.length - 1 ? prev + 1 : prev));
  };

  return (
    <div className="min-h-full flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-900 rounded-xl shadow-lg p-2 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200">
      {/* Drag and Drop Area */}
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

      {/* Thumbnail Preview Grid */}
      {files.length > 0 && (
        <div className="mt-6 w-full max-w-lg">
          <h3 className="text-xl font-semibold mb-4 text-gray-700 dark:text-gray-200">
            File Previews
          </h3>
          <div className="grid grid-cols-3 gap-4">
            {files.map((file, index) => (
              <div
                key={index}
                className="border border-gray-200 dark:border-gray-700 rounded p-2 cursor-pointer"
                onClick={() => setPreviewModalIndex(index)}
              >
                {file.type.startsWith('image/') ? (
                  <img
                    src={file.preview}
                    alt={file.name}
                    className="w-full h-24 object-cover rounded"
                  />
                ) : file.type === 'application/pdf' ? (
                  <div className="flex items-center justify-center w-full h-24 bg-gray-200 dark:bg-gray-700 rounded">
                    <p className="text-sm text-gray-600 dark:text-gray-300">PDF</p>
                  </div>
                ) : (
                  <div className="flex items-center justify-center w-full h-24 bg-gray-200 dark:bg-gray-700 rounded">
                    <p className="text-sm text-gray-600 dark:text-gray-300">DOCX</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Preview Modal */}
      <PreviewModal
        isOpen={previewModalIndex !== null}
        onClose={closeModal}
        file={files[previewModalIndex]}
        currentPage={previewModalIndex || 0}
        totalPages={files.length}
        onPrev={prevFile}
        onNext={nextFile}
      />
    </div>
  );
}

export default UploadPage;
