// pages/shipments/PendingReturns.jsx - FINAL VERSION WITH ONE-TIME RETURN

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Package,
  Truck,
  Calendar,
  User,
  MapPin,
  RotateCcw,
  CheckCircle,
  XCircle,
  AlertCircle,
  Search,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Loader,
  X,
  Clock,
  AlertTriangle,
  ShoppingBag
} from 'lucide-react';
import { useShipment } from '../../context/ShipmentContext';
import toast from 'react-hot-toast';

const PendingReturns = () => {
  const navigate = useNavigate();
  const { 
    fetchPendingReturns, 
    pendingReturns, 
    loading, 
    returnItems,
    fetchShipments 
  } = useShipment();
  
  const [filteredItems, setFilteredItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [locationFilter, setLocationFilter] = useState('all');
  const [shipmentFilter, setShipmentFilter] = useState('all');
  const [sortBy, setSortBy] = useState('shipmentNumber');
  const [sortOrder, setSortOrder] = useState('asc');
  const [expandedShipments, setExpandedShipments] = useState({});
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [selectedShipment, setSelectedShipment] = useState(null);
  const [returnQuantity, setReturnQuantity] = useState(0);
  const [returnCondition, setReturnCondition] = useState('good');
  const [returnRemarks, setReturnRemarks] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [stats, setStats] = useState({
    totalPending: 0,
    totalShipments: 0,
    totalItems: 0,
    byLocation: {
      BALAGTAS: 0,
      MARILAO: 0
    }
  });

  useEffect(() => {
    loadPendingReturns();
  }, []);

  useEffect(() => {
    filterAndSortItems();
  }, [pendingReturns, searchTerm, locationFilter, shipmentFilter, sortBy, sortOrder]);

  const loadPendingReturns = async () => {
    try {
      const data = await fetchPendingReturns();
      console.log('Pending returns loaded:', data);
      
      // Filter out shipments that already have returns
      const filteredData = data.filter(shipment => 
        !shipment.hasReturns && 
        shipment.pendingItems && 
        shipment.pendingItems.length > 0
      );
      
      calculateStats(filteredData);
    } catch (error) {
      toast.error('Failed to load pending returns');
    }
  };

  const calculateStats = (data) => {
    if (!data || data.length === 0) {
      setStats({
        totalPending: 0,
        totalShipments: 0,
        totalItems: 0,
        byLocation: { BALAGTAS: 0, MARILAO: 0 }
      });
      return;
    }

    let totalPendingQty = 0;
    let totalItems = 0;
    const byLocation = { BALAGTAS: 0, MARILAO: 0 };

    data.forEach(shipment => {
      if (shipment.pendingItems) {
        shipment.pendingItems.forEach(item => {
          totalPendingQty += item.pendingQuantity;
          totalItems++;
          
          const location = item.location || 'BALAGTAS';
          if (location === 'BALAGTAS') {
            byLocation.BALAGTAS += item.pendingQuantity;
          } else if (location === 'MARILAO') {
            byLocation.MARILAO += item.pendingQuantity;
          }
        });
      }
    });

    setStats({
      totalPending: totalPendingQty,
      totalShipments: data.length,
      totalItems,
      byLocation
    });
  };

  const filterAndSortItems = () => {
    if (!pendingReturns || pendingReturns.length === 0) {
      setFilteredItems([]);
      return;
    }

    // Filter out shipments that already have returns
    let filtered = pendingReturns.filter(shipment => 
      !shipment.hasReturns && 
      shipment.pendingItems && 
      shipment.pendingItems.length > 0
    );

    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.map(shipment => ({
        ...shipment,
        pendingItems: shipment.pendingItems?.filter(item => 
          item.itemDescription?.toLowerCase().includes(searchLower) ||
          shipment.shipmentNumber?.toLowerCase().includes(searchLower) ||
          shipment.requestedBy?.toLowerCase().includes(searchLower) ||
          shipment.truckDriver?.name?.toLowerCase().includes(searchLower)
        )
      })).filter(shipment => shipment.pendingItems && shipment.pendingItems.length > 0);
    }

    if (locationFilter !== 'all') {
      filtered = filtered.map(shipment => ({
        ...shipment,
        pendingItems: shipment.pendingItems?.filter(item => 
          (item.location || 'BALAGTAS') === locationFilter
        )
      })).filter(shipment => shipment.pendingItems && shipment.pendingItems.length > 0);
    }

    if (shipmentFilter !== 'all') {
      filtered = filtered.filter(shipment => shipment._id === shipmentFilter);
    }

    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch(sortBy) {
        case 'shipmentNumber':
          aValue = a.shipmentNumber || '';
          bValue = b.shipmentNumber || '';
          break;
        case 'date':
          aValue = new Date(a.createdAt || 0);
          bValue = new Date(b.createdAt || 0);
          break;
        case 'pendingCount':
          aValue = a.pendingItems?.length || 0;
          bValue = b.pendingItems?.length || 0;
          break;
        default:
          aValue = a.shipmentNumber || '';
          bValue = b.shipmentNumber || '';
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredItems(filtered);
  };

  const toggleShipmentExpand = (shipmentId) => {
    setExpandedShipments(prev => ({
      ...prev,
      [shipmentId]: !prev[shipmentId]
    }));
  };

  const handleReturnClick = (shipment) => {
    // Calculate total pending quantity
    const totalPending = shipment.pendingItems.reduce((sum, item) => sum + item.pendingQuantity, 0);
    
    setSelectedShipment(shipment);
    setReturnQuantity(totalPending);
    setReturnCondition('good');
    setReturnRemarks('');
    setShowReturnModal(true);
  };

  const handleConfirmReturn = () => {
    setShowReturnModal(false);
    setShowConfirmModal(true);
  };

  // ISANG BESES LANG ITO - LAHAT NG MATITIRA AY SOLD
  const handleReturnSubmit = async () => {
    try {
      if (returnQuantity <= 0) {
        toast.error('Please enter a valid quantity to return');
        setShowConfirmModal(false);
        setShowReturnModal(true);
        return;
      }

      const totalPending = selectedShipment.pendingItems.reduce((sum, item) => sum + item.pendingQuantity, 0);
      
      if (returnQuantity > totalPending) {
        toast.error('Return quantity cannot exceed pending quantity');
        setShowConfirmModal(false);
        setShowReturnModal(true);
        return;
      }

      setSubmitting(true);
      
      // I-distribute ang return quantity sa mga items
      const itemsToReturn = [];
      let remainingToReturn = returnQuantity;
      
      for (const item of selectedShipment.pendingItems) {
        if (remainingToReturn <= 0) break;
        
        const returnQtyForThisItem = Math.min(item.pendingQuantity, remainingToReturn);
        
        itemsToReturn.push({
          itemIndex: item.index,
          quantity: returnQtyForThisItem
        });
        
        remainingToReturn -= returnQtyForThisItem;
      }
      
      const totalReturn = itemsToReturn.reduce((sum, item) => sum + item.quantity, 0);
      const totalSold = totalPending - totalReturn;
      
      console.log(`Returning: ${totalReturn} units, Auto-selling: ${totalSold} units`);
      
      // I-SUBMIT NA! Isang beses lang!
      const returnData = {
        items: itemsToReturn,
        condition: returnCondition,
        remarks: returnRemarks,
        autoSold: true // MAGIC - lahat ng hindi nireturn ay magiging SOLD
      };
      
      await returnItems(selectedShipment._id, returnData);
      
      // Refresh data
      await loadPendingReturns();
      await fetchShipments();
      
      setShowConfirmModal(false);
      setSelectedShipment(null);
      
      toast.success(`${totalReturn} units returned, ${totalSold} units automatically marked as SOLD!`);
    } catch (error) {
      console.error('Return error:', error);
      
      // Check if error is about multiple returns
      if (error.message && error.message.includes('already been processed')) {
        toast.error('This shipment has already been processed. Only one return is allowed.');
        setShowConfirmModal(false);
        setShowReturnModal(false);
        await loadPendingReturns(); // Refresh to remove from list
      } else {
        toast.error(error.message || 'Failed to process return');
        setShowConfirmModal(false);
        setShowReturnModal(true);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      draft: { bg: 'bg-gray-100', text: 'text-gray-800', icon: Clock },
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: Clock },
      loading: { bg: 'bg-blue-100', text: 'text-blue-800', icon: Package },
      ingress: { bg: 'bg-purple-100', text: 'text-purple-800', icon: Truck },
      egress: { bg: 'bg-indigo-100', text: 'text-indigo-800', icon: Truck },
      completed: { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircle },
      cancelled: { bg: 'bg-red-100', text: 'text-red-800', icon: XCircle },
      partially_returned: { bg: 'bg-orange-100', text: 'text-orange-800', icon: RotateCcw },
      fully_returned: { bg: 'bg-teal-100', text: 'text-teal-800', icon: CheckCircle }
    };
    
    const config = statusConfig[status] || statusConfig.draft;
    const Icon = config.icon;
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        <Icon className="h-3 w-3 mr-1" />
        {status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
      </span>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading && pendingReturns.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/shipments')}
            className="text-gray-400 hover:text-gray-500"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-2xl font-semibold text-gray-900">Pending Returns</h1>
        </div>
        <button
          onClick={loadPendingReturns}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          <RotateCcw className="h-4 w-4 mr-2" />
          Refresh
        </button>
      </div>

      {/* Info Banner */}
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
        <div className="flex">
          <AlertTriangle className="h-5 w-5 text-yellow-400" />
          <div className="ml-3">
            <p className="text-sm text-yellow-700">
              <strong>⚠️ IMPORTANT:</strong> Each shipment can only be processed ONCE. 
              After you confirm the return, all remaining items will be automatically marked as SOLD.
            </p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 bg-orange-100 rounded-full">
              <RotateCcw className="h-6 w-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Pending</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.totalPending}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-full">
              <Package className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Shipments</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.totalShipments}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-full">
              <MapPin className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Balagtas</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.byLocation.BALAGTAS}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-full">
              <MapPin className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Marilao</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.byLocation.MARILAO}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search items, shipments, drivers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
          </div>

          <div>
            <select
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
            >
              <option value="all">All Locations</option>
              <option value="BALAGTAS">Balagtas</option>
              <option value="MARILAO">Marilao</option>
            </select>
          </div>

          <div>
            <select
              value={shipmentFilter}
              onChange={(e) => setShipmentFilter(e.target.value)}
              className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
            >
              <option value="all">All Shipments</option>
              {filteredItems.map(shipment => (
                <option key={shipment._id} value={shipment._id}>
                  {shipment.shipmentNumber}
                </option>
              ))}
            </select>
          </div>

          <div className="flex space-x-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
            >
              <option value="shipmentNumber">Sort by Shipment #</option>
              <option value="date">Sort by Date</option>
              <option value="pendingCount">Sort by Count</option>
            </select>
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              {sortOrder === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Pending Items List */}
      {filteredItems.length > 0 ? (
        <div className="space-y-4">
          {filteredItems.map((shipment) => {
            const totalPendingQty = shipment.pendingItems.reduce((sum, item) => sum + item.pendingQuantity, 0);
            
            return (
              <div key={shipment._id} className="bg-white rounded-lg shadow overflow-hidden">
                {/* Shipment Header */}
                <div 
                  className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between cursor-pointer hover:bg-gray-100"
                  onClick={() => toggleShipmentExpand(shipment._id)}
                >
                  <div className="flex items-center space-x-4">
                    <button className="text-gray-500">
                      {expandedShipments[shipment._id] ? (
                        <ChevronUp className="h-5 w-5" />
                      ) : (
                        <ChevronDown className="h-5 w-5" />
                      )}
                    </button>
                    <div>
                      <div className="flex items-center space-x-3">
                        <h3 className="text-lg font-medium text-gray-900">
                          {shipment.shipmentNumber}
                        </h3>
                        {getStatusBadge(shipment.status)}
                      </div>
                      <div className="flex items-center space-x-4 mt-1">
                        <span className="text-sm text-gray-500 flex items-center">
                          <User className="h-4 w-4 mr-1" />
                          {shipment.requestedBy || 'N/A'}
                        </span>
                        <span className="text-sm text-gray-500 flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          {formatDate(shipment.createdAt)}
                        </span>
                        <span className="text-sm text-gray-500 flex items-center">
                          <Truck className="h-4 w-4 mr-1" />
                          {shipment.truckDriver?.name || 'No driver'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-orange-100 text-orange-800">
                        <AlertCircle className="h-4 w-4 mr-1" />
                        {totalPendingQty} units pending
                      </span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleReturnClick(shipment);
                      }}
                      className="inline-flex items-center px-3 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700"
                    >
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Process Return
                    </button>
                  </div>
                </div>

                {/* Pending Items */}
                {expandedShipments[shipment._id] && (
                  <div className="p-6">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Item Description
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Location
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Original Qty
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Pending
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Unit
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {shipment.pendingItems?.map((item, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm text-gray-900">
                              {item.itemDescription}
                              {item.itemOtherDetails && (
                                <span className="block text-xs text-gray-500">
                                  {item.itemOtherDetails}
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                              {item.location || 'BALAGTAS'}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                              {item.quantity}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                                {item.pendingQuantity}
                              </span>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                              {item.unit || 'pcs'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    {/* Driver Details */}
                    {shipment.truckDriver && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                          <Truck className="h-4 w-4 mr-2" />
                          Driver Details
                        </h4>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="text-gray-500">Name:</span>
                            <span className="ml-2 text-gray-900">{shipment.truckDriver.name || 'N/A'}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Contact:</span>
                            <span className="ml-2 text-gray-900">{shipment.truckDriver.contactNumber || 'N/A'}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Destination:</span>
                            <span className="ml-2 text-gray-900">{shipment.truckDriver.destination || 'N/A'}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-green-100 rounded-full">
              <CheckCircle className="h-12 w-12 text-green-600" />
            </div>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Pending Returns</h3>
          <p className="text-gray-500 mb-6">
            All items have been processed. There are no pending returns at the moment.
          </p>
          <button
            onClick={() => navigate('/shipments')}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            <Package className="h-4 w-4 mr-2" />
            View Shipments
          </button>
        </div>
      )}

      {/* Return Modal */}
      {showReturnModal && selectedShipment && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                Return Items - {selectedShipment.shipmentNumber}
              </h3>
              <button
                onClick={() => setShowReturnModal(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {(() => {
              const totalPending = selectedShipment.pendingItems.reduce((sum, item) => sum + item.pendingQuantity, 0);
              const totalSold = totalPending - returnQuantity;
              
              return (
                <div className="mb-4 bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-blue-800 font-medium mb-2">
                    ⚠️ ONE-TIME RETURN ONLY
                  </p>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Pending:</span>
                      <span className="font-bold text-gray-900">{totalPending} units</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">To be Returned:</span>
                      <span className="font-bold text-green-600">{returnQuantity} units</span>
                    </div>
                    <div className="flex justify-between border-t border-blue-200 pt-1 mt-1">
                      <span className="text-gray-600">Will be SOLD:</span>
                      <span className="font-bold text-blue-600">{totalSold} units</span>
                    </div>
                  </div>
                </div>
              );
            })()}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quantity to Return
                </label>
                <input
                  type="number"
                  min="0"
                  max={selectedShipment.pendingItems.reduce((sum, item) => sum + item.pendingQuantity, 0)}
                  value={returnQuantity}
                  onChange={(e) => setReturnQuantity(parseInt(e.target.value) || 0)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Maximum: {selectedShipment.pendingItems.reduce((sum, item) => sum + item.pendingQuantity, 0)} units
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Condition (for returned items)
                </label>
                <div className="flex space-x-4">
                  {['good', 'damaged', 'partial', 'lost'].map((condition) => (
                    <label key={condition} className="inline-flex items-center">
                      <input
                        type="radio"
                        value={condition}
                        checked={returnCondition === condition}
                        onChange={(e) => setReturnCondition(e.target.value)}
                        className="h-4 w-4 text-blue-600"
                      />
                      <span className="ml-2 text-sm text-gray-700 capitalize">{condition}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Remarks
                </label>
                <textarea
                  value={returnRemarks}
                  onChange={(e) => setReturnRemarks(e.target.value)}
                  rows="3"
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  placeholder="Enter remarks about the return..."
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowReturnModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReturn}
                disabled={returnQuantity <= 0}
                className="px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700 disabled:opacity-50"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Modal */}
      {showConfirmModal && selectedShipment && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                Confirm Return
              </h3>
              <button
                onClick={() => {
                  setShowConfirmModal(false);
                  setShowReturnModal(true);
                }}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mb-6">
              <div className="bg-yellow-50 p-4 rounded-lg mb-4">
                <div className="flex">
                  <AlertTriangle className="h-5 w-5 text-yellow-400 mr-2" />
                  <p className="text-sm text-yellow-700">
                    This action is <strong>IRREVERSIBLE</strong>. After confirmation, you cannot modify this shipment again.
                  </p>
                </div>
              </div>

              {(() => {
                const totalPending = selectedShipment.pendingItems.reduce((sum, item) => sum + item.pendingQuantity, 0);
                const totalSold = totalPending - returnQuantity;
                
                return (
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Shipment:</span>
                      <span className="font-medium text-gray-900">{selectedShipment.shipmentNumber}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Return Quantity:</span>
                      <span className="font-medium text-green-600">{returnQuantity} units</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Will be SOLD:</span>
                      <span className="font-medium text-blue-600">{totalPending - returnQuantity} units</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Condition:</span>
                      <span className="font-medium text-gray-900 capitalize">{returnCondition}</span>
                    </div>
                    {returnRemarks && (
                      <div className="text-sm">
                        <span className="text-gray-600">Remarks:</span>
                        <p className="mt-1 text-gray-900 bg-gray-50 p-2 rounded">{returnRemarks}</p>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowConfirmModal(false);
                  setShowReturnModal(true);
                }}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Back
              </button>
              <button
                onClick={handleReturnSubmit}
                disabled={submitting}
                className="px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700 disabled:opacity-50"
              >
                {submitting ? 'Processing...' : 'Confirm & Process'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PendingReturns;