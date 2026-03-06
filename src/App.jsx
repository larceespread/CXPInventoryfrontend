// App.js
import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { ShipmentProvider } from './context/ShipmentContext';
import { ProductProvider } from './context/ProductContext';
import { SaleProvider } from './context/SaleContext';
import { ThemeProvider } from './context/ThemeContext';
import PrivateRoute from './components/PrivateRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/DashboardPage';
import Inventory from './pages/Inventory';
import Products from './pages/Products';
import Sales from './pages/Sales';
import Categories from './pages/Categories';
import Brands from './pages/Brands';
import Reports from './pages/Reports';
import Users from './pages/Users';
import Settings from './pages/Settings';
import ShipmentList from './components/shipments/ShipmentList';
import ShipmentForm from './components/shipments/ShipmentForm';
import ShipmentDetails from './components/shipments/ShipmentDetails';
import ConnectionTest from './components/ConnectionTest'; // Import the connection test component
import api, { checkBackendHealth } from './services/api'; // Import API utilities

function App() {
  const [backendStatus, setBackendStatus] = useState({
    connected: false,
    checking: true,
    error: null,
    info: null
  });

  // Check backend connection on app start
  useEffect(() => {
    const checkConnection = async () => {
      try {
        console.log('🔍 Checking backend connection...');
        const healthData = await checkBackendHealth();
        
        if (healthData) {
          console.log('✅ Backend connected successfully:', healthData);
          setBackendStatus({
            connected: true,
            checking: false,
            error: null,
            info: healthData
          });
        } else {
          console.warn('⚠️ Backend health check returned no data');
          setBackendStatus({
            connected: false,
            checking: false,
            error: 'Backend health check failed',
            info: null
          });
        }
      } catch (error) {
        console.error('❌ Backend connection failed:', error);
        setBackendStatus({
          connected: false,
          checking: false,
          error: error.message || 'Failed to connect to backend',
          info: null
        });
      }
    };

    checkConnection();

    // Optional: Set up periodic health checks (every 5 minutes)
    const interval = setInterval(checkConnection, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  // Show connection status in development
  useEffect(() => {
    if (import.meta.env.DEV) {
      console.log('🌐 Environment:', import.meta.env.MODE);
      console.log('📡 API URL:', import.meta.env.VITE_API_URL || 'http://localhost:5000/api');
      console.log('🔌 Backend Status:', backendStatus);
    }
  }, [backendStatus]);

  return (
    <Router
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <ThemeProvider>
        <AuthProvider>
          <ProductProvider>
            <SaleProvider>
              <ShipmentProvider>
                <Toaster 
                  position="top-right"
                  toastOptions={{
                    duration: 4000,
                    style: {
                      background: '#363636',
                      color: '#fff',
                    },
                    success: {
                      duration: 3000,
                      icon: '✅',
                      style: {
                        background: '#10b981',
                      },
                    },
                    error: {
                      duration: 4000,
                      icon: '❌',
                      style: {
                        background: '#ef4444',
                      },
                    },
                    warning: {
                      duration: 4000,
                      icon: '⚠️',
                      style: {
                        background: '#f59e0b',
                      },
                    },
                    loading: {
                      duration: 3000,
                      icon: '⏳',
                      style: {
                        background: '#3b82f6',
                      },
                    },
                  }}
                />
                
                {/* Show connection test in development or when backend is down */}
                {(import.meta.env.DEV || !backendStatus.connected) && (
                  <div style={{ 
                    position: 'fixed', 
                    bottom: '20px', 
                    right: '20px', 
                    zIndex: 9999,
                    maxWidth: '400px',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                  }}>
                    <ConnectionTest />
                  </div>
                )}

                <Routes>
                  {/* Public routes */}
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  
                  {/* Test route - always accessible */}
                  <Route path="/test-connection" element={
                    <div style={{ padding: '20px' }}>
                      <h1>Connection Test Page</h1>
                      <ConnectionTest />
                      <button 
                        onClick={() => window.history.back()}
                        style={{
                          marginTop: '20px',
                          padding: '10px 20px',
                          background: '#3b82f6',
                          color: 'white',
                          border: 'none',
                          borderRadius: '5px',
                          cursor: 'pointer'
                        }}
                      >
                        Go Back
                      </button>
                    </div>
                  } />
                  
                  {/* Protected routes with Layout */}
                  <Route path="/" element={
                    <PrivateRoute>
                      <Layout>
                        <Dashboard />
                      </Layout>
                    </PrivateRoute>
                  } />
                  
                  <Route path="/dashboard" element={
                    <PrivateRoute>
                      <Layout>
                        <Dashboard />
                      </Layout>
                    </PrivateRoute>
                  } />
                  
                  <Route path="/inventory" element={
                    <PrivateRoute>
                      <Layout>
                        <Inventory />
                      </Layout>
                    </PrivateRoute>
                  } />
                  
                  <Route path="/products/*" element={
                    <PrivateRoute>
                      <Layout>
                        <Products />
                      </Layout>
                    </PrivateRoute>
                  } />
                  
                  <Route path="/sales" element={
                    <PrivateRoute>
                      <Layout>
                        <Sales />
                      </Layout>
                    </PrivateRoute>
                  } />
                  
                  <Route path="/categories" element={
                    <PrivateRoute>
                      <Layout>
                        <Categories />
                      </Layout>
                    </PrivateRoute>
                  } />
                  
                  <Route path="/brands" element={
                    <PrivateRoute>
                      <Layout>
                        <Brands />
                      </Layout>
                    </PrivateRoute>
                  } />
                  
                  <Route path="/reports" element={
                    <PrivateRoute>
                      <Layout>
                        <Reports />
                      </Layout>
                    </PrivateRoute>
                  } />
                  
                  <Route path="/users" element={
                    <PrivateRoute>
                      <Layout>
                        <Users />
                      </Layout>
                    </PrivateRoute>
                  } />
                  
                  <Route path="/settings" element={
                    <PrivateRoute>
                      <Layout>
                        <Settings />
                      </Layout>
                    </PrivateRoute>
                  } />
                  
                  {/* Shipment Routes */}
                  <Route path="/shipments" element={
                    <PrivateRoute>
                      <Layout>
                        <ShipmentList />
                      </Layout>
                    </PrivateRoute>
                  } />
                  
                  <Route path="/shipments/new" element={
                    <PrivateRoute>
                      <Layout>
                        <ShipmentForm />
                      </Layout>
                    </PrivateRoute>
                  } />
                  
                  <Route path="/shipments/edit/:id" element={
                    <PrivateRoute>
                      <Layout>
                        <ShipmentForm />
                      </Layout>
                    </PrivateRoute>
                  } />
                  
                  <Route path="/shipments/:id" element={
                    <PrivateRoute>
                      <Layout>
                        <ShipmentDetails />
                      </Layout>
                    </PrivateRoute>
                  } />
                  
                  {/* Catch all route - redirect to dashboard */}
                  <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Routes>
              </ShipmentProvider>
            </SaleProvider>
          </ProductProvider>
        </AuthProvider>
      </ThemeProvider>
    </Router>
  );
}

export default App;