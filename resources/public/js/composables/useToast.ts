import { useToast as usePrimeToast } from 'primevue/usetoast';

const DEFAULT_TOAST_LIFE = 5000;

export interface ToastOptions {
  severity?: 'success' | 'info' | 'warn' | 'error';
  summary?: string;
  detail: string;
  life?: number;
}

export interface UseToast {
  success: (message: string, summary?: string) => void;
  info: (message: string, summary?: string) => void;
  warn: (message: string, summary?: string) => void;
  error: (message: string, summary?: string) => void;
  show: (options: ToastOptions) => void;
}

export function useToast(): UseToast {
  const toast = usePrimeToast();

  const success = (message: string, summary?: string) => {
    toast.add({
      severity: 'success',
      summary: summary || 'Success',
      detail: message,
      life: DEFAULT_TOAST_LIFE,
    });
  };

  const info = (message: string, summary?: string) => {
    toast.add({
      severity: 'info',
      summary: summary || 'Info',
      detail: message,
      life: DEFAULT_TOAST_LIFE,
    });
  };

  const warn = (message: string, summary?: string) => {
    toast.add({
      severity: 'warn',
      summary: summary || 'Warning',
      detail: message,
      life: DEFAULT_TOAST_LIFE,
    });
  };

  const error = (message: string, summary?: string) => {
    toast.add({
      severity: 'error',
      summary: summary || 'Error',
      detail: message,
      life: DEFAULT_TOAST_LIFE,
    });
  };

  const show = (options: ToastOptions) => {
    toast.add({
      severity: options.severity || 'info',
      summary: options.summary,
      detail: options.detail,
      life: options.life || DEFAULT_TOAST_LIFE,
    });
  };

  return { success, info, warn, error, show };
}
