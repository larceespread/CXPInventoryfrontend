// services/userService.js
import api from './api';

export const userService = {
  // Get all users with filters
  async getUsers(filters = {}) {
    try {
      const params = new URLSearchParams();
      
      if (filters.role) params.append('role', filters.role);
      if (filters.status) params.append('status', filters.status);
      if (filters.search) params.append('search', filters.search);
      if (filters.page) params.append('page', filters.page);
      if (filters.limit) params.append('limit', filters.limit);
      if (filters.sort) params.append('sort', filters.sort);
      
      const url = `/users${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await api.get(url);
      
      console.log('📊 Users fetched:', response.data);
      
      return {
        success: true,
        data: response.data.data || response.data.users || [],
        count: response.data.count || 0,
        total: response.data.total || 0,
        pagination: response.data.pagination || {}
      };
    } catch (error) {
      console.error('❌ Error fetching users:', error);
      throw error.response?.data || error;
    }
  },

  // Get single user by ID
  async getUserById(id) {
    try {
      const response = await api.get(`/users/${id}`);
      
      console.log('👤 User fetched:', response.data);
      
      return {
        success: true,
        data: response.data.data || response.data.user || response.data
      };
    } catch (error) {
      console.error('❌ Error fetching user:', error);
      throw error.response?.data || error;
    }
  },

  // Create new user
  async createUser(userData) {
    try {
      console.log('📝 Creating user:', { ...userData, password: '[REDACTED]' });
      
      const response = await api.post('/users', userData);
      
      console.log('✅ User created:', response.data);
      
      return {
        success: true,
        data: response.data.data || response.data.user || response.data,
        message: 'User created successfully'
      };
    } catch (error) {
      console.error('❌ Error creating user:', error);
      throw error.response?.data || error;
    }
  },

  // Update user
  async updateUser(id, userData) {
    try {
      console.log('📝 Updating user:', id, userData);
      
      const response = await api.put(`/users/${id}`, userData);
      
      console.log('✅ User updated:', response.data);
      
      return {
        success: true,
        data: response.data.data || response.data.user || response.data,
        message: 'User updated successfully'
      };
    } catch (error) {
      console.error('❌ Error updating user:', error);
      throw error.response?.data || error;
    }
  },

  // Delete user
  async deleteUser(id) {
    try {
      console.log('🗑️ Deleting user:', id);
      
      const response = await api.delete(`/users/${id}`);
      
      console.log('✅ User deleted:', response.data);
      
      return {
        success: true,
        message: 'User deleted successfully'
      };
    } catch (error) {
      console.error('❌ Error deleting user:', error);
      throw error.response?.data || error;
    }
  },

  // Toggle user active status
  async toggleUserStatus(id, isActive) {
    try {
      console.log('🔄 Toggling user status:', id, isActive);
      
      const response = await api.patch(`/users/${id}/status`, { isActive });
      
      console.log('✅ User status updated:', response.data);
      
      return {
        success: true,
        data: response.data.data || response.data,
        message: response.data.message || `User ${isActive ? 'activated' : 'deactivated'} successfully`
      };
    } catch (error) {
      console.error('❌ Error toggling user status:', error);
      throw error.response?.data || error;
    }
  },

  // Update user role
  async updateUserRole(id, role) {
    try {
      console.log('🔄 Updating user role:', id, role);
      
      const response = await api.patch(`/users/${id}/role`, { role });
      
      console.log('✅ User role updated:', response.data);
      
      return {
        success: true,
        data: response.data.data || response.data,
        message: 'User role updated successfully'
      };
    } catch (error) {
      console.error('❌ Error updating user role:', error);
      throw error.response?.data || error;
    }
  },

  // Change user password (admin)
  async changeUserPassword(id, newPassword) {
    try {
      console.log('🔑 Changing user password:', id);
      
      const response = await api.put(`/users/${id}/password`, { password: newPassword });
      
      console.log('✅ Password changed:', response.data);
      
      return {
        success: true,
        message: response.data.message || 'Password updated successfully'
      };
    } catch (error) {
      console.error('❌ Error changing password:', error);
      throw error.response?.data || error;
    }
  },

  // Get user activities
  async getUserActivities(userId, params = {}) {
    try {
      const queryParams = new URLSearchParams(params).toString();
      const url = `/users/${userId}/activities${queryParams ? `?${queryParams}` : ''}`;
      
      const response = await api.get(url);
      
      console.log('📋 User activities fetched:', response.data);
      
      return {
        success: true,
        data: response.data.data || response.data.activities || [],
        count: response.data.count || 0,
        total: response.data.total || 0,
        pagination: response.data.pagination || {}
      };
    } catch (error) {
      console.error('❌ Error fetching user activities:', error);
      // Return empty array instead of throwing to prevent UI breaking
      return {
        success: false,
        data: [],
        count: 0,
        total: 0,
        error: error.message
      };
    }
  },

  // Get user statistics (dashboard)
  async getUserStats() {
    try {
      const response = await api.get('/users/stats');
      
      console.log('📊 User stats fetched:', response.data);
      
      return {
        success: true,
        data: response.data.data || response.data.stats || response.data || {
          totalUsers: 0,
          activeUsers: 0,
          inactiveUsers: 0,
          activeNow: 0,
          newToday: 0,
          newThisMonth: 0,
          roleBreakdown: [],
          loginActivity: [],
          topActiveUsers: []
        }
      };
    } catch (error) {
      console.error('❌ Error fetching user stats:', error);
      return {
        success: false,
        data: {
          totalUsers: 0,
          activeUsers: 0,
          inactiveUsers: 0,
          activeNow: 0,
          newToday: 0,
          newThisMonth: 0,
          roleBreakdown: [],
          loginActivity: [],
          topActiveUsers: []
        }
      };
    }
  },

  // Get user sales statistics
  async getUserSalesStats(userId) {
    try {
      const response = await api.get(`/users/${userId}/sales-stats`);
      
      console.log('💰 User sales stats fetched:', response.data);
      
      return {
        success: true,
        data: response.data.data || response.data
      };
    } catch (error) {
      console.error('❌ Error fetching user sales stats:', error);
      throw error.response?.data || error;
    }
  },

  // Update last active timestamp
  async updateLastActive() {
    try {
      const response = await api.post('/users/update-last-active');
      
      return {
        success: true,
        data: response.data.data || response.data
      };
    } catch (error) {
      console.error('❌ Error updating last active:', error);
      // Don't throw, this is a background operation
      return { success: false };
    }
  },

  // Bulk update users (admin only)
  async bulkUpdateUsers(users) {
    try {
      console.log('📦 Bulk updating users:', users.length);
      
      const response = await api.put('/users/bulk/update', { users });
      
      console.log('✅ Bulk update result:', response.data);
      
      return {
        success: true,
        data: response.data.data || response.data,
        message: `Updated ${response.data.data?.modified || 0} users`
      };
    } catch (error) {
      console.error('❌ Error bulk updating users:', error);
      throw error.response?.data || error;
    }
  },

  // Export users (admin only)
  async exportUsers() {
    try {
      const response = await api.get('/users/export');
      
      console.log('📤 Users exported:', response.data.count);
      
      return {
        success: true,
        data: response.data.data || response.data.users || [],
        count: response.data.count || 0
      };
    } catch (error) {
      console.error('❌ Error exporting users:', error);
      throw error.response?.data || error;
    }
  },

  // Import users (admin only)
  async importUsers(users) {
    try {
      console.log('📥 Importing users:', users.length);
      
      const response = await api.post('/users/import', { users });
      
      console.log('✅ Import result:', response.data);
      
      return {
        success: true,
        data: response.data.data || response.data,
        message: `Created: ${response.data.data?.created?.length || 0}, Failed: ${response.data.data?.failed?.length || 0}`
      };
    } catch (error) {
      console.error('❌ Error importing users:', error);
      throw error.response?.data || error;
    }
  },

  // Get online users (active in last 5 minutes)
  async getOnlineUsers() {
    try {
      const response = await api.get('/users?status=active&lastActive=true');
      
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60000);
      
      const onlineUsers = (response.data.data || []).filter(user => 
        user.isActive && user.lastActive && new Date(user.lastActive) > fiveMinutesAgo
      );
      
      return {
        success: true,
        data: onlineUsers,
        count: onlineUsers.length
      };
    } catch (error) {
      console.error('❌ Error getting online users:', error);
      return { success: false, data: [], count: 0 };
    }
  },

  // Format user for display
  formatUser(user) {
    if (!user) return null;
    
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60000);
    const isOnline = user.isActive && user.lastActive && new Date(user.lastActive) > fiveMinutesAgo;
    
    return {
      ...user,
      displayName: user.name,
      displayRole: user.role?.charAt(0).toUpperCase() + user.role?.slice(1) || 'Staff',
      isOnline,
      lastActiveFormatted: user.lastActive ? this.formatDate(user.lastActive) : 'Never',
      lastLoginFormatted: user.lastLogin ? this.formatDate(user.lastLogin) : 'Never',
      createdAtFormatted: user.createdAt ? this.formatDate(user.createdAt) : 'Never'
    };
  },

  // Format date helper
  formatDate(dateString) {
    if (!dateString) return 'Never';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffMinutes = Math.floor((now - date) / 60000);
    
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes} minutes ago`;
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)} hours ago`;
    if (diffMinutes < 10080) return `${Math.floor(diffMinutes / 1440)} days ago`;
    
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  },

  // Get role options
  getRoleOptions() {
    return [
      { value: 'admin', label: 'Admin', color: 'purple' },
      { value: 'manager', label: 'Manager', color: 'blue' },
      { value: 'cashier', label: 'Cashier', color: 'green' },
      { value: 'staff', label: 'Staff', color: 'gray' }
    ];
  },

  // Get status options
  getStatusOptions() {
    return [
      { value: 'active', label: 'Active', color: 'green' },
      { value: 'inactive', label: 'Inactive', color: 'red' },
      { value: 'online', label: 'Online', color: 'blue' },
      { value: 'offline', label: 'Offline', color: 'gray' }
    ];
  },

  // Validate user data
  validateUserData(userData, isNew = true) {
    const errors = [];
    
    if (!userData.name || userData.name.trim() === '') {
      errors.push('Name is required');
    }
    
    if (!userData.email || userData.email.trim() === '') {
      errors.push('Email is required');
    } else if (!/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(userData.email)) {
      errors.push('Please provide a valid email');
    }
    
    if (isNew && (!userData.password || userData.password.length < 6)) {
      errors.push('Password must be at least 6 characters');
    }
    
    if (userData.role && !['admin', 'manager', 'cashier', 'staff'].includes(userData.role)) {
      errors.push('Invalid role');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
};