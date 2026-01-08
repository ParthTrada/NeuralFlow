import React from "react";
import ReactDOM from "react-dom/client";
import "@/index.css";
import App from "@/App";

// Suppress ResizeObserver loop error - it's a benign browser warning
// that occurs when ResizeObserver can't deliver all notifications in one frame
const resizeObserverErr = window.onerror;
window.onerror = (message, ...args) => {
  if (message && message.includes('ResizeObserver loop')) {
    return true; // Suppress the error
  }
  if (resizeObserverErr) {
    return resizeObserverErr(message, ...args);
  }
};

// Also handle it for React error overlay
window.addEventListener('error', (e) => {
  if (e.message && e.message.includes('ResizeObserver loop')) {
    e.stopPropagation();
    e.stopImmediatePropagation();
  }
});

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
