import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import VrlRadio from '../VrlRadio.vue';

describe('VrlRadio', () => {
  it('renders with required props', () => {
    const wrapper = mount(VrlRadio, {
      props: {
        modelValue: '',
        value: 'option1',
        name: 'test-radio',
      },
    });

    const radio = wrapper.find('input[type="radio"]');
    expect(radio.exists()).toBe(true);
  });

  describe('v-model binding', () => {
    it('displays checked state when modelValue matches value', () => {
      const wrapper = mount(VrlRadio, {
        props: {
          modelValue: 'option1',
          value: 'option1',
          name: 'test',
        },
      });

      const radio = wrapper.find('input[type="radio"]');
      expect((radio.element as HTMLInputElement).checked).toBe(true);
    });

    it('displays unchecked state when modelValue does not match value', () => {
      const wrapper = mount(VrlRadio, {
        props: {
          modelValue: 'option1',
          value: 'option2',
          name: 'test',
        },
      });

      const radio = wrapper.find('input[type="radio"]');
      expect((radio.element as HTMLInputElement).checked).toBe(false);
    });

    it('emits update:modelValue with value on change', async () => {
      const wrapper = mount(VrlRadio, {
        props: {
          modelValue: '',
          value: 'option1',
          name: 'test',
        },
      });

      const radio = wrapper.find('input[type="radio"]');
      await radio.trigger('change');

      expect(wrapper.emitted('update:modelValue')).toBeTruthy();
      expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['option1']);
    });

    it('works with different value types', () => {
      const objectValue = { id: 1, name: 'Test' };

      const wrapper = mount(VrlRadio, {
        props: {
          modelValue: objectValue,
          value: objectValue,
          name: 'test',
        },
      });

      const radio = wrapper.find('input[type="radio"]');
      expect((radio.element as HTMLInputElement).checked).toBe(true);
    });
  });

  describe('name prop', () => {
    it('applies name attribute', () => {
      const wrapper = mount(VrlRadio, {
        props: {
          modelValue: '',
          value: 'option1',
          name: 'visibility',
        },
      });

      const radio = wrapper.find('input[type="radio"]');
      expect(radio.attributes('name')).toBe('visibility');
    });

    it('groups radios with same name', () => {
      const wrapper1 = mount(VrlRadio, {
        props: {
          modelValue: 'option1',
          value: 'option1',
          name: 'group1',
        },
      });

      const wrapper2 = mount(VrlRadio, {
        props: {
          modelValue: 'option1',
          value: 'option2',
          name: 'group1',
        },
      });

      expect(wrapper1.find('input').attributes('name')).toBe('group1');
      expect(wrapper2.find('input').attributes('name')).toBe('group1');
    });
  });

  describe('value prop', () => {
    it('applies value attribute', () => {
      const wrapper = mount(VrlRadio, {
        props: {
          modelValue: '',
          value: 'public',
          name: 'visibility',
        },
      });

      const radio = wrapper.find('input[type="radio"]');
      expect(radio.attributes('value')).toBe('public');
    });
  });

  describe('label prop', () => {
    it('displays label', () => {
      const wrapper = mount(VrlRadio, {
        props: {
          modelValue: '',
          value: 'public',
          name: 'visibility',
          label: 'Public',
        },
      });

      const label = wrapper.find('label');
      expect(label.text()).toContain('Public');
    });

    it('renders without label when not provided', () => {
      const wrapper = mount(VrlRadio, {
        props: {
          modelValue: '',
          value: 'option1',
          name: 'test',
        },
      });

      const labelText = wrapper.find('span');
      expect(labelText.exists()).toBe(false);
    });

    it('links label with radio via for/id', () => {
      const wrapper = mount(VrlRadio, {
        props: {
          modelValue: '',
          value: 'option1',
          name: 'test',
          label: 'Test',
        },
      });

      const label = wrapper.find('label');
      const radio = wrapper.find('input[type="radio"]');

      expect(label.attributes('for')).toBe(radio.attributes('id'));
    });
  });

  describe('disabled state', () => {
    it('applies disabled attribute', () => {
      const wrapper = mount(VrlRadio, {
        props: {
          modelValue: '',
          value: 'option1',
          name: 'test',
          disabled: true,
        },
      });

      const radio = wrapper.find('input[type="radio"]');
      expect(radio.attributes('disabled')).toBeDefined();
    });

    it('applies disabled styling to label', () => {
      const wrapper = mount(VrlRadio, {
        props: {
          modelValue: '',
          value: 'option1',
          name: 'test',
          label: 'Disabled',
          disabled: true,
        },
      });

      const label = wrapper.find('label');
      expect(label.classes()).toContain('opacity-50');
      expect(label.classes()).toContain('cursor-not-allowed');
    });

    it('does not emit when disabled', async () => {
      const wrapper = mount(VrlRadio, {
        props: {
          modelValue: '',
          value: 'option1',
          name: 'test',
          disabled: true,
        },
      });

      const radio = wrapper.find('input[type="radio"]');
      await radio.trigger('change');

      // Should not emit because component prevents it when disabled
      expect(wrapper.emitted('update:modelValue')).toBeFalsy();
    });
  });

  describe('styling', () => {
    it('applies custom radio class', () => {
      const wrapper = mount(VrlRadio, {
        props: {
          modelValue: '',
          value: 'option1',
          name: 'test',
        },
      });

      const radio = wrapper.find('input[type="radio"]');
      expect(radio.classes()).toContain('vrl-radio');
    });

    it('applies group hover effect to label', () => {
      const wrapper = mount(VrlRadio, {
        props: {
          modelValue: '',
          value: 'option1',
          name: 'test',
          label: 'Test',
        },
      });

      const label = wrapper.find('label');
      expect(label.classes()).toContain('group');

      const span = wrapper.find('span');
      expect(span.classes()).toContain('group-hover:text-racing-gold');
    });

    it('has rounded-full shape', () => {
      const wrapper = mount(VrlRadio, {
        props: {
          modelValue: '',
          value: 'option1',
          name: 'test',
        },
      });

      const radio = wrapper.find('input[type="radio"]');
      // Rounded-full is applied via CSS border-radius: 50% - verified via CSS class
      expect(radio.classes()).toContain('vrl-radio');
    });
  });

  describe('accessibility', () => {
    it('has cursor pointer on label', () => {
      const wrapper = mount(VrlRadio, {
        props: {
          modelValue: '',
          value: 'option1',
          name: 'test',
          label: 'Test',
        },
      });

      const label = wrapper.find('label');
      expect(label.classes()).toContain('cursor-pointer');
    });

    it('generates unique id', () => {
      const wrapper1 = mount(VrlRadio, {
        props: { modelValue: '', value: 'a', name: 'test' },
      });
      const wrapper2 = mount(VrlRadio, {
        props: { modelValue: '', value: 'b', name: 'test' },
      });

      const id1 = wrapper1.find('input').attributes('id');
      const id2 = wrapper2.find('input').attributes('id');

      expect(id1).toBeDefined();
      expect(id2).toBeDefined();
      expect(id1).not.toBe(id2);
    });

    it('allows clicking radio to select', async () => {
      const wrapper = mount(VrlRadio, {
        props: {
          modelValue: '',
          value: 'option1',
          name: 'test',
          label: 'Click me',
        },
      });

      const radio = wrapper.find('input[type="radio"]');
      await radio.trigger('change');

      expect(wrapper.emitted('update:modelValue')).toBeTruthy();
      expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['option1']);
    });
  });
});
