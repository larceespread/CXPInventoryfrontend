// components/Header.jsx
import React, { useState, useEffect } from 'react';
import { Menu, Bell, LogOut, AlertCircle, X, Sun, Moon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { productService } from '../services/productService';
import { shipmentService } from '../services/shipmentService';
import { userService } from '../services/userService';
import { saleService } from '../services/saleService';

const Header = ({ toggleSidebar }) => {
  const { user, logout } = useAuth();
  const { isDarkMode, toggleDarkMode } = useTheme();
  const navigate = useNavigate();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [loading, setLoading] = useState(false);

  // Fetch notifications based on real data
  useEffect(() => {
    fetchNotifications();
    
    // Refresh notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const newNotifications = [];

      // Fetch low stock products
      try {
        const lowStockResponse = await productService.getLowStockProducts();
        console.log('Low stock response:', lowStockResponse);
        
        // Handle different response structures
        let lowStockProducts = [];
        if (lowStockResponse?.data) {
          lowStockProducts = Array.isArray(lowStockResponse.data) 
            ? lowStockResponse.data 
            : lowStockResponse.data.data || [];
        } else if (Array.isArray(lowStockResponse)) {
          lowStockProducts = lowStockResponse;
        }

        if (lowStockProducts.length > 0) {
          lowStockProducts.slice(0, 5).forEach(product => {
            // Find which locations are low stock
            const lowStockLocations = product.storageLocations?.filter(
              loc => loc.status === 'low_stock' || (loc.quantity > 0 && loc.quantity <= (loc.reorderLevel || 10))
            ) || [];
            
            lowStockLocations.forEach(loc => {
              newNotifications.push({
                id: `lowstock-${product._id}-${loc.location}`,
                type: 'warning',
                title: 'Low Stock Alert',
                message: `${product.name} is running low at ${loc.location} (${loc.quantity} left, reorder at ${loc.reorderLevel || 10})`,
                timestamp: new Date(),
                read: false,
                icon: '⚠️',
                link: `/products/${product._id}`,
                productId: product._id,
                location: loc.location,
                quantity: loc.quantity,
                reorderLevel: loc.reorderLevel || 10
              });
            });
          });
        }
      } catch (error) {
        console.error('Error fetching low stock products:', error);
      }

      // Fetch out of stock products
      try {
        const outOfStockResponse = await productService.getOutOfStockProducts();
        console.log('Out of stock response:', outOfStockResponse);
        
        // Handle different response structures
        let outOfStockProducts = [];
        if (outOfStockResponse?.data) {
          outOfStockProducts = Array.isArray(outOfStockResponse.data) 
            ? outOfStockResponse.data 
            : outOfStockResponse.data.data || [];
        } else if (Array.isArray(outOfStockResponse)) {
          outOfStockProducts = outOfStockResponse;
        }

        if (outOfStockProducts.length > 0) {
          outOfStockProducts.slice(0, 5).forEach(product => {
            // Find which locations are out of stock
            const outOfStockLocations = product.storageLocations?.filter(
              loc => loc.status === 'out_of_stock' || loc.quantity === 0
            ) || [];
            
            outOfStockLocations.forEach(loc => {
              newNotifications.push({
                id: `outofstock-${product._id}-${loc.location}`,
                type: 'error',
                title: 'Out of Stock',
                message: `${product.name} is out of stock at ${loc.location}`,
                timestamp: new Date(),
                read: false,
                icon: '❌',
                link: `/products/${product._id}`,
                productId: product._id,
                location: loc.location
              });
            });
          });
        }
      } catch (error) {
        console.error('Error fetching out of stock products:', error);
      }

      // Fetch pending shipments
      try {
        const shipmentsResponse = await shipmentService.getShipments({ status: 'pending' });
        console.log('Shipments response:', shipmentsResponse);
        
        let shipments = [];
        if (shipmentsResponse?.data) {
          shipments = Array.isArray(shipmentsResponse.data) 
            ? shipmentsResponse.data 
            : shipmentsResponse.data.data || [];
        } else if (Array.isArray(shipmentsResponse)) {
          shipments = shipmentsResponse;
        }

        if (shipments.length > 0) {
          shipments.slice(0, 5).forEach(shipment => {
            newNotifications.push({
              id: `shipment-${shipment._id}`,
              type: 'info',
              title: 'Pending Shipment',
              message: `Shipment #${shipment.shipmentNumber} to ${shipment.truckDriver?.destination || 'Unknown'} requires attention`,
              timestamp: new Date(shipment.createdAt),
              read: false,
              icon: '📦',
              link: `/shipments/${shipment._id}`,
              shipmentNumber: shipment.shipmentNumber,
              destination: shipment.truckDriver?.destination,
              itemCount: shipment.items?.length || 0
            });
          });
        }
      } catch (error) {
        console.log('Error fetching shipments:', error);
      }

      // Fetch in-transit items (loading, ingress, egress)
      try {
        const inTransitResponse = await shipmentService.getShipments({ 
          status: ['loading', 'ingress', 'egress'] 
        });
        
        let inTransit = [];
        if (inTransitResponse?.data) {
          inTransit = Array.isArray(inTransitResponse.data) 
            ? inTransitResponse.data 
            : inTransitResponse.data.data || [];
        }

        if (inTransit.length > 0) {
          inTransit.slice(0, 3).forEach(shipment => {
            newNotifications.push({
              id: `intransit-${shipment._id}`,
              type: 'info',
              title: 'In Transit',
              message: `Shipment #${shipment.shipmentNumber} is ${shipment.status} to ${shipment.truckDriver?.destination || 'Unknown'}`,
              timestamp: new Date(shipment.updatedAt || shipment.createdAt),
              read: false,
              icon: '🚚',
              link: `/shipments/${shipment._id}`,
              status: shipment.status
            });
          });
        }
      } catch (error) {
        console.log('Error fetching in-transit shipments:', error);
      }

      // Fetch expiring products (if endpoint exists)
      try {
        const expiringResponse = await productService.getExpiringProducts(7);
        console.log('Expiring products response:', expiringResponse);
        
        let expiringProducts = [];
        if (expiringResponse?.data) {
          expiringProducts = Array.isArray(expiringResponse.data) 
            ? expiringResponse.data 
            : expiringResponse.data.data || [];
        } else if (Array.isArray(expiringResponse)) {
          expiringProducts = expiringResponse;
        }

        if (expiringProducts.length > 0) {
          expiringProducts.slice(0, 3).forEach(product => {
            const expiryDate = product.expiryDate ? new Date(product.expiryDate) : null;
            const daysUntilExpiry = expiryDate 
              ? Math.ceil((expiryDate - new Date()) / (1000 * 60 * 60 * 24))
              : null;

            newNotifications.push({
              id: `expiring-${product._id}`,
              type: 'warning',
              title: 'Expiring Soon',
              message: `${product.name} will expire ${daysUntilExpiry ? `in ${daysUntilExpiry} days` : 'soon'}`,
              timestamp: new Date(),
              read: false,
              icon: '⏰',
              link: `/products/${product._id}`,
              expiryDate: product.expiryDate,
              daysUntilExpiry
            });
          });
        }
      } catch (error) {
        console.log('Error fetching expiring products:', error);
      }

      // Fetch today's sales (if endpoint exists)
      try {
        const todaySalesResponse = await saleService.getTodaySales();
        console.log('Today sales response:', todaySalesResponse);
        
        if (todaySalesResponse?.data?.length > 0) {
          const totalRevenue = todaySalesResponse.todayStats?.totalRevenue || 0;
          const totalSales = todaySalesResponse.todayStats?.totalSales || 0;
          
          newNotifications.push({
            id: `sales-today-${Date.now()}`,
            type: 'success',
            title: 'Today\'s Sales',
            message: `₱${totalRevenue.toLocaleString()} from ${totalSales} transaction${totalSales !== 1 ? 's' : ''}`,
            timestamp: new Date(),
            read: false,
            icon: '💰',
            link: '/sales',
            totalRevenue,
            totalSales
          });
        }
      } catch (error) {
        console.log('Error fetching today\'s sales:', error);
      }

      // Fetch user activities (if admin)
      try {
        if (user?.role === 'admin') {
          const userStatsResponse = await userService.getUserStats();
          console.log('User stats response:', userStatsResponse);
          
          if (userStatsResponse?.data) {
            const stats = userStatsResponse.data;
            
            // Active now notification
            if (stats.activeNow > 0) {
              newNotifications.push({
                id: `active-users-${Date.now()}`,
                type: 'info',
                title: 'Active Users',
                message: `${stats.activeNow} user${stats.activeNow !== 1 ? 's' : ''} currently online`,
                timestamp: new Date(),
                read: false,
                icon: '👥',
                link: '/users',
                activeNow: stats.activeNow
              });
            }
          }
        }
      } catch (error) {
        console.log('Error fetching user stats:', error);
      }

      // Sort by timestamp (newest first) and remove duplicates
      const uniqueNotifications = Array.from(
        new Map(newNotifications.map(n => [n.id, n])).values()
      );
      
      const sorted = uniqueNotifications
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, 15); // Increased limit to accommodate more notifications

      setNotifications(sorted);
      setUnreadCount(sorted.filter(n => !n.read).length);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = (notificationId) => {
    setNotifications(prev =>
      prev.map(n =>
        n.id === notificationId ? { ...n, read: true } : n
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(n => ({ ...n, read: true }))
    );
    setUnreadCount(0);
    toast.success('All notifications marked as read');
  };

  const handleNotificationClick = (notification) => {
    markAsRead(notification.id);
    if (notification.link) {
      navigate(notification.link);
    }
    setShowNotifications(false);
  };

  const handleLogout = () => {
    try {
      logout();
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      navigate('/login');
      toast.success('Logged out successfully');
      setShowLogoutConfirm(false);
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Failed to logout');
    }
  };

  const handleToggleDarkMode = () => {
    setIsAnimating(true);
    toggleDarkMode();
    setTimeout(() => setIsAnimating(false), 500);
  };

  const getTimeAgo = (timestamp) => {
    const now = new Date();
    const diff = now - new Date(timestamp);
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    return `${days} day${days > 1 ? 's' : ''} ago`;
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'warning':
        return '🟡';
      case 'error':
        return '🔴';
      case 'info':
        return '🔵';
      case 'success':
        return '🟢';
      default:
        return '⚪';
    }
  };

  const getNotificationBgColor = (type, isRead) => {
    if (isRead) return 'bg-gray-50 dark:bg-gray-800';
    
    switch (type) {
      case 'warning':
        return 'bg-yellow-50 dark:bg-yellow-900/20';
      case 'error':
        return 'bg-red-50 dark:bg-red-900/20';
      case 'info':
        return 'bg-blue-50 dark:bg-blue-900/20';
      case 'success':
        return 'bg-green-50 dark:bg-green-900/20';
      default:
        return 'bg-gray-50 dark:bg-gray-800';
    }
  };

  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40 transition-colors duration-200">
      <div className="flex justify-between items-center px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex items-center">
          {/* Mobile menu button - only visible on mobile */}
          <button 
            onClick={toggleSidebar} 
            className="lg:hidden text-gray-500 dark:text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-200 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 mr-2"
            aria-label="Toggle menu"
          >
            <Menu className="h-6 w-6" />
          </button>
          
         
        </div>
        
        <div className="flex items-center space-x-2 sm:space-x-4">
          {/* Dark Mode Toggle with Animation */}
          <button
            onClick={handleToggleDarkMode}
            className={`relative p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-300 transform ${
              isAnimating ? (isDarkMode ? 'rotate-180 scale-110' : '-rotate-180 scale-110') : ''
            }`}
            aria-label="Toggle dark mode"
          >
            <div className="relative">
              <Sun 
                className={`h-5 w-5 transition-all duration-300 ${
                  isDarkMode ? 'opacity-0 rotate-90 scale-0' : 'opacity-100 rotate-0 scale-100'
                } text-yellow-500`} 
              />
              <Moon 
                className={`absolute inset-0 h-5 w-5 transition-all duration-300 ${
                  isDarkMode ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-0'
                }`} 
              />
            </div>
          </button>
          
          {/* Notification Bell with Dynamic Badge */}
          <div className="relative">
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-200 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 group"
              aria-label="Notifications"
              disabled={loading}
            >
              <Bell className="h-5 w-5 sm:h-6 sm:w-6 group-hover:scale-110 transition-transform duration-200" />
              {unreadCount > 0 && (
                <>
                  <span className="absolute top-1 right-1 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-gray-800 animate-ping" />
                  <span className="absolute top-1 right-1 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-gray-800" />
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-4 w-4 sm:h-5 sm:w-5 flex items-center justify-center ring-2 ring-white dark:ring-gray-800">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                </>
              )}
              {loading && (
                <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs font-bold rounded-full h-4 w-4 sm:h-5 sm:w-5 flex items-center justify-center ring-2 ring-white dark:ring-gray-800 animate-pulse">
                  ↻
                </span>
              )}
            </button>

            {/* Notifications dropdown */}
            {showNotifications && (
              <>
                {/* Backdrop for mobile */}
                <div 
                  className="fixed inset-0 z-40 lg:hidden"
                  onClick={() => setShowNotifications(false)}
                />
                
                {/* Dropdown */}
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-50"
                     style={{ animation: 'slideDown 0.3s ease-out' }}>
                  {/* Header */}
                  <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                      Notifications
                      {unreadCount > 0 && (
                        <span className="ml-2 text-xs bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-300 px-2 py-0.5 rounded-full">
                          {unreadCount} new
                        </span>
                      )}
                    </h3>
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllAsRead}
                        className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                      >
                        Mark all as read
                      </button>
                    )}
                  </div>

                  {/* Notifications List */}
                  <div className="max-h-96 overflow-y-auto">
                    {loading && notifications.length === 0 ? (
                      <div className="px-4 py-8 text-center">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Loading notifications...</p>
                      </div>
                    ) : notifications.length === 0 ? (
                      <div className="px-4 py-8 text-center">
                        <Bell className="h-8 w-8 mx-auto text-gray-400 dark:text-gray-600 mb-2" />
                        <p className="text-sm text-gray-500 dark:text-gray-400">No notifications</p>
                      </div>
                    ) : (
                      notifications.map((notification) => (
                        <div
                          key={notification.id}
                          onClick={() => handleNotificationClick(notification)}
                          className={`px-4 py-3 cursor-pointer transition-all duration-200 hover:shadow-md ${
                            getNotificationBgColor(notification.type, notification.read)
                          } ${!notification.read ? 'border-l-4 border-l-blue-500' : ''}`}
                          style={{ transition: 'transform 0.2s' }}
                          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                        >
                          <div className="flex items-start space-x-3">
                            <div className="flex-shrink-0 text-lg">
                              {notification.icon || getNotificationIcon(notification.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                {notification.title}
                              </p>
                              <p className="text-sm text-gray-600 dark:text-gray-300 mt-0.5">
                                {notification.message}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                {getTimeAgo(notification.timestamp)}
                              </p>
                              
                              {/* Additional details for specific notification types */}
                              {notification.location && (
                                <span className="inline-block mt-1 text-xs bg-gray-200 dark:bg-gray-700 rounded px-1.5 py-0.5">
                                  {notification.location}
                                </span>
                              )}
                              {notification.quantity !== undefined && notification.reorderLevel && (
                                <span className="inline-block mt-1 text-xs ml-1 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 rounded px-1.5 py-0.5">
                                  {notification.quantity}/{notification.reorderLevel}
                                </span>
                              )}
                            </div>
                            {!notification.read && (
                              <div className="flex-shrink-0">
                                <span className="inline-block h-2 w-2 rounded-full bg-blue-500" />
                              </div>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Footer */}
                  {notifications.length > 0 && (
                    <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-700">
                      <button
                        onClick={fetchNotifications}
                        className="text-xs text-center w-full text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                      >
                        Refresh notifications
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
          
          {/* User Info - Desktop */}
          <div className="hidden md:flex items-center space-x-3">
            <div className="text-right">
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{user?.name || 'Demo User'}</p>
              <div className="flex items-center justify-end space-x-1">
                <span className="text-xs text-gray-500 dark:text-gray-400">Role:</span>
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 capitalize">
                  {user?.role || 'Admin'}
                </span>
              </div>
            </div>

            {/* User Avatar - Desktop */}
            <div className="h-9 w-9 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center text-white font-semibold text-sm shadow-md overflow-hidden">
              {user?.avatar ? (
                <img src={user.avatar} alt={user.name} className="h-full w-full object-cover" />
              ) : (
                <span>{user?.name?.charAt(0) || 'D'}</span>
              )}
            </div>
          </div>

          {/* User Avatar - Mobile */}
          <div className="md:hidden">
            <div className="h-8 w-8 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center text-white font-semibold text-sm shadow-md">
              {user?.name?.charAt(0) || 'D'}
            </div>
          </div>
          
          {/* Logout Button */}
          <button
            onClick={() => setShowLogoutConfirm(true)}
            className="flex items-center space-x-1 sm:space-x-2 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-all duration-200 px-2 sm:px-3 py-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 border border-transparent hover:border-red-200 dark:hover:border-red-800 group"
            title="Logout"
          >
            <LogOut className="h-4 w-4 sm:h-5 sm:w-5 group-hover:scale-110 transition-transform duration-200" />
            <span className="hidden sm:inline text-sm font-medium">Logout</span>
          </button>
        </div>
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 z-50 flex items-center justify-center p-4"
            style={{ animation: 'fadeIn 0.2s ease-out' }}
            onClick={() => setShowLogoutConfirm(false)}
          >
            {/* Modal */}
            <div 
              className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full mx-auto overflow-hidden"
              style={{ animation: 'slideUp 0.3s ease-out' }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center space-x-3">
                  <div className="bg-yellow-100 dark:bg-yellow-900/30 p-2 rounded-full animate-pulse">
                    <AlertCircle className="h-6 w-6 text-yellow-600 dark:text-yellow-500" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Confirm Logout</h3>
                </div>
                <button
                  onClick={() => setShowLogoutConfirm(false)}
                  className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-200"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6">
                <p className="text-gray-600 dark:text-gray-300">Are you sure you want to logout?</p>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end space-x-3 p-6 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => setShowLogoutConfirm(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors duration-200 flex items-center space-x-2 group"
                >
                  <LogOut className="h-4 w-4 group-hover:translate-x-1 transition-transform duration-200" />
                  <span>Yes, Logout</span>
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Add animation styles in a regular style tag */}
      <style>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        .animate-ping {
          animation: ping 1s cubic-bezier(0, 0, 0.2, 1) infinite;
        }

        @keyframes ping {
          75%, 100% {
            transform: scale(2);
            opacity: 0;
          }
        }

        .animate-pulse {
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }

        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: .5;
          }
        }

        .animate-spin {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </header>
  );
};

export default Header;