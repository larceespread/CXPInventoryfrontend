// pages/Approvals.jsx
import React, { useState } from 'react';
import { useApproval } from '../context/ApprovalContext';
import { useAuth } from '../context/AuthContext';
import ApprovalModal from '../components/ApprovalModal';
import { Check, XCircle, Clock, Package, User, Calendar } from 'lucide-react';

const Approvals = () => {
  const { user } = useAuth();
  const { pendingApprovals, myRequests, loading } = useApproval();
  const [selectedApproval, setSelectedApproval] = useState(null);

  const getStatusBadge = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
      approved: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
      rejected: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const getTypeBadge = (type) => {
    const colors = {
      create: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
      edit: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
      delete: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[type]}`}>
        {type.charAt(0).toUpperCase() + type.slice(1)}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {user?.role === 'admin' || user?.role === 'manager' ? 'Approval Requests' : 'My Requests'}
        </h1>
        
        {user?.role === 'admin' || user?.role === 'manager' ? (
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Pending Approvals ({pendingApprovals.length})
            </h2>
            {pendingApprovals.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400">No pending approvals</p>
            ) : (
              <div className="space-y-4">
                {pendingApprovals.map((approval) => (
                  <div 
                    key={approval._id} 
                    className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => setSelectedApproval(approval)}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-medium text-gray-900 dark:text-white">
                            {approval.data?.name || 'Unnamed Item'}
                          </h3>
                          {getTypeBadge(approval.requestType)}
                          {getStatusBadge(approval.status)}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                          <span className="flex items-center gap-1">
                            <User className="h-4 w-4" />
                            {approval.requestedBy?.name || 'Unknown'}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {new Date(approval.createdAt).toLocaleDateString()}
                          </span>
                          {approval.data?.productCode && (
                            <span className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                              {approval.data.productCode}
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedApproval(approval);
                        }}
                        className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium"
                      >
                        Review
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              My Requests ({myRequests.length})
            </h2>
            {myRequests.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400">No requests found</p>
            ) : (
              <div className="space-y-4">
                {myRequests.map((request) => (
                  <div 
                    key={request._id} 
                    className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => setSelectedApproval(request)}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-medium text-gray-900 dark:text-white">
                            {request.data?.name || 'Unnamed Item'}
                          </h3>
                          {getTypeBadge(request.requestType)}
                          {getStatusBadge(request.status)}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {new Date(request.createdAt).toLocaleDateString()}
                          </span>
                          {request.data?.productCode && (
                            <span className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                              {request.data.productCode}
                            </span>
                          )}
                        </div>
                        {request.rejectionReason && (
                          <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 rounded text-sm text-red-600 dark:text-red-400">
                            <span className="font-medium">Rejection reason:</span> {request.rejectionReason}
                          </div>
                        )}
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedApproval(request);
                        }}
                        className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium"
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Approval Modal */}
      {selectedApproval && (
        <ApprovalModal
          approval={selectedApproval}
          onClose={() => setSelectedApproval(null)}
          onApproved={() => {
            // Refresh data after approval/rejection
            setSelectedApproval(null);
          }}
        />
      )}
    </>
  );
};

export default Approvals;