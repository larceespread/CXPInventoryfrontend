// services/brandService.js
import api from './api';

export const brandService = {
  async getBrands() {
    try {
      const response = await api.get('/brands');
      return response.data;
    } catch (error) {
      console.error('Error fetching brands:', error);
      throw error;
    }
  },

  async getBrand(id) {
    try {
      const response = await api.get(`/brands/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching brand:', error);
      throw error;
    }
  },

  async getBrandProducts(id) {
    try {
      const response = await api.get(`/brands/${id}/products`);
      return response.data;
    } catch (error) {
      console.error('Error fetching brand products:', error);
      throw error;
    }
  },

  async createBrand(brandData) {
    try {
      const response = await api.post('/brands', brandData);
      return response.data;
    } catch (error) {
      console.error('Error creating brand:', error);
      throw error;
    }
  },

  async updateBrand(id, brandData) {
    try {
      const response = await api.put(`/brands/${id}`, brandData);
      return response.data;
    } catch (error) {
      console.error('Error updating brand:', error);
      throw error;
    }
  },

  async deleteBrand(id) {
    try {
      const response = await api.delete(`/brands/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting brand:', error);
      throw error;
    }
  }
};