import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';

export const AuthCallback = () => {
  const navigate = useNavigate();
  const { processSessionId } = useAuth();
  const hasProcessed = useRef(false);
  const [status, setStatus] = useState('processing'); // processing, success, error
  const [message, setMessage] = useState('Signing you in...');

  useEffect(() => {
    // Prevent double processing
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const handleAuth = async () => {
      try {
        // Get session_id from URL
        const sessionId = extractSessionId();
        
        if (!sessionId) {
          throw new Error('No session ID found. Please try signing in again.');
        }

        setMessage('Verifying your session...');
        
        // Exchange session_id for user data
        const user = await processSessionId(sessionId);
        
        setStatus('success');
        setMessage(`Welcome, ${user?.name || 'User'}!`);
        toast.success(`Signed in as ${user?.email}`);
        
        // Get return path and navigate
        const returnPath = sessionStorage.getItem('authReturnPath') || '/builder';
        sessionStorage.removeItem('authReturnPath');
        
        // Clean URL and redirect
        setTimeout(() => {
          window.history.replaceState(null, '', returnPath);
          navigate(returnPath, { replace: true });
        }, 1000);
        
      } catch (error) {
        console.error('Auth error:', error);
        setStatus('error');
        
        const errorMessage = error.response?.data?.detail || error.message || 'Authentication failed';
        setMessage(errorMessage);
        toast.error(errorMessage);
        
        // Redirect to builder after delay
        setTimeout(() => {
          navigate('/builder', { replace: true });
        }, 3000);
      }
    };

    handleAuth();
  }, [navigate, processSessionId]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4 p-8 max-w-sm">
        {status === 'processing' && (
          <Loader2 className="w-12 h-12 animate-spin mx-auto text-primary" />
        )}
        {status === 'success' && (
          <CheckCircle className="w-12 h-12 mx-auto text-green-500" />
        )}
        {status === 'error' && (
          <XCircle className="w-12 h-12 mx-auto text-red-500" />
        )}
        
        <p className={`text-lg font-medium ${
          status === 'error' ? 'text-red-600' : 
          status === 'success' ? 'text-green-600' : 
          'text-muted-foreground'
        }`}>
          {message}
        </p>
        
        {status === 'error' && (
          <p className="text-sm text-muted-foreground">
            Redirecting to builder...
          </p>
        )}
      </div>
    </div>
  );
};

// Helper function to extract session_id from URL
function extractSessionId() {
  const url = window.location.href;
  const hash = window.location.hash;
  const search = window.location.search;
  
  // Try hash fragment first (most common for OAuth)
  if (hash) {
    const hashMatch = hash.match(/session_id=([^&]+)/);
    if (hashMatch) return decodeURIComponent(hashMatch[1]);
  }
  
  // Try query params
  if (search) {
    const params = new URLSearchParams(search);
    const sessionId = params.get('session_id');
    if (sessionId) return sessionId;
  }
  
  // Try full URL regex as fallback
  const urlMatch = url.match(/[#?&]session_id=([^&]+)/);
  if (urlMatch) return decodeURIComponent(urlMatch[1]);
  
  return null;
}

export default AuthCallback;
