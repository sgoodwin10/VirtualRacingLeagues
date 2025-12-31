import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import DriverStatusBadge from '../DriverStatusBadge.vue';
import type { DriverStatus } from '@app/types/driver';

// Mock StatusIndicator component
vi.mock('@app/components/common/indicators', () => ({
  StatusIndicator: {
    name: 'StatusIndicator',
    template: '<span class="status-indicator" :data-status="status">{{ label }}</span>',
    props: ['status', 'label', 'showDot', 'size'],
  },
}));

describe('DriverStatusBadge', () => {
  it('should render active status with correct config', () => {
    const wrapper = mount(DriverStatusBadge, {
      props: {
        status: 'active' as DriverStatus,
      },
    });

    const statusIndicator = wrapper.findComponent({ name: 'StatusIndicator' });
    expect(statusIndicator.exists()).toBe(true);
    expect(statusIndicator.props('status')).toBe('active');
    expect(statusIndicator.props('label')).toBe('Active');
    expect(statusIndicator.props('showDot')).toBe(true);
    expect(statusIndicator.props('size')).toBe('md');
  });

  it('should render inactive status with correct config', () => {
    const wrapper = mount(DriverStatusBadge, {
      props: {
        status: 'inactive' as DriverStatus,
      },
    });

    const statusIndicator = wrapper.findComponent({ name: 'StatusIndicator' });
    expect(statusIndicator.exists()).toBe(true);
    expect(statusIndicator.props('status')).toBe('inactive');
    expect(statusIndicator.props('label')).toBe('Inactive');
    expect(statusIndicator.props('showDot')).toBe(true);
    expect(statusIndicator.props('size')).toBe('md');
  });

  it('should render banned status with correct config (maps to error)', () => {
    const wrapper = mount(DriverStatusBadge, {
      props: {
        status: 'banned' as DriverStatus,
      },
    });

    const statusIndicator = wrapper.findComponent({ name: 'StatusIndicator' });
    expect(statusIndicator.exists()).toBe(true);
    expect(statusIndicator.props('status')).toBe('error');
    expect(statusIndicator.props('label')).toBe('Banned');
    expect(statusIndicator.props('showDot')).toBe(true);
    expect(statusIndicator.props('size')).toBe('md');
  });

  it('should handle status prop changes', async () => {
    const wrapper = mount(DriverStatusBadge, {
      props: {
        status: 'active' as DriverStatus,
      },
    });

    let statusIndicator = wrapper.findComponent({ name: 'StatusIndicator' });
    expect(statusIndicator.props('status')).toBe('active');
    expect(statusIndicator.props('label')).toBe('Active');

    await wrapper.setProps({ status: 'banned' as DriverStatus });
    statusIndicator = wrapper.findComponent({ name: 'StatusIndicator' });
    expect(statusIndicator.props('status')).toBe('error');
    expect(statusIndicator.props('label')).toBe('Banned');

    await wrapper.setProps({ status: 'inactive' as DriverStatus });
    statusIndicator = wrapper.findComponent({ name: 'StatusIndicator' });
    expect(statusIndicator.props('status')).toBe('inactive');
    expect(statusIndicator.props('label')).toBe('Inactive');
  });

  it('should correctly map all DriverStatus values to StatusIndicator types', () => {
    // Test active
    const activeWrapper = mount(DriverStatusBadge, {
      props: { status: 'active' as DriverStatus },
    });
    expect(activeWrapper.findComponent({ name: 'StatusIndicator' }).props('status')).toBe('active');

    // Test banned (should map to error for red color)
    const bannedWrapper = mount(DriverStatusBadge, {
      props: { status: 'banned' as DriverStatus },
    });
    expect(bannedWrapper.findComponent({ name: 'StatusIndicator' }).props('status')).toBe('error');

    // Test inactive
    const inactiveWrapper = mount(DriverStatusBadge, {
      props: { status: 'inactive' as DriverStatus },
    });
    expect(inactiveWrapper.findComponent({ name: 'StatusIndicator' }).props('status')).toBe(
      'inactive',
    );
  });
});
