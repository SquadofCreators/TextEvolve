// src/services/batchService.js

import apiClient from './apiConfig'; // Your existing Axios instance for your backend
import axios from 'axios'; // For external Python API calls

// Base URL for the Python Image Enhancement API from .env
const PYTHON_AI_API_BASE_URL = `${import.meta.env.VITE_AI_API_URL}/img-enhancement`; // e.g., https://pyapi.textevolve.in/img-enhancement

const createBatch = async (name) => {
    const response = await apiClient.post('/batches', { name });
    return response.data;
};

const getMyBatches = async () => {
    const response = await apiClient.get('/batches');
    return response.data;
};

const getBatchById = async (batchId) => {
    if (!batchId) throw new Error('Batch ID is required');
    const response = await apiClient.get(`/batches/${batchId}`);
    return response.data;
};

const updateBatch = async (batchId, batchData) => {
    if (!batchId) throw new Error('Batch ID is required');
    const response = await apiClient.put(`/batches/${batchId}`, batchData);
    return response.data;
};

const deleteBatch = async (batchId) => {
    if (!batchId) throw new Error('Batch ID is required');
    const response = await apiClient.delete(`/batches/${batchId}`);
    return response.data;
};

const uploadDocuments = async (batchId, files) => {
    if (!batchId) throw new Error('Batch ID is required');
    if (!files || files.length === 0) throw new Error('At least one file is required');
    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
        formData.append('documents', files[i]); // Key 'documents' must match multer field name in backend
    }
    const response = await apiClient.post(`/batches/${batchId}/documents`, formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    return response.data;
};

const deleteDocument = async (batchId, docId) => {
    if (!batchId || !docId) throw new Error('Batch ID and Document ID are required');
    const response = await apiClient.delete(`/batches/${batchId}/documents/${docId}`);
    return response.data;
};

const updateDocumentResults = async (batchId, docId, resultsData) => {
    if (!batchId || !docId) throw new Error('Batch ID and Document ID are required');
    const response = await apiClient.put(`/batches/${batchId}/documents/${docId}/results`, resultsData);
    return response.data;
};

const aggregateBatchMetrics = async (batchId) => {
    if (!batchId) throw new Error('Batch ID is required');
    const response = await apiClient.put(`/batches/${batchId}/aggregate-metrics`);
    return response.data;
};

/**
 * Returns the relative API path for document preview.
 * The frontend will typically prepend VITE_API_URL to this.
 * e.g., `${import.meta.env.VITE_API_URL}${batchService.getPreviewApiUrl(batchId, docId)}`
 */
const getPreviewApiUrl = (batchId, docId) => {
    if (!batchId || !docId) return '';
    // Returns a relative path because apiClient's baseURL is already set.
    // If used for <img> src or <iframe>, ensure the full path is constructed correctly in the component.
    return `/batches/${batchId}/documents/${docId}/preview`;
};

const downloadDocumentBlob = async (batchId, docId) => {
    if (!batchId || !docId) {
        const errorMsg = 'Batch ID and Document ID are required to download the document.';
        console.error(`[batchService] ${errorMsg}`);
        throw new Error(errorMsg);
    }

    const endpoint = `/batches/${batchId}/documents/${docId}/download`;
    console.log(`[batchService] Attempting to download blob. Configured baseURL: '${apiClient.defaults.baseURL}', Endpoint: '${endpoint}'`);

    try {
        const response = await apiClient.get(endpoint, {
            responseType: 'blob', // Crucial for Axios to handle the response as a Blob
        });

        if (!(response.data instanceof Blob)) {
            console.error('[batchService] Downloaded data is not a Blob. Received:', response.data, 'Content-Type:', response.headers ? response.headers['content-type'] : 'N/A');
            throw new Error('Downloaded file data is not in the expected Blob format. The server might have sent an error or incorrect content type.');
        }
        if (response.data.size === 0) {
            console.warn(`[batchService] Downloaded blob for doc ${docId} is empty (0 bytes).`);
        }
        return response.data; // This is the Blob object

    } catch (error) {
        console.error(`[batchService] Error downloading blob for doc ${docId} from endpoint '${endpoint}':`, error.isAxiosError ? error.toJSON() : error);
        let errorMessage = `Failed to download file ${docId}.`;
        if (error.response) {
            const { status, statusText, data } = error.response;
            errorMessage = `Download failed: Server responded with ${status} ${statusText}.`;
            try {
                let errorJson;
                if (data instanceof Blob && data.type === 'application/json') {
                    const errorText = await data.text();
                    errorJson = JSON.parse(errorText);
                } else if (typeof data === 'object' && data !== null) {
                    errorJson = data;
                }
                if (errorJson && errorJson.message) {
                    errorMessage = errorJson.message;
                }
            } catch (parseError) {
                console.warn('[batchService] Could not parse JSON error response from backend:', parseError);
            }
            if (status === 401) errorMessage = "Unauthorized: Please ensure you are logged in.";
            else if (status === 403) errorMessage = "Forbidden: You do not have permission to download this file.";
            else if (status === 404) errorMessage = "File not found on the server.";
            else if (status >= 500) errorMessage = "Server error while downloading. Please try again later.";
        } else if (error.request) {
            errorMessage = 'Download failed: No response from server. Check network and server status.';
        } else {
            errorMessage = `Download failed: ${error.message || 'An unknown error occurred.'}`;
        }
        throw new Error(errorMessage);
    }
};

