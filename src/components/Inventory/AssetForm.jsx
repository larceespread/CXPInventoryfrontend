// components/Inventory/AssetForm.jsx
import React, { useState, useEffect } from 'react';
import { X, Save, Plus, Trash2, Package, MapPin, Tag, DollarSign, Box, Truck, Send } from 'lucide-react';
import toast from 'react-hot-toast';
import { categoryService } from '../../services/categoryService';
import { brandService } from '../../services/brandService';
import { approvalService } from '../../services/approvalService';
import { useAuth } from '../../context/AuthContext';
import { useApproval } from '../../context/ApprovalContext';
import Loader from '../common/Loader';

const AssetForm = ({ 
  item, 
  mode, 
  onClose, 
  onSubmit, 
  onDelete,
  onStockIn,
  onStockOut
}) => {
  const { user } = useAuth();
  const { createApprovalRequest } = useApproval();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [submittingForApproval, setSubmittingForApproval] = useState(false);
  
  // Check if user needs approval (cashier and staff need approval)
  const needsApproval = user?.role === 'cashier' || user?.role === 'staff';
  
  // Separate state for adding stock to specific locations
  const [addStockInputs, setAddStockInputs] = useState({
    BALAGTAS: 0,
    MARILAO: 0
  });

  const sources = [
    { value: 'Office Inventory', label: 'Office Inventory' },
    { value: 'Direct supplier', label: 'Direct Supplier' },
    { value: 'Local Supplier', label: 'Local Supplier' },
    { value: 'Other', label: 'Other' }
  ];

  const [formData, setFormData] = useState({
    name: '',
    brand: '',
    category: '',
    itemType: 'merchandise',
    storageLocations: [
      { location: 'BALAGTAS', quantity: 0, reorderLevel: 10 },
      { location: 'MARILAO', quantity: 0, reorderLevel: 10 }
    ],
    costPrice: 0,
    sellingPrice: 0,
    productCode: '',
    barcode: '',
    description: '',
    unit: 'pcs',
    source: 'Office Inventory'
  });

  useEffect(() => {
    fetchCategories();
    fetchBrands();
  }, []);

  useEffect(() => {
    if (item && mode === 'edit') {
      console.log('Loading item for edit:', item);
      
      let brandId = '';
      if (item.brand) {
        if (typeof item.brand === 'object' && item.brand !== null) {
          brandId = item.brand._id || item.brand.id || '';
        } else {
          brandId = item.brand;
        }
      }

      let categoryId = '';
      if (item.category) {
        if (typeof item.category === 'object' && item.category !== null) {
          categoryId = item.category._id || item.category.id || '';
        } else {
          categoryId = item.category;
        }
      }

      // Initialize storage locations - ensure both locations are present
      let storageLocations = [];
      
      if (item.storageLocations && Array.isArray(item.storageLocations) && item.storageLocations.length > 0) {
        // Use existing storage locations but ensure both BALAGTAS and MARILAO are present
        const balagtasLoc = item.storageLocations.find(loc => loc.location === 'BALAGTAS');
        const marilaoLoc = item.storageLocations.find(loc => loc.location === 'MARILAO');
        
        storageLocations = [
          { 
            location: 'BALAGTAS', 
            quantity: balagtasLoc ? (Number(balagtasLoc.quantity) || 0) : 0,
            reorderLevel: balagtasLoc ? (Number(balagtasLoc.reorderLevel) || 10) : 10
          },
          { 
            location: 'MARILAO', 
            quantity: marilaoLoc ? (Number(marilaoLoc.quantity) || 0) : 0,
            reorderLevel: marilaoLoc ? (Number(marilaoLoc.reorderLevel) || 10) : 10
          }
        ];
      } else {
        // If no storage locations, create from legacy fields
        storageLocations = [
          { 
            location: 'BALAGTAS', 
            quantity: item.storageLocation === 'BALAGTAS' ? (Number(item.quantity) || 0) : 0,
            reorderLevel: Number(item.reorderLevel) || 10
          },
          { 
            location: 'MARILAO', 
            quantity: item.storageLocation === 'MARILAO' ? (Number(item.quantity) || 0) : 0,
            reorderLevel: Number(item.reorderLevel) || 10
          }
        ];
      }

      setFormData({
        name: item.name || '',
        brand: brandId,
        category: categoryId,
        itemType: item.itemType || 'merchandise',
        storageLocations: storageLocations,
        costPrice: Number(item.costPrice) || 0,
        sellingPrice: Number(item.sellingPrice) || 0,
        productCode: item.productCode || '',
        barcode: item.barcode || '',
        description: item.description || '',
        unit: item.unit || 'pcs',
        source: item.source || 'Office Inventory'
      });

      // Initialize add stock inputs to 0 for both locations
      setAddStockInputs({
        BALAGTAS: 0,
        MARILAO: 0
      });
    }
  }, [item, mode]);

  const fetchCategories = async () => {
    try {
      const response = await categoryService.getCategories();
      const categoriesData = response.data || response || [];
      setCategories(Array.isArray(categoriesData) ? categoriesData : []);
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast.error('Failed to load categories');
    }
  };

  const fetchBrands = async () => {
    try {
      const response = await brandService.getBrands();
      const brandsData = response.data || response || [];
      setBrands(Array.isArray(brandsData) ? brandsData : []);
    } catch (error) {
      console.error('Error fetching brands:', error);
      toast.error('Failed to load brands');
    }
  };

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? (value === '' ? 0 : parseFloat(value)) : value
    }));
  };

  const handleAddStockChange = (location, value) => {
    setAddStockInputs(prev => ({
      ...prev,
      [location]: value === '' ? 0 : parseInt(value) || 0
    }));
  };

  const handleLocationQuantityChange = (location, value) => {
    setFormData(prev => ({
      ...prev,
      storageLocations: prev.storageLocations.map(loc => 
        loc.location === location ? { ...loc, quantity: parseFloat(value) || 0 } : loc
      )
    }));
  };

  const handleLocationReorderChange = (location, value) => {
    setFormData(prev => ({
      ...prev,
      storageLocations: prev.storageLocations.map(loc => 
        loc.location === location ? { ...loc, reorderLevel: parseFloat(value) || 10 } : loc
      )
    }));
  };

  const submitForApproval = async () => {
    if (!validateForm()) return;

    setSubmittingForApproval(true);
    try {
      // Update quantities with add stock inputs
      const updatedStorageLocations = formData.storageLocations.map(loc => ({
        ...loc,
        quantity: Number(loc.quantity) + (Number(addStockInputs[loc.location]) || 0)
      }));

      // Prepare data for approval
      const approvalData = {
        requestType: mode,
        data: {
          ...formData,
          storageLocations: updatedStorageLocations,
          costPrice: Number(formData.costPrice) || 0,
          sellingPrice: Number(formData.sellingPrice) || 0,
        },
        originalData: mode === 'edit' ? item : null,
        itemId: mode === 'edit' ? (item?._id || item?.id) : null,
        notes: `Request to ${mode} item: ${formData.name}`
      };

      // Add optional fields if they exist
      if (formData.productCode?.trim()) {
        approvalData.data.productCode = formData.productCode.trim();
      }
      
      if (formData.barcode?.trim()) {
        approvalData.data.barcode = formData.barcode.trim();
      }
      
      if (formData.description?.trim()) {
        approvalData.data.description = formData.description.trim();
      }

      await createApprovalRequest(approvalData);
      
      onClose();
    } catch (error) {
      console.error('Approval submission error:', error);
      toast.error(error.message || 'Failed to submit for approval');
    } finally {
      setSubmittingForApproval(false);
    }
  };

  const validateForm = () => {
    if (!formData.name?.trim()) {
      toast.error('Item name is required');
      return false;
    }
    if (!formData.brand) {
      toast.error('Please select a brand');
      return false;
    }
    if (!formData.category) {
      toast.error('Please select a category');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    // If user needs approval (cashier/staff), submit for approval instead
    if (needsApproval) {
      await submitForApproval();
      return;
    }

    // Update quantities with add stock inputs
    const updatedStorageLocations = formData.storageLocations.map(loc => ({
      ...loc,
      quantity: Number(loc.quantity) + (Number(addStockInputs[loc.location]) || 0)
    }));

    setLoading(true);
    try {
      // PREPARE SUBMIT DATA
      const submitData = {
        name: formData.name.trim(),
        brand: formData.brand,
        category: formData.category,
        itemType: formData.itemType || 'merchandise',
        storageLocations: updatedStorageLocations.map(loc => ({
          location: loc.location,
          quantity: Number(loc.quantity) || 0,
          reorderLevel: Number(loc.reorderLevel) || 10
        })),
        costPrice: Number(formData.costPrice) || 0,
        sellingPrice: Number(formData.sellingPrice) || 0,
        unit: formData.unit || 'pcs',
        source: formData.source || 'Office Inventory'
      };

      // Add optional fields if they exist
      if (formData.productCode?.trim()) {
        submitData.productCode = formData.productCode.trim();
      }
      
      if (formData.barcode?.trim()) {
        submitData.barcode = formData.barcode.trim();
      }
      
      if (formData.description?.trim()) {
        submitData.description = formData.description.trim();
      }

      // For edit mode, add ID
      if (mode === 'edit' && item) {
        const itemId = item._id || item.id;
        if (!itemId) {
          throw new Error('Item ID not found');
        }
        submitData.id = itemId;
        submitData._id = itemId;
      }

      console.log('🚀 Submitting form data:', submitData);
      
      await onSubmit(submitData);
      
      onClose();
    } catch (error) {
      console.error('❌ Form submission error:', error);
      
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error ||
                          error.message || 
                          'Failed to save item';
      
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to delete ${item ? item.name : 'this item'}?`)) {
      if (needsApproval) {
        // Submit delete for approval
        submitDeleteForApproval();
      } else {
        onDelete(item);
      }
    }
  };

  const submitDeleteForApproval = async () => {
    setSubmittingForApproval(true);
    try {
      const approvalData = {
        requestType: 'delete',
        data: item,
        itemId: item._id || item.id,
        notes: `Request to delete item: ${item.name}`
      };

      await createApprovalRequest(approvalData);
      toast.success('Delete request submitted for approval');
      onClose();
    } catch (error) {
      console.error('Delete approval error:', error);
      toast.error('Failed to submit delete request');
    } finally {
      setSubmittingForApproval(false);
    }
  };

  const getTitle = () => {
    switch(mode) {
      case 'create': return needsApproval ? 'Request New Item' : 'Add New Item';
      case 'edit': return needsApproval ? 'Request Edit Item' : 'Edit Item';
      default: return 'Asset Form';
    }
  };

  const getTotalQuantity = () => {
    const baseTotal = formData.storageLocations.reduce((sum, loc) => sum + (Number(loc.quantity) || 0), 0);
    const addTotal = Object.values(addStockInputs).reduce((sum, val) => sum + (Number(val) || 0), 0);
    return baseTotal + addTotal;
  };

  const getLocationQuantity = (location) => {
    const loc = formData.storageLocations.find(l => l.location === location);
    return loc ? Number(loc.quantity) || 0 : 0;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto transition-colors duration-200">
        <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{getTitle()}</h2>
            {needsApproval && (
              <p className="text-sm text-yellow-600 dark:text-yellow-400 mt-1 flex items-center gap-1">
                <Send className="h-3 w-3" />
                This will be submitted for approval
              </p>
            )}
            {item && mode === 'edit' && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Total Stock: {getTotalQuantity()}
              </p>
            )}
          </div>
          <button 
            onClick={onClose} 
            className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="space-y-4">
            <h3 className="text-md font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
              <Package className="h-4 w-4" />
              Basic Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Item Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name || ''}
                  onChange={handleChange}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-md py-2 px-3 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  placeholder="Enter item name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Product Code
                </label>
                <input
                  type="text"
                  name="productCode"
                  value={formData.productCode || ''}
                  onChange={handleChange}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-md py-2 px-3 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  placeholder="Auto-generated if empty"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description || ''}
                onChange={handleChange}
                rows="3"
                className="w-full border border-gray-300 dark:border-gray-600 rounded-md py-2 px-3 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                placeholder="Enter item description"
              />
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <h3 className="text-md font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
              <Tag className="h-4 w-4" />
              Classification
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Brand <span className="text-red-500">*</span>
                </label>
                <select
                  name="brand"
                  value={formData.brand || ''}
                  onChange={handleChange}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-md py-2 px-3 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  required
                >
                  <option value="">Select Brand</option>
                  {Array.isArray(brands) && brands.map(brand => (
                    <option key={brand._id || brand.id} value={brand._id || brand.id}>
                      {brand.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Category <span className="text-red-500">*</span>
                </label>
                <select
                  name="category"
                  value={formData.category || ''}
                  onChange={handleChange}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-md py-2 px-3 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  required
                >
                  <option value="">Select Category</option>
                  {Array.isArray(categories) && categories.map(cat => (
                    <option key={cat._id || cat.id} value={cat._id || cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Unit
                </label>
                <select
                  name="unit"
                  value={formData.unit || 'pcs'}
                  onChange={handleChange}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-md py-2 px-3 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                  <option value="pcs">Pieces (pcs)</option>
                  <option value="box">Box</option>
                  <option value="pack">Pack</option>
                  <option value="set">Set</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Source
                </label>
                <select
                  name="source"
                  value={formData.source || 'Office Inventory'}
                  onChange={handleChange}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-md py-2 px-3 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                  {sources.map(source => (
                    <option key={source.value} value={source.value}>
                      {source.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <h3 className="text-md font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Inventory by Location
            </h3>

            {/* BALAGTAS Location */}
            <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg border-l-4 border-blue-500">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  <span className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-blue-500" />
                    BALAGTAS Warehouse
                  </span>
                </label>
                <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded">
                  Current: {getLocationQuantity('BALAGTAS')}
                </span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
                
                <div>
                  <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                    Add Stock
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={addStockInputs.BALAGTAS || 0}
                    onChange={(e) => handleAddStockChange('BALAGTAS', e.target.value)}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-md py-2 px-3 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    placeholder="0"
                  />
                </div>

                
              </div>
              
              {addStockInputs.BALAGTAS > 0 && (
                <p className="text-xs text-green-600 dark:text-green-400 mt-2">
                  New total will be: {(Number(formData.storageLocations.find(l => l.location === 'BALAGTAS')?.quantity) || 0) + (Number(addStockInputs.BALAGTAS) || 0)}
                </p>
              )}
            </div>

            {/* MARILAO Location */}
            <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg border-l-4 border-green-500">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  <span className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-green-500" />
                    MARILAO Warehouse
                  </span>
                </label>
                <span className="text-xs bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-2 py-1 rounded">
                  Current: {getLocationQuantity('MARILAO')}
                </span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
           
                
                <div>
                  <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                    Add Stock
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={addStockInputs.MARILAO || 0}
                    onChange={(e) => handleAddStockChange('MARILAO', e.target.value)}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-md py-2 px-3 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    placeholder="0"
                  />
                </div>

              
              </div>
              
              {addStockInputs.MARILAO > 0 && (
                <p className="text-xs text-green-600 dark:text-green-400 mt-2">
                  New total will be: {(Number(formData.storageLocations.find(l => l.location === 'MARILAO')?.quantity) || 0) + (Number(addStockInputs.MARILAO) || 0)}
                </p>
              )}
            </div>
          </div>

       

          <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <h3 className="text-md font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
              <Box className="h-4 w-4" />
              Additional Information
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Barcode
                </label>
                <input
                  type="text"
                  name="barcode"
                  value={formData.barcode || ''}
                  onChange={handleChange}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-md py-2 px-3 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  placeholder="Optional"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
            
            {mode === 'edit' && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={submittingForApproval}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm font-medium flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {needsApproval ? 'Request Delete' : 'Delete'}
              </button>
            )}
            
            <button
              type="submit"
              disabled={loading || submittingForApproval}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading || submittingForApproval ? (
                <>
                  <Loader size="small" color="white" />
                  <span className="ml-2">Processing...</span>
                </>
              ) : (
                <>
                  {needsApproval ? <Send className="h-4 w-4 mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                  {needsApproval 
                    ? (mode === 'create' ? 'Request Add' : 'Request Update')
                    : (mode === 'create' ? 'Add Item' : 'Update Item')}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AssetForm;