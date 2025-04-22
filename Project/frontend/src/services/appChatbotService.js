// src/services/appChatbotService.js

import axios from 'axios';

// Use the base URL for AI-related API calls from VITE environment variables
const AI_API_BASE_URL = import.meta.env.VITE_AI_API_URL;

// Default timeout for chat tasks (e.g., 30-60 seconds)
const CHAT_TIMEOUT = 60000; // 60 seconds, adjust if needed

/**
 * Handles common error logic for API calls within this service.
 * Adapted from the provided textEnhanceService example.
 * @param {Error} error - The error object caught (likely from Axios).
 * @param {string} serviceName - Name of the service for error messages.
 * @param {string} apiUrl - The URL that was called.
 */
const handleApiError = (error, serviceName, apiUrl) => {
    // Log the detailed error for developers
    console.error(`Error calling ${serviceName} at ${apiUrl}:`, error.response?.data || error.message);
    if(error.config) {
        console.error('Request Config:', error.config);
    }

    if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        const status = error.response.status;
        let message = `Server responded with status ${status}.`; // Default message
        // Try to get a more specific error message from the response body
        if (error.response.data && error.response.data.error) {
            message = error.response.data.error;
        } else if (typeof error.response.data === 'string' && error.response.data.length < 200) {
            // Sometimes errors are plain strings
            message = error.response.data;
        }

        // Customize messages for specific known statuses if needed
        if (status === 400) {
            message = `Bad Request (${status}): ${message}`;
        } else if (status === 415) {
             message = `Unsupported Request Format (${status}): ${message}`;
        } else if (status === 503) {
             message = `Service Unavailable (${status}): ${message}`;
             // Check for specific backend messages if applicable
             if (message.includes("Gemini API Key")) {
                 message = `Service configuration error: Gemini API Key may be missing or invalid on the server.`;
             }
        } else if (status === 429) {
             message = `API Quota Exceeded (${status}): ${message}`;
        } else if (status >= 500) {
             message = `Server Error (${status}): ${message}`;
        }
         // Throw a user-friendly error
        throw new Error(`${serviceName} failed: ${message}`);

    } else if (error.request) {
        // The request was made but no response was received
        console.error(`${serviceName} error: No response received. Is the server running at ${apiUrl}?`);
        throw new Error(`${serviceName} failed: Could not connect to the server.`);
    } else if (error.code === 'ECONNABORTED') {
        // Request timed out
        const timeoutDuration = error.config?.timeout || CHAT_TIMEOUT;
        console.error(`${serviceName} error: Request timed out after ${timeoutDuration}ms.`);
        throw new Error(`${serviceName} failed: Request timed out.`);
    } else {
        // Something happened in setting up the request that triggered an Error
        console.error(`${serviceName} setup/request error: ${error.message}`);
        throw new Error(`${serviceName} failed: ${error.message}`);
    }
};


/**
 * Sends a query and chat history to the chatbot API.
 * @param {string} query - The user's current query.
 * @param {Array<{role: 'user' | 'model', text: string}>} history - The conversation history (using 'text' internally).
 * @returns {Promise<string>} - A promise that resolves with the chatbot's answer string.
 */
const getChatbotResponse = async (query, history) => {
    const serviceName = 'App Chatbot Service';

    if (!AI_API_BASE_URL) {
        // Use console.error for config issues, throw user-friendly error
        console.error(`${serviceName} configuration error: VITE_AI_API_URL environment variable is not set.`);
        throw new Error("Chat service is not configured correctly. Please contact support.");
    }
     if (!query || typeof query !== 'string' || !query.trim()) {
        // Shouldn't happen if called correctly, but good to validate
        throw new Error("Invalid or empty query provided for chatbot.");
    }
     if (!Array.isArray(history)) {
         throw new Error("Invalid history provided for chatbot (must be an array).");
     }


    const apiUrl = `${AI_API_BASE_URL}/app-chat/generate`; // Construct full URL

    // Ensure history payload matches the backend expectation ('message' field)
    const formattedHistory = history.map(turn => ({
        role: turn.role,
        message: turn.text // Map internal 'text' field to 'message' for API
    }));

    const payload = {
        query: query,
        history: formattedHistory,
    };

    try {
        console.log(`Sending request to ${serviceName} at ${apiUrl}`);
        const response = await axios.post(apiUrl, payload, {
            headers: { 'Content-Type': 'application/json' },
            timeout: CHAT_TIMEOUT // Use specific timeout for chat
        });

        console.log(`${serviceName} Response Status:`, response.status);

        // Validate the response structure
        if (response.data && typeof response.data.answer === 'string') {
            return response.data.answer; // Return only the answer string
        } else {
             console.error('Invalid response structure:', response.data);
             throw new Error('Received an invalid response format from the server.');
        }
    } catch (error) {
        // Use the centralized error handler
        handleApiError(error, serviceName, apiUrl);
        // handleApiError should throw, so this line won't be reached,
        // but return null or throw explicitly as a fallback if needed.
        throw error; // Re-throw the processed error from handleApiError
    }
};

// Export the service function within an object
export const appChatbotService = {
    getChatbotResponse,
};

// Optional: Default export if preferred
// export default appChatbotService;