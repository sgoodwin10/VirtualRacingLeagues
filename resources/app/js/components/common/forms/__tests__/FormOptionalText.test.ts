import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import FormOptionalText from '../FormOptionalText.vue';

describe('FormOptionalText', () => {
  it('renders with required text prop', () => {
    const wrapper = mount(FormOptionalText, {
      props: {
        text: 'This is helper text',
      },
    });

    expect(wrapper.text()).toContain('Optional:');
    expect(wrapper.text()).toContain('This is helper text');
  });

  it('renders with default classes', () => {
    const wrapper = mount(FormOptionalText, {
      props: {
        text: 'Helper text',
      },
    });

    const paragraph = wrapper.find('p');
    expect(paragraph.classes()).toContain('text-xs');
    expect(paragraph.classes()).toContain('text-gray-500');
  });

  it('applies custom classes when provided', () => {
    const wrapper = mount(FormOptionalText, {
      props: {
        text: 'Helper text',
        class: 'text-sm text-blue-600 font-semibold',
      },
    });

    const paragraph = wrapper.find('p');
    expect(paragraph.classes()).toContain('text-sm');
    expect(paragraph.classes()).toContain('text-blue-600');
    expect(paragraph.classes()).toContain('font-semibold');
    expect(paragraph.classes()).not.toContain('text-xs');
    expect(paragraph.classes()).not.toContain('text-gray-500');
  });

  it('shows "Optional:" prefix when showOptional is true (default)', () => {
    const wrapper = mount(FormOptionalText, {
      props: {
        text: 'Helper text',
      },
    });

    const span = wrapper.find('span');
    expect(span.exists()).toBe(true);
    expect(span.text()).toBe('Optional:');
    expect(span.classes()).toContain('font-medium');
  });

  it('hides "Optional:" prefix when showOptional is false', () => {
    const wrapper = mount(FormOptionalText, {
      props: {
        text: 'Helper text',
        showOptional: false,
      },
    });

    const span = wrapper.find('span');
    expect(span.exists()).toBe(false);
    expect(wrapper.text()).toBe('Helper text');
    expect(wrapper.text()).not.toContain('Optional:');
  });

  it('handles long text content correctly', () => {
    const longText =
      'This is a very long helper text that provides detailed information about the field and what users should enter';
    const wrapper = mount(FormOptionalText, {
      props: {
        text: longText,
      },
    });

    expect(wrapper.text()).toContain(longText);
    expect(wrapper.text()).toContain('Optional:');
  });

  it('handles text with special characters', () => {
    const wrapper = mount(FormOptionalText, {
      props: {
        text: 'Maximum 150 characters (e.g., "Racing League 2024")',
      },
    });

    expect(wrapper.text()).toContain('Maximum 150 characters');
    expect(wrapper.text()).toContain('(e.g., "Racing League 2024")');
  });

  it('renders with both showOptional false and custom classes', () => {
    const wrapper = mount(FormOptionalText, {
      props: {
        text: 'Custom helper text',
        showOptional: false,
        class: 'text-lg text-red-500',
      },
    });

    expect(wrapper.text()).toBe('Custom helper text');
    expect(wrapper.text()).not.toContain('Optional:');
    const paragraph = wrapper.find('p');
    expect(paragraph.classes()).toContain('text-lg');
    expect(paragraph.classes()).toContain('text-red-500');
  });

  it('maintains proper spacing between "Optional:" and text', () => {
    const wrapper = mount(FormOptionalText, {
      props: {
        text: 'Helper text',
      },
    });

    // The template has a space between Optional: and the text
    const text = wrapper.text();
    expect(text).toMatch(/Optional:\s+Helper text/);
  });
});
