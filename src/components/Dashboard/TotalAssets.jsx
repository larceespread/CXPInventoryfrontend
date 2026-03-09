// components/Dashboard/TotalAssets.jsx
import React, { useState, useMemo, useEffect } from 'react';
import { 
  Package, 
  Search, 
  Filter, 
  ArrowUpDown, 
  ChevronDown, 
  ChevronUp,
  X,
  Download,
  MapPin,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import { shipmentService } from '../../services/shipmentService';

const TotalAssets = ({ inventory = [] }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [showFilters, setShowFilters] = useState(false);
  const [pendingReturns, setPendingReturns] = useState({});
  const [loadingReturns, setLoadingReturns] = useState(false);

  // Fetch pending returns data
  useEffect(() => {
    const fetchPendingReturns = async () => {
      if (!inventory.length) return;
      
      setLoadingReturns(true);
      try {
        // Get all shipments with pending returns
        const response = await shipmentService.getShipmentsWithPendingReturns();
        
        if (response.success && response.data) {
          const pendingMap = {};
          
          // Process each shipment
          response.data.forEach(shipment => {
            if (shipment.items && Array.isArray(shipment.items)) {
              shipment.items.forEach((item, index) => {
                // Check if item has product reference and pending return quantity
                if (item.product) {
                  const productId = typeof item.product === 'object' 
                    ? item.product._id || item.product.id 
                    : item.product;
                  
                  const pendingQty = (item.quantity || 0) - (item.returnedQuantity || 0);
                  
                  if (pendingQty > 0 && productId) {
                    if (!pendingMap[productId]) {
                      pendingMap[productId] = {
                        totalPending: 0,
                        shipments: []
                      };
                    }
                    
                    pendingMap[productId].totalPending += pendingQty;
                    pendingMap[productId].shipments.push({
                      shipmentNumber: shipment.shipmentNumber || 'N/A',
                      shipmentId: shipment._id || shipment.id,
                      quantity: item.quantity,
                      returnedQuantity: item.returnedQuantity || 0,
                      pendingQuantity: pendingQty,
                      itemDescription: item.itemDescription || item.productName || 'Item',
                      date: shipment.createdAt || shipment.datePrepared
                    });
                  }
                }
              });
            }
          });
          
          setPendingReturns(pendingMap);
        }
      } catch (error) {
        console.error('Error fetching pending returns:', error);
        // Don't show toast error to avoid annoying the user
      } finally {
        setLoadingReturns(false);
      }
    };

    fetchPendingReturns();
  }, [inventory]);

  // Helper functions
  const getSafeString = (value) => {
    if (!value) return '';
    if (typeof value === 'string') return value;
    if (typeof value === 'object') {
      if (value.name) return value.name;
      return JSON.stringify(value);
    }
    return String(value);
  };

  const getBrandName = (brand) => {
    if (!brand) return 'N/A';
    if (typeof brand === 'string') return brand;
    if (typeof brand === 'object') {
      return brand.name || 'Unknown Brand';
    }
    return String(brand);
  };

  const getCategoryName = (category) => {
    if (!category) return 'N/A';
    if (typeof category === 'string') return category;
    if (typeof category === 'object') {
      return category.name || 'Unknown Category';
    }
    return String(category);
  };

  // IMPORTANT: These functions now use initialQuantity instead of storageLocations
  // to ensure quantities don't change when items are shipped out
  const getMarilaoQuantity = (item) => {
    // Check for initialQuantity first (this is the original total before any shipouts)
    if (item.initialQuantity && item.initialQuantity.marilao !== undefined) {
      return item.initialQuantity.marilao || 0;
    }
    
    // Fallback to storageLocations if initialQuantity doesn't exist
    if (item.storageLocations) {
      const loc = item.storageLocations.find(l => l.location === 'MARILAO');
      return loc ? loc.quantity || 0 : 0;
    }
    
    return 0;
  };

  const getBalagtasQuantity = (item) => {
    // Check for initialQuantity first (this is the original total before any shipouts)
    if (item.initialQuantity && item.initialQuantity.balagtas !== undefined) {
      return item.initialQuantity.balagtas || 0;
    }
    
    // Fallback to storageLocations if initialQuantity doesn't exist
    if (item.storageLocations) {
      const loc = item.storageLocations.find(l => l.location === 'BALAGTAS');
      return loc ? loc.quantity || 0 : 0;
    }
    
    return 0;
  };

  const getTotalQuantity = (item) => {
    // Use initial quantities to get the total original stock
    if (item.initialQuantity) {
      return (item.initialQuantity.marilao || 0) + (item.initialQuantity.balagtas || 0);
    }
    
    // Fallback to storageLocations
    if (item.storageLocations) {
      return item.storageLocations.reduce((sum, loc) => sum + (loc.quantity || 0), 0);
    }
    
    return item.quantity || item.qty || 0;
  };

  // Get current stock for status checking (this should reflect actual stock)
  const getCurrentMarilaoQuantity = (item) => {
    if (item.storageLocations) {
      const loc = item.storageLocations.find(l => l.location === 'MARILAO');
      return loc ? loc.quantity || 0 : 0;
    }
    return 0;
  };

  const getCurrentBalagtasQuantity = (item) => {
    if (item.storageLocations) {
      const loc = item.storageLocations.find(l => l.location === 'BALAGTAS');
      return loc ? loc.quantity || 0 : 0;
    }
    return 0;
  };

  const getCurrentTotalQuantity = (item) => {
    if (item.storageLocations) {
      return item.storageLocations.reduce((sum, loc) => sum + (loc.quantity || 0), 0);
    }
    return item.quantity || item.qty || 0;
  };

  // Get pending return quantity for an item
  const getPendingReturnQuantity = (item) => {
    const itemId = item._id || item.id;
    if (!itemId) return 0;
    
    const pendingData = pendingReturns[itemId];
    return pendingData ? pendingData.totalPending : 0;
  };

  // Get pending return details for tooltip
  const getPendingReturnDetails = (item) => {
    const itemId = item._id || item.id;
    if (!itemId) return [];
    
    const pendingData = pendingReturns[itemId];
    return pendingData ? pendingData.shipments : [];
  };

  // Get unique values for filters
  const uniqueCategories = useMemo(() => {
    return [...new Set(inventory.map(item => getCategoryName(item.category)))];
  }, [inventory]);

  // Filter and search logic
  const filteredItems = useMemo(() => {
    return inventory.filter(item => {
      const itemName = getSafeString(item.name).toLowerCase();
      const itemBrand = getBrandName(item.brand).toLowerCase();
      const itemCategory = getCategoryName(item.category).toLowerCase();
      const itemCode = getSafeString(item.productCode).toLowerCase();
      
      const matchesSearch = searchTerm === '' || 
        itemName.includes(searchTerm.toLowerCase()) ||
        itemBrand.includes(searchTerm.toLowerCase()) ||
        itemCategory.includes(searchTerm.toLowerCase()) ||
        itemCode.includes(searchTerm.toLowerCase());
      
      const matchesCategory = filterCategory === 'all' || getCategoryName(item.category) === filterCategory;
      
      let matchesStatus = true;
      const quantity = getCurrentTotalQuantity(item); // Use current quantity for status
      
      if (filterStatus === 'in_stock') {
        matchesStatus = quantity > 0;
      } else if (filterStatus === 'low_stock') {
        matchesStatus = quantity > 0 && quantity < 10;
      } else if (filterStatus === 'out_of_stock') {
        matchesStatus = quantity === 0;
      } else if (filterStatus === 'has_pending_returns') {
        matchesStatus = getPendingReturnQuantity(item) > 0;
      }
      
      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [inventory, searchTerm, filterCategory, filterStatus]);

  // Sorting logic
  const sortedItems = useMemo(() => {
    return [...filteredItems].sort((a, b) => {
      let aValue, bValue;
      
      if (sortConfig.key === 'marilao_qty') {
        aValue = getMarilaoQuantity(a); // Use initial quantity for sorting
        bValue = getMarilaoQuantity(b);
      } else if (sortConfig.key === 'balagtas_qty') {
        aValue = getBalagtasQuantity(a); // Use initial quantity for sorting
        bValue = getBalagtasQuantity(b);
      } else if (sortConfig.key === 'quantity') {
        aValue = getTotalQuantity(a); // Use initial quantity for sorting
        bValue = getTotalQuantity(b);
      } else if (sortConfig.key === 'value') {
        aValue = getTotalQuantity(a) * (a.costPrice || 0); // Use initial quantity for value
        bValue = getTotalQuantity(b) * (b.costPrice || 0);
      } else if (sortConfig.key === 'brand') {
        aValue = getBrandName(a.brand);
        bValue = getBrandName(b.brand);
      } else if (sortConfig.key === 'category') {
        aValue = getCategoryName(a.category);
        bValue = getCategoryName(b.category);
      } else if (sortConfig.key === 'pending_returns') {
        aValue = getPendingReturnQuantity(a);
        bValue = getPendingReturnQuantity(b);
      } else {
        aValue = getSafeString(a[sortConfig.key] || a.name);
        bValue = getSafeString(b[sortConfig.key] || b.name);
      }
      
      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredItems, sortConfig]);

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = sortedItems.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(sortedItems.length / itemsPerPage);

  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
    setCurrentPage(1);
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return <ArrowUpDown className="h-4 w-4 ml-1 text-gray-400 dark:text-gray-500" />;
    return sortConfig.direction === 'asc' ? 
      <ChevronUp className="h-4 w-4 ml-1 text-gray-600 dark:text-gray-300" /> : 
      <ChevronDown className="h-4 w-4 ml-1 text-gray-600 dark:text-gray-300" />;
  };

  const getStatusBadge = (item) => {
    const quantity = getCurrentTotalQuantity(item); // Use current quantity for status
    
    if (quantity === 0) {
      return <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300">Out of Stock</span>;
    } else if (quantity < 10) {
      return <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300">Low Stock</span>;
    } else {
      return <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300">In Stock</span>;
    }
  };

  const getPendingReturnBadge = (item) => {
    const pendingQty = getPendingReturnQuantity(item);
    
    if (pendingQty === 0) {
      return <span className="text-gray-400 dark:text-gray-500">—</span>;
    }
    
    const details = getPendingReturnDetails(item);
    
    return (
      <div className="relative group">
        <span className="px-2 py-1 text-xs font-medium rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 cursor-help inline-flex items-center">
          <RefreshCw className="h-3 w-3 mr-1" />
          {pendingQty}
        </span>
        
        {/* Tooltip */}
        <div className="absolute left-0 bottom-full mb-2 w-64 hidden group-hover:block z-10">
          <div className="bg-gray-900 dark:bg-gray-800 text-white text-xs rounded-lg shadow-lg p-2">
            <p className="font-semibold mb-1 border-b border-gray-700 pb-1">Pending Returns:</p>
            {details.map((detail, idx) => (
              <div key={idx} className="mb-1 pb-1 border-b border-gray-700 last:border-0">
                <p className="font-medium">{detail.shipmentNumber}</p>
                <p className="text-gray-300">Item: {detail.itemDescription}</p>
                <p className="text-gray-300">Qty: {detail.pendingQuantity} / {detail.quantity}</p>
                {detail.date && (
                  <p className="text-gray-400 text-[10px]">
                    Date: {new Date(detail.date).toLocaleDateString()}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilterCategory('all');
    setFilterStatus('all');
    setCurrentPage(1);
  };

  const handleExport = () => {
    try {
      const csvContent = [
        ['Name', 'Brand', 'Category', 'Marilao Qty (Total)', 'Balagtas Qty (Total)', 'Total Qty (Total)', 'Current Status', 'Pending Returns', 'Cost Price', 'Selling Price', 'Product Code'].join(','),
        ...filteredItems.map(item => [
          getSafeString(item.name),
          getBrandName(item.brand),
          getCategoryName(item.category),
          getMarilaoQuantity(item),
          getBalagtasQuantity(item),
          getTotalQuantity(item),
          getCurrentTotalQuantity(item) === 0 ? 'Out of Stock' : getCurrentTotalQuantity(item) < 10 ? 'Low Stock' : 'In Stock',
          getPendingReturnQuantity(item),
          item.costPrice || 0,
          item.sellingPrice || 0,
          getSafeString(item.productCode)
        ].join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `total-assets-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
      
      toast.success('Export successful');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export data');
    }
  };

  const refreshPendingReturns = async () => {
    setLoadingReturns(true);
    try {
      const response = await shipmentService.getShipmentsWithPendingReturns();
      
      if (response.success && response.data) {
        const pendingMap = {};
        
        response.data.forEach(shipment => {
          if (shipment.items && Array.isArray(shipment.items)) {
            shipment.items.forEach((item, index) => {
              if (item.product) {
                const productId = typeof item.product === 'object' 
                  ? item.product._id || item.product.id 
                  : item.product;
                
                const pendingQty = (item.quantity || 0) - (item.returnedQuantity || 0);
                
                if (pendingQty > 0 && productId) {
                  if (!pendingMap[productId]) {
                    pendingMap[productId] = {
                      totalPending: 0,
                      shipments: []
                    };
                  }
                  
                  pendingMap[productId].totalPending += pendingQty;
                  pendingMap[productId].shipments.push({
                    shipmentNumber: shipment.shipmentNumber || 'N/A',
                    shipmentId: shipment._id || shipment.id,
                    quantity: item.quantity,
                    returnedQuantity: item.returnedQuantity || 0,
                    pendingQuantity: pendingQty,
                    itemDescription: item.itemDescription || item.productName || 'Item',
                    date: shipment.createdAt || shipment.datePrepared
                  });
                }
              }
            });
          }
        });
        
        setPendingReturns(pendingMap);
        toast.success('Pending returns refreshed');
      }
    } catch (error) {
      console.error('Error refreshing pending returns:', error);
      toast.error('Failed to refresh pending returns');
    } finally {
      setLoadingReturns(false);
    }
  };

  // Calculate totals - USING INITIAL QUANTITIES
  const totals = useMemo(() => {
    let totalItems = 0;
    let totalValue = 0;
    let totalMarilao = 0;
    let totalBalagtas = 0;
    let totalPendingReturns = 0;
    
    inventory.forEach(item => {
      const marilaoQty = getMarilaoQuantity(item);
      const balagtasQty = getBalagtasQuantity(item);
      totalMarilao += marilaoQty;
      totalBalagtas += balagtasQty;
      totalItems += (marilaoQty + balagtasQty);
      totalValue += (marilaoQty + balagtasQty) * (item.costPrice || 0);
      totalPendingReturns += getPendingReturnQuantity(item);
    });
    
    return { 
      totalItems, 
      totalValue,
      totalMarilao,
      totalBalagtas,
      totalPendingReturns
    };
  }, [inventory]);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow transition-colors duration-200">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Total Items: {inventory.length} | Total Quantity: {totals.totalItems.toLocaleString()} | 
              Total Value: ₱{totals.totalValue.toLocaleString()}
            </p>
            <div className="flex space-x-4 mt-2 text-xs">
              <span className="flex items-center text-gray-600 dark:text-gray-400">
                <MapPin className="h-3 w-3 mr-1 text-green-600" />
                Marilao (Total): {totals.totalMarilao.toLocaleString()}
              </span>
              <span className="flex items-center text-gray-600 dark:text-gray-400">
                <MapPin className="h-3 w-3 mr-1 text-blue-600" />
                Balagtas (Total): {totals.totalBalagtas.toLocaleString()}
              </span>
              <span className="flex items-center text-gray-600 dark:text-gray-400">
                <RefreshCw className="h-3 w-3 mr-1 text-purple-600" />
                Pending Returns: {totals.totalPendingReturns.toLocaleString()}
              </span>
            </div>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={refreshPendingReturns}
              disabled={loadingReturns}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center transition-colors duration-200 disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loadingReturns ? 'animate-spin' : ''}`} />
              Refresh Returns
            </button>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center transition-colors duration-200"
            >
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </button>
            <button
              onClick={handleExport}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center transition-colors duration-200"
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </button>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
        <div className="flex flex-col space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
            <input
              type="text"
              placeholder="Search by name, brand, category, or product code..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
            />
          </div>

          {/* Filters */}
          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-white dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
                <select
                  value={filterCategory}
                  onChange={(e) => {
                    setFilterCategory(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-md py-2 px-3 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                  <option value="all">All Categories</option>
                  {uniqueCategories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
                <select
                  value={filterStatus}
                  onChange={(e) => {
                    setFilterStatus(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-md py-2 px-3 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                  <option value="all">All Status</option>
                  <option value="in_stock">In Stock</option>
                  <option value="low_stock">Low Stock</option>
                  <option value="out_of_stock">Out of Stock</option>
                  <option value="has_pending_returns">Has Pending Returns</option>
                </select>
              </div>

              <div className="md:col-span-4 flex justify-end">
                <button
                  onClick={clearFilters}
                  className="px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 flex items-center"
                >
                  <X className="h-4 w-4 mr-1" />
                  Clear Filters
                </button>
              </div>
            </div>
          )}

          {/* Results count */}
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Showing {filteredItems.length} of {inventory.length} items
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer" onClick={() => requestSort('name')}>
                <div className="flex items-center">
                  ITEM {getSortIcon('name')}
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer" onClick={() => requestSort('brand')}>
                <div className="flex items-center">
                  BRAND {getSortIcon('brand')}
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer" onClick={() => requestSort('category')}>
                <div className="flex items-center">
                  CATEGORY {getSortIcon('category')}
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer" onClick={() => requestSort('marilao_qty')}>
                <div className="flex items-center">
                  <MapPin className="h-4 w-4 mr-1 text-green-600 dark:text-green-400" />
                  MARILAO (TOTAL) {getSortIcon('marilao_qty')}
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer" onClick={() => requestSort('balagtas_qty')}>
                <div className="flex items-center">
                  <MapPin className="h-4 w-4 mr-1 text-blue-600 dark:text-blue-400" />
                  BALAGTAS (TOTAL) {getSortIcon('balagtas_qty')}
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer" onClick={() => requestSort('quantity')}>
                <div className="flex items-center">
                  TOTAL QTY {getSortIcon('quantity')}
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                CURRENT STATUS
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer" onClick={() => requestSort('pending_returns')}>
                <div className="flex items-center">
                  <RefreshCw className="h-4 w-4 mr-1 text-purple-600 dark:text-purple-400" />
                  PENDING RETURNS {getSortIcon('pending_returns')}
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer" onClick={() => requestSort('value')}>
                <div className="flex items-center">
                  COST {getSortIcon('value')}
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                PRODUCT CODE
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {currentItems.length > 0 ? (
              currentItems.map((item, index) => {
                const marilaoQty = getMarilaoQuantity(item); // Total lifetime quantity
                const balagtasQty = getBalagtasQuantity(item); // Total lifetime quantity
                const totalQty = marilaoQty + balagtasQty; // Total lifetime quantity
                const currentTotalQty = getCurrentTotalQuantity(item); // Current actual stock
                const pendingReturnQty = getPendingReturnQuantity(item);
                const value = totalQty * (item.costPrice || 0); // Value based on total lifetime quantity
                
                return (
                  <tr key={item._id || item.id || index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">{getSafeString(item.name)}</div>
                      {item.productCode && (
                        <div className="text-xs text-gray-500 dark:text-gray-400">Code: {item.productCode}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {getBrandName(item.brand)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {getCategoryName(item.category)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <span className={marilaoQty === 0 ? 'text-gray-400 dark:text-gray-500' : 'text-green-600 dark:text-green-400 font-semibold'}>
                        {marilaoQty}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <span className={balagtasQty === 0 ? 'text-gray-400 dark:text-gray-500' : 'text-blue-600 dark:text-blue-400 font-semibold'}>
                        {balagtasQty}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <span className="text-gray-900 dark:text-white">
                        {totalQty}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(item)}
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Current: {currentTotalQty}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getPendingReturnBadge(item)}
                      {pendingReturnQty > 0 && (
                        <div className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                          {pendingReturnQty} items to return
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      ₱{value.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {item.productCode || '—'}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="10" className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                  <Package className="h-12 w-12 mx-auto text-gray-400 dark:text-gray-600 mb-3" />
                  <p className="text-lg font-medium dark:text-gray-300">No items found</p>
                  <p className="text-sm mt-1 dark:text-gray-400">Try adjusting your search or filters</p>
                  <button
                    onClick={clearFilters}
                    className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                  >
                    Clear Filters
                  </button>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {sortedItems.length > 0 && (
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700 dark:text-gray-400">
              Showing <span className="font-medium dark:text-white">{indexOfFirstItem + 1}</span> to{' '}
              <span className="font-medium dark:text-white">
                {Math.min(indexOfLastItem, sortedItems.length)}
              </span>{' '}
              of <span className="font-medium dark:text-white">{sortedItems.length}</span> results
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              >
                Previous
              </button>
              <span className="px-3 py-1 text-sm text-gray-700 dark:text-gray-300">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TotalAssets;