// src/services/analyticsService.js

import apiClient from './apiConfig'; // Adjust path if needed

/**
 * Fetches summary analytics statistics for the current user.
 * Corresponds to GET /api/analytics/summary
 * @returns {Promise<object>} A promise resolving to the summary data object.
 * Example: { totalDocuments, totalBatches, averageAccuracy, docsConvertedTrend, etc. }
 */
const getAnalyticsSummary = async () => {
    try {
        // Use apiClient to automatically handle base URL and auth headers
        const response = await apiClient.get('/analytics/summary');
        return response.data; // Axios wraps the response data in the `data` property
    } catch (error) {
        console.error("Error fetching analytics summary:", error.response?.data || error.message);
        // Re-throw the error to be handled by the calling component
        throw error.response?.data || error;
    }
};

/**
 * Fetches data points for conversion trends over a specified period.
 * Corresponds to GET /api/analytics/trends
 * @param {object} [params] - Optional query parameters.
 * @param {'week'|'month'|'year'} [params.period='month'] - The time period for the trend data.
 * @returns {Promise<Array<object>>} A promise resolving to an array of trend data points.
 * Example: [{ date: 'YYYY-MM-DD', count: number }, ...]
 */
const getAnalyticsTrends = async (params = { period: 'month' }) => {
    try {
        const response = await apiClient.get('/analytics/trends', { params }); // Pass params for query string
        return response.data;
    } catch (error) {
        console.error("Error fetching analytics trends:", error.response?.data || error.message);
        throw error.response?.data || error;
    }
};

/**
 * Fetches the distribution of document types processed by the user.
 * Corresponds to GET /api/analytics/doc-types
 * @returns {Promise<Array<object>>} A promise resolving to an array of document type counts.
 * Example: [{ type: 'PDF', count: number }, { type: 'Image', count: number }, ...]
 */
const getAnalyticsDocTypes = async () => {
    try {
        const response = await apiClient.get('/analytics/doc-types');
        return response.data;
    } catch (error) {
        console.error("Error fetching document type analytics:", error.response?.data || error.message);
        throw error.response?.data || error;
    }
};


/**
 * Fetches a paginated log of individual documents processed by the user.
 * Corresponds to GET /api/analytics/documents-log (if implemented)
 * @param {object} [params] - Optional query parameters for pagination, sorting, filtering.
 * @param {number} [params.page=1] - The page number to retrieve.
 * @param {number} [params.limit=10] - The number of documents per page.
 * @param {string} [params.sortBy='createdAt'] - Field to sort by.
 * @param {'asc'|'desc'} [params.sortOrder='desc'] - Sort direction.
 * @returns {Promise<object>} A promise resolving to the paginated log data.
 * Example: { documents: [...], currentPage, totalPages, totalDocuments }
 */
const getDocumentsLog = async (params = { page: 1, limit: 10 }) => {
     try {
         const response = await apiClient.get('/analytics/documents-log', { params });
         return response.data;
     } catch (error) {
         console.error("Error fetching documents log:", error.response?.data || error.message);
         throw error.response?.data || error;
     }
 };


// Export all functions as part of the analyticsService object
export const analyticsService = {
    getAnalyticsSummary,
    getAnalyticsTrends,
    getAnalyticsDocTypes,
    getDocumentsLog, // Include if you implemented the backend route
};