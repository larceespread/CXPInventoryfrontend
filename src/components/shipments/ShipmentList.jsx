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
  CheckSquare
} from 'lucide-react';
import { useShipment } from '../../context/ShipmentContext';
import toast from 'react-hot-toast';

const ShipmentList = () => {
  const navigate = useNavigate();
  const { shipments, loading, fetchShipments, deleteShipment, updateStatus } = useShipment();
  const [selectedShipment, setSelectedShipment] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showCancelConfirmModal, setShowCancelConfirmModal] = useState(false);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

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

  const isEditable = (status) => {
    return status === 'draft';
  };

  const isDeletable = (status) => {
    return status !== 'completed' && status !== 'cancelled';
  };

  const canChangeStatus = (status) => {
    return status !== 'completed';
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
                    <div className="flex justify-end space-x-3">
                      <button
                        onClick={() => navigate(`/shipments/${shipment._id}`)}
                        className="inline-flex items-center px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-md hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors duration-200 text-sm"
                        title="View shipment details"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </button>
                      
                      <button
                        onClick={() => isEditable(shipment.status) && navigate(`/shipments/edit/${shipment._id}`)}
                        className={`inline-flex items-center px-3 py-1 rounded-md transition-colors duration-200 text-sm ${
                          isEditable(shipment.status)
                            ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 hover:bg-yellow-200 dark:hover:bg-yellow-900/50'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                        }`}
                        title={isEditable(shipment.status) ? "Edit shipment" : "Cannot edit - shipment is not in draft status"}
                        disabled={!isEditable(shipment.status)}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </button>
                      
                      {shipment.status === 'cancelled' ? (
                        <button
                          onClick={() => handleCancelClick(shipment)}
                          className="inline-flex items-center px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-md hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors duration-200 text-sm"
                          title="Cancel shipment"
                        >
                          <XCircle className="h-4 w-4 mr-1" />
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
                          className={`inline-flex items-center px-3 py-1 rounded-md transition-colors duration-200 text-sm ${
                            canChangeStatus(shipment.status)
                              ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-900/50'
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                          }`}
                          title={canChangeStatus(shipment.status) ? "Update shipment status" : "Cannot update status - shipment is completed"}
                          disabled={!canChangeStatus(shipment.status)}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
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
                        className={`inline-flex items-center px-3 py-1 rounded-md transition-colors duration-200 text-sm ${
                          isDeletable(shipment.status)
                            ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-900/50'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                        }`}
                        title={isDeletable(shipment.status) ? "Delete shipment" : "Cannot delete - shipment is completed or cancelled"}
                        disabled={!isDeletable(shipment.status)}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
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
              {['draft',  'ingress', 'egress', 'completed', 'cancelled'].map((status) => (
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
    </div>
  );
};

export default ShipmentList;