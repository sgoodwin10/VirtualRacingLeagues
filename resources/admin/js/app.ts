import '../css/app.css';
import { createApp } from 'vue';
import { createPinia } from 'pinia';
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate';
import router from '@admin/router';
import App from '@admin/components/App.vue';
import { useSiteConfigStore } from '@admin/stores/siteConfigStore';
import { useAdminStore } from '@admin/stores/adminStore';
import { logger } from '@admin/utils/logger';

// PrimeVue
import PrimeVue from 'primevue/config';
import Aura from '@primevue/themes/aura';
import ToastService from 'primevue/toastservice';
import ConfirmationService from 'primevue/confirmationservice';
import Tooltip from 'primevue/tooltip';
import 'primeicons/primeicons.css';

// Create Vue app instance
const app = createApp(App);
const pinia = createPinia();

// Configure Pinia with persistence plugin
pinia.use(piniaPluginPersistedstate);

// Register plugins
app.use(pinia);
app.use(router);
app.use(PrimeVue, {
  theme: {
    preset: Aura,
    options: {
      prefix: 'p',
      darkModeSelector: false, // Disable dark mode
      cssLayer: {
        name: 'primevue',
        order: 'theme, base, primevue',
      },
    },
  },
});
app.use(ToastService);
app.use(ConfirmationService);

// Register PrimeVue directives
app.directive('tooltip', Tooltip);

/**
 * Global error handler for Vue component errors
 * Catches errors from components, lifecycle hooks, watchers, etc.
 */
app.config.errorHandler = (err: unknown, instance, info) => {
  // Log the error with context
  logger.error('Global Vue error:', {
    error: err,
    componentName: instance?.$options?.name || instance?.$options?.__name || 'Unknown',
    errorInfo: info,
    stack: err instanceof Error ? err.stack : undefined,
  });

  // Get toast service to show user-friendly error
  const toast = app.config.globalProperties.$toast;
  if (toast) {
    const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';

    toast.add({
      severity: 'error',
      summary: 'Application Error',
      detail: errorMessage || 'Something went wrong. Please refresh the page and try again.',
      life: 5000,
    });
  }

  // In development, also log to console for easier debugging
  if (import.meta.env.DEV) {
    console.error('Component instance:', instance);
    console.error('Error info:', info);
  }
};

/**
 * Global handler for unhandled promise rejections
 * Catches async errors that aren't explicitly handled
 */
window.addEventListener('unhandledrejection', (event: PromiseRejectionEvent) => {
  // Log the unhandled rejection
  logger.error('Unhandled promise rejection:', {
    reason: event.reason,
    promise: event.promise,
    stack: event.reason instanceof Error ? event.reason.stack : undefined,
  });

  // Get toast service to show user-friendly error
  const toast = app.config.globalProperties.$toast;
  if (toast) {
    const errorMessage =
      event.reason instanceof Error
        ? event.reason.message
        : typeof event.reason === 'string'
          ? event.reason
          : 'An unexpected error occurred';

    toast.add({
      severity: 'error',
      summary: 'Operation Failed',
      detail:
        errorMessage || 'An unexpected error occurred. Please check your connection and try again.',
      life: 5000,
    });
  }

  // Prevent the default browser error handling
  event.preventDefault();
});

/**
 * Global handler for general JavaScript errors
 * Catches errors that might not be caught by Vue's error handler
 */
window.addEventListener('error', (event: ErrorEvent) => {
  // Skip errors that are likely already handled by Vue
  if (event.filename?.includes('node_modules') || !event.error) {
    return;
  }

  logger.error('Global JavaScript error:', {
    message: event.message,
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno,
    error: event.error,
    stack: event.error?.stack,
  });

  // Only show toast for errors that seem to be from our code
  const toast = app.config.globalProperties.$toast;
  if (toast && event.error) {
    toast.add({
      severity: 'error',
      summary: 'Script Error',
      detail: event.message || 'An unexpected error occurred in the application.',
      life: 5000,
    });
  }

  // Prevent default browser error handling for our errors
  if (!event.filename?.includes('node_modules')) {
    event.preventDefault();
  }
});

/**
 * Initialize and mount the application
 * Auth check is handled by router guards
 */
app.mount('#admin-app');

/**
 * Initialize global site configuration
 * Only fetch site config if user is authenticated
 */
const siteConfigStore = useSiteConfigStore();
const adminStore = useAdminStore();

// Check authentication and fetch site config if authenticated
adminStore.checkAuth().then((isAuthenticated) => {
  if (isAuthenticated) {
    siteConfigStore.fetchSiteConfig();
  }
});
