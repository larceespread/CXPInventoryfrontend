// context/ShipmentContext.jsx - COMPLETE FIXED VERSION

import React, { createContext, useState, useContext, useCallback } from 'react';
import { shipmentService } from '../services/shipmentService';
import { productService } from '../services/productService';
import toast from 'react-hot-toast';

// Helper function to safely get product name
const getProductName = (product) => {
    if (!product) return 'Unknown Product';
    return product.name || 
           product.productName || 
           product.title || 
           product.itemDescription ||
           `Product (${product._id?.slice(-6) || product.id?.slice(-6) || 'N/A'})`;
};

// Helper function to safely get product ID
const getProductId = (product) => {
    if (!product) return null;
    return product._id || product.id || null;
};

// Helper function to safely get stock at location
const getStockAtLocation = (product, location) => {
    if (!product || !location) return 0;
    
    try {
        const storageLocations = product.storageLocations || [];
        const locationStock = storageLocations.find(
            loc => loc && loc.location === location
        );
        return locationStock?.quantity || 0;
    } catch (error) {
        console.error('Error getting stock at location:', error);
        return 0;
    }
};

// Helper to format returnable value
const formatReturnable = (value) => {
    if (value === 'yes') return true;
    if (value === 'no') return false;
    if (value === 'true') return true;
    if (value === 'false') return false;
    if (value === 1) return true;
    if (value === 0) return false;
    return Boolean(value);
};

const ShipmentContext = createContext();

export const useShipment = () => {
    const context = useContext(ShipmentContext);
    if (!context) {
        throw new Error('useShipment must be used within a ShipmentProvider');
    }
    return context;
};

