// services/authService.js
import api from './api';
import { userService } from './userService';

export const authService = {
  async login(email, password) {
    try {
      console.log('Attempting login with:', { email });
      
      const response = await api.post('/auth/login', { email, password });
      
      console.log('Login response:', response.data);
      
      if (response.data) {
        let token = null;
        let userData = null;

        if (response.data.token) {
          token = response.data.token;
        } else if (response.data.data?.token) {
          token = response.data.data.token;
        }

        if (response.data.data) {
          userData = response.data.data;
        } else if (response.data.user) {
          userData = response.data.user;
        } else if (response.data) {
          userData = response.data;
        }

        if (token) {
          localStorage.setItem('token', token);
          
          if (userData) {
            localStorage.setItem('user', JSON.stringify(userData));
          }
          
          // Start last active tracking
          this.startLastActiveTracking();
          
          return {
            token,
            data: userData,
            originalResponse: response.data
          };
        }
      }
      
      throw new Error('Invalid response from server - missing token');
    } catch (error) {
      console.error('Login service error:', error);
      if (error.response) {
        const serverError = error.response.data?.error || 
                           error.response.data?.message || 
                           `Server error: ${error.response.status}`;
        throw new Error(serverError);
      } else if (error.request) {
        throw new Error('No response from server. Please check your connection.');
      } else {
        throw error;
      }
    }
  },

  async register(userData) {
    try {
      console.log('Attempting registration with:', { ...userData, password: '[REDACTED]' });
      
      const response = await api.post('/auth/register', userData);
      
      console.log('Registration response:', response.data);
      
      if (response.data) {
        if (response.data.token) {
          localStorage.setItem('token', response.data.token);
          
          const user = response.data.data || response.data.user || response.data;
          if (user) {
            localStorage.setItem('user', JSON.stringify(user));
          }
          
          // Start last active tracking
          this.startLastActiveTracking();
          
          return response.data;
        }
        
        return response.data;
      }
      
      throw new Error('Invalid response from server');
    } catch (error) {
      console.error('Register service error:', error);
      if (error.response) {
        const serverError = error.response.data?.error || 
                           error.response.data?.message || 
                           `Server error: ${error.response.status}`;
        throw new Error(serverError);
      } else if (error.request) {
        throw new Error('No response from server. Please check your connection.');
      } else {
        throw error;
      }
    }
  },

  async getCurrentUser() {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No token found');
      }

      const response = await api.get('/auth/me');
      
      console.log('Get current user response:', response.data);
      
      if (response.data) {
        const userData = response.data.data || response.data.user || response.data;
        
        if (userData) {
          localStorage.setItem('user', JSON.stringify(userData));
          
          // Update last active on successful fetch
          this.updateLastActive().catch(() => {});
          
          return userData;
        }
      }
      
      throw new Error('Invalid response from server');
    } catch (error) {
      console.error('Get current user error:', error);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      throw error;
    }
  },

  async updateDetails(userData) {
    try {
      const response = await api.put('/auth/updatedetails', userData);
      
      if (response.data) {
        const updatedUser = response.data.data || response.data.user || response.data;
        if (updatedUser) {
          const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
          localStorage.setItem('user', JSON.stringify({ ...currentUser, ...updatedUser }));
        }
        return response.data;
      }
      
      throw new Error('Invalid response from server');
    } catch (error) {
      console.error('Update details error:', error);
      throw error;
    }
  },

  async updatePassword(passwordData) {
    try {
      const response = await api.put('/auth/updatepassword', passwordData);
      return response.data;
    } catch (error) {
      console.error('Update password error:', error);
      throw error;
    }
  },

  async logout() {
    try {
      console.log('Logging out...');
      
      // Try to notify server about logout
      const token = localStorage.getItem('token');
      if (token) {
        await api.post('/auth/logout').catch(err => {
          console.warn('Logout notification failed:', err);
        });
      }
    } catch (error) {
      console.warn('Error during logout notification:', error);
    } finally {
      // Stop last active tracking
      this.stopLastActiveTracking();
      
      // Clear local storage
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      sessionStorage.clear();
      
      console.log('Logout completed');
    }
  },

  async refreshToken() {
    try {
      console.log('Refreshing token...');
      
      const response = await api.post('/auth/refresh-token');
      
      if (response.data && response.data.token) {
        localStorage.setItem('token', response.data.token);
        console.log('Token refreshed successfully');
        return response.data.token;
      }
      
      throw new Error('Failed to refresh token');
    } catch (error) {
      console.error('Refresh token error:', error);
      
      // If refresh fails, log out
      if (error.response?.status === 401) {
        this.logout();
      }
      
      throw error;
    }
  },

  async updateLastActive() {
    try {
      if (!this.isAuthenticated()) return;
      
      await userService.updateLastActive();
    } catch (error) {
      console.debug('Last active update failed:', error);
      // Don't throw - this is a background operation
    }
  },

  // Last active tracking
  lastActiveInterval: null,
  refreshTokenInterval: null,

  startLastActiveTracking() {
    // Stop any existing intervals
    this.stopLastActiveTracking();
    
    // Update last active immediately
    this.updateLastActive();
    
    // Update last active every 2 minutes
    this.lastActiveInterval = setInterval(() => {
      this.updateLastActive();
    }, 120000); // 2 minutes
    
    // Refresh token every 45 minutes (before it expires)
    this.refreshTokenInterval = setInterval(() => {
      if (this.isAuthenticated()) {
        this.refreshToken().catch(() => {});
      }
    }, 45 * 60 * 1000); // 45 minutes
  },

  stopLastActiveTracking() {
    if (this.lastActiveInterval) {
      clearInterval(this.lastActiveInterval);
      this.lastActiveInterval = null;
    }
    
    if (this.refreshTokenInterval) {
      clearInterval(this.refreshTokenInterval);
      this.refreshTokenInterval = null;
    }
  },

  isAuthenticated() {
    const token = localStorage.getItem('token');
    if (!token) return false;
    
    // Optional: Check token expiration
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const exp = payload.exp * 1000; // Convert to milliseconds
      if (Date.now() >= exp) {
        // Token expired
        this.logout();
        return false;
      }
      return true;
    } catch {
      return !!token;
    }
  },

  getCurrentUserFromStorage() {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch {
        return null;
      }
    }
    return null;
  },

  hasRole(role) {
    const user = this.getCurrentUserFromStorage();
    return user && user.role === role;
  },

  hasAnyRole(roles) {
    const user = this.getCurrentUserFromStorage();
    return user && roles.includes(user.role);
  },

  isAdmin() {
    return this.hasRole('admin');
  },

  isManager() {
    return this.hasAnyRole(['admin', 'manager']);
  },

  isCashier() {
    return this.hasRole('cashier');
  },

  isStaff() {
    return this.hasAnyRole(['staff', 'cashier', 'manager', 'admin']);
  },

  getToken() {
    return localStorage.getItem('token');
  },

  getTokenExpiration() {
    const token = this.getToken();
    if (!token) return null;
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp ? payload.exp * 1000 : null;
    } catch {
      return null;
    }
  },

  isTokenExpiringSoon(minutes = 10) {
    const exp = this.getTokenExpiration();
    if (!exp) return true;
    
    const now = Date.now();
    const timeUntilExp = exp - now;
    
    return timeUntilExp < minutes * 60 * 1000;
  },

  async ensureValidToken() {
    if (!this.isAuthenticated()) {
      throw new Error('Not authenticated');
    }
    
    if (this.isTokenExpiringSoon(5)) {
      try {
        await this.refreshToken();
      } catch (error) {
        console.error('Failed to refresh expiring token:', error);
        throw error;
      }
    }
    
    return this.getToken();
  },

  // Get user's last active status
  async checkUserStatus() {
    try {
      const user = this.getCurrentUserFromStorage();
      if (!user || !user.id) return null;
      
      const response = await api.get(`/users/${user.id}`);
      return response.data.data || response.data.user;
    } catch (error) {
      console.error('Error checking user status:', error);
      return null;
    }
  },

  // Setup auto-refresh on page load
  initialize() {
    if (this.isAuthenticated()) {
      this.startLastActiveTracking();
      
      // Check if token is about to expire and refresh
      if (this.isTokenExpiringSoon(15)) {
        this.refreshToken().catch(() => {});
      }
    }
    
    // Listen for visibility change to update last active when user returns
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && this.isAuthenticated()) {
        this.updateLastActive();
      }
    });
    
    // Listen for before unload to notify logout (optional)
    window.addEventListener('beforeunload', () => {
      if (this.isAuthenticated() && navigator.sendBeacon) {
        const token = this.getToken();
        if (token) {
          navigator.sendBeacon('/api/auth/logout', JSON.stringify({}));
        }
      }
    });
  }
};

// Auto-initialize on import
if (typeof window !== 'undefined') {
  authService.initialize();
}