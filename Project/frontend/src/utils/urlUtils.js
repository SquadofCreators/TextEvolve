/**
 * Derives the Backend Host URL (protocol + hostname + port) from the VITE_API_URL environment variable.
 * Falls back to http://localhost:5000 if parsing fails or variable is not set.
 * @returns {string} The base URL of the backend server (e.g., "http://localhost:5000").
 */
const getBackendHostUrl = () => {
    // Default to common dev setup if env var is missing
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    try {
        // Use URL constructor to easily get the origin part
        const url = new URL(apiUrl);
        return url.origin; // e.g., "http://localhost:5000"
    } catch (e) {
        console.error("Could not parse VITE_API_URL to derive host:", apiUrl, e);
        // Provide a sensible fallback for common development environments
        return 'http://localhost:5000';
    }
}

// Get the base URL once
const BACKEND_HOST_URL = getBackendHostUrl();
// Log for debugging during development startup
// console.log("urlUtils.js - BACKEND_HOST_URL:", BACKEND_HOST_URL); // Uncomment if needed

/**
 * Constructs the full, accessible URL for an uploaded file based on its storageKey.
 * Handles path separator normalization (replaces backslashes with forward slashes).
 * @param {string | null | undefined} storageKey - The relative path stored in the database (e.g., "profile-pictures/image.jpg" or "documents\\batchId\\file.jpg").
 * @returns {string | null} The full URL (e.g., "http://localhost:5000/uploads/profile-pictures/image.jpg") or null if storageKey is invalid.
 */
export const getFileUrl = (storageKey) => {
    if (!storageKey || typeof storageKey !== 'string') {
        // console.warn("getFileUrl called with invalid storageKey:", storageKey);
        return null; // Return null for invalid input
    }

    // 1. Normalize path separators: Replace all backslashes (\) with forward slashes (/)
    const normalizedStorageKey = storageKey.replace(/\\/g, '/');

    // 2. Ensure the path doesn't start with a slash after normalization
    const cleanStorageKey = normalizedStorageKey.startsWith('/')
        ? normalizedStorageKey.substring(1)
        : normalizedStorageKey;

    // 3. Construct the full URL using CORRECT template literal syntax
    //    Use backticks (` `) and ${variableName}
    const fullUrl = `${BACKEND_HOST_URL}/uploads/${cleanStorageKey}`;

    return fullUrl;
}

// Optional export if needed elsewhere, e.g., for direct use in non-component files
export { BACKEND_HOST_URL };