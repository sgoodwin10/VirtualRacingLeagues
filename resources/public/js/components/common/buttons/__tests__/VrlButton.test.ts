import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import VrlButton from '../VrlButton.vue';

describe('VrlButton', () => {
  describe('Rendering', () => {
    it('renders with default props', () => {
      const wrapper = mount(VrlButton, {
        slots: { default: 'Click Me' },
      });
      expect(wrapper.text()).toBe('Click Me');
      expect(wrapper.element.tagName).toBe('BUTTON');
    });

    it('renders slot content correctly', () => {
      const wrapper = mount(VrlButton, {
        slots: { default: 'Get Started Free' },
      });
      expect(wrapper.text()).toBe('Get Started Free');
    });

    it('has correct default type attribute', () => {
      const wrapper = mount(VrlButton);
      expect(wrapper.attributes('type')).toBe('button');
    });
  });

  describe('Type Prop', () => {
    it('renders with type="submit"', () => {
      const wrapper = mount(VrlButton, {
        props: { type: 'submit' },
      });
      expect(wrapper.attributes('type')).toBe('submit');
    });

    it('renders with type="reset"', () => {
      const wrapper = mount(VrlButton, {
        props: { type: 'reset' },
      });
      expect(wrapper.attributes('type')).toBe('reset');
    });
  });

  describe('Size Prop', () => {
    it('applies xs size classes', () => {
      const wrapper = mount(VrlButton, {
        props: { size: 'xs' },
      });
      expect(wrapper.classes()).toContain('px-2.5');
      expect(wrapper.classes()).toContain('py-1.5');
      expect(wrapper.classes()).toContain('text-[9px]');
    });

    it('applies sm size classes', () => {
      const wrapper = mount(VrlButton, {
        props: { size: 'sm' },
      });
      expect(wrapper.classes()).toContain('px-3.5');
      expect(wrapper.classes()).toContain('py-2');
      expect(wrapper.classes()).toContain('text-[10px]');
    });

    it('applies md size classes (default)', () => {
      const wrapper = mount(VrlButton);
      expect(wrapper.classes()).toContain('px-5');
      expect(wrapper.classes()).toContain('py-2.5');
      expect(wrapper.classes()).toContain('text-xs');
    });

    it('applies lg size classes', () => {
      const wrapper = mount(VrlButton, {
        props: { size: 'lg' },
      });
      expect(wrapper.classes()).toContain('px-6');
      expect(wrapper.classes()).toContain('py-3');
      expect(wrapper.classes()).toContain('text-sm');
    });

    it('applies xl size classes', () => {
      const wrapper = mount(VrlButton, {
        props: { size: 'xl' },
      });
      expect(wrapper.classes()).toContain('px-8');
      expect(wrapper.classes()).toContain('py-4');
      expect(wrapper.classes()).toContain('text-base');
    });
  });

  describe('Variant Prop', () => {
    it('applies primary variant classes (default)', () => {
      const wrapper = mount(VrlButton);
      expect(wrapper.classes()).toContain('bg-racing-safety');
      expect(wrapper.classes()).toContain('text-racing-pit-white');
      expect(wrapper.classes()).toContain('btn-shine');
    });

    it('applies secondary variant classes', () => {
      const wrapper = mount(VrlButton, {
        props: { variant: 'secondary' },
      });
      expect(wrapper.classes()).toContain('bg-transparent');
      expect(wrapper.classes()).toContain('text-racing-gold');
      expect(wrapper.classes()).toContain('border');
      expect(wrapper.classes()).toContain('border-racing-gold');
    });

    it('applies ghost variant classes', () => {
      const wrapper = mount(VrlButton, {
        props: { variant: 'ghost' },
      });
      expect(wrapper.classes()).toContain('bg-transparent');
      expect(wrapper.classes()).toContain('theme-text-muted');
      expect(wrapper.classes()).toContain('theme-bg-tertiary');
    });

    it('applies text variant classes', () => {
      const wrapper = mount(VrlButton, {
        props: { variant: 'text' },
      });
      expect(wrapper.classes()).toContain('bg-transparent');
      expect(wrapper.classes()).toContain('theme-text-muted');
    });

    it('applies danger variant classes', () => {
      const wrapper = mount(VrlButton, {
        props: { variant: 'danger' },
      });
      expect(wrapper.classes()).toContain('bg-racing-danger');
      expect(wrapper.classes()).toContain('text-racing-pit-white');
    });

    it('applies danger-outline variant classes', () => {
      const wrapper = mount(VrlButton, {
        props: { variant: 'danger-outline' },
      });
      expect(wrapper.classes()).toContain('bg-transparent');
      expect(wrapper.classes()).toContain('text-racing-danger');
      expect(wrapper.classes()).toContain('border');
    });
  });

  describe('Icon Prop', () => {
    it('renders icon on left by default', () => {
      const wrapper = mount(VrlButton, {
        props: { icon: 'plus' },
        slots: { default: 'Add' },
      });
      const icons = wrapper.findAll('svg');
      expect(icons.length).toBe(1);
    });

    it('renders icon on right when iconPos="right"', () => {
      const wrapper = mount(VrlButton, {
        props: { icon: 'eye', iconPos: 'right' },
        slots: { default: 'View' },
      });
      const icons = wrapper.findAll('svg');
      expect(icons.length).toBe(1);
    });

    it('does not render icon when icon prop is undefined', () => {
      const wrapper = mount(VrlButton, {
        slots: { default: 'No Icon' },
      });
      const icons = wrapper.findAll('svg');
      expect(icons.length).toBe(0);
    });

    it('renders trash icon correctly', () => {
      const wrapper = mount(VrlButton, {
        props: { icon: 'trash' },
      });
      expect(wrapper.find('svg').exists()).toBe(true);
    });

    it('renders eye icon correctly', () => {
      const wrapper = mount(VrlButton, {
        props: { icon: 'eye' },
      });
      expect(wrapper.find('svg').exists()).toBe(true);
    });
  });

  describe('Disabled State', () => {
    it('sets disabled attribute when disabled=true', () => {
      const wrapper = mount(VrlButton, {
        props: { disabled: true },
      });
      expect(wrapper.attributes('disabled')).toBeDefined();
    });

    it('does not emit click event when disabled', async () => {
      const wrapper = mount(VrlButton, {
        props: { disabled: true },
      });
      await wrapper.trigger('click');
      expect(wrapper.emitted('click')).toBeFalsy();
    });

    it('is not disabled by default', () => {
      const wrapper = mount(VrlButton);
      expect(wrapper.attributes('disabled')).toBeUndefined();
    });

    it('applies disabled styles when disabled=true', () => {
      const wrapper = mount(VrlButton, {
        props: { disabled: true },
      });
      expect(wrapper.classes()).toContain('disabled:opacity-50');
      expect(wrapper.classes()).toContain('disabled:cursor-not-allowed');
    });
  });

  describe('Loading State', () => {
    it('sets disabled attribute when loading=true', () => {
      const wrapper = mount(VrlButton, {
        props: { loading: true },
      });
      expect(wrapper.attributes('disabled')).toBeDefined();
    });

    it('does not emit click event when loading', async () => {
      const wrapper = mount(VrlButton, {
        props: { loading: true },
      });
      await wrapper.trigger('click');
      expect(wrapper.emitted('click')).toBeFalsy();
    });

    it('shows loading spinner when loading=true', () => {
      const wrapper = mount(VrlButton, {
        props: { loading: true },
        slots: { default: 'Loading...' },
      });
      const spinner = wrapper.find('.animate-spin');
      expect(spinner.exists()).toBe(true);
    });

    it('hides icon when loading=true', () => {
      const wrapper = mount(VrlButton, {
        props: { loading: true, icon: 'plus' },
        slots: { default: 'Loading...' },
      });
      const spinner = wrapper.find('.animate-spin');
      expect(spinner.exists()).toBe(true);
      // Only the spinner should be present, not the plus icon
      const icons = wrapper.findAll('svg');
      expect(icons.length).toBe(1);
    });

    it('applies disabled styles when loading', () => {
      const wrapper = mount(VrlButton, {
        props: { loading: true },
      });
      expect(wrapper.classes()).toContain('disabled:opacity-50');
      expect(wrapper.classes()).toContain('disabled:cursor-not-allowed');
    });
  });

  describe('Click Events', () => {
    it('emits click event when clicked', async () => {
      const wrapper = mount(VrlButton);
      await wrapper.trigger('click');
      expect(wrapper.emitted('click')).toBeTruthy();
      expect(wrapper.emitted('click')?.[0]).toBeDefined();
    });

    it('passes mouse event to click handler', async () => {
      const wrapper = mount(VrlButton);
      await wrapper.trigger('click');
      const emittedEvent = wrapper.emitted('click')?.[0]?.[0];
      expect(emittedEvent).toBeInstanceOf(MouseEvent);
    });

    it('can be clicked multiple times', async () => {
      const wrapper = mount(VrlButton);
      await wrapper.trigger('click');
      await wrapper.trigger('click');
      await wrapper.trigger('click');
      expect(wrapper.emitted('click')).toHaveLength(3);
    });
  });

  describe('Base Classes', () => {
    it('always includes inline-flex class', () => {
      const wrapper = mount(VrlButton);
      expect(wrapper.classes()).toContain('inline-flex');
    });

    it('always includes items-center class', () => {
      const wrapper = mount(VrlButton);
      expect(wrapper.classes()).toContain('items-center');
    });

    it('always includes font-display class', () => {
      const wrapper = mount(VrlButton);
      expect(wrapper.classes()).toContain('font-display');
    });

    it('always includes uppercase class', () => {
      const wrapper = mount(VrlButton);
      expect(wrapper.classes()).toContain('uppercase');
    });

    it('always includes tracking-wider class', () => {
      const wrapper = mount(VrlButton);
      expect(wrapper.classes()).toContain('tracking-wider');
    });
  });

  describe('Custom Class Prop', () => {
    it('applies custom classes from class prop', () => {
      const wrapper = mount(VrlButton, {
        props: { class: 'custom-class' },
      });
      expect(wrapper.classes()).toContain('custom-class');
    });

    it('combines custom classes with variant and size classes', () => {
      const wrapper = mount(VrlButton, {
        props: { variant: 'secondary', size: 'lg', class: 'mt-4' },
      });
      expect(wrapper.classes()).toContain('mt-4');
      expect(wrapper.classes()).toContain('bg-transparent');
      expect(wrapper.classes()).toContain('px-6');
    });
  });

  describe('Accessibility', () => {
    it('has type="button" for semantic clarity', () => {
      const wrapper = mount(VrlButton);
      expect(wrapper.attributes('type')).toBe('button');
    });

    it('is focusable when not disabled', () => {
      const wrapper = mount(VrlButton);
      expect(wrapper.attributes('disabled')).toBeUndefined();
    });

    it('is not focusable when disabled', () => {
      const wrapper = mount(VrlButton, {
        props: { disabled: true },
      });
      expect(wrapper.attributes('disabled')).toBeDefined();
    });
  });

  describe('Icon Size Integration', () => {
    it('applies correct icon size for xs button', () => {
      const wrapper = mount(VrlButton, {
        props: { icon: 'plus', size: 'xs' },
      });
      const icon = wrapper.find('svg');
      expect(icon.classes()).toContain('text-[10px]');
    });

    it('applies correct icon size for md button', () => {
      const wrapper = mount(VrlButton, {
        props: { icon: 'plus', size: 'md' },
      });
      const icon = wrapper.find('svg');
      expect(icon.classes()).toContain('text-sm');
    });

    it('applies correct icon size for xl button', () => {
      const wrapper = mount(VrlButton, {
        props: { icon: 'plus', size: 'xl' },
      });
      const icon = wrapper.find('svg');
      expect(icon.classes()).toContain('text-lg');
    });
  });

  describe('Edge Cases', () => {
    it('handles empty slot content', () => {
      const wrapper = mount(VrlButton);
      expect(wrapper.exists()).toBe(true);
    });

    it('handles both disabled and loading states', () => {
      const wrapper = mount(VrlButton, {
        props: { disabled: true, loading: true },
      });
      expect(wrapper.attributes('disabled')).toBeDefined();
    });

    it('handles invalid icon name gracefully', () => {
      const wrapper = mount(VrlButton, {
        props: { icon: 'nonexistent-icon' },
      });
      const icons = wrapper.findAll('svg');
      expect(icons.length).toBe(0);
    });
  });
});
