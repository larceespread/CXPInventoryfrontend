// pages/Users.jsx
import React, { useState, useEffect } from 'react';
import { userService } from '../services/userService';
import { format } from 'date-fns';
import {
  UserIcon,
  ShieldCheckIcon,
  ClockIcon,
  PencilIcon,
  TrashIcon,
  PlusIcon,
  EyeIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  XCircleIcon,
  FunnelIcon,
  KeyIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';
import { useTheme } from '../context/ThemeContext';

const CACHE_KEYS = {
  USERS: 'users_cache',
  STATS: 'user_stats_cache',
  TIMESTAMP: 'users_cache_timestamp'
};

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

const Users = () => {
  const { isDarkMode } = useTheme();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [userActivities, setUserActivities] = useState([]);
  const [activityLoading, setActivityLoading] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 25,
    total: 0,
    totalPages: 1
  });
  const [filters, setFilters] = useState({
    role: '',
    status: '',
    search: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeNow: 0,
    admins: 0,
    managers: 0,
    staff: 0,
    cashiers: 0
  });

  // Load cached data on initial mount
  useEffect(() => {
    loadCachedData();
    
    const interval = setInterval(() => {
      fetchUsers(true);
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (selectedUser) {
      fetchUserActivities(selectedUser._id);
    }
  }, [selectedUser]);

  // Load data from localStorage
  const loadCachedData = () => {
    try {
      const timestamp = localStorage.getItem(CACHE_KEYS.TIMESTAMP);
      const now = Date.now();

      // Check if cache is still valid
      if (timestamp && (now - parseInt(timestamp)) < CACHE_DURATION) {
        const cachedUsers = localStorage.getItem(CACHE_KEYS.USERS);
        const cachedStats = localStorage.getItem(CACHE_KEYS.STATS);
        const cachedPagination = localStorage.getItem('users_pagination_cache');

        if (cachedUsers) {
          setUsers(JSON.parse(cachedUsers));
        }
        
        if (cachedStats) {
          setStats(JSON.parse(cachedStats));
        }

        if (cachedPagination) {
          setPagination(JSON.parse(cachedPagination));
        }

        setLoading(false);
      } else {
        // Cache expired or doesn't exist, fetch fresh data
        fetchUsers();
        fetchUserStats();
      }
    } catch (err) {
      console.error('Error loading cached data:', err);
      fetchUsers();
      fetchUserStats();
    }
  };

  // Save data to localStorage
  const saveToCache = (usersData, statsData, paginationData) => {
    try {
      localStorage.setItem(CACHE_KEYS.USERS, JSON.stringify(usersData));
      localStorage.setItem(CACHE_KEYS.STATS, JSON.stringify(statsData));
      localStorage.setItem('users_pagination_cache', JSON.stringify(paginationData));
      localStorage.setItem(CACHE_KEYS.TIMESTAMP, Date.now().toString());
    } catch (err) {
      console.error('Error saving to cache:', err);
    }
  };

  // Clear cache
  const clearCache = () => {
    try {
      localStorage.removeItem(CACHE_KEYS.USERS);
      localStorage.removeItem(CACHE_KEYS.STATS);
      localStorage.removeItem('users_pagination_cache');
      localStorage.removeItem(CACHE_KEYS.TIMESTAMP);
    } catch (err) {
      console.error('Error clearing cache:', err);
    }
  };

  const fetchUsers = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      setError(null);
      
      const response = await userService.getUsers({
        ...filters,
        page: pagination.page,
        limit: pagination.limit
      });
      
      if (response.success) {
        const formattedUsers = response.data.map(user => userService.formatUser(user));
        setUsers(formattedUsers);
        
        const newStats = calculateStats(formattedUsers);
        
        const newPagination = {
          page: response.pagination?.page || 1,
          limit: response.pagination?.limit || 25,
          total: response.total || 0,
          totalPages: Math.ceil((response.total || 0) / (response.pagination?.limit || 25))
        };
        
        setPagination(newPagination);
        
        // Save to cache
        saveToCache(formattedUsers, newStats, newPagination);
      } else {
        setUsers([]);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
      setError(err.message || 'Failed to fetch users');
      setUsers([]);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const fetchUserStats = async () => {
    try {
      const response = await userService.getUserStats();
      if (response.success) {
        const newStats = {
          ...stats,
          ...response.data
        };
        setStats(newStats);
        
        // Update stats in cache
        const cachedUsers = localStorage.getItem(CACHE_KEYS.USERS);
        if (cachedUsers) {
          saveToCache(JSON.parse(cachedUsers), newStats, pagination);
        }
      }
    } catch (err) {
      console.error('Error fetching user stats:', err);
    }
  };

  const calculateStats = (usersList) => {
    const now = new Date();
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60000);

    const newStats = {
      totalUsers: usersList.length,
      activeNow: usersList.filter(u => 
        u.lastActive && new Date(u.lastActive) > fiveMinutesAgo
      ).length,
      admins: usersList.filter(u => u.role === 'admin').length,
      managers: usersList.filter(u => u.role === 'manager').length,
      staff: usersList.filter(u => u.role === 'staff').length,
      cashiers: usersList.filter(u => u.role === 'cashier').length
    };
    setStats(newStats);
    return newStats;
  };

  const fetchUserActivities = async (userId) => {
    try {
      setActivityLoading(true);
      const response = await userService.getUserActivities(userId, { limit: 50 });
      if (response.success) {
        setUserActivities(response.data);
      }
    } catch (err) {
      console.error('Error fetching user activities:', err);
    } finally {
      setActivityLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const applyFilters = () => {
    fetchUsers();
  };

  const resetFilters = () => {
    setFilters({
      role: '',
      status: '',
      search: ''
    });
    setPagination(prev => ({ ...prev, page: 1 }));
    setTimeout(() => fetchUsers(), 100);
  };

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
    fetchUsers();
  };

  const handleViewActivity = (user) => {
    setSelectedUser(user);
    setShowActivityModal(true);
  };

  const handleEditUser = (user) => {
    setSelectedUser(user);
    setShowUserModal(true);
  };

  const handleChangePassword = (user) => {
    setSelectedUser(user);
    setShowPasswordModal(true);
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    try {
      await userService.deleteUser(userId);
      clearCache(); // Clear cache on data modification
      fetchUsers();
      fetchUserStats();
    } catch (err) {
      console.error('Error deleting user:', err);
      alert(err.message || 'Failed to delete user');
    }
  };

  const handleToggleUserStatus = async (userId, currentStatus) => {
    try {
      await userService.toggleUserStatus(userId, !currentStatus);
      clearCache(); // Clear cache on data modification
      fetchUsers();
      fetchUserStats();
    } catch (err) {
      console.error('Error toggling user status:', err);
      alert(err.message || 'Failed to update user status');
    }
  };

  const handleUserSaved = () => {
    setShowUserModal(false);
    setSelectedUser(null);
    clearCache(); // Clear cache on data modification
    fetchUsers();
    fetchUserStats();
  };

  const handlePasswordChanged = () => {
    setShowPasswordModal(false);
    setSelectedUser(null);
  };

  const handleManualRefresh = () => {
    clearCache();
    fetchUsers();
    fetchUserStats();
  };

  const formatLastActive = (lastActive) => {
    if (!lastActive) return 'Never';
    
    const date = new Date(lastActive);
    const now = new Date();
    const diffMinutes = Math.floor((now - date) / 60000);
    
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes} minutes ago`;
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)} hours ago`;
    return format(date, 'MMM d, yyyy h:mm a');
  };

  const isUserOnline = (lastActive) => {
    if (!lastActive) return false;
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60000);
    return new Date(lastActive) > fiveMinutesAgo;
  };

  const getRoleBadgeColor = (role) => {
    const colors = {
      admin: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      manager: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      cashier: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      staff: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
    };
    return colors[role] || colors.staff;
  };

  const getRoleDisplay = (role) => {
    return role ? role.charAt(0).toUpperCase() + role.slice(1) : 'Staff';
  };

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-100'} transition-colors duration-200`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            User Management
          </h1>
          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mt-1`}>
            Manage users, view activity logs, and monitor system access
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-6">
          <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow p-4 transition-colors duration-200`}>
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-full">
                <UserGroupIcon className="h-5 w-5 text-blue-600 dark:text-blue-200" />
              </div>
              <div className="ml-3">
                <p className={`text-xs font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total</p>
                <p className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{stats.totalUsers}</p>
              </div>
            </div>
          </div>

          <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow p-4 transition-colors duration-200`}>
            <div className="flex items-center">
              <div className="p-2 bg-green-100 dark:bg-green-900 rounded-full">
                <CheckCircleIcon className="h-5 w-5 text-green-600 dark:text-green-200" />
              </div>
              <div className="ml-3">
                <p className={`text-xs font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Online Now</p>
                <p className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{stats.activeNow}</p>
              </div>
            </div>
          </div>

          <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow p-4 transition-colors duration-200`}>
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-full">
                <ShieldCheckIcon className="h-5 w-5 text-purple-600 dark:text-purple-200" />
              </div>
              <div className="ml-3">
                <p className={`text-xs font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Admins</p>
                <p className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{stats.admins}</p>
              </div>
            </div>
          </div>

          <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow p-4 transition-colors duration-200`}>
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-full">
                <UserIcon className="h-5 w-5 text-blue-600 dark:text-blue-200" />
              </div>
              <div className="ml-3">
                <p className={`text-xs font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Managers</p>
                <p className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{stats.managers}</p>
              </div>
            </div>
          </div>

          <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow p-4 transition-colors duration-200`}>
            <div className="flex items-center">
              <div className="p-2 bg-green-100 dark:bg-green-900 rounded-full">
                <UserIcon className="h-5 w-5 text-green-600 dark:text-green-200" />
              </div>
              <div className="ml-3">
                <p className={`text-xs font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Cashiers</p>
                <p className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{stats.cashiers}</p>
              </div>
            </div>
          </div>

          <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow p-4 transition-colors duration-200`}>
            <div className="flex items-center">
              <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-full">
                <UserIcon className="h-5 w-5 text-gray-600 dark:text-gray-300" />
              </div>
              <div className="ml-3">
                <p className={`text-xs font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Staff</p>
                <p className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{stats.staff}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Actions */}
        <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow sm:rounded-lg p-6 mb-6 transition-colors duration-200`}>
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`inline-flex items-center px-3 py-2 border ${isDarkMode ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'} shadow-sm text-sm font-medium rounded-md bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200`}
              >
                <FunnelIcon className="h-4 w-4 mr-2" />
                Filters
              </button>
              <button
                onClick={handleManualRefresh}
                className={`inline-flex items-center px-3 py-2 border ${isDarkMode ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'} shadow-sm text-sm font-medium rounded-md bg-white dark:bg-gray-800 transition-colors duration-200`}
              >
                <ArrowPathIcon className="h-4 w-4 mr-2" />
                Refresh
              </button>
            </div>
            <button
              onClick={() => {
                setSelectedUser(null);
                setShowUserModal(true);
              }}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Add New User
            </button>
          </div>

          {/* Filter Panel */}
          {showFilters && (
            <div className={`grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              <div>
                <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                  Search
                </label>
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  placeholder="Name or email..."
                  className={`block w-full rounded-md ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'} shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm transition-colors duration-200`}
                />
              </div>
              <div>
                <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                  Role
                </label>
                <select
                  value={filters.role}
                  onChange={(e) => handleFilterChange('role', e.target.value)}
                  className={`block w-full rounded-md ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'} shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm transition-colors duration-200`}
                >
                  <option value="">All Roles</option>
                  <option value="admin">Admin</option>
                  <option value="manager">Manager</option>
                  <option value="cashier">Cashier</option>
                  <option value="staff">Staff</option>
                </select>
              </div>
              <div>
                <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                  Status
                </label>
                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className={`block w-full rounded-md ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'} shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm transition-colors duration-200`}
                >
                  <option value="">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <div className="flex items-end space-x-2">
                <button
                  onClick={applyFilters}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm transition-colors duration-200"
                >
                  Apply
                </button>
                <button
                  onClick={resetFilters}
                  className={`px-4 py-2 ${isDarkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'} rounded-md text-sm transition-colors duration-200`}
                >
                  Reset
                </button>
              </div>
            </div>
          )}

          {/* Cache Info and Pagination Info */}
          {!loading && users.length > 0 && (
            <div className="mt-4 flex justify-between items-center">
              <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                {pagination.total} users
              </div>
              <div className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                {localStorage.getItem(CACHE_KEYS.TIMESTAMP) && (
                  <>Last updated: {format(new Date(parseInt(localStorage.getItem(CACHE_KEYS.TIMESTAMP))), 'h:mm:ss a')}</>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Users Table */}
        <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow overflow-hidden sm:rounded-lg transition-colors duration-200`}>
          {loading ? (
            <div className={`text-center py-12 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
              <p>Loading users...</p>
            </div>
          ) : error ? (
            <div className={`text-center py-12 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              <XCircleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <p className="text-red-600 dark:text-red-400 mb-2">Error loading users</p>
              <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'} text-sm`}>{error}</p>
              <button
                onClick={() => fetchUsers()}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200"
              >
                Try Again
              </button>
            </div>
          ) : users.length === 0 ? (
            <div className={`text-center py-12 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              <UserIcon className={`h-12 w-12 ${isDarkMode ? 'text-gray-600' : 'text-gray-400'} mx-auto mb-4`} />
              <p>No users found</p>
              <p className={`${isDarkMode ? 'text-gray-500' : 'text-gray-500'} text-sm mt-2`}>
                {Object.values(filters).some(Boolean) 
                  ? 'Try adjusting your filters' 
                  : 'Click "Add New User" to create one'}
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className={`${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                    <tr>
                      <th className={`px-6 py-3 text-left text-xs font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>
                        User
                      </th>
                      <th className={`px-6 py-3 text-left text-xs font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>
                        Role
                      </th>
                      <th className={`px-6 py-3 text-left text-xs font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>
                        Status
                      </th>
                      <th className={`px-6 py-3 text-left text-xs font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>
                        Last Login
                      </th>
                      <th className={`px-6 py-3 text-left text-xs font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>
                        Last Active
                      </th>
                      <th className={`px-6 py-3 text-left text-xs font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>
                        Activities
                      </th>
                      <th className={`px-6 py-3 text-right text-xs font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} divide-y divide-gray-200 dark:divide-gray-700`}>
                    {users.map((user) => {
                      const online = isUserOnline(user.lastActive);
                      
                      return (
                        <tr key={user._id} className={`${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'} transition-colors duration-200`}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10">
                                <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                                  <span className="text-blue-600 dark:text-blue-200 font-medium text-lg">
                                    {user.name?.charAt(0).toUpperCase() || 'U'}
                                  </span>
                                </div>
                              </div>
                              <div className="ml-4">
                                <div className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                  {user.name}
                                </div>
                                <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                  {user.email}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getRoleBadgeColor(user.role)}`}>
                              {getRoleDisplay(user.role)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className={`h-2.5 w-2.5 rounded-full mr-2 ${
                                user.isActive 
                                  ? online 
                                    ? 'bg-green-500 animate-pulse' 
                                    : 'bg-green-500'
                                  : 'bg-red-500'
                              }`}></div>
                              <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                                {user.isActive 
                                  ? online 
                                    ? 'Online' 
                                    : 'Offline'
                                  : 'Inactive'}
                              </span>
                            </div>
                          </td>
                          <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                            <div className="flex items-center">
                              <ClockIcon className={`h-4 w-4 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'} mr-1`} />
                              {user.lastLogin ? format(new Date(user.lastLogin), 'MMM d, yyyy h:mm a') : 'Never'}
                            </div>
                          </td>
                          <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                            {formatLastActive(user.lastActive)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <span className={`px-2 py-1 ${isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'} rounded-full text-xs`}>
                              {user.activityCount || 0} actions
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex justify-end space-x-2">
                              <button
                                onClick={() => handleViewActivity(user)}
                                className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 transition-colors duration-200"
                                title="View Activity Log"
                              >
                                <EyeIcon className="h-5 w-5" />
                              </button>
                              <button
                                onClick={() => handleEditUser(user)}
                                className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors duration-200"
                                title="Edit User"
                              >
                                <PencilIcon className="h-5 w-5" />
                              </button>
                              <button
                                onClick={() => handleChangePassword(user)}
                                className="text-orange-600 hover:text-orange-900 dark:text-orange-400 dark:hover:text-orange-300 transition-colors duration-200"
                                title="Change Password"
                              >
                                <KeyIcon className="h-5 w-5" />
                              </button>
                              <button
                                onClick={() => handleToggleUserStatus(user._id, user.isActive)}
                                className={`${
                                  user.isActive 
                                    ? 'text-yellow-600 hover:text-yellow-900 dark:text-yellow-400 dark:hover:text-yellow-300' 
                                    : 'text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300'
                                } transition-colors duration-200`}
                                title={user.isActive ? 'Deactivate User' : 'Activate User'}
                              >
                                {user.isActive ? (
                                  <XCircleIcon className="h-5 w-5" />
                                ) : (
                                  <CheckCircleIcon className="h-5 w-5" />
                                )}
                              </button>
                              <button
                                onClick={() => handleDeleteUser(user._id)}
                                className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 transition-colors duration-200"
                                title="Delete User"
                              >
                                <TrashIcon className="h-5 w-5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination Controls */}
              {pagination.totalPages > 1 && (
                <div className={`px-6 py-4 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'} border-t border-gray-200 dark:border-gray-700 flex items-center justify-between transition-colors duration-200`}>
                  <div className="flex-1 flex justify-between sm:hidden">
                    <button
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={pagination.page === 1}
                      className={`relative inline-flex items-center px-4 py-2 border ${isDarkMode ? 'border-gray-600 bg-gray-800 text-gray-300 hover:bg-gray-700' : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'} text-sm font-medium rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200`}
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => handlePageChange(pagination.page + 1)}
                      disabled={pagination.page === pagination.totalPages}
                      className={`ml-3 relative inline-flex items-center px-4 py-2 border ${isDarkMode ? 'border-gray-600 bg-gray-800 text-gray-300 hover:bg-gray-700' : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'} text-sm font-medium rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200`}
                    >
                      Next
                    </button>
                  </div>
                  <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                    <div>
                      <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-700'}`}>
                        Showing page <span className="font-medium">{pagination.page}</span> of{' '}
                        <span className="font-medium">{pagination.totalPages}</span>
                      </p>
                    </div>
                    <div>
                      <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                        <button
                          onClick={() => handlePageChange(1)}
                          disabled={pagination.page === 1}
                          className={`relative inline-flex items-center px-2 py-2 rounded-l-md border ${isDarkMode ? 'border-gray-600 bg-gray-800 text-gray-400 hover:bg-gray-700' : 'border-gray-300 bg-white text-gray-500 hover:bg-gray-50'} text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200`}
                        >
                          First
                        </button>
                        <button
                          onClick={() => handlePageChange(pagination.page - 1)}
                          disabled={pagination.page === 1}
                          className={`relative inline-flex items-center px-2 py-2 border ${isDarkMode ? 'border-gray-600 bg-gray-800 text-gray-400 hover:bg-gray-700' : 'border-gray-300 bg-white text-gray-500 hover:bg-gray-50'} text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200`}
                        >
                          Previous
                        </button>
                        <span className={`relative inline-flex items-center px-4 py-2 border ${isDarkMode ? 'border-gray-600 bg-gray-800 text-white' : 'border-gray-300 bg-white text-gray-700'} text-sm font-medium`}>
                          {pagination.page}
                        </span>
                        <button
                          onClick={() => handlePageChange(pagination.page + 1)}
                          disabled={pagination.page === pagination.totalPages}
                          className={`relative inline-flex items-center px-2 py-2 border ${isDarkMode ? 'border-gray-600 bg-gray-800 text-gray-400 hover:bg-gray-700' : 'border-gray-300 bg-white text-gray-500 hover:bg-gray-50'} text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200`}
                        >
                          Next
                        </button>
                        <button
                          onClick={() => handlePageChange(pagination.totalPages)}
                          disabled={pagination.page === pagination.totalPages}
                          className={`relative inline-flex items-center px-2 py-2 rounded-r-md border ${isDarkMode ? 'border-gray-600 bg-gray-800 text-gray-400 hover:bg-gray-700' : 'border-gray-300 bg-white text-gray-500 hover:bg-gray-50'} text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200`}
                        >
                          Last
                        </button>
                      </nav>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* User Modal */}
      {showUserModal && (
        <UserModal
          user={selectedUser}
          onClose={() => {
            setShowUserModal(false);
            setSelectedUser(null);
          }}
          onSave={handleUserSaved}
        />
      )}

      {/* Password Modal */}
      {showPasswordModal && selectedUser && (
        <PasswordModal
          user={selectedUser}
          onClose={() => {
            setShowPasswordModal(false);
            setSelectedUser(null);
          }}
          onSave={handlePasswordChanged}
        />
      )}

      {/* Activity Modal */}
      {showActivityModal && selectedUser && (
        <ActivityModal
          user={selectedUser}
          activities={userActivities}
          loading={activityLoading}
          onClose={() => {
            setShowActivityModal(false);
            setSelectedUser(null);
            setUserActivities([]);
          }}
        />
      )}
    </div>
  );
};

// User Modal Component
const UserModal = ({ user, onClose, onSave }) => {
  const { isDarkMode } = useTheme();
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    role: user?.role || 'staff',
    password: '',
    confirmPassword: ''
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const validation = userService.validateUserData(formData, !user);
    if (!validation.isValid) {
      setError(validation.errors.join(', '));
      return;
    }

    try {
      setSaving(true);
      
      const userData = {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        role: formData.role
      };

      if (formData.password) {
        userData.password = formData.password;
      }

      if (user) {
        await userService.updateUser(user._id, userData);
      } else {
        await userService.createUser(userData);
      }

      onSave();
    } catch (err) {
      console.error('Error saving user:', err);
      setError(err.message || 'Failed to save user');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 dark:bg-gray-900 dark:bg-opacity-80 overflow-y-auto h-full w-full z-50">
      <div className={`relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
        <div className="mt-3">
          <h3 className={`text-lg font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-4`}>
            {user ? 'Edit User' : 'Add New User'}
          </h3>
          
          {error && (
            <div className="mb-4 p-3 bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-200 rounded">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className={`block w-full rounded-md ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'} shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm transition-colors duration-200`}
                required
              />
            </div>

            <div className="mb-4">
              <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                Email *
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className={`block w-full rounded-md ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'} shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm transition-colors duration-200`}
                required
              />
            </div>

            <div className="mb-4">
              <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                Role
              </label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className={`block w-full rounded-md ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'} shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm transition-colors duration-200`}
              >
                <option value="staff">Staff</option>
                <option value="cashier">Cashier</option>
                <option value="manager">Manager</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            <div className="mb-4">
              <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                {user ? 'New Password (leave blank to keep current)' : 'Password *'}
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className={`block w-full rounded-md ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'} shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm transition-colors duration-200`}
                required={!user}
                minLength={6}
              />
              <p className={`mt-1 text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Minimum 6 characters</p>
            </div>

            <div className="mb-6">
              <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                Confirm Password
              </label>
              <input
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                className={`block w-full rounded-md ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'} shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm transition-colors duration-200`}
              />
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className={`px-4 py-2 ${isDarkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'} rounded-md text-sm font-medium transition-colors duration-200`}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium disabled:opacity-50 transition-colors duration-200"
              >
                {saving ? 'Saving...' : user ? 'Update User' : 'Create User'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// Password Modal Component
const PasswordModal = ({ user, onClose, onSave }) => {
  const { isDarkMode } = useTheme();
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.password) {
      setError('Password is required');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      setSaving(true);
      await userService.changeUserPassword(user._id, formData.password);
      onSave();
    } catch (err) {
      console.error('Error changing password:', err);
      setError(err.message || 'Failed to change password');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 dark:bg-gray-900 dark:bg-opacity-80 overflow-y-auto h-full w-full z-50">
      <div className={`relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
        <div className="mt-3">
          <h3 className={`text-lg font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-4`}>
            Change Password for {user.name}
          </h3>
          
          {error && (
            <div className="mb-4 p-3 bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-200 rounded">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                New Password *
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className={`block w-full rounded-md ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'} shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm transition-colors duration-200`}
                required
                minLength={6}
              />
              <p className={`mt-1 text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Minimum 6 characters</p>
            </div>

            <div className="mb-6">
              <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                Confirm New Password *
              </label>
              <input
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                className={`block w-full rounded-md ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'} shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm transition-colors duration-200`}
                required
              />
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className={`px-4 py-2 ${isDarkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'} rounded-md text-sm font-medium transition-colors duration-200`}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium disabled:opacity-50 transition-colors duration-200"
              >
                {saving ? 'Changing...' : 'Change Password'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// Activity Modal Component
const ActivityModal = ({ user, activities, loading, onClose }) => {
  const { isDarkMode } = useTheme();

  const getActionColor = (action) => {
    const colors = {
      CREATE: 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900',
      UPDATE: 'text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900',
      DELETE: 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900',
      LOGIN: 'text-purple-600 bg-purple-100 dark:text-purple-400 dark:bg-purple-900',
      LOGOUT: 'text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-700',
      VIEW: 'text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900',
      EXPORT: 'text-indigo-600 bg-indigo-100 dark:text-indigo-400 dark:bg-indigo-900',
      IMPORT: 'text-pink-600 bg-pink-100 dark:text-pink-400 dark:bg-pink-900'
    };
    return colors[action] || 'text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-700';
  };

  const formatActivityDetails = (activity) => {
    try {
      if (activity.details) {
        if (typeof activity.details === 'string') {
          return activity.details;
        }
        return JSON.stringify(activity.details, null, 2);
      }
      return 'No details';
    } catch {
      return 'Invalid details';
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 dark:bg-gray-900 dark:bg-opacity-80 overflow-y-auto h-full w-full z-50">
      <div className={`relative top-20 mx-auto p-5 border w-3/4 max-w-4xl shadow-lg rounded-md ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className={`text-lg font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Activity Log: {user.name}
            </h3>
            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} mt-1`}>{user.email}</p>
          </div>
          <button
            onClick={onClose}
            className={`${isDarkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <XCircleIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="mt-4">
          {loading ? (
            <div className={`text-center py-12 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
              <p>Loading activities...</p>
            </div>
          ) : activities.length === 0 ? (
            <div className={`text-center py-12 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              <ClockIcon className={`h-12 w-12 ${isDarkMode ? 'text-gray-600' : 'text-gray-400'} mx-auto mb-4`} />
              <p>No activities found for this user</p>
            </div>
          ) : (
            <>
              <div className={`mb-4 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Showing {activities.length} activities
              </div>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {activities.map((activity, index) => (
                  <div key={activity._id || index} className={`${isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-50 hover:bg-gray-100'} rounded-lg p-4 transition-colors duration-200`}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getActionColor(activity.action)}`}>
                            {activity.action}
                          </span>
                          <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            {activity.module}
                          </span>
                        </div>
                        
                        <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                          {activity.description || `${activity.action} on ${activity.module}`}
                        </p>
                        
                        {activity.changes && activity.changes.length > 0 && (
                          <div className="mt-2">
                            <p className={`text-xs font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} mb-1`}>Changes:</p>
                            <div className="space-y-1">
                              {activity.changes.map((change, idx) => (
                                <div key={idx} className={`text-xs ${isDarkMode ? 'bg-gray-800' : 'bg-white'} p-2 rounded border ${isDarkMode ? 'border-gray-600' : 'border-gray-200'}`}>
                                  <span className="font-medium">{change.field}:</span>{' '}
                                  <span className="text-red-600 dark:text-red-400 line-through mr-2">{String(change.oldValue)}</span>
                                  <span className="text-green-600 dark:text-green-400">→ {String(change.newValue)}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {activity.details && !activity.changes && (
                          <pre className={`text-xs ${isDarkMode ? 'bg-gray-800' : 'bg-white'} p-2 rounded border ${isDarkMode ? 'border-gray-600' : 'border-gray-200'} overflow-x-auto mt-2`}>
                            {formatActivityDetails(activity)}
                          </pre>
                        )}
                        
                        <div className={`flex items-center text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} mt-2`}>
                          <ClockIcon className="h-3 w-3 mr-1" />
                          {format(new Date(activity.timestamp || activity.createdAt), 'MMM d, yyyy h:mm:ss a')}
                          {activity.ipAddress && (
                            <>
                              <span className="mx-2">•</span>
                              <span>IP: {activity.ipAddress}</span>
                            </>
                          )}
                          {activity.userAgent && (
                            <>
                              <span className="mx-2">•</span>
                              <span className="truncate max-w-xs" title={activity.userAgent}>
                                {activity.userAgent.split(' ')[0]}...
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className={`px-4 py-2 ${isDarkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'} rounded-md text-sm font-medium transition-colors duration-200`}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default Users;