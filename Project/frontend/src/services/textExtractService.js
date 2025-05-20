import axios from 'axios';

// Use the base URL for all AI-related API calls from VITE environment variables
const AI_API_BASE_URL = import.meta.env.VITE_AI_API_URL;
const CUSTOM_AI_API_URL = import.meta.env.VITE_CUSTOM_AI_API_URL;

// Default timeout for OCR tasks (e.g., 5 minutes)
const OCR_TIMEOUT = 300000;

/**
 * Handles common error logic for API calls within this service.
 * @param {Error} error - The error object caught (likely from Axios).
 * @param {string} serviceName - Name of the service for error messages.
 * @param {string} apiUrl - The URL that was called.
 */
const handleApiError = (error, serviceName, apiUrl) => {
    console.error(`Error calling ${serviceName} service:`, error.response?.data || error.message);

    if (error.response) {
        const status = error.response.status;
        let dataMessage = error.message;
        try {
            if (error.response.data) {
                dataMessage = typeof error.response.data === 'object' ? JSON.stringify(error.response.data) : String(error.response.data);
            }
        } catch (parseError) {
             dataMessage = `Status ${status}, but response data could not be parsed.`;
        }
        throw new Error(`${serviceName} error: ${status} - ${dataMessage}`);
    } else if (error.request) {
        throw new Error(`${serviceName} error: No response received from ${apiUrl}.`);
    } else if (error.code === 'ECONNABORTED') {
        const timeoutDuration = error.config?.timeout || OCR_TIMEOUT;
        throw new Error(`${serviceName} error: Request timed out after ${timeoutDuration}ms.`);
    } else {
        throw new Error(`${serviceName} setup/request error: ${error.message}`);
    }
};

/**
 * Performs OCR using Google Vision API for a single image URL.
 * @param {string} imageUrl - A publicly accessible image URL.
 * @returns {Promise<object>} A promise resolving to the OCR result object.
 */
const googleOcrSingleImage = async (imageUrl) => {
    const serviceName = 'Google OCR (Single)';
    if (!AI_API_BASE_URL) {
        throw new Error("AI service endpoint (VITE_AI_API_URL) is not configured.");
    }
    if (!imageUrl) {
        throw new Error("No image URL provided for Google OCR.");
    }

    const apiUrl = `${AI_API_BASE_URL}/ocr/google-ocr`;
    const payload = { image: imageUrl };

    try {
        const response = await axios.post(apiUrl, payload, {
            headers: { 'Content-Type': 'application/json' },
            timeout: OCR_TIMEOUT
        });
        return response.data;
    } catch (error) {
        handleApiError(error, serviceName, apiUrl);
    }
};

/**
 * Performs OCR using Google Vision API for multiple image URLs.
 * @param {string[]} imageUrls - An array of publicly accessible image URLs.
 * @returns {Promise<object>} A promise resolving to the OCR results object.
 */
const googleOcrMultipleImages = async (imageUrls) => {
    const serviceName = 'Google OCR (Multiple)';
    if (!AI_API_BASE_URL) {
        throw new Error("AI service endpoint (VITE_AI_API_URL) is not configured.");
    }
    if (!imageUrls || !Array.isArray(imageUrls) || imageUrls.length === 0) {
        throw new Error("Invalid or empty image URL array provided for Google OCR.");
    }

    const apiUrl = `${AI_API_BASE_URL}/ocr/google-ocr`;
    const payload = { images: imageUrls };

    try {
        const response = await axios.post(apiUrl, payload, {
            headers: { 'Content-Type': 'application/json' },
            timeout: OCR_TIMEOUT
        });
        return response.data;
    } catch (error) {
        handleApiError(error, serviceName, apiUrl);
    }
};

/**
 * Performs OCR using Azure Vision API for a single image URL.
 * @param {string} imageUrl - A publicly accessible image URL.
 * @returns {Promise<object>} A promise resolving to the OCR result object.
 */
