import axios from 'axios';

// Get the API URL from environment variables
const API_URL = import.meta.env.VITE_API_URL || 'https://cxpinventorybackend.onrender.com/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 second timeout for production
  withCredentials: true, // Important for CORS with credentials
});

// Request interceptor to add token and log requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Log requests in development
    if (import.meta.env.DEV) {
      console.log(`🚀 ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`, config.data || '');
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling and logging
api.interceptors.response.use(
  (response) => {
    // Log responses in development
    if (import.meta.env.DEV) {
      console.log(`✅ ${response.status} ${response.config.url}`, response.data);
    }
    return response;
  },
  (error) => {
    // Handle errors
    if (import.meta.env.DEV) {
      if (error.response) {
        console.error('❌ Error Response:', {
          status: error.response.status,
          url: error.config?.url,
          data: error.response.data,
          headers: error.response.headers
        });
      } else if (error.request) {
        console.error('❌ No Response:', error.request);
      } else {
        console.error('❌ Request Error:', error.message);
      }
    }
    
    // Handle unauthorized errors (token expired)
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Redirect to login if not already there
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    
    // Handle network errors
    if (!error.response) {
      console.error('Network error - please check if backend is running:', error);
      error.message = 'Network error. Please check your connection or try again later.';
    }
    
    return Promise.reject(error);
  }
);

// Health check function
export const checkBackendHealth = async () => {
  try {
    const response = await api.get('/health');
    return response.data;
  } catch (error) {
    console.error('Backend health check failed:', error);
    return null;
  }
};

export default api;