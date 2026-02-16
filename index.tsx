import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Safe polyfill for process.env
// This ensures that accessing process.env.API_KEY doesn't crash the app if process is undefined
// AND bridges the gap between Vite's import.meta.env and the SDK's process.env expectation
if (typeof window !== 'undefined') {
  if (typeof (window as any).process === 'undefined') {
    (window as any).process = { env: {} };
  } else if (typeof (window as any).process.env === 'undefined') {
    (window as any).process.env = {};
  }

  // CRITICAL FIX: Map Vite environment variables to process.env
  // @ts-ignore
  if (import.meta && import.meta.env) {
    // @ts-ignore
    const apiKey = import.meta.env.VITE_API_KEY;
    if (apiKey) {
        // @ts-ignore
        (window as any).process.env.API_KEY = apiKey;
        console.log("✅ VITE_API_KEY detected and mapped to process.env.API_KEY");
    } else {
        console.warn("⚠️ VITE_API_KEY is not defined in import.meta.env. Check your .env file or Vercel Settings.");
    }
    
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