import { describe, it, expect, beforeEach } from 'vitest';
import { useGtm } from '../useGtm';

describe('useGtm', () => {
  beforeEach(() => {
    // Reset dataLayer before each test
    window.dataLayer = [];
  });

  describe('pushToDataLayer', () => {
    it('should initialize dataLayer if it does not exist', () => {
      delete window.dataLayer;

      const { pushToDataLayer } = useGtm();
      pushToDataLayer({ event: 'test' });

      expect(window.dataLayer).toBeDefined();
      expect(window.dataLayer).toHaveLength(1);
    });

    it('should push event to dataLayer', () => {
      const { pushToDataLayer } = useGtm();
      pushToDataLayer({ event: 'custom_event', custom_param: 'value' });

      expect(window.dataLayer).toHaveLength(1);
      expect(window.dataLayer?.[0]).toEqual({
        event: 'custom_event',
        custom_param: 'value',
      });
    });
  });

  describe('trackEvent', () => {
    it('should track a simple event', () => {
      const { trackEvent } = useGtm();
      trackEvent('login');

      expect(window.dataLayer).toHaveLength(1);
      expect(window.dataLayer?.[0]).toEqual({ event: 'login' });
    });

    it('should track event with additional parameters', () => {
      const { trackEvent } = useGtm();
      trackEvent('purchase', { value: 99.99, currency: 'USD' });

      expect(window.dataLayer).toHaveLength(1);
      expect(window.dataLayer?.[0]).toEqual({
        event: 'purchase',
        value: 99.99,
        currency: 'USD',
      });
    });
  });

  describe('trackClick', () => {
    it('should track a click event with category and action', () => {
      const { trackClick } = useGtm();
      trackClick('Navigation', 'click');

      expect(window.dataLayer).toHaveLength(1);
      expect(window.dataLayer?.[0]).toEqual({
        event: 'click',
        event_category: 'Navigation',
        event_action: 'click',
      });
    });

    it('should track a click event with label', () => {
      const { trackClick } = useGtm();
      trackClick('CTA', 'click', 'signup_button');

      expect(window.dataLayer).toHaveLength(1);
      expect(window.dataLayer?.[0]).toEqual({
        event: 'click',
        event_category: 'CTA',
        event_action: 'click',
        event_label: 'signup_button',
      });
    });

    it('should track a click event with value', () => {
      const { trackClick } = useGtm();
      trackClick('Product', 'add_to_cart', 'SKU-123', 49.99);

      expect(window.dataLayer).toHaveLength(1);
      expect(window.dataLayer?.[0]).toEqual({
        event: 'click',
        event_category: 'Product',
        event_action: 'add_to_cart',
        event_label: 'SKU-123',
        event_value: 49.99,
      });
    });

    it('should not include undefined optional parameters', () => {
      const { trackClick } = useGtm();
      trackClick('Navigation', 'click', undefined, undefined);

      expect(window.dataLayer?.[0]).not.toHaveProperty('event_label');
      expect(window.dataLayer?.[0]).not.toHaveProperty('event_value');
    });
  });

  describe('trackFormSubmit', () => {
    it('should track a form submission', () => {
      const { trackFormSubmit } = useGtm();
      trackFormSubmit('contact_form');

      expect(window.dataLayer).toHaveLength(1);
      expect(window.dataLayer?.[0]).toEqual({
        event: 'form_submit',
        form_name: 'contact_form',
        form_action: undefined,
      });
    });

    it('should track a form submission with action', () => {
      const { trackFormSubmit } = useGtm();
      trackFormSubmit('newsletter', 'subscribe');

      expect(window.dataLayer).toHaveLength(1);
      expect(window.dataLayer?.[0]).toEqual({
        event: 'form_submit',
        form_name: 'newsletter',
        form_action: 'subscribe',
      });
    });

    it('should track a form submission with additional data', () => {
      const { trackFormSubmit } = useGtm();
      trackFormSubmit('newsletter', 'subscribe', { email_domain: 'gmail.com' });

      expect(window.dataLayer).toHaveLength(1);
      expect(window.dataLayer?.[0]).toEqual({
        event: 'form_submit',
        form_name: 'newsletter',
        form_action: 'subscribe',
        email_domain: 'gmail.com',
      });
    });
  });

  describe('trackOutboundLink', () => {
    it('should track an outbound link click', () => {
      const { trackOutboundLink } = useGtm();
      trackOutboundLink('https://example.com');

      expect(window.dataLayer).toHaveLength(2);
      // First event is the click event
      expect(window.dataLayer?.[0]).toEqual({
        event: 'click',
        event_category: 'Outbound Link',
        event_action: 'click',
        event_label: 'https://example.com',
      });
      // Second event is the outbound_link event
      expect(window.dataLayer?.[1]).toEqual({
        event: 'outbound_link',
        link_url: 'https://example.com',
        link_label: undefined,
      });
    });

    it('should track an outbound link with custom label', () => {
      const { trackOutboundLink } = useGtm();
      trackOutboundLink('https://partner.com', 'partner_site');

      expect(window.dataLayer).toHaveLength(2);
      expect(window.dataLayer?.[0]).toEqual({
        event: 'click',
        event_category: 'Outbound Link',
        event_action: 'click',
        event_label: 'partner_site',
      });
      expect(window.dataLayer?.[1]).toEqual({
        event: 'outbound_link',
        link_url: 'https://partner.com',
        link_label: 'partner_site',
      });
    });
  });

  describe('trackSocial', () => {
    it('should track a social interaction', () => {
      const { trackSocial } = useGtm();
      trackSocial('twitter', 'share');

      expect(window.dataLayer).toHaveLength(1);
      expect(window.dataLayer?.[0]).toEqual({
        event: 'social_interaction',
        social_network: 'twitter',
        social_action: 'share',
        social_target: undefined,
      });
    });

    it('should track a social interaction with target', () => {
      const { trackSocial } = useGtm();
      trackSocial('facebook', 'share', 'https://mysite.com/article');

      expect(window.dataLayer).toHaveLength(1);
      expect(window.dataLayer?.[0]).toEqual({
        event: 'social_interaction',
        social_network: 'facebook',
        social_action: 'share',
        social_target: 'https://mysite.com/article',
      });
    });
  });

  describe('multiple events', () => {
    it('should accumulate events in dataLayer', () => {
      const { trackClick, trackEvent, trackFormSubmit } = useGtm();

      trackClick('Nav', 'click', 'home');
      trackEvent('page_view');
      trackFormSubmit('contact');

      expect(window.dataLayer).toHaveLength(3);
    });
  });
});
