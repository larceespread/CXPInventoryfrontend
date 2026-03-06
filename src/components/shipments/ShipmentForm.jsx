// ShipmentForm.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  Package, 
  Truck, 
  Plus,
  Trash2,
  Save,
  X,
  Search,
  Loader,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  CheckCircle,
  Info,
  Filter
} from 'lucide-react';
import { useShipment } from '../../context/ShipmentContext';
import { productService } from '../../services/productService';
import toast from 'react-hot-toast';

// Local storage keys
const STORAGE_KEYS = {
  FORM_DATA: 'shipment_form_data',
  ITEM_QUANTITIES: 'shipment_item_quantities',
  ITEM_OTHER_DETAILS: 'shipment_item_other_details',
  ITEM_UNITS: 'shipment_item_units',
  ITEM_RETURNABLES: 'shipment_item_returnables',
  ITEM_REMARK_LIST: 'shipment_item_remark_list',
  ITEM_SELECTED_LOCATION: 'shipment_item_selected_location',
  EXPANDED_ITEMS: 'shipment_expanded_items',
  SELECTED_PRODUCTS: 'shipment_selected_products',
  ITEM_LOCATION: 'shipment_item_location',
  SEARCH_TERM: 'shipment_search_term',
  BULK_QUANTITY: 'shipment_bulk_quantity',
  BULK_DETAILS: 'shipment_bulk_details',
  BULK_UNIT: 'shipment_bulk_unit',
  BULK_RETURNABLE: 'shipment_bulk_returnable',
  BULK_REMARKS: 'shipment_bulk_remarks',
  STOCK_FILTER: 'shipment_stock_filter',
  LOCATION_FILTER: 'shipment_location_filter',
  TIMESTAMP: 'shipment_form_timestamp'
};

// Helper functions
const getProductName = (product) => {
  if (!product) return 'Unknown Product';
  return product.name || product.productName || product.title || `Product (${product._id?.slice(-6) || ''})`;
};

const getProductId = (product) => {
  if (!product) return null;
  return product._id || product.id || null;
};

const getProductSku = (product) => {
  if (!product) return 'N/A';
  return product.sku || product.productCode || 'N/A';
};

const getProductPrice = (product) => {
  if (!product) return 0;
  return Number(product.sellingPrice || product.costPrice || 0);
};

const getStockAtLocation = (product, location) => {
  if (!product || !location) return 0;
  
  const storageLocations = product.storageLocations || [];
  const locationStock = storageLocations.find(
    loc => loc && loc.location === location
  );
  
  return locationStock?.quantity || 0;
};

const getAllLocationsStock = (product) => {
  if (!product || !product.storageLocations) return [];
  
  return product.storageLocations
    .filter(loc => loc && loc.location && loc.quantity > 0)
    .map(loc => ({
      location: loc.location,
      quantity: loc.quantity || 0
    }));
};

// Helper to save to localStorage with timestamp
const saveToLocalStorage = (key, data) => {
  try {
    const item = {
      data,
      timestamp: Date.now()
    };
    localStorage.setItem(key, JSON.stringify(item));
  } catch (error) {
    console.error('Error saving to localStorage:', error);
  }
};

// Helper to load from localStorage with expiration (24 hours)
const loadFromLocalStorage = (key, maxAge = 24 * 60 * 60 * 1000) => {
  try {
    const item = localStorage.getItem(key);
    if (!item) return null;
    
    const parsed = JSON.parse(item);
    const now = Date.now();
    
    if (now - parsed.timestamp > maxAge) {
      localStorage.removeItem(key);
      return null;
    }
    
    return parsed.data;
  } catch (error) {
    console.error('Error loading from localStorage:', error);
    return null;
  }
};

// Clear all shipment form storage
const clearShipmentStorage = () => {
  Object.values(STORAGE_KEYS).forEach(key => {
    localStorage.removeItem(key);
  });
};

