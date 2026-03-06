import axios from 'axios';

// Determine the base URL based on environment
const getBaseURL = () => {
    // In production, use the Render backend URL
    if (import.meta.env.PROD) {
        return 'https://cxpinventorybackend.onrender.com/api';
    }
    // In development, use localhost or environment variable
    return import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
};

// Create axios instance with enhanced configuration
const api = axios.create({
    baseURL: getBaseURL(),
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
    timeout: 60000, // 60 second timeout for production
    withCredentials: true, // Important for CORS with credentials
});

// Request interceptor
api.interceptors.request.use(
    (config) => {
        // Get token from localStorage
        const token = localStorage.getItem('token');
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        
        // Add token to headers if exists
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        
        // Add user info to headers if needed
        if (user._id) {
            config.headers['X-User-ID'] = user._id;
        }
        
        // Log requests in development
        if (import.meta.env.DEV) {
            console.log(`🚀 ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`, {
                data: config.data || {},
                params: config.params || {},
                headers: config.headers
            });
        }
        
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor
api.interceptors.response.use(
    (response) => {
        // Log responses in development
        if (import.meta.env.DEV) {
            console.log(`✅ ${response.status} ${response.config.url}`, response.data);
        }
        return response;
    },
    async (error) => {
        const originalRequest = error.config;
        
        // Handle errors
        if (import.meta.env.DEV) {
            if (error.response) {
                console.error('❌ Error Response:', {
                    status: error.response.status,
                    url: originalRequest?.url,
                    data: error.response.data,
                    headers: error.response.headers
                });
            } else if (error.request) {
                console.error('❌ No Response:', {
                    url: originalRequest?.url,
                    message: error.message,
                    code: error.code
                });
            } else {
                console.error('❌ Request Error:', error.message);
            }
        }
        
        // Handle CORS errors specifically
        if (error.message.includes('Network Error') || error.code === 'ERR_NETWORK') {
            console.error('🌐 CORS or Network Error detected!');
            
            // Attempt to check if backend is reachable
            try {
                const healthCheck = await axios.get(`${getBaseURL().replace('/api', '')}/health`, { timeout: 5000 });
                console.log('Backend health check:', healthCheck.data);
            } catch (healthError) {
                console.error('Backend health check failed:', healthError.message);
            }
            
            error.message = 'Cannot connect to server. Please check your internet connection or try again later.';
        }
        
        // Handle unauthorized errors (token expired)
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            
            // Don't redirect if already on login page
            if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/register')) {
                window.location.href = '/login?session=expired';
            }
        }
        
        // Handle server errors
        if (error.response?.status >= 500) {
            console.error('Server error:', error.response.data);
            error.message = 'Server error. Please try again later.';
        }
        
        return Promise.reject(error);
    }
);

// Health check function with multiple attempts
export const checkBackendHealth = async (retries = 3) => {
    const baseURL = getBaseURL().replace('/api', '');
    
    for (let i = 0; i < retries; i++) {
        try {
            const response = await axios.get(`${baseURL}/health`, {
                timeout: 5000,
                headers: {
                    'Accept': 'application/json'
                }
            });
            console.log(`✅ Backend health check successful (attempt ${i + 1})`);
            return response.data;
        } catch (error) {
            console.log(`❌ Backend health check failed (attempt ${i + 1}/${retries}):`, error.message);
            
            if (i < retries - 1) {
                // Wait before retrying
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        }
    }
    
    return null;
};

// Test CORS function
export const testCORS = async () => {
    try {
        const baseURL = getBaseURL().replace('/api', '');
        const response = await axios.get(`${baseURL}/test-cors`, {
            timeout: 5000,
            withCredentials: true
        });
        console.log('CORS test successful:', response.data);
        return response.data;
    } catch (error) {
        console.error('CORS test failed:', error.message);
        return null;
    }
};

// Export configured API instance
export default api;