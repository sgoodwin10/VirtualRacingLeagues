import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import DrawerLoading from './DrawerLoading.vue';

describe('DrawerLoading', () => {
  it('renders with default message', () => {
    const wrapper = mount(DrawerLoading);

    expect(wrapper.text()).toContain('Loading...');
    expect(wrapper.find('.pi-spinner').exists()).toBe(true);
  });

  it('renders with custom message', () => {
    const wrapper = mount(DrawerLoading, {
      props: {
        message: 'Loading league data...',
      },
    });

    expect(wrapper.text()).toContain('Loading league data...');
    expect(wrapper.find('.pi-spinner').exists()).toBe(true);
  });

  it('has correct layout classes', () => {
    const wrapper = mount(DrawerLoading);

    const container = wrapper.find('div');
    expect(container.classes()).toContain('h-full');
    expect(container.classes()).toContain('flex');
    expect(container.classes()).toContain('items-center');
    expect(container.classes()).toContain('justify-center');
  });

  it('has spinner with correct classes', () => {
    const wrapper = mount(DrawerLoading);

    const spinner = wrapper.find('.pi-spinner');
    expect(spinner.classes()).toContain('pi');
    expect(spinner.classes()).toContain('pi-spin');
    expect(spinner.classes()).toContain('pi-spinner');
    expect(spinner.classes()).toContain('text-4xl');
    expect(spinner.classes()).toContain('text-blue-500');
    expect(spinner.classes()).toContain('mb-4');
  });

  it('has message with correct classes', () => {
    const wrapper = mount(DrawerLoading);

    const message = wrapper.find('p');
    expect(message.classes()).toContain('text-gray-600');
  });
});
