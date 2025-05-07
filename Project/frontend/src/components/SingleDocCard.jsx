import React from "react";
import {
  FiTrash2,
  FiEye,
  FiDownload,
  FiCpu,
  FiCheckSquare,
  FiAlertCircle,
  FiLoader,
} from "react-icons/fi";
import { LuCalendarDays } from "react-icons/lu";
import { GrStorage } from "react-icons/gr";
import { FaRegFileLines } from "react-icons/fa6";
import { MdOutlineInfo } from "react-icons/md";
import MetaText from "./utility/MetaText"; // Assuming this component exists and works well

// Helper function to determine status indicator (icon and color)
const getStatusIndicator = (status) => {
  switch (status?.toUpperCase()) { // Normalize status for comparison
    case 'COMPLETED':
      return { icon: <FiCheckSquare />, color: "text-green-600 dark:text-green-400" };
    case 'PROCESSING':
      return { icon: <FiLoader className="animate-spin" />, color: "text-blue-600 dark:text-blue-400" }; // Added spin animation
    case 'PENDING':
    case 'UPLOADED':
    case 'NEW':
      return { icon: <FiCpu />, color: "text-yellow-600 dark:text-yellow-400" };
    case 'FAILED':
      return { icon: <FiAlertCircle />, color: "text-red-600 dark:text-red-400" };
    default:
      return { icon: <MdOutlineInfo />, color: "text-gray-500 dark:text-gray-400" };
  }
};

// Helper function to simplify mime type display
const displayFileType = (mimeType) => {
    if (!mimeType) return 'Unknown';
    const lowerMime = mimeType.toLowerCase();
    if (lowerMime.includes('pdf')) return 'PDF';
    if (lowerMime.startsWith('image/')) return lowerMime.split('/')[1]?.toUpperCase() || 'Image'; // JPEG, PNG
    if (lowerMime.includes('wordprocessingml')) return 'DOCX';
    if (lowerMime.includes('msword')) return 'DOC';
    if (lowerMime.includes('spreadsheetml')) return 'XLSX';
    if (lowerMime.includes('excel')) return 'XLS';
    // Add more simple types if needed (e.g., text/plain -> TXT)
    return mimeType.split('/')[1]?.toUpperCase() || mimeType; // Fallback
}

// Helper function to format metric values (e.g., accuracy, precision)
const formatMetric = (value) => {
    if (value === null || value === undefined || isNaN(Number(value))) return null;
    return `${(Number(value) * 100).toFixed(1)}%`;
}

/**
 * SingleDocCard Component: Displays information and actions for a single document.
 *
 * Props:
 * - doc: Document object with details (id, fileName, fileSize, createdAt, status, mimeType, accuracy, precision, previewUrl, downloadUrl etc.)
 * - onPreview: (doc) => void - Function called when preview button is clicked.
 * - onDelete: (doc) => void - Function called when delete button is clicked.
 * - onExtract: (doc) => void - Function called when extract text button is clicked.
 * - formatBytes: (bytes: string | number | BigInt) => string - Function to format file size.
 * - formatDate: (dateString: string) => string - Function to format date strings.
 */
function SingleDocCard({
  doc,
  onPreview,
  onDelete,
  onExtract,
  formatBytes,
  formatDate,
}) {
  const statusIndicator = getStatusIndicator(doc?.status);
  const accuracyMetric = formatMetric(doc?.accuracy);
  const precisionMetric = formatMetric(doc?.precision);
  const fileTypeDisplay = displayFileType(doc?.mimeType);
  const formattedSize = formatBytes(doc?.fileSize);
  const formattedDate = formatDate(doc?.createdAt);

  const handlePreviewClick = () => onPreview(doc);
  const handleDeleteClick = () => onDelete(doc);
  const handleExtractClick = () => onExtract(doc);

  const fileNameDisplay = doc?.fileName && doc.fileName.length > 35
    ? `${doc.fileName.substring(0, 32)}...`
    : doc?.fileName || `Document ${doc?.id?.substring(0, 6) || 'N/A'}...`;

  return (
    <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-5 flex flex-col justify-between border border-gray-200 dark:border-gray-700 hover:shadow-lg focus-within:ring-2 focus-within:ring-indigo-500 focus-within:ring-offset-2 dark:focus-within:ring-offset-gray-800 transition-all duration-200">
      {/* Top Section: Title and Quick Actions */}
      <div className="flex items-start justify-between mb-4">
        <h3
          className="text-base md:text-lg font-semibold text-gray-800 dark:text-gray-100 break-words mr-3 leading-tight"
          title={doc?.fileName || 'Document'} // Show full name on hover
        >
          {fileNameDisplay}
        </h3>

        {/* Action Icons */}
        <div className="flex flex-shrink-0 items-center gap-4">
          {/* Preview Button - conditionally render if previewUrl exists? or let onPreview handle it */}
          <button
            onClick={handlePreviewClick}
            title="Preview Document"
            aria-label="Preview Document"
            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors rounded-full p-1 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 dark:focus:ring-offset-gray-800"
          >
            <FiEye size={20} />
          </button>
        </div>
      </div>

      {/* Middle Section: Metadata */}
      <div className="flex flex-col gap-2 text-sm mb-5">
        <MetaText textSize="xs" icon={<GrStorage />} title="Size" value={formattedSize || 'N/A'} />
        <MetaText textSize="xs" icon={<LuCalendarDays />} title="Uploaded" value={formattedDate || 'N/A'} />
        <MetaText textSize="xs" icon={<FaRegFileLines />} title="Type" value={fileTypeDisplay} />
        <MetaText
            textSize="xs"
            icon={statusIndicator.icon}
            title="Status"
            value={<span className={`font-medium ${statusIndicator.color}`}>{doc?.status || 'N/A'}</span>}
        />
        {/* Conditionally render metrics */}
        {accuracyMetric && <MetaText textSize="xs" icon={<FiCheckSquare />} title="Accuracy" value={accuracyMetric} />}
        {precisionMetric && <MetaText textSize="xs" icon={<FiCheckSquare />} title="Precision" value={precisionMetric} />}
      </div>

      {/* Bottom Action Buttons */}
      <div className="mt-auto pt-4 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center gap-4">
        {/* Delete Button */}
        <button
          onClick={handleDeleteClick}
          className="flex items-center gap-1.5 text-red-600 hover:text-red-800 dark:text-red-500 dark:hover:text-red-400 transition-colors px-2 py-1 rounded focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1 dark:focus:ring-offset-gray-800"
          title="Delete Document"
        >
          <FiTrash2 size={14} />
          <span className="text-xs font-medium">Delete</span>
        </button>

        <button
          onClick={handleExtractClick}
          className="flex items-center gap-1.5 text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors px-2 py-1 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 dark:focus:ring-offset-gray-800"
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