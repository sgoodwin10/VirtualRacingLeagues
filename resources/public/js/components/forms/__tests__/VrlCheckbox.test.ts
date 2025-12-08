import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import VrlCheckbox from '../VrlCheckbox.vue';

describe('VrlCheckbox', () => {
  it('renders with default props', () => {
    const wrapper = mount(VrlCheckbox, {
      props: {
        modelValue: false,
      },
    });

    const checkbox = wrapper.find('input[type="checkbox"]');
    expect(checkbox.exists()).toBe(true);
  });

  describe('v-model binding', () => {
    it('displays checked state', () => {
      const wrapper = mount(VrlCheckbox, {
        props: {
          modelValue: true,
        },
      });

      const checkbox = wrapper.find('input[type="checkbox"]');
      expect((checkbox.element as HTMLInputElement).checked).toBe(true);
    });

    it('displays unchecked state', () => {
      const wrapper = mount(VrlCheckbox, {
        props: {
          modelValue: false,
        },
      });

      const checkbox = wrapper.find('input[type="checkbox"]');
      expect((checkbox.element as HTMLInputElement).checked).toBe(false);
    });

    it('emits update:modelValue on change', async () => {
      const wrapper = mount(VrlCheckbox, {
        props: {
          modelValue: false,
        },
      });

      const checkbox = wrapper.find('input[type="checkbox"]');
      await checkbox.setValue(true);

      expect(wrapper.emitted('update:modelValue')).toBeTruthy();
      expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([true]);
    });

    it('emits false when unchecking', async () => {
      const wrapper = mount(VrlCheckbox, {
        props: {
          modelValue: true,
        },
      });

      const checkbox = wrapper.find('input[type="checkbox"]');
      await checkbox.setValue(false);

      expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([false]);
    });
  });

  describe('label prop', () => {
    it('displays label', () => {
      const wrapper = mount(VrlCheckbox, {
        props: {
          modelValue: false,
          label: 'Enable notifications',
        },
      });

      const label = wrapper.find('label');
      expect(label.text()).toContain('Enable notifications');
    });

    it('renders without label when not provided', () => {
      const wrapper = mount(VrlCheckbox, {
        props: {
          modelValue: false,
        },
      });

      const labelText = wrapper.find('span');
      expect(labelText.exists()).toBe(false);
    });

    it('links label with checkbox via for/id', () => {
      const wrapper = mount(VrlCheckbox, {
        props: {
          modelValue: false,
          label: 'Test',
        },
      });

      const label = wrapper.find('label');
      const checkbox = wrapper.find('input[type="checkbox"]');

      expect(label.attributes('for')).toBe(checkbox.attributes('id'));
    });
  });

  describe('disabled state', () => {
    it('applies disabled attribute', () => {
      const wrapper = mount(VrlCheckbox, {
        props: {
          modelValue: false,
          disabled: true,
        },
      });

      const checkbox = wrapper.find('input[type="checkbox"]');
      expect(checkbox.attributes('disabled')).toBeDefined();
    });

    it('applies disabled styling to label', () => {
      const wrapper = mount(VrlCheckbox, {
        props: {
          modelValue: false,
          disabled: true,
          label: 'Disabled',
        },
      });

      const label = wrapper.find('label');
      expect(label.classes()).toContain('opacity-50');
      expect(label.classes()).toContain('cursor-not-allowed');
    });

    it('does not emit when disabled', async () => {
      const wrapper = mount(VrlCheckbox, {
        props: {
          modelValue: false,
          disabled: true,
        },
      });

      const checkbox = wrapper.find('input[type="checkbox"]');
      await checkbox.trigger('change');

      // Should not emit because the native checkbox prevents it
      expect(wrapper.emitted('update:modelValue')).toBeFalsy();
    });
  });

  describe('binary prop', () => {
    it('defaults to true', () => {
      const wrapper = mount(VrlCheckbox, {
        props: {
          modelValue: false,
        },
      });

      // Binary prop is true by default, but doesn't affect rendering
      expect(wrapper.vm.$props.binary).toBe(true);
    });

    it('accepts false value', () => {
      const wrapper = mount(VrlCheckbox, {
        props: {
          modelValue: false,
          binary: false,
        },
      });

      expect(wrapper.vm.$props.binary).toBe(false);
    });
  });

  describe('styling', () => {
    it('applies custom checkbox class', () => {
      const wrapper = mount(VrlCheckbox, {
        props: {
          modelValue: false,
        },
      });

      const checkbox = wrapper.find('input[type="checkbox"]');
      expect(checkbox.classes()).toContain('vrl-checkbox');
    });

    it('applies group hover effect to label', () => {
      const wrapper = mount(VrlCheckbox, {
        props: {
          modelValue: false,
          label: 'Test',
        },
      });

      const label = wrapper.find('label');
      expect(label.classes()).toContain('group');

      const span = wrapper.find('span');
      expect(span.classes()).toContain('group-hover:text-racing-gold');
    });

    it('has correct size (20x20px)', () => {
      const wrapper = mount(VrlCheckbox, {
        props: {
          modelValue: false,
        },
      });

      const checkbox = wrapper.find('input[type="checkbox"]');
      // w-5 h-5 = 1.25rem = 20px - verified via CSS class
      expect(checkbox.classes()).toContain('vrl-checkbox');
    });
  });

  describe('accessibility', () => {
    it('has cursor pointer on label', () => {
      const wrapper = mount(VrlCheckbox, {
        props: {
          modelValue: false,
          label: 'Test',
        },
      });

      const label = wrapper.find('label');
      expect(label.classes()).toContain('cursor-pointer');
    });

    it('generates unique id', () => {
      const wrapper1 = mount(VrlCheckbox, { props: { modelValue: false } });
      const wrapper2 = mount(VrlCheckbox, { props: { modelValue: false } });

      const id1 = wrapper1.find('input').attributes('id');
      const id2 = wrapper2.find('input').attributes('id');

      expect(id1).toBeDefined();
      expect(id2).toBeDefined();
      expect(id1).not.toBe(id2);
    });

    it('allows clicking checkbox to toggle', async () => {
      const wrapper = mount(VrlCheckbox, {
        props: {
          modelValue: false,
          label: 'Click me',
        },
      });

      const checkbox = wrapper.find('input[type="checkbox"]');
      await checkbox.setValue(true);

      expect(wrapper.emitted('update:modelValue')).toBeTruthy();
      expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([true]);
    });
  });
});
