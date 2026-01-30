import * as Sentry from '@sentry/vue';
import type { App } from 'vue';
import type { Router } from 'vue-router';

/**
 * Initialize Sentry for App Dashboard
 */
export function initSentry(app: App, router: Router): void {
  const dsn = import.meta.env.VITE_SENTRY_DSN_APP;

  if (!dsn) {
    console.warn('[Sentry] DSN not configured for App Dashboard');
    return;
  }

  Sentry.init({
    app,
    dsn,

    environment: import.meta.env.MODE,
    release: `vrl-app@${import.meta.env.VITE_APP_VERSION || '1.0.0'}`,

    integrations: [
      Sentry.browserTracingIntegration({
        router,
        tracePropagationTargets: ['localhost', /^https:\/\/app\.virtualracingleagues\.com/],
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

    tracesSampleRate: import.meta.env.PROD ? 0.2 : 1.0,
    replaysSessionSampleRate: 0.0,
    replaysOnErrorSampleRate: import.meta.env.PROD ? 0.2 : 0.0,

    sampleRate: 1.0,
    maxBreadcrumbs: 50,
    attachStacktrace: true,
    sendDefaultPii: false,

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
      if (import.meta.env.DEV && !import.meta.env.VITE_SENTRY_DEBUG) {
        console.log('[Sentry] Event captured (not sent in dev):', event);
        return null;
      }

      if (event.request) {
        delete event.request.cookies;
      }

      return event;
    },

    beforeBreadcrumb(breadcrumb) {
      if (import.meta.env.PROD && breadcrumb.category === 'console') {
        return null;
      }
      return breadcrumb;
    },

    debug: import.meta.env.VITE_SENTRY_DEBUG === 'true',
  });
}

/**
 * Set user context for Sentry
 */
export function setSentryUser(user: { id: number; name: string; email: string }): void {
  Sentry.setUser({
    id: user.id.toString(),
    email: user.email,
    username: user.name,
    segment: 'user',
  });
  Sentry.setTag('user_type', 'user');
}

/**
 * Clear user context from Sentry
 */
export function clearSentryUser(): void {
  Sentry.setUser(null);
}

/**
 * Add a breadcrumb to Sentry
 */
export function addSentryBreadcrumb(
  category: string,
  message: string,
  data?: Record<string, unknown>,
  level: 'debug' | 'info' | 'warning' | 'error' | 'fatal' = 'info',
): void {
  Sentry.addBreadcrumb({
    category,
    message,
    data,
    level,
    timestamp: Date.now() / 1000,
  });
}

/**
 * Capture an exception with optional context
 */
export function captureSentryException(error: Error, context?: Record<string, unknown>): string {
  if (context) {
    return Sentry.captureException(error, {
      extra: context,
    });
  }
  return Sentry.captureException(error);
}

/**
 * Capture a message with optional context
 */
export function captureSentryMessage(
  message: string,
  level: 'debug' | 'info' | 'warning' | 'error' | 'fatal' = 'info',
  context?: Record<string, unknown>,
): string {
  return Sentry.captureMessage(message, {
    level,
    extra: context,
  });
}
