/**
 * Google Tag Manager composable for tracking events
 */

interface GtmEvent {
  event: string;
  [key: string]: unknown;
}

export interface UseGtm {
  trackEvent: (eventName: string, data?: Record<string, unknown>) => void;
  trackFormSubmit: (formName: string, action: string, data?: Record<string, unknown>) => void;
  trackPageView: (pageName: string, data?: Record<string, unknown>) => void;
}

/**
 * Pushes an event to the Google Tag Manager data layer
 */
function pushToDataLayer(eventData: GtmEvent): void {
  if (typeof window !== 'undefined') {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push(eventData);
  }
}

/**
 * Composable for Google Tag Manager event tracking
 */
export function useGtm(): UseGtm {
  /**
   * Track a custom event
   */
  const trackEvent = (eventName: string, data?: Record<string, unknown>): void => {
    pushToDataLayer({
      event: eventName,
      ...data,
    });
  };

  /**
   * Track a form submission event
   */
  const trackFormSubmit = (
    formName: string,
    action: string,
    data?: Record<string, unknown>,
  ): void => {
    pushToDataLayer({
      event: 'form_submit',
      form_name: formName,
      form_action: action,
      ...data,
    });
  };

  /**
   * Track a page view event
   */
  const trackPageView = (pageName: string, data?: Record<string, unknown>): void => {
    pushToDataLayer({
      event: 'page_view',
      page_name: pageName,
      ...data,
    });
  };

  return {
    trackEvent,
    trackFormSubmit,
    trackPageView,
  };
}

// Extend window interface for TypeScript
declare global {
  interface Window {
    dataLayer: GtmEvent[];
  }
}
