// components/ApprovalModal.jsx
import React, { useState, useEffect } from 'react';
import { X, Check, XCircle, AlertCircle, Package, MapPin, DollarSign, User, Clock } from 'lucide-react';
import { useApproval } from '../context/ApprovalContext';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import Loader from './common/Loader';

const ApprovalModal = ({ approval, onClose, onApproved }) => {
  const { user } = useAuth();
  const { approveRequest, rejectRequest, markAsViewed } = useApproval();
  const [loading, setLoading] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectInput, setShowRejectInput] = useState(false);

  useEffect(() => {
    if (approval) {
      markAsViewed(approval._id);
    }
  }, [approval]);

  if (!approval) return null;

  const isAdminOrManager = user?.role === 'admin' || user?.role === 'manager';
  const canApprove = isAdminOrManager && approval.status === 'pending';

  const handleApprove = async () => {
    try {
      setLoading(true);
      // Only pass the approval ID, not the data
      await approveRequest(approval._id);
      toast.success('Request approved successfully');
      onApproved?.();
      onClose();
    } catch (error) {
      console.error('Approval error:', error);
      toast.error(error.response?.data?.message || 'Failed to approve request');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }

    try {
      setLoading(true);
      await rejectRequest(approval._id, rejectReason);
      toast.success('Request rejected');
      onApproved?.();
      onClose();
    } catch (error) {
      console.error('Rejection error:', error);
      toast.error(error.response?.data?.message || 'Failed to reject request');
    } finally {
      setLoading(false);
    }
  };

  const getRequestTypeIcon = () => {
    switch (approval.requestType) {
      case 'create':
        return <Package className="h-5 w-5 text-green-500" />;
      case 'edit':
        return <Package className="h-5 w-5 text-blue-500" />;
      case 'delete':
        return <Package className="h-5 w-5 text-red-500" />;
      default:
        return <Package className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusBadge = () => {
    const statusColors = {
      pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
      approved: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
      rejected: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[approval.status]}`}>
        {approval.status.charAt(0).toUpperCase() + approval.status.slice(1)}
      </span>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-full">
              {getRequestTypeIcon()}
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {approval.requestType === 'create' ? 'New Item Approval' : 
                 approval.requestType === 'edit' ? 'Edit Item Approval' : 
                 'Delete Item Approval'}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Requested by {approval.requestedBy?.name || 'Unknown'}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Request Info */}
          <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-300">
                <User className="h-4 w-4" />
                <span>Requested by: <span className="font-medium">{approval.requestedBy?.name}</span></span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-300">
                <Clock className="h-4 w-4" />
                <span>{new Date(approval.createdAt).toLocaleString()}</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600 dark:text-gray-300">
                Role: <span className="font-medium capitalize">{approval.requestedBy?.role}</span>
              </div>
              {getStatusBadge()}
            </div>
            {approval.rejectionReason && (
              <div className="mt-2 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <p className="text-sm text-red-600 dark:text-red-400">
                  <span className="font-medium">Rejection reason:</span> {approval.rejectionReason}
                </p>
              </div>
            )}
          </div>

          {/* Item Details */}
          <div>
            <h3 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
              <Package className="h-4 w-4" />
              Item Details
            </h3>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Item Name
                  </label>
                  <p className="text-gray-900 dark:text-white font-medium">
                    {approval.data.name || 'N/A'}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Product Code
                  </label>
                  <p className="text-gray-900 dark:text-white">
                    {approval.data.productCode || 'N/A'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Brand
                  </label>
                  <p className="text-gray-900 dark:text-white">
                    {approval.data.brand?.name || approval.data.brand || 'N/A'}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Category
                  </label>
                  <p className="text-gray-900 dark:text-white">
                    {approval.data.category?.name || approval.data.category || 'N/A'}
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                  Storage Locations
                </label>
                <div className="space-y-2">
                  {approval.data.storageLocations?.map((loc, index) => (
                    <div key={index} className="flex items-center justify-between bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <MapPin className="h-4 w-4 text-gray-400" />
                        <span className="font-medium text-gray-700 dark:text-gray-300">{loc.location}</span>
                      </div>
                      <div className="flex items-center space-x-4">
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          Qty: <span className="font-medium text-gray-900 dark:text-white">{loc.quantity}</span>
                        </span>
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          Reorder: <span className="font-medium text-gray-900 dark:text-white">{loc.reorderLevel}</span>
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Cost Price
                  </label>
                  <p className="text-gray-900 dark:text-white font-medium">
                    ₱{Number(approval.data.costPrice || 0).toLocaleString()}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Selling Price
                  </label>
                  <p className="text-gray-900 dark:text-white font-medium">
                    ₱{Number(approval.data.sellingPrice || 0).toLocaleString()}
                  </p>
                </div>
              </div>

              {approval.data.description && (
                <div>
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Description
                  </label>
                  <p className="text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
                    {approval.data.description}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Changes (for edit mode) */}
          {approval.requestType === 'edit' && approval.originalData && (
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <h3 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                Changes Made
              </h3>
              
              <div className="space-y-2">
                {Object.keys(approval.data).map(key => {
                  if (key === 'storageLocations' || key === '_id' || key === 'id') return null;
                  if (JSON.stringify(approval.originalData[key]) === JSON.stringify(approval.data[key])) return null;
                  
                  return (
                    <div key={key} className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1 capitalize">
                        {key.replace(/([A-Z])/g, ' $1').trim()}:
                      </p>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <span className="text-xs text-gray-500 dark:text-gray-400">Original:</span>
                          <p className="text-sm text-gray-900 dark:text-white line-through opacity-75">
                            {typeof approval.originalData[key] === 'object' 
                              ? JSON.stringify(approval.originalData[key])
                              : String(approval.originalData[key] || 'N/A')}
                          </p>
                        </div>
                        <div>
                          <span className="text-xs text-green-500">New:</span>
                          <p className="text-sm text-green-600 dark:text-green-400 font-medium">
                            {typeof approval.data[key] === 'object'
                              ? JSON.stringify(approval.data[key])
                              : String(approval.data[key] || 'N/A')}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer with actions */}
        <div className="flex justify-between items-center p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {approval.status === 'pending' && canApprove && (
              <span className="flex items-center gap-1">
                <AlertCircle className="h-4 w-4 text-yellow-500" />
                Your approval is required
              </span>
            )}
          </div>
          
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Close
            </button>
            
            {canApprove && approval.status === 'pending' && (
              <>
                {showRejectInput ? (
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      placeholder="Reason for rejection"
                      className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:ring-red-500 focus:border-red-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      autoFocus
                    />
                    <button
                      onClick={handleReject}
                      disabled={loading || !rejectReason.trim()}
                      className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? <Loader size="small" color="white" /> : 'Confirm'}
                    </button>
                    <button
                      onClick={() => setShowRejectInput(false)}
                      className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <>
                    <button
                      onClick={() => setShowRejectInput(true)}
                      disabled={loading}
                      className="px-4 py-2 border border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 text-sm font-medium flex items-center disabled:opacity-50"
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Reject
                    </button>
                    <button
                      onClick={handleApprove}
                      disabled={loading}
                      className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm font-medium flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? (
                        <Loader size="small" color="white" />
                      ) : (
                        <>
                          <Check className="h-4 w-4 mr-2" />
                          Approve
                        </>
                      )}
                    </button>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApprovalModal;