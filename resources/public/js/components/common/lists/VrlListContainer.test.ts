import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import VrlListContainer from './VrlListContainer.vue';

describe('VrlListContainer', () => {
  it('renders slot content', () => {
    const wrapper = mount(VrlListContainer, {
      slots: {
        default: '<div class="test-item">Test Item</div>',
      },
    });

    expect(wrapper.html()).toContain('Test Item');
    expect(wrapper.find('.test-item').exists()).toBe(true);
  });

  it('has proper ARIA role', () => {
    const wrapper = mount(VrlListContainer);

    expect(wrapper.attributes('role')).toBe('list');
  });

  it('applies aria-label when provided', () => {
    const wrapper = mount(VrlListContainer, {
      props: {
        ariaLabel: 'Active seasons list',
      },
    });

    expect(wrapper.attributes('aria-label')).toBe('Active seasons list');
  });

  it('applies default gap (0.5rem)', () => {
    const wrapper = mount(VrlListContainer);

    expect(wrapper.element.style.gap).toBe('0.5rem');
  });

  it('applies custom gap as string', () => {
    const wrapper = mount(VrlListContainer, {
      props: {
        gap: '1rem',
      },
    });

    expect(wrapper.element.style.gap).toBe('1rem');
  });

  it('applies custom gap as number (converts to px)', () => {
    const wrapper = mount(VrlListContainer, {
      props: {
        gap: 16,
      },
    });

    expect(wrapper.element.style.gap).toBe('16px');
  });

  it('applies custom classes', () => {
    const wrapper = mount(VrlListContainer, {
      props: {
        class: 'custom-class another-class',
      },
    });

    expect(wrapper.classes()).toContain('custom-class');
    expect(wrapper.classes()).toContain('another-class');
  });

  it('has flex flex-col classes', () => {
    const wrapper = mount(VrlListContainer);

    expect(wrapper.classes()).toContain('flex');
    expect(wrapper.classes()).toContain('flex-col');
  });

  it('has data-test attribute', () => {
    const wrapper = mount(VrlListContainer);

    expect(wrapper.attributes('data-test')).toBe('list-container');
  });
});
