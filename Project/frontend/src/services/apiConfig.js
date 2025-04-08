import axios from 'axios';

// Define the key used to store the auth token in local storage
const AUTH_TOKEN_KEY = 'authToken';

// Create an Axios instance
const apiClient = axios.create({
  baseURL: (import.meta.env.VITE_API_URL || 'http://localhost:5000') + '/api', // Fallback URL
  headers: {
    'Content-Type': 'application/json',
  },
});

// --- Request Interceptor ---
// Adds the Authorization header to requests if a token exists
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    // Important: If uploading files (FormData), let axios set Content-Type
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type']; // Axios will set it with boundary
    }
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// --- Response Interceptor ---
// Handles responses and standardizes error handling
apiClient.interceptors.response.use(
  (response) => {
    // Any status code that lie within the range of 2xx cause this function to trigger
    // Return the data part of the response
    return response.data;
  },
  (error) => {
    // Any status codes that falls outside the range of 2xx cause this function to trigger
    console.error('API call error:', error.response || error.message);

    let errorMessage = 'An unexpected error occurred.';
    let errorCode = null;
    let errorDetails = null;

    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls outside the range of 2xx
      errorMessage = error.response.data?.message || `Request failed with status ${error.response.status}`;
      errorCode = error.response.data?.code; // Capture custom error codes if sent by backend
      errorDetails = error.response.data; // Capture full error details if needed
      console.error('Error data:', error.response.data);
      console.error('Error status:', error.response.status);
      console.error('Error headers:', error.response.headers);
    } else if (error.request) {
      // The request was made but no response was received
      errorMessage = 'No response received from server. Check network connection or server status.';
      console.error('Error request:', error.request);
    } else {
      // Something happened in setting up the request that triggered an Error
      errorMessage = error.message;
    }

    // You might want to throw a more structured error or handle specific status codes (e.g., 401 Unauthorized)
    // For example, redirect to login on 401
    // if (error.response && error.response.status === 401) {
    //   localStorage.removeItem(AUTH_TOKEN_KEY);
    //   // Redirect logic here (e.g., window.location.href = '/login';)
    //   // Or use React Router's navigate function
    // }

    // Return a rejected Promise with a standardized error object
    return Promise.reject({
       message: errorMessage,
       status: error.response?.status,
       code: errorCode,
       details: errorDetails
    });
  }
);

export default apiClient;
export { AUTH_TOKEN_KEY }; // Export key for use in auth logic