const azureOcrSingleImage = async (imageUrl) => {
    const serviceName = 'Azure OCR (Single)';
    if (!AI_API_BASE_URL) {
        throw new Error("AI service endpoint (VITE_AI_API_URL) is not configured.");
    }
    if (!imageUrl) {
        throw new Error("No image URL provided for Azure OCR.");
    }

    const apiUrl = `${AI_API_BASE_URL}/ocr/azure-ocr`;
    const payload = { image: imageUrl };

    try {
        const response = await axios.post(apiUrl, payload, {
            headers: { 'Content-Type': 'application/json' },
            timeout: OCR_TIMEOUT
        });
        return response.data;
    } catch (error) {
        handleApiError(error, serviceName, apiUrl);
    }
};

/**
 * Performs OCR using Azure Vision API for multiple image URLs.
 * @param {string[]} imageUrls - An array of publicly accessible image URLs.
 * @returns {Promise<object>} A promise resolving to the OCR results object.
 */
const azureOcrMultipleImages = async (imageUrls) => {
    const serviceName = 'Azure OCR (Multiple)';
    if (!AI_API_BASE_URL) {
        throw new Error("AI service endpoint (VITE_AI_API_URL) is not configured.");
    }
    if (!imageUrls || !Array.isArray(imageUrls) || imageUrls.length === 0) {
        throw new Error("Invalid or empty image URL array provided for Azure OCR.");
    }

    const apiUrl = `${AI_API_BASE_URL}/ocr/azure-ocr`;
    const payload = { images: imageUrls };

    try {
        const response = await axios.post(apiUrl, payload, {
            headers: { 'Content-Type': 'application/json' },
            timeout: OCR_TIMEOUT
        });
        return response.data;
    } catch (error) {
        handleApiError(error, serviceName, apiUrl);
    }
};

// --- NEW CUSTOM TAMIL-ENGLISH OCR API FUNCTIONS ---

/**
 * Performs OCR using the Custom Tamil OCR API for a single image URL.
 * @param {string} imageUrl - A publicly accessible image URL.
 * @returns {Promise<object>} A promise resolving to the OCR result object.
 */
const customOcrSingleImage = async (imageUrl) => {
    const serviceName = 'Custom Tamil OCR (Single)';
    if (!CUSTOM_AI_API_URL) {
        throw new Error("Custom AI service endpoint (VITE_CUSTOM_AI_API_URL) is not configured.");
    }
    if (!imageUrl) {
        throw new Error("No image URL provided for Custom Tamil OCR.");
    }

    const apiUrl = `${CUSTOM_AI_API_URL}/ocr/single`; // Endpoint for your custom single image OCR
    const payload = { image: imageUrl };

    try {
        const response = await axios.post(apiUrl, payload, {
            headers: { 'Content-Type': 'application/json' },
            timeout: OCR_TIMEOUT
        });
        return response.data; // The response structure is an object with the URL as key
    } catch (error) {
        handleApiError(error, serviceName, apiUrl);
    }
};

/**
 * Performs OCR using the Custom Tamil OCR API for multiple image URLs.
 * @param {string[]} imageUrls - An array of publicly accessible image URLs.
 * @returns {Promise<object>} A promise resolving to the OCR results object.
 */
const customOcrMultipleImages = async (imageUrls) => {
    const serviceName = 'Custom Tamil OCR (Multiple)';
    if (!CUSTOM_AI_API_URL) {
        throw new Error("Custom AI service endpoint (VITE_CUSTOM_AI_API_URL) is not configured.");
    }
    if (!imageUrls || !Array.isArray(imageUrls) || imageUrls.length === 0) {
        throw new Error("Invalid or empty image URL array provided for Custom Tamil OCR.");
    }

    const apiUrl = `${CUSTOM_AI_API_URL}/ocr/multiple`; // Endpoint for your custom multiple image OCR
    const payload = { images: imageUrls };

    try {
        const response = await axios.post(apiUrl, payload, {
            headers: { 'Content-Type': 'application/json' },
            timeout: OCR_TIMEOUT
        });
        return response.data; // The response structure is an object with URLs as keys
    } catch (error) {
        handleApiError(error, serviceName, apiUrl);
    }
};

export const textExtractService = {
    googleOcrSingleImage,
    googleOcrMultipleImages,
    azureOcrSingleImage,
    azureOcrMultipleImages,
    customOcrSingleImage,      
    customOcrMultipleImages,   
};