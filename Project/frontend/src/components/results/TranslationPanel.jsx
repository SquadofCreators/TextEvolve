import React from 'react';
import Select from 'react-select';
// Added FiCheckCircle for success feedback
import { FiLoader, FiFileText, FiAlertTriangle, FiCheckCircle, FiGlobe } from 'react-icons/fi';
import { FaFilePdf, FaFileWord } from "react-icons/fa6";

// Consistent Button Styles
const baseButtonClass = "flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-800";
const translateButtonClass = `${baseButtonClass} text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 disabled:bg-gray-400 dark:disabled:bg-gray-600 focus:ring-indigo-500 px-4 py-2 sm:py-1.5`; // Slightly larger padding for primary action
const txtButtonClass = `${baseButtonClass} text-white bg-gray-600 hover:bg-gray-700 dark:bg-gray-500 dark:hover:bg-gray-600 focus:ring-gray-500`;
const pdfButtonClass = `${baseButtonClass} text-white bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 focus:ring-red-500`;
const docxButtonClass = `${baseButtonClass} text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 focus:ring-blue-500`;

// Consistent Feedback Styles
const feedbackBaseClass = "p-3 text-center text-sm rounded-md flex items-center justify-center gap-1.5";
const successFeedbackClass = `${feedbackBaseClass} text-green-700 dark:text-green-300 bg-green-100 dark:bg-green-900/30`;
const errorFeedbackClass = `${feedbackBaseClass} text-red-700 dark:text-red-400 bg-red-100 dark:bg-red-900/30`;


// Basic styling for react-select to better match Tailwind (can be customized further)
const selectStyles = {
    control: (base, state) => ({
        ...base,
        backgroundColor: 'var(--select-bg)', // Use CSS variables for theme compatibility
        borderColor: state.isFocused ? 'var(--select-border-focus)' : 'var(--select-border)',
        boxShadow: state.isFocused ? '0 0 0 1px var(--select-border-focus)' : 'none',
        '&:hover': {
            borderColor: state.isFocused ? 'var(--select-border-focus)' : 'var(--select-border-hover)',
        },
        minHeight: '38px', // Match Tailwind form input height
        height: '38px',
    }),
    valueContainer: (base) => ({
        ...base,
        height: '38px',
        padding: '0 6px'
    }),
    input: (base) => ({
        ...base,
        margin: '0px',
        padding: '0px',
        color: 'var(--select-text)',
    }),
    indicatorSeparator: () => ({
        display: 'none',
    }),
    indicatorsContainer: (base) => ({
        ...base,
        height: '38px',
    }),
    option: (base, state) => ({
        ...base,
        backgroundColor: state.isSelected ? 'var(--select-option-selected-bg)' : (state.isFocused ? 'var(--select-option-focus-bg)' : 'var(--select-option-bg)'),
        color: state.isSelected ? 'var(--select-option-selected-text)' : 'var(--select-option-text)',
        '&:active': {
            backgroundColor: 'var(--select-option-active-bg)',
        },
    }),
    menu: (base) => ({
        ...base,
         backgroundColor: 'var(--select-menu-bg)',
         border: '1px solid var(--select-menu-border)',
         boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)', // Tailwind shadow-md
    }),
    // Define CSS variables in your global CSS or a style tag for theming
    // Example variables (adjust colors):
    // :root { --select-bg: white; --select-border: #d1d5db; ... }
    // html.dark { --select-bg: #374151; --select-border: #4b5563; ... }
};


