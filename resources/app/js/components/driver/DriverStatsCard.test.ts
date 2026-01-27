import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import DriverStatsCard from './DriverStatsCard.vue';

// Mock PrimeVue Card component
vi.mock('primevue/card', () => ({
  default: {
    name: 'Card',
    template: '<div><slot name="content"></slot></div>',
  },
}));

describe('DriverStatsCard', () => {
  it('should render all stats correctly', () => {
    const wrapper = mount(DriverStatsCard, {
      props: {
        totalCount: 50,
        activeCount: 45,
        inactiveCount: 3,
        bannedCount: 2,
      },
    });

    expect(wrapper.text()).toContain('50');
    expect(wrapper.text()).toContain('45');
    expect(wrapper.text()).toContain('3');
    expect(wrapper.text()).toContain('2');
    expect(wrapper.text()).toContain('Total Drivers');
    expect(wrapper.text()).toContain('Active');
    expect(wrapper.text()).toContain('Inactive');
    expect(wrapper.text()).toContain('Banned');
  });

  it('should render zero counts correctly', () => {
    const wrapper = mount(DriverStatsCard, {
      props: {
        totalCount: 0,
        activeCount: 0,
        inactiveCount: 0,
        bannedCount: 0,
      },
    });

    const text = wrapper.text();
    expect(text).toContain('0');
  });

  it('should update when props change', async () => {
    const wrapper = mount(DriverStatsCard, {
      props: {
        totalCount: 10,
        activeCount: 8,
        inactiveCount: 1,
        bannedCount: 1,
      },
    });

    expect(wrapper.text()).toContain('10');

    await wrapper.setProps({
      totalCount: 20,
      activeCount: 18,
      inactiveCount: 1,
      bannedCount: 1,
    });

    expect(wrapper.text()).toContain('20');
    expect(wrapper.text()).toContain('18');
  });

  it('should apply correct styling classes', () => {
    const wrapper = mount(DriverStatsCard, {
      props: {
        totalCount: 50,
        activeCount: 45,
        inactiveCount: 3,
        bannedCount: 2,
      },
    });

    const html = wrapper.html();
    expect(html).toContain('text-green-600'); // Active count
    expect(html).toContain('text-gray-600'); // Inactive count
    expect(html).toContain('text-red-600'); // Banned count
  });
});
