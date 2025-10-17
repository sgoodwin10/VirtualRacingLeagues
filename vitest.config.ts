import { defineConfig } from 'vitest/config';
import vue from '@vitejs/plugin-vue';
import { fileURLToPath } from 'url';

export default defineConfig({
  plugins: [vue()],
  test: {
    globals: true,
    environment: 'jsdom',
    exclude: [
      'tests/Browser/**',
      'node_modules/**',
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['resources/public/js/**', 'resources/user/js/**', 'resources/admin/js/**'],
    },
  },
  resolve: {
    alias: {
      '@public': fileURLToPath(new URL('./resources/public/js', import.meta.url)),
      '@user': fileURLToPath(new URL('./resources/user/js', import.meta.url)),
      '@admin': fileURLToPath(new URL('./resources/admin/js', import.meta.url)),
      vue: 'vue/dist/vue.esm-bundler.js',
    },
  },
});