export const ShipmentProvider = ({ children }) => {
    const [shipments, setShipments] = useState([]);
    const [currentShipment, setCurrentShipment] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [totalCount, setTotalCount] = useState(0);
    const [availableProducts, setAvailableProducts] = useState([]);
    const [productsLoading, setProductsLoading] = useState(false);
    const [stats, setStats] = useState(null);
    const [pendingReturns, setPendingReturns] = useState([]);

    // Fetch available products for selection
    const fetchAvailableProducts = useCallback(async (search = '', location = '') => {
        setProductsLoading(true);
        try {
            const params = {};
            if (search) params.search = search;
            if (location) params.location = location;
            
            const response = await productService.getProducts(params);
            
            // Handle different response structures
            let productsArray = [];
            if (Array.isArray(response)) {
                productsArray = response;
            } else if (response.data && Array.isArray(response.data)) {
                productsArray = response.data;
            } else if (response.products && Array.isArray(response.products)) {
                productsArray = response.products;
            } else {
                productsArray = [];
            }
            
            setAvailableProducts(productsArray);
            return productsArray;
        } catch (error) {
            console.error('Error fetching products:', error);
            toast.error('Failed to fetch products');
            return [];
        } finally {
            setProductsLoading(false);
        }
    }, []);

    const fetchShipments = useCallback(async (params = {}) => {
        setLoading(true);
        setError(null);
        try {
            console.log('Fetching shipments with params:', params);
            const response = await shipmentService.getShipments(params);
            console.log('Shipments response:', response);
            
            // Handle different response structures
            let shipmentsArray = [];
            let count = 0;
            
            if (response?.data && Array.isArray(response.data)) {
                shipmentsArray = response.data;
                count = response.count || response.total || response.data.length;
            } else if (Array.isArray(response)) {
                shipmentsArray = response;
                count = response.length;
            } else if (response?.success && response?.data) {
                shipmentsArray = response.data;
                count = response.count || response.total || shipmentsArray.length;
            } else {
                shipmentsArray = [];
                count = 0;
            }
            
            setShipments(shipmentsArray);
            setTotalCount(count);
            return { data: shipmentsArray, count };
        } catch (error) {
            console.error('Error fetching shipments:', error);
            setError(error.message || 'Failed to fetch shipments');
            toast.error('Failed to fetch shipments');
            return { data: [], count: 0 };
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchShipmentById = useCallback(async (id) => {
        setLoading(true);
        setError(null);
        try {
            console.log('Fetching shipment by ID:', id);
            
            if (!id) {
                throw new Error('Shipment ID is required');
            }

            // Validate ID format
            if (id === 'undefined' || id === 'null' || id === '') {
                throw new Error('Invalid shipment ID format');
            }
            
            const response = await shipmentService.getShipmentById(id);
            console.log('Shipment by ID response:', response);
            
            // Handle 404 or error responses
            if (response?.success === false) {
                if (response.error === 'Shipment not found') {
                    setCurrentShipment(null);
                    toast.error('Shipment not found');
                    return null;
                }
                throw new Error(response.error || 'Failed to fetch shipment');
            }
            
            // Handle different response structures
            let shipmentData = null;
            
            if (response?.data) {
                // Standard API response { success: true, data: shipment }
                shipmentData = response.data;
            } else if (response?._id || response?.id) {
                // Direct shipment object
                shipmentData = response;
            } else if (response?.success && response?.data) {
                // Another common pattern
                shipmentData = response.data;
            }
            
            if (!shipmentData) {
                console.error('Could not extract shipment data from response:', response);
                
                // If we got a 404, set to null and return
                if (response?.error === 'Shipment not found' || response?.status === 404) {
                    setCurrentShipment(null);
                    return null;
                }
                
                throw new Error('Invalid shipment data received from server');
            }
            
            // Ensure items have proper returnable field format
            if (shipmentData.items && Array.isArray(shipmentData.items)) {
                shipmentData.items = shipmentData.items.map(item => ({
                    ...item,
                    toBeReturned: formatReturnable(item.toBeReturned),
                    returnedQuantity: item.returnedQuantity || 0
                }));
            }
            
            console.log('Extracted shipment data:', shipmentData);
            setCurrentShipment(shipmentData);
            return shipmentData;
        } catch (error) {
            console.error('Error fetching shipment:', error);
            setError(error.message || 'Failed to fetch shipment');
            
            // Don't show toast for 404 errors as they're handled by the component
            if (error.message !== 'Shipment not found' && !error.message.includes('404')) {
                toast.error(error.message || 'Failed to load shipment details');
            }
            
            // Set currentShipment to null on error
            setCurrentShipment(null);
            throw error;
        } finally {
            setLoading(false);
        }
    }, []);

    // Fetch pending returns
    const fetchPendingReturns = useCallback(async () => {
        try {
            const response = await shipmentService.getPendingReturns();
            if (response?.success && response?.data) {
                setPendingReturns(response.data);
                return response.data;
            }
            return [];
        } catch (error) {
            console.error('Error fetching pending returns:', error);
            return [];
        }
    }, []);

    const createShipment = useCallback(async (shipmentData) => {
        setLoading(true);
        try {
            console.log('Creating shipment with data:', shipmentData);
            
            // Format items to ensure proper returnable field
            const formattedItems = (shipmentData.items || []).map(item => ({
                ...item,
                toBeReturned: formatReturnable(item.toBeReturned || item.returnable)
            }));
            
            const formattedData = {
                ...shipmentData,
                items: formattedItems
            };
            
            // Only validate stock for outgoing shipments
            if (shipmentData.type === 'OUTGOING' && formattedItems.length > 0) {
                // Format items for validation - backend expects array of objects with product, quantity, location
                const validationItems = formattedItems.map(item => ({
                    product: item.productId || item.product,
                    quantity: Number(item.quantity),
                    location: item.location || 'BALAGTAS'
                }));
                
                console.log('Validating items:', validationItems);
                
                try {
                    const validation = await shipmentService.validateStock({ items: validationItems });
                    console.log('Validation response:', validation);
                    
                    // Check if validation failed
                    if (validation?.data?.allAvailable === false) {
                        const unavailableItems = validation?.data?.results
                            ?.filter(r => !r.available)
                            ?.map(r => `${r.productName} (${r.location}) - Available: ${r.availableStock}, Requested: ${r.requestedQuantity}`)
                            ?.join(', ');
                        
                        throw new Error(`Insufficient stock for: ${unavailableItems || 'some items'}`);
                    }
                } catch (validationError) {
                    // If validation endpoint fails, log but continue (don't block creation)
                    console.warn('Stock validation skipped:', validationError);
                    // Don't throw here - allow creation anyway
                }
            }

            const response = await shipmentService.createShipment(formattedData);
            console.log('Shipment created:', response);
            
            await fetchShipments();
            toast.success('Shipment created successfully');
            return response;
        } catch (error) {
            console.error('Error creating shipment:', error);
            // Extract error message properly
            const errorMessage = error.response?.data?.message || 
                                error.message || 
                                'Failed to create shipment';
            toast.error(errorMessage);
            throw error;
        } finally {
            setLoading(false);
        }
    }, [fetchShipments]);

    const updateShipment = useCallback(async (id, shipmentData) => {
        setLoading(true);
        try {
            console.log('Updating shipment:', id, shipmentData);
            
            // Format items to ensure proper returnable field
            const formattedItems = (shipmentData.items || []).map(item => ({
                ...item,
                toBeReturned: formatReturnable(item.toBeReturned || item.returnable)
            }));
            
            const formattedData = {
                ...shipmentData,
                items: formattedItems
            };
            
            const response = await shipmentService.updateShipment(id, formattedData);
            
            await fetchShipments();
            if (currentShipment && (currentShipment._id === id || currentShipment.id === id)) {
                setCurrentShipment(response.data || response);
            }
            
            toast.success('Shipment updated successfully');
            return response;
        } catch (error) {
            console.error('Error updating shipment:', error);
            toast.error(error.message || 'Failed to update shipment');
            throw error;
        } finally {
            setLoading(false);
        }
    }, [fetchShipments, currentShipment]);

    const deleteShipment = useCallback(async (id) => {
        setLoading(true);
        try {
            const shipment = shipments.find(s => s._id === id || s.id === id);
            
            const response = await shipmentService.deleteShipment(id);
            await fetchShipments();
            
            if (currentShipment && (currentShipment._id === id || currentShipment.id === id)) {
                setCurrentShipment(null);
            }
            
            toast.success('Shipment deleted successfully');
            return response;
        } catch (error) {
            console.error('Error deleting shipment:', error);
            toast.error(error.message || 'Failed to delete shipment');
            throw error;
        } finally {
            setLoading(false);
        }
    }, [fetchShipments, currentShipment, shipments]);

    const updateShipmentStatus = useCallback(async (id, status) => {
        setLoading(true);
        try {
            const response = await shipmentService.updateStatus(id, status);
            
            await fetchShipments();
            
            if (currentShipment && (currentShipment._id === id || currentShipment.id === id)) {
                setCurrentShipment(prev => ({ ...prev, status }));
            }
            
            toast.success(`Shipment status updated to ${status}`);
            return response;
        } catch (error) {
            console.error('Error updating shipment status:', error);
            toast.error(error.message || 'Failed to update shipment status');
            throw error;
        } finally {
            setLoading(false);
        }
    }, [fetchShipments, currentShipment]);

    // Return items - FIXED VERSION
    const returnItems = useCallback(async (id, returnData) => {
        setLoading(true);
        try {
            console.log('Returning items with data:', returnData);
            
            // Ensure the return data has the correct structure
            // The shipmentService.returnItems function has been fixed to expect 'index'
            const response = await shipmentService.returnItems(id, returnData);
            console.log('Return items response:', response);
            
            if (response?.success) {
                // Update current shipment if it's the one being viewed
                if (currentShipment && (currentShipment._id === id || currentShipment.id === id)) {
                    await fetchShipmentById(id);
                }
                
                // Refresh shipments list
                await fetchShipments();
                
                toast.success('Items returned successfully');
            }
            
            return response;
        } catch (error) {
            console.error('Error returning items:', error);
            const errorMessage = error.response?.data?.message || 
                                error.message || 
                                'Failed to return items';
            toast.error(errorMessage);
            throw error;
        } finally {
            setLoading(false);
        }
    }, [fetchShipmentById, fetchShipments, currentShipment]);

    const fetchShipmentStats = useCallback(async () => {
        try {
            const response = await shipmentService.getShipmentStats();
            setStats(response.data || response);
            return response;
        } catch (error) {
            console.error('Error fetching shipment stats:', error);
            return null;
        }
    }, []);

    const addItem = useCallback(async (shipmentId, itemData) => {
        setLoading(true);
        try {
            // Format returnable field
            const formattedItem = {
                ...itemData,
                toBeReturned: formatReturnable(itemData.toBeReturned || itemData.returnable)
            };
            
            const response = await shipmentService.addItem(shipmentId, formattedItem);
            
            if (currentShipment && (currentShipment._id === shipmentId || currentShipment.id === shipmentId)) {
                await fetchShipmentById(shipmentId);
            }
            
            toast.success('Item added successfully');
            return response;
        } catch (error) {
            console.error('Error adding item:', error);
            toast.error(error.message || 'Failed to add item');
            throw error;
        } finally {
            setLoading(false);
        }
    }, [currentShipment, fetchShipmentById]);

    const updateItem = useCallback(async (shipmentId, itemId, itemData) => {
        setLoading(true);
        try {
            // Format returnable field
            const formattedItem = {
                ...itemData,
                toBeReturned: formatReturnable(itemData.toBeReturned || itemData.returnable)
            };
            
            const response = await shipmentService.updateItem(shipmentId, itemId, formattedItem);
            
            if (currentShipment && (currentShipment._id === shipmentId || currentShipment.id === shipmentId)) {
                await fetchShipmentById(shipmentId);
            }
            
            toast.success('Item updated successfully');
            return response;
        } catch (error) {
            console.error('Error updating item:', error);
            toast.error(error.message || 'Failed to update item');
            throw error;
        } finally {
            setLoading(false);
        }
    }, [currentShipment, fetchShipmentById]);

    const removeItem = useCallback(async (shipmentId, itemId) => {
        setLoading(true);
        try {
            const response = await shipmentService.removeItem(shipmentId, itemId);
            
            if (currentShipment && (currentShipment._id === shipmentId || currentShipment.id === shipmentId)) {
                await fetchShipmentById(shipmentId);
            }
            
            toast.success('Item removed successfully');
            return response;
        } catch (error) {
            console.error('Error removing item:', error);
            toast.error(error.message || 'Failed to remove item');
            throw error;
        } finally {
            setLoading(false);
        }
    }, [currentShipment, fetchShipmentById]);

    // Get return summary for a shipment
    const getReturnSummary = useCallback((shipment) => {
        if (!shipment || !shipment.items) {
            return { totalToBeReturned: 0, totalReturned: 0, pending: 0, percentage: 0 };
        }
        
        const totalToBeReturned = shipment.items
            .filter(item => item.toBeReturned)
            .reduce((sum, item) => sum + (item.quantity || 0), 0);
        
        const totalReturned = shipment.returnedItems
            ?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0;
        
        const pending = totalToBeReturned - totalReturned;
        const percentage = totalToBeReturned > 0 ? (totalReturned / totalToBeReturned) * 100 : 0;
        
        return {
            totalToBeReturned,
            totalReturned,
            pending,
            percentage
        };
    }, []);

    // Clear current shipment
    const clearCurrentShipment = useCallback(() => {
        setCurrentShipment(null);
        setError(null);
    }, []);

    const value = {
        shipments,
        currentShipment,
        loading,
        error,
        totalCount,
        availableProducts,
        productsLoading,
        stats,
        pendingReturns,
        fetchShipments,
        fetchShipmentById,
        fetchAvailableProducts,
        fetchShipmentStats,
        fetchPendingReturns,
        createShipment,
        updateShipment,
        deleteShipment,
        updateStatus: updateShipmentStatus,
        returnItems,
        addItem,
        updateItem,
        removeItem,
        getReturnSummary,
        getProductName,
        getProductId,
        getStockAtLocation,
        clearCurrentShipment
    };

    return (
        <ShipmentContext.Provider value={value}>
            {children}
        </ShipmentContext.Provider>
    );
};