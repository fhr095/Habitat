import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/', // Set the base path, it's important for deployment on subdirectories
  build: {
    outDir: 'dist', // Specify the output directory (default is 'dist')
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'), // Your main HTML entry point
      },
      // Additional configuration here if necessary
    }
  },
  resolve: {
    alias: {
      // Resolve paths to avoid relative path confusion, optional
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000, // Default development port; change as necessary
  }
});