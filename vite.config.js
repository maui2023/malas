import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/malas/', // GitHub Pages repository base path
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
});
