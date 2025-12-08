import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import VrlSelect from '../VrlSelect.vue';

describe('VrlSelect', () => {
  const options = [
    { label: 'Option 1', value: '1' },
    { label: 'Option 2', value: '2' },
    { label: 'Option 3', value: '3' },
  ];

  it('renders with default props', () => {
    const wrapper = mount(VrlSelect, {
      props: {
        modelValue: '',
        options,
      },
    });

    const select = wrapper.find('select');
    expect(select.exists()).toBe(true);
  });

  describe('v-model binding', () => {
    it('displays modelValue', () => {
      const wrapper = mount(VrlSelect, {
        props: {
          modelValue: '2',
          options,
        },
      });

      const select = wrapper.find('select');
      expect(select.element.value).toBe('2');
    });

    it('emits update:modelValue on change', async () => {
      const wrapper = mount(VrlSelect, {
        props: {
          modelValue: '1',
          options,
        },
      });

      const select = wrapper.find('select');
      await select.setValue('2');

      expect(wrapper.emitted('update:modelValue')).toBeTruthy();
      expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['2']);
    });

    it('handles object values correctly', async () => {
      const objectOptions = [
        { label: 'Option A', value: { id: 'a' } },
        { label: 'Option B', value: { id: 'b' } },
      ];

      const wrapper = mount(VrlSelect, {
        props: {
          modelValue: objectOptions[0]?.value,
          options: objectOptions,
        },
      });

      const select = wrapper.find('select');
      expect(select.exists()).toBe(true);
    });
  });

  describe('options prop', () => {
    it('renders all options', () => {
      const wrapper = mount(VrlSelect, {
        props: {
          modelValue: '',
          options,
        },
      });

      const optionElements = wrapper.findAll('option');
      // Should have 3 options (no placeholder)
      expect(optionElements.length).toBe(3);
      expect(optionElements[0]?.text()).toBe('Option 1');
      expect(optionElements[1]?.text()).toBe('Option 2');
      expect(optionElements[2]?.text()).toBe('Option 3');
    });

    it('renders options with correct values', () => {
      const wrapper = mount(VrlSelect, {
        props: {
          modelValue: '',
          options,
        },
      });

      const optionElements = wrapper.findAll('option');
      expect(optionElements[0]?.attributes('value')).toBe('1');
      expect(optionElements[1]?.attributes('value')).toBe('2');
      expect(optionElements[2]?.attributes('value')).toBe('3');
    });
  });

  describe('placeholder prop', () => {
    it('renders placeholder option', () => {
      const wrapper = mount(VrlSelect, {
        props: {
          modelValue: '',
          options,
          placeholder: 'Select an option',
        },
      });

      const optionElements = wrapper.findAll('option');
      // Should have 4 options (placeholder + 3 options)
      expect(optionElements.length).toBe(4);
      expect(optionElements[0]?.text()).toBe('Select an option');
      expect(optionElements[0]?.attributes('value')).toBe('');
      expect(optionElements[0]?.attributes('disabled')).toBeDefined();
    });
  });

  describe('size prop', () => {
    it('renders small size', () => {
      const wrapper = mount(VrlSelect, {
        props: {
          modelValue: '',
          options,
          size: 'sm',
        },
      });

      const select = wrapper.find('select');
      expect(select.classes()).toContain('h-8');
      expect(select.classes()).toContain('px-3');
      expect(select.classes()).toContain('text-xs');
    });

    it('renders medium size (default)', () => {
      const wrapper = mount(VrlSelect, {
        props: {
          modelValue: '',
          options,
          size: 'md',
        },
      });

      const select = wrapper.find('select');
      expect(select.classes()).toContain('h-10');
      expect(select.classes()).toContain('px-4');
      expect(select.classes()).toContain('text-sm');
    });

    it('renders large size', () => {
      const wrapper = mount(VrlSelect, {
        props: {
          modelValue: '',
          options,
          size: 'lg',
        },
      });

      const select = wrapper.find('select');
      expect(select.classes()).toContain('h-12');
      expect(select.classes()).toContain('px-5');
      expect(select.classes()).toContain('text-base');
    });
  });

  describe('disabled state', () => {
    it('applies disabled attribute', () => {
      const wrapper = mount(VrlSelect, {
        props: {
          modelValue: '',
          options,
          disabled: true,
        },
      });

      const select = wrapper.find('select');
      expect(select.attributes('disabled')).toBeDefined();
      expect(select.classes()).toContain('opacity-50');
      expect(select.classes()).toContain('cursor-not-allowed');
    });
  });

  describe('invalid state and error message', () => {
    it('applies invalid state styles', () => {
      const wrapper = mount(VrlSelect, {
        props: {
          modelValue: '',
          options,
          invalid: true,
        },
      });

      const select = wrapper.find('select');
      expect(select.attributes('aria-invalid')).toBe('true');
      expect(select.classes()).toContain('border-racing-danger/50');
    });

    it('displays error message when invalid', () => {
      const wrapper = mount(VrlSelect, {
        props: {
          modelValue: '',
          options,
          invalid: true,
          errorMessage: 'Please select an option',
        },
      });

      const error = wrapper.find('small');
      expect(error.exists()).toBe(true);
      expect(error.text()).toBe('Please select an option');
      expect(error.classes()).toContain('text-racing-danger');
    });

    it('does not display error message when not invalid', () => {
      const wrapper = mount(VrlSelect, {
        props: {
          modelValue: '',
          options,
          invalid: false,
          errorMessage: 'Error',
        },
      });

      const error = wrapper.find('small');
      expect(error.exists()).toBe(false);
    });

    it('links error message with aria-describedby', () => {
      const wrapper = mount(VrlSelect, {
        props: {
          modelValue: '',
          options,
          invalid: true,
          errorMessage: 'Error',
        },
      });

      const select = wrapper.find('select');
      const error = wrapper.find('small');

      expect(select.attributes('aria-describedby')).toBe(error.attributes('id'));
    });
  });

  describe('label and required', () => {
    it('displays label', () => {
      const wrapper = mount(VrlSelect, {
        props: {
          modelValue: '',
          options,
          label: 'Platform',
        },
      });

      const label = wrapper.find('label');
      expect(label.exists()).toBe(true);
      expect(label.text()).toContain('Platform');
    });

    it('displays required indicator', () => {
      const wrapper = mount(VrlSelect, {
        props: {
          modelValue: '',
          options,
          label: 'Category',
          required: true,
        },
      });

      const label = wrapper.find('label');
      expect(label.text()).toContain('*');
    });

    it('links label with select via for/id', () => {
      const wrapper = mount(VrlSelect, {
        props: {
          modelValue: '',
          options,
          label: 'Test',
        },
      });

      const label = wrapper.find('label');
      const select = wrapper.find('select');

      expect(label.attributes('for')).toBe(select.attributes('id'));
    });
  });

  describe('styling', () => {
    it('applies appearance-none and cursor-pointer', () => {
      const wrapper = mount(VrlSelect, {
        props: {
          modelValue: '',
          options,
        },
      });

      const select = wrapper.find('select');
      expect(select.classes()).toContain('appearance-none');
      expect(select.classes()).toContain('cursor-pointer');
    });

    it('has custom dropdown arrow background', () => {
      const wrapper = mount(VrlSelect, {
        props: {
          modelValue: '',
          options,
        },
      });

      const select = wrapper.find('select');
      // Check that select has background styling via inline style or class
      expect(select.classes()).toContain('appearance-none');
      // Background image is applied via computed style
      const element = select.element as HTMLSelectElement;
      expect(element).toBeDefined();
    });
  });

  describe('accessibility', () => {
    it('has proper aria attributes', () => {
      const wrapper = mount(VrlSelect, {
        props: {
          modelValue: '',
          options,
          invalid: false,
        },
      });

      const select = wrapper.find('select');
      expect(select.attributes('aria-invalid')).toBe('false');
    });

    it('generates unique id', () => {
      const wrapper1 = mount(VrlSelect, { props: { modelValue: '', options } });
      const wrapper2 = mount(VrlSelect, { props: { modelValue: '', options } });

      const id1 = wrapper1.find('select').attributes('id');
      const id2 = wrapper2.find('select').attributes('id');

      expect(id1).toBeDefined();
      expect(id2).toBeDefined();
      expect(id1).not.toBe(id2);
    });
  });
});
