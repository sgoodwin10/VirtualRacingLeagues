import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import VrlCard from './VrlCard.vue';

describe('VrlCard', () => {
  describe('Rendering', () => {
    it('renders with default props', () => {
      const wrapper = mount(VrlCard, {
        slots: {
          default: 'Card content',
        },
      });

      expect(wrapper.exists()).toBe(true);
      expect(wrapper.text()).toContain('Card content');
      expect(wrapper.classes()).toContain('card-racing');
    });

    it('renders with custom class', () => {
      const wrapper = mount(VrlCard, {
        props: {
          class: 'custom-class',
        },
      });

      expect(wrapper.classes()).toContain('custom-class');
    });
  });

  describe('Variants', () => {
    it('renders default variant', () => {
      const wrapper = mount(VrlCard, {
        props: {
          variant: 'default',
        },
      });

      expect(wrapper.classes()).toContain('card-racing');
      expect(wrapper.classes()).not.toContain('gradient-border');
    });

    it('renders league variant', () => {
      const wrapper = mount(VrlCard, {
        props: {
          variant: 'league',
        },
      });

      expect(wrapper.classes()).toContain('card-racing');
    });

    it('renders stats variant with gradient border', () => {
      const wrapper = mount(VrlCard, {
        props: {
          variant: 'stats',
        },
      });

      expect(wrapper.classes()).toContain('gradient-border');
    });

    it('renders feature variant with animated top border', () => {
      const wrapper = mount(VrlCard, {
        props: {
          variant: 'feature',
        },
      });

      const topBorder = wrapper.find('.bg-gradient-to-r');
      expect(topBorder.exists()).toBe(true);
      expect(topBorder.classes()).toContain('from-racing-gold');
      expect(topBorder.classes()).toContain('to-racing-safety');
    });

    it('does not render top border for non-feature variants', () => {
      const wrapper = mount(VrlCard, {
        props: {
          variant: 'default',
        },
      });

      const topBorder = wrapper.find('.bg-gradient-to-r');
      expect(topBorder.exists()).toBe(false);
    });
  });

  describe('Hoverable', () => {
    it('adds cursor-pointer class when hoverable is true', () => {
      const wrapper = mount(VrlCard, {
        props: {
          hoverable: true,
        },
      });

      expect(wrapper.classes()).toContain('cursor-pointer');
    });

    it('does not add cursor-pointer class when hoverable is false', () => {
      const wrapper = mount(VrlCard, {
        props: {
          hoverable: false,
        },
      });

      expect(wrapper.classes()).not.toContain('cursor-pointer');
    });

    it('adds group class for feature variant', () => {
      const wrapper = mount(VrlCard, {
        props: {
          variant: 'feature',
        },
      });

      expect(wrapper.classes()).toContain('group');
    });
  });

  describe('Slots', () => {
    it('renders header slot when provided', () => {
      const wrapper = mount(VrlCard, {
        slots: {
          header: '<div class="test-header">Header content</div>',
        },
      });

      const header = wrapper.find('.card-header');
      expect(header.exists()).toBe(true);
      expect(header.html()).toContain('Header content');
    });

    it('does not render header slot when not provided', () => {
      const wrapper = mount(VrlCard);

      const header = wrapper.find('.card-header');
      expect(header.exists()).toBe(false);
    });

    it('renders default slot', () => {
      const wrapper = mount(VrlCard, {
        slots: {
          default: '<p>Main content</p>',
        },
      });

      const body = wrapper.find('.card-body');
      expect(body.exists()).toBe(true);
      expect(body.html()).toContain('Main content');
    });

    it('renders footer slot when provided', () => {
      const wrapper = mount(VrlCard, {
        slots: {
          footer: '<div class="test-footer">Footer content</div>',
        },
      });

      const footer = wrapper.find('.card-footer');
      expect(footer.exists()).toBe(true);
      expect(footer.html()).toContain('Footer content');
    });

    it('does not render footer slot when not provided', () => {
      const wrapper = mount(VrlCard);

      const footer = wrapper.find('.card-footer');
      expect(footer.exists()).toBe(false);
    });

    it('renders all slots together', () => {
      const wrapper = mount(VrlCard, {
        slots: {
          header: 'Header',
          default: 'Body',
          footer: 'Footer',
        },
      });

      expect(wrapper.text()).toContain('Header');
      expect(wrapper.text()).toContain('Body');
      expect(wrapper.text()).toContain('Footer');
    });
  });

  describe('Styling', () => {
    it('has correct base classes', () => {
      const wrapper = mount(VrlCard);

      expect(wrapper.classes()).toContain('card-racing');
      expect(wrapper.classes()).toContain('rounded');
      expect(wrapper.classes()).toContain('transition-all');
    });

    it('applies transition duration and easing', () => {
      const wrapper = mount(VrlCard);

      expect(wrapper.classes()).toContain('duration-300');
      expect(wrapper.classes()).toContain('ease-[cubic-bezier(0.16,1,0.3,1)]');
    });
  });
});
