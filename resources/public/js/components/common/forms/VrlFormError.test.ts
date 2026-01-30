import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import VrlFormError from './VrlFormError.vue';

describe('VrlFormError', () => {
  it('does not render when no error is provided', () => {
    const wrapper = mount(VrlFormError);
    expect(wrapper.find('small').exists()).toBe(false);
  });

  it('does not render when error is empty string', () => {
    const wrapper = mount(VrlFormError, {
      props: {
        error: '',
      },
    });
    expect(wrapper.find('small').exists()).toBe(false);
  });

  it('does not render when error is empty array', () => {
    const wrapper = mount(VrlFormError, {
      props: {
        error: [],
      },
    });
    expect(wrapper.find('small').exists()).toBe(false);
  });

  it('renders error message when string error is provided', () => {
    const wrapper = mount(VrlFormError, {
      props: {
        error: 'This field is required',
      },
    });
    expect(wrapper.text()).toBe('This field is required');
  });

  it('renders first error when array of errors is provided', () => {
    const wrapper = mount(VrlFormError, {
      props: {
        error: ['First error', 'Second error', 'Third error'],
      },
    });
    expect(wrapper.text()).toBe('First error');
  });

  it('applies default form-error class', () => {
    const wrapper = mount(VrlFormError, {
      props: {
        error: 'Error message',
      },
    });
    expect(wrapper.classes()).toContain('text-xs');
    expect(wrapper.classes()).toContain('text-[var(--red)]');
  });

  it('applies additional classes from class prop', () => {
    const wrapper = mount(VrlFormError, {
      props: {
        error: 'Error message',
        class: 'custom-error',
      },
    });
    expect(wrapper.classes()).toContain('text-xs');
    expect(wrapper.classes()).toContain('custom-error');
  });

  it('renders as a small element', () => {
    const wrapper = mount(VrlFormError, {
      props: {
        error: 'Error message',
      },
    });
    expect(wrapper.element.tagName).toBe('SMALL');
  });

  it('has role="alert" for accessibility', () => {
    const wrapper = mount(VrlFormError, {
      props: {
        error: 'Error message',
      },
    });
    expect(wrapper.attributes('role')).toBe('alert');
  });

  it('updates when error prop changes from undefined to string', async () => {
    const wrapper = mount(VrlFormError);
    expect(wrapper.find('small').exists()).toBe(false);

    await wrapper.setProps({ error: 'New error message' });
    expect(wrapper.text()).toBe('New error message');
  });

  it('updates when error prop changes from string to undefined', async () => {
    const wrapper = mount(VrlFormError, {
      props: {
        error: 'Initial error',
      },
    });
    expect(wrapper.text()).toBe('Initial error');

    await wrapper.setProps({ error: undefined });
    expect(wrapper.find('small').exists()).toBe(false);
  });

  it('updates when error array changes', async () => {
    const wrapper = mount(VrlFormError, {
      props: {
        error: ['First error'],
      },
    });
    expect(wrapper.text()).toBe('First error');

    await wrapper.setProps({ error: ['Updated error', 'Second error'] });
    expect(wrapper.text()).toBe('Updated error');
  });
});
