import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import VrlFormHelper from '../VrlFormHelper.vue';

describe('VrlFormHelper', () => {
  it('renders with default classes', () => {
    const wrapper = mount(VrlFormHelper, {
      slots: {
        default: 'Helper text',
      },
    });
    expect(wrapper.classes()).toContain('form-helper');
  });

  it('renders slot content', () => {
    const wrapper = mount(VrlFormHelper, {
      slots: {
        default: 'Must be 8-20 characters',
      },
    });
    expect(wrapper.text()).toBe('Must be 8-20 characters');
  });

  it('applies additional classes from class prop', () => {
    const wrapper = mount(VrlFormHelper, {
      props: {
        class: 'custom-helper',
      },
      slots: {
        default: 'Helper text',
      },
    });
    expect(wrapper.classes()).toContain('form-helper');
    expect(wrapper.classes()).toContain('custom-helper');
  });

  it('renders as a small element', () => {
    const wrapper = mount(VrlFormHelper, {
      slots: {
        default: 'Helper text',
      },
    });
    expect(wrapper.element.tagName).toBe('SMALL');
  });

  it('renders HTML content in slot', () => {
    const wrapper = mount(VrlFormHelper, {
      slots: {
        default: '<strong>Important:</strong> Keep this secure',
      },
    });
    expect(wrapper.html()).toContain('<strong>Important:</strong>');
    expect(wrapper.text()).toContain('Important: Keep this secure');
  });

  it('handles empty slot', () => {
    const wrapper = mount(VrlFormHelper, {
      slots: {
        default: '',
      },
    });
    expect(wrapper.text()).toBe('');
    expect(wrapper.classes()).toContain('form-helper');
  });
});
