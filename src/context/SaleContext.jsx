// context/SaleContext.js
import React, { createContext, useState, useContext, useCallback } from 'react';
import { saleService } from '../services/saleService';
import toast from 'react-hot-toast';

const SaleContext = createContext();

export const useSales = () => {
  const context = useContext(SaleContext);
  if (!context) {
    throw new Error('useSales must be used within a SaleProvider');
  }
  return context;
};

export const SaleProvider = ({ children }) => {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [totalCount, setTotalCount] = useState(0);

  const fetchSales = useCallback(async (params = {}) => {
    setLoading(true);
    setError(null);
    try {
      const response = await saleService.getSales(params);
      setSales(response.data || []);
      setTotalCount(response.count || response.data?.length || 0);
      return response;
    } catch (error) {
      setError(error.message);
      toast.error('Failed to fetch sales');
      return { data: [] };
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchSaleById = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    try {
      const response = await saleService.getSale(id);
      return response.data || response;
    } catch (error) {
      setError(error.message);
      toast.error('Failed to fetch sale');
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const createSale = useCallback(async (saleData) => {
    setLoading(true);
    try {
      const response = await saleService.createSale(saleData);
      await fetchSales();
      toast.success('Sale created successfully');
      return response;
    } catch (error) {
      toast.error(error.message || 'Failed to create sale');
      throw error;
    } finally {
      setLoading(false);
    }
  }, [fetchSales]);

  const updateSale = useCallback(async (id, saleData) => {
    setLoading(true);
    try {
      const response = await saleService.updateSale(id, saleData);
      await fetchSales();
      toast.success('Sale updated successfully');
      return response;
    } catch (error) {
      toast.error(error.message || 'Failed to update sale');
      throw error;
    } finally {
      setLoading(false);
    }
  }, [fetchSales]);

  const deleteSale = useCallback(async (id) => {
    setLoading(true);
    try {
      const response = await saleService.deleteSale(id);
      await fetchSales();
      toast.success('Sale deleted successfully');
      return response;
    } catch (error) {
      toast.error(error.message || 'Failed to delete sale');
      throw error;
    } finally {
      setLoading(false);
    }
  }, [fetchSales]);

  const value = {
    sales,
    loading,
    error,
    totalCount,
    fetchSales,
    fetchSaleById,
    createSale,
    updateSale,
    deleteSale
  };

  return (
    <SaleContext.Provider value={value}>
      {children}
    </SaleContext.Provider>
  );
};