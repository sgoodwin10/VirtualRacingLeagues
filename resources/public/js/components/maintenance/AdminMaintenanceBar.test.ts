import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import AdminMaintenanceBar from './AdminMaintenanceBar.vue';

// Mock useSiteConfig
vi.mock('@public/composables/useSiteConfig', () => ({
  useSiteConfig: vi.fn(() => ({
    isMaintenanceMode: { value: true },
  })),
}));

describe('AdminMaintenanceBar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the maintenance bar when maintenance mode is enabled', () => {
    const wrapper = mount(AdminMaintenanceBar);

    expect(wrapper.find('div').exists()).toBe(true);
    expect(wrapper.text()).toContain('Site is in Maintenance Mode');
  });

  it('displays warning emoji', () => {
    const wrapper = mount(AdminMaintenanceBar);

    expect(wrapper.text()).toContain('⚠️');
  });

  it('conditionally renders based on maintenance mode', () => {
    // This test verifies the v-if logic in the template
    // With default mock where isMaintenanceMode is true, bar should render
    const wrapper = mount(AdminMaintenanceBar);

    expect(wrapper.find('div').exists()).toBe(true);
  });

  it('has correct CSS classes for positioning and styling', () => {
    const wrapper = mount(AdminMaintenanceBar);

    const bar = wrapper.find('div');
    expect(bar.classes()).toContain('fixed');
    expect(bar.classes()).toContain('top-0');
    expect(bar.classes()).toContain('left-0');
    expect(bar.classes()).toContain('right-0');
    expect(bar.classes()).toContain('z-50');
  });

  it('has appropriate height', () => {
    const wrapper = mount(AdminMaintenanceBar);

    const bar = wrapper.find('div');
    expect(bar.classes()).toContain('h-[20px]');
  });

  it('uses red background color', () => {
    const wrapper = mount(AdminMaintenanceBar);

    const bar = wrapper.find('div');
    expect(bar.classes()).toContain('bg-[var(--red)]');
  });

  it('uses white text color', () => {
    const wrapper = mount(AdminMaintenanceBar);

    const bar = wrapper.find('div');
    expect(bar.classes()).toContain('text-white');
  });
});
