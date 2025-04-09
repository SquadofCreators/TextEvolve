import apiClient from './apiConfig';

/**
 * Fetches the profile of the currently authenticated user.
 * @returns {Promise<object>} User profile data.
 */
const getMe = async () => {
  return apiClient.get('/users/me');
};

/**
 * Updates the profile of the currently authenticated user.
 * @param {object} userData - Data to update (e.g., { name: "New Name" }).
 * @returns {Promise<object>} Updated user profile data.
 */
const updateMe = async (userData) => {
  return apiClient.put('/users/me', userData);
};

/**
 * Uploads or updates the user's profile picture.
 * @param {File} file - The image file to upload.
 * @returns {Promise<object>} Object containing the new profilePictureUrl.
 */
const updateProfilePicture = async (file) => {
  const formData = new FormData();
  formData.append('profilePicture', file); // Key must match backend ('profilePicture')

  // Axios instance handles Content-Type header for FormData
  return apiClient.post('/users/me/picture', formData);
};

/**
 * Deletes the account of the currently authenticated user.
 * @returns {Promise<object>} Success message.
 */
const deleteMe = async () => {
  return apiClient.delete('/users/me');
};

/**
 * Fetches the public profile preview for a given user ID.
 * Returns public user data with profilePictureUrl converted to a full URL.
 * @param {string} userId - The ID of the user whose profile to fetch.
 * @returns {Promise<object>} Public user profile data (id, name, profilePictureUrl, bio, etc.).
 */
const getUserProfilePreview = async (userId) => {
  if (!userId) {
       // You might want more robust error handling or return null/empty object
      throw new Error("User ID is required to fetch profile preview.");
  }
  // Calls the new backend endpoint: GET /api/v1/users/{userId}/profile
  const publicUserData = await apiClient.get(`/users/${userId}/profile`);

  // Construct full image URL if relative path exists
  if (publicUserData && publicUserData.profilePictureUrl) {
      publicUserData.profilePictureUrl = getFullUploadUrl(publicUserData.profilePictureUrl);
  }
  return publicUserData;
};


export const userService = {
  getMe,
  updateMe,
  updateProfilePicture,
  deleteMe,
  getUserProfilePreview,
};