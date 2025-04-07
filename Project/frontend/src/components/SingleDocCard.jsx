import React from "react";
import { FiTrash2, FiEye, FiDownload, FiCpu, FiCheckSquare, FiAlertCircle, FiLoader } from "react-icons/fi"; // Added more relevant icons
import MetaText from "./utility/MetaText"; // Assuming this component exists and works well

// Icons for MetaText (can be passed directly or mapped based on title)
import { LuCalendarDays } from "react-icons/lu";
import { GrStorage } from "react-icons/gr";
import { FaRegFileLines } from "react-icons/fa6";
import { MdOutlineInfo } from "react-icons/md"; // For status

/**
 * SingleDocCard Component: Displays information and actions for a single document within a batch.
 *
 * Props:
 * - doc: The document object containing details (id, fileName, fileSize, createdAt, status, storageKey, mimeType, accuracy, precision, previewUrl, downloadUrl etc.)
 * - batchId: The ID of the parent batch (may not be needed if actions use doc.id directly, but good for context)
 * - onPreview: Function to call when preview button is clicked, passes the doc object.
 * - onDelete: Function to call when delete button is clicked, passes the doc object.
 * - onExtract: Function to call when extract text button is clicked, passes the doc object.
 * - formatBytes: Function to format file size (expects bytes as string/number/BigInt).
 * - formatDate: Function to format date strings.
 */
function SingleDocCard({
  doc, // Renamed from data for clarity, contains all document fields including constructed URLs
  // batchId, // Included if needed by any actions, but likely doc.id is sufficient
  onPreview,
  onDelete,
  onExtract,
  formatBytes, // Use the consistent formatter
  formatDate, // Use the consistent formatter
}) {

  // Determine status color/icon (example)
  const getStatusIndicator = (status) => {
    switch (status) {
      case 'COMPLETED':
        return { icon: <FiCheckSquare className="text-green-500" />, color: "text-green-600 dark:text-green-400" };
      case 'PROCESSING':
        return { icon: <FiLoader className="text-blue-500 animate-spin" />, color: "text-blue-600 dark:text-blue-400" };
      case 'PENDING':
      case 'UPLOADED':
      case 'NEW': // Assuming NEW might apply here too
        return { icon: <FiCpu className="text-yellow-500" />, color: "text-yellow-600 dark:text-yellow-400" };
      case 'FAILED':
        return { icon: <FiAlertCircle className="text-red-500" />, color: "text-red-600 dark:text-red-400" };
      default:
        return { icon: <MdOutlineInfo className="text-gray-500" />, color: "text-gray-600 dark:text-gray-400" };
    }
  };

  const statusIndicator = getStatusIndicator(doc.status);

  // Simplify mime type for display
  const displayFileType = (mimeType) => {
      if (!mimeType) return 'Unknown';
      if (mimeType.includes('pdf')) return 'PDF';
      if (mimeType.startsWith('image/')) return mimeType.split('/')[1]?.toUpperCase() || 'Image'; // JPEG, PNG
      if (mimeType.includes('wordprocessingml')) return 'DOCX';
      if (mimeType.includes('msword')) return 'DOC';
      // Add more simple types if needed
      return mimeType.split('/')[1] || mimeType; // Fallback
  }

  // Format metrics (example: accuracy)
  const formatMetric = (value) => {
      if (value === null || value === undefined) return null; // Don't display if not present
      return `${(Number(value) * 100).toFixed(1)}%`; // Format as percentage
  }
  const accuracyMetric = formatMetric(doc.accuracy);
  const precisionMetric = formatMetric(doc.precision);


  return (
    <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-4 flex flex-col justify-between border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow duration-200">
      {/* Top Section: Title and Quick Actions */}
      <div className="flex items-start justify-between mb-3">
        {/* Use doc.fileName */}
        <h3 className="text-base md:text-lg font-semibold text-gray-800 dark:text-gray-100 break-words mr-2" title={doc.fileName}>
          {/* Truncate long filenames */}
          {doc.fileName && doc.fileName.length > 35
            ? `${doc.fileName.substring(0, 32)}...`
            : doc.fileName || `Document ${doc.id.substring(0, 6)}...`}
        </h3>
        {/* Action Icons */}
        <div className="flex flex-shrink-0 gap-3">
          <button
            onClick={() => onPreview(doc)}
            title="Preview Document"
            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 cursor-pointer transition-colors"
          >
            <FiEye size={18} />
          </button>
          {/* Use doc.downloadUrl directly, add download attribute */}
          <a
            href={doc.downloadUrl}
            download={doc.fileName || `document_${doc.id}`} // Suggest original filename for download
            target="_blank" // Open in new tab might not trigger download always, but safer
            rel="noopener noreferrer"
            title="Download Document"
            className="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300 cursor-pointer transition-colors"
          >
            <FiDownload size={18} />
          </a>
        </div>
      </div>

      {/* Middle Section: Metadata */}
      <div className="flex flex-col gap-1.5 text-sm mb-4">
        {/* Use doc.fileSize and the passed formatBytes */}
        <MetaText textSize="xs" icon={<GrStorage />} title="Size" value={formatBytes(doc.fileSize)} />
        {/* Use doc.createdAt and the passed formatDate */}
        <MetaText textSize="xs" icon={<LuCalendarDays />} title="Uploaded" value={formatDate(doc.createdAt)} />
        {/* Use doc.mimeType */}
        <MetaText textSize="xs" icon={<FaRegFileLines />} title="Type" value={displayFileType(doc.mimeType)} />
         {/* Display Status */}
         <MetaText textSize="xs" icon={statusIndicator.icon} title="Status" value={<span className={`font-medium ${statusIndicator.color}`}>{doc.status || 'N/A'}</span>} />
         {/* Display Metrics if available */}
         {accuracyMetric && <MetaText textSize="xs" icon={<FiCheckSquare/>} title="Accuracy" value={accuracyMetric} />}
         {precisionMetric && <MetaText textSize="xs" icon={<FiCheckSquare/>} title="Precision" value={precisionMetric} />}

      </div>

      {/* Bottom Action Buttons */}
      <div className="mt-auto pt-3 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center">
        <button
          onClick={() => onDelete(doc)} // Pass the full doc object
          className="flex items-center gap-1.5 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 cursor-pointer transition-colors"
          title="Delete Document"
        >
          <FiTrash2 size={14} />
          <span className="text-xs font-medium">Delete</span>
        </button>
        <button
          onClick={() => onExtract(doc)} // Pass the full doc object
          className="flex items-center gap-1.5 text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 cursor-pointer transition-colors"
          title="Extract Text from this Document"
        >
          <FiCpu size={14} />
          <span className="text-xs font-medium">Extract Text</span>
        </button>
      </div>
    </div>
  );
}

export default SingleDocCard;