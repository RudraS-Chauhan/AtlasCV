import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Safe polyfill for process.env
// This ensures that accessing process.env.API_KEY doesn't crash the app if process is undefined
if (typeof window !== 'undefined') {
  if (typeof (window as any).process === 'undefined') {
    (window as any).process = { env: {} };
  } else if (typeof (window as any).process.env === 'undefined') {
    (window as any).process.env = {};
  }
  
  // Map Vite environment variables if needed, but avoid warnings for platform-managed keys
  if (import.meta && import.meta.env) {
    // @ts-ignore
    (window as any).process.env.VITE_RAZORPAY_KEY_ID = import.meta.env.VITE_RAZORPAY_KEY_ID;
  }
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);