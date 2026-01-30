import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import VrlFormLabel from './VrlFormLabel.vue';

describe('VrlFormLabel', () => {
  it('renders with default classes', () => {
    const wrapper = mount(VrlFormLabel, {
      slots: {
        default: 'Username',
      },
    });
    expect(wrapper.classes()).toContain('block');
    expect(wrapper.classes()).toContain('font-display');
  });

  it('renders slot content', () => {
    const wrapper = mount(VrlFormLabel, {
      slots: {
        default: 'Email Address',
      },
    });
    expect(wrapper.text()).toContain('Email Address');
  });

  it('does not show required indicator by default', () => {
    const wrapper = mount(VrlFormLabel, {
      slots: {
        default: 'Field',
      },
    });
    expect(wrapper.text()).not.toContain('*');
  });

  it('shows required indicator when required prop is true', () => {
    const wrapper = mount(VrlFormLabel, {
      props: {
        required: true,
      },
      slots: {
        default: 'Required Field',
      },
    });
    const requiredSpan = wrapper.find('span');
    expect(requiredSpan.exists()).toBe(true);
    expect(requiredSpan.text()).toBe('*');
    expect(requiredSpan.classes()).toContain('text-[var(--red)]');
  });

  it('applies for attribute when provided', () => {
    const wrapper = mount(VrlFormLabel, {
      props: {
        for: 'username-input',
      },
      slots: {
        default: 'Username',
      },
    });
    expect(wrapper.attributes('for')).toBe('username-input');
  });

  it('does not apply for attribute when not provided', () => {
    const wrapper = mount(VrlFormLabel, {
      slots: {
        default: 'Username',
      },
    });
    expect(wrapper.attributes('for')).toBeUndefined();
  });

  it('applies additional classes from class prop', () => {
    const wrapper = mount(VrlFormLabel, {
      props: {
        class: 'custom-label',
      },
      slots: {
        default: 'Field',
      },
    });
    expect(wrapper.classes()).toContain('block');
    expect(wrapper.classes()).toContain('custom-label');
  });

  it('renders as a label element', () => {
    const wrapper = mount(VrlFormLabel, {
      slots: {
        default: 'Field',
      },
    });
    expect(wrapper.element.tagName).toBe('LABEL');
  });

  it('renders both label text and required indicator together', () => {
    const wrapper = mount(VrlFormLabel, {
      props: {
        for: 'email',
        required: true,
      },
      slots: {
        default: 'Email',
      },
    });
    expect(wrapper.text()).toContain('Email');
    expect(wrapper.text()).toContain('*');
    expect(wrapper.attributes('for')).toBe('email');
  });
});
