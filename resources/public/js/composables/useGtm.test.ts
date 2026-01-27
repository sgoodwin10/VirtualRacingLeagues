import { describe, it, expect, beforeEach } from 'vitest';
import { useGtm } from './useGtm';

describe('useGtm', () => {
  beforeEach(() => {
    // Mock window.dataLayer!
    window.dataLayer! = [];
  });

  describe('trackEvent', () => {
    it('should push event to window.dataLayer!', () => {
      const { trackEvent } = useGtm();

      trackEvent('test_event');

      expect(window.dataLayer!).toHaveLength(1);
      expect(window.dataLayer?.[0]).toEqual({ event: 'test_event' });
    });

    it('should include event name in data layer', () => {
      const { trackEvent } = useGtm();

      trackEvent('button_click');

      expect(window.dataLayer?.[0]).toHaveProperty('event', 'button_click');
    });

    it('should merge additional data into event', () => {
      const { trackEvent } = useGtm();

      trackEvent('custom_event', { userId: 123, action: 'clicked' });

      expect(window.dataLayer?.[0]).toEqual({
        event: 'custom_event',
        userId: 123,
        action: 'clicked',
      });
    });

    it('should handle empty additional data', () => {
      const { trackEvent } = useGtm();

      trackEvent('simple_event', {});

      expect(window.dataLayer?.[0]).toEqual({ event: 'simple_event' });
    });

    it('should initialize dataLayer if undefined', () => {
      delete window.dataLayer!;

      const { trackEvent } = useGtm();

      trackEvent('init_event');

      expect(window.dataLayer!).toBeDefined();
      expect(window.dataLayer!).toHaveLength(1);
      expect(window.dataLayer?.[0]).toEqual({ event: 'init_event' });
    });

    it('should handle multiple events sequentially', () => {
      const { trackEvent } = useGtm();

      trackEvent('event1');
      trackEvent('event2', { value: 100 });
      trackEvent('event3');

      expect(window.dataLayer!).toHaveLength(3);
      expect(window.dataLayer?.[0]).toEqual({ event: 'event1' });
      expect(window.dataLayer?.[1]).toEqual({ event: 'event2', value: 100 });
      expect(window.dataLayer?.[2]).toEqual({ event: 'event3' });
    });
  });

  describe('trackFormSubmit', () => {
    it('should push form_submit event', () => {
      const { trackFormSubmit } = useGtm();

      trackFormSubmit('contact', 'submit');

      expect(window.dataLayer!).toHaveLength(1);
      expect(window.dataLayer?.[0]).toHaveProperty('event', 'form_submit');
    });

    it('should include form_name in event data', () => {
      const { trackFormSubmit } = useGtm();

      trackFormSubmit('registration', 'submit');

      expect(window.dataLayer?.[0]).toHaveProperty('form_name', 'registration');
    });

    it('should include form_action in event data', () => {
      const { trackFormSubmit } = useGtm();

      trackFormSubmit('newsletter', 'subscribe');

      expect(window.dataLayer?.[0]).toHaveProperty('form_action', 'subscribe');
    });

    it('should merge additional data', () => {
      const { trackFormSubmit } = useGtm();

      trackFormSubmit('contact', 'submit', { userId: 456, timestamp: 1234567890 });

      expect(window.dataLayer?.[0]).toEqual({
        event: 'form_submit',
        form_name: 'contact',
        form_action: 'submit',
        userId: 456,
        timestamp: 1234567890,
      });
    });

    it('should handle form submission without additional data', () => {
      const { trackFormSubmit } = useGtm();

      trackFormSubmit('login', 'submit');

      expect(window.dataLayer?.[0]).toEqual({
        event: 'form_submit',
        form_name: 'login',
        form_action: 'submit',
      });
    });
  });

  describe('trackPageView', () => {
    it('should push page_view event', () => {
      const { trackPageView } = useGtm();

      trackPageView('home');

      expect(window.dataLayer!).toHaveLength(1);
      expect(window.dataLayer?.[0]).toHaveProperty('event', 'page_view');
    });

    it('should include page_name in event data', () => {
      const { trackPageView } = useGtm();

      trackPageView('about');

      expect(window.dataLayer?.[0]).toHaveProperty('page_name', 'about');
    });

    it('should merge additional data', () => {
      const { trackPageView } = useGtm();

      trackPageView('product', { productId: 789, category: 'electronics' });

      expect(window.dataLayer?.[0]).toEqual({
        event: 'page_view',
        page_name: 'product',
        productId: 789,
        category: 'electronics',
      });
    });

    it('should handle page view without additional data', () => {
      const { trackPageView } = useGtm();

      trackPageView('contact');

      expect(window.dataLayer?.[0]).toEqual({
        event: 'page_view',
        page_name: 'contact',
      });
    });

    it('should track multiple page views', () => {
      const { trackPageView } = useGtm();

      trackPageView('home');
      trackPageView('about');
      trackPageView('contact');

      expect(window.dataLayer!).toHaveLength(3);
      expect(window.dataLayer?.[0]).toHaveProperty('page_name', 'home');
      expect(window.dataLayer![1]).toHaveProperty('page_name', 'about');
      expect(window.dataLayer![2]).toHaveProperty('page_name', 'contact');
    });
  });

  describe('Return value interface', () => {
    it('should return all required methods', () => {
      const gtm = useGtm();

      expect(gtm).toHaveProperty('trackEvent');
      expect(gtm).toHaveProperty('trackFormSubmit');
      expect(gtm).toHaveProperty('trackPageView');
      expect(typeof gtm.trackEvent).toBe('function');
      expect(typeof gtm.trackFormSubmit).toBe('function');
      expect(typeof gtm.trackPageView).toBe('function');
    });
  });

  describe('SSR compatibility', () => {
    it('should handle missing window object gracefully', () => {
      const originalWindow = global.window;

      // @ts-expect-error - Testing SSR scenario
      delete global.window;

      const { trackEvent } = useGtm();

      // Should not throw
      expect(() => trackEvent('test_event')).not.toThrow();

      // Restore window
      global.window = originalWindow;
    });
  });
});
