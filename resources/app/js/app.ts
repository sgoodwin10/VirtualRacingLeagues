import '../css/app.css';
import { createApp } from 'vue';
import { createPinia } from 'pinia';
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate';
import router from '@app/router';
import App from '@app/components/App.vue';
import { useSiteConfigStore } from '@app/stores/siteConfigStore';

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

// Global error handlers
app.config.errorHandler = (err, instance, info) => {
  console.error('[Vue Error Handler]:', err);
  console.error('Component:', instance);
  console.error('Error Info:', info);
  // You could send this to an error tracking service here
};

window.onerror = (message, source, lineno, colno, error) => {
  console.error('[Global Error]:', {
    message,
    source,
    lineno,
    colno,
    error,
  });
  // You could send this to an error tracking service here
  return false; // Let default error handling continue
};

window.onunhandledrejection = (event) => {
  console.error('[Unhandled Promise Rejection]:', event.reason);
  // You could send this to an error tracking service here
};

// Initialize site configuration and router before mounting
const siteConfigStore = useSiteConfigStore();
Promise.all([siteConfigStore.fetchConfig(), router.isReady()]).finally(() => {
  // Mount app regardless of config load success (will use defaults)
  app.mount('#user-app');
});
