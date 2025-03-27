// src/components/BatchGroup.jsx
import React from 'react';
import DocCard from './DocCard';

function BatchGroup({ batches }) {
  return (
    <div className="space-y-10">
      {batches.map((batch) => (
        <div
          key={batch.id}
          className="max-w-5xl mx-auto p-6 border rounded shadow bg-white dark:bg-gray-800"
        >
          {/* Batch Header */}
          <div className="mb-4">
            <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
              {batch.name}
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Documents: {batch.documentCount} | Created:{" "}
              {batch.createdOn ? new Date(batch.createdOn).toLocaleString() : "N/A"} | Last Modified:{" "}
              {batch.lastModified ? new Date(batch.lastModified).toLocaleString() : "N/A"}
            </p>
            <p className="text-gray-600 dark:text-gray-400">
              Total File Size: {batch.totalFileSize} | File Types: {batch.fileTypes.join(", ")}
            </p>
          </div>
          {/* Documents Grid */}
          {batch.documents && batch.documents.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {batch.documents.map((doc) => (
                <DocCard key={doc.uniqueId} data={doc} />
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500">No documents found in this batch.</p>
          )}
        </div>
      ))}
    </div>
  );
}

export default BatchGroup;
