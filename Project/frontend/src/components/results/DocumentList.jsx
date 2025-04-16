// src/components/results/DocumentList.jsx
import React from 'react';
import DocumentResultItem from './DocumentResultItem'; // Adjust path if needed

const DocumentList = ({ documents, onDownloadText }) => {
    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 p-4 border-b border-gray-200 dark:border-gray-700">
                Individual Document Results ({documents?.length ?? 0})
            </h3>
            {documents && documents.length > 0 ? (
                <ul className="divide-y divide-gray-100 dark:divide-gray-700">
                    {documents.map((doc) => (
                        <DocumentResultItem key={doc.id} doc={doc} onDownloadText={onDownloadText}/>
                    ))}
                </ul>
            ) : (
                <p className="text-center text-sm text-gray-500 dark:text-gray-400 p-6 italic">
                    No individual document details available.
                </p>
            )}
        </div>
    );
};

export default DocumentList;