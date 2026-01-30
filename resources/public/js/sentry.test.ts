import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createApp } from 'vue';
import { createRouter, createMemoryHistory } from 'vue-router';
import * as Sentry from '@sentry/vue';
import { initSentry } from './sentry';

// Mock Sentry
vi.mock('@sentry/vue', () => ({
  init: vi.fn(),
  browserTracingIntegration: vi.fn(() => ({})),
  vueIntegration: vi.fn(() => ({})),
  replayIntegration: vi.fn(() => ({})),
}));

describe('Sentry Initialization', () => {
  let app: ReturnType<typeof createApp>;
  let router: ReturnType<typeof createRouter>;
  const originalEnv = { ...import.meta.env };

  beforeEach(() => {
    // Create test app and router
    app = createApp({ template: '<div>Test</div>' });
    router = createRouter({
      history: createMemoryHistory(),
      routes: [{ path: '/', component: { template: '<div>Home</div>' } }],
    });

    // Clear mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Restore environment
    Object.assign(import.meta.env, originalEnv);
  });

  it('should initialize Sentry when DSN is provided', () => {
    // Set environment variables
    import.meta.env.VITE_SENTRY_DSN_PUBLIC = 'https://test@sentry.io/123';
    import.meta.env.MODE = 'production';
    import.meta.env.VITE_APP_VERSION = '1.0.0';

    initSentry(app, router);

    expect(Sentry.init).toHaveBeenCalledWith(
      expect.objectContaining({
        app,
        dsn: 'https://test@sentry.io/123',
        environment: 'production',
        release: 'vrl-public@1.0.0',
      }),
    );
  });

  it('should warn and skip initialization when DSN is not provided', () => {
    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    // Delete the property to simulate it not being set
    delete (import.meta.env as any).VITE_SENTRY_DSN_PUBLIC;

    initSentry(app, router);

    expect(consoleWarnSpy).toHaveBeenCalledWith('[Sentry] DSN not configured for Public SPA');
    expect(Sentry.init).not.toHaveBeenCalled();

    consoleWarnSpy.mockRestore();
  });

  it('should configure correct integrations', () => {
    import.meta.env.VITE_SENTRY_DSN_PUBLIC = 'https://test@sentry.io/123';

    initSentry(app, router);

    const initCall = vi.mocked(Sentry.init).mock.calls[0]?.[0];
    expect(initCall).toBeDefined();
    expect(initCall?.integrations).toBeDefined();
    expect(initCall?.integrations).toHaveLength(3);

    expect(Sentry.browserTracingIntegration).toHaveBeenCalledWith(
      expect.objectContaining({
        router,
      }),
    );

    expect(Sentry.vueIntegration).toHaveBeenCalledWith(
      expect.objectContaining({
        tracingOptions: expect.objectContaining({
          trackComponents: true,
          timeout: 2000,
          hooks: ['mount', 'update'],
        }),
      }),
    );

    expect(Sentry.replayIntegration).toHaveBeenCalledWith(
      expect.objectContaining({
        maskAllText: true,
        blockAllMedia: true,
      }),
    );
  });

  it('should use higher trace sample rate in development', () => {
    import.meta.env.VITE_SENTRY_DSN_PUBLIC = 'https://test@sentry.io/123';
    import.meta.env.MODE = 'development';
    import.meta.env.PROD = false;

    initSentry(app, router);

    expect(Sentry.init).toHaveBeenCalledWith(
      expect.objectContaining({
        tracesSampleRate: 1.0,
      }),
    );
  });

  it('should use lower trace sample rate in production', () => {
    import.meta.env.VITE_SENTRY_DSN_PUBLIC = 'https://test@sentry.io/123';
    import.meta.env.MODE = 'production';
    import.meta.env.PROD = true;

    initSentry(app, router);

    expect(Sentry.init).toHaveBeenCalledWith(
      expect.objectContaining({
        tracesSampleRate: 0.1,
      }),
    );
  });

  it('should configure error filtering', () => {
    import.meta.env.VITE_SENTRY_DSN_PUBLIC = 'https://test@sentry.io/123';

    initSentry(app, router);

    const initCall = vi.mocked(Sentry.init).mock.calls[0]?.[0];
    expect(initCall).toBeDefined();
    expect(initCall?.ignoreErrors).toBeDefined();
    expect(initCall?.ignoreErrors).toContain('Network request failed');
    expect(initCall?.ignoreErrors).toContain('Failed to fetch');
    expect(initCall?.ignoreErrors).toContain('chrome-extension://');
  });

  it('should use default version when not provided', () => {
    import.meta.env.VITE_SENTRY_DSN_PUBLIC = 'https://test@sentry.io/123';
    // Delete the property to simulate it not being set
    delete (import.meta.env as any).VITE_APP_VERSION;

    initSentry(app, router);

    const initCall = vi.mocked(Sentry.init).mock.calls[0]?.[0];
    expect(initCall).toBeDefined();
    expect(initCall?.release).toBe('vrl-public@1.0.0');
  });

  it('should enable debug mode when VITE_SENTRY_DEBUG is true', () => {
    import.meta.env.VITE_SENTRY_DSN_PUBLIC = 'https://test@sentry.io/123';
    import.meta.env.VITE_SENTRY_DEBUG = 'true';

    initSentry(app, router);

    expect(Sentry.init).toHaveBeenCalledWith(
      expect.objectContaining({
        debug: true,
      }),
    );
  });

  it('should not send PII data', () => {
    import.meta.env.VITE_SENTRY_DSN_PUBLIC = 'https://test@sentry.io/123';

    initSentry(app, router);

    expect(Sentry.init).toHaveBeenCalledWith(
      expect.objectContaining({
        sendDefaultPii: false,
      }),
    );
  });
});
