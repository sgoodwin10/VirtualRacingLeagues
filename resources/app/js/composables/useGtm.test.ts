import { describe, it, expect, beforeEach } from 'vitest';
import { useGtm } from './useGtm';

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
      trackEvent('league_created');

      expect(window.dataLayer).toHaveLength(1);
      expect(window.dataLayer?.[0]).toEqual({ event: 'league_created' });
    });

    it('should track event with additional parameters', () => {
      const { trackEvent } = useGtm();
      trackEvent('season_started', { season_id: 123, league_id: 456 });

      expect(window.dataLayer).toHaveLength(1);
      expect(window.dataLayer?.[0]).toEqual({
        event: 'season_started',
        season_id: 123,
        league_id: 456,
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
      trackClick('League', 'create', 'new_league_button');

      expect(window.dataLayer).toHaveLength(1);
      expect(window.dataLayer?.[0]).toEqual({
        event: 'click',
        event_category: 'League',
        event_action: 'create',
        event_label: 'new_league_button',
      });
    });

    it('should track a click event with value', () => {
      const { trackClick } = useGtm();
      trackClick('Season', 'delete', 'season_123', 1);

      expect(window.dataLayer).toHaveLength(1);
      expect(window.dataLayer?.[0]).toEqual({
        event: 'click',
        event_category: 'Season',
        event_action: 'delete',
        event_label: 'season_123',
        event_value: 1,
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
      trackFormSubmit('create_league_form');

      expect(window.dataLayer).toHaveLength(1);
      expect(window.dataLayer?.[0]).toEqual({
        event: 'form_submit',
        form_name: 'create_league_form',
        form_action: undefined,
      });
    });

    it('should track a form submission with action', () => {
      const { trackFormSubmit } = useGtm();
      trackFormSubmit('driver_registration', 'submit');

      expect(window.dataLayer).toHaveLength(1);
      expect(window.dataLayer?.[0]).toEqual({
        event: 'form_submit',
        form_name: 'driver_registration',
        form_action: 'submit',
      });
    });

    it('should track a form submission with additional data', () => {
      const { trackFormSubmit } = useGtm();
      trackFormSubmit('driver_registration', 'submit', { league_id: 123 });

      expect(window.dataLayer).toHaveLength(1);
      expect(window.dataLayer?.[0]).toEqual({
        event: 'form_submit',
        form_name: 'driver_registration',
        form_action: 'submit',
        league_id: 123,
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
      trackOutboundLink('https://discord.gg/invite', 'discord_server');

      expect(window.dataLayer).toHaveLength(2);
      expect(window.dataLayer?.[0]).toEqual({
        event: 'click',
        event_category: 'Outbound Link',
        event_action: 'click',
        event_label: 'discord_server',
      });
      expect(window.dataLayer?.[1]).toEqual({
        event: 'outbound_link',
        link_url: 'https://discord.gg/invite',
        link_label: 'discord_server',
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
      trackSocial('discord', 'join', 'league_server');

      expect(window.dataLayer).toHaveLength(1);
      expect(window.dataLayer?.[0]).toEqual({
        event: 'social_interaction',
        social_network: 'discord',
        social_action: 'join',
        social_target: 'league_server',
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
