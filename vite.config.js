import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  
  // Production optimizations - SIMPLIFIED για rolldown-vite
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'esbuild',
    target: 'esnext',
    // Removed manualChunks - not supported by rolldown-vite
    rollupOptions: {
      output: {
        // Simple chunk strategy
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      }
    }
  },

  // Preview server config
  preview: {
    port: 4173,
    strictPort: true,
  },

  // Dev server config
  server: {
    port: 5173,
    strictPort: true,
    host: true,
  },
});