// components/Inventory/AvailableAsset.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Package, 
  Search, 
  Filter, 
  Plus, 
  Edit, 
  Trash2, 
  ArrowUpDown, 
  Download, 
  X, 
  ChevronDown, 
  ChevronUp,
  MapPin,
  Scale,
  List
} from 'lucide-react';
import { productService } from '../../services/productService';
import { categoryService } from '../../services/categoryService';
import { brandService } from '../../services/brandService';
import toast from 'react-hot-toast';
import Loader from '../common/Loader';
import AssetForm from './AssetForm';

const AvailableAsset = ({ 
  inventory = [], 
  onStockIn = async () => {}, 
  onStockOut = async () => {}, 
  onTransfer = async () => {},
  onEdit = async () => {}, 
  onDelete = async () => {}, 
  onAddNew = async () => {} 
}) => {
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterBrand, setFilterBrand] = useState('all');
  const [filterLocation, setFilterLocation] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterUnit, setFilterUnit] = useState('all');
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [viewAll, setViewAll] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formMode, setFormMode] = useState('create');
  const [selectedItem, setSelectedItem] = useState(null);
  const [summary, setSummary] = useState({
    totalItems: 0,
    totalQuantity: 0,
    totalValue: 0,
    byLocation: {
      BALAGTAS: { quantity: 0, value: 0 },
      MARILAO: { quantity: 0, value: 0 }
    },
    byUnit: {}
  });

  // Unit options
  const unitOptions = [
    { value: 'pieces', label: 'Pieces' },
    { value: 'boxes', label: 'Boxes' },
    { value: 'packs', label: 'Packs' },
    { value: 'sets', label: 'Sets' },
    { value: 'units', label: 'Units' },
    { value: 'kilograms', label: 'Kilograms' },
    { value: 'grams', label: 'Grams' },
    { value: 'liters', label: 'Liters' },
    { value: 'milliliters', label: 'Milliliters' },
    { value: 'meters', label: 'Meters' },
    { value: 'centimeters', label: 'Centimeters' },
    { value: 'dozen', label: 'Dozen' },
    { value: 'reams', label: 'Reams' },
    { value: 'rolls', label: 'Rolls' },
    { value: 'bottles', label: 'Bottles' },
    { value: 'cans', label: 'Cans' },
    { value: 'cartons', label: 'Cartons' },
    { value: 'pairs', label: 'Pairs' }
  ];

  // Helper function to get item ID from various possible property names
  const getItemId = useCallback((item) => {
    if (!item) return null;
    return item._id || item.id || item.productId || item.itemId || null;
  }, []);

  // Fetch categories and brands
  useEffect(() => {
    fetchFilters();
  }, []);

  // Calculate summary whenever inventory changes
  useEffect(() => {
    if (inventory && inventory.length > 0) {
      calculateSummary();
    }
  }, [inventory]);

  const fetchFilters = async () => {
    try {
      const [categoriesRes, brandsRes] = await Promise.all([
        categoryService.getCategories(),
        brandService.getBrands()
      ]);
      setCategories(categoriesRes.data || []);
      setBrands(brandsRes.data || []);
    } catch (error) {
      console.error('Error fetching filters:', error);
    }
  };

  // Helper functions for safe string conversion
  const getSafeString = useCallback((value) => {
    if (!value) return '';
    if (typeof value === 'string') return value;
    if (typeof value === 'object') {
      if (value.name) return value.name;
      return JSON.stringify(value);
    }
    return String(value);
  }, []);

  const getBrandName = useCallback((brand) => {
    if (!brand) return 'N/A';
    if (typeof brand === 'string') return brand;
    if (typeof brand === 'object') {
      if (brand.name) return brand.name;
      if (brand.brandName) return brand.brandName;
      return 'Unknown Brand';
    }
    return String(brand);
  }, []);

  const getCategoryName = useCallback((category) => {
    if (!category) return 'N/A';
    if (typeof category === 'string') return category;
    if (typeof category === 'object') {
      if (category.name) return category.name;
      if (category.categoryName) return category.categoryName;
      return 'Unknown Category';
    }
    return String(category);
  }, []);

  const getUnitLabel = useCallback((unit) => {
    if (!unit) return 'pieces';
    const found = unitOptions.find(u => u.value === unit);
    return found ? found.label : unit;
  }, []);

  const getMarilaoQuantity = useCallback((item) => {
    if (!item.storageLocations) return 0;
    const loc = item.storageLocations.find(l => l.location === 'MARILAO');
    return loc ? loc.quantity || 0 : 0;
  }, []);

  const getBalagtasQuantity = useCallback((item) => {
    if (!item.storageLocations) return 0;
    const loc = item.storageLocations.find(l => l.location === 'BALAGTAS');
    return loc ? loc.quantity || 0 : 0;
  }, []);

  const getTotalQuantity = useCallback((item) => {
    if (!item.storageLocations) return item.quantity || 0;
    return item.storageLocations.reduce((sum, loc) => sum + (loc.quantity || 0), 0);
  }, []);

  const getLocationStatus = useCallback((item, location) => {
    if (!item.storageLocations) return 'out_of_stock';
    const loc = item.storageLocations.find(l => l.location === location);
    return loc ? loc.status || 'out_of_stock' : 'out_of_stock';
  }, []);

  const getItemUnit = useCallback((item) => {
    return item.unit || 'pieces';
  }, []);

  // Calculate summary statistics
  const calculateSummary = useCallback(() => {
    const byLocation = {
      BALAGTAS: { quantity: 0, value: 0 },
      MARILAO: { quantity: 0, value: 0 }
    };
    const byUnit = {};
    let totalQuantity = 0;
    let totalValue = 0;

    inventory.forEach(item => {
      // Unit breakdown
      const unit = item.unit || 'pieces';
      byUnit[unit] = byUnit[unit] || { count: 0, quantity: 0, value: 0 };
      byUnit[unit].count += 1;

      if (item.storageLocations) {
        item.storageLocations.forEach(loc => {
          const value = (item.costPrice || 0) * (loc.quantity || 0);
          byLocation[loc.location].quantity += loc.quantity || 0;
          byLocation[loc.location].value += value;
          totalQuantity += loc.quantity || 0;
          totalValue += value;
          
          byUnit[unit].quantity += loc.quantity || 0;
          byUnit[unit].value += value;
        });
      } else {
        // Fallback for old data
        const quantity = item.quantity || 0;
        const value = (item.costPrice || 0) * quantity;
        const location = item.storageLocation || 'BALAGTAS';
        if (byLocation[location]) {
          byLocation[location].quantity += quantity;
          byLocation[location].value += value;
        }
        totalQuantity += quantity;
        totalValue += value;
        
        byUnit[unit].quantity += quantity;
        byUnit[unit].value += value;
      }
    });

    setSummary({
      totalItems: inventory.length,
      totalQuantity,
      totalValue,
      byLocation,
      byUnit
    });
  }, [inventory]);

  // Get unique values for filters
  const uniqueCategories = useMemo(() => {
    return [...new Set(inventory.map(item => getCategoryName(item.category)))];
  }, [inventory, getCategoryName]);

  const uniqueBrands = useMemo(() => {
    return [...new Set(inventory.map(item => getBrandName(item.brand)))];
  }, [inventory, getBrandName]);

  const uniqueUnits = useMemo(() => {
    return [...new Set(inventory.map(item => item.unit || 'pieces'))];
  }, [inventory]);

  // Filter and search logic
  const filteredItems = useMemo(() => {
    return inventory.filter(item => {
      const itemName = getSafeString(item.name);
      const itemBrand = getBrandName(item.brand);
      const itemCategory = getCategoryName(item.category);
      const itemCode = getSafeString(item.productCode);
      const itemBarcode = getSafeString(item.barcode);
      const itemDescription = getSafeString(item.description);
      const itemUnit = item.unit || 'pieces';
      const itemUnitLabel = getUnitLabel(itemUnit);
      
      const matchesSearch = 
        itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        itemBrand.toLowerCase().includes(searchTerm.toLowerCase()) ||
        itemCategory.toLowerCase().includes(searchTerm.toLowerCase()) ||
        itemCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        itemBarcode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        itemDescription.toLowerCase().includes(searchTerm.toLowerCase()) ||
        itemUnitLabel.toLowerCase().includes(searchTerm.toLowerCase()) ||
        itemUnit.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCategory = filterCategory === 'all' || itemCategory === filterCategory;
      const matchesBrand = filterBrand === 'all' || itemBrand === filterBrand;
      const matchesUnit = filterUnit === 'all' || itemUnit === filterUnit;
      
      // Location filter
      let matchesLocation = true;
      if (filterLocation !== 'all') {
        const marilaoQty = getMarilaoQuantity(item);
        const balagtasQty = getBalagtasQuantity(item);
        if (filterLocation === 'MARILAO') {
          matchesLocation = marilaoQty > 0;
        } else if (filterLocation === 'BALAGTAS') {
          matchesLocation = balagtasQty > 0;
        }
      }
      
      // Status filter
      let matchesStatus = true;
      if (filterStatus !== 'all') {
        if (filterStatus === 'in_stock') {
          matchesStatus = getTotalQuantity(item) > 0;
        } else if (filterStatus === 'low_stock') {
          matchesStatus = item.storageLocations?.some(loc => loc.status === 'low_stock') || false;
        } else if (filterStatus === 'out_of_stock') {
          matchesStatus = getTotalQuantity(item) === 0;
        }
      }
      
      return matchesSearch && matchesCategory && matchesBrand && matchesLocation && matchesStatus && matchesUnit;
    });
  }, [inventory, searchTerm, filterCategory, filterBrand, filterLocation, filterStatus, filterUnit, getSafeString, getBrandName, getCategoryName, getUnitLabel, getMarilaoQuantity, getBalagtasQuantity, getTotalQuantity]);

  // Sorting logic
  const sortedItems = useMemo(() => {
    return [...filteredItems].sort((a, b) => {
      let aValue, bValue;
      
      if (sortConfig.key === 'marilao_qty') {
        aValue = getMarilaoQuantity(a);
        bValue = getMarilaoQuantity(b);
      } else if (sortConfig.key === 'balagtas_qty') {
        aValue = getBalagtasQuantity(a);
        bValue = getBalagtasQuantity(b);
      } else if (sortConfig.key === 'quantity') {
        aValue = getTotalQuantity(a);
        bValue = getTotalQuantity(b);
      } else if (sortConfig.key === 'value') {
        aValue = getTotalQuantity(a) * (a.costPrice || 0);
        bValue = getTotalQuantity(b) * (b.costPrice || 0);
      } else if (sortConfig.key === 'brand') {
        aValue = getBrandName(a.brand);
        bValue = getBrandName(b.brand);
      } else if (sortConfig.key === 'category') {
        aValue = getCategoryName(a.category);
        bValue = getCategoryName(b.category);
      } else if (sortConfig.key === 'unit') {
        aValue = getUnitLabel(a.unit || 'pieces');
        bValue = getUnitLabel(b.unit || 'pieces');
      } else if (sortConfig.key === 'name') {
        aValue = getSafeString(a.name);
        bValue = getSafeString(b.name);
      } else {
        aValue = a[sortConfig.key];
        bValue = b[sortConfig.key];
      }
      
      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredItems, sortConfig, getBrandName, getCategoryName, getSafeString, getMarilaoQuantity, getBalagtasQuantity, getTotalQuantity, getUnitLabel]);

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = useMemo(() => {
    if (viewAll) {
      return sortedItems; // Show all items when viewAll is true
    }
    return sortedItems.slice(indexOfFirstItem, indexOfLastItem);
  }, [sortedItems, indexOfFirstItem, indexOfLastItem, viewAll]);
  const totalPages = Math.ceil(sortedItems.length / itemsPerPage);

  // Handle select all
  useEffect(() => {
    if (selectAll) {
      const validIds = currentItems
        .map(item => getItemId(item))
        .filter(id => id !== null);
      setSelectedItems(validIds);
    } else {
      setSelectedItems([]);
    }
  }, [selectAll, currentItems, getItemId]);

  const handleSelectItem = (id) => {
    if (!id) {
      console.warn('Attempted to select item with no ID');
      return;
    }
    
    if (selectedItems.includes(id)) {
      setSelectedItems(selectedItems.filter(itemId => itemId !== id));
      setSelectAll(false);
    } else {
      setSelectedItems([...selectedItems, id]);
    }
  };

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
    const totalQty = getTotalQuantity(item);
    
    if (totalQty === 0) {
      return <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300">Out of Stock</span>;
    }
    
    const hasLowStock = item.storageLocations?.some(loc => loc.status === 'low_stock');
    if (hasLowStock) {
      return <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300">Low Stock</span>;
    }
    
    return <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300">In Stock</span>;
  };

  const getUnitColor = (unit) => {
    const colors = {
      'pieces': 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-300',
      'boxes': 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300',
      'packs': 'bg-teal-100 dark:bg-teal-900/30 text-teal-800 dark:text-teal-300',
      'sets': 'bg-pink-100 dark:bg-pink-900/30 text-pink-800 dark:text-pink-300',
      'units': 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-800 dark:text-cyan-300',
      'kilograms': 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300',
      'grams': 'bg-lime-100 dark:bg-lime-900/30 text-lime-800 dark:text-lime-300',
      'liters': 'bg-sky-100 dark:bg-sky-900/30 text-sky-800 dark:text-sky-300',
      'milliliters': 'bg-violet-100 dark:bg-violet-900/30 text-violet-800 dark:text-violet-300',
      'meters': 'bg-fuchsia-100 dark:bg-fuchsia-900/30 text-fuchsia-800 dark:text-fuchsia-300',
      'centimeters': 'bg-rose-100 dark:bg-rose-900/30 text-rose-800 dark:text-rose-300',
      'dozen': 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300',
      'reams': 'bg-stone-100 dark:bg-stone-900/30 text-stone-800 dark:text-stone-300',
      'rolls': 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300',
      'bottles': 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300',
      'cans': 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300',
      'cartons': 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300',
      'pairs': 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300'
    };
    return colors[unit] || 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300';
  };

  const handleExport = () => {
    const headers = ['Name', 'Brand', 'Category', 'Unit', 'Marilao Qty', 'Balagtas Qty', 'Total Qty', 'Status', 'Cost Price', 'Selling Price', 'Product Code', 'Barcode', 'Description'];
    
    const csvContent = [
      headers.join(','),
      ...filteredItems.map(item => {
        const marilaoQty = getMarilaoQuantity(item);
        const balagtasQty = getBalagtasQuantity(item);
        const totalQty = getTotalQuantity(item);
        const unit = getUnitLabel(item.unit || 'pieces');
        
        return [
          `"${getSafeString(item.name)}"`,
          `"${getBrandName(item.brand)}"`,
          `"${getCategoryName(item.category)}"`,
          `"${unit}"`,
          marilaoQty,
          balagtasQty,
          totalQty,
          `"${getStatusBadge(item).props.children}"`,
          item.costPrice || 0,
          item.sellingPrice || 0,
          `"${getSafeString(item.productCode)}"`,
          `"${getSafeString(item.barcode)}"`,
          `"${getSafeString(item.description).replace(/"/g, '""')}"`
        ].join(',');
      })
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `inventory-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilterCategory('all');
    setFilterBrand('all');
    setFilterLocation('all');
    setFilterStatus('all');
    setFilterUnit('all');
    setCurrentPage(1);
  };

  const handleAddClick = () => {
    setSelectedItem(null);
    setFormMode('create');
    setShowForm(true);
  };

  const handleEditClick = (item) => {
    const itemId = getItemId(item);
    if (!itemId) {
      toast.error('Cannot edit item: No ID found');
      return;
    }
    setSelectedItem(item);
    setFormMode('edit');
    setShowForm(true);
  };

  const handleTransferClick = (item) => {
    const itemId = getItemId(item);
    if (!itemId) {
      toast.error('Cannot transfer: No ID found');
      return;
    }
    setSelectedItem(item);
    setFormMode('edit');
    setShowForm(true);
    // The form will open with transfer tab active
  };

  const handleFormSubmit = async (formData) => {
    try {
      setLoading(true);
      console.log('📝 Form submitted with data:', JSON.stringify(formData, null, 2));
      
      if (formMode === 'create') {
        console.log('🚀 Creating new item with data:', formData);
        await onAddNew(formData);
        toast.success('Item added successfully');
      } else if (formMode === 'edit') {
        const itemId = getItemId(selectedItem);
        if (!itemId) {
          toast.error('Cannot edit: Item has no ID');
          return;
        }
        
        const updateData = {
          ...formData,
          id: itemId,
          _id: itemId
        };
        
        console.log('📦 Updating item with data:', JSON.stringify(updateData, null, 2));
        await onEdit(updateData);
      }
      setShowForm(false);
      setSelectedItem(null);
    } catch (error) {
      console.error('❌ Form submission error:', error);
      
      let errorMessage = 'Failed to save item';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleFormDelete = (item) => {
    const itemId = getItemId(item);
    if (!itemId) {
      toast.error('Cannot delete: Item has no ID');
      return;
    }
    onDelete(item);
    setShowForm(false);
    setSelectedItem(null);
  };

  const toggleViewAll = () => {
    setViewAll(!viewAll);
    setCurrentPage(1); // Reset to first page when toggling
  };

  return (
    <>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow transition-colors duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Total Items: {summary.totalItems} | 
                Total Quantity: {summary.totalQuantity.toLocaleString()} | 
                Total Value: ₱{summary.totalValue.toLocaleString()}
              </p>
              <div className="flex space-x-4 mt-2 text-xs">
                <span className="flex items-center text-gray-600 dark:text-gray-400">
                  <span className="w-2 h-2 bg-green-600 rounded-full mr-1"></span>
                  Marilao: {summary.byLocation.MARILAO.quantity.toLocaleString()} (₱{summary.byLocation.MARILAO.value.toLocaleString()})
                </span>
                <span className="flex items-center text-gray-600 dark:text-gray-400">
                  <span className="w-2 h-2 bg-blue-600 rounded-full mr-1"></span>
                  Balagtas: {summary.byLocation.BALAGTAS.quantity.toLocaleString()} (₱{summary.byLocation.BALAGTAS.value.toLocaleString()})
                </span>
              </div>
              {/* Unit Summary */}
              {Object.keys(summary.byUnit).length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {Object.entries(summary.byUnit).map(([unit, data]) => (
                    <span key={unit} className={`text-xs px-2 py-1 rounded-full ${getUnitColor(unit)}`}>
                      {getUnitLabel(unit)}: {data.quantity}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <div className="flex space-x-2">
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
              <button
                onClick={toggleViewAll}
                className={`px-3 py-2 border rounded-md text-sm font-medium flex items-center transition-colors duration-200 ${
                  viewAll 
                    ? 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700' 
                    : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <List className="h-4 w-4 mr-2" />
                {viewAll ? 'Paginated View' : 'View All'}
              </button>
              <button
                onClick={handleAddClick}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium flex items-center transition-colors duration-200"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add New Item
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
                placeholder="Search by name, brand, category, unit, product code, barcode, or description..."
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-white dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700">
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
                    {(categories.length > 0 ? categories.map(c => c.name) : uniqueCategories).map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Brand</label>
                  <select
                    value={filterBrand}
                    onChange={(e) => {
                      setFilterBrand(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-md py-2 px-3 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  >
                    <option value="all">All Brands</option>
                    {(brands.length > 0 ? brands.map(b => b.name) : uniqueBrands).map(brand => (
                      <option key={brand} value={brand}>{brand}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Location</label>
                  <select
                    value={filterLocation}
                    onChange={(e) => {
                      setFilterLocation(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-md py-2 px-3 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  >
                    <option value="all">All Locations</option>
                    <option value="MARILAO">Marilao</option>
                    <option value="BALAGTAS">Balagtas</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Unit</label>
                  <select
                    value={filterUnit}
                    onChange={(e) => {
                      setFilterUnit(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-md py-2 px-3 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  >
                    <option value="all">All Units</option>
                    {uniqueUnits.map(unit => (
                      <option key={unit} value={unit}>{getUnitLabel(unit)}</option>
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
                  </select>
                </div>

                <div className="md:col-span-2 lg:col-span-4 flex justify-end">
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
              Showing {currentItems.length} of {filteredItems.length} items
              {viewAll && <span className="ml-2 text-blue-600 dark:text-blue-400">(View All Mode)</span>}
            </div>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedItems.length > 0 && (
          <div className="px-6 py-3 bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-800">
            <div className="flex items-center justify-between">
              <span className="text-sm text-blue-700 dark:text-blue-300">
                {selectedItems.length} item(s) selected
              </span>
              <div className="flex space-x-2">
                <button
                  onClick={() => {
                    setSelectedItems([]);
                    setSelectAll(false);
                  }}
                  className="px-3 py-1 bg-gray-600 text-white text-sm rounded-md hover:bg-gray-700"
                >
                  Clear
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Scrollable Table Container */}
        <div className="relative">
          <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-white dark:from-gray-800 to-transparent pointer-events-none z-10"></div>
          <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white dark:from-gray-800 to-transparent pointer-events-none z-10"></div>
          
          <div className="overflow-x-auto overflow-y-visible">
            <div className="inline-block min-w-full align-middle">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 table-auto">
                <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0 z-20">
                  <tr>
                    <th className="px-6 py-3 bg-gray-50 dark:bg-gray-700 sticky left-0 z-30 shadow-sm">
                      <input
                        type="checkbox"
                        checked={selectAll}
                        onChange={() => setSelectAll(!selectAll)}
                        className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 bg-white dark:bg-gray-800"
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer bg-gray-50 dark:bg-gray-700" onClick={() => requestSort('name')}>
                      <div className="flex items-center whitespace-nowrap">
                        ITEM {getSortIcon('name')}
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer bg-gray-50 dark:bg-gray-700" onClick={() => requestSort('brand')}>
                      <div className="flex items-center whitespace-nowrap">
                        BRAND {getSortIcon('brand')}
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer bg-gray-50 dark:bg-gray-700" onClick={() => requestSort('category')}>
                      <div className="flex items-center whitespace-nowrap">
                        CATEGORY {getSortIcon('category')}
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer bg-gray-50 dark:bg-gray-700" onClick={() => requestSort('unit')}>
                      <div className="flex items-center whitespace-nowrap">
                        <Scale className="h-4 w-4 mr-1 text-gray-600 dark:text-gray-400" />
                        UNIT {getSortIcon('unit')}
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer bg-gray-50 dark:bg-gray-700" onClick={() => requestSort('marilao_qty')}>
                      <div className="flex items-center whitespace-nowrap">
                        <MapPin className="h-4 w-4 mr-1 text-green-600 dark:text-green-400" />
                        MARILAO {getSortIcon('marilao_qty')}
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer bg-gray-50 dark:bg-gray-700" onClick={() => requestSort('balagtas_qty')}>
                      <div className="flex items-center whitespace-nowrap">
                        <MapPin className="h-4 w-4 mr-1 text-blue-600 dark:text-blue-400" />
                        BALAGTAS {getSortIcon('balagtas_qty')}
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer bg-gray-50 dark:bg-gray-700" onClick={() => requestSort('quantity')}>
                      <div className="flex items-center whitespace-nowrap">
                        TOTAL QTY {getSortIcon('quantity')}
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider bg-gray-50 dark:bg-gray-700">
                      <div className="whitespace-nowrap">STATUS</div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer bg-gray-50 dark:bg-gray-700" onClick={() => requestSort('value')}>
                      <div className="flex items-center whitespace-nowrap">
                        COST {getSortIcon('value')}
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider bg-gray-50 dark:bg-gray-700">
                      <div className="whitespace-nowrap">DESCRIPTION</div>
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider bg-gray-50 dark:bg-gray-700 sticky right-0 z-30 shadow-sm">
                      <div className="whitespace-nowrap">ACTIONS</div>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {loading ? (
                    <tr>
                      <td colSpan="12" className="px-6 py-4 text-center">
                        <Loader />
                      </td>
                    </tr>
                  ) : currentItems.length > 0 ? (
                    currentItems.map((item) => {
                      const itemId = getItemId(item);
                      const hasId = itemId !== null;
                      const marilaoQty = getMarilaoQuantity(item);
                      const balagtasQty = getBalagtasQuantity(item);
                      const totalQty = getTotalQuantity(item);
                      const totalValue = totalQty * (item.costPrice || 0);
                      const unit = item.unit || 'pieces';
                      const unitLabel = getUnitLabel(unit);
                      
                      return (
                        <tr key={itemId || Math.random()} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                          <td className="px-6 py-4 sticky left-0 z-10 bg-white dark:bg-gray-800 shadow-sm">
                            <input
                              type="checkbox"
                              checked={hasId && selectedItems.includes(itemId)}
                              onChange={() => handleSelectItem(itemId)}
                              className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 bg-white dark:bg-gray-800"
                              disabled={!hasId}
                            />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900 dark:text-white">{getSafeString(item.name)}</div>
                              {item.productCode && (
                                <div className="text-xs text-gray-500 dark:text-gray-400">Code: {getSafeString(item.productCode)}</div>
                              )}
                              {item.barcode && (
                                <div className="text-xs text-gray-500 dark:text-gray-400">Barcode: {getSafeString(item.barcode)}</div>
                              )}
                              {!hasId && (
                                <div className="text-xs text-red-500 dark:text-red-400">Warning: No ID</div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {getBrandName(item.brand)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {getCategoryName(item.category)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getUnitColor(unit)}`}>
                              {unitLabel}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <span className={`
                              ${marilaoQty === 0 ? 'text-gray-400 dark:text-gray-500' : 'text-green-600 dark:text-green-400 font-semibold'}
                            `}>
                              {marilaoQty} {marilaoQty !== 0 && unitLabel}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <span className={`
                              ${balagtasQty === 0 ? 'text-gray-400 dark:text-gray-500' : 'text-blue-600 dark:text-blue-400 font-semibold'}
                            `}>
                              {balagtasQty} {balagtasQty !== 0 && unitLabel}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <span className={`
                              ${totalQty === 0 ? 'text-red-600 dark:text-red-400' : ''}
                              ${totalQty > 0 && totalQty < 10 ? 'text-yellow-600 dark:text-yellow-400' : ''}
                              ${totalQty >= 10 ? 'text-gray-900 dark:text-white' : ''}
                            `}>
                              {totalQty} {totalQty !== 0 && unitLabel}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {getStatusBadge(item)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            ₱{totalValue.toLocaleString()}
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-500 dark:text-gray-400 max-w-xs truncate" title={getSafeString(item.description)}>
                              {getSafeString(item.description) || '—'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium sticky right-0 z-10 bg-white dark:bg-gray-800 shadow-sm">
                            <div className="flex justify-end space-x-2">
                              <button
                                onClick={() => handleEditClick(item)}
                                className={`p-1 rounded-full hover:bg-blue-50 dark:hover:bg-blue-900/30 ${
                                  hasId ? 'text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300' : 'text-gray-400 dark:text-gray-600 cursor-not-allowed'
                                }`}
                                title="Edit"
                                disabled={!hasId}
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => onDelete(item)}
                                className={`p-1 rounded-full hover:bg-red-50 dark:hover:bg-red-900/30 ${
                                  hasId ? 'text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300' : 'text-gray-400 dark:text-gray-600 cursor-not-allowed'
                                }`}
                                title="Delete"
                                disabled={!hasId}
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="12" className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
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
          </div>
        </div>

        {/* Scroll hint */}
        <div className="px-6 py-2 text-xs text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 flex justify-between items-center">
          <span>← Scroll left to see more columns</span>
          <span>Scroll right to see actions →</span>
        </div>

        {/* Pagination - Only show when not in view all mode */}
        {!viewAll && (
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
                <div className="flex space-x-1">
                  {[...Array(Math.min(5, totalPages))].map((_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    
                    return (
                      <button
                        key={i}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`px-3 py-1 border rounded-md text-sm font-medium transition-colors duration-200 ${
                          currentPage === pageNum
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
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
        
        {/* View All indicator - Show when in view all mode */}
        {viewAll && (
          <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
            <div className="flex items-center justify-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Showing all {sortedItems.length} items
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Asset Form Modal */}
      {showForm && (
        <AssetForm
          item={selectedItem}
          mode={formMode}
          onClose={() => {
            setShowForm(false);
            setSelectedItem(null);
          }}
          onSubmit={handleFormSubmit}
          onDelete={handleFormDelete}
          onStockIn={onStockIn}
          onStockOut={onStockOut}
        />
      )}
    </>
  );
};

export default AvailableAsset;