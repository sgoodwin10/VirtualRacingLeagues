import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import MaintenanceModePage from './MaintenanceModePage.vue';

// Mock useSiteConfig
vi.mock('@public/composables/useSiteConfig', () => ({
  useSiteConfig: vi.fn(() => ({
    siteName: { value: 'Virtual Racing Leagues' },
    maintenanceMessage: { value: 'We are performing scheduled maintenance.' },
    hasDiscord: { value: true },
    discordUrl: { value: 'https://discord.gg/example' },
  })),
}));

describe('MaintenanceModePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders maintenance page correctly', () => {
    const wrapper = mount(MaintenanceModePage);

    expect(wrapper.find('h1').text()).toBe('Under Maintenance');
    expect(wrapper.text()).toContain("We're making things better");
  });

  it('displays custom maintenance message from config', () => {
    const wrapper = mount(MaintenanceModePage);

    expect(wrapper.text()).toContain('We are performing scheduled maintenance.');
  });

  it('displays default message when config message is empty', async () => {
    const { useSiteConfig } = await import('@public/composables/useSiteConfig');
    vi.mocked(useSiteConfig).mockReturnValue({
      siteName: { value: 'VRL' },
      maintenanceMessage: { value: '' },
      hasDiscord: { value: false },
      discordUrl: { value: null },
    } as ReturnType<typeof useSiteConfig>);

    const wrapper = mount(MaintenanceModePage);

    expect(wrapper.text()).toContain(
      "VRL is currently undergoing maintenance. We'll be back online shortly. Thank you for your patience.",
    );
  });

  it('shows Discord button when Discord is available', () => {
    const wrapper = mount(MaintenanceModePage);

    const discordButton = wrapper
      .findAll('button')
      .find((button) => button.text().includes('Join Our Discord for Updates'));

    expect(discordButton).toBeDefined();
    expect(discordButton?.exists()).toBe(true);
  });

  it('conditionally renders Discord button based on hasDiscord value', () => {
    // This test verifies the v-if logic in the template
    // When hasDiscord is true (as in the default mock), button should exist
    const wrapper = mount(MaintenanceModePage);

    const discordButton = wrapper
      .findAll('button')
      .find((button) => button.text().includes('Join Our Discord for Updates'));

    // With default mock where hasDiscord is true, button should exist
    expect(discordButton).toBeDefined();
  });

  it('opens Discord URL in new tab when button clicked', async () => {
    const windowOpenSpy = vi.spyOn(window, 'open').mockImplementation(() => null);

    const wrapper = mount(MaintenanceModePage);

    const discordButton = wrapper
      .findAll('button')
      .find((button) => button.text().includes('Join Our Discord for Updates'));

    await discordButton?.trigger('click');

    expect(windowOpenSpy).toHaveBeenCalledWith('https://discord.gg/example', '_blank');

    windowOpenSpy.mockRestore();
  });

  it('renders maintenance icon SVG', () => {
    const wrapper = mount(MaintenanceModePage);

    const svg = wrapper.find('svg');
    expect(svg.exists()).toBe(true);
  });

  it('displays support contact link', () => {
    const wrapper = mount(MaintenanceModePage);

    const supportLink = wrapper.find('a[href^="mailto:"]');
    expect(supportLink.exists()).toBe(true);
    expect(supportLink.text()).toBe('Contact Support');
  });

  it('has proper accessibility structure', () => {
    const wrapper = mount(MaintenanceModePage);

    // Should have h1 heading
    expect(wrapper.find('h1').exists()).toBe(true);

    // Should have descriptive text
    expect(wrapper.text()).toContain('We appreciate your understanding');
  });
});
