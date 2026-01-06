import "@/App.css";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "./context/AuthContext";
import { AuthCallback } from "./components/AuthCallback";
import Builder from "./pages/Builder";

// Router wrapper to handle auth callback
function AppRouter() {
  const location = useLocation();
  
  // Check URL for Google OAuth code (comes as query param)
  const urlParams = new URLSearchParams(location.search);
  if (urlParams.get('code')) {
    return <AuthCallback />;
  }
  
  return (
    <Routes>
      <Route path="/" element={<Builder />} />
      <Route path="/auth/callback" element={<AuthCallback />} />
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
