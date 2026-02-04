import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import AdminMaintenanceBar from './AdminMaintenanceBar.vue';

// Mock the composable
vi.mock('@app/composables/useSiteConfig', () => ({
  useSiteConfig: () => ({
    maintenanceMessage: { value: 'Scheduled maintenance in progress' },
  }),
}));

describe('AdminMaintenanceBar', () => {
  it('renders the admin maintenance bar', () => {
    const wrapper = mount(AdminMaintenanceBar);
    expect(wrapper.find('div').exists()).toBe(true);
  });

  it('displays the maintenance message', () => {
    const wrapper = mount(AdminMaintenanceBar);
    expect(wrapper.text()).toContain('Site is in maintenance mode');
    expect(wrapper.text()).toContain('Scheduled maintenance in progress');
  });

  it('has fixed positioning at the top', () => {
    const wrapper = mount(AdminMaintenanceBar);
    const bar = wrapper.find('div');
    expect(bar.classes()).toContain('fixed');
    expect(bar.classes()).toContain('top-0');
  });

  it('has the correct height', () => {
    const wrapper = mount(AdminMaintenanceBar);
    const bar = wrapper.find('div');
    expect(bar.classes()).toContain('h-5');
  });

  it('has red background color', () => {
    const wrapper = mount(AdminMaintenanceBar);
    const bar = wrapper.find('div');
    expect(bar.classes()).toContain('bg-[var(--red)]');
  });
});
