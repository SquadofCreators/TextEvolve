import axios from 'axios';

// Use the base URL for all AI-related API calls from VITE environment variables
const AI_API_BASE_URL = import.meta.env.VITE_AI_API_URL;

// Default timeouts
const LANG_TIMEOUT = 15000; // 15 seconds for fetching languages
const TRANSLATE_TIMEOUT = 30000; // 30 seconds for translation

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
        const timeoutDuration = error.config?.timeout || 'default';
        throw new Error(`${serviceName} error: Request timed out after ${timeoutDuration}ms.`);
    } else {
        throw new Error(`${serviceName} setup/request error: ${error.message}`);
    }
};

/**
 * Fetches the list of languages supported by the backend's translation service.
 * @returns {Promise<object>} A promise resolving to the languages object from the API.
 * Example structure: { translation: { "en": { "name": "English", ... }, ... }, dictionary: {...}, ... }
 */
const getSupportedLanguages = async () => {
    const serviceName = 'Language List';
    if (!AI_API_BASE_URL) {
        throw new Error("AI service endpoint (VITE_AI_API_URL) is not configured.");
    }
    const apiUrl = `${AI_API_BASE_URL}/translation/languages`;

    try {
        const response = await axios.get(apiUrl, {
            timeout: LANG_TIMEOUT
        });
        return response.data; // Return the full language data object
    } catch (error) {
        handleApiError(error, serviceName, apiUrl);
    }
};

/**
 * Translates text using the backend's translation service.
 * @param {string} text - The text to translate.
 * @param {string[]} toLangs - An array of target language codes (e.g., ["ta", "fr"]).
 * @param {string|null} [fromLang=null] - Optional: The source language code (e.g., "en"). If null, auto-detection is attempted.
 * @returns {Promise<object>} A promise resolving to the translation result object.
 * Example structure: { detectedLanguage?: { language: "en", score: 0.9 }, translations: [{ text: "...", to: "ta" }] }
 */
const translateText = async (text, toLangs, fromLang = null) => {
    const serviceName = 'Text Translation';
    if (!AI_API_BASE_URL) {
        throw new Error("AI service endpoint (VITE_AI_API_URL) is not configured.");
    }
    if (!text || typeof text !== 'string' || !text.trim()) {
        throw new Error("Invalid or empty text provided for translation.");
    }
    if (!toLangs || !Array.isArray(toLangs) || toLangs.length === 0) {
        throw new Error("Invalid or empty target languages array provided.");
    }

    const apiUrl = `${AI_API_BASE_URL}/translation/translate`;
    const payload = {
        text: text,
        to_langs: toLangs,
        // Conditionally add from_lang only if it's provided and not null/empty
        ...(fromLang && typeof fromLang === 'string' && fromLang.trim() && { from_lang: fromLang })
    };

    try {
        const response = await axios.post(apiUrl, payload, {
            headers: { 'Content-Type': 'application/json' },
            timeout: TRANSLATE_TIMEOUT
        });
        return response.data; // Return the translation result object
    } catch (error) {
        handleApiError(error, serviceName, apiUrl);
    }
};


// Export the service functions
export const translateService = {
    getSupportedLanguages,
    translateText,
};

// Optional: Default export if preferred
// export default translateService;