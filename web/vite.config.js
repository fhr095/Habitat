import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteStaticCopy } from 'vite-plugin-static-copy';

export default defineConfig({
  plugins: [
    react(),
    viteStaticCopy({
      targets: [
        {
          src: 'node_modules/@ricky0123/vad-web/dist/vad.worklet.bundle.min.js',
          dest: './'  // Copia para a raiz do build
        },
        {
          src: 'node_modules/@ricky0123/vad-web/dist/silero_vad.onnx',
          dest: './'
        },
        {
          src: 'node_modules/onnxruntime-web/dist/*.wasm',
          dest: './'
        }
      ]
    })
  ],
  build: {
    chunkSizeWarningLimit: 1000,  // Aumenta o limite de chunk para evitar warnings
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom']  // Separa pacotes 'vendor' como react e react-dom
        }
      }
    }
  }
});
