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
      // Check if it's a 403 Forbidden error
      if (error.response && error.response.status === 403) {
        console.warn('⚠️ Non-sellable report access forbidden - user may not have permission');
        // Return empty data structure that matches what the dashboard expects
        return { 
          data: { 
            totalItems: 0, 
            totalValue: 0,
            items: [],
            message: 'You do not have permission to view non-sellable items'
          } 
        };
      }
      console.error('Error fetching non-sellable report:', error);
      return { data: { totalItems: 0, totalValue: 0, items: [] } };
    }
  },

  async getInTransitItems() {
    try {
      const response = await api.get('/products/in-transit');
      return response.data;
    } catch (error) {
      if (error.response && error.response.status === 403) {
        console.warn('⚠️ In-transit items access forbidden');
        return { data: [] };
      }
      console.error('Error fetching in-transit items:', error);
      return { data: [] };
    }
  },

  async getLowStockItems() {
    try {
      const response = await api.get('/products/low-stock');
      return response.data;
    } catch (error) {
      if (error.response && error.response.status === 403) {
        console.warn('⚠️ Low stock items access forbidden');
        return { data: [] };
      }
      console.error('Error fetching low stock items:', error);
      return { data: [] };
    }
  },

  async getOutOfStockItems() {
    try {
      const response = await api.get('/products/out-of-stock');
      return response.data;
    } catch (error) {
      if (error.response && error.response.status === 403) {
        console.warn('⚠️ Out of stock items access forbidden');
        return { data: [] };
      }
      console.error('Error fetching out of stock items:', error);
      return { data: [] };
    }
  },

  async getProductsByLocation(location) {
    try {
      const response = await api.get(`/products/storage/${location}`);
      return response.data;
    } catch (error) {
      if (error.response && error.response.status === 403) {
        console.warn(`⚠️ Access forbidden for location ${location}`);
        return { data: [] };
      }
      console.error(`Error fetching products for location ${location}:`, error);
      return { data: [] };
    }
  },

  async getUserActivityReport() {
    try {
      const response = await api.get('/users/activity');
      return response.data;
    } catch (error) {
      if (error.response && error.response.status === 403) {
        console.warn('⚠️ User activity access forbidden');
        return { data: [] };
      }
      if (error.response && error.response.status === 404) {
        console.warn('User activity endpoint not implemented yet');
        return { data: [] };
      }
      console.error('Error fetching user activity:', error);
      return { data: [] };
    }
  },

  async getShipmentStats() {
    try {
      const response = await shipmentService.getShipmentStats();
      return response.data;
    } catch (error) {
      if (error.response && error.response.status === 403) {
        console.warn('⚠️ Shipment stats access forbidden');
        return { data: {} };
      }
      console.error('Error fetching shipment stats:', error);
      return { data: {} };
    }
  },

  async getCompleteDashboard() {
    try {
      // Use Promise.allSettled to handle individual failures
      const results = await Promise.allSettled([
        this.getStats(),
        saleService.getTodaySales(),
        this.getLowStockItems(),
        this.getOutOfStockItems(),
        this.getInTransitItems(),
        this.getShipmentStats(),
        this.getNonSellableReport() // Keep this but handle 403 gracefully
      ]);

      // Extract values from settled promises
      const [
        statsResult,
        salesTodayResult,
        lowStockResult,
        outOfStockResult,
        inTransitResult,
        shipmentStatsResult,
        nonSellableResult
      ] = results;

      // Log which requests failed (for debugging)
      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          const endpoint = [
            'stats', 'salesToday', 'lowStock', 'outOfStock', 
            'inTransit', 'shipmentStats', 'nonSellable'
          ][index];
          console.warn(`⚠️ Dashboard data fetch failed for ${endpoint}:`, result.reason?.message);
        }
      });

      return {
        success: true,
        data: {
          stats: statsResult.status === 'fulfilled' ? statsResult.value.data || {} : {},
          salesToday: salesTodayResult.status === 'fulfilled' ? salesTodayResult.value.data || [] : [],
          alerts: {
            lowStock: lowStockResult.status === 'fulfilled' ? lowStockResult.value.data || [] : [],
            outOfStock: outOfStockResult.status === 'fulfilled' ? outOfStockResult.value.data || [] : [],
            nonSellable: nonSellableResult.status === 'fulfilled' ? nonSellableResult.value.data || { totalItems: 0 } : { totalItems: 0 },
            count: (lowStockResult.status === 'fulfilled' ? (lowStockResult.value.data?.length || 0) : 0) + 
                   (outOfStockResult.status === 'fulfilled' ? (outOfStockResult.value.data?.length || 0) : 0)
          },
          inTransit: inTransitResult.status === 'fulfilled' ? inTransitResult.value.data || [] : [],
          shipments: shipmentStatsResult.status === 'fulfilled' ? shipmentStatsResult.value : {}
        }
      };
    } catch (error) {
      console.error('Error fetching complete dashboard:', error);
      return {
        success: false,
        data: {
          stats: {},
          salesToday: [],
          alerts: { lowStock: [], outOfStock: [], nonSellable: { totalItems: 0 }, count: 0 },
          inTransit: [],
          shipments: {}
        }
      };
    }
  }
};