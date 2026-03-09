import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Package, 
  Truck, 
  Calendar, 
  User, 
  MapPin, 
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Clock,
  Loader,
  ArrowUpCircle,
  ArrowDownCircle,
  RotateCcw,
  CheckSquare,
  X
} from 'lucide-react';
import { useShipment } from '../../context/ShipmentContext';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const ShipmentList = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { shipments, loading, fetchShipments, deleteShipment, updateStatus, returnItems } = useShipment();
  const [selectedShipment, setSelectedShipment] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [showCancelConfirmModal, setShowCancelConfirmModal] = useState(false);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [returnItemsList, setReturnItemsList] = useState([]);
  const [returnCondition, setReturnCondition] = useState('good');
  const [returnRemarks, setReturnRemarks] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchShipments();
  }, []);

  const getStatusBadge = (status) => {
    const statusConfig = {
      draft: { bg: 'bg-gray-100 dark:bg-gray-700', text: 'text-gray-800 dark:text-gray-300', icon: Clock },
      pending: { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-800 dark:text-yellow-300', icon: Clock },
      loading: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-800 dark:text-blue-300', icon: Package },
      ingress: { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-800 dark:text-purple-300', icon: Truck },
      egress: { bg: 'bg-indigo-100 dark:bg-indigo-900/30', text: 'text-indigo-800 dark:text-indigo-300', icon: Truck },
      completed: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-800 dark:text-green-300', icon: CheckCircle },
      cancelled: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-800 dark:text-red-300', icon: XCircle },
      partially_returned: { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-800 dark:text-orange-300', icon: RotateCcw },
      fully_returned: { bg: 'bg-teal-100 dark:bg-teal-900/30', text: 'text-teal-800 dark:text-teal-300', icon: CheckSquare }
    };
    
    const config = statusConfig[status] || statusConfig.draft;
    const Icon = config.icon;
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        <Icon className="h-3 w-3 mr-1" />
        {status === 'partially_returned' ? 'Partially Returned' : 
         status === 'fully_returned' ? 'Fully Returned' :
         status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const getTypeIcon = (type) => {
    switch(type) {
      case 'INCOMING':
        return <ArrowDownCircle className="h-4 w-4 text-green-500" />;
      case 'OUTGOING':
        return <ArrowUpCircle className="h-4 w-4 text-blue-500" />;
      case 'TRANSFER':
        return <Truck className="h-4 w-4 text-purple-500" />;
      default:
        return <Package className="h-4 w-4 text-gray-500" />;
    }
  };

  const handleDelete = async () => {
    try {
      await deleteShipment(selectedShipment._id);
      setShowDeleteModal(false);
      setSelectedShipment(null);
      toast.success('Shipment deleted successfully');
      await fetchShipments();
    } catch (error) {
      toast.error(error.message || 'Failed to delete shipment');
    }
  };

  const handleStatusUpdate = async (status) => {
    try {
      await updateStatus(selectedShipment._id, status);
      setShowStatusModal(false);
      setSelectedShipment(null);
      toast.success(`Shipment marked as ${status}`);
      await fetchShipments();
    } catch (error) {
      toast.error(error.message || 'Failed to update status');
    }
  };

  const handleCancelClick = (shipment) => {
    setSelectedShipment(shipment);
    setShowCancelConfirmModal(true);
  };

  const handleConfirmCancel = async () => {
    try {
      await updateStatus(selectedShipment._id, 'cancelled');
      setShowCancelConfirmModal(false);
      setSelectedShipment(null);
      toast.success('Shipment cancelled successfully');
      await fetchShipments();
    } catch (error) {
      toast.error(error.message || 'Failed to cancel shipment');
    }
  };

  const handleReturnClick = (shipment) => {
    setSelectedShipment(shipment);
    
    if (!shipment || !shipment.items) {
      toast.error('No items found');
      return;
    }

    // Prepare items for return modal
    const itemsWithReturnInfo = shipment.items.map((item, index) => {
      const returnedQty = item.returnedQuantity || 0;
      const pendingQuantity = item.quantity - returnedQty;
      
      return {
        ...item,
        index,
        pendingQuantity,
        isReturnable: true
      };
    });

    const returnable = itemsWithReturnInfo.filter(item => 
      item.pendingQuantity > 0 // Only show items with pending quantity
    );
    
    if (returnable.length === 0) {
      toast.error('No items pending return');
      return;
    }
    
    setReturnItemsList(returnable.map(item => ({
      ...item,
      returnQuantity: item.pendingQuantity
    })));
    setReturnCondition('good');
    setReturnRemarks('');
    setShowReturnModal(true);
  };

  const handleReturnSubmit = async () => {
    try {
      const itemsToReturn = returnItemsList.filter(item => item.returnQuantity > 0);
      
      if (itemsToReturn.length === 0) {
        toast.error('Please enter at least one item quantity to return');
        return;
      }

      setSubmitting(true);
      
      const returnData = {
        items: itemsToReturn.map(item => ({
          itemIndex: item.index,
          quantity: Number(item.returnQuantity)
        })),
        condition: returnCondition,
        remarks: returnRemarks
      };
      
      console.log('Sending return data:', JSON.stringify(returnData, null, 2));
      
      await returnItems(selectedShipment._id, returnData);
      
      setShowReturnModal(false);
      setSelectedShipment(null);
      await fetchShipments();
      toast.success('Items returned successfully');
    } catch (error) {
      console.error('Return error:', error);
      toast.error(error.message || 'Failed to return items');
    } finally {
      setSubmitting(false);
    }
  };

  const updateReturnQuantity = (index, value) => {
    const newQuantity = parseInt(value) || 0;
    if (newQuantity >= 0 && newQuantity <= returnItemsList[index].pendingQuantity) {
      const updated = [...returnItemsList];
      updated[index].returnQuantity = newQuantity;
      setReturnItemsList(updated);
    }
  };

  const isEditable = (status) => {
    return status === 'draft';
  };

  const isDeletable = (status) => {
    return status !== 'completed' && status !== 'cancelled' && status !== 'fully_returned';
  };

  const canChangeStatus = (status) => {
    return status !== 'completed' && status !== 'fully_returned';
  };

  const canReturn = (status) => {
    // Return button available for completed, partially_returned, and any status where items might be pending return
    return status === 'completed' || status === 'partially_returned' || status === 'egress' || status === 'ingress';
  };

  const hasPendingReturns = (shipment) => {
    if (!shipment || !shipment.items) return false;
    
    return shipment.items.some(item => {
      const pendingQty = (item.quantity - (item.returnedQuantity || 0));
      return pendingQty > 0;
    });
  };

  const filteredShipments = shipments.filter(shipment => {
    if (filter !== 'all' && shipment.status !== filter) return false;
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        shipment.shipmentNumber?.toLowerCase().includes(searchLower) ||
        shipment.truckDriver?.name?.toLowerCase().includes(searchLower) ||
        shipment.truckDriver?.destination?.toLowerCase().includes(searchLower) ||
        shipment.requestedBy?.toLowerCase().includes(searchLower) ||
        shipment.items?.some(item => 
          item.itemDescription?.toLowerCase().includes(searchLower)
        )
      );
    }
    return true;
  });

  if (loading && shipments.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader className="h-8 w-8 animate-spin text-blue-500 dark:text-blue-400" />
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow transition-colors duration-200">
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Shipments</h2>
        </div>

        <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
          <div className="flex space-x-2">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="block w-40 pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value="all">All Status</option>
              <option value="draft">Draft</option>
              <option value="ingress">Ingress</option>
              <option value="egress">Egress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
              <option value="partially_returned">Partially Returned</option>
              <option value="fully_returned">Fully Returned</option>
            </select>
          </div>
          
          <div className="relative">
            <input
              type="text"
              placeholder="Search shipments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-gray-800 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400 dark:text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Shipment #
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Driver & Destination
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Items
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {filteredShipments.length > 0 ? (
              filteredShipments.map((shipment) => (
                <tr key={shipment._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-blue-600 dark:text-blue-400">
                      {shipment.shipmentNumber || 'N/A'}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {shipment.requestedBy}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {getTypeIcon(shipment.type)}
                      <span className="ml-2 text-sm text-gray-900 dark:text-white">
                        {shipment.type || 'OUTGOING'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <Truck className="h-4 w-4 text-gray-400 dark:text-gray-500 mr-2 flex-shrink-0" />
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {shipment.truckDriver?.name || 'No driver'}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center mt-1">
                          <MapPin className="h-3 w-3 mr-1 flex-shrink-0" />
                          <span className="truncate max-w-[150px]">
                            {shipment.truckDriver?.destination || 'No destination'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 dark:text-white">
                      {shipment.items?.length || 0} items
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Total: {shipment.items?.reduce((sum, item) => sum + (item.quantity || 0), 0)} units
                    </div>
                    {shipment.returnedItems && shipment.returnedItems.length > 0 && (
                      <div className="text-xs text-green-600 dark:text-green-400 mt-1">
                        Returned: {shipment.returnedItems.reduce((sum, item) => sum + (item.quantity || 0), 0)} units
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(shipment.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                      <Calendar className="h-4 w-4 mr-1" />
                      {new Date(shipment.createdAt).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => navigate(`/shipments/${shipment._id}`)}
                        className="inline-flex items-center px-2.5 py-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-md hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors duration-200 text-xs"
                        title="View shipment details"
                      >
                        <Eye className="h-3.5 w-3.5 mr-1" />
                        View
                      </button>
                      
                      {canReturn(shipment.status) && hasPendingReturns(shipment) && (
                        <button
                          onClick={() => handleReturnClick(shipment)}
                          className="inline-flex items-center px-2.5 py-1.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-md hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors duration-200 text-xs"
                          title="Return items"
                        >
                          <RotateCcw className="h-3.5 w-3.5 mr-1" />
                          Return
                        </button>
                      )}
                      
                      <button
                        onClick={() => isEditable(shipment.status) && navigate(`/shipments/edit/${shipment._id}`)}
                        className={`inline-flex items-center px-2.5 py-1.5 rounded-md transition-colors duration-200 text-xs ${
                          isEditable(shipment.status)
                            ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 hover:bg-yellow-200 dark:hover:bg-yellow-900/50'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                        }`}
                        title={isEditable(shipment.status) ? "Edit shipment" : "Cannot edit - shipment is not in draft status"}
                        disabled={!isEditable(shipment.status)}
                      >
                        <Edit className="h-3.5 w-3.5 mr-1" />
                        Edit
                      </button>
                      
                      {shipment.status === 'cancelled' ? (
                        <button
                          onClick={() => handleCancelClick(shipment)}
                          className="inline-flex items-center px-2.5 py-1.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-md hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors duration-200 text-xs"
                          title="Cancel shipment"
                        >
                          <XCircle className="h-3.5 w-3.5 mr-1" />
                          Cancel
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            if (canChangeStatus(shipment.status)) {
                              setSelectedShipment(shipment);
                              setShowStatusModal(true);
                            }
                          }}
                          className={`inline-flex items-center px-2.5 py-1.5 rounded-md transition-colors duration-200 text-xs ${
                            canChangeStatus(shipment.status)
                              ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 hover:bg-purple-200 dark:hover:bg-purple-900/50'
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                          }`}
                          title={canChangeStatus(shipment.status) ? "Update shipment status" : "Cannot update status - shipment is completed or fully returned"}
                          disabled={!canChangeStatus(shipment.status)}
                        >
                          <CheckCircle className="h-3.5 w-3.5 mr-1" />
                          Status
                        </button>
                      )}
                      
                      <button
                        onClick={() => {
                          if (isDeletable(shipment.status)) {
                            setSelectedShipment(shipment);
                            setShowDeleteModal(true);
                          }
                        }}
                        className={`inline-flex items-center px-2.5 py-1.5 rounded-md transition-colors duration-200 text-xs ${
                          isDeletable(shipment.status)
                            ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-900/50'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                        }`}
                        title={isDeletable(shipment.status) ? "Delete shipment" : "Cannot delete - shipment is completed, cancelled, or fully returned"}
                        disabled={!isDeletable(shipment.status)}
                      >
                        <Trash2 className="h-3.5 w-3.5 mr-1" />
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                  <Package className="h-12 w-12 mx-auto mb-4 text-gray-400 dark:text-gray-600" />
                  <p className="text-lg font-medium dark:text-gray-300">No shipments found</p>
                  <p className="text-sm mt-1 dark:text-gray-400">Get started by creating your first shipment</p>
                  <button
                    onClick={() => navigate('/shipments/new')}
                    className="mt-4 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200"
                  >
                    <Package className="h-4 w-4 mr-2" />
                    Create Shipment
                  </button>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Delete Modal */}
      {showDeleteModal && selectedShipment && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 dark:bg-opacity-80 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full transition-colors duration-200">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Delete Shipment</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Are you sure you want to delete shipment{' '}
              <span className="font-medium text-gray-900 dark:text-white">{selectedShipment.shipmentNumber}</span>?
              This will also restore affected stock quantities.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedShipment(null);
                }}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Status Modal */}
      {showStatusModal && selectedShipment && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 dark:bg-opacity-80 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full transition-colors duration-200">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Update Shipment Status
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Update status for shipment{' '}
              <span className="font-medium text-gray-900 dark:text-white">{selectedShipment.shipmentNumber}</span>
            </p>
            
            <div className="space-y-2 mb-6">
              {['draft', 'ingress', 'egress', 'completed', 'cancelled', 'partially_returned', 'fully_returned'].map((status) => (
                <button
                  key={status}
                  onClick={() => handleStatusUpdate(status)}
                  className={`w-full text-left px-4 py-2 rounded-md ${
                    selectedShipment.status === status
                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  {status === 'partially_returned' ? 'Partially Returned' : 
                   status === 'fully_returned' ? 'Fully Returned' :
                   status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => {
                  setShowStatusModal(false);
                  setSelectedShipment(null);
                }}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Confirm Modal */}
      {showCancelConfirmModal && selectedShipment && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 dark:bg-opacity-80 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full transition-colors duration-200">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Cancel Shipment</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Are you sure you want to cancel shipment{' '}
              <span className="font-medium text-gray-900 dark:text-white">{selectedShipment.shipmentNumber}</span>?
              This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowCancelConfirmModal(false);
                  setSelectedShipment(null);
                }}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                No, Keep Shipment
              </button>
              <button
                onClick={handleConfirmCancel}
                className="px-4 py-2 bg-red-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-red-700"
              >
                Yes, Cancel Shipment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Return Modal */}
      {showReturnModal && selectedShipment && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 dark:bg-opacity-80 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-hidden transition-colors duration-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Return Items - {selectedShipment.shipmentNumber}
              </h3>
              <button
                onClick={() => setShowReturnModal(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mb-4 max-h-60 overflow-y-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Item</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Pending</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Return Qty</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {returnItemsList.map((item, index) => (
                    <tr key={index}>
                      <td className="px-4 py-2 text-sm text-gray-900 dark:text-white">{item.itemDescription}</td>
                      <td className="px-4 py-2 text-sm text-gray-900 dark:text-white">{item.pendingQuantity}</td>
                      <td className="px-4 py-2">
                        <input
                          type="number"
                          min="0"
                          max={item.pendingQuantity}
                          value={item.returnQuantity}
                          onChange={(e) => updateReturnQuantity(index, e.target.value)}
                          className="w-20 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="space-y-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Condition
                </label>
                <div className="flex flex-wrap gap-4">
                  {['good', 'damaged', 'partial', 'lost'].map((condition) => (
                    <label key={condition} className="inline-flex items-center">
                      <input
                        type="radio"
                        value={condition}
                        checked={returnCondition === condition}
                        onChange={(e) => setReturnCondition(e.target.value)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                      />
                      <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                        {condition.charAt(0).toUpperCase() + condition.slice(1)}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Remarks
                </label>
                <textarea
                  value={returnRemarks}
                  onChange={(e) => setReturnRemarks(e.target.value)}
                  rows="3"
                  className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  placeholder="Enter remarks..."
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowReturnModal(false)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleReturnSubmit}
                disabled={submitting}
                className="px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Processing...' : 'Confirm Return'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShipmentList;