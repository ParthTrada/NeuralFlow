import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

// API URL configuration
// In production (neuralflows.ai): Uses same origin with /api prefix
// In development: Uses REACT_APP_BACKEND_URL from .env
const getApiUrl = () => {
  // Check if we're on production domain
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    
    // Production domains - use same origin
    if (hostname === 'neuralflows.ai' || hostname === 'www.neuralflows.ai') {
      return window.location.origin + '/api';
    }
  }
  
  // Development or preview - use env variable
  const envUrl = process.env.REACT_APP_BACKEND_URL;
  if (envUrl) {
    return envUrl + '/api';
  }
  
  // Fallback to same origin
  return (typeof window !== 'undefined' ? window.location.origin : '') + '/api';
};

const API_URL = getApiUrl();
console.log('Auth API URL:', API_URL); // Debug log

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check auth status on mount
  const checkAuth = useCallback(async () => {
    try {
      // First check localStorage for stored user
      const storedUser = localStorage.getItem('neuralflow_user');
      const storedToken = localStorage.getItem('neuralflow_token');
      
      if (storedUser && storedToken) {
        // Verify token is still valid
        const response = await axios.get(`${API_URL}/auth/me`, {
          headers: { 'Authorization': `Bearer ${storedToken}` },
          withCredentials: true
        });
        setUser(response.data);
      }
    } catch (error) {
      // Token invalid, clear storage
      localStorage.removeItem('neuralflow_user');
      localStorage.removeItem('neuralflow_token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Emergent Google OAuth login
  const login = useCallback(() => {
    // Store current path to return after login
    const currentPath = window.location.pathname;
    sessionStorage.setItem('authReturnPath', currentPath !== '/auth/callback' ? currentPath : '/builder');
    
    // Redirect to Emergent OAuth
    const redirectUrl = window.location.origin + '/auth/callback';
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  }, []);

  // Logout
  const logout = useCallback(async () => {
    try {
      const storedToken = localStorage.getItem('neuralflow_token');
      if (storedToken) {
        await axios.post(`${API_URL}/auth/logout`, {}, {
          headers: { 'Authorization': `Bearer ${storedToken}` },
          withCredentials: true
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Always clear local state
      localStorage.removeItem('neuralflow_user');
      localStorage.removeItem('neuralflow_token');
      setUser(null);
    }
  }, []);

  // Process session ID from OAuth callback with retry logic
  const processSessionId = useCallback(async (sessionId, retryCount = 0) => {
    const maxRetries = 2;
    
    try {
      console.log('Processing session ID, attempt:', retryCount + 1);
      
      const response = await axios.post(`${API_URL}/auth/session`, {
        session_id: sessionId
      }, {
        withCredentials: true,
        timeout: 30000, // 30 second timeout
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const userData = response.data;
      
      // Store user and token
      localStorage.setItem('neuralflow_user', JSON.stringify(userData));
      if (userData.session_token) {
        localStorage.setItem('neuralflow_token', userData.session_token);
      }
      
      setUser(userData);
      return userData;
    } catch (error) {
      console.error('Session processing error:', error.message, error.code);
      
      // Retry on network errors (common on mobile)
      if (retryCount < maxRetries && (error.code === 'ERR_NETWORK' || error.message.includes('Network Error'))) {
        console.log('Network error, retrying in 1 second...');
        await new Promise(resolve => setTimeout(resolve, 1000));
        return processSessionId(sessionId, retryCount + 1);
      }
      
      throw error;
    }
  }, []);

  const value = {
    user,
    loading,
    login,
    logout,
    processSessionId,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
