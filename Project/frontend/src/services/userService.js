// src/services/userService.js

import apiClient from './apiConfig';
import { AUTH_TOKEN_KEY } from './apiConfig'; // Import if needed for logout logic on 401

// --- Define URL Helper ---
// Helper to get the base backend URL (protocol + hostname + port)
// Ensure this logic correctly extracts the origin from your VITE_API_URL
const getBackendHostUrl = () => {
    // Assuming VITE_API_URL is like 'http://localhost:5000/api' or 'https://yourdomain.com/api'
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    try {
        const url = new URL(apiUrl);
        // Return the origin part (e.g., 'http://localhost:5000' or 'https://yourdomain.com')
        return url.origin;
    } catch (e) {
        console.error("Could not parse VITE_API_URL to derive host:", apiUrl, e);
        // Fallback might need adjustment based on deployment
        return 'http://localhost:5000';
    }
}
const BACKEND_HOST_URL = getBackendHostUrl();

// Helper to construct full URL for uploaded files (served via /uploads route)
const getFullUploadUrl = (relativePath) => {
    if (!relativePath || typeof relativePath !== 'string') return null;
    // Normalize path separators (replace backslashes with forward slashes)
    const normalizedPath = relativePath.replace(/\\/g, '/');
    // Remove leading slash if present, as it will be added after /uploads/
    const cleanPath = normalizedPath.startsWith('/') ? normalizedPath.substring(1) : normalizedPath;
    // Construct the full URL
    return `${BACKEND_HOST_URL}/uploads/${cleanPath}`;
};
// --- End URL Helper ---


/**
 * Fetches the profile of the currently authenticated user.
 * @returns {Promise<object>} User profile data.
 */
const getMe = async () => {
    try {
        const response = await apiClient.get('/users/me');
        return response.data; // Return data payload
    } catch (error) {
        console.error("Error fetching user profile:", error.response?.data || error.message);
        // Optional: Handle 401 specifically if needed (e.g., trigger logout)
        // if (error?.status === 401) { ... }
        throw error.response?.data || error; // Re-throw standardized error
    }
};

/**
 * Updates the profile of the currently authenticated user.
 * @param {object} userData - Data to update (e.g., { name: "New Name" }).
 * @returns {Promise<object>} Updated user profile data.
 */
const updateMe = async (userData) => {
    try {
        const response = await apiClient.put('/users/me', userData);
        return response.data; // Return data payload
    } catch (error) {
        console.error("Error updating user profile:", error.response?.data || error.message);
        throw error.response?.data || error;
    }
};

/**
 * Uploads or updates the user's profile picture.
 * @param {File} file - The image file to upload.
 * @returns {Promise<object>} Object containing the new profilePictureUrl.
 */
const updateProfilePicture = async (file) => {
    const formData = new FormData();
    formData.append('profilePicture', file); // Key matches backend ('profilePicture')

    try {
        // Request interceptor in apiConfig handles removing Content-Type for FormData
        const response = await apiClient.post('/users/me/picture', formData);
        return response.data; // Return data payload
    } catch (error) {
        console.error("Error updating profile picture:", error.response?.data || error.message);
        throw error.response?.data || error;
    }
};

/**
 * Deletes the account of the currently authenticated user.
 * @returns {Promise<object>} Success message.
 */
const deleteMe = async () => {
    try {
        const response = await apiClient.delete('/users/me');
        return response.data; // Return success message/status
    } catch (error) {
        console.error("Error deleting user account:", error.response?.data || error.message);
        throw error.response?.data || error;
    }
};

/**
 * Fetches the public profile preview for a given user ID.
 * Returns public user data with profilePictureUrl converted to a full URL.
 * @param {string} userId - The ID of the user whose profile to fetch.
 * @returns {Promise<object>} Public user profile data (id, name, profilePictureUrl, bio, etc.).
 */
const getUserProfilePreview = async (userId) => {
    if (!userId) {
        // Return null or empty object instead of throwing an error if that's preferable
        // throw new Error("User ID is required to fetch profile preview.");
        console.warn("getUserProfilePreview called without userId");
        return null;
    }
    try {
        const response = await apiClient.get(`/users/${userId}/profile`);
        const publicUserData = response.data; // Extract data payload

        // Construct full image URL if relative path exists AFTER getting data
        if (publicUserData && publicUserData.profilePictureUrl) {
            publicUserData.profilePictureUrl = getFullUploadUrl(publicUserData.profilePictureUrl);
        } else if (publicUserData) {
             // Ensure the property exists even if null, to avoid undefined issues in UI
             publicUserData.profilePictureUrl = null;
        }
        return publicUserData; // Return modified data payload
    } catch (error) {
         console.error(`Error fetching profile preview for user ${userId}:`, error.response?.data || error.message);
         // Depending on use case, you might want to return null on error instead of throwing
         // return null;
         throw error.response?.data || error;
    }
};

/**
 * Deletes the profile picture for the currently authenticated user.
 * @returns {Promise<object>} Success message or updated user object.
 */
const deleteProfilePicture = async () => {
    return apiClient.delete('/users/me/picture');
};

/**
 * Updates the password for the currently authenticated user.
 * @param {string} currentPassword - The user's current password.
 * @param {string} newPassword - The desired new password.
 * @param {string} confirmNewPassword - Confirmation of the new password.
 * @returns {Promise<object>} Success message.
 */
const updatePassword = async (currentPassword, newPassword, confirmNewPassword) => {
    if (!currentPassword || !newPassword || !confirmNewPassword) {
        throw new Error('Current password, new password, and confirmation are required.');
    }
    if (newPassword !== confirmNewPassword) {
         throw new Error('New passwords do not match.');
    }
    return apiClient.put('/users/me/password', {
        currentPassword,
        newPassword,
        confirmNewPassword // Send confirmation for backend validation (optional but good)
    });
};

/**
 * Searches users based on name query.
 * @param {string} query - Search term.
 * @returns {Promise<object>} Search results including users, currentPage, totalPages, and totalUsers.
 */
const searchUsers = async (query) => {
    if (!query) return { users: [], currentPage: 1, totalPages: 1, totalUsers: 0 };
    try {
      const response = await apiClient.get(`/users/search?name=${encodeURIComponent(query)}`);
      return response.data; // { users, currentPage, totalPages, totalUsers }
    } catch (error) {
      console.error("Error searching users:", error.response?.data || error.message);
      throw error.response?.data || error;
    }
  };

export const userService = {
    getMe,
    updateMe,
    updateProfilePicture,
    deleteMe,
    getUserProfilePreview,
    deleteProfilePicture,
    updatePassword,
    searchUsers
};