const ShipmentForm = ({ shipment: propShipment, onSuccess, onCancel, inline = false }) => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { createShipment, updateShipment, fetchShipmentById, currentShipment, loading } = useShipment();
  
  // Confirmation dialog state
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  
  // Determine if we're editing and which shipment to use
  const isEditing = !!(id || propShipment);
  const shipmentData = propShipment || currentShipment;
  
  // Form state matching Gate Pass design
  const [formData, setFormData] = useState(() => {
    // Try to load from localStorage first
    const savedFormData = !isEditing ? loadFromLocalStorage(STORAGE_KEYS.FORM_DATA) : null;
    
    return savedFormData || {
      name: '',
      department: '',
      datePrepared: new Date().toISOString().split('T')[0],
      datesCovered: '',
      purpose: '',
      noteOrRequest: '',
      items: [],
      truckDriver: {
        name: '',
        contactNumber: '',
        destination: ''
      }
    };
  });

  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState(() => {
    return loadFromLocalStorage(STORAGE_KEYS.SEARCH_TERM) || '';
  });
  const [selectedProducts, setSelectedProducts] = useState(() => {
    return loadFromLocalStorage(STORAGE_KEYS.SELECTED_PRODUCTS) || [];
  });
  const [itemLocation, setItemLocation] = useState(() => {
    return loadFromLocalStorage(STORAGE_KEYS.ITEM_LOCATION) || 'BALAGTAS';
  });
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingIndex, setEditingIndex] = useState(-1);
  const [loadError, setLoadError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const [selectAll, setSelectAll] = useState(false);
  const [showBulkForm, setShowBulkForm] = useState(false);
  const [expandedItems, setExpandedItems] = useState(() => {
    return loadFromLocalStorage(STORAGE_KEYS.EXPANDED_ITEMS) || {};
  });
  const [stockFilter, setStockFilter] = useState(() => {
    return loadFromLocalStorage(STORAGE_KEYS.STOCK_FILTER) || 'all';
  });
  const [locationFilter, setLocationFilter] = useState(() => {
    return loadFromLocalStorage(STORAGE_KEYS.LOCATION_FILTER) || 'all';
  });
  
  // Individual item quantities and details
  const [itemQuantities, setItemQuantities] = useState(() => {
    return loadFromLocalStorage(STORAGE_KEYS.ITEM_QUANTITIES) || {};
  });
  const [itemOtherDetails, setItemOtherDetails] = useState(() => {
    return loadFromLocalStorage(STORAGE_KEYS.ITEM_OTHER_DETAILS) || {};
  });
  const [itemUnits, setItemUnits] = useState(() => {
    return loadFromLocalStorage(STORAGE_KEYS.ITEM_UNITS) || {};
  });
  const [itemReturnables, setItemReturnables] = useState(() => {
    return loadFromLocalStorage(STORAGE_KEYS.ITEM_RETURNABLES) || {};
  });
  const [itemRemarkList, setItemRemarkList] = useState(() => {
    return loadFromLocalStorage(STORAGE_KEYS.ITEM_REMARK_LIST) || {};
  });
  const [itemSelectedLocation, setItemSelectedLocation] = useState(() => {
    return loadFromLocalStorage(STORAGE_KEYS.ITEM_SELECTED_LOCATION) || {};
  });
  const [quantityErrors, setQuantityErrors] = useState({});
  
  const unitOptions = [
    { value: 'pcs', label: 'Pieces (pcs)' },
    { value: 'box', label: 'Box' },
    { value: 'pack', label: 'Pack' },
    { value: 'set', label: 'Set' },
    { value: 'unit', label: 'Unit' },
    { value: 'meter', label: 'Meter' },
    { value: 'kg', label: 'Kilogram' }
  ];

  const locationOptions = [
    { value: 'BALAGTAS', label: 'Balagtas Warehouse' },
    { value: 'MARILAO', label: 'Marilao Warehouse' }
  ];

  // Bulk options state
  const [bulkQuantity, setBulkQuantity] = useState(() => {
    return loadFromLocalStorage(STORAGE_KEYS.BULK_QUANTITY) || 1;
  });
  const [bulkDetails, setBulkDetails] = useState(() => {
    return loadFromLocalStorage(STORAGE_KEYS.BULK_DETAILS) || '';
  });
  const [bulkUnit, setBulkUnit] = useState(() => {
    return loadFromLocalStorage(STORAGE_KEYS.BULK_UNIT) || 'pcs';
  });
  const [bulkReturnable, setBulkReturnable] = useState(() => {
    return loadFromLocalStorage(STORAGE_KEYS.BULK_RETURNABLE) || 'no';
  });
  const [bulkRemarks, setBulkRemarks] = useState(() => {
    return loadFromLocalStorage(STORAGE_KEYS.BULK_REMARKS) || '';
  });

  // Save form data to localStorage whenever it changes (only for new shipments)
  useEffect(() => {
    if (!isEditing) {
      saveToLocalStorage(STORAGE_KEYS.FORM_DATA, formData);
    }
  }, [formData, isEditing]);

  // Save other states to localStorage
  useEffect(() => {
    saveToLocalStorage(STORAGE_KEYS.ITEM_QUANTITIES, itemQuantities);
  }, [itemQuantities]);

  useEffect(() => {
    saveToLocalStorage(STORAGE_KEYS.ITEM_OTHER_DETAILS, itemOtherDetails);
  }, [itemOtherDetails]);

  useEffect(() => {
    saveToLocalStorage(STORAGE_KEYS.ITEM_UNITS, itemUnits);
  }, [itemUnits]);

  useEffect(() => {
    saveToLocalStorage(STORAGE_KEYS.ITEM_RETURNABLES, itemReturnables);
  }, [itemReturnables]);

  useEffect(() => {
    saveToLocalStorage(STORAGE_KEYS.ITEM_REMARK_LIST, itemRemarkList);
  }, [itemRemarkList]);

  useEffect(() => {
    saveToLocalStorage(STORAGE_KEYS.ITEM_SELECTED_LOCATION, itemSelectedLocation);
  }, [itemSelectedLocation]);

  useEffect(() => {
    saveToLocalStorage(STORAGE_KEYS.EXPANDED_ITEMS, expandedItems);
  }, [expandedItems]);

  useEffect(() => {
    saveToLocalStorage(STORAGE_KEYS.SELECTED_PRODUCTS, selectedProducts);
  }, [selectedProducts]);

  useEffect(() => {
    saveToLocalStorage(STORAGE_KEYS.ITEM_LOCATION, itemLocation);
  }, [itemLocation]);

  useEffect(() => {
    saveToLocalStorage(STORAGE_KEYS.SEARCH_TERM, searchTerm);
  }, [searchTerm]);

  useEffect(() => {
    saveToLocalStorage(STORAGE_KEYS.BULK_QUANTITY, bulkQuantity);
  }, [bulkQuantity]);

  useEffect(() => {
    saveToLocalStorage(STORAGE_KEYS.BULK_DETAILS, bulkDetails);
  }, [bulkDetails]);

  useEffect(() => {
    saveToLocalStorage(STORAGE_KEYS.BULK_UNIT, bulkUnit);
  }, [bulkUnit]);

  useEffect(() => {
    saveToLocalStorage(STORAGE_KEYS.BULK_RETURNABLE, bulkReturnable);
  }, [bulkReturnable]);

  useEffect(() => {
    saveToLocalStorage(STORAGE_KEYS.BULK_REMARKS, bulkRemarks);
  }, [bulkRemarks]);

  useEffect(() => {
    saveToLocalStorage(STORAGE_KEYS.STOCK_FILTER, stockFilter);
  }, [stockFilter]);

  useEffect(() => {
    saveToLocalStorage(STORAGE_KEYS.LOCATION_FILTER, locationFilter);
  }, [locationFilter]);

  // Load shipment if editing
  useEffect(() => {
    if (id) {
      loadShipment();
    } else if (propShipment) {
      // If shipment is passed as prop (for inline editing)
      setFormData({
        name: propShipment.requestedBy || '',
        department: propShipment.department || '',
        datePrepared: propShipment.datePrepared?.split('T')[0] || new Date().toISOString().split('T')[0],
        datesCovered: propShipment.datesCovered || '',
        purpose: propShipment.purpose || '',
        noteOrRequest: propShipment.noteOrRequest || propShipment.notes || '',
        items: propShipment.items?.map(item => ({
          ...item,
          productId: item.product?._id || item.product,
          itemDescription: item.itemDescription || item.product?.name || 'Unknown',
          itemOtherDetails: item.itemOtherDetails || '',
          quantity: item.quantity || 1,
          unit: item.unit || 'pcs',
          details: item.details || '',
          returnable: item.toBeReturned ? 'yes' : 'no',
          remarks: item.remarks || '',
          location: item.location || 'BALAGTAS'
        })) || [],
        truckDriver: propShipment.truckDriver || {
          name: '',
          contactNumber: '',
          destination: ''
        }
      });
    }
  }, [id, propShipment]);

  useEffect(() => {
    if (currentShipment && id) {
      setFormData({
        name: currentShipment.requestedBy || '',
        department: currentShipment.department || '',
        datePrepared: currentShipment.datePrepared?.split('T')[0] || new Date().toISOString().split('T')[0],
        datesCovered: currentShipment.datesCovered || '',
        purpose: currentShipment.purpose || '',
        noteOrRequest: currentShipment.noteOrRequest || currentShipment.notes || '',
        items: currentShipment.items?.map(item => ({
          ...item,
          productId: item.product?._id || item.product,
          itemDescription: item.itemDescription || item.product?.name || 'Unknown',
          itemOtherDetails: item.itemOtherDetails || '',
          quantity: item.quantity || 1,
          unit: item.unit || 'pcs',
          details: item.details || '',
          returnable: item.toBeReturned ? 'yes' : 'no',
          remarks: item.remarks || '',
          location: item.location || 'BALAGTAS'
        })) || [],
        truckDriver: currentShipment.truckDriver || {
          name: '',
          contactNumber: '',
          destination: ''
        }
      });
    }
  }, [currentShipment, id]);

  useEffect(() => {
    if (showProductModal) {
      loadProducts();
      // Don't reset modal state when opening to preserve selections
    }
  }, [showProductModal, retryCount]);

  const resetModalState = () => {
    setSelectedProducts([]);
    setSelectAll(false);
    setShowBulkForm(false);
    setItemQuantities({});
    setItemOtherDetails({});
    setItemUnits({});
    setItemReturnables({});
    setItemRemarkList({});
    setItemSelectedLocation({});
    setExpandedItems({});
    setQuantityErrors({});
    setBulkQuantity(1);
    setBulkDetails('');
    setBulkUnit('pcs');
    setBulkReturnable('no');
    setBulkRemarks('');
    
    // Clear localStorage for modal-related items
    localStorage.removeItem(STORAGE_KEYS.SELECTED_PRODUCTS);
    localStorage.removeItem(STORAGE_KEYS.ITEM_QUANTITIES);
    localStorage.removeItem(STORAGE_KEYS.ITEM_OTHER_DETAILS);
    localStorage.removeItem(STORAGE_KEYS.ITEM_UNITS);
    localStorage.removeItem(STORAGE_KEYS.ITEM_RETURNABLES);
    localStorage.removeItem(STORAGE_KEYS.ITEM_REMARK_LIST);
    localStorage.removeItem(STORAGE_KEYS.ITEM_SELECTED_LOCATION);
    localStorage.removeItem(STORAGE_KEYS.EXPANDED_ITEMS);
    localStorage.removeItem(STORAGE_KEYS.BULK_QUANTITY);
    localStorage.removeItem(STORAGE_KEYS.BULK_DETAILS);
    localStorage.removeItem(STORAGE_KEYS.BULK_UNIT);
    localStorage.removeItem(STORAGE_KEYS.BULK_RETURNABLE);
    localStorage.removeItem(STORAGE_KEYS.BULK_REMARKS);
  };

  const loadShipment = async () => {
    try {
      await fetchShipmentById(id);
    } catch (error) {
      toast.error('Failed to load shipment');
      if (!inline) {
        navigate('/shipments');
      }
    }
  };

  const loadProducts = async (search = '') => {
    setProductsLoading(true);
    setLoadError(null);
    try {
      const params = {
        limit: 100,
        sort: 'name'
      };
      
      if (search) {
        params.search = search;
      }
      
      const response = await productService.getProducts(params);
      
      let productsArray = [];
      
      if (response?.data && Array.isArray(response.data)) {
        productsArray = response.data;
      } else if (Array.isArray(response)) {
        productsArray = response;
      } else if (response?.products && Array.isArray(response.products)) {
        productsArray = response.products;
      }
      
      setProducts(productsArray);
      
      if (productsArray.length === 0) {
        setLoadError('No products found. Please add products to inventory first.');
      }
      
    } catch (error) {
      setLoadError(error.message || 'Failed to load products');
      toast.error('Failed to load products');
      setProducts([]);
    } finally {
      setProductsLoading(false);
    }
  };

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    setLoadError(null);
    loadProducts(searchTerm);
  };

  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    loadProducts(value);
  };

  const validateQuantity = (productId, quantity, location) => {
    const product = products.find(p => getProductId(p) === productId);
    if (!product) return true;
    
    const availableStock = getStockAtLocation(product, location);
    const error = quantity > availableStock ? `Only ${availableStock} available` : null;
    
    setQuantityErrors(prev => ({
      ...prev,
      [productId]: error
    }));
    
    return !error;
  };

  const handleSelectProduct = (product) => {
    const productId = getProductId(product);
    const defaultLocation = itemLocation;
    
    setSelectedProducts(prev => {
      const isSelected = prev.some(p => getProductId(p) === productId);
      if (isSelected) {
        // Remove product and its associated data
        const newSelected = prev.filter(p => getProductId(p) !== productId);
        
        // Clean up individual item data
        const newQuantities = { ...itemQuantities };
        const newDetails = { ...itemOtherDetails };
        const newUnits = { ...itemUnits };
        const newReturnables = { ...itemReturnables };
        const newRemarks = { ...itemRemarkList };
        const newLocations = { ...itemSelectedLocation };
        const newExpanded = { ...expandedItems };
        const newErrors = { ...quantityErrors };
        
        delete newQuantities[productId];
        delete newDetails[productId];
        delete newUnits[productId];
        delete newReturnables[productId];
        delete newRemarks[productId];
        delete newLocations[productId];
        delete newExpanded[productId];
        delete newErrors[productId];
        
        setItemQuantities(newQuantities);
        setItemOtherDetails(newDetails);
        setItemUnits(newUnits);
        setItemReturnables(newReturnables);
        setItemRemarkList(newRemarks);
        setItemSelectedLocation(newLocations);
        setExpandedItems(newExpanded);
        setQuantityErrors(newErrors);
        
        return newSelected;
      } else {
        // Add product with default values
        const defaultQty = 1;
        setItemQuantities(prev => ({ ...prev, [productId]: defaultQty }));
        setItemOtherDetails(prev => ({ ...prev, [productId]: '' }));
        setItemUnits(prev => ({ ...prev, [productId]: 'pcs' }));
        setItemReturnables(prev => ({ ...prev, [productId]: 'no' }));
        setItemRemarkList(prev => ({ ...prev, [productId]: '' }));
        setItemSelectedLocation(prev => ({ ...prev, [productId]: defaultLocation }));
        setExpandedItems(prev => ({ ...prev, [productId]: true })); // Auto-expand for quantity input
        
        // Validate initial quantity
        validateQuantity(productId, defaultQty, defaultLocation);
        
        return [...prev, product];
      }
    });
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedProducts([]);
      setItemQuantities({});
      setItemOtherDetails({});
      setItemUnits({});
      setItemReturnables({});
      setItemRemarkList({});
      setItemSelectedLocation({});
      setExpandedItems({});
      setQuantityErrors({});
    } else {
      setSelectedProducts([...products]);
      
      // Initialize all products with default values
      const newQuantities = {};
      const newDetails = {};
      const newUnits = {};
      const newReturnables = {};
      const newRemarks = {};
      const newLocations = {};
      const newExpanded = {};
      const newErrors = {};
      
      products.forEach(product => {
        const productId = getProductId(product);
        const defaultQty = 1;
        newQuantities[productId] = defaultQty;
        newDetails[productId] = '';
        newUnits[productId] = 'pcs';
        newReturnables[productId] = 'no';
        newRemarks[productId] = '';
        newLocations[productId] = itemLocation;
        newExpanded[productId] = false;
        
        // Validate initial quantity
        const availableStock = getStockAtLocation(product, itemLocation);
        if (defaultQty > availableStock) {
          newErrors[productId] = `Only ${availableStock} available`;
        }
      });
      
      setItemQuantities(newQuantities);
      setItemOtherDetails(newDetails);
      setItemUnits(newUnits);
      setItemReturnables(newReturnables);
      setItemRemarkList(newRemarks);
      setItemSelectedLocation(newLocations);
      setExpandedItems(newExpanded);
      setQuantityErrors(newErrors);
    }
    setSelectAll(!selectAll);
  };

  const toggleExpandItem = (productId) => {
    setExpandedItems(prev => ({
      ...prev,
      [productId]: !prev[productId]
    }));
  };

  const updateItemQuantity = (productId, value) => {
    const quantity = parseInt(value) || 1;
    if (quantity >= 1) {
      setItemQuantities(prev => ({ ...prev, [productId]: quantity }));
      
      // Validate quantity against selected location
      const location = itemSelectedLocation[productId] || itemLocation;
      validateQuantity(productId, quantity, location);
    }
  };

  const updateItemLocation = (productId, location) => {
    setItemSelectedLocation(prev => ({ ...prev, [productId]: location }));
    
    // Re-validate quantity with new location
    const quantity = itemQuantities[productId] || 1;
    validateQuantity(productId, quantity, location);
  };

  const updateItemOtherDetails = (productId, value) => {
    setItemOtherDetails(prev => ({ ...prev, [productId]: value }));
  };

  const updateItemUnit = (productId, value) => {
    setItemUnits(prev => ({ ...prev, [productId]: value }));
  };

  const updateItemReturnable = (productId, value) => {
    setItemReturnables(prev => ({ ...prev, [productId]: value }));
  };

  const updateItemRemarks = (productId, value) => {
    setItemRemarkList(prev => ({ ...prev, [productId]: value }));
  };

  const applyBulkToAll = () => {
    const newQuantities = { ...itemQuantities };
    const newDetails = { ...itemOtherDetails };
    const newUnits = { ...itemUnits };
    const newReturnables = { ...itemReturnables };
    const newRemarks = { ...itemRemarkList };
    const newLocations = { ...itemSelectedLocation };
    const newErrors = { ...quantityErrors };
    
    selectedProducts.forEach(product => {
      const productId = getProductId(product);
      newQuantities[productId] = bulkQuantity;
      newDetails[productId] = bulkDetails;
      newUnits[productId] = bulkUnit;
      newReturnables[productId] = bulkReturnable;
      newRemarks[productId] = bulkRemarks;
      newLocations[productId] = itemLocation;
      
      // Validate bulk quantity
      const availableStock = getStockAtLocation(product, itemLocation);
      if (bulkQuantity > availableStock) {
        newErrors[productId] = `Only ${availableStock} available`;
      } else {
        delete newErrors[productId];
      }
    });
    
    setItemQuantities(newQuantities);
    setItemOtherDetails(newDetails);
    setItemUnits(newUnits);
    setItemReturnables(newReturnables);
    setItemRemarkList(newRemarks);
    setItemSelectedLocation(newLocations);
    setQuantityErrors(newErrors);
    
    toast.success('Bulk settings applied to all selected items');
  };

  const getFilteredProducts = () => {
    let filtered = [...products];
    
    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(product => 
        getProductName(product).toLowerCase().includes(searchTerm.toLowerCase()) ||
        getProductSku(product).toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Apply stock filter
    if (stockFilter !== 'all') {
      filtered = filtered.filter(product => {
        const totalStock = getAllLocationsStock(product).reduce((sum, loc) => sum + loc.quantity, 0);
        
        switch(stockFilter) {
          case 'inStock':
            return totalStock > 0;
          case 'lowStock':
            return totalStock > 0 && totalStock <= 10;
          case 'outOfStock':
            return totalStock === 0;
          default:
            return true;
        }
      });
    }
    
    // Apply location filter
    if (locationFilter !== 'all') {
      filtered = filtered.filter(product => {
        const stockAtLocation = getStockAtLocation(product, locationFilter);
        return stockAtLocation > 0;
      });
    }
    
    return filtered;
  };

  const getStockStatusColor = (product) => {
    const totalStock = getAllLocationsStock(product).reduce((sum, loc) => sum + loc.quantity, 0);
    
    if (totalStock === 0) return 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/20';
    if (totalStock <= 10) return 'text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900/20';
    return 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/20';
  };

  const handleAddMultipleItems = () => {
    if (selectedProducts.length === 0) {
      toast.error('Please select at least one product');
      return;
    }

    // Check for quantity errors
    const hasErrors = Object.values(quantityErrors).some(error => error !== null);
    if (hasErrors) {
      toast.error('Please fix quantity errors before adding items');
      return;
    }

    const newItems = [];

    selectedProducts.forEach(product => {
      const productId = getProductId(product);
      const productName = getProductName(product);

      if (!productId) {
        toast.error(`Invalid product: ${productName}`);
        return;
      }

      const quantity = itemQuantities[productId] || 1;
      const details = itemOtherDetails[productId] || '';
      const unit = itemUnits[productId] || 'pcs';
      const returnable = itemReturnables[productId] || 'no';
      const remarks = itemRemarkList[productId] || '';
      const location = itemSelectedLocation[productId] || itemLocation;

      // Check if quantity exceeds available stock
      const availableStock = getStockAtLocation(product, location);
      if (quantity > availableStock) {
        toast.error(`${productName}: Only ${availableStock} available at ${location}`);
        return;
      }

      const newItem = {
        itemDescription: productName,
        itemOtherDetails: details,
        product: productId,
        productId: productId,
        quantity: quantity,
        unit: unit,
        details: location,
        returnable: returnable,
        remarks: remarks,
        location: location,
        productName: productName,
        sku: getProductSku(product)
      };

      newItems.push(newItem);
    });

    if (newItems.length > 0) {
      setFormData({
        ...formData,
        items: [...formData.items, ...newItems]
      });
      toast.success(`${newItems.length} item(s) added to shipment`);
    }

    // Reset modal
    resetModalState();
    setShowProductModal(false);
    setSearchTerm('');
  };

  const handleEditItem = (index) => {
    const item = formData.items[index];
    if (item) {
      productService.getProduct(item.productId).then(product => {
        const productData = product.data || product;
        const productId = getProductId(productData);
        setSelectedProducts([productData]);
        setItemQuantities({ [productId]: item.quantity || 1 });
        setItemOtherDetails({ [productId]: item.itemOtherDetails || '' });
        setItemUnits({ [productId]: item.unit || 'pcs' });
        setItemReturnables({ [productId]: item.returnable || 'no' });
        setItemRemarkList({ [productId]: item.remarks || '' });
        setItemSelectedLocation({ [productId]: item.location || 'BALAGTAS' });
        setItemLocation(item.location || 'BALAGTAS');
        setEditingIndex(index);
        setShowProductModal(true);
      }).catch(() => {
        toast.error('Failed to load product details');
      });
    }
  };

  const handleUpdateItem = () => {
    if (selectedProducts.length === 0) {
      toast.error('Please select a product');
      return;
    }

    const product = selectedProducts[0];
    const productId = getProductId(product);
    const productName = getProductName(product);

    if (!productId) {
      toast.error('Invalid product selected');
      return;
    }

    const quantity = itemQuantities[productId] || 1;
    const location = itemSelectedLocation[productId] || itemLocation;
    
    if (quantity < 1) {
      toast.error('Quantity must be at least 1');
      return;
    }

    // Check if quantity exceeds available stock
    const availableStock = getStockAtLocation(product, location);
    if (quantity > availableStock) {
      toast.error(`Only ${availableStock} available at ${location}`);
      return;
    }

    const updatedItem = {
      itemDescription: productName,
      itemOtherDetails: itemOtherDetails[productId] || '',
      product: productId,
      productId: productId,
      quantity: quantity,
      unit: itemUnits[productId] || 'pcs',
      details: location,
      returnable: itemReturnables[productId] || 'no',
      remarks: itemRemarkList[productId] || '',
      location: location,
      productName: productName,
      sku: getProductSku(product)
    };

    const updatedItems = [...formData.items];
    updatedItems[editingIndex] = updatedItem;
    setFormData({ ...formData, items: updatedItems });
    setEditingIndex(-1);
    toast.success(`${productName} updated`);

    // Reset modal
    resetModalState();
    setItemLocation('BALAGTAS');
    setShowProductModal(false);
    setSearchTerm('');
  };

  const handleRemoveItem = (index) => {
    const updatedItems = formData.items.filter((_, i) => i !== index);
    setFormData({ ...formData, items: updatedItems });
    toast.success('Item removed');
  };

  // Handle submit click - show confirmation for new shipments
  const handleSubmitClick = (e) => {
    e.preventDefault();

    // Validate form first
    if (formData.items.length === 0) {
      toast.error('Please add at least one item');
      return;
    }

    if (!formData.name) {
      toast.error('Please enter name');
      return;
    }

    if (!formData.truckDriver.name) {
      toast.error('Please enter driver name');
      return;
    }

    if (!formData.truckDriver.destination) {
      toast.error('Please enter destination');
      return;
    }

    // Show confirmation dialog for new shipments
    if (!isEditing) {
      setShowConfirmDialog(true);
    } else {
      // For editing, submit directly
      handleSubmit();
    }
  };

  const handleSubmit = async () => {
    setShowConfirmDialog(false);

    try {
      // Format data for backend with proper returnable field
      const submissionData = {
        type: 'OUTGOING',
        shipmentNumber: isEditing ? shipmentData?.shipmentNumber : `SHP-${new Date().getFullYear().toString().slice(-2)}${(new Date().getMonth() + 1).toString().padStart(2, '0')}${new Date().getDate().toString().padStart(2, '0')}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
        requestedBy: formData.name,
        department: formData.department,
        datePrepared: formData.datePrepared,
        datesCovered: formData.datesCovered,
        purpose: formData.purpose,
        noteOrRequest: formData.noteOrRequest,
        notes: formData.noteOrRequest,
        items: formData.items.map(item => ({
          itemDescription: item.itemDescription,
          itemOtherDetails: item.itemOtherDetails || '',
          product: item.productId,
          quantity: Number(item.quantity),
          unit: item.unit || 'pcs',
          location: item.location || 'BALAGTAS',
          details: item.details || item.location || '',
          toBeReturned: item.returnable === 'yes' ? true : false,
          remarks: item.remarks || ''
        })),
        truckDriver: {
          name: formData.truckDriver.name,
          contactNumber: formData.truckDriver.contactNumber || '',
          destination: formData.truckDriver.destination
        }
      };

      console.log('Submitting shipment:', submissionData);

      if (isEditing) {
        const shipmentId = id || propShipment?._id;
        await updateShipment(shipmentId, submissionData);
        toast.success('Shipment updated successfully');
      } else {
        await createShipment(submissionData);
        toast.success('Shipment created successfully');
      }
      
      // Clear localStorage after successful submission (only for new shipments)
      if (!isEditing) {
        clearShipmentStorage();
      }
      
      // Call onSuccess callback if provided (for inline mode)
      if (onSuccess) {
        onSuccess();
      } else {
        navigate('/shipments');
      }
    } catch (error) {
      console.error('Error saving shipment:', error);
      toast.error(error.message || 'Failed to save shipment');
    }
  };

  // Handle cancel - clear localStorage
  const handleCancel = () => {
    if (!isEditing) {
      clearShipmentStorage();
    }
    
    if (onCancel) {
      onCancel();
    } else {
      navigate('/shipments');
    }
  };

  if (loading && id) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  const filteredProducts = getFilteredProducts();

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow transition-colors duration-200 ${inline ? '' : 'mt-6'}`}>
      {/* Header - Gate Pass Style */}
      {!inline && (
        <div className="px-6 py-4 border-b-2 border-gray-300 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white uppercase tracking-wide">
              GATE PASS
            </h1>
            <button
              onClick={handleCancel}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmitClick} className="p-6">
        {/* Header Information - Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 border-b border-gray-200 dark:border-gray-700 pb-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                NAME
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                placeholder="Enter name"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Date Prepared:
              </label>
              <input
                type="date"
                value={formData.datePrepared}
                onChange={(e) => setFormData({ ...formData, datePrepared: e.target.value })}
                className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                required
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                DEPARTMENT
              </label>
              <input
                type="text"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                placeholder="Enter department"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Dates Covered:
              </label>
              <input
                type="text"
                value={formData.datesCovered}
                onChange={(e) => setFormData({ ...formData, datesCovered: e.target.value })}
                className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                placeholder="e.g., Jan 1-5, 2024"
              />
            </div>
          </div>

          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              PURPOSE
            </label>
            <input
              type="text"
              value={formData.purpose}
              onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
              className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              placeholder="State the purpose"
            />
          </div>

          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              NOTE OR REQUEST
            </label>
            <textarea
              value={formData.noteOrRequest}
              onChange={(e) => setFormData({ ...formData, noteOrRequest: e.target.value })}
              rows="2"
              className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              placeholder="Additional notes or requests..."
            />
          </div>
        </div>

        {/* Driver Details - New Section */}
        <div className="mb-8 border-b border-gray-200 dark:border-gray-700 pb-6">
          <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-4 flex items-center">
            <Truck className="h-5 w-5 mr-2" />
            Driver Details
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Driver Name
              </label>
              <input
                type="text"
                value={formData.truckDriver.name}
                onChange={(e) => setFormData({
                  ...formData,
                  truckDriver: { ...formData.truckDriver, name: e.target.value }
                })}
                className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                placeholder="Enter driver name"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Contact Number
              </label>
              <input
                type="text"
                value={formData.truckDriver.contactNumber}
                onChange={(e) => setFormData({
                  ...formData,
                  truckDriver: { ...formData.truckDriver, contactNumber: e.target.value }
                })}
                className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                placeholder="Enter contact number"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Destination
              </label>
              <input
                type="text"
                value={formData.truckDriver.destination}
                onChange={(e) => setFormData({
                  ...formData,
                  truckDriver: { ...formData.truckDriver, destination: e.target.value }
                })}
                className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                placeholder="Enter destination"
                required
              />
            </div>
          </div>
        </div>

        {/* Items Section - Gate Pass Style Table */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-800 dark:text-white flex items-center">
              <Package className="h-5 w-5 mr-2" />
              BREAKDOWN OF ITEMS NEEDED FOR THE EVENT
            </h3>
            <button
              type="button"
              onClick={() => {
                setEditingIndex(-1);
                setSearchTerm('');
                setShowProductModal(true);
              }}
              className="inline-flex items-center px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Item
            </button>
          </div>

          {/* Items Table - Matching Gate Pass Design */}
          {formData.items.length > 0 ? (
            <div className="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-lg">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-16">
                      No.
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      ITEM DESCRIPTION
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      ITEM OTHER DETAILS
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      QUANTITY
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      UNIT
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      DETAILS
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider" colSpan="2">
                      Are the items to be returned to CXP?
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Remarks
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {formData.items.map((item, index) => (
                    <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {index + 1}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                        {item.itemDescription || 'Unknown'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                        {item.itemOtherDetails || '-'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {item.quantity || 0}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {item.unit || 'pcs'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                        {item.details || item.location || '-'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {item.returnable === 'yes' ? 'Yes' : 'No'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {/* Empty cell for alignment */}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                        {item.remarks || '-'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          type="button"
                          onClick={() => handleEditItem(index)}
                          className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 mr-3"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(index)}
                          className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12 bg-gray-50 dark:bg-gray-700 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600">
              <Package className="h-12 w-12 mx-auto text-gray-400 dark:text-gray-500 mb-4" />
              <p className="text-gray-500 dark:text-gray-400">No items added yet</p>
              <button
                type="button"
                onClick={() => {
                  setEditingIndex(-1);
                  setSearchTerm('');
                  setShowProductModal(true);
                }}
                className="mt-4 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add First Item
              </button>
            </div>
          )}
        </div>

        {/* Notes Section - Matching Gate Pass */}
        <div className="mb-6 border-t border-gray-200 dark:border-gray-700 pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="col-span-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Notes:
              </label>
            </div>
            <div className="col-span-3">
              <textarea
                value={formData.noteOrRequest}
                onChange={(e) => setFormData({ ...formData, noteOrRequest: e.target.value })}
                rows="2"
                className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                placeholder="Additional notes..."
              />
            </div>
          </div>
        </div>

        {/* Signature Section - Matching Gate Pass */}
        <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-6 border-t border-gray-200 dark:border-gray-700 pt-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              PREPARED
            </label>
            <div className="mt-1 p-3 border border-gray-200 dark:border-gray-700 rounded-md bg-gray-50 dark:bg-gray-700">
              <p className="text-sm text-gray-600 dark:text-gray-300">{formData.name || '______________________'}</p>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              APPROVED
            </label>
            <div className="mt-1 p-3 border border-gray-200 dark:border-gray-700 rounded-md bg-gray-50 dark:bg-gray-700">
              <p className="text-sm text-gray-600 dark:text-gray-300">______________________</p>
            </div>
          </div>
          <div>
            
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end space-x-3 border-t border-gray-200 dark:border-gray-700 pt-6">
          <button
            type="button"
            onClick={handleCancel}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <Loader className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            {isEditing ? 'Update Shipment' : 'Create Shipment'}
          </button>
        </div>
      </form>

      {/* Confirmation Dialog */}
      {showConfirmDialog && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 dark:bg-opacity-80 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4 transition-colors duration-200">
            <div className="flex items-center mb-4">
              <AlertCircle className="h-6 w-6 text-yellow-500 mr-3" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Confirm Shipment Creation
              </h3>
            </div>
            
            <div className="mb-6">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Are you sure you want to create this shipment?
              </p>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowConfirmDialog(false)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
              >
                No, Cancel
              </button>
              <button
                onClick={handleSubmit}
                className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors duration-200"
              >
                Yes, Create Shipment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Product Selection Modal */}
      {showProductModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 dark:bg-opacity-80 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-hidden transition-colors duration-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                {editingIndex >= 0 ? 'Edit Item' : 'Add Items to Gate Pass'}
              </h3>
              {loadError && (
                <button
                  onClick={handleRetry}
                  className="inline-flex items-center px-3 py-1 text-sm text-blue-600 hover:text-blue-800"
                >
                  <RefreshCw className="h-4 w-4 mr-1" />
                  Retry
                </button>
              )}
            </div>

            {/* Search and Filter Controls */}
            <div className="space-y-4 mb-4">
              <div className="flex items-center space-x-4">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    placeholder="Search products by name or SKU..."
                    value={searchTerm}
                    onChange={handleSearch}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-gray-800 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    autoFocus
                  />
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                  </div>
                </div>
              </div>
            </div>

            {/* Location Selection */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Default Location
              </label>
              <select
                value={itemLocation}
                onChange={(e) => setItemLocation(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                disabled={editingIndex >= 0}
              >
                {locationOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Product List with Checkboxes and Individual Quantity Inputs */}
            <div className="mb-4 max-h-96 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-md">
              {productsLoading ? (
                <div className="flex flex-col justify-center items-center py-12">
                  <Loader className="h-8 w-8 animate-spin text-blue-500 mb-3" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">Loading products...</p>
                </div>
              ) : filteredProducts.length > 0 ? (
                <div>
                  {editingIndex === -1 && (
                    <div className="sticky top-0 bg-gray-50 dark:bg-gray-700 p-3 border-b border-gray-200 dark:border-gray-600 z-10">
                      <div className="flex items-center justify-between">
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={selectAll}
                            onChange={handleSelectAll}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Select All</span>
                          <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                            ({selectedProducts.length} selected)
                          </span>
                        </label>
                        {showBulkForm && selectedProducts.length > 0 && (
                          <button
                            type="button"
                            onClick={applyBulkToAll}
                            className="px-3 py-1 text-xs bg-green-600 text-white rounded-md hover:bg-green-700"
                          >
                            Apply to All
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                  <div className="divide-y divide-gray-200 dark:divide-gray-700">
                    {filteredProducts.map((product) => {
                      const productId = getProductId(product);
                      const displayName = getProductName(product);
                      const productSku = getProductSku(product);
                      const isSelected = selectedProducts.some(p => getProductId(p) === productId);
                      const isExpanded = expandedItems[productId] || false;
                      const availableStock = getStockAtLocation(product, itemSelectedLocation[productId] || itemLocation);
                      const allLocationsStock = getAllLocationsStock(product);
                      const hasStockIssue = quantityErrors[productId];
                      const stockStatusColor = getStockStatusColor(product);
                      
                      return (
                        <div
                          key={productId}
                          className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                            isSelected ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                          } ${hasStockIssue ? 'border-l-4 border-red-500' : ''}`}
                        >
                          <div className="flex items-start space-x-3">
                            {editingIndex === -1 ? (
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => handleSelectProduct(product)}
                                className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                              />
                            ) : (
                              <input
                                type="radio"
                                checked={isSelected}
                                onChange={() => handleSelectProduct(product)}
                                name="productSelection"
                                className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                              />
                            )}
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                                    {displayName}
                                  </p>
                                  <p className="text-xs text-gray-500 dark:text-gray-400">
                                    SKU: {productSku}
                                  </p>
                                </div>
                                <div className="flex items-center space-x-3">
                                  {/* Stock Status Badge */}
                                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${stockStatusColor}`}>
                                    <Package className="h-3 w-3 mr-1" />
                                    {allLocationsStock.reduce((sum, loc) => sum + loc.quantity, 0)} total
                                  </span>
                                  {isSelected && editingIndex === -1 && (
                                    <button
                                      type="button"
                                      onClick={() => toggleExpandItem(productId)}
                                      className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                                    >
                                      {isExpanded ? (
                                        <ChevronUp className="h-5 w-5" />
                                      ) : (
                                        <ChevronDown className="h-5 w-5" />
                                      )}
                                    </button>
                                  )}
                                </div>
                              </div>
                              
                              {/* Stock by Location */}
                              {allLocationsStock.length > 0 && (
                                <div className="mt-2 flex flex-wrap gap-2">
                                  {allLocationsStock.map((loc, idx) => (
                                    <span
                                      key={idx}
                                      className={`inline-flex items-center px-2 py-0.5 rounded text-xs ${
                                        loc.location === (itemSelectedLocation[productId] || itemLocation)
                                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
                                          : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                                      }`}
                                    >
                                      {loc.location === 'BALAGTAS' ? 'Balagtas' : 'Marilao'}: {loc.quantity}
                                    </span>
                                  ))}
                                </div>
                              )}
                              
                              {isSelected && editingIndex === -1 && (
                                <div className={`mt-3 space-y-3 transition-all ${isExpanded ? 'block' : 'hidden'}`}>
                                  <div className="grid grid-cols-2 gap-3">
                                    <div>
                                      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                                        Location
                                      </label>
                                      <select
                                        value={itemSelectedLocation[productId] || itemLocation}
                                        onChange={(e) => updateItemLocation(productId, e.target.value)}
                                        className="block w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                      >
                                        {locationOptions.map(option => {
                                          const stockAtLocation = getStockAtLocation(product, option.value);
                                          return (
                                            <option key={option.value} value={option.value} disabled={stockAtLocation === 0}>
                                              {option.label} ({stockAtLocation} available)
                                            </option>
                                          );
                                        })}
                                      </select>
                                    </div>
                                    <div>
                                      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                                        Quantity (Available: {availableStock})
                                      </label>
                                      <input
                                        type="number"
                                        min="1"
                                        max={availableStock}
                                        value={itemQuantities[productId] || 1}
                                        onChange={(e) => updateItemQuantity(productId, e.target.value)}
                                        className={`block w-full px-2 py-1 text-sm border rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white ${
                                          hasStockIssue 
                                            ? 'border-red-500 dark:border-red-500 focus:ring-red-500 focus:border-red-500' 
                                            : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500'
                                        }`}
                                      />
                                      {hasStockIssue && (
                                        <p className="mt-1 text-xs text-red-600 dark:text-red-400 flex items-center">
                                          <AlertCircle className="h-3 w-3 mr-1" />
                                          {hasStockIssue}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                  
                                  <div>
                                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                                      Unit
                                    </label>
                                    <select
                                      value={itemUnits[productId] || 'pcs'}
                                      onChange={(e) => updateItemUnit(productId, e.target.value)}
                                      className="block w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                    >
                                      {unitOptions.map(option => (
                                        <option key={option.value} value={option.value}>
                                          {option.label}
                                        </option>
                                      ))}
                                    </select>
                                  </div>
                                  
                                  <div className="grid grid-cols-2 gap-3">
                                    <div>
                                      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                                        Return to CXP?
                                      </label>
                                      <select
                                        value={itemReturnables[productId] || 'no'}
                                        onChange={(e) => updateItemReturnable(productId, e.target.value)}
                                        className="block w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                      >
                                        <option value="no">No</option>
                                        <option value="yes">Yes</option>
                                      </select>
                                    </div>
                                    <div>
                                      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                                        Remarks
                                      </label>
                                      <input
                                        type="text"
                                        value={itemRemarkList[productId] || ''}
                                        onChange={(e) => updateItemRemarks(productId, e.target.value)}
                                        className="block w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                        placeholder="Remarks"
                                      />
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  <Package className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                  <p className="text-base font-medium">No products found</p>
                  {loadError && (
                    <p className="text-sm mt-2 text-red-500 dark:text-red-400">{loadError}</p>
                  )}
                  <p className="text-sm mt-1">Try adjusting your search or filters</p>
                  <div className="flex justify-center space-x-3 mt-4">
                    <button
                      type="button"
                      onClick={handleRetry}
                      className="inline-flex items-center px-3 py-2 bg-gray-600 text-white text-sm rounded-md hover:bg-gray-700"
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Retry
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowProductModal(false);
                        navigate('/products/new');
                      }}
                      className="inline-flex items-center px-3 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add New Product
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Bulk Options Form */}
            {showBulkForm && editingIndex === -1 && selectedProducts.length > 0 && (
              <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center">
                  <Info className="h-4 w-4 mr-2 text-blue-500" />
                  Apply to all selected items
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                      Quantity
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={bulkQuantity}
                      onChange={(e) => setBulkQuantity(parseInt(e.target.value) || 1)}
                      className="block w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                      Unit
                    </label>
                    <select
                      value={bulkUnit}
                      onChange={(e) => setBulkUnit(e.target.value)}
                      className="block w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    >
                      {unitOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                      Other Details
                    </label>
                    <input
                      type="text"
                      value={bulkDetails}
                      onChange={(e) => setBulkDetails(e.target.value)}
                      className="block w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      placeholder="e.g., Color, Size"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                      Return to CXP?
                    </label>
                    <select
                      value={bulkReturnable}
                      onChange={(e) => setBulkReturnable(e.target.value)}
                      className="block w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    >
                      <option value="no">No</option>
                      <option value="yes">Yes</option>
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                      Remarks
                    </label>
                    <input
                      type="text"
                      value={bulkRemarks}
                      onChange={(e) => setBulkRemarks(e.target.value)}
                      className="block w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      placeholder="Common remarks for all items"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Edit Mode Form */}
            {editingIndex >= 0 && selectedProducts.length > 0 && (
              <div className="space-y-4 mb-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Location
                    </label>
                    <select
                      value={itemSelectedLocation[getProductId(selectedProducts[0])] || itemLocation}
                      onChange={(e) => {
                        const productId = getProductId(selectedProducts[0]);
                        updateItemLocation(productId, e.target.value);
                      }}
                      className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    >
                      {locationOptions.map(option => {
                        const stockAtLocation = getStockAtLocation(selectedProducts[0], option.value);
                        return (
                          <option key={option.value} value={option.value} disabled={stockAtLocation === 0}>
                            {option.label} ({stockAtLocation} available)
                          </option>
                        );
                      })}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Item Other Details
                    </label>
                    <input
                      type="text"
                      value={itemOtherDetails[getProductId(selectedProducts[0])] || ''}
                      onChange={(e) => {
                        const productId = getProductId(selectedProducts[0]);
                        updateItemOtherDetails(productId, e.target.value);
                      }}
                      className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      placeholder="e.g., Color, Size, Model"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Quantity
                    </label>
                    <input
                      type="number"
                      min="1"
                      max={getStockAtLocation(selectedProducts[0], itemSelectedLocation[getProductId(selectedProducts[0])] || itemLocation)}
                      value={itemQuantities[getProductId(selectedProducts[0])] || 1}
                      onChange={(e) => {
                        const productId = getProductId(selectedProducts[0]);
                        updateItemQuantity(productId, e.target.value);
                      }}
                      className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Unit
                    </label>
                    <select
                      value={itemUnits[getProductId(selectedProducts[0])] || 'pcs'}
                      onChange={(e) => {
                        const productId = getProductId(selectedProducts[0]);
                        updateItemUnit(productId, e.target.value);
                      }}
                      className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    >
                      {unitOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Return to CXP?
                  </label>
                  <div className="flex space-x-4">
                    <label className="inline-flex items-center">
                      <input
                        type="radio"
                        value="yes"
                        checked={(itemReturnables[getProductId(selectedProducts[0])] || 'no') === 'yes'}
                        onChange={(e) => {
                          const productId = getProductId(selectedProducts[0]);
                          updateItemReturnable(productId, e.target.value);
                        }}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                      />
                      <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Yes</span>
                    </label>
                    <label className="inline-flex items-center">
                      <input
                        type="radio"
                        value="no"
                        checked={(itemReturnables[getProductId(selectedProducts[0])] || 'no') === 'no'}
                        onChange={(e) => {
                          const productId = getProductId(selectedProducts[0]);
                          updateItemReturnable(productId, e.target.value);
                        }}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                      />
                      <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">No</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Remarks
                  </label>
                  <input
                    type="text"
                    value={itemRemarkList[getProductId(selectedProducts[0])] || ''}
                    onChange={(e) => {
                      const productId = getProductId(selectedProducts[0]);
                      updateItemRemarks(productId, e.target.value);
                    }}
                    className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    placeholder="Any remarks"
                  />
                </div>
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowProductModal(false);
                  resetModalState();
                  setEditingIndex(-1);
                  setSearchTerm('');
                  setLoadError(null);
                }}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={editingIndex >= 0 ? handleUpdateItem : handleAddMultipleItems}
                disabled={selectedProducts.length === 0 || Object.values(quantityErrors).some(error => error !== null)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {editingIndex >= 0 ? 'Update Item' : `Add ${selectedProducts.length} Item(s)`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShipmentForm;