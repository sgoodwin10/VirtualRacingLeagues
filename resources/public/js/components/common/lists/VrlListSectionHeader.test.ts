import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import VrlListSectionHeader from '../VrlListSectionHeader.vue';

describe('VrlListSectionHeader', () => {
  it('renders title from prop', () => {
    const wrapper = mount(VrlListSectionHeader, {
      props: {
        title: 'Active Seasons',
      },
    });

    expect(wrapper.text()).toBe('Active Seasons');
  });

  it('renders title from slot', () => {
    const wrapper = mount(VrlListSectionHeader, {
      slots: {
        default: '<span>Completed Seasons</span>',
      },
    });

    expect(wrapper.html()).toContain('Completed Seasons');
  });

  it('slot overrides title prop', () => {
    const wrapper = mount(VrlListSectionHeader, {
      props: {
        title: 'From Prop',
      },
      slots: {
        default: 'From Slot',
      },
    });

    expect(wrapper.text()).toBe('From Slot');
    expect(wrapper.text()).not.toContain('From Prop');
  });

  it('has proper semantic role', () => {
    const wrapper = mount(VrlListSectionHeader, {
      props: {
        title: 'Test Section',
      },
    });

    expect(wrapper.attributes('role')).toBe('separator');
  });

  it('has typography and spacing classes', () => {
    const wrapper = mount(VrlListSectionHeader, {
      props: {
        title: 'Test',
      },
    });

    expect(wrapper.classes()).toContain('font-display');
    expect(wrapper.classes()).toContain('uppercase');
    expect(wrapper.classes()).toContain('font-semibold');
  });

  it('has data-test attribute', () => {
    const wrapper = mount(VrlListSectionHeader, {
      props: {
        title: 'Test',
      },
    });

    expect(wrapper.attributes('data-test')).toBe('list-section-header');
  });

  it('applies custom classes', () => {
    const wrapper = mount(VrlListSectionHeader, {
      props: {
        title: 'Test',
        class: 'custom-class',
      },
    });

    expect(wrapper.classes()).toContain('custom-class');
    expect(wrapper.classes()).toContain('font-display');
  });
});
