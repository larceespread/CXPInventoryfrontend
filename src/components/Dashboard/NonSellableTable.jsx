// components/Dashboard/NonSellableTable.jsx
import React from 'react';

const NonSellableTable = ({ data = [], storageLocation = 'BALAGTAS' }) => {
  // Filter items based on storage location
  const filteredData = data?.filter(item => 
    (item.storage === storageLocation || item.storageLocation === storageLocation)
  ) || [];

  // Group items by category for better organization
  const equipmentItems = filteredData.filter(item => 
    item.category === 'EQUIPMENT' || item.category?.name === 'EQUIPMENT'
  );
  
  const collateralsItems = filteredData.filter(item => 
    item.category === 'COLLATERALS' || item.category?.name === 'COLLATERALS'
  );
  
  const merchItems = filteredData.filter(item => 
    (item.category === 'MERCH' || item.category?.name === 'MERCH') && 
    (item.qty === 0 || item.quantity === 0)
  ); // Zero stock merch as non-sellable

  const hasItems = equipmentItems.length > 0 || collateralsItems.length > 0 || merchItems.length > 0;

  const getQuantity = (item) => {
    return item.qty || item.quantity || 0;
  };

  const renderTable = (items, title) => {
    if (items.length === 0) return null;

    return (
      <div className="mb-6 last:mb-0" key={title}>
        <h4 className="text-md font-semibold text-gray-700 mb-3 px-6">{title}</h4>
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Brand</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {items.map((item, index) => {
              const itemId = item._id || item.id || index;
              const quantity = getQuantity(item);
              const brandName = typeof item.brand === 'object' ? item.brand.name : (item.brand || 'N/A');
              const categoryName = typeof item.category === 'object' ? item.category.name : item.category;
              
              return (
                <tr key={itemId} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{brandName}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <span className={quantity === 0 ? 'text-red-600 font-medium' : ''}>
                      {quantity.toLocaleString()}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      quantity === 0 ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {quantity === 0 ? 'Out of Stock' : 'Non-Sellable'}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">{storageLocation} Storage - Non-Sellable Items</h3>
        <p className="text-sm text-gray-500 mt-1">Equipment, Collaterals, and Out of Stock Items</p>
      </div>
      
      <div className="py-4">
        {!hasItems ? (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-2">No non-sellable items in {storageLocation}</p>
            <p className="text-sm text-gray-400">All items are in good selling condition</p>
          </div>
        ) : (
          <div className="space-y-6">
            {renderTable(equipmentItems, 'EQUIPMENT')}
            {renderTable(collateralsItems, 'COLLATERALS')}
            {renderTable(merchItems, 'MERCH (Out of Stock)')}
          </div>
        )}
      </div>

      <div className="px-6 py-4 border-t border-gray-200">
        <p className="text-sm text-gray-500">
          Total Non-Sellable Items: {filteredData.length} | 
          Last Updated: {new Date().toLocaleDateString()}
        </p>
      </div>
    </div>
  );
};

export default NonSellableTable;