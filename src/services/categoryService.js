// services/categoryService.js
import api from './api';

export const categoryService = {
  async getCategories() {
    try {
      const response = await api.get('/categories');
      return response.data;
    } catch (error) {
      console.error('Error fetching categories:', error);
      throw error;
    }
  },

  async getCategory(id) {
    try {
      const response = await api.get(`/categories/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching category:', error);
      throw error;
    }
  },

  async getCategoryProducts(id) {
    try {
      const response = await api.get(`/categories/${id}/products`);
      return response.data;
    } catch (error) {
      console.error('Error fetching category products:', error);
      throw error;
    }
  },

  async getDefaultNonSellableCategories() {
    try {
      const response = await api.get('/categories/non-sellable/defaults');
      return response.data;
    } catch (error) {
      console.error('Error fetching non-sellable categories:', error);
      throw error;
    }
  },

  async createCategory(categoryData) {
    try {
      const response = await api.post('/categories', categoryData);
      return response.data;
    } catch (error) {
      console.error('Error creating category:', error);
      throw error;
    }
  },

  async updateCategory(id, categoryData) {
    try {
      const response = await api.put(`/categories/${id}`, categoryData);
      return response.data;
    } catch (error) {
      console.error('Error updating category:', error);
      throw error;
    }
  },

  async deleteCategory(id) {
    try {
      const response = await api.delete(`/categories/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting category:', error);
      throw error;
    }
  }
};