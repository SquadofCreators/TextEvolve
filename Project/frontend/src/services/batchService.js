// src/services/batchService.js - UPDATED
import apiClient from './apiConfig';

const createBatch = async (name) => {
    const response = await apiClient.post('/batches', { name });
    return response.data; // <-- Add .data
};

const getMyBatches = async () => {
    const response = await apiClient.get('/batches');
    return response.data; // <-- Add .data
};

const getBatchById = async (batchId) => {
    if (!batchId) throw new Error('Batch ID is required');
    const response = await apiClient.get(`/batches/${batchId}`);
    return response.data; // <-- Add .data
};

const updateBatch = async (batchId, batchData) => {
    if (!batchId) throw new Error('Batch ID is required');
    const response = await apiClient.put(`/batches/${batchId}`, batchData);
    return response.data; // <-- Add .data
};

const deleteBatch = async (batchId) => {
    if (!batchId) throw new Error('Batch ID is required');
    const response = await apiClient.delete(`/batches/${batchId}`);
    return response.data; // <-- Add .data (usually just a success message object)
};

const uploadDocuments = async (batchId, files) => {
    if (!batchId) throw new Error('Batch ID is required');
    if (!files || files.length === 0) throw new Error('At least one file is required');
    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
        formData.append('documents', files[i]);
    }
    const response = await apiClient.post(`/batches/${batchId}/documents`, formData);
    return response.data; // <-- Add .data
};

const deleteDocument = async (batchId, docId) => {
    if (!batchId || !docId) throw new Error('Batch ID and Document ID are required');
    const response = await apiClient.delete(`/batches/${batchId}/documents/${docId}`);
    return response.data; // <-- Add .data
};

const updateDocumentResults = async (batchId, docId, resultsData) => {
    if (!batchId || !docId) throw new Error('Batch ID and Document ID are required');
    const response = await apiClient.put(`/batches/${batchId}/documents/${docId}/results`, resultsData);
    return response.data; // <-- Add .data
};

const aggregateBatchMetrics = async (batchId) => {
    if (!batchId) throw new Error('Batch ID is required');
    const response = await apiClient.put(`/batches/${batchId}/aggregate-metrics`);
    return response.data; // <-- Add .data
};

// This returns a URL path string, not an API response object, so it stays the same
const getPreviewApiUrl = (batchId, docId) => {
    if (!batchId || !docId) return '';
    return `/batches/${batchId}/documents/${docId}/preview`;
};

// This expects a blob, Axios handles responseType:'blob' correctly,
// the interceptor might interfere slightly but usually works,
// let's assume it returns the blob directly. If issues arise, revisit.
const downloadDocumentBlob = async (batchId, docId) => {
    if (!batchId || !docId) throw new Error('Batch ID is required');
    // The interceptor returning response.data might actually be okay here if
    // axios automatically makes response.data the blob when responseType is 'blob'.
    // Let's assume the previous code worked. If not, adjust error handling.
    try {
        const response = await apiClient.get(`/batches/${batchId}/documents/${docId}/download`, {
             responseType: 'blob',
        });
         // If interceptor returns full response, access response.data (the blob)
         // If interceptor returns response.data (the blob), this still works
        return response.data || response;
    } catch (error) {
        console.error("Error downloading blob:", error);
        throw error;
    }
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