import { defineConfig } from 'vite';

export default defineConfig({
  server: {
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
