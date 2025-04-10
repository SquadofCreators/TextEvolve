// src/services/authService.js

import apiClient, { AUTH_TOKEN_KEY } from './apiConfig'; // Ensure AUTH_TOKEN_KEY is exported from apiConfig

/**
 * Initiates user signup process.
 * @param {string} email - User's email.
 * @param {string} password - User's password.
 * @param {string} [name] - User's optional name.
 * @returns {Promise<object>} Response message from backend.
 */
const signup = async (email, password, name) => {
    const payload = { email, password };
    if (name) {
        payload.name = name;
    }
    try {
        // Await the response
        const response = await apiClient.post('/auth/signup', payload);
        // Return the data part of the response
        return response.data;
    } catch (error) {
        console.error("Signup error:", error.response?.data || error.message);
        // Re-throw the standardized error from the interceptor or a new one
        throw error.response?.data || error;
    }
};

/**
 * Verifies the OTP to complete registration or login.
 * Stores the received token on success.
 * @param {string} email - User's email.
 * @param {string} otp - The OTP code.
 * @returns {Promise<object>} Response data from backend (contains token and user info).
 */
const verifyOtp = async (email, otp) => {
    try {
        // Await the response
        const response = await apiClient.post('/auth/verify-otp', { email, otp });
        // Check if token exists in the response *data*
        if (response.data && response.data.token) {
            localStorage.setItem(AUTH_TOKEN_KEY, response.data.token); // Store the token
            console.log("OTP Verified. Token stored.");
        } else {
             console.warn("OTP verification response did not contain a token in response.data.");
        }
        // Return the data part of the response
        return response.data;
    } catch (error) {
        console.error("OTP verification error:", error.response?.data || error.message);
        throw error.response?.data || error;
    }
};

/**
 * Logs in an existing user.
 * Stores the received token on success.
 * @param {string} email - User's email.
 * @param {string} password - User's password.
 * @returns {Promise<object>} Response data from backend (contains token and user info).
 */
const login = async (email, password) => {
     try {
        // Await the response
        const response = await apiClient.post('/auth/login', { email, password });
         // Check if token exists in the response *data*
        if (response.data && response.data.token) {
            localStorage.setItem(AUTH_TOKEN_KEY, response.data.token); // Store the token
            console.log("Login successful. Token stored.");
        } else {
             console.warn("Login response did not contain a token in response.data.");
        }
        // Return the data part of the response
        return response.data;
    } catch (error) {
         console.error("Login error:", error.response?.data || error.message);
         throw error.response?.data || error;
    }
};

/**
 * Logs out the current user by removing the token.
 */
const logout = () => {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    console.log('User logged out.');
    // Optional: Consider redirecting or reloading after logout
    // window.location.href = '/login'; // Hard refresh redirect
    // Or trigger state update in your app context if applicable
};

/**
 * Gets the currently stored auth token.
 * @returns {string|null} The auth token or null if not found.
 */
const getToken = () => {
    return localStorage.getItem(AUTH_TOKEN_KEY);
};

export const authService = {
    signup,
    verifyOtp,
    login,
    logout,
    getToken,
};