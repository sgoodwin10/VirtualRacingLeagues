import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import VrlLabel from '../VrlLabel.vue';

describe('VrlLabel', () => {
  describe('Rendering', () => {
    it('renders with default props', () => {
      const wrapper = mount(VrlLabel, {
        slots: { default: 'Username' },
      });
      expect(wrapper.text()).toBe('Username');
      expect(wrapper.element.tagName).toBe('LABEL');
    });

    it('renders slot content correctly', () => {
      const wrapper = mount(VrlLabel, {
        slots: { default: 'Email Address' },
      });
      expect(wrapper.text()).toBe('Email Address');
    });

    it('renders with HTML content in slot', () => {
      const wrapper = mount(VrlLabel, {
        slots: { default: 'First <span>Name</span>' },
      });
      expect(wrapper.html()).toContain('<span>Name</span>');
    });
  });

  describe('For Attribute (htmlFor)', () => {
    it('binds htmlFor attribute when for prop is provided', () => {
      const wrapper = mount(VrlLabel, {
        props: { for: 'username-input' },
        slots: { default: 'Username' },
      });
      expect(wrapper.attributes('for')).toBe('username-input');
    });

    it('does not have for attribute when prop is not provided', () => {
      const wrapper = mount(VrlLabel, {
        slots: { default: 'Username' },
      });
      expect(wrapper.attributes('for')).toBeUndefined();
    });

    it('accepts empty string for for attribute', () => {
      const wrapper = mount(VrlLabel, {
        props: { for: '' },
        slots: { default: 'Label' },
      });
      expect(wrapper.attributes('for')).toBe('');
    });
  });

  describe('Required Indicator', () => {
    it('shows asterisk when required is true', () => {
      const wrapper = mount(VrlLabel, {
        props: { required: true },
        slots: { default: 'Password' },
      });
      expect(wrapper.text()).toContain('*');
      const asterisk = wrapper.find('.text-racing-safety');
      expect(asterisk.exists()).toBe(true);
      expect(asterisk.text()).toBe('*');
    });

    it('does not show asterisk when required is false', () => {
      const wrapper = mount(VrlLabel, {
        props: { required: false },
        slots: { default: 'Optional Field' },
      });
      expect(wrapper.text()).not.toContain('*');
      const asterisk = wrapper.find('.text-racing-safety');
      expect(asterisk.exists()).toBe(false);
    });

    it('does not show asterisk by default (required defaults to false)', () => {
      const wrapper = mount(VrlLabel, {
        slots: { default: 'Email' },
      });
      expect(wrapper.text()).not.toContain('*');
      const asterisk = wrapper.find('.text-racing-safety');
      expect(asterisk.exists()).toBe(false);
    });

    it('positions asterisk after label text', () => {
      const wrapper = mount(VrlLabel, {
        props: { required: true },
        slots: { default: 'Username' },
      });
      const text = wrapper.text();
      expect(text).toBe('Username*');
      expect(text.indexOf('Username')).toBe(0);
      expect(text.indexOf('*')).toBeGreaterThan(text.indexOf('Username'));
    });
  });

  describe('Base Styling Classes', () => {
    it('always includes block class', () => {
      const wrapper = mount(VrlLabel, {
        slots: { default: 'Test' },
      });
      expect(wrapper.classes()).toContain('block');
    });

    it('always includes mb-2 class for bottom margin', () => {
      const wrapper = mount(VrlLabel, {
        slots: { default: 'Test' },
      });
      expect(wrapper.classes()).toContain('mb-2');
    });

    it('always includes font-display class', () => {
      const wrapper = mount(VrlLabel, {
        slots: { default: 'Test' },
      });
      expect(wrapper.classes()).toContain('font-display');
    });

    it('always includes text-[10px] class', () => {
      const wrapper = mount(VrlLabel, {
        slots: { default: 'Test' },
      });
      expect(wrapper.classes()).toContain('text-[10px]');
    });

    it('always includes uppercase class', () => {
      const wrapper = mount(VrlLabel, {
        slots: { default: 'Test' },
      });
      expect(wrapper.classes()).toContain('uppercase');
    });

    it('always includes tracking-wider class', () => {
      const wrapper = mount(VrlLabel, {
        slots: { default: 'Test' },
      });
      expect(wrapper.classes()).toContain('tracking-wider');
    });

    it('always includes theme-text-dim class', () => {
      const wrapper = mount(VrlLabel, {
        slots: { default: 'Test' },
      });
      expect(wrapper.classes()).toContain('theme-text-dim');
    });
  });

  describe('Combined Props', () => {
    it('renders with both for and required props', () => {
      const wrapper = mount(VrlLabel, {
        props: {
          for: 'password-input',
          required: true,
        },
        slots: { default: 'Password' },
      });
      expect(wrapper.attributes('for')).toBe('password-input');
      expect(wrapper.text()).toContain('*');
      expect(wrapper.text()).toBe('Password*');
    });

    it('renders label text with for attribute and no required indicator', () => {
      const wrapper = mount(VrlLabel, {
        props: {
          for: 'email-input',
          required: false,
        },
        slots: { default: 'Email' },
      });
      expect(wrapper.attributes('for')).toBe('email-input');
      expect(wrapper.text()).toBe('Email');
      expect(wrapper.text()).not.toContain('*');
    });
  });

  describe('Accessibility', () => {
    it('is a semantic label element', () => {
      const wrapper = mount(VrlLabel, {
        slots: { default: 'Field Label' },
      });
      expect(wrapper.element.tagName).toBe('LABEL');
    });

    it('properly associates with input via for attribute', () => {
      const wrapper = mount(VrlLabel, {
        props: { for: 'test-input' },
        slots: { default: 'Test Input' },
      });
      expect(wrapper.attributes('for')).toBe('test-input');
    });

    it('visually indicates required fields with asterisk', () => {
      const wrapper = mount(VrlLabel, {
        props: { required: true },
        slots: { default: 'Required Field' },
      });
      const asterisk = wrapper.find('.text-racing-safety');
      expect(asterisk.exists()).toBe(true);
      expect(asterisk.isVisible()).toBe(true);
    });

    it('has sufficient contrast with theme-text-dim class', () => {
      const wrapper = mount(VrlLabel, {
        slots: { default: 'Accessible Label' },
      });
      expect(wrapper.classes()).toContain('theme-text-dim');
    });
  });

  describe('Edge Cases', () => {
    it('handles empty slot content', () => {
      const wrapper = mount(VrlLabel);
      expect(wrapper.exists()).toBe(true);
      expect(wrapper.element.tagName).toBe('LABEL');
    });

    it('handles empty slot with required indicator', () => {
      const wrapper = mount(VrlLabel, {
        props: { required: true },
      });
      expect(wrapper.text()).toBe('*');
      const asterisk = wrapper.find('.text-racing-safety');
      expect(asterisk.exists()).toBe(true);
    });

    it('handles multiple child elements in slot', () => {
      const wrapper = mount(VrlLabel, {
        slots: {
          default: '<span>First</span><span>Second</span>',
        },
      });
      expect(wrapper.findAll('span')).toHaveLength(2);
    });

    it('handles special characters in slot content', () => {
      const wrapper = mount(VrlLabel, {
        slots: { default: 'Email & Username' },
      });
      expect(wrapper.text()).toContain('Email & Username');
    });

    it('handles very long label text', () => {
      const longText = 'This is a very long label text that might wrap to multiple lines in the UI';
      const wrapper = mount(VrlLabel, {
        slots: { default: longText },
      });
      expect(wrapper.text()).toContain(longText);
    });

    it('handles numeric content in slot', () => {
      const wrapper = mount(VrlLabel, {
        slots: { default: '123' },
      });
      expect(wrapper.text()).toBe('123');
    });

    it('handles mixed content with required indicator', () => {
      const wrapper = mount(VrlLabel, {
        props: { required: true },
        slots: { default: '<span>Complex</span> Label' },
      });
      expect(wrapper.html()).toContain('<span>Complex</span>');
      expect(wrapper.text()).toContain('Complex Label*');
    });
  });

  describe('Slot Content Preservation', () => {
    it('preserves HTML structure in slot', () => {
      const wrapper = mount(VrlLabel, {
        slots: {
          default: '<strong>Important</strong> Field',
        },
      });
      const strong = wrapper.find('strong');
      expect(strong.exists()).toBe(true);
      expect(strong.text()).toBe('Important');
    });

    it('renders asterisk after all slot content', () => {
      const wrapper = mount(VrlLabel, {
        props: { required: true },
        slots: {
          default: '<span>Nested</span> Content',
        },
      });
      const html = wrapper.html();
      const asteriskIndex = html.indexOf('text-racing-safety');
      const contentIndex = html.indexOf('Content');
      expect(asteriskIndex).toBeGreaterThan(contentIndex);
    });
  });
});
