import React from 'react';
import { FiFileText } from 'react-icons/fi';
import { TbSparkles } from 'react-icons/tb';
import { FaFilePdf, FaFileWord } from "react-icons/fa6";

// Consistent Button Styles (Copied from AggregatedTextViewer for consistency)
const baseButtonClass = "flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-800";
const txtButtonClass = `${baseButtonClass} text-white bg-gray-600 hover:bg-gray-700 dark:bg-gray-500 dark:hover:bg-gray-600 focus:ring-gray-500`;
const pdfButtonClass = `${baseButtonClass} text-white bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 focus:ring-red-500`;
const docxButtonClass = `${baseButtonClass} text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 focus:ring-blue-500`;

const EnhancedTextViewer = ({
    content,
    onDownloadText,
    onDownloadPdf,
    onDownloadDocx,
    batchId
}) => {
    // Render nothing if no content or batchId
    if (!content || !batchId) return null;

    const baseFilename = `batch_${batchId}_enhanced`;

    return (
        // Consistent Card Structure - Emerald border for distinction
        <div className="mb-6 bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden border border-emerald-300 dark:border-emerald-600">
            {/* Consistent Header */}
            <div className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-emerald-200 dark:border-emerald-700">
                <h3 className="text-lg font-semibold text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
                    <TbSparkles /> {/* Icon */}
                    Enhanced Text
                </h3>
                 {/* Action Button Group */}
                <div className="flex flex-wrap items-center gap-2">
                     <button onClick={() => onDownloadText(content, `${baseFilename}.txt`)} className={txtButtonClass} title="Download Enhanced as TXT">
                        <FiFileText size={14}/> <span>TXT</span>
                    </button>
                    <button onClick={() => onDownloadPdf(content, `${baseFilename}.pdf`)} className={pdfButtonClass} title="Download Enhanced as PDF">
                        <FaFilePdf size={14}/> <span>PDF</span>
                    </button>
                    <button onClick={() => onDownloadDocx(content, `${baseFilename}.docx`)} className={docxButtonClass} title="Download Enhanced as DOCX">
                        <FaFileWord size={14}/> <span>DOCX</span>
                    </button>
                </div>
            </div>
             {/* Consistent Content Area - Emerald background */}
            <div className="p-4 bg-emerald-50 dark:bg-emerald-900/30 h-[25rem] overflow-y-auto">
                <pre className="whitespace-pre-wrap break-words text-sm text-gray-800 dark:text-gray-200 font-mono leading-relaxed">
                    {content}
                </pre>
            </div>
        </div>
    );
};

export default EnhancedTextViewer;