import React, { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart,
  Users,
  Settings as SettingsIcon,
  Tag,
  Building2,
  BarChart3,
  User,
  Truck,
  ChevronLeft,
  ChevronRight,
  X,
  Sun,
  Moon,
  RotateCcw // Added for Pending Returns
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const Sidebar = ({ isOpen, onClose, isMobile, onToggle, isCollapsed, onCollapseToggle }) => {
  const { user } = useAuth();
  const { isDarkMode, toggleDarkMode } = useTheme();
  const location = useLocation();

  // Auto-close mobile sidebar when route changes
  useEffect(() => {
    if (isMobile && isOpen && onClose) {
      onClose();
    }
  }, [location.pathname, isMobile, isOpen, onClose]);

  const navigation = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Shipments', href: '/shipments', icon: Truck },
    { name: 'Categories', href: '/categories', icon: Tag },
    { name: 'Brands', href: '/brands', icon: Building2 },
  ];

  // Admin only routes
  const adminNavigation = [
    { name: 'Users', href: '/users', icon: Users },
  ];

  // Combine based on role
  const filteredNavigation = user?.role === 'admin' 
    ? [...navigation, ...adminNavigation]
    : navigation;

  // Handle link click on mobile
  const handleLinkClick = () => {
    if (isMobile && onClose) {
      onClose();
    }
  };

  // Get logo based on sidebar state and theme
  const getLogo = () => {
    if (isCollapsed) {
      return '/tab_logo.jpg';
    } else {
      return isDarkMode ? '/LOGO_CXP Motozone-02.png' : '/LOGO_CXP Motozone-01.png';
    }
  };

  // Desktop sidebar classes
  const desktopClasses = `
    hidden lg:flex lg:flex-col lg:flex-shrink-0
    fixed left-0 top-0
    transition-all duration-300 ease-in-out
    ${isCollapsed ? 'w-20' : 'w-64'}
    bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700
    h-screen z-30
  `;

  // Mobile sidebar classes - make sure it's visible when isOpen is true
  const mobileClasses = `
    fixed inset-y-0 left-0 z-50 flex flex-col
    transition-transform duration-300 ease-in-out
    ${isOpen ? 'translate-x-0' : '-translate-x-full'}
    w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700
    h-full shadow-xl
  `;

  return (
    <>
      {/* Desktop Sidebar */}
      <div className={desktopClasses}>
        <div className="flex flex-col h-full">
          {/* Collapse Toggle Button (Desktop only) */}
          {!isMobile && (
            <button
              onClick={onCollapseToggle}
              className="absolute -right-3 top-20 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-full p-1.5 shadow-lg hover:bg-gray-50 dark:hover:bg-gray-700 z-10 hidden lg:flex items-center justify-center w-7 h-7 hover:border-gray-300 dark:hover:border-gray-600 transition-all duration-200"
              aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {isCollapsed ? (
                <ChevronRight className="h-4 w-4 text-gray-600 dark:text-gray-400" />
              ) : (
                <ChevronLeft className="h-4 w-4 text-gray-600 dark:text-gray-400" />
              )}
            </button>
          )}

          <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
            {/* Logo */}
            <div className={`flex items-center flex-shrink-0 px-4 mb-6 ${isCollapsed ? 'justify-center' : ''}`}>
              {!isCollapsed ? (
                <img 
                  src={getLogo()} 
                  alt="CXP Motozone Logo" 
                  className="h-12 w-auto object-contain"
                />
              ) : (
                <img 
                  src="/tab_logo.jpg" 
                  alt="CXP Motozone Icon" 
                  className="h-10 w-10 object-contain"
                />
              )}
            </div>
        
            
            {/* Navigation Links */}
            <div className="flex-1 px-3 py-10 space-y-1">
              {filteredNavigation.map((item) => {
                const isActive = location.pathname === item.href || 
                                (item.href === '/shipments' && location.pathname.startsWith('/shipments/')) ||
                                (item.href === '/shipments/pending-returns' && location.pathname === '/shipments/pending-returns') ||
                                (item.href === '/products' && location.pathname.startsWith('/products/'));
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={handleLinkClick}
                    className={`
                      group flex items-center px-3 py-2.5 text-sm font-medium rounded-xl
                      transition-all duration-150
                      ${isActive
                        ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 shadow-sm'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }
                      ${isCollapsed ? 'justify-center' : ''}
                    `}
                    title={isCollapsed ? item.name : undefined}
                  >
                    <item.icon className={`
                      ${isCollapsed ? 'mr-0' : 'mr-3'} 
                      h-5 w-5 flex-shrink-0
                      ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300'}
                    `} />
                    {!isCollapsed && (
                      <span className="truncate">{item.name}</span>
                    )}
                    {!isCollapsed && isActive && (
                      <span className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400" />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>

       
        </div>
      </div>

      {/* Mobile Sidebar - This will show when isOpen is true on mobile */}
      {isMobile && (
        <div className={mobileClasses}>
          <div className="flex flex-col h-full">
            {/* Mobile Header with Logo and Close Button */}
            <div className="flex items-center justify-between px-4 py-5 border-b border-gray-200 dark:border-gray-700">
              <img 
                src={isDarkMode ? '/LOGO_CXP Motozone-02.png' : '/LOGO_CXP Motozone-01.png'} 
                alt="CXP Motozone Logo" 
                className="h-10 w-auto object-contain"
              />
              <button
                onClick={onClose}
                className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-150"
                aria-label="Close menu"
              >
                <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
              </button>
            </div>

            {/* Mobile User Info */}
            <div className="px-4 py-5 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
              <div className="flex items-center">
                <div className="flex items-center justify-center h-12 w-12 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 shadow-md overflow-hidden">
                  {user?.avatar ? (
                    <img src={user.avatar} alt={user.name} className="h-full w-full object-cover" />
                  ) : (
                    <User className="h-6 w-6 text-white" />
                  )}
                </div>
                <div className="ml-3">
                  <p className="text-base font-semibold text-gray-900 dark:text-gray-100">{user?.name || 'Demo User'}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">{user?.role || 'Admin'}</p>
                </div>
              </div>
            </div>

            {/* Mobile Navigation */}
            <div className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
              {filteredNavigation.map((item) => {
                const isActive = location.pathname === item.href || 
                                (item.href === '/shipments' && location.pathname.startsWith('/shipments/')) ||
                                (item.href === '/shipments/pending-returns' && location.pathname === '/shipments/pending-returns') ||
                                (item.href === '/products' && location.pathname.startsWith('/products/'));
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={handleLinkClick}
                    className={`
                      group flex items-center px-4 py-3 text-base font-medium rounded-xl
                      transition-all duration-150
                      ${isActive
                        ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 shadow-sm'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }
                    `}
                  >
                    <item.icon className={`mr-3 h-5 w-5 flex-shrink-0 ${
                      isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'
                    }`} />
                    <span className="flex-1">{item.name}</span>
                    {isActive && (
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400" />
                    )}
                  </Link>
                );
              })}
            </div>

            {/* Mobile Dark Mode Only - Logout removed */}
            <div className="flex-shrink-0 border-t border-gray-200 dark:border-gray-700 p-4">
              <button
                onClick={toggleDarkMode}
                className="flex items-center justify-between w-full px-4 py-3 text-base font-medium rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-150"
              >
                <span>Dark Mode</span>
                {isDarkMode ? (
                  <Sun className="h-5 w-5 text-yellow-500" />
                ) : (
                  <Moon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Overlay - shows when sidebar is open on mobile */}
      {isMobile && isOpen && (
        <div 
          className="fixed inset-0 bg-gray-600 bg-opacity-50 dark:bg-opacity-70 z-40 transition-opacity duration-300 lg:hidden"
          onClick={onClose}
        />
      )}
    </>
  );
};

export default Sidebar;