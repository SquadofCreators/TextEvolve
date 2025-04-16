// src/components/results/EnhancedTextViewer.jsx
import React from 'react';
import { FiFileText } from 'react-icons/fi';
import { TbSparkles } from 'react-icons/tb';
import { FaFilePdf, FaFileWord } from "react-icons/fa6";

const EnhancedTextViewer = ({
    content,
    onDownloadText,
    onDownloadPdf,
    onDownloadDocx,
    batchId
}) => {
    if (!content) return null;

    const baseFilename = `batch_${batchId}_enhanced`;

    return (
        <div className="mb-6 bg-white dark:bg-gray-800 rounded-lg shadow border border-emerald-200 dark:border-emerald-700 overflow-hidden">
            <div className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
                    <TbSparkles /> Enhanced Text
                </h3>
                <div className="flex flex-wrap gap-2">
                    <button onClick={() => onDownloadText(content, `${baseFilename}.txt`)} className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-600 text-white text-xs font-medium rounded-md hover:bg-gray-700 transition" title="Download Enhanced as TXT">
                        <FiFileText size={14}/> TXT
                    </button>
                    <button onClick={() => onDownloadPdf(content, `${baseFilename}.pdf`)} className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 text-white text-xs font-medium rounded-md hover:bg-red-700 transition" title="Download Enhanced as PDF">
                        <FaFilePdf size={14}/> PDF
                    </button>
                    <button onClick={() => onDownloadDocx(content, `${baseFilename}.docx`)} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-md hover:bg-blue-700 transition" title="Download Enhanced as DOCX">
                        <FaFileWord size={14}/> DOCX
                    </button>
                </div>
            </div>
            <div className="p-4 min-h-80 overflow-x-scroll bg-emerald-50 dark:bg-emerald-900/30">
                <pre className="whitespace-pre-wrap break-words text-sm text-gray-800 dark:text-gray-200 font-mono">
                    {content}
                </pre>
            </div>
        </div>
    );
};

export default EnhancedTextViewer;