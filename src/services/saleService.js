// services/saleService.js
import api from './api';

export const saleService = {
  async getTodaySales() {
    try {
      const response = await api.get('/sales/today');
      return response.data;
    } catch (error) {
      console.error('Error fetching today\'s sales:', error);
      return { data: [] };
    }
  },

  async getSalesReport(params = {}) {
    try {
      const response = await api.get('/sales/report', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching sales report:', error);
      return { data: [] };
    }
  },

  async createSale(saleData) {
    try {
      const response = await api.post('/sales', saleData);
      return response.data;
    } catch (error) {
      console.error('Error creating sale:', error);
      throw error;
    }
  },

  async getSale(id) {
    try {
      const response = await api.get(`/sales/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching sale:', error);
      throw error;
    }
  },

  async updateSale(id, saleData) {
    try {
      const response = await api.put(`/sales/${id}`, saleData);
      return response.data;
    } catch (error) {
      console.error('Error updating sale:', error);
      throw error;
    }
  },

  async deleteSale(id) {
    try {
      const response = await api.delete(`/sales/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting sale:', error);
      throw error;
    }
  }
};