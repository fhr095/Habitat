import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteStaticCopy } from 'vite-plugin-static-copy';
import { VitePWA } from 'vite-plugin-pwa';



export default defineConfig({
  server: {
    host: true, // Permite acesso externo
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Seu Nome de Aplicação',
        short_name: 'Nome Curto',
        description: 'Descrição da sua aplicação',
        theme_color: '#ffffff',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        maximumFileSizeToCacheInBytes: 25 * 1024 * 1024, // Limite para 25 MB
      },
    }),
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
    chunkSizeWarningLimit: 1500,  // Aumenta o limite de chunk para evitar warnings
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom']  // Separa pacotes 'vendor' como react e react-dom
        }
      }
    },
  }
});
