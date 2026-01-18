import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import VrlFormGroup from '../VrlFormGroup.vue';

describe('VrlFormGroup', () => {
  it('renders with default classes', () => {
    const wrapper = mount(VrlFormGroup);
    expect(wrapper.classes()).toContain('form-group');
  });

  it('renders slot content', () => {
    const wrapper = mount(VrlFormGroup, {
      slots: {
        default: '<input type="text" />',
      },
    });
    expect(wrapper.html()).toContain('<input type="text"');
  });

  it('applies additional classes from class prop', () => {
    const wrapper = mount(VrlFormGroup, {
      props: {
        class: 'custom-class another-class',
      },
    });
    expect(wrapper.classes()).toContain('form-group');
    expect(wrapper.classes()).toContain('custom-class');
    expect(wrapper.classes()).toContain('another-class');
  });

  it('renders as a div element', () => {
    const wrapper = mount(VrlFormGroup);
    expect(wrapper.element.tagName).toBe('DIV');
  });

  it('renders multiple child elements', () => {
    const wrapper = mount(VrlFormGroup, {
      slots: {
        default: `
          <label>Label</label>
          <input type="text" />
          <small>Helper text</small>
        `,
      },
    });
    expect(wrapper.html()).toContain('<label>Label</label>');
    expect(wrapper.html()).toContain('<input type="text"');
    expect(wrapper.html()).toContain('<small>Helper text</small>');
  });
});
