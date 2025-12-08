import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import VrlToggle from '../VrlToggle.vue';

describe('VrlToggle', () => {
  it('renders with default props', () => {
    const wrapper = mount(VrlToggle, {
      props: {
        modelValue: false,
      },
    });

    const toggle = wrapper.find('[role="switch"]');
    expect(toggle.exists()).toBe(true);
  });

  describe('v-model binding', () => {
    it('displays active state', () => {
      const wrapper = mount(VrlToggle, {
        props: {
          modelValue: true,
        },
      });

      const toggle = wrapper.find('[role="switch"]');
      expect(toggle.attributes('aria-checked')).toBe('true');
      expect(toggle.classes()).toContain('bg-racing-gold');
    });

    it('displays inactive state', () => {
      const wrapper = mount(VrlToggle, {
        props: {
          modelValue: false,
        },
      });

      const toggle = wrapper.find('[role="switch"]');
      expect(toggle.attributes('aria-checked')).toBe('false');
      expect(toggle.classes()).toContain('theme-bg-tertiary');
    });

    it('emits update:modelValue on click', async () => {
      const wrapper = mount(VrlToggle, {
        props: {
          modelValue: false,
        },
      });

      const toggle = wrapper.find('[role="switch"]');
      await toggle.trigger('click');

      expect(wrapper.emitted('update:modelValue')).toBeTruthy();
      expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([true]);
    });

    it('toggles from true to false', async () => {
      const wrapper = mount(VrlToggle, {
        props: {
          modelValue: true,
        },
      });

      const toggle = wrapper.find('[role="switch"]');
      await toggle.trigger('click');

      expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([false]);
    });
  });

  describe('keyboard interaction', () => {
    it('toggles on Space key', async () => {
      const wrapper = mount(VrlToggle, {
        props: {
          modelValue: false,
        },
      });

      const toggle = wrapper.find('[role="switch"]');
      await toggle.trigger('keydown', { key: ' ' });

      expect(wrapper.emitted('update:modelValue')).toBeTruthy();
      expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([true]);
    });

    it('toggles on Enter key', async () => {
      const wrapper = mount(VrlToggle, {
        props: {
          modelValue: false,
        },
      });

      const toggle = wrapper.find('[role="switch"]');
      await toggle.trigger('keydown', { key: 'Enter' });

      expect(wrapper.emitted('update:modelValue')).toBeTruthy();
      expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([true]);
    });

    it('does not toggle on other keys', async () => {
      const wrapper = mount(VrlToggle, {
        props: {
          modelValue: false,
        },
      });

      const toggle = wrapper.find('[role="switch"]');
      await toggle.trigger('keydown', { key: 'a' });

      expect(wrapper.emitted('update:modelValue')).toBeFalsy();
    });
  });

  describe('size prop', () => {
    it('renders small size', () => {
      const wrapper = mount(VrlToggle, {
        props: {
          modelValue: false,
          size: 'sm',
        },
      });

      const toggle = wrapper.find('[role="switch"]');
      expect(toggle.classes()).toContain('w-9');
      expect(toggle.classes()).toContain('h-5');
    });

    it('renders medium size (default)', () => {
      const wrapper = mount(VrlToggle, {
        props: {
          modelValue: false,
          size: 'md',
        },
      });

      const toggle = wrapper.find('[role="switch"]');
      expect(toggle.classes()).toContain('w-11');
      expect(toggle.classes()).toContain('h-6');
    });

    it('renders large size', () => {
      const wrapper = mount(VrlToggle, {
        props: {
          modelValue: false,
          size: 'lg',
        },
      });

      const toggle = wrapper.find('[role="switch"]');
      expect(toggle.classes()).toContain('w-[52px]');
      expect(toggle.classes()).toContain('h-7');
    });
  });

  describe('disabled state', () => {
    it('applies disabled styling', () => {
      const wrapper = mount(VrlToggle, {
        props: {
          modelValue: false,
          disabled: true,
        },
      });

      const toggle = wrapper.find('[role="switch"]');
      expect(toggle.attributes('aria-disabled')).toBe('true');
      expect(toggle.classes()).toContain('opacity-50');
      expect(toggle.classes()).toContain('cursor-not-allowed');
    });

    it('does not emit when disabled on click', async () => {
      const wrapper = mount(VrlToggle, {
        props: {
          modelValue: false,
          disabled: true,
        },
      });

      const toggle = wrapper.find('[role="switch"]');
      await toggle.trigger('click');

      expect(wrapper.emitted('update:modelValue')).toBeFalsy();
    });

    it('does not emit when disabled on keyboard', async () => {
      const wrapper = mount(VrlToggle, {
        props: {
          modelValue: false,
          disabled: true,
        },
      });

      const toggle = wrapper.find('[role="switch"]');
      await toggle.trigger('keydown', { key: ' ' });

      expect(wrapper.emitted('update:modelValue')).toBeFalsy();
    });
  });

  describe('label prop', () => {
    it('displays label without description', () => {
      const wrapper = mount(VrlToggle, {
        props: {
          modelValue: false,
          label: 'Enable feature',
        },
      });

      expect(wrapper.text()).toContain('Enable feature');
      const label = wrapper.find('label');
      expect(label.exists()).toBe(true);
    });

    it('renders without label wrapper when no label provided', () => {
      const wrapper = mount(VrlToggle, {
        props: {
          modelValue: false,
        },
      });

      const labels = wrapper.findAll('label');
      expect(labels.length).toBe(1); // Only the simple wrapper
    });
  });

  describe('description prop', () => {
    it('displays label and description in card layout', () => {
      const wrapper = mount(VrlToggle, {
        props: {
          modelValue: false,
          label: 'Email Notifications',
          description: 'Receive email updates about race results',
        },
      });

      expect(wrapper.text()).toContain('Email Notifications');
      expect(wrapper.text()).toContain('Receive email updates about race results');

      // Should use card layout
      const card = wrapper.find('.theme-bg-tertiary');
      expect(card.exists()).toBe(true);
    });

    it('applies unique aria-describedby when description is present', () => {
      const wrapper = mount(VrlToggle, {
        props: {
          modelValue: false,
          label: 'Test',
          description: 'Test description',
        },
      });

      const toggle = wrapper.find('[role="switch"]');
      const describedBy = toggle.attributes('aria-describedby');
      expect(describedBy).toBeDefined();
      expect(describedBy).toMatch(/^toggle-description-/);
    });

    it('generates unique IDs for multiple instances', () => {
      const wrapper1 = mount(VrlToggle, {
        props: {
          modelValue: false,
          label: 'Toggle 1',
          description: 'Description 1',
        },
      });

      const wrapper2 = mount(VrlToggle, {
        props: {
          modelValue: false,
          label: 'Toggle 2',
          description: 'Description 2',
        },
      });

      const toggle1 = wrapper1.find('[role="switch"]');
      const toggle2 = wrapper2.find('[role="switch"]');

      const id1 = toggle1.attributes('aria-describedby');
      const id2 = toggle2.attributes('aria-describedby');

      expect(id1).toBeDefined();
      expect(id2).toBeDefined();
      expect(id1).not.toBe(id2);
    });
  });

  describe('indicator positioning', () => {
    it('positions indicator on left when inactive', () => {
      const wrapper = mount(VrlToggle, {
        props: {
          modelValue: false,
        },
      });

      const indicator = wrapper.find('[role="switch"] > div');
      expect(indicator.classes()).toContain('left-0.5');
      expect(indicator.classes()).not.toContain('translate-x-5');
    });

    it('positions indicator on right when active (md size)', () => {
      const wrapper = mount(VrlToggle, {
        props: {
          modelValue: true,
          size: 'md',
        },
      });

      const indicator = wrapper.find('[role="switch"] > div');
      expect(indicator.classes()).toContain('translate-x-5');
    });

    it('positions indicator correctly for small size when active', () => {
      const wrapper = mount(VrlToggle, {
        props: {
          modelValue: true,
          size: 'sm',
        },
      });

      const indicator = wrapper.find('[role="switch"] > div');
      expect(indicator.classes()).toContain('translate-x-4');
    });

    it('positions indicator correctly for large size when active', () => {
      const wrapper = mount(VrlToggle, {
        props: {
          modelValue: true,
          size: 'lg',
        },
      });

      const indicator = wrapper.find('[role="switch"] > div');
      expect(indicator.classes()).toContain('translate-x-6');
    });
  });

  describe('accessibility', () => {
    it('has role switch', () => {
      const wrapper = mount(VrlToggle, {
        props: {
          modelValue: false,
        },
      });

      const toggle = wrapper.find('[role="switch"]');
      expect(toggle.exists()).toBe(true);
    });

    it('is keyboard focusable', () => {
      const wrapper = mount(VrlToggle, {
        props: {
          modelValue: false,
        },
      });

      const toggle = wrapper.find('[role="switch"]');
      expect(toggle.attributes('tabindex')).toBe('0');
    });

    it('has aria-label when label is provided', () => {
      const wrapper = mount(VrlToggle, {
        props: {
          modelValue: false,
          label: 'Enable notifications',
        },
      });

      const toggle = wrapper.find('[role="switch"]');
      expect(toggle.attributes('aria-label')).toBe('Enable notifications');
    });

    it('updates aria-checked on state change', async () => {
      const wrapper = mount(VrlToggle, {
        props: {
          modelValue: false,
        },
      });

      const toggle = wrapper.find('[role="switch"]');
      expect(toggle.attributes('aria-checked')).toBe('false');

      await wrapper.setProps({ modelValue: true });
      expect(toggle.attributes('aria-checked')).toBe('true');
    });
  });

  describe('styling', () => {
    it('applies transition classes', () => {
      const wrapper = mount(VrlToggle, {
        props: {
          modelValue: false,
        },
      });

      const toggle = wrapper.find('[role="switch"]');
      expect(toggle.classes()).toContain('transition-all');
      expect(toggle.classes()).toContain('duration-300');
    });

    it('changes background color when active', async () => {
      const wrapper = mount(VrlToggle, {
        props: {
          modelValue: false,
        },
      });

      const toggle = wrapper.find('[role="switch"]');
      expect(toggle.classes()).toContain('theme-bg-tertiary');

      await wrapper.setProps({ modelValue: true });
      expect(toggle.classes()).toContain('bg-racing-gold');
    });
  });
});
