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
  const [errorDetails, setErrorDetails] = useState(null);

  useEffect(() => {
    // Prevent double processing in StrictMode
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const processAuth = async () => {
      // Get the full URL for debugging
      const fullUrl = window.location.href;
      const hash = window.location.hash;
      const search = window.location.search;
      
      console.log('=== Auth Callback Debug ===');
      console.log('Full URL:', fullUrl);
      console.log('Hash:', hash);
      console.log('Search:', search);
      console.log('Location hash:', location.hash);
      console.log('Location search:', location.search);
      
      // Try multiple ways to extract session_id
      let sessionId = null;
      
      // Method 1: From hash fragment
      const hashMatch = hash.match(/session_id=([^&]+)/);
      if (hashMatch) {
        sessionId = hashMatch[1];
        console.log('Found session_id in hash');
      }
      
      // Method 2: From search params
      if (!sessionId) {
        const searchMatch = search.match(/session_id=([^&]+)/);
        if (searchMatch) {
          sessionId = searchMatch[1];
          console.log('Found session_id in search');
        }
      }
      
      // Method 3: From URL search params API
      if (!sessionId) {
        const urlParams = new URLSearchParams(search);
        const paramSessionId = urlParams.get('session_id');
        if (paramSessionId) {
          sessionId = paramSessionId;
          console.log('Found session_id via URLSearchParams');
        }
      }
      
      // Method 4: From hash as search params (some auth systems use #?session_id=)
      if (!sessionId && hash.includes('?')) {
        const hashSearch = hash.substring(hash.indexOf('?'));
        const hashParams = new URLSearchParams(hashSearch);
        const hashParamSessionId = hashParams.get('session_id');
        if (hashParamSessionId) {
          sessionId = hashParamSessionId;
          console.log('Found session_id in hash search params');
        }
      }
      
      if (!sessionId) {
        console.error('No session_id found in URL');
        setStatus('No session found');
        setErrorDetails(`URL: ${fullUrl}`);
        toast.error('Authentication failed - no session found');
        setTimeout(() => navigate('/builder', { replace: true }), 3000);
        return;
      }

      console.log('Session ID found:', sessionId.substring(0, 20) + '...');
      setStatus('Verifying session...');

      try {
        const user = await processSessionId(sessionId);
        console.log('Auth successful:', user?.email);
        setStatus('Success! Redirecting...');
        toast.success(`Welcome, ${user?.name || 'User'}!`);
        
        // Get the stored return path or default to builder
        const returnPath = sessionStorage.getItem('authReturnPath') || '/builder';
        sessionStorage.removeItem('authReturnPath');
        
        // Clear the URL hash/search to prevent re-processing
        window.history.replaceState(null, '', returnPath);
        
        // Navigate back to where user was
        setTimeout(() => navigate(returnPath, { replace: true }), 500);
      } catch (error) {
        console.error('Auth callback error:', error);
        const errorMsg = error.response?.data?.detail || error.message || 'Unknown error';
        console.error('Error details:', errorMsg);
        setStatus('Authentication failed');
        setErrorDetails(errorMsg);
        toast.error('Sign in failed: ' + errorMsg);
        setTimeout(() => navigate('/builder', { replace: true }), 3000);
      }
    };

    processAuth();
  }, [location.hash, location.search, navigate, processSessionId]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4 p-6 max-w-md">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
        <p className="text-muted-foreground font-medium">{status}</p>
        {errorDetails && (
          <p className="text-xs text-red-500 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg break-all">
            {errorDetails}
          </p>
        )}
      </div>
    </div>
  );
};
