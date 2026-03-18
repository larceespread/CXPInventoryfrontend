// services/shipmentService.js - COMPLETE UPDATED VERSION

import api from './api';

export const shipmentService = {
    // Get all shipments with pagination and filters
    getShipments: async (params = {}) => {
        try {
            const queryParams = new URLSearchParams(params).toString();
            const url = `/shipments${queryParams ? `?${queryParams}` : ''}`;
            console.log('Fetching shipments from:', url);
            
            const response = await api.get(url);
            console.log('Shipments API response:', response);
            
            return response.data;
        } catch (error) {
            console.error('Error fetching shipments:', error);
            console.error('Error response:', error.response?.data);
            console.error('Error status:', error.response?.status);
            throw error.response?.data || error.message;
        }
    },

    // Get single shipment by ID
    getShipmentById: async (id) => {
        try {
            console.log('Fetching shipment by ID:', id);
            
            if (!id) {
                throw new Error('Shipment ID is required');
            }
            
            const shipmentId = String(id).trim();
            const response = await api.get(`/shipments/${shipmentId}`);
            console.log('Shipment by ID API response:', response);
            
            return response.data;
        } catch (error) {
            console.error('Error fetching shipment:', error);
            console.error('Error response:', error.response?.data);
            console.error('Error status:', error.response?.status);
            
            if (error.response?.status === 404) {
                return {
                    success: false,
                    data: null,
                    error: 'Shipment not found'
                };
            }
            
            throw error.response?.data || error.message;
        }
    },

    // Get shipment by shipment number
    getShipmentByNumber: async (shipmentNumber) => {
        try {
            const response = await api.get(`/shipments/number/${shipmentNumber}`);
            return response.data;
        } catch (error) {
            console.error('Error fetching shipment by number:', error);
            throw error.response?.data || error.message;
        }
    },

    // Get pending returns
    getPendingReturns: async () => {
        try {
            const response = await api.get('/shipments/returns/pending');
            return response.data;
        } catch (error) {
            console.error('Error fetching pending returns:', error);
            return {
                success: true,
                data: [],
                count: 0
            };
        }
    },

    // Create new shipment
    createShipment: async (shipmentData) => {
        try {
            console.log('Creating shipment with data:', JSON.stringify(shipmentData, null, 2));
            
            const formattedData = {
                type: shipmentData.type || 'OUTGOING',
                shipmentNumber: shipmentData.shipmentNumber,
                requestedBy: shipmentData.requestedBy || '',
                department: shipmentData.department || '',
                datePrepared: shipmentData.datePrepared || new Date().toISOString().split('T')[0],
                datesCovered: shipmentData.datesCovered || '',
                purpose: shipmentData.purpose || '',
                noteOrRequest: shipmentData.noteOrRequest || '',
                notes: shipmentData.notes || '',
                items: (shipmentData.items || []).map(item => ({
                    itemDescription: item.productName || item.itemDescription || 'Product',
                    itemOtherDetails: item.itemOtherDetails || '',
                    quantity: Number(item.quantity) || 1,
                    unit: item.unit || 'pcs',
                    details: item.details || item.location || '',
                    toBeReturned: item.returnable === 'yes' ? true : 
                                 item.returnable === 'no' ? false : 
                                 item.toBeReturned || false,
                    product: item.productId || item.product,
                    location: item.location || 'BALAGTAS',
                    remarks: item.remarks || '',
                    productSnapshot: item.productSnapshot ? {
                        name: item.productName,
                        sku: item.sku,
                        price: item.unitPrice || 0
                    } : undefined
                })),
                truckDriver: {
                    name: shipmentData.truckDriver?.name || '',
                    contactNumber: shipmentData.truckDriver?.contactNumber || '',
                    destination: shipmentData.truckDriver?.destination || '',
                    contactPerson: shipmentData.truckDriver?.contactPerson || ''
                }
            };

            console.log('Sending formatted data:', JSON.stringify(formattedData, null, 2));
            
            const response = await api.post('/shipments', formattedData);
            console.log('Shipment created response:', response.data);
            return response.data;
        } catch (error) {
            console.error('Error creating shipment:', error);
            console.error('Error response:', error.response?.data);
            console.error('Error status:', error.response?.status);
            throw error.response?.data || error;
        }
    },

    // Update shipment
    updateShipment: async (id, shipmentData) => {
        try {
            console.log('Updating shipment:', id, shipmentData);
            
            const formattedData = {
                type: shipmentData.type,
                requestedBy: shipmentData.requestedBy,
                department: shipmentData.department,
                datePrepared: shipmentData.datePrepared,
                datesCovered: shipmentData.datesCovered,
                purpose: shipmentData.purpose,
                noteOrRequest: shipmentData.noteOrRequest,
                notes: shipmentData.notes,
                items: (shipmentData.items || []).map(item => ({
                    itemDescription: item.productName || item.itemDescription || 'Product',
                    itemOtherDetails: item.itemOtherDetails || '',
                    quantity: Number(item.quantity),
                    unit: item.unit || 'pcs',
                    details: item.details || item.location || '',
                    toBeReturned: item.returnable === 'yes' ? true : 
                                 item.returnable === 'no' ? false : 
                                 item.toBeReturned || false,
                    product: item.productId || item.product,
                    location: item.location || 'BALAGTAS',
                    remarks: item.remarks || ''
                })),
                truckDriver: {
                    name: shipmentData.truckDriver?.name || '',
                    contactNumber: shipmentData.truckDriver?.contactNumber || '',
                    destination: shipmentData.truckDriver?.destination || '',
                    contactPerson: shipmentData.truckDriver?.contactPerson || ''
                }
            };

            const response = await api.put(`/shipments/${id}`, formattedData);
            console.log('Shipment updated response:', response.data);
            return response.data;
        } catch (error) {
            console.error('Error updating shipment:', error);
            throw error.response?.data || error;
        }
    },

    // Delete shipment
    deleteShipment: async (id) => {
        try {
            const response = await api.delete(`/shipments/${id}`);
            return response.data;
        } catch (error) {
            console.error('Error deleting shipment:', error);
            throw error.response?.data || error.message;
        }
    },

    // ========== SOLD ITEMS FEATURES ==========

    // Mark remaining items as sold
    markRemainingAsSold: async (id) => {
        try {
            console.log('Marking remaining items as sold for shipment:', id);
            
            const response = await api.post(`/shipments/${id}/mark-sold`);
            console.log('Mark sold response:', response.data);
            
            return response.data;
        } catch (error) {
            console.error('Error marking items as sold:', error);
            console.error('Error response:', error.response?.data);
            console.error('Error status:', error.response?.status);
            
            const errorMessage = error.response?.data?.message || 
                               error.response?.data?.error ||
                               error.message || 
                               'Failed to mark items as sold';
            throw new Error(errorMessage);
        }
    },

    // Mark specific pending items as sold
    markItemsAsSold: async (id, itemsData) => {
        try {
            console.log('Marking specific items as sold for shipment:', id, itemsData);
            
            const response = await api.post(`/shipments/${id}/mark-items-sold`, itemsData);
            console.log('Mark items sold response:', response.data);
            
            return response.data;
        } catch (error) {
            console.error('Error marking items as sold:', error);
            console.error('Error response:', error.response?.data);
            console.error('Error status:', error.response?.status);
            
            const errorMessage = error.response?.data?.message || 
                               error.response?.data?.error ||
                               error.message || 
                               'Failed to mark items as sold';
            throw new Error(errorMessage);
        }
    },

    // Get available items for return (unsold items only)
    getAvailableForReturn: async (id) => {
        try {
            console.log('Getting available items for return for shipment:', id);
            
            const response = await api.get(`/shipments/${id}/available-returns`);
            console.log('Available returns response:', response.data);
            
            return response.data;
        } catch (error) {
            console.error('Error getting available returns:', error);
            console.error('Error response:', error.response?.data);
            
            return {
                success: true,
                data: []
            };
        }
    },

    // Get return history for a specific item
    getItemReturnHistory: async (shipmentId, itemIndex) => {
        try {
            console.log('Getting return history for item:', itemIndex, 'in shipment:', shipmentId);
            
            const response = await api.get(`/shipments/${shipmentId}/items/${itemIndex}/returns`);
            console.log('Item return history response:', response.data);
            
            return response.data;
        } catch (error) {
            console.error('Error getting item return history:', error);
            console.error('Error response:', error.response?.data);
            
            return {
                success: true,
                data: {
                    item: null,
                    returnHistory: []
                }
            };
        }
    },

    // Get sold items summary for a shipment
    getSoldItemsSummary: async (id) => {
        try {
            const shipment = await shipmentService.getShipmentById(id);
            
            if (!shipment.success || !shipment.data) {
                return {
                    success: true,
                    data: {
                        totalSoldItems: 0,
                        soldItems: [],
                        totalSoldValue: 0
                    }
                };
            }
            
            const data = shipment.data;
            
            if (data.summary) {
                return {
                    success: true,
                    data: {
                        totalSoldItems: data.summary.soldItems?.length || 0,
                        soldItems: data.soldItems || [],
                        totalSoldValue: data.summary.totalSoldValue || 0,
                        soldItemsList: data.soldItems || []
                    }
                };
            }
            
            const soldItems = (data.items || []).filter(item => item.isSold);
            const totalSoldValue = soldItems.reduce((sum, item) => {
                return sum + ((item.originalQuantity || item.quantity) * (item.productSnapshot?.price || 0));
            }, 0);
            
            return {
                success: true,
                data: {
                    totalSoldItems: soldItems.length,
                    soldItems,
                    totalSoldValue,
                    soldItemsList: soldItems
                }
            };
        } catch (error) {
            console.error('Error getting sold items summary:', error);
            return {
                success: true,
                data: {
                    totalSoldItems: 0,
                    soldItems: [],
                    totalSoldValue: 0,
                    soldItemsList: []
                }
            };
        }
    },

    // Get returnable items summary (unsold, unprocessed items only)
    getReturnableItemsSummary: async (id) => {
        try {
            const shipment = await shipmentService.getShipmentById(id);
            
            if (!shipment.success || !shipment.data) {
                return {
                    success: true,
                    data: {
                        totalReturnableItems: 0,
                        returnableItems: [],
                        totalPendingReturns: 0
                    }
                };
            }
            
            const data = shipment.data;
            
            if (data.summary) {
                return {
                    success: true,
                    data: {
                        totalReturnableItems: data.summary.returnableItems?.length || 0,
                        returnableItems: data.returnableItems || [],
                        totalPendingReturns: data.summary.pendingReturns || 0,
                        returnableItemsList: data.returnableItems || []
                    }
                };
            }
            
            const returnableItems = (data.items || []).filter(item => !item.isSold && !item.isProcessed);
            const totalPendingReturns = returnableItems.reduce((sum, item) => {
                return sum + (item.quantity - (item.returnedQuantity || 0));
            }, 0);
            
            return {
                success: true,
                data: {
                    totalReturnableItems: returnableItems.length,
                    returnableItems,
                    totalPendingReturns,
                    returnableItemsList: returnableItems
                }
            };
        } catch (error) {
            console.error('Error getting returnable items summary:', error);
            return {
                success: true,
                data: {
                    totalReturnableItems: 0,
                    returnableItems: [],
                    totalPendingReturns: 0,
                    returnableItemsList: []
                }
            };
        }
    },

    // Get shipment summary with both sold and returnable items
    getShipmentItemsSummary: async (id) => {
        try {
            const [soldSummary, returnableSummary] = await Promise.all([
                shipmentService.getSoldItemsSummary(id),
                shipmentService.getReturnableItemsSummary(id)
            ]);
            
            return {
                success: true,
                data: {
                    sold: soldSummary.data,
                    returnable: returnableSummary.data,
                    totalItems: soldSummary.data.totalSoldItems + returnableSummary.data.totalReturnableItems
                }
            };
        } catch (error) {
            console.error('Error getting shipment items summary:', error);
            
            try {
                const shipment = await shipmentService.getShipmentById(id);
                if (!shipment.success || !shipment.data) {
                    throw new Error('Shipment not found');
                }
                
                const data = shipment.data;
                const soldItems = (data.items || []).filter(item => item.isSold);
                const returnableItems = (data.items || []).filter(item => !item.isSold && !item.isProcessed);
                
                return {
                    success: true,
                    data: {
                        sold: {
                            totalSoldItems: soldItems.length,
                            soldItems,
                            totalSoldValue: soldItems.reduce((sum, item) => {
                                return sum + ((item.originalQuantity || item.quantity) * (item.productSnapshot?.price || 0));
                            }, 0),
                            soldItemsList: soldItems
                        },
                        returnable: {
                            totalReturnableItems: returnableItems.length,
                            returnableItems,
                            totalPendingReturns: returnableItems.reduce((sum, item) => {
                                return sum + (item.quantity - (item.returnedQuantity || 0));
                            }, 0),
                            returnableItemsList: returnableItems
                        },
                        totalItems: data.items?.length || 0
                    }
                };
            } catch (fallbackError) {
                return {
                    success: true,
                    data: {
                        sold: {
                            totalSoldItems: 0,
                            soldItems: [],
                            totalSoldValue: 0,
                            soldItemsList: []
                        },
                        returnable: {
                            totalReturnableItems: 0,
                            returnableItems: [],
                            totalPendingReturns: 0,
                            returnableItemsList: []
                        },
                        totalItems: 0
                    }
                };
            }
        }
    },

    // Return items - ISANG BESES LANG!
    returnItems: async (id, returnData) => {
        try {
            console.log('Return items request - ID:', id);
            console.log('Return items data:', JSON.stringify(returnData, null, 2));
            
            if (!returnData.items || !Array.isArray(returnData.items) || returnData.items.length === 0) {
                throw new Error('Please provide items to return');
            }
            
            const formattedData = {
                items: returnData.items.map(item => ({
                    itemIndex: item.itemIndex,
                    quantity: Number(item.quantity)
                })),
                condition: returnData.condition || 'good',
                remarks: returnData.remarks || '',
                autoSold: returnData.autoSold || true // Default to true
            };
            
            console.log('Sending formatted return data:', JSON.stringify(formattedData, null, 2));
            
            const response = await api.post(`/shipments/${id}/return`, formattedData);
            console.log('Return items response:', response.data);
            return response.data;
        } catch (error) {
            console.error('Error returning items:', error);
            console.error('Error response:', error.response?.data);
            console.error('Error status:', error.response?.status);
            
            if (error.response?.data) {
                console.error('Server error message:', error.response.data.message || error.response.data);
            }
            
            const errorMessage = error.response?.data?.message || 
                               error.response?.data?.error ||
                               error.message || 
                               'Failed to return items';
            throw new Error(errorMessage);
        }
    },

    // Check if shipment has processed items
    hasProcessedItems: async (id) => {
        try {
            const response = await api.get(`/shipments/${id}/has-processed`);
            return response.data;
        } catch (error) {
            console.error('Error checking processed items:', error);
            return {
                success: true,
                data: {
                    hasProcessed: false,
                    hasReturns: false,
                    hasSold: false,
                    hasBeenProcessed: false,
                    canProcess: true
                }
            };
        }
    },

    // Update loading details
    updateLoadingDetails: async (id, data) => {
        try {
            const response = await api.put(`/shipments/${id}/loading`, data);
            return response.data;
        } catch (error) {
            console.error('Error updating loading details:', error);
            throw error.response?.data || error.message;
        }
    },

    // Update ingress details
    updateIngressDetails: async (id, data) => {
        try {
            const response = await api.put(`/shipments/${id}/ingress`, data);
            return response.data;
        } catch (error) {
            console.error('Error updating ingress details:', error);
            throw error.response?.data || error.message;
        }
    },

    // Update egress details
    updateEgressDetails: async (id, data) => {
        try {
            const response = await api.put(`/shipments/${id}/egress`, data);
            return response.data;
        } catch (error) {
            console.error('Error updating egress details:', error);
            throw error.response?.data || error.message;
        }
    },

    // Add item to shipment
    addItem: async (shipmentId, itemData) => {
        try {
            const formattedItem = {
                itemDescription: itemData.productName || itemData.itemDescription || 'Product',
                itemOtherDetails: itemData.itemOtherDetails || '',
                quantity: Number(itemData.quantity),
                unit: itemData.unit || 'pcs',
                details: itemData.details || itemData.location || '',
                toBeReturned: itemData.returnable === 'yes' ? true : 
                             itemData.returnable === 'no' ? false : 
                             itemData.toBeReturned || false,
                product: itemData.productId || itemData.product,
                location: itemData.location || 'BALAGTAS',
                remarks: itemData.remarks || ''
            };
            
            const response = await api.post(`/shipments/${shipmentId}/items`, formattedItem);
            return response.data;
        } catch (error) {
            console.error('Error adding item to shipment:', error);
            throw error.response?.data || error.message;
        }
    },

    // Update item in shipment
    updateItem: async (shipmentId, itemId, itemData) => {
        try {
            const response = await api.put(`/shipments/${shipmentId}/items/${itemId}`, itemData);
            return response.data;
        } catch (error) {
            console.error('Error updating item in shipment:', error);
            throw error.response?.data || error.message;
        }
    },

    // Remove item from shipment
    removeItem: async (shipmentId, itemId) => {
        try {
            const response = await api.delete(`/shipments/${shipmentId}/items/${itemId}`);
            return response.data;
        } catch (error) {
            console.error('Error removing item from shipment:', error);
            throw error.response?.data || error.message;
        }
    },

    // Update shipment status
    updateStatus: async (id, status) => {
        try {
            const response = await api.put(`/shipments/${id}/status`, { status });
            return response.data;
        } catch (error) {
            console.error('Error updating shipment status:', error);
            throw error.response?.data || error.message;
        }
    },

    // Update approvals
    updateApprovals: async (id, approvalData) => {
        try {
            const response = await api.put(`/shipments/${id}/approvals`, approvalData);
            return response.data;
        } catch (error) {
            console.error('Error updating approvals:', error);
            throw error.response?.data || error.message;
        }
    },

    // Get shipment statistics
    getShipmentStats: async () => {
        try {
            const response = await api.get('/shipments/stats');
            return response.data;
        } catch (error) {
            console.error('Error fetching shipment stats:', error);
            throw error.response?.data || error.message;
        }
    },

    // Get shipments by product
    getShipmentsByProduct: async (productId) => {
        try {
            const response = await api.get(`/shipments/product/${productId}`);
            return response.data;
        } catch (error) {
            console.error('Error fetching shipments by product:', error);
            throw error.response?.data || error.message;
        }
    },

    // Get shipments by date range
    getShipmentsByDateRange: async (startDate, endDate) => {
        try {
            const response = await api.get('/shipments/date-range', {
                params: { startDate, endDate }
            });
            return response.data;
        } catch (error) {
            console.error('Error fetching shipments by date range:', error);
            throw error.response?.data || error.message;
        }
    },

    // Validate stock before shipment
    validateStock: async (data) => {
        try {
            console.log('Validating stock with data:', data);
            const response = await api.post('/shipments/validate-stock', data);
            console.log('Validate stock response:', response.data);
            return response.data;
        } catch (error) {
            console.error('Error validating stock:', error);
            console.error('Error response:', error.response?.data);
            console.error('Error status:', error.response?.status);
            
            return {
                success: true,
                data: {
                    allAvailable: true,
                    results: []
                }
            };
        }
    },

    // Get shipments by status
    getShipmentsByStatus: async (status) => {
        try {
            const statusParam = Array.isArray(status) ? status.join(',') : status;
            const response = await api.get('/shipments', {
                params: { status: statusParam }
            });
            return response.data;
        } catch (error) {
            console.error('Error fetching shipments by status:', error);
            throw error.response?.data || error.message;
        }
    },

    // Get shipments by destination
    getShipmentsByDestination: async (destination) => {
        try {
            const response = await api.get('/shipments', {
                params: { destination }
            });
            return response.data;
        } catch (error) {
            console.error('Error fetching shipments by destination:', error);
            throw error.response?.data || error.message;
        }
    },

    // Get shipments requiring return
    getReturnableShipments: async () => {
        try {
            const response = await api.get('/shipments', {
                params: { 
                    status: ['completed', 'partially_returned']
                }
            });
            return response.data;
        } catch (error) {
            console.error('Error fetching returnable shipments:', error);
            return {
                success: true,
                data: [],
                count: 0
            };
        }
    },

    // Get shipments with pending returns
    getShipmentsWithPendingReturns: async () => {
        try {
            const pendingReturns = await shipmentService.getPendingReturns();
            return pendingReturns;
        } catch (error) {
            console.error('Error in getShipmentsWithPendingReturns:', error);
            
            try {
                const allShipments = await shipmentService.getShipments();
                let shipmentsData = [];
                
                if (allShipments?.data) {
                    shipmentsData = Array.isArray(allShipments.data) 
                        ? allShipments.data 
                        : allShipments.data.data || [];
                }
                
                const filtered = shipmentsData.filter(shipment => {
                    return shipment.items?.some(item => 
                        !item.isSold && !item.isProcessed && (item.returnedQuantity || 0) < item.quantity
                    );
                });
                
                return {
                    success: true,
                    data: filtered,
                    count: filtered.length
                };
            } catch (fallbackError) {
                console.error('Fallback also failed:', fallbackError);
                return {
                    success: true,
                    data: [],
                    count: 0
                };
            }
        }
    },

    // Get shipment counts by status
    getShipmentCounts: async () => {
        try {
            const response = await api.get('/shipments/stats');
            return response.data;
        } catch (error) {
            console.error('Error fetching shipment counts:', error);
            
            try {
                const allShipments = await shipmentService.getShipments();
                let shipments = [];
                
                if (allShipments?.data) {
                    shipments = Array.isArray(allShipments.data) 
                        ? allShipments.data 
                        : allShipments.data.data || [];
                }
                
                const counts = {
                    draft: shipments.filter(s => s.status === 'draft').length,
                    pending: shipments.filter(s => s.status === 'pending').length,
                    loading: shipments.filter(s => s.status === 'loading').length,
                    ingress: shipments.filter(s => s.status === 'ingress').length,
                    egress: shipments.filter(s => s.status === 'egress').length,
                    completed: shipments.filter(s => s.status === 'completed').length,
                    cancelled: shipments.filter(s => s.status === 'cancelled').length,
                    partially_returned: shipments.filter(s => s.status === 'partially_returned').length,
                    fully_returned: shipments.filter(s => s.status === 'fully_returned').length,
                    total: shipments.length
                };
                
                return {
                    success: true,
                    data: counts
                };
            } catch (fallbackError) {
                return {
                    success: true,
                    data: {
                        draft: 0, pending: 0, loading: 0, ingress: 0, egress: 0,
                        completed: 0, cancelled: 0, partially_returned: 0, 
                        fully_returned: 0, total: 0
                    }
                };
            }
        }
    },

    // Get shipment details with items
    getShipmentDetails: async (id) => {
        try {
            const response = await shipmentService.getShipmentById(id);
            return response;
        } catch (error) {
            console.error('Error fetching shipment details:', error);
            throw error;
        }
    },

    // Clone shipment
    cloneShipment: async (id) => {
        try {
            const original = await shipmentService.getShipmentById(id);
            
            if (!original.success || !original.data) {
                throw new Error('Original shipment not found');
            }
            
            const shipmentData = original.data;
            
            delete shipmentData._id;
            delete shipmentData.id;
            delete shipmentData.shipmentNumber;
            delete shipmentData.createdAt;
            delete shipmentData.updatedAt;
            delete shipmentData.createdBy;
            delete shipmentData.updatedBy;
            delete shipmentData.hasBeenProcessed;
            delete shipmentData.processedDate;
            delete shipmentData.processedBy;
            
            shipmentData.status = 'draft';
            
            if (shipmentData.approvals) {
                Object.keys(shipmentData.approvals).forEach(key => {
                    if (shipmentData.approvals[key]) {
                        shipmentData.approvals[key] = {
                            name: '',
                            signature: '',
                            date: null,
                            user: null
                        };
                    }
                });
            }
            
            if (shipmentData.items) {
                shipmentData.items.forEach(item => {
                    item.returnedQuantity = 0;
                    item.returnStatus = 'pending';
                    item.isSold = false;
                    item.soldQuantity = 0;
                    item.givenAwayQuantity = 0;
                    item.permanentlyDeletedQuantity = 0;
                    item.totalProcessed = 0;
                    item.pendingQuantity = item.quantity;
                    item.isProcessed = false;
                    item.autoSold = false;
                    item.originalQuantity = item.quantity;
                });
            }
            
            shipmentData.returnedItems = [];
            shipmentData.soldItems = [];
            shipmentData.givenAwayItems = [];
            shipmentData.permanentlyDeletedItems = [];
            shipmentData.autoSoldApplied = false;
            
            return await shipmentService.createShipment(shipmentData);
        } catch (error) {
            console.error('Error cloning shipment:', error);
            throw error;
        }
    },

    // Print shipment
    printShipment: async (id) => {
        try {
            const response = await api.get(`/shipments/${id}/print`, {
                responseType: 'blob'
            });
            return response.data;
        } catch (error) {
            console.error('Error printing shipment:', error);
            throw error;
        }
    },

    // Export shipments
    exportShipments: async (format = 'csv', params = {}) => {
        try {
            const response = await api.get('/shipments/export', {
                params: { ...params, format },
                responseType: 'blob'
            });
            return response.data;
        } catch (error) {
            console.error('Error exporting shipments:', error);
            throw error;
        }
    },

    // Get shipment timeline
    getShipmentTimeline: async (id) => {
        try {
            const response = await api.get(`/shipments/${id}/timeline`);
            return response.data;
        } catch (error) {
            console.error('Error fetching shipment timeline:', error);
            
            try {
                const shipment = await shipmentService.getShipmentById(id);
                if (!shipment.success || !shipment.data) {
                    throw new Error('Shipment not found');
                }
                
                const data = shipment.data;
                const timeline = [];
                
                if (data.createdAt) {
                    timeline.push({
                        status: 'created',
                        date: data.createdAt,
                        description: 'Shipment created'
                    });
                }
                
                if (data.loadingDetails?.date) {
                    timeline.push({
                        status: 'loading',
                        date: data.loadingDetails.date,
                        description: 'Loading started',
                        person: data.loadingDetails.personInCharge?.name
                    });
                }
                
                if (data.ingressDetails?.date) {
                    timeline.push({
                        status: 'ingress',
                        date: data.ingressDetails.date,
                        description: 'Ingress completed',
                        person: data.ingressDetails.personInCharge?.name
                    });
                }
                
                if (data.egressDetails?.date) {
                    timeline.push({
                        status: 'egress',
                        date: data.egressDetails.date,
                        description: 'Egress completed',
                        person: data.egressDetails.personInCharge?.name
                    });
                }
                
                if (data.status === 'completed' && !data.egressDetails?.date) {
                    timeline.push({
                        status: 'completed',
                        date: data.updatedAt || data.createdAt,
                        description: 'Shipment completed'
                    });
                }
                
                if (data.returnedItems && data.returnedItems.length > 0) {
                    data.returnedItems.forEach(returnItem => {
                        timeline.push({
                            status: 'returned',
                            date: returnItem.returnedDate,
                            description: `${returnItem.quantity} of "${returnItem.itemDescription}" returned (${returnItem.condition})`,
                            person: returnItem.receivedBy?.name
                        });
                    });
                }
                
                if (data.soldItems && data.soldItems.length > 0) {
                    data.soldItems.forEach(soldItem => {
                        timeline.push({
                            status: 'sold',
                            date: soldItem.soldDate,
                            description: `${soldItem.quantity} of "${soldItem.itemDescription}" marked as sold`,
                            person: soldItem.soldBy?.name
                        });
                    });
                }
                
                if (data.processedDate) {
                    timeline.push({
                        status: 'processed',
                        date: data.processedDate,
                        description: 'Shipment processing completed',
                        person: data.processedBy?.name
                    });
                }
                
                return {
                    success: true,
                    data: timeline.sort((a, b) => new Date(b.date) - new Date(a.date))
                };
            } catch (fallbackError) {
                console.error('Fallback timeline generation failed:', fallbackError);
                return {
                    success: true,
                    data: []
                };
            }
        }
    },

    // Get return history for a shipment
    getReturnHistory: async (id) => {
        try {
            const response = await api.get(`/shipments/${id}/returns`);
            return response.data;
        } catch (error) {
            console.error('Error fetching return history:', error);
            
            try {
                const shipment = await shipmentService.getShipmentById(id);
                if (!shipment.success || !shipment.data) {
                    throw new Error('Shipment not found');
                }
                
                return {
                    success: true,
                    data: shipment.data.returnedItems || []
                };
            } catch (fallbackError) {
                return {
                    success: true,
                    data: []
                };
            }
        }
    },

    // Get items pending return for a shipment (unsold, unprocessed items only)
    getPendingReturnItems: async (id) => {
        try {
            const response = await api.get(`/shipments/${id}/pending-returns`);
            return response.data;
        } catch (error) {
            console.error('Error fetching pending return items:', error);
            
            try {
                const shipment = await shipmentService.getShipmentById(id);
                if (!shipment.success || !shipment.data) {
                    throw new Error('Shipment not found');
                }
                
                const pendingItems = (shipment.data.items || [])
                    .filter(item => !item.isSold && !item.isProcessed)
                    .map((item, index) => {
                        const pendingQty = item.quantity - (item.returnedQuantity || 0);
                        return {
                            ...item,
                            index,
                            pendingQuantity: pendingQty,
                            isFullyReturned: pendingQty === 0
                        };
                    })
                    .filter(item => item.pendingQuantity > 0);
                
                return {
                    success: true,
                    data: pendingItems
                };
            } catch (fallbackError) {
                return {
                    success: true,
                    data: []
                };
            }
        }
    },

    // Bulk return items
    bulkReturnItems: async (returns) => {
        try {
            const results = [];
            const errors = [];
            
            for (const returnItem of returns) {
                try {
                    const result = await shipmentService.returnItems(
                        returnItem.shipmentId,
                        {
                            items: returnItem.items,
                            condition: returnItem.condition,
                            remarks: returnItem.remarks,
                            autoSold: true
                        }
                    );
                    results.push(result);
                } catch (error) {
                    errors.push({
                        shipmentId: returnItem.shipmentId,
                        error: error.message
                    });
                }
            }
            
            return {
                success: true,
                data: {
                    successful: results,
                    failed: errors
                }
            };
        } catch (error) {
            console.error('Error in bulk return:', error);
            throw error;
        }
    },

    // Get shipment summary for dashboard
    getShipmentSummary: async () => {
        try {
            const [stats, pendingReturns] = await Promise.all([
                shipmentService.getShipmentStats(),
                shipmentService.getShipmentsWithPendingReturns()
            ]);
            
            const soldStats = stats?.data?.soldStats || { totalSoldQuantity: 0, totalSoldValue: 0 };
            
            return {
                success: true,
                data: {
                    stats: stats.data || {},
                    pendingReturns: pendingReturns.data || [],
                    pendingCount: pendingReturns.count || 0,
                    soldStats: {
                        totalSoldQuantity: soldStats.totalSoldQuantity || 0,
                        totalSoldValue: soldStats.totalSoldValue || 0
                    }
                }
            };
        } catch (error) {
            console.error('Error getting shipment summary:', error);
            return {
                success: true,
                data: {
                    stats: {},
                    pendingReturns: [],
                    pendingCount: 0,
                    soldStats: {
                        totalSoldQuantity: 0,
                        totalSoldValue: 0
                    }
                }
            };
        }
    },

    // Get all sold items across all shipments
    getAllSoldItems: async (params = {}) => {
        try {
            const shipments = await shipmentService.getShipments(params);
            let shipmentsData = [];
            
            if (shipments?.data) {
                shipmentsData = Array.isArray(shipments.data) 
                    ? shipments.data 
                    : shipments.data.data || [];
            }
            
            const soldItems = [];
            
            shipmentsData.forEach(shipment => {
                (shipment.items || []).forEach(item => {
                    if (item.isSold) {
                        soldItems.push({
                            ...item,
                            shipmentNumber: shipment.shipmentNumber,
                            shipmentId: shipment._id,
                            shipmentDate: shipment.createdAt,
                            destination: shipment.truckDriver?.destination,
                            requestedBy: shipment.requestedBy
                        });
                    }
                });
            });
            
            return {
                success: true,
                data: soldItems,
                count: soldItems.length
            };
        } catch (error) {
            console.error('Error getting all sold items:', error);
            return {
                success: true,
                data: [],
                count: 0
            };
        }
    },

    // Get sold items statistics
    getSoldItemsStats: async () => {
        try {
            const stats = await shipmentService.getShipmentStats();
            return {
                success: true,
                data: stats?.data?.soldStats || {
                    totalSoldQuantity: 0,
                    totalSoldValue: 0
                }
            };
        } catch (error) {
            console.error('Error getting sold items stats:', error);
            
            try {
                const soldItems = await shipmentService.getAllSoldItems();
                const totalSoldQuantity = soldItems.data.reduce((sum, item) => {
                    return sum + (item.originalQuantity || item.quantity || 0);
                }, 0);
                
                const totalSoldValue = soldItems.data.reduce((sum, item) => {
                    return sum + ((item.originalQuantity || item.quantity || 0) * (item.productSnapshot?.price || 0));
                }, 0);
                
                return {
                    success: true,
                    data: {
                        totalSoldQuantity,
                        totalSoldValue
                    }
                };
            } catch (fallbackError) {
                return {
                    success: true,
                    data: {
                        totalSoldQuantity: 0,
                        totalSoldValue: 0
                    }
                };
            }
        }
    }
};

// Export individual functions for direct import
export const {
    getShipments,
    getShipmentById,
    getShipmentByNumber,
    getPendingReturns,
    createShipment,
    updateShipment,
    deleteShipment,
    returnItems,
    markRemainingAsSold,
    markItemsAsSold,
    getAvailableForReturn,
    getItemReturnHistory,
    getSoldItemsSummary,
    getReturnableItemsSummary,
    getShipmentItemsSummary,
    getAllSoldItems,
    getSoldItemsStats,
    hasProcessedItems,
    updateLoadingDetails,
    updateIngressDetails,
    updateEgressDetails,
    addItem,
    updateItem,
    removeItem,
    updateStatus,
    updateApprovals,
    getShipmentStats,
    getShipmentsByProduct,
    getShipmentsByDateRange,
    validateStock,
    getShipmentsByStatus,
    getShipmentsByDestination,
    getReturnableShipments,
    getShipmentsWithPendingReturns,
    getShipmentCounts,
    getShipmentDetails,
    cloneShipment,
    printShipment,
    exportShipments,
    getShipmentTimeline,
    getReturnHistory,
    getPendingReturnItems,
    bulkReturnItems,
    getShipmentSummary
} = shipmentService;

export default shipmentService;