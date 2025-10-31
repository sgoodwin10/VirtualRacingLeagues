import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import vue from '@vitejs/plugin-vue';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath } from 'url';

export default defineConfig({
  plugins: [
    laravel({
      input: [
        // Public Site
        'resources/public/css/app.css',
        'resources/public/js/app.ts',
        // User Dashboard
        'resources/app/css/app.css',
        'resources/app/js/app.ts',
        // Admin Dashboard
        'resources/admin/css/app.css',
        'resources/admin/js/app.ts',
      ],
      refresh: true,
    }),
    vue({
      template: {
        transformAssetUrls: {
          base: null,
          includeAbsolute: false,
        },
      },
    }),
    tailwindcss(),
  ],
  base: '/build/',
  resolve: {
    alias: {
      vue: 'vue/dist/vue.esm-bundler.js',
      '@public': fileURLToPath(new URL('./resources/public/js', import.meta.url)),
      '@app': fileURLToPath(new URL('./resources/app/js', import.meta.url)),
      '@admin': fileURLToPath(new URL('./resources/admin/js', import.meta.url)),
    },
  },
  server: {
    watch: {
      usePolling: true,
      interval: 5000,
      binaryInterval: 5000,
    },
    host: true, // true needed for the Docker Container port mapping to work
    strictPort: true,
    cors: true, // Enable CORS for all subdomains
    hmr: {
      host: 'localhost',
      protocol: 'ws',
      clientPort: 5173,
    },
    // https: true,
    port: 5173, // replace this port with any number you want
  },
});
