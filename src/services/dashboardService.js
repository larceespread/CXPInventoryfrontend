// services/dashboardService.js
import api from './api';
import { productService } from './productService';
import { saleService } from './saleService';
import { shipmentService } from './shipmentService';

export const dashboardService = {
  async getStats() {
    try {
      const response = await api.get('/products/stats/dashboard');
      return response.data;
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      return { data: {} };
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

  async getInventoryReport() {
    try {
      const response = await api.get('/products/valuation');
      return response.data;
    } catch (error) {
      console.error('Error fetching inventory report:', error);
      return { data: {} };
    }
  },

  async getNonSellableReport() {
    try {
      const response = await api.get('/products/non-sellable/summary');
      return response.data;
    } catch (error) {
      console.error('Error fetching non-sellable report:', error);
      return { data: {} };
    }
  },

  async getInTransitItems() {
    try {
      const response = await api.get('/products/in-transit');
      return response.data;
    } catch (error) {
      console.error('Error fetching in-transit items:', error);
      return { data: [] };
    }
  },

  async getLowStockItems() {
    try {
      const response = await api.get('/products/low-stock');
      return response.data;
    } catch (error) {
      console.error('Error fetching low stock items:', error);
      return { data: [] };
    }
  },

  async getOutOfStockItems() {
    try {
      const response = await api.get('/products/out-of-stock');
      return response.data;
    } catch (error) {
      console.error('Error fetching out of stock items:', error);
      return { data: [] };
    }
  },

  async getProductsByLocation(location) {
    try {
      const response = await api.get(`/products/storage/${location}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching products for location ${location}:`, error);
      return { data: [] };
    }
  },

  async getUserActivityReport() {
    try {
      const response = await api.get('/users/activity');
      return response.data;
    } catch (error) {
      console.warn('User activity endpoint not implemented yet');
      return { data: [] };
    }
  },

  async getShipmentStats() {
    try {
      const response = await shipmentService.getShipmentStats();
      return response.data;
    } catch (error) {
      console.error('Error fetching shipment stats:', error);
      return { data: {} };
    }
  },

  async getCompleteDashboard() {
    try {
      const [
        stats,
        salesToday,
        lowStock,
        outOfStock,
        inTransit,
        shipmentStats
      ] = await Promise.all([
        this.getStats(),
        saleService.getTodaySales(),
        this.getLowStockItems(),
        this.getOutOfStockItems(),
        this.getInTransitItems(),
        this.getShipmentStats()
      ]);

      return {
        success: true,
        data: {
          stats: stats.data,
          salesToday: salesToday.data,
          alerts: {
            lowStock: lowStock.data,
            outOfStock: outOfStock.data,
            count: (lowStock.data?.length || 0) + (outOfStock.data?.length || 0)
          },
          inTransit: inTransit.data,
          shipments: shipmentStats
        }
      };
    } catch (error) {
      console.error('Error fetching complete dashboard:', error);
      throw error;
    }
  }
};