// src/components/results/AggregatedTextViewer.jsx
import React from 'react';
import { FiLoader, FiFileText } from 'react-icons/fi';
import { TbSparkles } from 'react-icons/tb';
import { FaFilePdf, FaFileWord } from "react-icons/fa6";

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
    if (!content) return null;

    const baseFilename = `batch_${batchId}_aggregated`;

    return (
        <div className="mb-6 bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
            {/* Header with Actions */}
            <div className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200">
                    Extracted Text
                </h3>
                <div className="flex flex-wrap gap-2">
                    <button
                        onClick={onEnhance}
                        disabled={!canEnhance}
                        className={`flex items-center gap-1.5 px-3 py-1.5 text-white text-xs font-medium rounded-md transition ${canEnhance ? 'bg-teal-600 hover:bg-teal-700' : 'bg-gray-400 cursor-not-allowed'}`}
                        title={canEnhance ? "Correct grammar and spelling" : (isEnhancing ? "Enhancing..." : "No text to enhance")}
                    >
                        {isEnhancing ? <FiLoader className="animate-spin" size={14}/> : <TbSparkles size={14}/>}
                        {isEnhancing ? 'Enhancing...' : 'Enhance'}
                    </button>
                    <button onClick={() => onDownloadText(content, `${baseFilename}.txt`)} className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-600 text-white text-xs font-medium rounded-md hover:bg-gray-700 transition" title="Download Original as TXT">
                        <FiFileText size={14}/> TXT
                    </button>
                    <button onClick={() => onDownloadPdf(content, `${baseFilename}.pdf`)} className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 text-white text-xs font-medium rounded-md hover:bg-red-700 transition" title="Download Original as PDF">
                        <FaFilePdf size={14}/> PDF
                    </button>
                    <button onClick={() => onDownloadDocx(content, `${baseFilename}.docx`)} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-md hover:bg-blue-700 transition" title="Download Original as DOCX">
                        <FaFileWord size={14}/> DOCX
                    </button>
                </div>
            </div>
            {/* Original Text Display */}
            <div className="p-4 min-h-80 bg-gray-50 dark:bg-gray-900/50 overflow-x-scroll">
                <pre className="whitespace-pre-wrap break-words text-sm text-gray-700 dark:text-gray-300 font-mono">
                    {content}
                </pre>
            </div>
        </div>
    );
};

export default AggregatedTextViewer;