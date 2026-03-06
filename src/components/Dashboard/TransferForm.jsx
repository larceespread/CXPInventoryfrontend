import React, { useState } from 'react';
import { X, Truck, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';

const TransferForm = ({ items, mode, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    destination: '',
    notes: '',
    transferDate: new Date().toISOString().split('T')[0]
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.destination) {
      toast.error('Please select a destination');
      return;
    }

    onSubmit(formData);
  };

  const totalQuantity = items.reduce((sum, item) => sum + (item.qty || item.quantity || 0), 0);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-lg font-semibold">
            {mode === 'single' ? 'Transfer Item' : 'Bulk Transfer Items'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4">
            {/* Items Summary */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Items to Transfer:</h3>
              {items.length > 3 ? (
                <>
                  <p className="text-sm text-gray-600">
                    {items.slice(0, 3).map(i => i.name).join(', ')} and {items.length - 3} more
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    Total Items: {items.length} | Total Quantity: {totalQuantity}
                  </p>
                </>
              ) : (
                <ul className="space-y-1">
                  {items.map(item => (
                    <li key={item.id} className="text-sm text-gray-600 flex justify-between">
                      <span>{item.name}</span>
                      <span className="font-medium">Qty: {item.qty || item.quantity}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Destination */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Destination <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <select
                  name="destination"
                  value={formData.destination}
                  onChange={handleChange}
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">Select destination</option>
                  <option value="BALAGTAS">BALAGTAS</option>
                  <option value="MARILAO">MARILAO</option>
                </select>
              </div>
            </div>

            {/* Transfer Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Transfer Date
              </label>
              <input
                type="date"
                name="transferDate"
                value={formData.transferDate}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-md py-2 px-3 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows="3"
                placeholder="Add any notes about this transfer..."
                className="w-full border border-gray-300 rounded-md py-2 px-3 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 p-6 border-t bg-gray-50">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium flex items-center"
            >
              <Truck className="h-4 w-4 mr-2" />
              Transfer Items
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TransferForm;