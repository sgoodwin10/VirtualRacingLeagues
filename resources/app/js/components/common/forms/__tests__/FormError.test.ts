import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import FormError from '../FormError.vue';

describe('FormError', () => {
  it('displays single error message', () => {
    const wrapper = mount(FormError, {
      props: { error: 'This field is required' },
    });

    expect(wrapper.text()).toBe('This field is required');
    expect(wrapper.find('small').exists()).toBe(true);
  });

  it('displays first error from array', () => {
    const wrapper = mount(FormError, {
      props: { error: ['Error 1', 'Error 2', 'Error 3'] },
    });

    expect(wrapper.text()).toBe('Error 1');
    expect(wrapper.find('small').exists()).toBe(true);
  });

  it('does not render when no error', () => {
    const wrapper = mount(FormError, {
      props: { error: undefined },
    });

    expect(wrapper.find('small').exists()).toBe(false);
  });

  it('does not render when error is empty string', () => {
    const wrapper = mount(FormError, {
      props: { error: '' },
    });

    expect(wrapper.find('small').exists()).toBe(false);
  });

  it('does not render when error is empty array', () => {
    const wrapper = mount(FormError, {
      props: { error: [] },
    });

    expect(wrapper.find('small').exists()).toBe(false);
  });

  it('applies form-error class', () => {
    const wrapper = mount(FormError, {
      props: { error: 'Error message' },
    });

    expect(wrapper.classes()).toContain('form-error');
  });

  it('applies custom classes', () => {
    const wrapper = mount(FormError, {
      props: {
        error: 'Error message',
        class: 'custom-class another-class',
      },
    });

    expect(wrapper.classes()).toContain('form-error');
    expect(wrapper.classes()).toContain('custom-class');
    expect(wrapper.classes()).toContain('another-class');
  });

  it('renders as small element', () => {
    const wrapper = mount(FormError, {
      props: { error: 'Error message' },
    });

    expect(wrapper.element.tagName.toLowerCase()).toBe('small');
  });

  it('handles error with special characters', () => {
    const errorMessage = 'Field must be < 100 & > 0';
    const wrapper = mount(FormError, {
      props: { error: errorMessage },
    });

    expect(wrapper.text()).toBe(errorMessage);
  });

  it('handles multiline error messages', () => {
    const errorMessage = 'This is a long error message\nthat spans multiple lines';
    const wrapper = mount(FormError, {
      props: { error: errorMessage },
    });

    expect(wrapper.text()).toBe(errorMessage);
  });

  it('updates when error prop changes', async () => {
    const wrapper = mount(FormError, {
      props: { error: 'Initial error' },
    });

    expect(wrapper.text()).toBe('Initial error');

    await wrapper.setProps({ error: 'Updated error' });

    expect(wrapper.text()).toBe('Updated error');
  });

  it('shows and hides based on error prop', async () => {
    const wrapper = mount(FormError, {
      props: { error: 'Error message' },
    });

    expect(wrapper.find('small').exists()).toBe(true);

    await wrapper.setProps({ error: undefined });

    expect(wrapper.find('small').exists()).toBe(false);
  });

  it('switches from single error to array error', async () => {
    const wrapper = mount(FormError, {
      props: { error: 'Single error' },
    });

    expect(wrapper.text()).toBe('Single error');

    await wrapper.setProps({ error: ['First error', 'Second error'] });

    expect(wrapper.text()).toBe('First error');
  });
});
