// context/AuthContext.jsx
import React, { createContext, useState, useContext, useEffect } from 'react';
import { authService } from '../services/authService';
import toast from 'react-hot-toast';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));

  useEffect(() => {
    const loadUser = async () => {
      if (token) {
        try {
          // Try to get user from localStorage first for faster load
          const storedUser = localStorage.getItem('user');
          if (storedUser) {
            setUser(JSON.parse(storedUser));
          }
          
          // Then verify with server
          const userData = await authService.getCurrentUser();
          setUser(userData);
        } catch (error) {
          console.error('Failed to load user:', error);
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setToken(null);
          setUser(null);
        }
      }
      setLoading(false);
    };

    loadUser();
  }, [token]);

  const login = async (email, password) => {
    try {
      const response = await authService.login(email, password);
      
      // Handle different response structures
      if (response) {
        let userData = null;
        let authToken = null;

        // Check response structure and extract data accordingly
        if (response.data && response.token) {
          // Structure: { token: '...', data: { ... } }
          userData = response.data;
          authToken = response.token;
        } else if (response.user && response.token) {
          // Structure: { token: '...', user: { ... } }
          userData = response.user;
          authToken = response.token;
        } else if (response.data && response.data.token) {
          // Structure: { data: { token: '...', user: { ... } } }
          userData = response.data.user || response.data;
          authToken = response.data.token;
        } else if (response.token) {
          // Structure: { token: '...', ...userData }
          userData = response;
          authToken = response.token;
        }

        if (userData && authToken) {
          setUser(userData);
          setToken(authToken);
          
          // Show role-specific welcome message
          const role = userData.role || 'user';
          const roleCapitalized = role.charAt(0).toUpperCase() + role.slice(1);
          toast.success(`Welcome back, ${userData.name || 'User'}! You are logged in as ${roleCapitalized}`);
          return true;
        }
      }
      
      toast.error('Invalid response from server');
      return false;
    } catch (error) {
      console.error('Login error in context:', error);
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.message || 
                          error.message || 
                          'Login failed. Please check your credentials.';
      toast.error(errorMessage);
      return false;
    }
  };

  const register = async (userData) => {
    try {
      const response = await authService.register(userData);
      
      if (response) {
        // Handle auto-login after registration
        if (response.token) {
          let userData = response.data || response.user || response;
          setUser(userData);
          setToken(response.token);
          
          const role = userData.role || 'user';
          const roleCapitalized = role.charAt(0).toUpperCase() + role.slice(1);
          toast.success(`Registration successful! You are now logged in as ${roleCapitalized}`);
          return true;
        } 
        // If registration doesn't return token, attempt login
        else if (userData.email && userData.password) {
          const loginSuccess = await login(userData.email, userData.password);
          if (loginSuccess) {
            toast.success('Registration successful! You are now logged in.');
            return true;
          }
        }
      }
      
      toast.error('Registration successful but auto-login failed. Please try logging in manually.');
      return false;
    } catch (error) {
      console.error('Registration error:', error);
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.message || 
                          error.message || 
                          'Registration failed. Please try again.';
      toast.error(errorMessage);
      return false;
    }
  };

  const logout = () => {
    authService.logout();
    setUser(null);
    setToken(null);
 
  };

  // Helper function to check user roles
  const hasRole = (role) => {
    return user?.role === role;
  };

  const isAdmin = () => {
    return user?.role === 'admin';
  };

  const isManager = () => {
    return user?.role === 'manager';
  };

  const isCashier = () => {
    return user?.role === 'cashier';
  };

  // Get role badge color for UI
  const getRoleBadgeColor = () => {
    switch(user?.role) {
      case 'admin':
        return 'bg-purple-100 text-purple-800';
      case 'manager':
        return 'bg-blue-100 text-blue-800';
      case 'cashier':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const value = {
    user,
    login,
    register,
    logout,
    loading,
    isAuthenticated: !!user,
    // Role-based helper functions
    hasRole,
    isAdmin,
    isManager,
    isCashier,
    getRoleBadgeColor,
    // User role shortcut
    userRole: user?.role || null
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};