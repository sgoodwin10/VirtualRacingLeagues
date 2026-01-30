import '../css/app.css';
import { createApp } from 'vue';
import { createPinia } from 'pinia';
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate';
import router from '@app/router';
import App from '@app/components/App.vue';
import { useSiteConfigStore } from '@app/stores/siteConfigStore';
import { initSentry } from '@app/sentry';

// PrimeVue
import PrimeVue from 'primevue/config';
import Aura from '@primevue/themes/aura';
import ToastService from 'primevue/toastservice';
import ConfirmationService from 'primevue/confirmationservice';
import Tooltip from 'primevue/tooltip';
import 'primeicons/primeicons.css';

const app = createApp(App);
const pinia = createPinia();

// Register persistence plugin to save state to localStorage
pinia.use(piniaPluginPersistedstate);

// Register plugins in correct order: Pinia first, then PrimeVue and services, then router
app.use(pinia);
app.use(PrimeVue, {
  theme: {
    preset: Aura,
    options: {
      prefix: 'p',
      darkModeSelector: '.dark',
      cssLayer: {
        name: 'primevue',
        order: 'theme, base, primevue',
      },
    },
  },
});
app.use(ToastService);
app.use(ConfirmationService);
app.directive('tooltip', Tooltip);
app.use(router);

// Initialize Sentry for error tracking and performance monitoring
initSentry(app, router);

// Global error handlers - errors are captured by Sentry
app.config.errorHandler = (err, instance, info) => {
  // Errors are automatically captured by Sentry
  if (import.meta.env.DEV) {
    // Only log to console in development

    console.error('[Vue Error Handler]:', err, 'Component:', instance, 'Info:', info);
  }
};

window.onerror = (message, source, lineno, colno, error) => {
  // Errors are automatically captured by Sentry
  if (import.meta.env.DEV) {
    // Only log to console in development

    console.error('[Global Error]:', { message, source, lineno, colno, error });
  }
  return false; // Let default error handling continue
};

window.onunhandledrejection = (event) => {
  // Errors are automatically captured by Sentry
  if (import.meta.env.DEV) {
    // Only log to console in development

    console.error('[Unhandled Promise Rejection]:', event.reason);
  }
};

// Initialize site configuration and router before mounting
const siteConfigStore = useSiteConfigStore();
Promise.all([siteConfigStore.fetchConfig(), router.isReady()]).finally(() => {
  // Mount app regardless of config load success (will use defaults)
  app.mount('#user-app');
});
