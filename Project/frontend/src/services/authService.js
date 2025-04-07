import apiClient, { AUTH_TOKEN_KEY } from './apiConfig';

/**
 * Initiates user signup process.
 * @param {string} email - User's email.
 * @param {string} password - User's password.
 * @param {string} [name] - User's optional name.
 * @returns {Promise<object>} Response message.
 */
const signup = async (email, password, name) => {
  const payload = { email, password };
  if (name) {
    payload.name = name;
  }
  return apiClient.post('/auth/signup', payload);
};

/**
 * Verifies the OTP to complete registration or login.
 * Stores the received token on success.
 * @param {string} email - User's email.
 * @param {string} otp - The OTP code.
 * @returns {Promise<object>} Contains success message, token, and user info.
 */
const verifyOtp = async (email, otp) => {
  const response = await apiClient.post('/auth/verify-otp', { email, otp });
  if (response.token) {
    localStorage.setItem(AUTH_TOKEN_KEY, response.token); // Store the token
  }
  return response; // Contains token and user object
};

/**
 * Logs in an existing user.
 * Stores the received token on success.
 * @param {string} email - User's email.
 * @param {string} password - User's password.
 * @returns {Promise<object>} Contains success message, token, and user info.
 */
const login = async (email, password) => {
  const response = await apiClient.post('/auth/login', { email, password });
  if (response.token) {
    localStorage.setItem(AUTH_TOKEN_KEY, response.token); // Store the token
  }
  return response; // Contains token and user object
};

/**
 * Logs out the current user by removing the token.
 */
const logout = () => {
  localStorage.removeItem(AUTH_TOKEN_KEY);
  // Optionally: Add a call to a backend /logout endpoint if it exists
  // to invalidate the token server-side (though JWTs are typically stateless).
  console.log('User logged out.');
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