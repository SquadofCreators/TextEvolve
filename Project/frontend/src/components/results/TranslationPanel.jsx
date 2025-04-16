// src/components/results/TranslationPanel.jsx
import React from 'react';
import Select from 'react-select';
import { FiLoader, FiFileText, FiAlertTriangle } from 'react-icons/fi';
import { FaFilePdf, FaFileWord } from "react-icons/fa6";

const TranslationPanel = ({
    aggregatedText,
    enhancedText,
    supportedLanguages,
    selectedLang,
    transSource,
    isTranslating,
    translatedResult,
    translationError,
    onTranslate,
    onSelectLang,
    onSetSource,
    onDownloadText,
    onDownloadPdf,
    onDownloadDocx,
    batchId
}) => {
    // ... (logic remains the same) ...
    if (!aggregatedText && !enhancedText) return null;
    const baseFilename = `batch_${batchId}_translated`;
    const sourceTextAvailable = transSource === 'enhanced' ? !!enhancedText : !!aggregatedText;
    const canTranslate = sourceTextAvailable && selectedLang && !isTranslating;

    return (
        <div className="mb-6 bg-white dark:bg-gray-800 rounded-lg shadow border border-indigo-200 dark:border-indigo-700 overflow-hidden">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row justify-between items-center gap-3">
                <h3 className="text-lg font-semibold text-indigo-700 dark:text-indigo-300">Translate Text</h3>
                <div className="flex flex-col sm:flex-row items-center gap-3">
                    {/* Source selection */}
                    {enhancedText && (
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-700 dark:text-gray-300">Source:</span>
                            {/* Standard select with Tailwind classes */}
                            <select
                                value={transSource}
                                onChange={(e) => onSetSource(e.target.value)}
                                className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md px-2 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 dark:text-gray-100" // Adjusted padding slightly
                            >
                                <option value="aggregated">Aggregated</option>
                                <option value="enhanced">Enhanced</option>
                            </select>
                        </div>
                    )}
                    {/* Language Dropdown using react-select - Simplified Styling */}
                    <div className="w-48">
                        <Select
                            value={selectedLang}
                            onChange={onSelectLang}
                            options={supportedLanguages}
                            placeholder="Select language..."
                            isSearchable
                            className="react-select-container text-sm text-gray-900 dark:text-gray-100"
                            classNamePrefix="react-select"
                            menuPortalTarget={document.body} 
                        />
                    </div>
                    {/* Translate Button */}
                    <button
                        onClick={onTranslate}
                        disabled={!canTranslate}
                         className={`flex items-center gap-1.5 px-3 py-2.5 text-white text-xs font-medium rounded-md transition ${
                            !canTranslate ? 'bg-gray-400 cursor-not-allowed dark:bg-gray-600' : 'bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600'
                        }`}
                        title={!canTranslate ? (isTranslating ? 'Translating...' : (!selectedLang ? 'Select a language' : 'Source text not available')) : 'Translate text'}
                    >
                        {isTranslating ? <FiLoader className="animate-spin" size={14}/> : <FiFileText size={14}/>}
                        {isTranslating ? 'Translating...' : 'Translate'}
                    </button>
                </div>
            </div>

            {/* Display Translation Result */}
            {translatedResult && (
                <div className="p-4 max-h-80 overflow-y-auto bg-indigo-50 dark:bg-indigo-900/30">
                    <pre className="whitespace-pre-wrap break-words text-sm text-gray-800 dark:text-gray-200 font-mono">
                        {translatedResult}
                    </pre>
                    {/* Download buttons */}
                    <div className="mt-3 flex flex-wrap gap-2">
                         <button onClick={() => onDownloadText(translatedResult, `${baseFilename}.txt`)} className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-600 text-white text-xs font-medium rounded-md hover:bg-gray-700 dark:bg-gray-500 dark:hover:bg-gray-600 transition" title="Download Translated as TXT">
                            <FiFileText size={14}/> TXT
                        </button>
                        <button onClick={() => onDownloadPdf(translatedResult, `${baseFilename}.pdf`)} className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 text-white text-xs font-medium rounded-md hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 transition" title="Download Translated as PDF">
                            <FaFilePdf size={14}/> PDF
                        </button>
                        <button onClick={() => onDownloadDocx(translatedResult, `${baseFilename}.docx`)} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-md hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 transition" title="Download Translated as DOCX">
                            <FaFileWord size={14}/> DOCX
                        </button>
                    </div>
                </div>
            )}

            {/* Display Translation Error */}
            {translationError && (
                 <div className="p-3 text-center text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20">
                    <FiAlertTriangle className="inline mr-1 h-4 w-4"/> {translationError}
                </div>
            )}
        </div>
    );
};

export default TranslationPanel;