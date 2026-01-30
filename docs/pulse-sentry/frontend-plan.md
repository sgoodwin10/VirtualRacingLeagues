# Laravel Pulse & Sentry.io - Frontend Implementation Plan

## Document Overview

This document provides step-by-step instructions for implementing Sentry.io error tracking and performance monitoring in all three Vue 3 SPAs (public site, user dashboard, admin dashboard). Each section includes detailed code examples, configuration options, and validation steps.

**Estimated Total Time:** 2-3 days (12-18 hours)

**Important:** This codebase has **three separate Vue 3 SPAs**:
- **Public Site**: `resources/public/js/` (unauthenticated users)
- **App Dashboard**: `resources/app/js/` (authenticated users)
- **Admin Dashboard**: `resources/admin/js/` (administrators)

Each SPA has its own `app.ts` entry point and must be configured separately.

## Table of Contents

1. [Sentry Vue SDK Installation](#1-sentry-vue-sdk-installation)
2. [Source Maps Configuration](#2-source-maps-configuration)
3. [User Context Integration](#3-user-context-integration)
4. [Performance Monitoring](#4-performance-monitoring)
5. [Environment-Specific Configuration](#5-environment-specific-configuration)
6. [Testing & Validation](#6-testing--validation)

---

## 1. Sentry Vue SDK Installation

**Estimated Time:** 1-2 hours (30-40 minutes per SPA)

### Step 1.1: Install Required Packages

```bash
cd /var/www
npm install --save @sentry/vue @sentry/vite-plugin
```

**Packages Installed:**
- `@sentry/vue` (v9.x) - Sentry SDK for Vue 3
- `@sentry/vite-plugin` - Vite plugin for source map uploads

### Step 1.2: Configure Sentry for Public SPA

**File: `/var/www/resources/public/js/sentry.ts`** (create new file)

```typescript
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
        tracePropagationTargets: [
          'localhost',
          /^https:\/\/api\.virtualracingleagues\.com/,
          /^https:\/\/virtualracingleagues\.com/,
        ],
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
        sessionSampleRate: 0.0,
        errorSampleRate: 0.1,
      }),
    ],

    // Performance monitoring
    tracesSampleRate: import.meta.env.PROD ? 0.1 : 1.0,

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
    ],

    beforeSend(event, hint) {
      if (import.meta.env.DEV && !import.meta.env.VITE_SENTRY_DEBUG) {
        console.log('[Sentry] Event captured (not sent in dev):', event);
        return null;
      }

      if (event.request) {
        delete event.request.cookies;
      }

      return event;
    },

    beforeBreadcrumb(breadcrumb, hint) {
      if (import.meta.env.PROD && breadcrumb.category === 'console') {
        return null;
      }
      return breadcrumb;
    },

    debug: import.meta.env.DEV,
  });
}
```

**Update `/var/www/resources/public/js/app.ts`:**

```typescript
import { createApp } from 'vue';
import { createPinia } from 'pinia';
import PrimeVue from 'primevue/config';
import Aura from '@primevue/themes/aura';
import ToastService from 'primevue/toastservice';
import ConfirmationService from 'primevue/confirmationservice';
import router from './router';
import App from './App.vue';
import { initSentry } from './sentry';

import '../css/app.css';

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
app.use(router);
app.use(PrimeVue, {
  theme: {
    preset: Aura,
  },
});
app.use(ToastService);
app.use(ConfirmationService);

// Initialize Sentry
initSentry(app, router);

app.mount('#app');
```

### Step 1.3: Configure Sentry for App Dashboard

**File: `/var/www/resources/app/js/sentry.ts`** (create new file)

```typescript
import * as Sentry from '@sentry/vue';
import type { App } from 'vue';
import type { Router } from 'vue-router';
import { useAuthStore } from '@app/stores/auth';

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
        tracePropagationTargets: [
          'localhost',
          /^https:\/\/app\.virtualracingleagues\.com/,
        ],
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
        sessionSampleRate: 0.0,
        errorSampleRate: 0.2,
      }),
    ],

    tracesSampleRate: import.meta.env.PROD ? 0.2 : 1.0,
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
    ],

    beforeSend(event, hint) {
      if (import.meta.env.DEV && !import.meta.env.VITE_SENTRY_DEBUG) {
        console.log('[Sentry] Event captured (not sent in dev):', event);
        return null;
      }

      if (event.request) {
        delete event.request.cookies;
      }

      return event;
    },

    debug: import.meta.env.DEV,
  });

  // Set user context after authentication
  router.afterEach(() => {
    const authStore = useAuthStore();
    if (authStore.isAuthenticated && authStore.user) {
      Sentry.setUser({
        id: authStore.user.id.toString(),
        email: authStore.user.email,
        username: authStore.user.name,
        segment: 'user',
      });
    } else {
      Sentry.setUser(null);
    }
  });
}
```

**Update `/var/www/resources/app/js/app.ts`:**

```typescript
import { createApp } from 'vue';
import { createPinia } from 'pinia';
import PrimeVue from 'primevue/config';
import Aura from '@primevue/themes/aura';
import ToastService from 'primevue/toastservice';
import ConfirmationService from 'primevue/confirmationservice';
import router from './router';
import App from './App.vue';
import { initSentry } from './sentry';

import '../css/app.css';

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
app.use(router);
app.use(PrimeVue, {
  theme: {
    preset: Aura,
  },
});
app.use(ToastService);
app.use(ConfirmationService);

// Initialize Sentry
initSentry(app, router);

app.mount('#app');
```

### Step 1.4: Configure Sentry for Admin Dashboard

**File: `/var/www/resources/admin/js/sentry.ts`** (create new file)

```typescript
import * as Sentry from '@sentry/vue';
import type { App } from 'vue';
import type { Router } from 'vue-router';
import { useAuthStore } from '@admin/stores/auth';

/**
 * Initialize Sentry for Admin Dashboard
 */
export function initSentry(app: App, router: Router): void {
  const dsn = import.meta.env.VITE_SENTRY_DSN_ADMIN;

  if (!dsn) {
    console.warn('[Sentry] DSN not configured for Admin Dashboard');
    return;
  }

  Sentry.init({
    app,
    dsn,

    environment: import.meta.env.MODE,
    release: `vrl-admin@${import.meta.env.VITE_APP_VERSION || '1.0.0'}`,

    integrations: [
      Sentry.browserTracingIntegration({
        router,
        tracePropagationTargets: [
          'localhost',
          /^https:\/\/admin\.virtualracingleagues\.com/,
        ],
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
        sessionSampleRate: 0.0,
        errorSampleRate: 0.3,
      }),
    ],

    tracesSampleRate: import.meta.env.PROD ? 0.3 : 1.0,
    sampleRate: 1.0,
    maxBreadcrumbs: 100,
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
    ],

    beforeSend(event, hint) {
      if (import.meta.env.DEV && !import.meta.env.VITE_SENTRY_DEBUG) {
        console.log('[Sentry] Event captured (not sent in dev):', event);
        return null;
      }

      if (event.request) {
        delete event.request.cookies;
      }

      return event;
    },

    debug: import.meta.env.DEV,
  });

  // Set admin user context
  router.afterEach(() => {
    const authStore = useAuthStore();
    if (authStore.isAuthenticated && authStore.admin) {
      Sentry.setUser({
        id: authStore.admin.id.toString(),
        email: authStore.admin.email,
        username: authStore.admin.name,
        segment: 'admin',
      });

      Sentry.setTag('user_type', 'admin');
      Sentry.setTag('admin_role', 'administrator');
    } else {
      Sentry.setUser(null);
    }
  });
}
```

**Update `/var/www/resources/admin/js/app.ts`:**

```typescript
import { createApp } from 'vue';
import { createPinia } from 'pinia';
import PrimeVue from 'primevue/config';
import Aura from '@primevue/themes/aura';
import ToastService from 'primevue/toastservice';
import ConfirmationService from 'primevue/confirmationservice';
import router from './router';
import App from './App.vue';
import { initSentry } from './sentry';

import '../css/app.css';

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
app.use(router);
app.use(PrimeVue, {
  theme: {
    preset: Aura,
  },
});
app.use(ToastService);
app.use(ConfirmationService);

// Initialize Sentry
initSentry(app, router);

app.mount('#app');
```

---

## 2. Source Maps Configuration

**Estimated Time:** 1-2 hours

### Step 2.1: Update Vite Configuration

**File: `/var/www/vite.config.ts`** (update existing file)

```typescript
import { defineConfig, loadEnv } from 'vite';
import vue from '@vitejs/plugin-vue';
import laravel from 'laravel-vite-plugin';
import { sentryVitePlugin } from '@sentry/vite-plugin';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  const shouldUploadSourceMaps =
    mode === 'production' &&
    env.VITE_SENTRY_AUTH_TOKEN &&
    env.VITE_SENTRY_ORG &&
    env.VITE_SENTRY_PROJECT;

  return {
    plugins: [
      laravel({
        input: [
          'resources/public/css/app.css',
          'resources/public/js/app.ts',
          'resources/app/css/app.css',
          'resources/app/js/app.ts',
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

      // Sentry Vite plugin for source map uploads
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
          debug: mode === 'development',
        }),
    ].filter(Boolean),

    resolve: {
      alias: {
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
            'vendor-primevue': ['primevue'],
            'vendor-sentry': ['@sentry/vue'],
          },
        },
      },
    },

    server: {
      hmr: {
        host: 'localhost',
      },
    },
  };
});
```

### Step 2.2: Add Environment Variables

**Add to `.env`:**

```env
# App Version
VITE_APP_VERSION=1.0.0

# Sentry DSNs (Frontend)
VITE_SENTRY_DSN_PUBLIC=https://publicKey@o0.ingest.sentry.io/projectId1
VITE_SENTRY_DSN_APP=https://appKey@o0.ingest.sentry.io/projectId2
VITE_SENTRY_DSN_ADMIN=https://adminKey@o0.ingest.sentry.io/projectId3

# Sentry Source Maps Upload
VITE_SENTRY_ORG=your-org-slug
VITE_SENTRY_PROJECT=vrl-frontend
VITE_SENTRY_AUTH_TOKEN=your_auth_token_here

# Sentry Debug
VITE_SENTRY_DEBUG=false
```

### Step 2.3: Update .gitignore

```gitignore
# Source maps
public/build/**/*.map
```

### Step 2.4: Test Source Map Upload

```bash
npm run build
```

**Verify in Sentry Dashboard:**
1. Go to Project Settings → Source Maps
2. Verify release exists
3. Check that source maps are uploaded

---

## 3. User Context Integration

**Estimated Time:** 1 hour

### Step 3.1: Create User Context Utilities

**File: `/var/www/resources/app/js/utils/sentry.ts`** (create new file)

```typescript
import * as Sentry from '@sentry/vue';

export function setSentryUser(user: {
  id: number;
  name: string;
  email: string;
}): void {
  Sentry.setUser({
    id: user.id.toString(),
    email: user.email,
    username: user.name,
    segment: 'user',
  });
  Sentry.setTag('user_type', 'user');
}

export function clearSentryUser(): void {
  Sentry.setUser(null);
}

export function setSentryContext(key: string, value: Record<string, any>): void {
  Sentry.setContext(key, value);
}

export function addSentryBreadcrumb(
  category: string,
  message: string,
  data?: Record<string, any>,
  level: 'debug' | 'info' | 'warning' | 'error' | 'fatal' = 'info'
): void {
  Sentry.addBreadcrumb({
    category,
    message,
    data,
    level,
    timestamp: Date.now() / 1000,
  });
}

export function captureSentryException(
  error: Error,
  context?: Record<string, any>
): string {
  if (context) {
    return Sentry.captureException(error, {
      extra: context,
    });
  }
  return Sentry.captureException(error);
}

export function captureSentryMessage(
  message: string,
  level: 'debug' | 'info' | 'warning' | 'error' | 'fatal' = 'info',
  context?: Record<string, any>
): string {
  return Sentry.captureMessage(message, {
    level,
    extra: context,
  });
}
```

**File: `/var/www/resources/admin/js/utils/sentry.ts`** (similar for admin)

```typescript
import * as Sentry from '@sentry/vue';

export function setSentryAdmin(admin: {
  id: number;
  name: string;
  email: string;
}): void {
  Sentry.setUser({
    id: admin.id.toString(),
    email: admin.email,
    username: admin.name,
    segment: 'admin',
  });
  Sentry.setTag('user_type', 'admin');
  Sentry.setTag('admin_role', 'administrator');
}

export function clearSentryUser(): void {
  Sentry.setUser(null);
}

export function addSentryBreadcrumb(
  category: string,
  message: string,
  data?: Record<string, any>,
  level: 'debug' | 'info' | 'warning' | 'error' | 'fatal' = 'info'
): void {
  Sentry.addBreadcrumb({
    category,
    message,
    data,
    level,
    timestamp: Date.now() / 1000,
  });
}

export function captureSentryException(
  error: Error,
  context?: Record<string, any>
): string {
  if (context) {
    return Sentry.captureException(error, {
      extra: context,
    });
  }
  return Sentry.captureException(error);
}
```

### Step 3.2: Add Breadcrumbs for API Requests

**Update `/var/www/resources/app/js/plugins/axios.ts`:**

```typescript
import axios from 'axios';
import { addSentryBreadcrumb } from '@app/utils/sentry';

const api = axios.create({
  baseURL: import.meta.env.VITE_APP_URL,
  withCredentials: true,
});

api.interceptors.request.use(
  (config) => {
    addSentryBreadcrumb(
      'http.request',
      `${config.method?.toUpperCase()} ${config.url}`,
      {
        url: config.url,
        method: config.method,
      }
    );
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => {
    addSentryBreadcrumb(
      'http.response',
      `${response.config.method?.toUpperCase()} ${response.config.url} - ${response.status}`,
      {
        url: response.config.url,
        status: response.status,
      }
    );
    return response;
  },
  (error) => {
    if (error.response) {
      addSentryBreadcrumb(
        'http.error',
        `${error.config.method?.toUpperCase()} ${error.config.url} - ${error.response.status}`,
        {
          url: error.config.url,
          status: error.response.status,
        },
        'error'
      );
    }
    return Promise.reject(error);
  }
);

export default api;
```

---

## 4. Performance Monitoring

**Estimated Time:** 1-2 hours

### Step 4.1: Custom Transaction Tracking

**File: `/var/www/resources/app/js/utils/performance.ts`** (create new file)

```typescript
import * as Sentry from '@sentry/vue';

export function startTransaction(
  name: string,
  op: string = 'custom'
): ReturnType<typeof Sentry.startInactiveSpan> {
  return Sentry.startInactiveSpan({
    name,
    op,
  });
}

export async function measurePerformance<T>(
  name: string,
  fn: () => Promise<T>,
  op: string = 'function'
): Promise<T> {
  return Sentry.startSpan(
    {
      name,
      op,
    },
    async () => {
      return await fn();
    }
  );
}

export function addSpan<T>(
  description: string,
  fn: () => T,
  op: string = 'function'
): T {
  return Sentry.startSpan(
    {
      name: description,
      op,
    },
    () => {
      return fn();
    }
  );
}
```

### Step 4.2: Component Render Tracking

Already configured via `vueIntegration`:

```typescript
Sentry.vueIntegration({
  tracingOptions: {
    trackComponents: true,
    timeout: 2000,
    hooks: ['mount', 'update'],
  },
})
```

### Step 4.3: Route Change Tracking

Already configured via `browserTracingIntegration`:

```typescript
Sentry.browserTracingIntegration({
  router,
})
```

---

## 5. Environment-Specific Configuration

### Development Configuration

```env
VITE_APP_VERSION=1.0.0-dev
VITE_SENTRY_DSN_PUBLIC=https://devPublicKey@o0.ingest.sentry.io/1
VITE_SENTRY_DSN_APP=https://devAppKey@o0.ingest.sentry.io/2
VITE_SENTRY_DSN_ADMIN=https://devAdminKey@o0.ingest.sentry.io/3
VITE_SENTRY_DEBUG=true
```

**Sampling rates in development:**
- `tracesSampleRate: 1.0` (100%)
- `errorSampleRate: 1.0` (100%)
- Events logged to console but not sent

### Production Configuration

```env
VITE_APP_VERSION=1.2.3
VITE_SENTRY_DSN_PUBLIC=https://prodPublicKey@o0.ingest.sentry.io/1
VITE_SENTRY_DSN_APP=https://prodAppKey@o0.ingest.sentry.io/2
VITE_SENTRY_DSN_ADMIN=https://prodAdminKey@o0.ingest.sentry.io/3
VITE_SENTRY_ORG=your-org
VITE_SENTRY_PROJECT=vrl-frontend
VITE_SENTRY_AUTH_TOKEN=production_token
VITE_SENTRY_DEBUG=false
```

**Sampling rates in production:**
- Public: `tracesSampleRate: 0.1` (10%)
- App: `tracesSampleRate: 0.2` (20%)
- Admin: `tracesSampleRate: 0.3` (30%)

---

## 6. Testing & Validation

**Estimated Time:** 2-3 hours

### Step 6.1: Manual Testing Checklist

#### Test Error Capture

1. **Trigger uncaught error** and verify in Sentry:
   - [ ] Stack trace visible
   - [ ] Source maps working
   - [ ] User context attached
   - [ ] Breadcrumbs present

2. **Trigger caught error** with custom context

#### Test Performance Monitoring

1. **Navigate between routes** and verify:
   - [ ] Transactions appear
   - [ ] Duration captured
   - [ ] Component spans visible

#### Test User Context

1. **Login/logout** and verify user context changes

#### Test Source Maps

1. **Build and deploy**
2. **Trigger production error**
3. **Verify stack trace shows actual source**

### Step 6.2: Automated Tests

**File: `/var/www/resources/app/js/tests/sentry.test.ts`:**

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as Sentry from '@sentry/vue';
import {
  setSentryUser,
  clearSentryUser,
  addSentryBreadcrumb,
  captureSentryException,
} from '@app/utils/sentry';

vi.mock('@sentry/vue', () => ({
  setUser: vi.fn(),
  setTag: vi.fn(),
  addBreadcrumb: vi.fn(),
  captureException: vi.fn(),
}));

describe('Sentry Utils', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should set user context', () => {
    setSentryUser({ id: 1, name: 'Test', email: 'test@example.com' });
    expect(Sentry.setUser).toHaveBeenCalled();
  });

  it('should clear user context', () => {
    clearSentryUser();
    expect(Sentry.setUser).toHaveBeenCalledWith(null);
  });

  it('should add breadcrumb', () => {
    addSentryBreadcrumb('test', 'Test message');
    expect(Sentry.addBreadcrumb).toHaveBeenCalled();
  });

  it('should capture exception', () => {
    const error = new Error('Test');
    captureSentryException(error);
    expect(Sentry.captureException).toHaveBeenCalledWith(error);
  });
});
```

**Run tests:**

```bash
npm run test:app
```

---

## Production Readiness Checklist

### Before Deployment

- [ ] Remove test routes and components
- [ ] Set production DSNs
- [ ] Configure auth token for source maps
- [ ] Set appropriate sampling rates
- [ ] Test source map upload

### After Deployment

- [ ] Verify errors appear in Sentry
- [ ] Verify source maps work
- [ ] Verify user context attached
- [ ] Test alert notifications
- [ ] Monitor performance overhead

---

## Next Steps

1. Complete backend integration (see [backend-plan.md](./backend-plan.md))
2. Configure Sentry alert rules
3. Set up notification channels (Slack, Discord)
4. Create team workflows for error triage
5. Train team on Sentry dashboard

---

## Resources

- [Sentry Vue Integration](https://docs.sentry.io/platforms/javascript/guides/vue/)
- [Sentry JavaScript SDK](https://docs.sentry.io/platforms/javascript/)
- [Sentry Vite Plugin](https://github.com/getsentry/sentry-javascript/tree/develop/packages/vite-plugin)
- [Sentry Performance Monitoring](https://docs.sentry.io/product/performance/)
- [Sentry Source Maps](https://docs.sentry.io/platforms/javascript/sourcemaps/)

---

**Document Version:** 1.0
**Last Updated:** 2026-01-30
**Status:** Ready for Implementation
