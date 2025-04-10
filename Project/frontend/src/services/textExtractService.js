// src/services/textExtractService.js
import axios from 'axios';

// Environment variable for the OCR API URL
// Ensure VITE_OCR_API_URL is correctly set in your .env file(s)
const OCR_API_URL = import.meta.env.VITE_OCR_API_URL;

/**
 * Sends a list of image URLs to the OCR service for text extraction.
 * @param {string[]} imageUrls - An array of publicly accessible image URLs.
 * @returns {Promise<object>} A promise resolving to the OCR results object,
 * where keys are the input image URLs and values are the extraction details.
 * Example: { "imageUrl1": { "extracted_text": "...", "accuracy": 0.95, ... }, ... }
 */
const extractTextFromImages = async (imageUrls) => {
    // Input validation
    if (!OCR_API_URL) {
        console.error("OCR Service URL (VITE_OCR_API_URL) is not defined.");
        throw new Error("OCR service endpoint is not configured.");
    }
    if (!imageUrls || imageUrls.length === 0) {
        throw new Error("No image URLs provided for extraction.");
    }

    try {
        console.log(`Sending ${imageUrls.length} URLs to OCR Service:`, OCR_API_URL);

        // Using axios directly - interceptors from apiClient do NOT apply here
        const response = await axios.post(OCR_API_URL, {
            images: imageUrls // Payload expected by the OCR service
        }, {
            headers: {
                'Content-Type': 'application/json',
                // Add any specific auth headers required ONLY by the OCR service, if any
                // 'X-OCR-API-Key': 'YOUR_OCR_SERVICE_API_KEY' // Example
            },
            // Set a timeout for the potentially long OCR process
            timeout: 300000 // 5 minutes example timeout (adjust as needed)
        });

        console.log("OCR Service Response Status:", response.status);

        // Axios throws for non-2xx statuses by default, but an extra check doesn't hurt
        // (and is useful if 'validateStatus' option was changed globally)
        if (response.status >= 200 && response.status < 300) {
            console.log("OCR Service Response Data:", response.data);
            // Return the data payload directly from the response
            return response.data;
        } else {
            // This part might be less likely to be hit if Axios default behavior isn't changed
            throw new Error(`OCR service responded with status ${response.status}: ${response.statusText}`);
        }
    } catch (error) {
        console.error("Error calling OCR service:", error.response?.data || error.message);

        // Provide more specific feedback based on Axios error structure
        if (error.response) {
            // The request was made and the server responded with a status code
            // that falls outside the range of 2xx
            const status = error.response.status;
            const dataMessage = error.response.data ? JSON.stringify(error.response.data) : error.message;
            throw new Error(`OCR service error: ${status} - ${dataMessage}`);
        } else if (error.request) {
            // The request was made but no response was received
            throw new Error(`OCR service error: No response received from ${OCR_API_URL}. Check network or service status.`);
        } else if (error.code === 'ECONNABORTED') {
             // Handle timeout specifically
             throw new Error(`OCR service error: Request timed out after ${error.config.timeout}ms.`);
        } else {
            // Something happened in setting up the request that triggered an Error
            throw new Error(`OCR service error: ${error.message}`);
        }
    }
};

export const textExtractService = {
    extractTextFromImages,
};