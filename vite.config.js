
import { defineConfig } from 'vite';

export default defineConfig({
  // Define process.env as an empty object string to prevent "missing name after ." errors
  // in cases where the environment might not be fully populated during pre-bundling.
  define: {
    'process.env': '({})'
  },
  server: {
    host: true,
    port: 5173,
    allowedHosts: ['wealthsense.onrender.com'],
  },
  build: {
    outDir: 'dist',
    target: 'esnext'
  }
});
