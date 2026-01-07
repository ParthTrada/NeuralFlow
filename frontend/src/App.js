import "@/App.css";
import { BrowserRouter, Routes, Route, useLocation, Navigate } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "./context/AuthContext";
import { AuthCallback } from "./components/AuthCallback";
import Landing from "./pages/Landing";
import Builder from "./pages/Builder";
import Admin from "./pages/Admin";

// Router component that handles auth callback detection
function AppRouter() {
  const location = useLocation();
  
  // Check if URL contains session_id (OAuth callback)
  const hasSessionId = location.hash?.includes('session_id=') || 
                       location.search?.includes('session_id=');
  
  // If we have a session_id, redirect to auth callback
  if (hasSessionId && location.pathname !== '/auth/callback') {
    return <Navigate to={`/auth/callback${location.hash}${location.search}`} replace />;
  }
  
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/builder" element={<Builder />} />
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route path="/admin" element={<Admin />} />
    </Routes>
  );
}

function App() {
  return (
    <div className="App">
      <AuthProvider>
        <BrowserRouter>
          <AppRouter />
        </BrowserRouter>
        <Toaster position="bottom-right" richColors />
      </AuthProvider>
    </div>
  );
}

export default App;
