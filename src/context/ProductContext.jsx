// context/ProductContext.js
import React, { createContext, useState, useContext, useCallback } from 'react';
import { productService } from '../services/productService';
import toast from 'react-hot-toast';

const ProductContext = createContext();

export const useProducts = () => {
  const context = useContext(ProductContext);
  if (!context) {
    throw new Error('useProducts must be used within a ProductProvider');
  }
  return context;
};

export const ProductProvider = ({ children }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [totalCount, setTotalCount] = useState(0);
  const [filters, setFilters] = useState({});

  const fetchProducts = useCallback(async (params = {}) => {
    setLoading(true);
    setError(null);
    try {
      const response = await productService.getProducts({ ...filters, ...params });
      setProducts(response.data || []);
      setTotalCount(response.count || response.data?.length || 0);
      return response;
    } catch (error) {
      setError(error.message);
      toast.error('Failed to fetch products');
      return { data: [] };
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const fetchProductById = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    try {
      const response = await productService.getProduct(id);
      return response.data || response;
    } catch (error) {
      setError(error.message);
      toast.error('Failed to fetch product');
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const createProduct = useCallback(async (productData) => {
    setLoading(true);
    try {
      const response = await productService.createProduct(productData);
      await fetchProducts();
      toast.success('Product created successfully');
      return response;
    } catch (error) {
      toast.error(error.message || 'Failed to create product');
      throw error;
    } finally {
      setLoading(false);
    }
  }, [fetchProducts]);

  const updateProduct = useCallback(async (id, productData) => {
    setLoading(true);
    try {
      const response = await productService.updateProduct(id, productData);
      await fetchProducts();
      toast.success('Product updated successfully');
      return response;
    } catch (error) {
      toast.error(error.message || 'Failed to update product');
      throw error;
    } finally {
      setLoading(false);
    }
  }, [fetchProducts]);

  const deleteProduct = useCallback(async (id) => {
    setLoading(true);
    try {
      const response = await productService.deleteProduct(id);
      await fetchProducts();
      toast.success('Product deleted successfully');
      return response;
    } catch (error) {
      toast.error(error.message || 'Failed to delete product');
      throw error;
    } finally {
      setLoading(false);
    }
  }, [fetchProducts]);

  const restockProduct = useCallback(async (id, quantity, notes = '') => {
    setLoading(true);
    try {
      const response = await productService.restockProduct(id, quantity, notes);
      await fetchProducts();
      toast.success('Product restocked successfully');
      return response;
    } catch (error) {
      toast.error(error.message || 'Failed to restock product');
      throw error;
    } finally {
      setLoading(false);
    }
  }, [fetchProducts]);

  const updateFilters = useCallback((newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({});
  }, []);

  const value = {
    products,
    loading,
    error,
    totalCount,
    filters,
    fetchProducts,
    fetchProductById,
    createProduct,
    updateProduct,
    deleteProduct,
    restockProduct,
    updateFilters,
    clearFilters
  };

  return (
    <ProductContext.Provider value={value}>
      {children}
    </ProductContext.Provider>
  );
};