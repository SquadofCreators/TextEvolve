// src/services/analyticsService.js - Use this version AFTER fixing apiConfig.js
import apiClient from './apiConfig';

const getAnalyticsSummary = async () => {
    try {
        const response = await apiClient.get('/analytics/summary');
        console.log('analyticsService.getAnalyticsSummary response:', response); // Keep log
        return response.data; // Directly return data
    } catch (error) {
        console.error("Error fetching analytics summary:", error.response?.data || error.message);
        console.error("Full error object (summary):", error); // Keep log
        throw error.response?.data || error;
    }
};

const getAnalyticsTrends = async (params = { period: 'month' }) => {
    console.log(`analyticsService: Fetching trends with params:`, params);
    try {
        const response = await apiClient.get('/analytics/trends', { params });
        console.log('analyticsService.getAnalyticsTrends response:', response); // Keep log
        return response.data; // Directly return data
    } catch (error) {
        console.error("Error fetching analytics trends:", error.response?.data || error.message);
        console.error("Full error object (trends):", error); // Keep log
        throw error.response?.data || error;
    }
};

/**
 * Fetches data points for accuracy trends over a specified period.
 * Assumes a backend endpoint GET /api/analytics/accuracy-trends exists.
 * @param {object} [params] - Optional query parameters { period: 'week'|'month'|'year' }.
 * @returns {Promise<Array<object>>} Array of accuracy trend data points [{ date: 'YYYY-MM-DD', avgAccuracy: number }, ...]
 */
const getAccuracyTrends = async (params = { period: 'month' }) => {
    console.log(`analyticsService: Fetching accuracy trends with params:`, params);
    try {
        // IMPORTANT: Ensure this matches your *actual* backend endpoint for accuracy data
        const response = await apiClient.get('/analytics/accuracy-trends', { params });
        console.log('analyticsService.getAccuracyTrends response:', response);
        return response.data;
    } catch (error) {
        console.error("Error fetching accuracy trends:", error.response?.data || error.message);
        console.error("Full error object (accuracy trends):", error);
        throw error.response?.data || error;
    }
};

const getAnalyticsDocTypes = async () => {
    console.log(`analyticsService: Fetching doc types`);
    try {
        const response = await apiClient.get('/analytics/doc-types');
        console.log('analyticsService.getAnalyticsDocTypes response:', response); // Keep log
        return response.data; // Directly return data
    } catch (error) {
        console.error("Error fetching document type analytics:", error.response?.data || error.message);
        console.error("Full error object (doc types):", error); // Keep log
        throw error.response?.data || error;
    }
};

const getDocumentsLog = async (params = { page: 1, limit: 10 }) => {
     try {
         const response = await apiClient.get('/analytics/documents-log', { params });
         console.log('analyticsService.getDocumentsLog response:', response); // Keep log
         return response.data;
     } catch (error) {
         console.error("Error fetching documents log:", error.response?.data || error.message);
         console.error("Full error object (doc log):", error); // Keep log
         throw error.response?.data || error;
     }
 };

export const analyticsService = {
    getAnalyticsSummary,
    getAnalyticsTrends,
    getAccuracyTrends,
    getAnalyticsDocTypes,
    getDocumentsLog,
};