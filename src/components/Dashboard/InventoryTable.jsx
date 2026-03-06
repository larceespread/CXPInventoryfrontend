// components/Dashboard/InventoryTable.jsx
import React, { useState } from 'react';
import { ArrowDownCircle, ArrowUpCircle, Edit, Trash2, Search, Filter, ChevronDown, ChevronUp } from 'lucide-react';
import StockForm from '../Inventory/StockForm';
import AssetForm from '../Inventory/AssetForm';
import toast from 'react-hot-toast';

const InventoryTable = ({ 
  data = [], 
  onAdd, 
  onUpdate, 
  onRemove, 
  onStockIn, 
  onStockOut,
  title = "Inventory Items" 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filterLocation, setFilterLocation] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });
  const [showStockForm, setShowStockForm] = useState(false);
  const [showAssetForm, setShowAssetForm] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [stockMode, setStockMode] = useState('stockin');
  const [formMode, setFormMode] = useState('edit');

  // Get unique locations
  const locations = [...new Set(data.map(item => item.storageLocation || item.storage || 'Unknown'))];

  const getQuantity = (item) => {
    return item.quantity || item.qty || 0;
  };

  const getLocation = (item) => {
    return item.storageLocation || item.storage || 'Unknown';
  };

  const getBrandName = (brand) => {
    if (!brand) return 'N/A';
    if (typeof brand === 'string') return brand;
    if (typeof brand === 'object' && brand.name) return brand.name;
    return 'N/A';
  };

  const getCategoryName = (category) => {
    if (!category) return 'N/A';
    if (typeof category === 'string') return category;
    if (typeof category === 'object' && category.name) return category.name;
    return 'N/A';
  };

  // Filter and search
  const filteredItems = data.filter(item => {
    const itemName = (item.name || '').toLowerCase();
    const itemBrand = getBrandName(item.brand).toLowerCase();
    const itemCategory = getCategoryName(item.category).toLowerCase();
    const itemCode = (item.productCode || '').toLowerCase();
    
    const matchesSearch = 
      itemName.includes(searchTerm.toLowerCase()) ||
      itemBrand.includes(searchTerm.toLowerCase()) ||
      itemCategory.includes(searchTerm.toLowerCase()) ||
      itemCode.includes(searchTerm.toLowerCase());

    const matchesLocation = filterLocation === 'all' || getLocation(item) === filterLocation;

    let matchesStatus = true;
    const quantity = getQuantity(item);
    
    if (filterStatus === 'in_stock') {
      matchesStatus = quantity > 0;
    } else if (filterStatus === 'low_stock') {
      matchesStatus = quantity > 0 && quantity < 10;
    } else if (filterStatus === 'out_of_stock') {
      matchesStatus = quantity === 0;
    }

    return matchesSearch && matchesLocation && matchesStatus;
  });

  // Sorting
  const sortedItems = [...filteredItems].sort((a, b) => {
    let aValue, bValue;
    
    if (sortConfig.key === 'quantity') {
      aValue = getQuantity(a);
      bValue = getQuantity(b);
    } else if (sortConfig.key === 'location') {
      aValue = getLocation(a);
      bValue = getLocation(b);
    } else if (sortConfig.key === 'brand') {
      aValue = getBrandName(a.brand);
      bValue = getBrandName(b.brand);
    } else if (sortConfig.key === 'category') {
      aValue = getCategoryName(a.category);
      bValue = getCategoryName(b.category);
    } else {
      aValue = a[sortConfig.key] || '';
      bValue = b[sortConfig.key] || '';
    }
    
    if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === 'asc' ? 
      <ChevronUp className="h-4 w-4 inline ml-1" /> : 
      <ChevronDown className="h-4 w-4 inline ml-1" />;
  };

  const getStatusBadge = (item) => {
    const quantity = getQuantity(item);
    
    if (item.status === 'borrowed') {
      return <span className="px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-800">Borrowed</span>;
    } else if (quantity === 0) {
      return <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">Out of Stock</span>;
    } else if (quantity < 10) {
      return <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">Low Stock</span>;
    } else {
      return <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">In Stock</span>;
    }
  };

  const getLocationColor = (location) => {
    const colors = {
      'BALAGTAS': 'bg-blue-100 text-blue-800',
      'MARILAO': 'bg-green-100 text-green-800',
      'Office': 'bg-purple-100 text-purple-800',
      'Unknown': 'bg-gray-100 text-gray-800'
    };
    return colors[location] || 'bg-gray-100 text-gray-800';
  };

  const handleStockInClick = (item) => {
    setSelectedItem(item);
    setStockMode('stockin');
    setShowStockForm(true);
  };

  const handleStockOutClick = (item) => {
    setSelectedItem(item);
    setStockMode('stockout');
    setShowStockForm(true);
  };

  const handleEditClick = (item) => {
    setSelectedItem(item);
    setFormMode('edit');
    setShowAssetForm(true);
  };

  // FIXED: handleStockSubmit
  const handleStockSubmit = async (formData) => {
    try {
      if (stockMode === 'stockin') {
        await onStockIn(selectedItem, formData.quantity, formData);
      } else {
        await onStockOut(selectedItem, formData.quantity, formData);
      }
      setShowStockForm(false);
      setSelectedItem(null);
    } catch (error) {
      console.error('Stock operation error:', error);
      toast.error(error.message || `Failed to ${stockMode === 'stockin' ? 'add' : 'remove'} stock`);
    }
  };

  // FIXED: handleUpdateSubmit - correctly passes data
  const handleUpdateSubmit = async (formData) => {
    try {
      const itemId = selectedItem._id || selectedItem.id;
      if (!itemId) {
        toast.error('Cannot update: Item has no ID');
        return;
      }
      
      const updateData = {
        ...formData,
        id: itemId,
        _id: itemId
      };
      
      await onUpdate(updateData);
      setShowAssetForm(false);
      setSelectedItem(null);
    } catch (error) {
      console.error('Update error:', error);
      toast.error(error.message || 'Failed to update item');
    }
  };

  return (
    <>
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
              <p className="text-sm text-gray-500 mt-1">
                Total Items: {data.length} | Total Quantity: {data.reduce((sum, item) => sum + getQuantity(item), 0)}
              </p>
            </div>
            <button
              onClick={onAdd}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium flex items-center"
            >
              <ArrowDownCircle className="h-4 w-4 mr-2" />
              Add New Item
            </button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <div className="flex flex-col space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, brand, category, or product code..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center text-sm text-gray-600 hover:text-gray-900"
            >
              <Filter className="h-4 w-4 mr-1" />
              {showFilters ? 'Hide Filters' : 'Show Filters'}
            </button>

            {/* Filters */}
            {showFilters && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-white rounded-md border">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                  <select
                    value={filterLocation}
                    onChange={(e) => setFilterLocation(e.target.value)}
                    className="w-full border border-gray-300 rounded-md py-2 px-3 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">All Locations</option>
                    {locations.map(loc => (
                      <option key={loc} value={loc}>{loc}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="w-full border border-gray-300 rounded-md py-2 px-3 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">All Status</option>
                    <option value="in_stock">In Stock</option>
                    <option value="low_stock">Low Stock</option>
                    <option value="out_of_stock">Out of Stock</option>
                  </select>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => requestSort('name')}>
                  <div className="flex items-center">
                    Item {getSortIcon('name')}
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => requestSort('brand')}>
                  <div className="flex items-center">
                    Brand {getSortIcon('brand')}
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => requestSort('category')}>
                  <div className="flex items-center">
                    Category {getSortIcon('category')}
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => requestSort('location')}>
                  <div className="flex items-center">
                    Location {getSortIcon('location')}
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => requestSort('quantity')}>
                  <div className="flex items-center">
                    Quantity {getSortIcon('quantity')}
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedItems.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                    No inventory items found
                  </td>
                </tr>
              ) : (
                sortedItems.map((item) => {
                  const itemId = item._id || item.id;
                  const quantity = getQuantity(item);
                  
                  return (
                    <tr key={itemId} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{item.name}</div>
                          {item.productCode && (
                            <div className="text-xs text-gray-500">Code: {item.productCode}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {getBrandName(item.brand)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {getCategoryName(item.category)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getLocationColor(getLocation(item))}`}>
                          {getLocation(item)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <span className={`
                          ${quantity < 5 ? 'text-red-600 font-bold' : ''}
                          ${quantity >= 5 && quantity < 10 ? 'text-yellow-600' : ''}
                        `}>
                          {quantity}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(item)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleStockInClick(item)}
                            className="text-green-600 hover:text-green-900 p-1 rounded-full hover:bg-green-50"
                            title="Stock In"
                          >
                            <ArrowDownCircle className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleStockOutClick(item)}
                            className="text-orange-600 hover:text-orange-900 p-1 rounded-full hover:bg-orange-50"
                            title="Stock Out"
                          >
                            <ArrowUpCircle className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleEditClick(item)}
                            className="text-blue-600 hover:text-blue-900 p-1 rounded-full hover:bg-blue-50"
                            title="Edit"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => onRemove(item)}
                            className="text-red-600 hover:text-red-900 p-1 rounded-full hover:bg-red-50"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Summary Footer */}
        <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
          <div className="flex justify-between text-sm text-gray-600">
            <span>Showing {sortedItems.length} of {data.length} items</span>
            <span>Total Value: ₱{data.reduce((sum, item) => 
              sum + (getQuantity(item) * (item.costPrice || 0)), 0
            ).toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Stock Form Modal */}
      {showStockForm && selectedItem && (
        <StockForm
          item={selectedItem}
          mode={stockMode}
          onClose={() => {
            setShowStockForm(false);
            setSelectedItem(null);
          }}
          onSubmit={handleStockSubmit}
        />
      )}

      {/* Asset Form Modal */}
      {showAssetForm && selectedItem && (
        <AssetForm
          item={selectedItem}
          mode={formMode}
          onClose={() => {
            setShowAssetForm(false);
            setSelectedItem(null);
          }}
          onSubmit={handleUpdateSubmit}
          onDelete={() => {
            onRemove(selectedItem);
            setShowAssetForm(false);
            setSelectedItem(null);
          }}
          onStockIn={onStockIn}
          onStockOut={onStockOut}
        />
      )}
    </>
  );
};

export default InventoryTable;