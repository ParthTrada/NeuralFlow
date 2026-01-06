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
  const [googleClientId, setGoogleClientId] = useState(null);

  // Get Google Client ID and check auth status on mount
  useEffect(() => {
    fetchGoogleClientId();
    checkAuth();
  }, []);

  const fetchGoogleClientId = async () => {
    try {
      const response = await axios.get(`${API_URL}/auth/google/client-id`);
      setGoogleClientId(response.data.client_id);
    } catch (error) {
      console.error('Failed to get Google Client ID:', error);
    }
  };

  const checkAuth = async () => {
    try {
      const response = await axios.get(`${API_URL}/auth/me`, {
        withCredentials: true
      });
      setUser(response.data);
    } catch (error) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  // Direct Google OAuth login
  const login = () => {
    if (!googleClientId) {
      console.error('Google Client ID not loaded');
      return;
    }

    const redirectUri = window.location.origin + '/auth/callback';
    const scope = 'openid email profile';
    
    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${googleClientId}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&response_type=code` +
      `&scope=${encodeURIComponent(scope)}` +
      `&access_type=offline` +
      `&prompt=consent`;
    
    window.location.href = googleAuthUrl;
  };

  const logout = async () => {
    try {
      await axios.post(`${API_URL}/auth/logout`, {}, {
        withCredentials: true
      });
    } catch (error) {
      console.error('Logout error:', error);
    }
    setUser(null);
  };

  // Process Google auth code
  const processGoogleCode = async (code) => {
    try {
      const redirectUri = window.location.origin + '/auth/callback';
      const response = await axios.post(`${API_URL}/auth/google`, {
        code,
        redirect_uri: redirectUri
      }, {
        withCredentials: true
      });
      setUser(response.data);
      return response.data;
    } catch (error) {
      console.error('Google auth error:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      login,
      logout,
      processGoogleCode,
      checkAuth,
      isAuthenticated: !!user
    }}>
      {children}
    </AuthContext.Provider>
  );
};
