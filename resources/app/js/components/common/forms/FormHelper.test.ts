import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import FormHelper from './FormHelper.vue';

describe('FormHelper', () => {
  it('renders helper text when text prop is provided', () => {
    const wrapper = mount(FormHelper, {
      props: { text: 'This is helper text' },
    });

    expect(wrapper.text()).toBe('This is helper text');
    expect(wrapper.find('small').exists()).toBe(true);
  });

  it('does not render when text prop is undefined', () => {
    const wrapper = mount(FormHelper);

    expect(wrapper.find('small').exists()).toBe(false);
  });

  it('applies form-help class', () => {
    const wrapper = mount(FormHelper, {
      props: { text: 'Helper text' },
    });

    expect(wrapper.classes()).toContain('form-help');
  });

  it('merges custom classes correctly', () => {
    const wrapper = mount(FormHelper, {
      props: {
        text: 'Helper text',
        class: 'text-blue-800 font-bold',
      },
    });

    expect(wrapper.classes()).toContain('form-help');
    expect(wrapper.classes()).toContain('text-blue-800');
    expect(wrapper.classes()).toContain('font-bold');
  });

  it('renders as small element', () => {
    const wrapper = mount(FormHelper, {
      props: { text: 'Helper text' },
    });

    expect(wrapper.element.tagName.toLowerCase()).toBe('small');
  });

  it('handles empty text prop gracefully', () => {
    const wrapper = mount(FormHelper, {
      props: { text: '' },
    });

    expect(wrapper.find('small').exists()).toBe(false);
  });

  it('updates text content when prop changes', async () => {
    const wrapper = mount(FormHelper, {
      props: { text: 'Initial text' },
    });

    expect(wrapper.text()).toBe('Initial text');

    await wrapper.setProps({ text: 'Updated text' });

    expect(wrapper.text()).toBe('Updated text');
  });

  it('handles undefined class prop', () => {
    const wrapper = mount(FormHelper, {
      props: { text: 'Helper text' },
    });

    expect(wrapper.classes()).toContain('form-help');
    expect(wrapper.classes().length).toBe(1);
  });

  it('supports multiple custom classes', () => {
    const wrapper = mount(FormHelper, {
      props: {
        text: 'Helper text',
        class: 'custom-class-1 custom-class-2 custom-class-3',
      },
    });

    expect(wrapper.classes()).toContain('form-help');
    expect(wrapper.classes()).toContain('custom-class-1');
    expect(wrapper.classes()).toContain('custom-class-2');
    expect(wrapper.classes()).toContain('custom-class-3');
  });

  it('maintains semantic HTML structure', () => {
    const wrapper = mount(FormHelper, {
      props: { text: 'Helper text' },
    });

    const small = wrapper.find('small');
    expect(small.exists()).toBe(true);
    expect(small.element).toBeInstanceOf(HTMLElement);
  });
});
