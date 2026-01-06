import React, { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader2 } from 'lucide-react';

export const AuthCallback = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { processGoogleCode } = useAuth();
  const hasProcessed = useRef(false);

  useEffect(() => {
    // Prevent double processing in StrictMode
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const processAuth = async () => {
      // Get code from URL query params (Google OAuth returns code in query string)
      const urlParams = new URLSearchParams(location.search);
      const code = urlParams.get('code');
      
      if (!code) {
        console.error('No auth code in URL');
        navigate('/', { replace: true });
        return;
      }

      try {
        const user = await processGoogleCode(code);
        // Navigate to main app with user data
        navigate('/', { replace: true, state: { user } });
      } catch (error) {
        console.error('Auth callback error:', error);
        navigate('/', { replace: true });
      }
    };

    processAuth();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
        <p className="text-muted-foreground">Signing you in with Google...</p>
      </div>
    </div>
  );
};
