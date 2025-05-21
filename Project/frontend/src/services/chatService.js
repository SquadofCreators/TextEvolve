import axios from 'axios';

// Construct the base URL for the chat API endpoint
// e.g., if VITE_AI_API_URL is "https://pyapi.textevolve.in", this becomes "https://pyapi.textevolve.in/chat"
const PYTHON_CHAT_API_BASE_URL = `${import.meta.env.VITE_AI_API_URL}/chat`;

/**
 * Calls the Python chat API to get a response based on context, history, and query.
 * @param {string} text - The context document.
 * @param {Array<object>} history - Array of previous messages, e.g., [{role: 'user'|'model', message: string}].
 * @param {string} query - The current user question.
 * @returns {Promise<object>} The API response, expected to have an "answer" field.
 */
const generateChatResponse = async (text, history, query) => {
    const endpoint = `${PYTHON_CHAT_API_BASE_URL}/generate`;
    const payload = {
        text,    // Context document
        history, // Array of {role: 'user'|'model', message: string}
        query    // Current user question
    };

    console.log('[chatService] Sending payload to chat API:', endpoint, payload);

    try {
        const response = await axios.post(endpoint, payload, {
            headers: {
                'Content-Type': 'application/json',
            }
        });
        console.log('[chatService] Received response from chat API:', response.data);

        if (response.data && typeof response.data.answer === 'string') {
            return response.data; // Expecting { answer: "..." }
        } else {
            const errorMessage = response.data?.message || response.data?.detail || 'Chat API returned an unexpected response format or missing answer.';
            console.error('[chatService] Chat API error or unexpected format in response data:', response.data);
            throw new Error(errorMessage);
        }
    } catch (error) {
        let errorMessage = 'Failed to get chat response from Python API.';
        if (error.response) { // Axios error with a response
            const errorData = error.response.data;
            errorMessage = errorData?.detail || errorData?.message || error.response.statusText || errorMessage;
        } else if (error.request) { // Axios error, request made but no response
            errorMessage = 'No response received from chat API. Check network or server status.';
        } else if (error.message) { // Other errors (e.g., setup error, non-Axios error passed through)
            errorMessage = error.message;
        }
        
        console.error('[chatService] Error calling Python chat API:', {
            message: error.message,
            responseData: error.response?.data,
            status: error.response?.status,
            requestData: payload, // Log the payload that caused the error
            isAxiosError: error.isAxiosError,
        });
        throw new Error(errorMessage);
    }
};

export const chatService = {
    generateChatResponse,
};