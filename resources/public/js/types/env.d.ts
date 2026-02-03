/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_NAME: string;
  readonly VITE_APP_URL: string;
  readonly VITE_APP_DOMAIN: string;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// Extend Window interface for Google Tag Manager dataLayer and gtag
declare global {
  interface Window {
    dataLayer?: Record<string, unknown>[];
    gtag?: (
      command: 'event' | 'config' | 'set',
      eventNameOrConfigId: string,
      params?: Record<string, unknown>,
    ) => void;
  }
}

export {};
