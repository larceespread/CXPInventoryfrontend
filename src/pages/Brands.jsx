// pages/Brands.jsx
import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Search,
  X,
  Save,
  Package
} from 'lucide-react';
import { brandService } from '../services/brandService';
import toast from 'react-hot-toast';
import Loader from '../components/common/Loader';
import { useTheme } from '../context/ThemeContext';

const Brands = () => {
  const { isDarkMode } = useTheme();
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formMode, setFormMode] = useState('create');
  const [selectedBrand, setSelectedBrand] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: 'active'
  });
  const [lastFetchTime, setLastFetchTime] = useState(null);

  const CACHE_KEY = 'brands_cache';
  const CACHE_TIMESTAMP_KEY = 'brands_cache_timestamp';
  const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

  const getBrandId = (brand) => {
    if (!brand) return null;
    return brand._id || brand.id || null;
  };

  // Load cached data on initial mount
  useEffect(() => {
    const loadCachedData = () => {
      try {
        const cachedData = localStorage.getItem(CACHE_KEY);
        const cachedTimestamp = localStorage.getItem(CACHE_TIMESTAMP_KEY);
        
        if (cachedData && cachedTimestamp) {
          const parsedData = JSON.parse(cachedData);
          const timestamp = parseInt(cachedTimestamp);
          const now = Date.now();
          
          // Check if cache is still valid (less than 5 minutes old)
          if (now - timestamp < CACHE_DURATION) {
            setBrands(Array.isArray(parsedData) ? parsedData : []);
            setLastFetchTime(timestamp);
            return true; // Cache was used
          }
        }
        return false; // No valid cache
      } catch (error) {
        console.error('Error loading cached data:', error);
        return false;
      }
    };

    // Try to load from cache first
    const cacheLoaded = loadCachedData();
    
    // If no valid cache, fetch from API
    if (!cacheLoaded) {
      fetchBrands();
    }
  }, []);

  const saveToLocalStorage = (data) => {
    try {
      const now = Date.now();
      localStorage.setItem(CACHE_KEY, JSON.stringify(data));
      localStorage.setItem(CACHE_TIMESTAMP_KEY, now.toString());
      setLastFetchTime(now);
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  };

  const fetchBrands = async (forceRefresh = false) => {
    setLoading(true);
    try {
      const response = await brandService.getBrands();
      const brandsData = response.data || response || [];
      const brandsArray = Array.isArray(brandsData) ? brandsData : [];
      
      setBrands(brandsArray);
      
      // Save to localStorage
      saveToLocalStorage(brandsArray);
      
    } catch (error) {
      console.error('Error fetching brands:', error);
      toast.error('Failed to load brands');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('Brand name is required');
      return;
    }

    setLoading(true);
    try {
      if (formMode === 'create') {
        const response = await brandService.createBrand(formData);
        const newBrand = response.data || response;
        const updatedBrands = [...brands, newBrand];
        setBrands(updatedBrands);
        saveToLocalStorage(updatedBrands);
        toast.success('Brand added successfully');
      } else {
        const brandId = getBrandId(selectedBrand);
        if (!brandId) {
          toast.error('Cannot update: Brand ID not found');
          return;
        }
        const response = await brandService.updateBrand(brandId, formData);
        const updatedBrand = response.data || response;
        const updatedBrands = brands.map(brand => 
          (getBrandId(brand) === brandId) ? updatedBrand : brand
        );
        setBrands(updatedBrands);
        saveToLocalStorage(updatedBrands);
        toast.success('Brand updated successfully');
      }
      
      setFormData({ name: '', description: '', status: 'active' });
      setShowForm(false);
      setSelectedBrand(null);
    } catch (error) {
      console.error('Error saving brand:', error);
      toast.error(error.response?.data?.message || 'Failed to save brand');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (brand) => {
    setSelectedBrand(brand);
    setFormData({
      name: brand.name || '',
      description: brand.description || '',
      status: brand.status || 'active'
    });
    setFormMode('edit');
    setShowForm(true);
  };

  const handleDelete = async (brand) => {
    const brandId = getBrandId(brand);
    
    if (!brandId) {
      toast.error('Cannot delete: Brand ID not found');
      return;
    }

    if (!window.confirm(`Are you sure you want to delete ${brand.name || 'this brand'}?`)) {
      return;
    }

    setLoading(true);
    try {
      await brandService.deleteBrand(brandId);
      const updatedBrands = brands.filter(b => getBrandId(b) !== brandId);
      setBrands(updatedBrands);
      saveToLocalStorage(updatedBrands);
      toast.success('Brand deleted successfully');
    } catch (error) {
      console.error('Error deleting brand:', error);
      toast.error(error.response?.data?.message || 'Failed to delete brand');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setSelectedBrand(null);
    setFormData({ name: '', description: '', status: 'active' });
  };

  const handleRefresh = () => {
    fetchBrands(true);
  };

  const filteredBrands = brands.filter(brand => 
    brand.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    brand.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatLastFetchTime = () => {
    if (!lastFetchTime) return 'Never';
    
    const now = Date.now();
    const diff = now - lastFetchTime;
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)} minutes ago`;
    return `${Math.floor(diff / 3600000)} hours ago`;
  };

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-100'} transition-colors duration-200`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Brands</h1>
            <div className="flex items-center gap-2">
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} mt-1`}>
                Total Brands: {brands.length}
              </p>
              <span className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'} mt-1`}>
                (Last updated: {formatLastFetchTime()})
              </span>
              <button
                onClick={handleRefresh}
                className={`text-xs ${isDarkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'} mt-1 underline`}
                disabled={loading}
              >
                Refresh
              </button>
            </div>
          </div>
          <button
            onClick={() => {
              setFormMode('create');
              setShowForm(true);
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium flex items-center transition-colors duration-200"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add New Brand
          </button>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />
            <input
              type="text"
              placeholder="Search brands..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`pl-10 pr-4 py-2 w-full border rounded-md focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 ${
                isDarkMode 
                  ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500' 
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
              }`}
            />
          </div>
        </div>

        {/* Add/Edit Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-80 flex items-center justify-center z-50">
            <div className={`rounded-lg shadow-xl w-full max-w-md ${isDarkMode ? 'bg-gray-800' : 'bg-white'} transition-colors duration-200`}>
              {/* Form Header */}
              <div className={`flex justify-between items-center p-6 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                <h2 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {formMode === 'create' ? 'Add New Brand' : 'Edit Brand'}
                </h2>
                <button 
                  onClick={handleCancel}
                  className={`${isDarkMode ? 'text-gray-400 hover:text-gray-300 hover:bg-gray-700' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'} p-2 rounded-full transition-colors duration-200`}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Form Body */}
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                    Brand Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className={`w-full border rounded-md py-2 px-3 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 ${
                      isDarkMode 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                    placeholder="Enter brand name"
                    required
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows="3"
                    className={`w-full border rounded-md py-2 px-3 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 ${
                      isDarkMode 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                    placeholder="Enter brand description (optional)"
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                    Status
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className={`w-full border rounded-md py-2 px-3 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 ${
                      isDarkMode 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>

                {/* Form Actions */}
                <div className={`flex justify-end space-x-3 pt-4 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                  <button
                    type="button"
                    onClick={handleCancel}
                    className={`px-4 py-2 border rounded-md text-sm font-medium transition-colors duration-200 ${
                      isDarkMode 
                        ? 'border-gray-600 text-gray-300 hover:bg-gray-700' 
                        : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium flex items-center disabled:opacity-50 transition-colors duration-200"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        {formMode === 'create' ? 'Add Brand' : 'Update Brand'}
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Brands List */}
        <div className={`shadow sm:rounded-lg overflow-hidden ${isDarkMode ? 'bg-gray-800' : 'bg-white'} transition-colors duration-200`}>
          {loading && !showForm ? (
            <div className="p-8">
              <Loader />
            </div>
          ) : filteredBrands.length > 0 ? (
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className={isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}>
                <tr>
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                    Brand Name
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                    Description
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                    Status
                  </th>
                  <th className={`px-6 py-3 text-right text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className={`divide-y divide-gray-200 dark:divide-gray-700 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                {filteredBrands.map((brand) => {
                  const brandId = getBrandId(brand);
                  return (
                    <tr key={brandId || Math.random()} className={`${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'} transition-colors duration-200`}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{brand.name}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className={`text-sm max-w-xs truncate ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`} title={brand.description}>
                          {brand.description || '—'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          brand.status === 'active' 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                        }`}>
                          {brand.status || 'active'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => handleEdit(brand)}
                            className="p-1 rounded-full hover:bg-blue-50 dark:hover:bg-blue-900 text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 transition-colors duration-200"
                            title="Edit"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(brand)}
                            className="p-1 rounded-full hover:bg-red-50 dark:hover:bg-red-900 text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 transition-colors duration-200"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className={`p-8 text-center ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              <Package className={`h-12 w-12 mx-auto mb-3 ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`} />
              <p className={`text-lg font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>No brands found</p>
              <p className={`text-sm mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {searchTerm ? 'Try adjusting your search' : 'Click "Add New Brand" to create your first brand'}
              </p>
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm transition-colors duration-200"
                >
                  Clear Search
                </button>
              )}
            </div>
          )}

          {/* Footer with count */}
          {filteredBrands.length > 0 && (
            <div className={`px-6 py-3 border-t ${isDarkMode ? 'border-gray-700 bg-gray-700' : 'border-gray-200 bg-gray-50'} transition-colors duration-200`}>
              <div className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Showing <span className="font-medium">{filteredBrands.length}</span> of{' '}
                <span className="font-medium">{brands.length}</span> brands
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Brands;