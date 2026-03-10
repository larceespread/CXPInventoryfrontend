// services/approvalService.js
import axios from 'axios';

// Hardcoded API URL as fallback
const API_URL = 'http://localhost:5000/api';

class ApprovalService {
  constructor() {
    this.baseURL = this.getBaseURL();
    this.api = axios.create({
      baseURL: this.baseURL
    });

    // Add request interceptor to include auth token
    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        config.headers['Content-Type'] = 'application/json';
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Add response interceptor for error handling
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Handle unauthorized access
          console.error('Unauthorized access - redirecting to login');
          // You could trigger a logout here or redirect to login
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  getBaseURL() {
    // Check for environment variable first (for development)
    if (typeof process !== 'undefined' && process.env && process.env.REACT_APP_API_URL) {
      return process.env.REACT_APP_API_URL;
    }
    
    // Check for runtime config (if you have such a setup)
    if (typeof window !== 'undefined' && window.__RUNTIME_CONFIG__ && window.__RUNTIME_CONFIG__.API_URL) {
      return window.__RUNTIME_CONFIG__.API_URL;
    }
    
    // Default fallback
    return 'http://localhost:5000/api';
  }

  async getPendingApprovals() {
    try {
      const response = await this.api.get('/approvals/pending');
      return response.data;
    } catch (error) {
      console.error('Error fetching pending approvals:', error);
      throw error;
    }
  }

  async createApprovalRequest(data) {
    try {
      const response = await this.api.post('/approvals', data);
      return response.data;
    } catch (error) {
      console.error('Error creating approval request:', error);
      throw error;
    }
  }

  async approveRequest(approvalId, data) {
    try {
      const response = await this.api.put(`/approvals/${approvalId}/approve`, data);
      return response.data;
    } catch (error) {
      console.error('Error approving request:', error);
      throw error;
    }
  }

  async rejectRequest(approvalId, reason) {
    try {
      const response = await this.api.put(`/approvals/${approvalId}/reject`, { reason });
      return response.data;
    } catch (error) {
      console.error('Error rejecting request:', error);
      throw error;
    }
  }

  async getMyApprovalRequests() {
    try {
      const response = await this.api.get('/approvals/my-requests');
      return response.data;
    } catch (error) {
      console.error('Error fetching my approval requests:', error);
      throw error;
    }
  }

  async getApprovalById(id) {
    try {
      const response = await this.api.get(`/approvals/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching approval by ID:', error);
      throw error;
    }
  }
}

export const approvalService = new ApprovalService();