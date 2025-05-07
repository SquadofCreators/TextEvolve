import apiClient from './apiConfig'; // Your existing Axios instance

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
        formData.append('documents', files[i]);
    }
    // Ensure your apiClient is configured to handle FormData Content-Type correctly
    // Axios usually does this automatically for FormData.
    const response = await apiClient.post(`/batches/${batchId}/documents`, formData);
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

const getPreviewApiUrl = (batchId, docId) => {
    if (!batchId || !docId) return '';
    // This returns a relative path, which would be appended to apiClient's baseURL if used directly with it.
    // However, it's more likely used to construct a full URL for an <iframe> src or similar elsewhere.
    return `/batches/${batchId}/documents/${docId}/preview`;
};

// --- REFINED downloadDocumentBlob ---
const downloadDocumentBlob = async (batchId, docId) => {
    if (!batchId || !docId) {
        const errorMsg = 'Batch ID and Document ID are required to download the document.';
        console.error(`[batchService] ${errorMsg}`);
        throw new Error(errorMsg);
    }

    const endpoint = `/batches/${batchId}/documents/${docId}/download`;
    // Assuming apiClient.defaults.baseURL is set, e.g., "https://api.textevolve.in" or "http://localhost:5000"
    // And your API routes are like "/api/batches/...", so baseURL might be "https://api.textevolve.in/api"
    // Or if your baseURL is just the origin, your endpoint here starts with "/api". Let's assume routes are relative to baseURL.
    // If your apiClient's baseURL already includes '/api', then the endpoint should not repeat it.
    // For clarity, let's assume the endpoint path is relative to the apiClient's baseURL.
    console.log(`[batchService] Attempting to download blob. Configured baseURL: '${apiClient.defaults.baseURL}', Endpoint: '${endpoint}'`);

    try {
        const response = await apiClient.get(endpoint, {
            responseType: 'blob', // Crucial for Axios to handle the response as a Blob
        });

        // When responseType is 'blob', Axios successfully puts the Blob in response.data.
        // Check if response.data is indeed a Blob.
        if (!(response.data instanceof Blob)) {
            console.error('[batchService] Downloaded data is not a Blob. Received:', response.data, 'Content-Type:', response.headers ? response.headers['content-type'] : 'N/A');
            throw new Error('Downloaded file data is not in the expected Blob format. The server might have sent an error or incorrect content type.');
        }
        if (response.data.size === 0) {
            console.warn(`[batchService] Downloaded blob for doc ${docId} is empty (0 bytes).`);
            // Depending on requirements, you might want to throw an error or allow empty blobs.
        }
        
        return response.data; // This is the Blob object

    } catch (error) {
        // Log the full Axios error structure for better debugging if it's an Axios error
        console.error(`[batchService] Error downloading blob for doc ${docId} from endpoint '${endpoint}':`, error.isAxiosError ? error.toJSON() : error);
        
        let errorMessage = `Failed to download file ${docId}.`; // Default error message

        if (error.response) {
            // The request was made and the server responded with a status code (4xx, 5xx)
            const { status, statusText, data } = error.response;
            errorMessage = `Download failed: Server responded with ${status} ${statusText}.`;

            // Attempt to parse a more specific error message from the backend response body
            try {
                let errorJson;
                if (data instanceof Blob && data.type === 'application/json') {
                    // If the server sent a JSON error message as a blob
                    const errorText = await data.text();
                    errorJson = JSON.parse(errorText);
                } else if (typeof data === 'object' && data !== null) {
                    // If the server sent a JSON error message directly
                    errorJson = data;
                }

                if (errorJson && errorJson.message) {
                    errorMessage = errorJson.message; // Use backend's error message
                }
            } catch (parseError) {
                console.warn('[batchService] Could not parse JSON error response from backend:', parseError);
            }

            // Provide more specific messages for common HTTP errors
            if (status === 401) errorMessage = "Unauthorized: Please ensure you are logged in and your session is valid.";
            else if (status === 403) errorMessage = "Forbidden: You do not have permission to download this file.";
            else if (status === 404) errorMessage = "File not found on the server.";
            else if (status >= 500) errorMessage = "Server error occurred while trying to download the file. Please try again later.";

        } else if (error.request) {
            // The request was made but no response was received (e.g., network error, server down)
            errorMessage = 'Download failed: No response from the server. Please check your network connection and if the server is running.';
        } else {
            // Something else happened in setting up the request that triggered an Error
            errorMessage = `Download failed: ${error.message || 'An unknown error occurred.'}`;
        }
        
        throw new Error(errorMessage); // Throw a new error with a potentially more user-friendly message
    }
};
// --- End of REFINED downloadDocumentBlob ---

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
    downloadDocumentBlob, // Ensure this refined function is exported
};