// App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { ShipmentProvider } from './context/ShipmentContext';
import { ProductProvider } from './context/ProductContext';
import { SaleProvider } from './context/SaleContext';
import { ThemeProvider } from './context/ThemeContext';
import { ApprovalProvider } from './context/ApprovalContext'; // Add this import
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
import Approvals from './pages/Approvals'; // Import Approvals page

function App() {
  return (
    <Router
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <ThemeProvider>
        <AuthProvider>
          <ApprovalProvider> {/* Add ApprovalProvider here */}
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
                      loading: {
                        duration: 3000,
                        icon: '⏳',
                        style: {
                          background: '#3b82f6',
                        },
                      },
                    }}
                  />
                  <Routes>
                    {/* Public routes */}
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    
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
                    
                    {/* Approval Routes */}
                    <Route path="/approvals" element={
                      <PrivateRoute>
                        <Layout>
                          <Approvals />
                        </Layout>
                      </PrivateRoute>
                    } />
                    
                    <Route path="/my-requests" element={
                      <PrivateRoute>
                        <Layout>
                          <Approvals />
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
          </ApprovalProvider> {/* Close ApprovalProvider */}
        </AuthProvider>
      </ThemeProvider>
    </Router>
  );
}

export default App;