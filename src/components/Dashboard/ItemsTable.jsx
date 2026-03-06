// components/Dashboard/ItemsTable.jsx
import React from 'react';
import { ArrowDownCircle, ArrowUpCircle, RotateCcw } from 'lucide-react';

const ItemsTable = ({ data = [], title, onStockIn, onStockOut, onReturn, type = 'management' }) => {
  const getStatusBadge = (item) => {
    const quantity = item.qty || item.quantity || 0;
    
    if (item.status === 'borrowed') {
      return <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">Borrowed</span>;
    } else if (item.status === 'out_of_stock' || quantity === 0) {
      return <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">Out of Stock</span>;
    } else if (quantity < 10) {
      return <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">Low Stock</span>;
    } else {
      return <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">In Stock</span>;
    }
  };

  const getLocation = (item) => {
    return item.storage || item.storageLocation || 'N/A';
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

  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">{title}</h2>
        <p className="text-gray-500 text-center py-8">No items to display</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="text-sm text-gray-500 mt-1">{data.length} item(s) need attention</p>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Brand</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map((item) => {
              const itemId = item._id || item.id;
              const quantity = item.qty || item.quantity || 0;
              
              return (
                <tr key={itemId} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{getBrandName(item.brand)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{getCategoryName(item.category)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{getLocation(item)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{quantity}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(item)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex space-x-2">
                      {item.status === 'borrowed' && type === 'borrowed' && (
                        <button
                          onClick={() => onReturn(item)}
                          className="text-blue-600 hover:text-blue-900 flex items-center"
                          title="Return to storage"
                        >
                          <RotateCcw className="h-4 w-4 mr-1" />
                          Return
                        </button>
                      )}
                      
                      {(type === 'management' || type === 'borrowed') && (
                        <>
                          {item.status !== 'borrowed' && (
                            <>
                              <button
                                onClick={() => onStockIn(item)}
                                className="text-green-600 hover:text-green-900 flex items-center"
                                title="Stock In"
                              >
                                <ArrowDownCircle className="h-4 w-4 mr-1" />
                                Stock In
                              </button>
                              {quantity > 0 && (
                                <button
                                  onClick={() => onStockOut(item)}
                                  className="text-orange-600 hover:text-orange-900 flex items-center"
                                  title="Stock Out"
                                >
                                  <ArrowUpCircle className="h-4 w-4 mr-1" />
                                  Stock Out
                                </button>
                              )}
                            </>
                          )}
                          {item.status === 'borrowed' && (
                            <button
                              onClick={() => onReturn(item)}
                              className="text-blue-600 hover:text-blue-900 flex items-center"
                              title="Return to storage"
                            >
                              <RotateCcw className="h-4 w-4 mr-1" />
                              Return
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ItemsTable;