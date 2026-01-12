import React from "react";
import ReactDOM from "react-dom/client";
import "@/index.css";
import App from "@/App";

// Suppress ResizeObserver loop error - it's a benign browser warning
// that occurs when ResizeObserver can't deliver all notifications in one frame
// This commonly happens with chart libraries like recharts during rapid updates

// Patch ResizeObserver to prevent the error from being thrown
const OriginalResizeObserver = window.ResizeObserver;
window.ResizeObserver = class ResizeObserver extends OriginalResizeObserver {
  constructor(callback) {
    super((entries, observer) => {
      // Use requestAnimationFrame to batch notifications and prevent the loop error
      window.requestAnimationFrame(() => {
        callback(entries, observer);
      });
    });
  }
};

// Handle at window.onerror level (fallback)
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

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
