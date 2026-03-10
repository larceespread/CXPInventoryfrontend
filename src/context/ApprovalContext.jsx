// context/ApprovalContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { approvalService } from '../services/approvalService';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const ApprovalContext = createContext();

export const useApproval = () => {
  const context = useContext(ApprovalContext);
  if (!context) {
    throw new Error('useApproval must be used within an ApprovalProvider');
  }
  return context;
};

export const ApprovalProvider = ({ children }) => {
  const { user } = useAuth();
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [myRequests, setMyRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchPendingApprovals = async () => {
    if (user?.role !== 'admin' && user?.role !== 'manager') return;
    
    try {
      setLoading(true);
      const response = await approvalService.getPendingApprovals();
      const approvals = response.data || response || [];
      setPendingApprovals(approvals);
      
      // Calculate unread count (approvals that haven't been viewed)
      const savedViewed = localStorage.getItem('viewedApprovals') || '[]';
      const viewedIds = JSON.parse(savedViewed);
      const newUnread = approvals.filter(a => !viewedIds.includes(a._id)).length;
      setUnreadCount(newUnread);
    } catch (error) {
      console.error('Error fetching pending approvals:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyRequests = async () => {
    try {
      const response = await approvalService.getMyApprovalRequests();
      const requests = response.data || response || [];
      setMyRequests(requests);
    } catch (error) {
      console.error('Error fetching my requests:', error);
    }
  };

  const createApprovalRequest = async (data) => {
    try {
      const response = await approvalService.createApprovalRequest(data);
      toast.success('Approval request submitted successfully');
      await fetchMyRequests();
      return response.data;
    } catch (error) {
      console.error('Error creating approval request:', error);
      toast.error(error.response?.data?.message || 'Failed to submit approval request');
      throw error;
    }
  };

  const approveRequest = async (approvalId) => {
    try {
      const response = await approvalService.approveRequest(approvalId);
      toast.success('Request approved successfully');
      await fetchPendingApprovals();
      await fetchMyRequests();
      
      // Mark as viewed
      markAsViewed(approvalId);
      
      return response.data;
    } catch (error) {
      console.error('Error approving request:', error);
      toast.error(error.response?.data?.message || 'Failed to approve request');
      throw error;
    }
  };

  const rejectRequest = async (approvalId, reason) => {
    try {
      const response = await approvalService.rejectRequest(approvalId, reason);
      toast.success('Request rejected');
      await fetchPendingApprovals();
      await fetchMyRequests();
      
      // Mark as viewed
      markAsViewed(approvalId);
      
      return response.data;
    } catch (error) {
      console.error('Error rejecting request:', error);
      toast.error(error.response?.data?.message || 'Failed to reject request');
      throw error;
    }
  };

  const markAsViewed = (approvalId) => {
    const savedViewed = localStorage.getItem('viewedApprovals') || '[]';
    const viewedIds = JSON.parse(savedViewed);
    if (!viewedIds.includes(approvalId)) {
      viewedIds.push(approvalId);
      localStorage.setItem('viewedApprovals', JSON.stringify(viewedIds));
      
      // Update unread count
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
  };

  const markAllAsViewed = () => {
    const ids = pendingApprovals.map(a => a._id);
    localStorage.setItem('viewedApprovals', JSON.stringify(ids));
    setUnreadCount(0);
  };

  useEffect(() => {
    if (user) {
      fetchPendingApprovals();
      fetchMyRequests();
      
      // Refresh every 30 seconds
      const interval = setInterval(() => {
        fetchPendingApprovals();
        fetchMyRequests();
      }, 30000);
      
      return () => clearInterval(interval);
    }
  }, [user]);

  return (
    <ApprovalContext.Provider value={{
      pendingApprovals,
      myRequests,
      loading,
      unreadCount,
      fetchPendingApprovals,
      fetchMyRequests,
      createApprovalRequest,
      approveRequest,
      rejectRequest,
      markAsViewed,
      markAllAsViewed
    }}>
      {children}
    </ApprovalContext.Provider>
  );
};