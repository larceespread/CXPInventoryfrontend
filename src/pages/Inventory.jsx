// pages/Inventory.js
import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { productService } from '../services/productService';
import TotalAssets from '../components/Dashboard/TotalAssets';
// Import AvailableAsset directly instead of AvailableAssets wrapper
import AvailableAsset from '../components/Inventory/AvailableAsset';
import { Package, AlertTriangle, DollarSign, Search, Download } from 'lucide-react';
import toast from 'react-hot-toast';
import Loader from '../components/common/Loader';

const Inventory = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('total');
  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState({
    totalItems: 0,
    totalValue: 0,
    lowStock: 0,
    outOfStock: 0,
    availableItems: 0
  });

  // Load products on mount
  useEffect(() => {
    fetchProducts();
  }, []);

  // Calculate stats whenever products change
  useEffect(() => {
    calculateStats();
  }, [products]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await productService.getProducts();
      console.log('Fetched products:', response.data);
      setProducts(response.data || []);
    } catch (error) {
      setError('Failed to load inventory');
      console.error(error);
      toast.error('Failed to load inventory');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = () => {
    let totalValue = 0;
    let lowStock = 0;
    let outOfStock = 0;
    let availableItems = 0;

    products.forEach(product => {
      const quantity = product.quantity || product.qty || 0;
      const value = (product.costPrice || 0) * quantity;
      totalValue += value;

      if (quantity === 0) {
        outOfStock++;
      } else if (quantity < 10) {
        lowStock++;
      }

      if (quantity > 0 && product.status === 'in_storage') {
        availableItems++;
      }
    });

    setStats({
      totalItems: products.length,
      totalValue,
      lowStock,
      outOfStock,
      availableItems
    });
  };

  const handleStockIn = async (item, quantity, details) => {
    try {
      const updatedItem = {
        ...item,
        quantity: (item.quantity || 0) + parseInt(quantity),
        storageLocation: details.destination.toUpperCase(),
        status: 'in_storage',
        lastStockIn: {
          date: new Date(),
          quantity,
          source: details.source,
          destination: details.destination,
          reason: details.reason,
          notes: details.notes
        }
      };

      await productService.updateProduct(item._id || item.id, updatedItem);
      await fetchProducts();
      return { success: true };
    } catch (error) {
      console.error('Stock in error:', error);
      toast.error(error.response?.data?.message || 'Failed to stock in');
      throw error;
    }
  };

  const handleStockOut = async (item, quantity, details) => {
    try {
      const currentQuantity = item.quantity || 0;
      
      if (currentQuantity < quantity) {
        toast.error('Insufficient quantity');
        return;
      }

      const newQuantity = currentQuantity - quantity;
      
      const updatedItem = {
        ...item,
        quantity: newQuantity,
        lastStockOut: {
          date: new Date(),
          quantity,
          destination: details.destination,
          reason: details.reason,
          notes: details.notes
        }
      };

      if (details.shouldDelete || newQuantity === 0) {
        updatedItem.status = 'removed';
        updatedItem.removedTo = details.destination;
        updatedItem.removedDate = new Date();
        
        await productService.updateProduct(item._id || item.id, updatedItem);
        await fetchProducts();
        return { deleted: true };
      } else {
        updatedItem.storageLocation = details.destination.toUpperCase();
        await productService.updateProduct(item._id || item.id, updatedItem);
        await fetchProducts();
        return { deleted: false };
      }
    } catch (error) {
      console.error('Stock out error:', error);
      toast.error(error.response?.data?.message || 'Failed to stock out');
      throw error;
    }
  };

  const handleAddNew = async (formData) => {
    try {
      setLoading(true);
      await productService.createProduct(formData);
      await fetchProducts();
      toast.success('Item added successfully');
    } catch (error) {
      console.error('Error adding item:', error);
      toast.error(error.response?.data?.message || 'Failed to add item');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async (formData) => {
    try {
      setLoading(true);
      await productService.updateProduct(formData.id || formData._id, formData);
      await fetchProducts();
      toast.success('Item updated successfully');
    } catch (error) {
      console.error('Error updating item:', error);
      toast.error(error.response?.data?.message || 'Failed to update item');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (item) => {
    if (window.confirm(`Are you sure you want to delete ${item.name}?`)) {
      try {
        setLoading(true);
        await productService.deleteProduct(item._id || item.id);
        await fetchProducts();
        toast.success('Item deleted successfully');
      } catch (error) {
        console.error('Error deleting item:', error);
        toast.error(error.response?.data?.message || 'Failed to delete item');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleBulkTransfer = async (items, mode, destination) => {
    if (mode === 'transfer') {
      try {
        setLoading(true);
        let successCount = 0;
        
        for (const item of items) {
          await handleStockOut(item, item.quantity || 1, {
            destination,
            reason: 'Bulk transfer',
            notes: `Transferred to ${destination}`,
            shouldDelete: false
          });
          successCount++;
        }
        
        toast.success(`Successfully transferred ${successCount} items to ${destination}`);
      } catch (error) {
        toast.error('Bulk transfer failed');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleExport = () => {
    const filteredProducts = products.filter(product =>
      product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.productCode?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const csvContent = [
      ['Name', 'Brand', 'Category', 'Location', 'Quantity', 'Status', 'Cost Price', 'Value'].join(','),
      ...filteredProducts.map(product => {
        const quantity = product.quantity || product.qty || 0;
        const value = (product.costPrice || 0) * quantity;
        const location = product.storageLocation || product.storage || 'N/A';
        const brand = typeof product.brand === 'object' ? product.brand.name : product.brand;
        const category = typeof product.category === 'object' ? product.category.name : product.category;
        
        let status = 'In Stock';
        if (quantity === 0) status = 'Out of Stock';
        else if (quantity < 10) status = 'Low Stock';
        
        return [
          product.name || '',
          brand || '',
          category || '',
          location,
          quantity,
          status,
          product.costPrice || 0,
          value.toFixed(2)
        ].join(',');
      })
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `inventory-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  if (loading && products.length === 0) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <Loader size="large" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Inventory Management</h1>
            <p className="text-gray-600">Track and manage your stock levels across all locations</p>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={handleExport}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center"
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </button>
          </div>
        </div>
      </div>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Inventory Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Total Items</p>
              <p className="text-3xl font-bold text-gray-900">{stats.totalItems}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <Package className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Available Items</p>
              <p className="text-3xl font-bold text-green-600">{stats.availableItems}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <Package className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Low Stock Items</p>
              <p className="text-3xl font-bold text-yellow-600">{stats.lowStock}</p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-full">
              <AlertTriangle className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Total Value</p>
              <p className="text-3xl font-bold text-green-600">
                ₱{stats.totalValue.toLocaleString()}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search inventory by name or product code..."
            className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('total')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'total'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Total Assets ({products.length})
          </button>
          <button
            onClick={() => setActiveTab('available')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'available'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Available Assets ({products.filter(p => (p.quantity || p.qty) > 0 && p.status === 'in_storage').length})
          </button>
        </nav>
      </div>

      {/* Content - Using components with proper props */}
      {activeTab === 'total' ? (
        <TotalAssets 
          inventory={products}
          onStockIn={handleStockIn}
          onStockOut={handleStockOut}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onAddNew={handleAddNew}
        />
      ) : (
        <AvailableAsset
          inventory={products}
          onStockIn={handleStockIn}
          onStockOut={handleStockOut}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onAddNew={handleAddNew}
          onBulkTransfer={handleBulkTransfer}
          onTransfer={(item) => {
            handleStockOut(item, item.quantity || 1, {
              destination: 'BALAGTAS',
              reason: 'Manual transfer',
              notes: '',
              shouldDelete: false
            })
          }}
        />
      )}
    </Layout>
  );
};

export default Inventory;