// --- Image Enhancement Service Functions ---

/**
 * Calls the Python API to enhance a single image.
 * @param {string} originalImageUrl - The publicly accessible URL of the original image.
 * @param {string} model - The enhancement model (e.g., "REAL-ESRGAN 2x").
 * @returns {Promise<object>} The Python API response for single image. Expected to have `output_url` and `status`.
 */
const enhanceSingleImagePyApi = async (originalImageUrl, model) => {
    if (!originalImageUrl || !model) {
        throw new Error('Original image URL and model are required for enhancement.');
    }
    const payload = {
        url: originalImageUrl,
        model: model,
    };
    console.log('[batchService] Calling Python single image enhancement API with payload:', payload);
    try {
        const response = await axios.post(`${PYTHON_AI_API_BASE_URL}/process`, payload);
        console.log('[batchService] Python single image enhancement API response:', response.data);

        if (response.data && response.data.status === 'success' && response.data.output_url) {
            return response.data;
        } else if (response.data && response.data.message) {
            // Handle cases where Python API returns 200 OK but an error in the body
            throw new Error(`Enhancement API error: ${response.data.message} (Model: ${model}, Status: ${response.data.status || 'unknown'})`);
        } else {
            throw new Error(`Unknown or unsuccessful enhancement API response for URL: ${originalImageUrl} (Model: ${model})`);
        }
    } catch (error) {
        const errorData = error.response?.data;
        const errorMessage = errorData?.message || (error.isAxiosError ? error.message : 'Failed to enhance image via Python API.');
        console.error('Error calling Python single image enhancement API:', errorData || error.message);
        throw new Error(errorMessage);
    }
};

/**
 * Calls the Python API to enhance multiple images.
 * @param {Array<string>} originalImageUrls - Array of publicly accessible URLs.
 * @param {string} model - The enhancement model.
 * @param {Array<object>} documents - Array of document objects, each with at least an `id` and `storageKey` (original URL).
 * This is needed to map results back if the Python API doesn't return original URLs reliably.
 * @returns {Promise<object>} The Python API response for multiple images. Expected to have `results` array.
 */
const enhanceMultipleImagesPyApi = async (originalImageUrls, model, documents = []) => {
    if (!originalImageUrls || originalImageUrls.length === 0 || !model) {
        throw new Error('Original image URLs array and model are required for batch enhancement.');
    }
    const payload = {
        urls: originalImageUrls,
        model: model,
    };
    console.log('[batchService] Calling Python multiple image enhancement API with payload:', payload);
    try {
        const response = await axios.post(`${PYTHON_AI_API_BASE_URL}/process`, payload);
        console.log('[batchService] Python multiple image enhancement API response:', response.data);

        // The Python API response structure for multiple URLs has a general message
        // and a 'results' array with individual statuses and output_url.
        // It also includes 'input_url' in case of errors for specific URLs.
        if (response.data && Array.isArray(response.data.results)) {
             // Try to map results back to original document IDs if possible
             // This assumes the order of results matches the order of URLs sent,
             // or uses input_url if provided by the Python API in its results.
            const processedResults = response.data.results.map((result, index) => {
                const originalDoc = documents.find(doc => doc.storageKey === (result.input_url || originalImageUrls[index]));
                return {
                    ...result,
                    docId: originalDoc ? originalDoc.id : null, // Add docId if found
                    originalUrl: result.input_url || originalImageUrls[index], // Ensure original URL is present
                };
            });
            return { ...response.data, results: processedResults };
        } else if (response.data && response.data.message) {
            throw new Error(`Batch enhancement API error: ${response.data.message}`);
        } else {
            throw new Error('Unknown or malformed batch enhancement API response.');
        }
    } catch (error) {
        const errorData = error.response?.data;
        const errorMessage = errorData?.message || (error.isAxiosError ? error.message : 'Failed to batch enhance images via Python API.');
        console.error('Error calling Python multiple image enhancement API:', errorData || error.message);
        throw new Error(errorMessage);
    }
};

/**
 * Saves/updates the enhancedStorageKey for a document in your Node.js backend.
 * @param {string} batchId
 * @param {string} docId
 * @param {string | null} enhancedStorageKey - The URL of the enhanced image, or null to clear.
 * @returns {Promise<object>} Your backend's document update response.
 */
const setDocumentEnhancedKey = async (batchId, docId, enhancedStorageKey) => {
    if (!batchId || !docId) {
        throw new Error('Batch ID and Document ID are required to update enhanced key.');
    }
    // enhancedStorageKey can be null (to clear it), so we don't check for its falsiness here.
    // The backend controller has validation for `undefined`.
    console.log(`[batchService] Setting enhanced key for doc ${docId} in batch ${batchId} to: ${enhancedStorageKey}`);
    try {
        const response = await apiClient.put(`/batches/${batchId}/documents/${docId}/enhanced-key`, {
            enhancedStorageKey: enhancedStorageKey,
        });
        return response.data; // The updated document from your backend
    } catch (error) {
        const errorData = error.response?.data;
        const errorMessage = errorData?.message || (error.isAxiosError ? error.message : 'Failed to save enhanced image URL.');
        console.error('Error setting document enhanced key in backend:', errorData || error.message);
        throw new Error(errorMessage);
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
    // Enhancement related services
    enhanceSingleImagePyApi,
    enhanceMultipleImagesPyApi,
    setDocumentEnhancedKey,
};