import { defineConfig } from 'vitest/config';
import vue from '@vitejs/plugin-vue';
import { fileURLToPath } from 'url';

export default defineConfig({
  plugins: [vue()],
  test: {
    globals: true,
    environment: 'happy-dom',

    // Test file patterns
    include: ['**/*.{test,spec}.{js,ts,jsx,tsx}'],
    exclude: [
      'tests/Browser/**',
      'node_modules/**',
      'dist/**',
      '.{idea,git,cache,output,temp}/**',
      '{karma,rollup,webpack,vite,vitest,jest,ava,babel,nyc,cypress,tsup,build}.config.*',
    ],

    // Setup files for global test configuration
    setupFiles: ['./tests/setup.ts'],

    // Mock handling
    clearMocks: true,
    mockReset: true,
    restoreMocks: true,

    // CSS and asset handling
    css: true,

    // Timeouts
    testTimeout: 10000,
    hookTimeout: 10000,

    // Watch mode configuration
    watch: false,

    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      include: [
        'resources/public/js/**/*.{js,ts,vue}',
        'resources/app/js/**/*.{js,ts,vue}',
        'resources/admin/js/**/*.{js,ts,vue}',
      ],
      exclude: [
        '**/*.{test,spec}.{js,ts}',
        '**/*.d.ts',
        '**/types/**',
        '**/app.ts',
        '**/router/**',
        'resources/**/js/bootstrap.ts',
      ],
      thresholds: {
        lines: 70,
        functions: 70,
        branches: 70,
        statements: 70,
      },
    },
  },
  resolve: {
    alias: {
      '@public': fileURLToPath(new URL('./resources/public/js', import.meta.url)),
      '@app': fileURLToPath(new URL('./resources/app/js', import.meta.url)),
      '@admin': fileURLToPath(new URL('./resources/admin/js', import.meta.url)),
      vue: 'vue/dist/vue.esm-bundler.js',
    },
  },
});
