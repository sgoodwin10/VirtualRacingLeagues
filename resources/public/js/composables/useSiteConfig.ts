/**
 * Site Configuration Composable
 *
 * Provides reactive access to site configuration values in Vue components.
 */

import { computed, type ComputedRef } from 'vue';
import { getSiteConfig, type SiteConfig } from '@public/types/site-config';

interface UseSiteConfigReturn {
  config: ComputedRef<SiteConfig>;
  siteName: ComputedRef<string>;
  timezone: ComputedRef<string>;
  discordUrl: ComputedRef<string | null>;
  discordInviteCode: ComputedRef<string | null>;
  hasDiscord: ComputedRef<boolean>;
  isMaintenanceMode: ComputedRef<boolean>;
  maintenanceMessage: ComputedRef<string>;
  isRegistrationEnabled: ComputedRef<boolean>;
  googleAnalyticsId: ComputedRef<string | null>;
  googleTagManagerId: ComputedRef<string | null>;
  hasGoogleAnalytics: ComputedRef<boolean>;
  hasGoogleTagManager: ComputedRef<boolean>;
}

/**
 * Use site configuration
 *
 * @example
 * ```ts
 * const { siteName, hasDiscord, discordUrl, isRegistrationEnabled } = useSiteConfig();
 *
 * console.log(siteName.value); // "VRL"
 * console.log(hasDiscord.value); // true
 * console.log(discordUrl.value); // "https://discord.gg/..."
 * console.log(isRegistrationEnabled.value); // true
 * ```
 */
export function useSiteConfig(): UseSiteConfigReturn {
  const config = computed(() => getSiteConfig());

  const siteName = computed(() => config.value.name);
  const timezone = computed(() => config.value.timezone);

  const discordUrl = computed(() => config.value.discord.url);
  const discordInviteCode = computed(() => config.value.discord.inviteCode);
  const hasDiscord = computed(() => !!config.value.discord.url);

  const isMaintenanceMode = computed(() => config.value.maintenance.enabled);
  const maintenanceMessage = computed(() => config.value.maintenance.message);

  const isRegistrationEnabled = computed(() => config.value.registration.enabled);

  const googleAnalyticsId = computed(() => config.value.google.analyticsId);
  const googleTagManagerId = computed(() => config.value.google.tagManagerId);
  const hasGoogleAnalytics = computed(() => !!config.value.google.analyticsId);
  const hasGoogleTagManager = computed(() => !!config.value.google.tagManagerId);

  return {
    config,
    siteName,
    timezone,
    discordUrl,
    discordInviteCode,
    hasDiscord,
    isMaintenanceMode,
    maintenanceMessage,
    isRegistrationEnabled,
    googleAnalyticsId,
    googleTagManagerId,
    hasGoogleAnalytics,
    hasGoogleTagManager,
  };
}
