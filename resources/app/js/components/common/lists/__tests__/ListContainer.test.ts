/**
 * ListContainer Component Tests
 */
import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import ListContainer from '../ListContainer.vue';

describe('ListContainer', () => {
  it('renders default slot content', () => {
    const wrapper = mount(ListContainer, {
      slots: {
        default: '<div class="test-item">Item 1</div><div class="test-item">Item 2</div>',
      },
    });

    expect(wrapper.findAll('.test-item')).toHaveLength(2);
  });

  it('applies default gap of 12px', () => {
    const wrapper = mount(ListContainer);

    expect(wrapper.attributes('style')).toContain('gap: 12px');
  });

  it('applies custom gap as number', () => {
    const wrapper = mount(ListContainer, {
      props: {
        gap: 24,
      },
    });

    expect(wrapper.attributes('style')).toContain('gap: 24px');
  });

  it('applies custom gap as string', () => {
    const wrapper = mount(ListContainer, {
      props: {
        gap: '2rem',
      },
    });

    expect(wrapper.attributes('style')).toContain('gap: 2rem');
  });

  it('applies ARIA list role', () => {
    const wrapper = mount(ListContainer);

    expect(wrapper.attributes('role')).toBe('list');
  });

  it('applies custom ARIA label', () => {
    const wrapper = mount(ListContainer, {
      props: {
        ariaLabel: 'Custom list description',
      },
    });

    expect(wrapper.attributes('aria-label')).toBe('Custom list description');
  });

  it('applies custom classes', () => {
    const wrapper = mount(ListContainer, {
      props: {
        class: 'custom-container-class',
      },
    });

    expect(wrapper.classes()).toContain('custom-container-class');
  });

  it('uses flex column layout', () => {
    const wrapper = mount(ListContainer);

    expect(wrapper.classes()).toContain('flex');
    expect(wrapper.classes()).toContain('flex-col');
  });
});
