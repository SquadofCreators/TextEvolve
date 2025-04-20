import React from 'react';
import { FiLoader, FiFileText } from 'react-icons/fi';
import { TbSparkles } from 'react-icons/tb';
import { FaFilePdf, FaFileWord } from "react-icons/fa6";

// Consistent Button Styles (Example - adjust colors as needed)
const baseButtonClass = "flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-800";
const enhanceButtonClass = `${baseButtonClass} text-white bg-teal-600 hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-600 disabled:bg-gray-400 dark:disabled:bg-gray-600 focus:ring-teal-500`;
const txtButtonClass = `${baseButtonClass} text-white bg-gray-600 hover:bg-gray-700 dark:bg-gray-500 dark:hover:bg-gray-600 focus:ring-gray-500`;
const pdfButtonClass = `${baseButtonClass} text-white bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 focus:ring-red-500`;
const docxButtonClass = `${baseButtonClass} text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 focus:ring-blue-500`;

const AggregatedTextViewer = ({
    content,
    isEnhancing,
    canEnhance,
    onEnhance,
    onDownloadText,
    onDownloadPdf,
    onDownloadDocx,
    batchId
}) => {
    // Render nothing if no content (or batchId - needed for filename)
    if (!content || !batchId) return null;

    const baseFilename = `batch_${batchId}_aggregated`;

    return (
        // Consistent Card Structure
        <div className="mb-6 bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden border border-gray-200 dark:border-gray-700">
            {/* Consistent Header */}
            <div className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                    <FiFileText className="text-gray-500 dark:text-gray-400" /> {/* Optional Icon */}
                    Extracted Text
                </h3>
                {/* Action Button Group */}
                <div className="flex flex-wrap items-center gap-2">
                    <button
                        onClick={onEnhance}
                        disabled={!canEnhance || isEnhancing} // Ensure disabled during enhancing too
                        className={enhanceButtonClass}
                        title={canEnhance ? "Correct grammar and spelling" : (isEnhancing ? "Enhancing..." : "Cannot enhance now")}
                    >
                        {isEnhancing ? <FiLoader className="animate-spin" size={14}/> : <TbSparkles size={14}/>}
                        <span>{isEnhancing ? 'Enhancing...' : 'Enhance'}</span>
                    </button>
                    <button onClick={() => onDownloadText(content, `${baseFilename}.txt`)} className={txtButtonClass} title="Download Original as TXT">
                        <FiFileText size={14}/> <span>TXT</span>
                    </button>
                    <button onClick={() => onDownloadPdf(content, `${baseFilename}.pdf`)} className={pdfButtonClass} title="Download Original as PDF">
                        <FaFilePdf size={14}/> <span>PDF</span>
                    </button>
                    <button onClick={() => onDownloadDocx(content, `${baseFilename}.docx`)} className={docxButtonClass} title="Download Original as DOCX">
                        <FaFileWord size={14}/> <span>DOCX</span>
                    </button>
                </div>
            </div>
            {/* Consistent Content Area */}
            <div className="p-4 bg-gray-50 dark:bg-gray-900/50 h-[25rem] overflow-y-auto">
                <pre className="whitespace-pre-wrap break-words text-sm text-gray-700 dark:text-gray-300 font-mono leading-relaxed">
                    {content}
                </pre>
            </div>
        </div>
    );
};

export default AggregatedTextViewer;