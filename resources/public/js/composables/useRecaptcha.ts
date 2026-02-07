import { ref } from 'vue';
import { apiClient } from '@public/services/api';

interface RecaptchaConfig {
  enabled: boolean;
  siteKey: string | null;
}

declare global {
  interface Window {
    grecaptcha: {
      ready: (callback: () => void) => void;
      execute: (siteKey: string, options: { action: string }) => Promise<string>;
    };
  }
}

const isLoaded = ref(false);
const isLoading = ref(false);
const config = ref<RecaptchaConfig | null>(null);
const configLoaded = ref(false);

/**
 * Composable for Google reCAPTCHA v3 integration.
 * Handles script loading, token generation, and configuration.
 */
export function useRecaptcha() {
  const error = ref<string | null>(null);

  /**
   * Fetch reCAPTCHA configuration from backend
   */
  const fetchConfig = async (): Promise<RecaptchaConfig | null> => {
    if (configLoaded.value) {
      return config.value;
    }

    try {
      const response = await apiClient.get<{ data: RecaptchaConfig }>('/recaptcha-config');
      config.value = response.data.data;
      configLoaded.value = true;
      return config.value;
    } catch {
      console.warn('Failed to fetch reCAPTCHA config, assuming disabled');
      config.value = { enabled: false, siteKey: null };
      configLoaded.value = true;
      return config.value;
    }
  };

  /**
   * Load the reCAPTCHA v3 script
   */
  const loadScript = async (): Promise<void> => {
    if (isLoaded.value || isLoading.value) return;

    const cfg = await fetchConfig();
    if (!cfg?.enabled || !cfg?.siteKey) {
      return;
    }

    isLoading.value = true;

    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = `https://www.google.com/recaptcha/api.js?render=${cfg.siteKey}`;
      script.async = true;
      script.defer = true;

      script.onload = () => {
        isLoaded.value = true;
        isLoading.value = false;
        resolve();
      };

      script.onerror = () => {
        isLoading.value = false;
        error.value = 'Failed to load reCAPTCHA';
        reject(new Error('Failed to load reCAPTCHA script'));
      };

      document.head.appendChild(script);
    });
  };

  /**
   * Execute reCAPTCHA and get a token
   * @param action - The action name (e.g., 'login', 'register')
   * @returns The reCAPTCHA token or null if disabled/failed
   */
  const executeRecaptcha = async (action: string): Promise<string | null> => {
    error.value = null;

    const cfg = await fetchConfig();
    if (!cfg?.enabled || !cfg?.siteKey) {
      return null;
    }

    try {
      await loadScript();

      return new Promise((resolve, reject) => {
        window.grecaptcha.ready(() => {
          window.grecaptcha
            .execute(cfg.siteKey!, { action })
            .then((token) => {
              resolve(token);
            })
            .catch((err) => {
              error.value = 'reCAPTCHA verification failed';
              reject(err);
            });
        });
      });
    } catch {
      error.value = 'reCAPTCHA verification failed';
      return null;
    }
  };

  /**
   * Check if reCAPTCHA is enabled
   */
  const isEnabled = async (): Promise<boolean> => {
    const cfg = await fetchConfig();
    return cfg?.enabled ?? false;
  };

  return {
    executeRecaptcha,
    isEnabled,
    loadScript,
    error,
    isLoaded,
    isLoading,
  };
}
