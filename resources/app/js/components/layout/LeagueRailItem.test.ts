import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import LeagueRailItem from '@app/components/layout/LeagueRailItem.vue';
import PrimeVue from 'primevue/config';
import Tooltip from 'primevue/tooltip';

describe('LeagueRailItem', () => {
  const defaultProps = {
    name: 'Test League',
  };

  const createWrapper = (props = {}) => {
    return mount(LeagueRailItem, {
      props: { ...defaultProps, ...props },
      global: {
        plugins: [PrimeVue],
        directives: {
          tooltip: Tooltip,
        },
      },
    });
  };

  describe('rendering', () => {
    it('renders a button element', () => {
      const wrapper = createWrapper();
      expect(wrapper.find('button').exists()).toBe(true);
    });

    it('applies the base class', () => {
      const wrapper = createWrapper();
      expect(wrapper.find('.league-rail-item').exists()).toBe(true);
    });

    it('applies active class when active prop is true', () => {
      const wrapper = createWrapper({ active: true });
      expect(wrapper.find('.league-rail-item.active').exists()).toBe(true);
    });

    it('does not apply active class when active prop is false', () => {
      const wrapper = createWrapper({ active: false });
      expect(wrapper.find('.league-rail-item.active').exists()).toBe(false);
    });

    it('sets aria-label from tooltip prop', () => {
      const wrapper = createWrapper({ tooltip: 'Test Tooltip' });
      expect(wrapper.find('button').attributes('aria-label')).toBe('Test Tooltip');
    });

    it('sets aria-current to "page" when active', () => {
      const wrapper = createWrapper({ active: true });
      expect(wrapper.find('button').attributes('aria-current')).toBe('page');
    });

    it('does not set aria-current when inactive', () => {
      const wrapper = createWrapper({ active: false });
      expect(wrapper.find('button').attributes('aria-current')).toBeUndefined();
    });
  });

  describe('logo rendering', () => {
    it('renders logo image when logoUrl is provided', () => {
      const logoUrl = 'https://example.com/logo.png';
      const wrapper = createWrapper({ logoUrl });

      const img = wrapper.find('img.league-logo');
      expect(img.exists()).toBe(true);
      expect(img.attributes('src')).toBe(logoUrl);
      expect(img.attributes('alt')).toBe('Test League logo');
    });

    it('renders placeholder when logoUrl is not provided', () => {
      const wrapper = createWrapper({ logoUrl: null });

      expect(wrapper.find('img').exists()).toBe(false);
      const placeholder = wrapper.find('.league-placeholder');
      expect(placeholder.exists()).toBe(true);
      expect(placeholder.text()).toBe('T'); // First letter of 'Test League'
    });

    it('renders placeholder when logoUrl is empty string', () => {
      const wrapper = createWrapper({ logoUrl: '' });

      expect(wrapper.find('img').exists()).toBe(false);
      const placeholder = wrapper.find('.league-placeholder');
      expect(placeholder.exists()).toBe(true);
      expect(placeholder.text()).toBe('T');
    });

    it('shows correct first letter in placeholder', () => {
      const wrapper = createWrapper({ name: 'Formula 1 League', logoUrl: null });

      const placeholder = wrapper.find('.league-placeholder');
      expect(placeholder.text()).toBe('F');
    });

    it('uppercases first letter in placeholder', () => {
      const wrapper = createWrapper({ name: 'racing league', logoUrl: null });

      const placeholder = wrapper.find('.league-placeholder');
      expect(placeholder.text()).toBe('R');
    });
  });

  describe('interactions', () => {
    it('emits click event when clicked', async () => {
      const wrapper = createWrapper();

      await wrapper.find('button').trigger('click');

      expect(wrapper.emitted('click')).toBeTruthy();
      expect(wrapper.emitted('click')).toHaveLength(1);
    });

    it('emits click event multiple times when clicked multiple times', async () => {
      const wrapper = createWrapper();

      await wrapper.find('button').trigger('click');
      await wrapper.find('button').trigger('click');
      await wrapper.find('button').trigger('click');

      expect(wrapper.emitted('click')).toHaveLength(3);
    });
  });

  describe('accessibility', () => {
    it('has correct role for button', () => {
      const wrapper = createWrapper();
      const button = wrapper.find('button');
      expect(button.element.tagName).toBe('BUTTON');
    });

    it('is keyboard accessible', () => {
      const wrapper = createWrapper();
      const button = wrapper.find('button');
      // Buttons are inherently keyboard accessible
      expect(button.element.tabIndex).toBeGreaterThanOrEqual(0);
    });

    it('provides proper alt text for logo images', () => {
      const wrapper = createWrapper({
        name: 'My Racing League',
        logoUrl: 'https://example.com/logo.png',
      });

      const img = wrapper.find('img');
      expect(img.attributes('alt')).toBe('My Racing League logo');
    });
  });

  describe('edge cases', () => {
    it('handles empty name gracefully', () => {
      const wrapper = createWrapper({ name: '', logoUrl: null });

      const placeholder = wrapper.find('.league-placeholder');
      expect(placeholder.text()).toBe(''); // Empty string charAt(0) returns ''
    });

    it('handles single character name', () => {
      const wrapper = createWrapper({ name: 'X', logoUrl: null });

      const placeholder = wrapper.find('.league-placeholder');
      expect(placeholder.text()).toBe('X');
    });

    it('handles name with leading whitespace', () => {
      const wrapper = createWrapper({ name: '  League', logoUrl: null });

      const placeholder = wrapper.find('.league-placeholder');
      // Vue templates trim whitespace by default, so we get an empty string
      expect(placeholder.text()).toBe('');
    });

    it('handles unicode characters in name', () => {
      const wrapper = createWrapper({ name: '日本語 League', logoUrl: null });

      const placeholder = wrapper.find('.league-placeholder');
      expect(placeholder.text()).toBe('日');
    });
  });
});
