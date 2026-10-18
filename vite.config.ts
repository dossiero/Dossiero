import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  // Electron loads the production UI through file://, so packaged assets must
  // resolve beside index.html instead of from the filesystem root.
  base: './',
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src/renderer'),
      '@shared': path.resolve(__dirname, 'src/shared'),
    },
  },
  server: { port: 5173, strictPort: true },
  build: { outDir: 'dist' }
});
