import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export const AuthCallback = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { processSessionId } = useAuth();
  const hasProcessed = useRef(false);
  const [status, setStatus] = useState('Processing...');

  useEffect(() => {
    // Prevent double processing in StrictMode
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const processAuth = async () => {
      // Extract session_id from URL fragment or search params
      const hash = location.hash || window.location.hash;
      const search = location.search || window.location.search;
      
      console.log('Auth callback - hash:', hash);
      console.log('Auth callback - search:', search);
      
      let sessionIdMatch = hash.match(/session_id=([^&]+)/);
      if (!sessionIdMatch) {
        sessionIdMatch = search.match(/session_id=([^&]+)/);
      }
      
      if (!sessionIdMatch) {
        console.error('No session_id in URL');
        console.log('Full URL:', window.location.href);
        setStatus('No session found - redirecting...');
        toast.error('Authentication failed - no session found');
        setTimeout(() => navigate('/builder', { replace: true }), 1500);
        return;
      }

      const sessionId = sessionIdMatch[1];
      console.log('Found session_id:', sessionId.substring(0, 20) + '...');
      setStatus('Verifying session...');

      try {
        const user = await processSessionId(sessionId);
        console.log('Auth successful:', user?.email);
        setStatus('Success! Redirecting...');
        toast.success(`Welcome, ${user?.name || 'User'}!`);
        
        // Get the stored return path or default to builder
        const returnPath = sessionStorage.getItem('authReturnPath') || '/builder';
        sessionStorage.removeItem('authReturnPath');
        // Navigate back to where user was
        setTimeout(() => navigate(returnPath, { replace: true, state: { user } }), 500);
      } catch (error) {
        console.error('Auth callback error:', error);
        console.error('Error details:', error.response?.data || error.message);
        setStatus('Authentication failed');
        toast.error('Sign in failed: ' + (error.response?.data?.detail || error.message));
        setTimeout(() => navigate('/builder', { replace: true }), 2000);
      }
    };

    processAuth();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
        <p className="text-muted-foreground">Signing you in...</p>
      </div>
    </div>
  );
};
