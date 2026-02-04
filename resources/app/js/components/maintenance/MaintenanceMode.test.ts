import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { ref } from 'vue';
import MaintenanceMode from './MaintenanceMode.vue';

// Mock the composable
vi.mock('@app/composables/useSiteConfig', () => ({
  useSiteConfig: vi.fn(),
}));

import { useSiteConfig } from '@app/composables/useSiteConfig';

describe('MaintenanceMode', () => {
  it('renders maintenance message', () => {
    vi.mocked(useSiteConfig).mockReturnValue({
      config: ref({}) as any,
      siteName: ref('Test') as any,
      timezone: ref('UTC') as any,
      discordUrl: ref(null) as any,
      discordInviteCode: ref(null) as any,
      hasDiscord: ref(false) as any,
      isMaintenanceMode: ref(true) as any,
      maintenanceMessage: ref('We are currently performing maintenance.') as any,
      isRegistrationEnabled: ref(true) as any,
      googleAnalyticsId: ref(null) as any,
      googleTagManagerId: ref(null) as any,
      hasGoogleAnalytics: ref(false) as any,
      hasGoogleTagManager: ref(false) as any,
    });

    const wrapper = mount(MaintenanceMode);
    expect(wrapper.text()).toContain('Maintenance Mode');
    expect(wrapper.text()).toContain('We are currently performing maintenance.');
  });

  it('shows Discord button when Discord URL is available', () => {
    vi.mocked(useSiteConfig).mockReturnValue({
      config: ref({}) as any,
      siteName: ref('Test') as any,
      timezone: ref('UTC') as any,
      discordUrl: ref('https://discord.gg/test') as any,
      discordInviteCode: ref(null) as any,
      hasDiscord: ref(true) as any,
      isMaintenanceMode: ref(true) as any,
      maintenanceMessage: ref('We are currently performing maintenance.') as any,
      isRegistrationEnabled: ref(true) as any,
      googleAnalyticsId: ref(null) as any,
      googleTagManagerId: ref(null) as any,
      hasGoogleAnalytics: ref(false) as any,
      hasGoogleTagManager: ref(false) as any,
    });

    const wrapper = mount(MaintenanceMode);
    const button = wrapper.find('button');
    expect(button.exists()).toBe(true);
    expect(button.text()).toContain('Join Our Discord');
  });

  it('opens Discord URL in new tab when button is clicked', () => {
    vi.mocked(useSiteConfig).mockReturnValue({
      config: ref({}) as any,
      siteName: ref('Test') as any,
      timezone: ref('UTC') as any,
      discordUrl: ref('https://discord.gg/test') as any,
      discordInviteCode: ref(null) as any,
      hasDiscord: ref(true) as any,
      isMaintenanceMode: ref(true) as any,
      maintenanceMessage: ref('We are currently performing maintenance.') as any,
      isRegistrationEnabled: ref(true) as any,
      googleAnalyticsId: ref(null) as any,
      googleTagManagerId: ref(null) as any,
      hasGoogleAnalytics: ref(false) as any,
      hasGoogleTagManager: ref(false) as any,
    });

    const windowOpenSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
    const wrapper = mount(MaintenanceMode);
    const button = wrapper.find('button');
    button.trigger('click');
    expect(windowOpenSpy).toHaveBeenCalledWith('https://discord.gg/test', '_blank');
    windowOpenSpy.mockRestore();
  });

  it('does not show Discord button when Discord URL is not available', () => {
    vi.mocked(useSiteConfig).mockReturnValue({
      config: ref({}) as any,
      siteName: ref('Test') as any,
      timezone: ref('UTC') as any,
      discordUrl: ref(null) as any,
      discordInviteCode: ref(null) as any,
      hasDiscord: ref(false) as any,
      isMaintenanceMode: ref(true) as any,
      maintenanceMessage: ref('We are currently performing maintenance.') as any,
      isRegistrationEnabled: ref(true) as any,
      googleAnalyticsId: ref(null) as any,
      googleTagManagerId: ref(null) as any,
      hasGoogleAnalytics: ref(false) as any,
      hasGoogleTagManager: ref(false) as any,
    });

    const wrapper = mount(MaintenanceMode);
    const button = wrapper.find('button');
    expect(button.exists()).toBe(false);
  });
});
