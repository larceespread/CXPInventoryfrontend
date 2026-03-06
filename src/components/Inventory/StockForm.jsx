// components/Inventory/StockForm.jsx
import React, { useState, useEffect } from 'react';
import { X, Package, Truck, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import Loader from '../common/Loader';

const StockForm = ({ item, items, mode, onClose, onSubmit }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    quantity: 1,
    source: 'office_inventory',
    sourceCustom: '',
    destination: 'balagtas',
    destinationCustom: '',
    reason: '',
    notes: ''
  });

  // Get available quantity based on mode and selection
  const getAvailableQuantity = () => {
    if (mode === 'stockin') return Infinity;
    
    if (Array.isArray(items)) {
      return items.reduce((sum, i) => {
        if (i.storageLocations) {
          return sum + i.storageLocations.reduce((locSum, loc) => locSum + (loc.quantity || 0), 0);
        }
        return sum + (i.quantity || i.qty || 0);
      }, 0);
    }
    
    if (item) {
      if (item.storageLocations) {
        return item.storageLocations.reduce((sum, loc) => sum + (loc.quantity || 0), 0);
      }
      return item.quantity || item.qty || 0;
    }
    
    return 0;
  };

  // Sources for Stock In
  const sources = [
    { value: 'office_inventory', label: 'Office Inventory' },
    { value: 'direct_supplier', label: 'Direct Supplier' },
    { value: 'local_supplier', label: 'Local Supplier' },
    { value: 'others', label: 'Others (Specify)' }
  ];

  // Destinations for Stock In
  const destinationsStockIn = [
    { value: 'BALAGTAS', label: 'Balagtas Warehouse' },
    { value: 'MARILAO', label: 'Marilao Warehouse' },
    { value: 'office', label: 'Office Inventory' },
    { value: 'others', label: 'Others (Specify)' }
  ];

  // Sources for Stock Out
  const sourcesStockOut = [
    { value: 'BALAGTAS', label: 'Balagtas Warehouse' },
    { value: 'MARILAO', label: 'Marilao Warehouse' },
    { value: 'office', label: 'Office Inventory' },
    { value: 'others', label: 'Others (Specify)' }
  ];

  // Destinations for Stock Out
  const destinationsStockOut = [
    { value: 'BALAGTAS', label: 'Balagtas Warehouse' },
    { value: 'MARILAO', label: 'Marilao Warehouse' },
    { value: 'office', label: 'Office Inventory' },
    { value: 'others', label: 'Others (Specify)' }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.quantity <= 0) {
      toast.error('Quantity must be greater than 0');
      return;
    }

    const availableQty = getAvailableQuantity();
    if (mode === 'stockout' && formData.quantity > availableQty) {
      toast.error(`Quantity cannot exceed available stock (${availableQty})`);
      return;
    }

    if (formData.source === 'others' && !formData.sourceCustom.trim()) {
      toast.error('Please specify the source');
      return;
    }

    if (formData.destination === 'others' && !formData.destinationCustom.trim()) {
      toast.error('Please specify the destination');
      return;
    }

    setLoading(true);
    try {
      const submissionData = {
        quantity: parseInt(formData.quantity),
        source: formData.source === 'others' ? formData.sourceCustom : formData.source,
        destination: formData.destination === 'others' ? formData.destinationCustom : formData.destination,
        sourceType: formData.source,
        destinationType: formData.destination,
        reason: formData.reason,
        notes: formData.notes,
        mode: mode,
        shouldDelete: mode === 'stockout'
      };

      await onSubmit(submissionData);
    } catch (error) {
      console.error('Stock operation error:', error);
      toast.error(error.message || 'Failed to process stock operation');
    } finally {
      setLoading(false);
    }
  };

  const getItemName = () => {
    if (Array.isArray(items)) {
      return `${items.length} items selected for ${mode === 'stockin' ? 'stock in' : 'stock out'}`;
    }
    return item?.name || 'Unknown Item';
  };

  const getTotalQuantity = () => {
    if (Array.isArray(items)) {
      return items.reduce((sum, i) => {
        if (i.storageLocations) {
          return sum + i.storageLocations.reduce((locSum, loc) => locSum + (loc.quantity || 0), 0);
        }
        return sum + (i.quantity || i.qty || 0);
      }, 0);
    }
    
    if (item) {
      if (item.storageLocations) {
        return item.storageLocations.reduce((sum, loc) => sum + (loc.quantity || 0), 0);
      }
      return item.quantity || item.qty || 0;
    }
    
    return 0;
  };

  const getCurrentLocation = () => {
    if (Array.isArray(items)) return 'Multiple locations';
    if (item?.storageLocations) {
      const locations = item.storageLocations
        .filter(loc => loc.quantity > 0)
        .map(loc => `${loc.location}: ${loc.quantity}`)
        .join(', ');
      return locations || item.storageLocation || item?.storage || 'N/A';
    }
    return item?.storageLocation || item?.storage || 'N/A';
  };

  const isDestinationRemoving = () => {
    return mode === 'stockout' && (formData.destination === 'office' || formData.destination === 'others');
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 dark:bg-opacity-70 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-lg bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 transition-colors duration-200">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {mode === 'stockin' ? 'Stock In - Add Items' : 'Stock Out - Remove Items'}
          </h3>
          <button 
            onClick={onClose} 
            className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-gray-50 dark:bg-gray-900/50 p-3 rounded-lg">
            <div className="flex items-start">
              <Package className="h-5 w-5 text-gray-400 dark:text-gray-500 mr-2 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-white">{getItemName()}</p>
                {!Array.isArray(items) && item && (
                  <div className="mt-1 text-xs text-gray-500 dark:text-gray-400 space-y-1">
                    <p>Current Location(s): {getCurrentLocation()}</p>
                    <p>Available Quantity: {getTotalQuantity()}</p>
                    {item.productCode && <p>Code: {item.productCode}</p>}
                  </div>
                )}
                {Array.isArray(items) && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Total Available: {getTotalQuantity()} units across {items.length} items
                  </p>
                )}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Quantity <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="1"
              max={mode === 'stockout' ? getTotalQuantity() : undefined}
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-md py-2 px-3 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              required
            />
            {mode === 'stockout' && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Max available: {getTotalQuantity()}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Source <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.source}
              onChange={(e) => setFormData({ ...formData, source: e.target.value })}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-md py-2 px-3 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              required
            >
              {mode === 'stockin' 
                ? sources.map(source => (
                    <option key={source.value} value={source.value}>
                      {source.label}
                    </option>
                  ))
                : sourcesStockOut.map(source => (
                    <option key={source.value} value={source.value}>
                      {source.label}
                    </option>
                  ))
              }
            </select>

            {formData.source === 'others' && (
              <input
                type="text"
                placeholder="Specify source"
                value={formData.sourceCustom}
                onChange={(e) => setFormData({ ...formData, sourceCustom: e.target.value })}
                className="mt-2 w-full border border-gray-300 dark:border-gray-600 rounded-md py-2 px-3 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                required={formData.source === 'others'}
              />
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Destination <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.destination}
              onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-md py-2 px-3 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              required
            >
              {mode === 'stockin' 
                ? destinationsStockIn.map(dest => (
                    <option key={dest.value} value={dest.value}>
                      {dest.label}
                    </option>
                  ))
                : destinationsStockOut.map(dest => (
                    <option key={dest.value} value={dest.value}>
                      {dest.label}
                    </option>
                  ))
              }
            </select>

            {formData.destination === 'others' && (
              <input
                type="text"
                placeholder="Specify destination"
                value={formData.destinationCustom}
                onChange={(e) => setFormData({ ...formData, destinationCustom: e.target.value })}
                className="mt-2 w-full border border-gray-300 dark:border-gray-600 rounded-md py-2 px-3 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                required={formData.destination === 'others'}
              />
            )}

            {isDestinationRemoving() && (
              <div className="mt-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
                <div className="flex items-start">
                  <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400 mr-2 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-yellow-700 dark:text-yellow-400">
                    <span className="font-medium">Note:</span> This is a transfer/movement of items.
                  </p>
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Reason/Purpose
            </label>
            <input
              type="text"
              placeholder={mode === 'stockin' ? 'e.g., Restocking, New arrival, etc.' : 'e.g., Sale, Transfer, Disposal, etc.'}
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-md py-2 px-3 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Additional Notes
            </label>
            <textarea
              placeholder="Any additional information..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows="2"
              className="w-full border border-gray-300 dark:border-gray-600 rounded-md py-2 px-3 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`px-4 py-2 rounded-md text-sm font-medium text-white flex items-center ${
                mode === 'stockin' 
                  ? 'bg-green-600 hover:bg-green-700' 
                  : 'bg-yellow-600 hover:bg-yellow-700'
              } disabled:opacity-50`}
            >
              {loading ? (
                <>
                  <Loader size="small" color="white" />
                  <span className="ml-2">Processing...</span>
                </>
              ) : (
                <>
                  <Truck className="h-4 w-4 mr-2" />
                  {mode === 'stockin' ? 'Add to Inventory' : 'Remove from Inventory'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StockForm;