import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import Badge from './Badge.vue';

describe('Badge', () => {
  it('renders without errors', () => {
    const wrapper = mount(Badge, {
      props: {
        text: 'Test Badge',
      },
    });

    expect(wrapper.exists()).toBe(true);
  });

  it('displays the text prop', () => {
    const wrapper = mount(Badge, {
      props: {
        text: 'Active',
      },
    });

    expect(wrapper.text()).toContain('Active');
  });

  it('applies default variant (secondary)', () => {
    const wrapper = mount(Badge, {
      props: {
        text: 'Test',
      },
    });

    expect(wrapper.html()).toContain('bg-gray-100');
    expect(wrapper.html()).toContain('text-gray-700');
  });

  it('applies success variant', () => {
    const wrapper = mount(Badge, {
      props: {
        text: 'Success',
        variant: 'success',
      },
    });

    expect(wrapper.html()).toContain('bg-green-100');
    expect(wrapper.html()).toContain('text-green-700');
  });

  it('applies danger variant', () => {
    const wrapper = mount(Badge, {
      props: {
        text: 'Danger',
        variant: 'danger',
      },
    });

    expect(wrapper.html()).toContain('bg-red-100');
    expect(wrapper.html()).toContain('text-red-700');
  });

  it('renders with icon', () => {
    const wrapper = mount(Badge, {
      props: {
        text: 'With Icon',
        icon: 'pi-circle-fill',
      },
    });

    expect(wrapper.find('.pi-circle-fill').exists()).toBe(true);
  });

  it('applies small size', () => {
    const wrapper = mount(Badge, {
      props: {
        text: 'Small',
        size: 'sm',
      },
    });

    expect(wrapper.html()).toContain('px-2');
    expect(wrapper.html()).toContain('py-0.5');
  });

  it('applies medium size by default', () => {
    const wrapper = mount(Badge, {
      props: {
        text: 'Medium',
      },
    });

    expect(wrapper.html()).toContain('px-2.5');
    expect(wrapper.html()).toContain('py-1');
  });
});
