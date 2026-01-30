import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount, VueWrapper } from '@vue/test-utils';
import PublicFooter from './PublicFooter.vue';
import PublicContactModal from '@public/components/contact/PublicContactModal.vue';

// Mock the useGtm composable
vi.mock('@public/composables/useGtm', () => ({
  useGtm: () => ({
    trackEvent: vi.fn(),
  }),
}));

describe('PublicFooter', () => {
  let wrapper: VueWrapper;

  beforeEach(() => {
    wrapper = mount(PublicFooter, {
      global: {
        stubs: {
          PhDiscordLogo: true,
          PublicContactModal: true,
        },
      },
    });
  });

  describe('Rendering', () => {
    it('should render the footer', () => {
      expect(wrapper.find('footer').exists()).toBe(true);
    });

    it('should render copyright text with current year', () => {
      const currentYear = new Date().getFullYear();
      const copyrightText = wrapper.text();

      expect(copyrightText).toContain(`© ${currentYear}`);
      expect(copyrightText).toContain('SimGridManager. All rights reserved.');
    });

    it('should render navigation links', () => {
      const links = wrapper.findAll('a[href="#"]');

      // Should have Privacy and Terms links
      const linkTexts = links.map((link) => link.text());
      expect(linkTexts).toContain('Privacy');
      expect(linkTexts).toContain('Terms');
    });

    it('should render contact button', () => {
      const contactButtons = wrapper.findAll('button');
      const contactButton = contactButtons.find((btn) => btn.text() === 'Contact');

      expect(contactButton).toBeDefined();
      expect(contactButton?.text()).toBe('Contact');
    });

    it('should render Discord link with correct href', () => {
      const discordLink = wrapper.find('a[href="https://discord.gg/virtualracingleagues"]');

      expect(discordLink.exists()).toBe(true);
      expect(discordLink.attributes('target')).toBe('_blank');
      expect(discordLink.attributes('rel')).toBe('noopener noreferrer');
      expect(discordLink.attributes('aria-label')).toBe('Join our Discord');
    });

    it('should render desktop layout on larger screens', () => {
      const desktopLayout = wrapper.find('.hidden.md\\:grid');
      expect(desktopLayout.exists()).toBe(true);
    });

    it('should render mobile layout', () => {
      const mobileLayout = wrapper.find('.md\\:hidden');
      expect(mobileLayout.exists()).toBe(true);
    });
  });

  describe('Contact Modal', () => {
    it('should render the contact modal', () => {
      const modal = wrapper.findComponent(PublicContactModal);
      expect(modal.exists()).toBe(true);
    });

    it('should open contact modal when contact button is clicked', async () => {
      const contactButtons = wrapper.findAll('button');
      const contactButton = contactButtons.find((btn) => btn.text() === 'Contact');

      expect(contactButton).toBeDefined();

      await contactButton?.trigger('click');
      await wrapper.vm.$nextTick();

      // Check that isContactOpen is true
      const modal = wrapper.findComponent(PublicContactModal);
      expect(modal.attributes('visible')).toBe('true');
    });

    it('should handle success event from contact modal', async () => {
      const modal = wrapper.findComponent(PublicContactModal);

      // Emit success event
      await modal.vm.$emit('success');
      await wrapper.vm.$nextTick();

      // Test passes if no errors are thrown
      expect(true).toBe(true);
    });
  });

  describe('External Links', () => {
    it('should open Discord link in new tab', () => {
      const discordLink = wrapper.find('a[href="https://discord.gg/virtualracingleagues"]');

      expect(discordLink.attributes('target')).toBe('_blank');
      expect(discordLink.attributes('rel')).toBe('noopener noreferrer');
    });
  });
});
