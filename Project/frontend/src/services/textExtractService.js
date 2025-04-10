// src/services/textExtractService.js
import axios from 'axios';

// URL for the external OCR AI backend
const OCR_API_URL = 'https://textevolve-backend-ai.onrender.com/google-ocr';
// Or use an environment variable:
// const OCR_API_URL = import.meta.env.VITE_OCR_API_URL || 'https://textevolve-backend-ai.onrender.com/google-ocr';

/**
 * Sends a list of image URLs to the OCR service for text extraction.
 * @param {string[]} imageUrls - An array of publicly accessible image URLs.
 * @returns {Promise<object>} A promise resolving to the OCR results object,
 * where keys are the input image URLs and values are the extraction details.
 * Example: { "imageUrl1": { "extracted_text": "...", "accuracy": 0.95, ... }, ... }
 */
const extractTextFromImages = async (imageUrls) => {
    if (!imageUrls || imageUrls.length === 0) {
        throw new Error("No image URLs provided for extraction.");
    }

    try {
        console.log(`Sending ${imageUrls.length} URLs to OCR Service:`, OCR_API_URL);
        // Using axios directly for potentially different backend/CORS needs
        const response = await axios.post(OCR_API_URL, {
            images: imageUrls
        }, {
            headers: {
                'Content-Type': 'application/json',
                // Add any required authentication headers for the AI backend if needed
            },
            // Increase timeout for potentially long OCR process
            timeout: 300000 // 5 minutes example timeout
        });

        console.log("OCR Service Response Status:", response.status);
        // Check if the response status is OK
        if (response.status >= 200 && response.status < 300) {
            console.log("OCR Service Response Data:", response.data);
            return response.data; // Return the results object
        } else {
            // Handle non-2xx responses from the OCR service
            throw new Error(`OCR service responded with status ${response.status}: ${response.statusText}`);
        }
    } catch (error) {
        console.error("Error calling OCR service:", error.response?.data || error.message);
        // Re-throw a more specific error
        if (error.response) {
             throw new Error(`OCR service error: ${error.response.status} - ${JSON.stringify(error.response.data) || error.message}`);
        } else if (error.request) {
             throw new Error(`OCR service error: No response received from ${OCR_API_URL}. Check network or service status.`);
        } else {
             throw new Error(`OCR service error: ${error.message}`);
        }
    }
};

export const textExtractService = {
    extractTextFromImages,
};