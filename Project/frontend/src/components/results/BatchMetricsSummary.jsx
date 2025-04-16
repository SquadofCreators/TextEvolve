// src/components/results/BatchMetricsSummary.jsx
import React from 'react';
import { FiCheckCircle, FiFileText } from 'react-icons/fi';
import { TbSparkles } from 'react-icons/tb';

// Assume formatMetric is imported from a utils file or passed as prop
const formatMetric = (value, decimals = 1) => {
    if (value === null || value === undefined) return null;
    const percentage = Number(value) * 100;
    return `${percentage % 1 === 0 ? percentage.toFixed(0) : percentage.toFixed(decimals)}%`;
};

const BatchMetricsSummary = ({ batch }) => {
    if (!batch || !['COMPLETED', 'PARTIAL_FAILURE'].includes(batch.status)) {
        return null; // Don't render if batch not finished or no batch data
    }

    const hasAccuracy = batch.accuracy !== null && batch.accuracy !== undefined;
    const hasWordCount = batch.totalWordCount !== null && batch.totalWordCount !== undefined;
    const hasCharCount = batch.totalCharacterCount !== null && batch.totalCharacterCount !== undefined;

    // Only render the section if at least one metric is available
    if (!hasAccuracy && !hasWordCount && !hasCharCount) {
        return null;
    }

    return (
        <div className="mb-6 p-4 bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-3">Overall Summary</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                {hasAccuracy ? (
                    <div className="p-3 bg-green-50 dark:bg-green-900/30 rounded-md border border-green-200 dark:border-green-700">
                        <FiCheckCircle className="mx-auto h-6 w-6 text-green-500 mb-1"/>
                        <p className="text-xs text-green-700 dark:text-green-300 font-medium">Avg. Accuracy</p>
                        <p className="text-xl font-bold text-green-600 dark:text-green-200">
                            {formatMetric(batch.accuracy)}
                        </p>
                    </div>
                ) : (
                    <div className="p-3 text-xs text-gray-400 italic flex items-center justify-center border rounded-md dark:border-gray-700">
                        Accuracy N/A
                    </div>
                )}
                {hasWordCount ? (
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-md border border-blue-200 dark:border-blue-700">
                        <FiFileText className="mx-auto h-6 w-6 text-blue-500 mb-1"/>
                        <p className="text-xs text-blue-700 dark:text-blue-300 font-medium">Total Words</p>
                        <p className="text-xl font-bold text-blue-600 dark:text-blue-200">
                            {batch.totalWordCount.toLocaleString()}
                        </p>
                    </div>
                ) : (
                    <div className="p-3 text-xs text-gray-400 italic flex items-center justify-center border rounded-md dark:border-gray-700">
                        Word Count N/A
                    </div>
                )}
                {hasCharCount ? (
                    <div className="p-3 bg-purple-50 dark:bg-purple-900/30 rounded-md border border-purple-200 dark:border-purple-700">
                        <TbSparkles className="mx-auto h-6 w-6 text-purple-500 mb-1"/>
                        <p className="text-xs text-purple-700 dark:text-purple-300 font-medium">Total Chars</p>
                        <p className="text-xl font-bold text-purple-600 dark:text-purple-200">
                            {batch.totalCharacterCount.toLocaleString()}
                        </p>
                    </div>
                ) : (
                    <div className="p-3 text-xs text-gray-400 italic flex items-center justify-center border rounded-md dark:border-gray-700">
                        Char Count N/A
                    </div>
                )}
            </div>
        </div>
    );
};

export default BatchMetricsSummary;