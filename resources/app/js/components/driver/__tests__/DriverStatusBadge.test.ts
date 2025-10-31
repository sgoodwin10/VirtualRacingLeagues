import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import DriverStatusBadge from '../DriverStatusBadge.vue';
import type { DriverStatus } from '@app/types/driver';

// Mock PrimeVue Chip component
vi.mock('primevue/chip', () => ({
  default: {
    name: 'Chip',
    template: '<span :class="$attrs.class">{{ label }}</span>',
    props: ['label'],
  },
}));

describe('DriverStatusBadge', () => {
  it('should render active status with correct styling', () => {
    const wrapper = mount(DriverStatusBadge, {
      props: {
        status: 'active' as DriverStatus,
      },
    });

    expect(wrapper.text()).toBe('Active');
    expect(wrapper.html()).toContain('bg-green-100');
    expect(wrapper.html()).toContain('text-green-800');
  });

  it('should render inactive status with correct styling', () => {
    const wrapper = mount(DriverStatusBadge, {
      props: {
        status: 'inactive' as DriverStatus,
      },
    });

    expect(wrapper.text()).toBe('Inactive');
    expect(wrapper.html()).toContain('bg-gray-100');
    expect(wrapper.html()).toContain('text-gray-800');
  });

  it('should render banned status with correct styling', () => {
    const wrapper = mount(DriverStatusBadge, {
      props: {
        status: 'banned' as DriverStatus,
      },
    });

    expect(wrapper.text()).toBe('Banned');
    expect(wrapper.html()).toContain('bg-red-100');
    expect(wrapper.html()).toContain('text-red-800');
  });

  it('should handle status prop changes', async () => {
    const wrapper = mount(DriverStatusBadge, {
      props: {
        status: 'active' as DriverStatus,
      },
    });

    expect(wrapper.text()).toBe('Active');

    await wrapper.setProps({ status: 'banned' as DriverStatus });
    expect(wrapper.text()).toBe('Banned');
    expect(wrapper.html()).toContain('bg-red-100');
  });
});
