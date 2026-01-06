import React, { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader2 } from 'lucide-react';

export const AuthCallback = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { processSessionId } = useAuth();
  const hasProcessed = useRef(false);

  useEffect(() => {
    // Prevent double processing in StrictMode
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const processAuth = async () => {
      // Extract session_id from URL fragment
      const hash = location.hash;
      const sessionIdMatch = hash.match(/session_id=([^&]+)/);
      
      if (!sessionIdMatch) {
        console.error('No session_id in URL');
        navigate('/builder', { replace: true });
        return;
      }

      const sessionId = sessionIdMatch[1];

      try {
        const user = await processSessionId(sessionId);
        // Get the stored return path or default to builder
        const returnPath = sessionStorage.getItem('authReturnPath') || '/builder';
        sessionStorage.removeItem('authReturnPath');
        // Navigate back to where user was
        navigate(returnPath, { replace: true, state: { user } });
      } catch (error) {
        console.error('Auth callback error:', error);
        navigate('/builder', { replace: true });
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
