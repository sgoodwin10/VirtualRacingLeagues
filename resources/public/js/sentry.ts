import * as Sentry from '@sentry/vue';
import type { App } from 'vue';
import type { Router } from 'vue-router';

/**
 * Initialize Sentry for Public SPA
 */
export function initSentry(app: App, router: Router): void {
  const dsn = import.meta.env.VITE_SENTRY_DSN_PUBLIC;

  if (!dsn) {
    console.warn('[Sentry] DSN not configured for Public SPA');
    return;
  }

  Sentry.init({
    app,
    dsn,

    // Environment and release tracking
    environment: import.meta.env.MODE,
    release: `vrl-public@${import.meta.env.VITE_APP_VERSION || '1.0.0'}`,

    // Integrations
    integrations: [
      Sentry.browserTracingIntegration({
        router,
      }),

      Sentry.vueIntegration({
        tracingOptions: {
          trackComponents: true,
          timeout: 2000,
          hooks: ['mount', 'update'],
        },
      }),

      Sentry.replayIntegration({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],

    // Performance monitoring
    tracesSampleRate: import.meta.env.PROD ? 0.1 : 1.0,

    // Replay (only on errors in production)
    replaysSessionSampleRate: 0.0,
    replaysOnErrorSampleRate: import.meta.env.PROD ? 0.1 : 0.0,

    // Error sampling
    sampleRate: 1.0,
    maxBreadcrumbs: 50,
    attachStacktrace: true,
    sendDefaultPii: false,

    // Ignore specific errors
    ignoreErrors: [
      'top.GLOBALS',
      'chrome-extension://',
      'moz-extension://',
      'Network request failed',
      'Failed to fetch',
      'Request aborted',
      'AbortError',
      'ResizeObserver loop',
    ],

    beforeSend(event) {
      // Don't send events in development unless debug mode
      if (import.meta.env.DEV && !import.meta.env.VITE_SENTRY_DEBUG) {
        console.log('[Sentry] Event captured (not sent in dev):', event);
        return null;
      }

      // Remove cookies from request data
      if (event.request) {
        delete event.request.cookies;
      }

      return event;
    },

    beforeBreadcrumb(breadcrumb) {
      // Filter out console breadcrumbs in production
      if (import.meta.env.PROD && breadcrumb.category === 'console') {
        return null;
      }
      return breadcrumb;
    },

    debug: import.meta.env.VITE_SENTRY_DEBUG === 'true',
  });
}