const TranslationPanel = ({
    aggregatedText,
    enhancedText,
    supportedLanguages,
    selectedLang,
    transSource,
    isTranslating,
    translatedResult,
    translationError,
    translationSuccess, // Use this prop
    onTranslate,
    onSelectLang,
    onSetSource,
    onDownloadText,
    onDownloadPdf,
    onDownloadDocx,
    batchId
}) => {
    if (!aggregatedText && !enhancedText || !batchId) return null;

    const baseFilename = `batch_${batchId}_translated_to_${selectedLang?.value || 'lang'}`;
    const sourceTextAvailable = transSource === 'enhanced' ? !!enhancedText : !!aggregatedText;
    const canTranslate = sourceTextAvailable && selectedLang && !isTranslating;

    return (
        // Consistent Card Structure - Indigo border
        <div className="mb-6 bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden border border-indigo-300 dark:border-indigo-600">
            {/* Consistent Header - Improved Layout */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4">
                <h3 className="text-lg font-semibold text-indigo-700 dark:text-indigo-300 flex items-center gap-2 flex-shrink-0 mb-2 md:mb-0">
                    <FiGlobe /> {/* Icon */}
                    Translate Text
                </h3>
                {/* Controls Group - Better wrapping and alignment */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto justify-end">
                    {/* Source selection - only show if enhanced exists */}
                    {enhancedText && (
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                            <label htmlFor="transSourceSelect" className="text-sm text-gray-600 dark:text-gray-400 flex-shrink-0">Source:</label>
                            <select
                                id="transSourceSelect"
                                value={transSource}
                                onChange={(e) => onSetSource(e.target.value)}
                                className="flex-grow block w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 dark:text-gray-100"
                            >
                                <option value="aggregated">Original</option>
                                <option value="enhanced">Enhanced</option>
                            </select>
                        </div>
                    )}
                    {/* Language Dropdown - takes available space */}
                    <div className="w-full sm:w-48 md:w-56 flex-grow sm:flex-grow-0">
                         {/* Apply CSS variables via style prop or global CSS */}
                         <style>{`
                            :root {
                                --select-bg: white; --select-text: #1f2937; --select-border: #d1d5db; --select-border-hover: #9ca3af; --select-border-focus: #6366f1;
                                --select-option-bg: white; --select-option-text: #1f2937; --select-option-focus-bg: #f3f4f6; --select-option-selected-bg: #6366f1; --select-option-selected-text: white; --select-option-active-bg: #eef2ff;
                                --select-menu-bg: white; --select-menu-border: #e5e7eb;
                            }
                            html.dark {
                                --select-bg: #374151; --select-text: #f9fafb; --select-border: #4b5563; --select-border-hover: #6b7280; --select-border-focus: #818cf8;
                                --select-option-bg: #374151; --select-option-text: #f9fafb; --select-option-focus-bg: #4b5563; --select-option-selected-bg: #818cf8; --select-option-selected-text: white; --select-option-active-bg: #4338ca;
                                --select-menu-bg: #1f2937; --select-menu-border: #374151;
                            }
                         `}</style>
                        <Select
                            aria-label="Select language for translation"
                            value={selectedLang}
                            onChange={onSelectLang}
                            options={supportedLanguages}
                            placeholder="Select language..."
                            isSearchable
                            isClearable
                            styles={selectStyles} // Apply basic Tailwind-like styles
                            className="react-select-container text-sm" // Base class
                            classNamePrefix="react-select" // Prefix for internal elements
                            menuPortalTarget={document.body} // Avoid clipping issues
                        />
                    </div>
                    {/* Translate Button - flex shrink 0 */}
                    <button
                        onClick={onTranslate}
                        disabled={!canTranslate || isTranslating}
                        className={`${translateButtonClass} w-full sm:w-auto flex-shrink-0`} // Ensure consistent padding/height
                        title={!canTranslate ? (isTranslating ? 'Translating...' : (!selectedLang ? 'Select a language' : 'Source text not available')) : 'Translate text'}
                    >
                        {isTranslating ? <FiLoader className="animate-spin mr-1.5" size={14}/> : <FiFileText className="mr-1.5" size={14}/>}
                        <span>{isTranslating ? 'Translating...' : 'Translate'}</span>
                    </button>
                </div>
            </div>

            {/* Display Translation Result */}
            {translatedResult && (
                 <div className="p-4 bg-indigo-50 dark:bg-indigo-900/30 h-[15rem] overflow-y-auto">
                     <pre className="whitespace-pre-wrap break-words text-sm text-gray-800 dark:text-gray-200 font-mono leading-relaxed">
                         {translatedResult}
                     </pre>
                 </div>
             )}

            {/* Download Buttons Area (Fixed at Bottom of Result Section) */}
            {translatedResult && (
                <div className="p-3 border-t border-gray-200 dark:border-gray-700 flex gap-2 justify-end">
                    <button onClick={() => onDownloadText(translatedResult, `${baseFilename}.txt`)} className={txtButtonClass} title="Download Translated as TXT">
                        <FiFileText size={14}/> <span>TXT</span>
                    </button>
                    <button onClick={() => onDownloadPdf(translatedResult, `${baseFilename}.pdf`)} className={pdfButtonClass} title="Download Translated as PDF">
                        <FaFilePdf size={14}/> <span>PDF</span>
                    </button>
                    <button onClick={() => onDownloadDocx(translatedResult, `${baseFilename}.docx`)} className={docxButtonClass} title="Download Translated as DOCX">
                        <FaFileWord size={14}/> <span>DOCX</span>
                    </button>
                </div>
            )}

             {/* Display Translation Feedback */}
             {translationSuccess && (
                <div className={successFeedbackClass}>
                     <FiCheckCircle className="h-4 w-4"/>
                     <span>Translation saved successfully to documents.</span>
                 </div>
             )}
             {translationError && (
                  <div className={errorFeedbackClass}>
                      <FiAlertTriangle className="h-4 w-4"/>
                      <span>{translationError}</span>
                  </div>
              )}
        </div>
    );
};

export default TranslationPanel;