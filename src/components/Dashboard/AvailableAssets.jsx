// components/Dashboard/AvailableAssets.jsx
import React from 'react';
import AvailableAsset from '../Inventory/AvailableAsset';

const AvailableAssets = ({ 
  inventory = [], 
  onStockIn, 
  onStockOut, 
  onEdit, 
  onDelete, 
  onAddNew 
}) => {
  // Log props for debugging
  console.log('AvailableAssets props:', {
    hasOnEdit: typeof onEdit === 'function',
    hasOnAddNew: typeof onAddNew === 'function',
    hasOnDelete: typeof onDelete === 'function',
    hasOnStockIn: typeof onStockIn === 'function',
    hasOnStockOut: typeof onStockOut === 'function',
    inventoryLength: inventory.length
  });

  return (
    <AvailableAsset
      inventory={inventory}
      onStockIn={onStockIn}
      onStockOut={onStockOut}
      onEdit={onEdit}
      onDelete={onDelete}
      onAddNew={onAddNew}
    />
  );
};

export default AvailableAssets;