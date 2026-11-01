import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'node:path';

export default defineConfig({
  base: '/assets/',
  plugins: [vue()],
  build: {
    outDir: 'dist/assets', emptyOutDir: false, manifest: true,
    rollupOptions: { input: resolve(import.meta.dirname, 'web/main.ts'),
      output: { entryFileNames: 'app.js', chunkFileNames: 'chunks/[name]-[hash].js', assetFileNames: '[name]-[hash][extname]' } }
  }
});
