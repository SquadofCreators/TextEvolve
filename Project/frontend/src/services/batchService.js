// src/services/batchService.js

import apiClient from './apiConfig';

// --- Batch Operations ---

/**
 * Creates a new batch.
 * @param {string} name - The name for the new batch.
 * @returns {Promise<object>} The newly created batch object.
 */
const createBatch = async (name) => {
  return apiClient.post('/batches', { name });
};

/**
 * Fetches all batches belonging to the current user.
 * @returns {Promise<Array<object>>} An array of batch objects.
 */
const getMyBatches = async () => {
  return apiClient.get('/batches');
};

/**
 * Fetches a specific batch by its ID, including its documents.
 * @param {string} batchId - The ID of the batch to fetch.
 * @returns {Promise<object>} The batch object with associated documents.
 */
const getBatchById = async (batchId) => {
  if (!batchId) throw new Error('Batch ID is required');
  return apiClient.get(`/batches/${batchId}`);
};

/**
 * Updates details of a specific batch.
 * @param {string} batchId - The ID of the batch to update.
 * @param {object} batchData - Data to update (e.g., { name: "New Name", status: "PROCESSING" }).
 * @returns {Promise<object>} The updated batch object.
 */
const updateBatch = async (batchId, batchData) => {
  if (!batchId) throw new Error('Batch ID is required');
  return apiClient.put(`/batches/${batchId}`, batchData);
};

/**
 * Deletes a specific batch and its associated documents/files.
 * @param {string} batchId - The ID of the batch to delete.
 * @returns {Promise<object>} Success message.
 */
const deleteBatch = async (batchId) => {
  if (!batchId) throw new Error('Batch ID is required');
  return apiClient.delete(`/batches/${batchId}`);
};

// --- Document Operations within a Batch ---

/**
 * Uploads one or more documents to a specific batch.
 * @param {string} batchId - The ID of the target batch.
 * @param {FileList | Array<File>} files - The file(s) to upload.
 * @returns {Promise<object>} Response containing success message and updated batch info.
 */
const uploadDocuments = async (batchId, files) => {
  if (!batchId) throw new Error('Batch ID is required');
  if (!files || files.length === 0) throw new Error('At least one file is required');

  const formData = new FormData();
  // Append each file with the key expected by the backend ('documents')
  for (let i = 0; i < files.length; i++) {
    formData.append('documents', files[i]);
  }

  // Axios instance handles Content-Type header for FormData
  return apiClient.post(`/batches/${batchId}/documents`, formData);
};

/**
 * Deletes a specific document from a batch.
 * @param {string} batchId - The ID of the batch containing the document.
 * @param {string} docId - The ID of the document to delete.
 * @returns {Promise<object>} Response containing success message and updated batch info.
 */
const deleteDocument = async (batchId, docId) => {
  if (!batchId || !docId) throw new Error('Batch ID and Document ID are required');
  return apiClient.delete(`/batches/${batchId}/documents/${docId}`);
};

/**
 * Updates the processing results for a specific document.
 * @param {string} batchId - The ID of the batch containing the document.
 * @param {string} docId - The ID of the document to update.
 * @param {object} resultsData - Data containing results (e.g., { status, extractedContent, accuracy, precision, loss }).
 * @returns {Promise<object>} The updated document status/metrics.
 */
const updateDocumentResults = async (batchId, docId, resultsData) => {
  if (!batchId || !docId) throw new Error('Batch ID and Document ID are required');
  return apiClient.put(`/batches/${batchId}/documents/${docId}/results`, resultsData);
};

// --- Batch Aggregation ---

/**
 * Triggers the aggregation of metrics for a specific batch.
 * @param {string} batchId - The ID of the batch to aggregate.
 * @returns {Promise<object>} Response containing success message and aggregated metrics.
 */
const aggregateBatchMetrics = async (batchId) => {
  if (!batchId) throw new Error('Batch ID is required');
  return apiClient.put(`/batches/${batchId}/aggregate-metrics`);
};

/**
 * Gets the API URL path for previewing a document.
 * This URL will be used directly in img src or iframe src.
 * @param {string} batchId - The ID of the batch.
 * @param {string} docId - The ID of the document.
 * @returns {string} The relative API URL path for preview.
 */
const getPreviewApiUrl = (batchId, docId) => {
  if (!batchId || !docId) return '';
  // Return relative path - apiClient adds the base URL and token
  return `/batches/${batchId}/documents/${docId}/preview`;
};

/**
* Fetches a document file as a blob for manual download triggering.
* @param {string} batchId - The ID of the batch.
* @param {string} docId - The ID of the document.
* @returns {Promise<Blob>} A promise resolving to the file blob.
*/
const downloadDocumentBlob = async (batchId, docId) => {
  if (!batchId || !docId) throw new Error('Batch ID and Document ID are required');
  // Make request expecting a Blob response
  return apiClient.get(`/batches/${batchId}/documents/${docId}/download`, {
      responseType: 'blob', // Important: Tell axios to expect binary data
  });
  // Note: The actual download trigger happens in the component after getting the blob
};


export const batchService = {
  createBatch,
  getMyBatches,
  getBatchById,
  updateBatch,
  deleteBatch,
  uploadDocuments,
  deleteDocument, 
  updateDocumentResults,
  aggregateBatchMetrics,
  getPreviewApiUrl,
  downloadDocumentBlob,
};
