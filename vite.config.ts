import { defineConfig, loadEnv } from 'vite';
import laravel from 'laravel-vite-plugin';
import vue from '@vitejs/plugin-vue';
import tailwindcss from '@tailwindcss/vite';
import { sentryVitePlugin } from '@sentry/vite-plugin';
import { fileURLToPath } from 'url';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  // Only upload source maps in production with valid credentials
  const shouldUploadSourceMaps =
    mode === 'production' &&
    env.VITE_SENTRY_AUTH_TOKEN &&
    env.VITE_SENTRY_ORG &&
    env.VITE_SENTRY_PROJECT;

  return {
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

      // Sentry Vite plugin for source map uploads (production only)
      shouldUploadSourceMaps &&
        sentryVitePlugin({
          org: env.VITE_SENTRY_ORG,
          project: env.VITE_SENTRY_PROJECT,
          authToken: env.VITE_SENTRY_AUTH_TOKEN,

          sourcemaps: {
            assets: ['./public/build/assets/**'],
            ignore: ['node_modules'],
            filesToDeleteAfterUpload: ['./public/build/assets/**/*.map'],
          },

          release: {
            name: env.VITE_APP_VERSION || '1.0.0',
            cleanArtifacts: true,
            setCommits: {
              auto: true,
            },
          },

          telemetry: false,
          debug: false,
        }),
    ].filter(Boolean),
    base: '/build/',
    resolve: {
      alias: {
        vue: 'vue/dist/vue.esm-bundler.js',
        '@public': fileURLToPath(new URL('./resources/public/js', import.meta.url)),
        '@app': fileURLToPath(new URL('./resources/app/js', import.meta.url)),
        '@admin': fileURLToPath(new URL('./resources/admin/js', import.meta.url)),
      },
    },
    build: {
      sourcemap: mode === 'production' ? 'hidden' : true,
      rollupOptions: {
        output: {
          manualChunks: {
            'vendor-vue': ['vue', 'vue-router', 'pinia'],
            'vendor-sentry': ['@sentry/vue'],
          },
        },
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
        clientPort: 5174,
      },
      // https: true,
      port: 5173, // replace this port with any number you want
    },
  };
});
