// services/productService.js - COMPLETE FIXED VERSION

import api from './api';

// Helper to extract data from response
const extractData = (response) => {
    // If response has data property, return it
    if (response && response.data) {
        return response.data;
    }
    // Otherwise return response itself
    return response;
};

// Helper to extract products array from response
const extractProductsArray = (response) => {
    if (!response) return [];
    
    // If response is already an array
    if (Array.isArray(response)) return response;
    
    // If response has data property that is an array
    if (response.data && Array.isArray(response.data)) {
        return response.data;
    }
    
    // If response has products property that is an array
    if (response.products && Array.isArray(response.products)) {
        return response.products;
    }
    
    // If response is an object with success flag and data property
    if (response.success && response.data) {
        if (Array.isArray(response.data)) return response.data;
        if (response.data.data && Array.isArray(response.data.data)) {
            return response.data.data;
        }
    }
    
    return [];
};

export const productService = {
    // Get all products with pagination and filters
    async getProducts(params = {}) {
        try {
            console.log('📦 Fetching products with params:', params);
            const response = await api.get('/products', { params });
            console.log('📦 API Response:', response);
            console.log('📦 Response data:', response.data);
            
            // Handle different response structures
            let result = {
                success: true,
                data: [],
                count: 0,
                total: 0,
                pagination: {}
            };
            
            if (response.data) {
                if (response.data.success && response.data.data) {
                    // Standard API response { success: true, data: [...] }
                    result.data = response.data.data || [];
                    result.count = response.data.count || result.data.length;
                    result.total = response.data.total || result.data.length;
                    result.pagination = response.data.pagination || {};
                } else if (Array.isArray(response.data)) {
                    // Direct array response
                    result.data = response.data;
                    result.count = response.data.length;
                    result.total = response.data.length;
                } else if (response.data.data && Array.isArray(response.data.data)) {
                    // Nested data property
                    result.data = response.data.data;
                    result.count = response.data.count || result.data.length;
                    result.total = response.data.total || result.data.length;
                    result.pagination = response.data.pagination || {};
                } else {
                    // Single object or other format
                    result.data = response.data;
                    result.count = 1;
                    result.total = 1;
                }
            }
            
            console.log('📦 Processed products:', result.data.length);
            return result;
        } catch (error) {
            console.error('❌ Error fetching products:', error);
            throw error;
        }
    },

    // Get single product by ID
    async getProduct(id) {
        try {
            console.log('📦 Fetching product by ID:', id);
            const response = await api.get(`/products/${id}`);
            console.log('📦 Product API Response:', response);
            
            // Extract the actual product data from the response
            let productData = null;
            
            if (response.data) {
                if (response.data.success && response.data.data) {
                    // Standard API response { success: true, data: product }
                    productData = response.data.data;
                } else if (response.data._id || response.data.id) {
                    // Direct product object
                    productData = response.data;
                } else if (response.data.data && (response.data.data._id || response.data.data.id)) {
                    // Nested data property
                    productData = response.data.data;
                }
            }
            
            console.log('📦 Extracted product:', productData);
            
            if (!productData) {
                throw new Error('Could not extract product data from response');
            }
            
            return productData;
        } catch (error) {
            console.error('❌ Error fetching product:', error);
            throw error;
        }
    },

    // Get products by location
    async getProductsByLocation(location) {
        try {
            const response = await api.get(`/products/storage/${location}`);
            const data = extractData(response);
            return extractProductsArray(data);
        } catch (error) {
            console.error(`Error fetching products for location ${location}:`, error);
            return [];
        }
    },

    async getDashboardStats() {
        try {
            const response = await api.get('/products/stats/dashboard');
            const data = extractData(response);
            return data || {};
        } catch (error) {
            console.error('Error fetching dashboard stats:', error);
            return {};
        }
    },

    async getInTransitItems() {
        try {
            const response = await api.get('/products/in-transit');
            const data = extractData(response);
            return extractProductsArray(data);
        } catch (error) {
            console.error('Error fetching in-transit items:', error);
            return [];
        }
    },

    async getNonSellableSummary() {
        try {
            const response = await api.get('/products/non-sellable/summary');
            const data = extractData(response);
            return data || {};
        } catch (error) {
            console.error('Error fetching non-sellable summary:', error);
            return {};
        }
    },

    async getProductsByStorage(location) {
        try {
            const response = await api.get(`/products/storage/${location}`);
            const data = extractData(response);
            return {
                data: extractProductsArray(data),
                totals: data?.totals || {},
                grouped: data?.grouped || {}
            };
        } catch (error) {
            console.error(`Error fetching products for location ${location}:`, error);
            return { data: [], totals: {}, grouped: {} };
        }
    },

    async getLocationSummary(location) {
        try {
            const response = await api.get(`/products/location/${location}/summary`);
            const data = extractData(response);
            return data || {};
        } catch (error) {
            console.error(`Error fetching location summary for ${location}:`, error);
            return {};
        }
    },

    async getLowStockProducts() {
        try {
            const response = await api.get('/products/low-stock');
            const data = extractData(response);
            return extractProductsArray(data);
        } catch (error) {
            console.error('Error fetching low stock products:', error);
            return [];
        }
    },

    async getOutOfStockProducts() {
        try {
            const response = await api.get('/products/out-of-stock');
            const data = extractData(response);
            return extractProductsArray(data);
        } catch (error) {
            console.error('Error fetching out of stock products:', error);
            return [];
        }
    },

    async searchByBarcode(barcode) {
        try {
            const response = await api.get(`/products/search/barcode/${barcode}`);
            return extractData(response);
        } catch (error) {
            console.error('Error searching by barcode:', error);
            throw error;
        }
    },

    async getProductsBySource(source) {
        try {
            const response = await api.get(`/products/source/${source}`);
            const data = extractData(response);
            return extractProductsArray(data);
        } catch (error) {
            console.error(`Error fetching products by source ${source}:`, error);
            return [];
        }
    },

    // Search products with optional location filter
    async searchProducts(query, location = '') {
        try {
            const params = { search: query };
            if (location) params.location = location;
            
            const response = await api.get('/products', { params });
            const data = extractData(response);
            return extractProductsArray(data);
        } catch (error) {
            console.error('Error searching products:', error);
            return [];
        }
    },

    // Get product by barcode
    async getProductByBarcode(barcode) {
        try {
            const response = await api.get(`/products/barcode/${barcode}`);
            return extractData(response);
        } catch (error) {
            console.error('Error fetching product by barcode:', error);
            throw error;
        }
    },

    // ===== CREATE PRODUCT WITH STORAGE LOCATIONS =====
    async createProduct(productData) {
        try {
            console.log('🚀 CREATE PRODUCT - RAW DATA:', JSON.stringify(productData, null, 2));
            
            // Create a clean copy
            const dataToSend = { ...productData };
            
            // Remove any ID fields (shouldn't be in create)
            delete dataToSend.id;
            delete dataToSend._id;
            delete dataToSend.__v;
            
            // ENSURE BRAND IS STRING ID
            if (dataToSend.brand) {
                if (typeof dataToSend.brand === 'object') {
                    dataToSend.brand = dataToSend.brand._id || dataToSend.brand.id || '';
                    console.log('🔧 Converted brand object to ID:', dataToSend.brand);
                } else {
                    dataToSend.brand = String(dataToSend.brand);
                }
            } else {
                throw new Error('Brand is required');
            }
            
            // ENSURE CATEGORY IS STRING ID
            if (dataToSend.category) {
                if (typeof dataToSend.category === 'object') {
                    dataToSend.category = dataToSend.category._id || dataToSend.category.id || '';
                    console.log('🔧 Converted category object to ID:', dataToSend.category);
                } else {
                    dataToSend.category = String(dataToSend.category);
                }
            } else {
                throw new Error('Category is required');
            }
            
            // ===== HANDLE STORAGE LOCATIONS =====
            if (!dataToSend.storageLocations) {
                // If no storage locations provided, create default with zero quantity
                dataToSend.storageLocations = [
                    { location: 'BALAGTAS', quantity: 0, reorderLevel: dataToSend.reorderLevel || 10 },
                    { location: 'MARILAO', quantity: 0, reorderLevel: dataToSend.reorderLevel || 10 }
                ];
            } else {
                // Ensure each location has valid data
                dataToSend.storageLocations = dataToSend.storageLocations.map(loc => ({
                    location: loc.location,
                    quantity: Number(loc.quantity) || 0,
                    reorderLevel: Number(loc.reorderLevel) || dataToSend.reorderLevel || 10,
                    lastRestocked: new Date().toISOString()
                }));
            }
            
            // Calculate total quantity
            dataToSend.quantity = dataToSend.storageLocations.reduce((sum, loc) => sum + loc.quantity, 0);
            
            // ===== ENSURE SOURCE IS VALID =====
            const validSources = ['Office Inventory', 'Direct supplier', 'Local Supplier', 'Other'];
            
            if (!dataToSend.source) {
                dataToSend.source = 'Office Inventory';
                console.log('📦 Added default source:', dataToSend.source);
            } else if (!validSources.includes(dataToSend.source)) {
                console.warn('⚠️ Invalid source:', dataToSend.source, 'defaulting to Office Inventory');
                dataToSend.source = 'Office Inventory';
            }
            
            // Convert numbers
            if (dataToSend.costPrice !== undefined) {
                dataToSend.costPrice = Number(dataToSend.costPrice) || 0;
            }
            if (dataToSend.sellingPrice !== undefined) {
                dataToSend.sellingPrice = Number(dataToSend.sellingPrice) || 0;
            }
            if (dataToSend.reorderLevel !== undefined) {
                dataToSend.reorderLevel = Number(dataToSend.reorderLevel) || 10;
            }
            
            // Remove empty strings/undefined
            Object.keys(dataToSend).forEach(key => {
                if (key !== 'source' && (dataToSend[key] === undefined || dataToSend[key] === null || dataToSend[key] === '')) {
                    delete dataToSend[key];
                }
            });
            
            console.log('📦 FINAL DATA TO SEND:', JSON.stringify(dataToSend, null, 2));
            
            const response = await api.post('/products', dataToSend);
            console.log('✅ BACKEND RESPONSE:', response.data);
            
            return extractData(response);
        } catch (error) {
            console.error('❌ CREATE PRODUCT ERROR:', error);
            
            if (error.response) {
                console.error('🔥 BACKEND ERROR DATA:', error.response.data);
                console.error('🔥 STATUS:', error.response.status);
                
                const errorMessage = error.response.data?.message || 
                                    error.response.data?.error || 
                                    `Server error: ${error.response.status}`;
                throw new Error(errorMessage);
            } else if (error.request) {
                throw new Error('No response from server. Check connection.');
            } else {
                throw error;
            }
        }
    },

    // ===== UPDATE PRODUCT WITH STORAGE LOCATIONS =====
    async updateProduct(id, productData) {
        try {
            console.log('🔄 UPDATE PRODUCT - ID:', id);
            console.log('📦 RAW DATA:', JSON.stringify(productData, null, 2));
            
            // Create clean copy without ID fields
            const dataToSend = { ...productData };
            delete dataToSend.id;
            delete dataToSend._id;
            delete dataToSend.__v;
            
            // ENSURE BRAND IS STRING ID
            if (dataToSend.brand) {
                if (typeof dataToSend.brand === 'object') {
                    dataToSend.brand = dataToSend.brand._id || dataToSend.brand.id || '';
                } else {
                    dataToSend.brand = String(dataToSend.brand);
                }
            }
            
            // ENSURE CATEGORY IS STRING ID
            if (dataToSend.category) {
                if (typeof dataToSend.category === 'object') {
                    dataToSend.category = dataToSend.category._id || dataToSend.category.id || '';
                } else {
                    dataToSend.category = String(dataToSend.category);
                }
            }
            
            // ===== HANDLE STORAGE LOCATIONS =====
            if (dataToSend.storageLocations) {
                // Ensure each location has valid data
                dataToSend.storageLocations = dataToSend.storageLocations.map(loc => ({
                    location: loc.location,
                    quantity: Number(loc.quantity) || 0,
                    reorderLevel: Number(loc.reorderLevel) || dataToSend.reorderLevel || 10,
                    lastRestocked: loc.lastRestocked || new Date().toISOString()
                }));
                
                // Calculate total quantity
                dataToSend.quantity = dataToSend.storageLocations.reduce((sum, loc) => sum + loc.quantity, 0);
            }
            
            // ===== ENSURE SOURCE IS VALID =====
            const validSources = ['Office Inventory', 'Direct supplier', 'Local Supplier', 'Other'];
            
            if (dataToSend.source && !validSources.includes(dataToSend.source)) {
                console.warn('⚠️ Invalid source in update:', dataToSend.source);
                delete dataToSend.source; // Let backend use existing value
            }
            
            // Convert numbers
            if (dataToSend.costPrice !== undefined) {
                dataToSend.costPrice = Number(dataToSend.costPrice) || 0;
            }
            if (dataToSend.sellingPrice !== undefined) {
                dataToSend.sellingPrice = Number(dataToSend.sellingPrice) || 0;
            }
            if (dataToSend.reorderLevel !== undefined) {
                dataToSend.reorderLevel = Number(dataToSend.reorderLevel) || 10;
            }
            
            console.log('📦 FINAL UPDATE DATA:', JSON.stringify(dataToSend, null, 2));
            
            const response = await api.put(`/products/${id}`, dataToSend);
            console.log('✅ UPDATE SUCCESS:', response.data);
            
            return extractData(response);
        } catch (error) {
            console.error('❌ UPDATE ERROR:', error);
            if (error.response) {
                const errorMessage = error.response.data?.message || 
                                    error.response.data?.error || 
                                    'Update failed';
                throw new Error(errorMessage);
            }
            throw error;
        }
    },

    async deleteProduct(id) {
        try {
            const response = await api.delete(`/products/${id}`);
            return extractData(response);
        } catch (error) {
            console.error('Error deleting product:', error);
            throw error;
        }
    },

    // ===== RESTOCK WITH LOCATION (FOR INCOMING SHIPMENTS) =====
    async restockProduct(id, quantity, notes = '', source = null, location = 'BALAGTAS') {
        try {
            const payload = { 
                quantity: Number(quantity), 
                notes, 
                location 
            };
            if (source) payload.source = source;
            
            const response = await api.put(`/products/${id}/restock`, payload);
            return extractData(response);
        } catch (error) {
            console.error('Error restocking product:', error);
            throw error;
        }
    },

    // ===== DEDUCT STOCK (FOR OUTGOING SHIPMENTS) =====
    async deductStock(id, quantity, location, notes = '') {
        try {
            const payload = { 
                quantity: Number(quantity), 
                location, 
                notes 
            };
            
            // Use restock with negative quantity since there's no direct deduct endpoint
            // This uses the existing restock endpoint with negative quantity
            const response = await api.put(`/products/${id}/restock`, {
                quantity: -Number(quantity),
                location,
                notes: notes || 'Stock deduction'
            });
            
            return extractData(response);
        } catch (error) {
            console.error('Error deducting stock:', error);
            throw error;
        }
    },

    // ===== TRANSFER BETWEEN LOCATIONS =====
    async transferStock(id, quantity, fromLocation, toLocation, notes = '') {
        try {
            const payload = {
                quantity: Number(quantity),
                fromLocation,
                toLocation,
                notes
            };
            
            const response = await api.put(`/products/${id}/transfer`, payload);
            return extractData(response);
        } catch (error) {
            console.error('Error transferring stock:', error);
            throw error;
        }
    },

    // ===== CHECK STOCK AVAILABILITY =====
    async checkAvailability(id, quantity, location) {
        try {
            const product = await this.getProduct(id);
            
            if (!product) {
                return {
                    available: false,
                    currentStock: 0,
                    requested: quantity,
                    location,
                    productName: 'Unknown',
                    sku: 'N/A'
                };
            }
            
            const locationStock = product.storageLocations?.find(
                loc => loc.location === location
            );
            
            const productName = product.name || 
                               product.productName || 
                               product.title || 
                               `Product (${product._id?.slice(-6)})`;
            
            return {
                available: locationStock?.quantity >= quantity,
                currentStock: locationStock?.quantity || 0,
                requested: quantity,
                location,
                productName,
                sku: product.sku || 'N/A'
            };
        } catch (error) {
            console.error('Error checking availability:', error);
            return { 
                available: false, 
                error: error.message,
                currentStock: 0,
                requested: quantity,
                location
            };
        }
    },

    // ===== GET PRODUCT STOCK BY LOCATION =====
    async getProductStock(id) {
        try {
            const product = await this.getProduct(id);
            const stockByLocation = {};
            
            product.storageLocations?.forEach(loc => {
                stockByLocation[loc.location] = {
                    quantity: loc.quantity,
                    reorderLevel: loc.reorderLevel,
                    lastRestocked: loc.lastRestocked,
                    status: loc.status
                };
            });
            
            return stockByLocation;
        } catch (error) {
            console.error('Error fetching product stock:', error);
            return {};
        }
    },

    // ===== BULK CHECK AVAILABILITY =====
    async bulkCheckAvailability(items) {
        try {
            const results = await Promise.all(
                items.map(async (item, index) => {
                    const check = await this.checkAvailability(
                        item.productId || item.product,
                        item.quantity,
                        item.location
                    );
                    return {
                        ...check,
                        itemIndex: index,
                        productId: item.productId || item.product
                    };
                })
            );
            
            return {
                allAvailable: results.every(r => r.available),
                results
            };
        } catch (error) {
            console.error('Error in bulk availability check:', error);
            return { allAvailable: false, results: [] };
        }
    },

    async bulkUpdateProducts(updates) {
        try {
            const response = await api.put('/products/bulk/update', { products: updates });
            return extractData(response);
        } catch (error) {
            console.error('Error bulk updating products:', error);
            throw error;
        }
    },

    async getInventoryValuation() {
        try {
            const response = await api.get('/products/valuation');
            const data = extractData(response);
            return data || {};
        } catch (error) {
            console.error('Error fetching inventory valuation:', error);
            return {};
        }
    },

    async initNonSellableCategories() {
        try {
            const response = await api.post('/products/init-non-sellable');
            return extractData(response);
        } catch (error) {
            console.error('Error initializing non-sellable categories:', error);
            throw error;
        }
    },

    async getAllStorageLocations() {
        try {
            const [balagtas, marilao] = await Promise.all([
                this.getProductsByStorage('BALAGTAS'),
                this.getProductsByStorage('MARILAO')
            ]);
            
            return {
                success: true,
                data: {
                    BALAGTAS: balagtas.data || [],
                    MARILAO: marilao.data || []
                }
            };
        } catch (error) {
            console.error('Error fetching all storage locations:', error);
            throw error;
        }
    },

    async getInventoryOverview() {
        try {
            const [
                stats,
                lowStock,
                outOfStock,
                valuation,
                nonSellable,
                balagtas,
                marilao
            ] = await Promise.all([
                this.getDashboardStats(),
                this.getLowStockProducts(),
                this.getOutOfStockProducts(),
                this.getInventoryValuation(),
                this.getNonSellableSummary(),
                this.getLocationSummary('BALAGTAS'),
                this.getLocationSummary('MARILAO')
            ]);

            return {
                success: true,
                data: {
                    stats: stats || {},
                    alerts: {
                        lowStock: lowStock || [],
                        outOfStock: outOfStock || [],
                        count: ((lowStock?.length || 0) + (outOfStock?.length || 0))
                    },
                    valuation: valuation || {},
                    nonSellable: nonSellable || {},
                    locations: {
                        balagtas: balagtas || {},
                        marilao: marilao || {}
                    }
                }
            };
        } catch (error) {
            console.error('Error fetching inventory overview:', error);
            throw error;
        }
    },

    async getProductsByCategory(categoryId, params = {}) {
        try {
            const response = await api.get('/products', { 
                params: { ...params, category: categoryId } 
            });
            const data = extractData(response);
            return extractProductsArray(data);
        } catch (error) {
            console.error('Error fetching products by category:', error);
            throw error;
        }
    },

    async getProductsByBrand(brandId, params = {}) {
        try {
            const response = await api.get('/products', { 
                params: { ...params, brand: brandId } 
            });
            const data = extractData(response);
            return extractProductsArray(data);
        } catch (error) {
            console.error('Error fetching products by brand:', error);
            throw error;
        }
    },

    async getProductsByType(itemType, params = {}) {
        try {
            const response = await api.get('/products', { 
                params: { ...params, itemType } 
            });
            const data = extractData(response);
            return extractProductsArray(data);
        } catch (error) {
            console.error('Error fetching products by type:', error);
            throw error;
        }
    },

    getSourceOptions() {
        return [
            { value: 'Office Inventory', label: 'Office Inventory' },
            { value: 'Direct supplier', label: 'Direct Supplier' },
            { value: 'Local Supplier', label: 'Local Supplier' },
            { value: 'Other', label: 'Other' }
        ];
    },

    getLocationOptions() {
        return [
            { value: 'BALAGTAS', label: 'Balagtas Warehouse' },
            { value: 'MARILAO', label: 'Marilao Warehouse' }
        ];
    },

    // ===== GET SHIPMENT TYPE OPTIONS =====
    getShipmentTypeOptions() {
        return [
            { value: 'OUTGOING', label: 'Outgoing (Ship Out)' },
            { value: 'INCOMING', label: 'Incoming (Stock In)' },
            { value: 'TRANSFER', label: 'Location Transfer' }
        ];
    },

    // ===== FORMAT PRODUCT FOR SELECT DROPDOWN =====
    formatProductForSelect(product) {
        return {
            ...product,
            label: `${product.name} (${product.sku || 'No SKU'}) - ₱${product.sellingPrice || product.costPrice || 0}`,
            value: product._id
        };
    },

    async exportProducts(format = 'csv', params = {}) {
        try {
            const response = await api.get('/products/export', {
                params: { ...params, format },
                responseType: 'blob'
            });
            return response.data;
        } catch (error) {
            console.error('Error exporting products:', error);
            throw error;
        }
    },

    async importProducts(file, format = 'csv') {
        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('format', format);

            const response = await api.post('/products/import', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            return extractData(response);
        } catch (error) {
            console.error('Error importing products:', error);
            throw error;
        }
    },

    async getProductHistory(id, params = {}) {
        try {
            const response = await api.get(`/products/${id}/history`, { params });
            const data = extractData(response);
            return data || [];
        } catch (error) {
            console.error('Error fetching product history:', error);
            return [];
        }
    },

    async toggleProductStatus(id, isActive) {
        try {
            const response = await api.patch(`/products/${id}/status`, { isActive });
            return extractData(response);
        } catch (error) {
            console.error('Error toggling product status:', error);
            throw error;
        }
    },

    async getExpiringProducts(days = 30) {
        try {
            const response = await api.get('/products/expiring', { 
                params: { days } 
            });
            const data = extractData(response);
            return extractProductsArray(data);
        } catch (error) {
            console.error('Error fetching expiring products:', error);
            return [];
        }
    },

    async getSourceSummary() {
        try {
            const sources = ['Office Inventory', 'Direct supplier', 'Local Supplier', 'Other'];
            const summary = await Promise.all(
                sources.map(async (source) => {
                    const products = await this.getProductsBySource(source);
                    return {
                        source,
                        count: products.length || 0,
                        products: products || []
                    };
                })
            );
            
            const totalProducts = summary.reduce((acc, curr) => acc + curr.count, 0);
            
            return {
                success: true,
                data: {
                    summary,
                    totalProducts,
                    sourceBreakdown: summary.map(s => ({
                        source: s.source,
                        count: s.count,
                        percentage: totalProducts > 0 ? ((s.count / totalProducts) * 100).toFixed(2) : 0
                    }))
                }
            };
        } catch (error) {
            console.error('Error fetching source summary:', error);
            return { data: { summary: [], totalProducts: 0, sourceBreakdown: [] } };
        }
    }
};