import axios from 'axios';

// Use the base URL for AI-related API calls from VITE environment variables
const AI_API_BASE_URL = import.meta.env.VITE_AI_API_URL;

// Default timeout for text enhancement tasks (e.g., 60 seconds)
const ENHANCE_TIMEOUT = 60000;

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
        // Include specific message for 503 if possible (as defined in backend)
        if (status === 503 && error.response.data?.error?.includes("Gemini API Key not found")) {
             throw new Error(`${serviceName} configuration error: Gemini API Key may be missing on the server.`);
        }
        throw new Error(`${serviceName} error: ${status} - ${dataMessage}`);
    } else if (error.request) {
        throw new Error(`${serviceName} error: No response received from ${apiUrl}.`);
    } else if (error.code === 'ECONNABORTED') {
        const timeoutDuration = error.config?.timeout || ENHANCE_TIMEOUT;
        throw new Error(`${serviceName} error: Request timed out after ${timeoutDuration}ms.`);
    } else {
        throw new Error(`${serviceName} setup/request error: ${error.message}`);
    }
};


/**
 * Sends text to the backend service for spelling and grammar correction using Gemini.
 * @param {string} textToEnhance - The text string to be enhanced.
 * @returns {Promise<object>} A promise resolving to the enhancement result object.
 * Example: { "enhanced_text": "Corrected text..." }
 */
const enhanceTextWithGemini = async (textToEnhance) => {
    const serviceName = 'Text Enhancement (Gemini)';
    if (!AI_API_BASE_URL) {
        throw new Error("AI service endpoint (VITE_AI_API_URL) is not configured.");
    }
    if (!textToEnhance || typeof textToEnhance !== 'string' || !textToEnhance.trim()) {
        throw new Error("Invalid or empty text provided for enhancement.");
    }

    const apiUrl = `${AI_API_BASE_URL}/enhancement/enhance-text`;
    const payload = { text: textToEnhance };

    try {
        console.log(`Sending text to ${serviceName}:`, apiUrl);
        const response = await axios.post(apiUrl, payload, {
            headers: { 'Content-Type': 'application/json' },
            timeout: ENHANCE_TIMEOUT // Use specific timeout for this task
        });
        console.log(`${serviceName} Response Status:`, response.status);
        // The backend returns { "enhanced_text": "..." }
        return response.data;
    } catch (error) {
        handleApiError(error, serviceName, apiUrl);
    }
};

// Export the service functions
export const textEnhanceService = {
    enhanceTextWithGemini,
};

// Optional: Default export if preferred
// export default textEnhanceService;