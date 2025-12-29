
import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    host: true, // Bind to 0.0.0.0
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
});
