// context/ShipmentContext.jsx - COMPLETE UPDATED VERSION

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

            if (id === 'undefined' || id === 'null' || id === '') {
                throw new Error('Invalid shipment ID format');
            }
            
            const response = await shipmentService.getShipmentById(id);
            console.log('Shipment by ID response:', response);
            
            if (response?.success === false) {
                if (response.error === 'Shipment not found') {
                    setCurrentShipment(null);
                    toast.error('Shipment not found');
                    return null;
                }
                throw new Error(response.error || 'Failed to fetch shipment');
            }
            
            let shipmentData = null;
            
            if (response?.data) {
                shipmentData = response.data;
            } else if (response?._id || response?.id) {
                shipmentData = response;
            } else if (response?.success && response?.data) {
                shipmentData = response.data;
            }
            
            if (!shipmentData) {
                console.error('Could not extract shipment data from response:', response);
                
                if (response?.error === 'Shipment not found' || response?.status === 404) {
                    setCurrentShipment(null);
                    return null;
                }
                
                throw new Error('Invalid shipment data received from server');
            }
            
            // Ensure items have proper fields including the new ones for sold/processed items
            if (shipmentData.items && Array.isArray(shipmentData.items)) {
                shipmentData.items = shipmentData.items.map(item => ({
                    ...item,
                    toBeReturned: formatReturnable(item.toBeReturned),
                    returnedQuantity: item.returnedQuantity || 0,
                    soldQuantity: item.soldQuantity || 0,
                    givenAwayQuantity: item.givenAwayQuantity || 0,
                    permanentlyDeletedQuantity: item.permanentlyDeletedQuantity || 0,
                    totalProcessed: (item.returnedQuantity || 0) + 
                                   (item.soldQuantity || 0) + 
                                   (item.givenAwayQuantity || 0) + 
                                   (item.permanentlyDeletedQuantity || 0),
                    pendingQuantity: item.quantity - (
                        (item.returnedQuantity || 0) + 
                        (item.soldQuantity || 0) + 
                        (item.givenAwayQuantity || 0) + 
                        (item.permanentlyDeletedQuantity || 0)
                    ),
                    isProcessed: item.isProcessed || false
                }));
            }
            
            console.log('Extracted shipment data:', shipmentData);
            setCurrentShipment(shipmentData);
            return shipmentData;
        } catch (error) {
            console.error('Error fetching shipment:', error);
            setError(error.message || 'Failed to fetch shipment');
            
            if (error.message !== 'Shipment not found' && !error.message.includes('404')) {
                toast.error(error.message || 'Failed to load shipment details');
            }
            
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
            
            const formattedItems = (shipmentData.items || []).map(item => ({
                ...item,
                toBeReturned: formatReturnable(item.toBeReturned || item.returnable)
            }));
            
            const formattedData = {
                ...shipmentData,
                items: formattedItems
            };
            
            if (shipmentData.type === 'OUTGOING' && formattedItems.length > 0) {
                const validationItems = formattedItems.map(item => ({
                    product: item.productId || item.product,
                    quantity: Number(item.quantity),
                    location: item.location || 'BALAGTAS'
                }));
                
                console.log('Validating items:', validationItems);
                
                try {
                    const validation = await shipmentService.validateStock({ items: validationItems });
                    console.log('Validation response:', validation);
                    
                    if (validation?.data?.allAvailable === false) {
                        const unavailableItems = validation?.data?.results
                            ?.filter(r => !r.available)
                            ?.map(r => `${r.productName} (${r.location}) - Available: ${r.availableStock}, Requested: ${r.requestedQuantity}`)
                            ?.join(', ');
                        
                        throw new Error(`Insufficient stock for: ${unavailableItems || 'some items'}`);
                    }
                } catch (validationError) {
                    console.warn('Stock validation skipped:', validationError);
                }
            }

            const response = await shipmentService.createShipment(formattedData);
            console.log('Shipment created:', response);
            
            await fetchShipments();
            toast.success('Shipment created successfully');
            return response;
        } catch (error) {
            console.error('Error creating shipment:', error);
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

    // Return items - ISANG BESES LANG!
    const returnItems = useCallback(async (id, returnData) => {
        setLoading(true);
        try {
            console.log('Processing items with data:', returnData);
            
            const response = await shipmentService.returnItems(id, returnData);
            console.log('Return items response:', response);
            
            if (response?.success) {
                if (currentShipment && (currentShipment._id === id || currentShipment.id === id)) {
                    await fetchShipmentById(id);
                }
                
                await fetchShipments();
                
                const actionType = returnData.items?.[0]?.action || 'returned';
                let actionMessage = '';
                
                if (actionType === 'return') {
                    actionMessage = 'Items returned successfully';
                } else {
                    actionMessage = 'Items processed successfully';
                }
                
                toast.success(actionMessage);
            }
            
            return response;
        } catch (error) {
            console.error('Error processing items:', error);
            const errorMessage = error.response?.data?.message || 
                                error.message || 
                                'Failed to process items';
            toast.error(errorMessage);
            throw error;
        } finally {
            setLoading(false);
        }
    }, [fetchShipmentById, fetchShipments, currentShipment]);

    // Mark remaining items as sold automatically
    const markRemainingAsSold = useCallback(async (id) => {
        setLoading(true);
        try {
            console.log('Marking remaining items as sold for shipment:', id);
            
            const response = await shipmentService.markRemainingAsSold(id);
            console.log('Mark sold response:', response);
            
            if (response?.success) {
                if (currentShipment && (currentShipment._id === id || currentShipment.id === id)) {
                    await fetchShipmentById(id);
                }
                
                await fetchShipments();
                
                toast.success('Remaining items marked as sold successfully');
            }
            
            return response;
        } catch (error) {
            console.error('Error marking items as sold:', error);
            const errorMessage = error.response?.data?.message || 
                                error.message || 
                                'Failed to mark items as sold';
            toast.error(errorMessage);
            throw error;
        } finally {
            setLoading(false);
        }
    }, [fetchShipmentById, fetchShipments, currentShipment]);

    // Mark specific pending items as sold
    const markItemsAsSold = useCallback(async (id, itemsData) => {
        setLoading(true);
        try {
            console.log('Marking specific items as sold for shipment:', id, itemsData);
            
            const response = await shipmentService.markItemsAsSold(id, itemsData);
            console.log('Mark items sold response:', response);
            
            if (response?.success) {
                if (currentShipment && (currentShipment._id === id || currentShipment.id === id)) {
                    await fetchShipmentById(id);
                }
                
                await fetchShipments();
                
                toast.success('Selected items marked as sold successfully');
            }
            
            return response;
        } catch (error) {
            console.error('Error marking items as sold:', error);
            const errorMessage = error.response?.data?.message || 
                                error.message || 
                                'Failed to mark items as sold';
            toast.error(errorMessage);
            throw error;
        } finally {
            setLoading(false);
        }
    }, [fetchShipmentById, fetchShipments, currentShipment]);

    // Get available items for return (unsold, unprocessed items only)
    const getAvailableForReturn = useCallback(async (id) => {
        try {
            const response = await shipmentService.getAvailableForReturn(id);
            return response;
        } catch (error) {
            console.error('Error getting available returns:', error);
            return { success: true, data: [] };
        }
    }, []);

    // Get item return history
    const getItemReturnHistory = useCallback(async (shipmentId, itemIndex) => {
        try {
            const response = await shipmentService.getItemReturnHistory(shipmentId, itemIndex);
            return response;
        } catch (error) {
            console.error('Error getting item return history:', error);
            return { success: true, data: { item: null, returnHistory: [] } };
        }
    }, []);

    // Permanently delete items from inventory
    const permanentlyDeleteItems = useCallback(async (id, deleteData) => {
        setLoading(true);
        try {
            console.log('Permanently deleting items with data:', deleteData);
            
            const response = await shipmentService.permanentlyDeleteItems(id, deleteData);
            console.log('Permanent delete response:', response);
            
            if (response?.success) {
                if (currentShipment && (currentShipment._id === id || currentShipment.id === id)) {
                    await fetchShipmentById(id);
                }
                
                await fetchShipments();
                
                toast.success('Items permanently deleted from inventory');
            }
            
            return response;
        } catch (error) {
            console.error('Error permanently deleting items:', error);
            const errorMessage = error.response?.data?.message || 
                                error.message || 
                                'Failed to permanently delete items';
            toast.error(errorMessage);
            throw error;
        } finally {
            setLoading(false);
        }
    }, [fetchShipmentById, fetchShipments, currentShipment]);

    // Check if shipment has processed items
    const checkProcessedItems = useCallback(async (id) => {
        try {
            const response = await shipmentService.hasProcessedItems(id);
            return response.data;
        } catch (error) {
            console.error('Error checking processed items:', error);
            return {
                hasProcessed: false,
                hasReturns: false,
                hasSold: false,
                hasBeenProcessed: false,
                canProcess: true
            };
        }
    }, []);

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

    // Get processing summary for a shipment
    const getProcessingSummary = useCallback((shipment) => {
        if (!shipment || !shipment.items) {
            return { 
                totalItems: 0,
                totalReturned: 0, 
                totalSold: 0, 
                totalGivenAway: 0, 
                totalDeleted: 0,
                totalProcessed: 0,
                pending: 0, 
                percentage: 0,
                hasBeenProcessed: false
            };
        }
        
        const totalItems = shipment.items.reduce((sum, item) => sum + (item.quantity || 0), 0);
        
        const totalReturned = shipment.items.reduce((sum, item) => sum + (item.returnedQuantity || 0), 0);
        const totalSold = shipment.items.reduce((sum, item) => sum + (item.soldQuantity || 0), 0);
        const totalGivenAway = shipment.items.reduce((sum, item) => sum + (item.givenAwayQuantity || 0), 0);
        const totalDeleted = shipment.items.reduce((sum, item) => sum + (item.permanentlyDeletedQuantity || 0), 0);
        
        const totalProcessed = totalReturned + totalSold + totalGivenAway + totalDeleted;
        const pending = totalItems - totalProcessed;
        const percentage = totalItems > 0 ? (totalProcessed / totalItems) * 100 : 0;
        
        return {
            totalItems,
            totalReturned,
            totalSold,
            totalGivenAway,
            totalDeleted,
            totalProcessed,
            pending,
            percentage,
            hasBeenProcessed: shipment.hasBeenProcessed || false
        };
    }, []);

    // Get return summary for a shipment
    const getReturnSummary = useCallback((shipment) => {
        const summary = getProcessingSummary(shipment);
        return {
            totalToBeReturned: summary.totalItems,
            totalReturned: summary.totalReturned,
            pending: summary.pending,
            percentage: summary.percentage,
            hasBeenProcessed: summary.hasBeenProcessed
        };
    }, [getProcessingSummary]);

    // Get pending items that need processing
    const getPendingItems = useCallback((shipment) => {
        if (!shipment || !shipment.items) return [];
        
        return shipment.items
            .map((item, index) => {
                const processedQty = (item.returnedQuantity || 0) + 
                                    (item.soldQuantity || 0) + 
                                    (item.givenAwayQuantity || 0) + 
                                    (item.permanentlyDeletedQuantity || 0);
                const pendingQuantity = item.quantity - processedQty;
                
                return {
                    ...item,
                    index,
                    pendingQuantity,
                    processedQty,
                    isProcessed: item.isProcessed || false
                };
            })
            .filter(item => item.pendingQuantity > 0 && !item.isProcessed);
    }, []);

    // Get sold items summary
    const getSoldItemsSummary = useCallback((shipment) => {
        if (!shipment || !shipment.items) {
            return {
                totalSold: 0,
                soldItems: [],
                totalSoldValue: 0
            };
        }
        
        const soldItems = shipment.items.filter(item => (item.soldQuantity || 0) > 0);
        const totalSold = soldItems.reduce((sum, item) => sum + (item.soldQuantity || 0), 0);
        const totalSoldValue = soldItems.reduce((sum, item) => {
            return sum + ((item.soldQuantity || 0) * (item.productSnapshot?.price || 0));
        }, 0);
        
        return {
            totalSold,
            soldItems,
            totalSoldValue
        };
    }, []);

    // Get returnable items summary (unsold, unprocessed items)
    const getReturnableItemsSummary = useCallback((shipment) => {
        if (!shipment || !shipment.items) {
            return {
                totalReturnable: 0,
                returnableItems: [],
                totalPending: 0
            };
        }
        
        const returnableItems = shipment.items.filter(item => {
            const processedQty = (item.returnedQuantity || 0) + 
                                (item.soldQuantity || 0) + 
                                (item.givenAwayQuantity || 0) + 
                                (item.permanentlyDeletedQuantity || 0);
            return processedQty < item.quantity && !item.isProcessed;
        });
        
        const totalPending = returnableItems.reduce((sum, item) => {
            const processedQty = (item.returnedQuantity || 0) + 
                                (item.soldQuantity || 0) + 
                                (item.givenAwayQuantity || 0) + 
                                (item.permanentlyDeletedQuantity || 0);
            return sum + (item.quantity - processedQty);
        }, 0);
        
        return {
            totalReturnable: returnableItems.length,
            returnableItems,
            totalPending
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
        markRemainingAsSold,
        markItemsAsSold,
        getAvailableForReturn,
        getItemReturnHistory,
        permanentlyDeleteItems,
        checkProcessedItems,
        addItem,
        updateItem,
        removeItem,
        getReturnSummary,
        getProcessingSummary,
        getPendingItems,
        getSoldItemsSummary,
        getReturnableItemsSummary,
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