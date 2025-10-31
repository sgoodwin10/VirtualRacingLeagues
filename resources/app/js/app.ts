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

app.use(pinia);
app.use(router);
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

// Initialize site configuration before mounting
const siteConfigStore = useSiteConfigStore();
siteConfigStore.fetchConfig().finally(() => {
  // Mount app regardless of config load success (will use defaults)
  app.mount('#user-app');
});
