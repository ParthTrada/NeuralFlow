import React, { createContext, useContext, useState, useEffect } from 'react';
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
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      // First try to get user from localStorage as backup
      const storedUser = localStorage.getItem('neuralflow_user');
      const storedToken = localStorage.getItem('neuralflow_token');
      
      // Try API call with token in header
      const headers = storedToken ? { 'Authorization': `Bearer ${storedToken}` } : {};
      
      const response = await axios.get(`${API_URL}/auth/me`, {
        withCredentials: true,
        headers
      });
      setUser(response.data);
      // Update localStorage
      localStorage.setItem('neuralflow_user', JSON.stringify(response.data));
    } catch (error) {
      // Clear localStorage on auth failure
      localStorage.removeItem('neuralflow_user');
      localStorage.removeItem('neuralflow_token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  // Emergent Google OAuth login
  const login = () => {
    // Store current path to return after login
    sessionStorage.setItem('authReturnPath', window.location.pathname);
    const redirectUrl = window.location.origin + '/auth/callback';
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  const logout = async () => {
    try {
      const storedToken = localStorage.getItem('neuralflow_token');
      const headers = storedToken ? { 'Authorization': `Bearer ${storedToken}` } : {};
      
      await axios.post(`${API_URL}/auth/logout`, {}, {
        withCredentials: true,
        headers
      });
    } catch (error) {
      console.error('Logout error:', error);
    }
    // Clear localStorage
    localStorage.removeItem('neuralflow_user');
    localStorage.removeItem('neuralflow_token');
    setUser(null);
  };

  const processSessionId = async (sessionId) => {
    try {
      const response = await axios.post(`${API_URL}/auth/session`, {
        session_id: sessionId
      }, {
        withCredentials: true
      });
      
      // Store user and token in localStorage for mobile browsers that block cookies
      localStorage.setItem('neuralflow_user', JSON.stringify(response.data));
      if (response.data.session_token) {
        localStorage.setItem('neuralflow_token', response.data.session_token);
      }
      
      setUser(response.data);
      return response.data;
    } catch (error) {
      console.error('Session processing error:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      login,
      logout,
      processSessionId,
      checkAuth,
      isAuthenticated: !!user
    }}>
      {children}
    </AuthContext.Provider>
  );
};
