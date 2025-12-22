/**
 * GTM (Google Tag Manager) composable for tracking events and page views.
 *
 * This composable provides type-safe methods for pushing events to the GTM dataLayer.
 * Page views are automatically tracked via the router's afterEach hook.
 */

/** Base GTM event structure */
export interface GtmEvent {
  event: string;
  [key: string]: unknown;
}

/** Click event structure for tracking user interactions */
export interface GtmClickEvent extends GtmEvent {
  event: 'click';
  event_category: string;
  event_action: string;
  event_label?: string;
  event_value?: number;
}

/** Form event structure for tracking form submissions */
export interface GtmFormEvent extends GtmEvent {
  event: 'form_submit';
  form_name: string;
  form_action?: string;
}

/** Custom event structure for tracking custom interactions */
export interface GtmCustomEvent extends GtmEvent {
  event_category?: string;
  event_action?: string;
  event_label?: string;
  event_value?: number;
}

/**
 * Composable for GTM event tracking.
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * import { useGtm } from '@app/composables/useGtm';
 *
 * const { trackClick, trackEvent } = useGtm();
 *
 * const handleLeagueCreate = () => {
 *   trackClick('League', 'create', 'new_league_button');
 * };
 * </script>
 * ```
 */
export function useGtm() {
  /**
   * Push a raw event to the GTM dataLayer.
   */
  const pushToDataLayer = (data: GtmEvent): void => {
    if (typeof window === 'undefined') return;
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push(data);
  };

  /**
   * Track a custom event.
   *
   * @param eventName - The event name (e.g., 'login', 'purchase')
   * @param params - Additional event parameters
   *
   * @example
   * ```ts
   * trackEvent('league_created', { league_id: 123 });
   * trackEvent('season_started', { season_id: 456 });
   * ```
   */
  const trackEvent = (eventName: string, params?: Record<string, unknown>): void => {
    pushToDataLayer({
      event: eventName,
      ...params,
    });
  };

  /**
   * Track a click event.
   *
   * @param category - Event category (e.g., 'Navigation', 'League', 'Season')
   * @param action - Event action (e.g., 'click', 'create', 'delete')
   * @param label - Optional label for the element clicked
   * @param value - Optional numeric value
   *
   * @example
   * ```ts
   * trackClick('League', 'create', 'new_league_button');
   * trackClick('Navigation', 'click', 'dashboard_link');
   * trackClick('Season', 'delete', 'season_123', 1);
   * ```
   */
  const trackClick = (category: string, action: string, label?: string, value?: number): void => {
    const event: GtmClickEvent = {
      event: 'click',
      event_category: category,
      event_action: action,
    };

    if (label !== undefined) {
      event.event_label = label;
    }

    if (value !== undefined) {
      event.event_value = value;
    }

    pushToDataLayer(event);
  };

  /**
   * Track a form submission event.
   *
   * @param formName - Name/identifier of the form
   * @param action - Optional action (e.g., 'submit', 'validate_error')
   * @param additionalData - Optional additional data
   *
   * @example
   * ```ts
   * trackFormSubmit('create_league_form');
   * trackFormSubmit('driver_registration', 'submit', { league_id: 123 });
   * ```
   */
  const trackFormSubmit = (
    formName: string,
    action?: string,
    additionalData?: Record<string, unknown>,
  ): void => {
    pushToDataLayer({
      event: 'form_submit',
      form_name: formName,
      form_action: action,
      ...additionalData,
    });
  };

  /**
   * Track an outbound link click.
   *
   * @param url - The destination URL
   * @param label - Optional label for the link
   *
   * @example
   * ```ts
   * trackOutboundLink('https://example.com', 'partner_site');
   * ```
   */
  const trackOutboundLink = (url: string, label?: string): void => {
    trackClick('Outbound Link', 'click', label || url);
    pushToDataLayer({
      event: 'outbound_link',
      link_url: url,
      link_label: label,
    });
  };

  /**
   * Track a social interaction.
   *
   * @param network - Social network name (e.g., 'facebook', 'twitter')
   * @param action - Action performed (e.g., 'share', 'like', 'follow')
   * @param target - Optional target URL or content
   *
   * @example
   * ```ts
   * trackSocial('twitter', 'share', window.location.href);
   * trackSocial('discord', 'join', 'league_server');
   * ```
   */
  const trackSocial = (network: string, action: string, target?: string): void => {
    pushToDataLayer({
      event: 'social_interaction',
      social_network: network,
      social_action: action,
      social_target: target,
    });
  };

  return {
    pushToDataLayer,
    trackEvent,
    trackClick,
    trackFormSubmit,
    trackOutboundLink,
    trackSocial,
  };
}
