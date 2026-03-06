import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isDesktopSidebarCollapsed, setIsDesktopSidebarCollapsed] = useState(true);

  // Check if mobile on mount and when window resizes
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      
      // Close mobile sidebar when switching from mobile to desktop
      if (!mobile) {
        setSidebarOpen(false);
      }
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Load desktop sidebar state from localStorage
  useEffect(() => {
    const savedState = localStorage.getItem('desktopSidebarCollapsed');
    if (savedState !== null) {
      setIsDesktopSidebarCollapsed(JSON.parse(savedState));
    }
  }, []);

  // Save desktop sidebar state to localStorage
  useEffect(() => {
    localStorage.setItem('desktopSidebarCollapsed', JSON.stringify(isDesktopSidebarCollapsed));
  }, [isDesktopSidebarCollapsed]);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  const toggleDesktopSidebar = () => {
    setIsDesktopSidebarCollapsed(!isDesktopSidebarCollapsed);
  };

  // Calculate margin for main content based on desktop sidebar state
  const getDesktopContentMargin = () => {
    if (isMobile) return 'ml-0';
    return isDesktopSidebarCollapsed ? 'ml-20' : 'ml-64';
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200 overflow-hidden">
      {/* Sidebar component */}
      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={closeSidebar}
        onToggle={toggleSidebar}
        isMobile={isMobile}
        isCollapsed={isDesktopSidebarCollapsed}
        onCollapseToggle={toggleDesktopSidebar}
      />

      {/* Main content */}
      <div className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ease-in-out ${getDesktopContentMargin()}`}>
        {/* Header with toggleSidebar function */}
        <Header toggleSidebar={toggleSidebar} />
        
        {/* Page content */}
        <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
          <div className="py-6 px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;