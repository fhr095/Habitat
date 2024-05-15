import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/talkwithifc': {
        target: 'https://roko.flowfuse.cloud',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/talkwithifc/, '')
      }
    }
  },
  build: {
    chunkSizeWarningLimit: 1000, // Aumenta o limite de tamanho do chunk para 1000 kB
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom']  // Separa React e ReactDOM em um chunk próprio
        }
      }
    }
  }
});
