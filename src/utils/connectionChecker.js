// src/utils/connectionChecker.js
import api from '../api/config';

export const checkAllEndpoints = async () => {
  const endpoints = [
    { name: 'Health', url: '/health', method: 'GET' },
    { name: 'Auth', url: '/auth/test', method: 'GET' },
    { name: 'Products', url: '/products', method: 'GET' },
    { name: 'Categories', url: '/categories', method: 'GET' },
    { name: 'Brands', url: '/brands', method: 'GET' }
  ];

  const results = [];

  for (const endpoint of endpoints) {
    try {
      const start = Date.now();
      const response = await api.get(endpoint.url, { timeout: 5000 });
      const time = Date.now() - start;
      
      results.push({
        name: endpoint.name,
        url: endpoint.url,
        status: '✅ OK',
        time: `${time}ms`,
        data: response.data
      });
    } catch (error) {
      results.push({
        name: endpoint.name,
        url: endpoint.url,
        status: '❌ Failed',
        error: error.message,
        time: 'N/A'
      });
    }
  }

  return results;
};

export const getConnectionInfo = () => {
  return {
    apiUrl: import.meta.env.VITE_API_URL || 'Not set',
    environment: import.meta.env.MODE,
    isProduction: import.meta.env.PROD,
    isDevelopment: import.meta.env.DEV,
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
    online: navigator.onLine
  };
};