import React from "react";
import ReactDOM from "react-dom/client";
import "@/index.css";
import App from "@/App";

// Suppress ResizeObserver loop error - it's a benign browser warning
// that occurs when ResizeObserver can't deliver all notifications in one frame
// This commonly happens with chart libraries like recharts during rapid updates

// Handle at window.onerror level
const originalOnError = window.onerror;
window.onerror = (message, source, lineno, colno, error) => {
  if (message && typeof message === 'string' && message.includes('ResizeObserver')) {
    return true; // Suppress the error
  }
  if (originalOnError) {
    return originalOnError(message, source, lineno, colno, error);
  }
  return false;
};

// Handle at event listener level (catches more cases)
window.addEventListener('error', (e) => {
  if (e.message && e.message.includes('ResizeObserver')) {
    e.stopPropagation();
    e.stopImmediatePropagation();
    e.preventDefault();
    return true;
  }
}, true); // Use capture phase to catch it early

// Handle unhandled promise rejections that might contain ResizeObserver errors
window.addEventListener('unhandledrejection', (e) => {
  if (e.reason && e.reason.message && e.reason.message.includes('ResizeObserver')) {
    e.preventDefault();
    e.stopPropagation();
    return true;
  }
});

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
