import { defineConfig } from 'vite';

export default defineConfig({
  // Define process.env so it's accessible in the browser
  define: {
    'process.env': process.env
  },
  server: {
    host: true, // Bind to 0.0.0.0 for external access
    port: 5173,
    allowedHosts: ['wealthsense.onrender.com'],
    proxy: {
      '/api': {
        target: 'https://wealthsense.onrender.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
  build: {
    outDir: 'dist',
    target: 'esnext'
  }
});