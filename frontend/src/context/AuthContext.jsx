import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL + '/api';

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

  // Process session ID from OAuth callback
  const processSessionId = useCallback(async (sessionId) => {
    try {
      const response = await axios.post(`${API_URL}/auth/session`, {
        session_id: sessionId
      }, {
        withCredentials: true,
        timeout: 30000 // 30 second timeout
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
      console.error('Session processing error:', error);
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
