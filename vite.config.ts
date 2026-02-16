import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    // Increase chunk size limit to suppress warning for large libraries like jsPDF
    chunkSizeWarningLimit: 1600, 
    rollupOptions: {
      output: {
        manualChunks: {
          // Split vendor code into separate chunks for better caching
          vendor: ['react', 'react-dom'],
          pdf: ['jspdf'],
          ai: ['@google/genai'],
        },
      },
    },
  },
});