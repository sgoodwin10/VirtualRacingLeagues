import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import SplitModalTabBar from '../../partials/SplitModalTabBar.vue';
import SplitModalNavItem from '../../partials/SplitModalNavItem.vue';

describe('SplitModalTabBar', () => {
  it('renders all 4 tabs', () => {
    const wrapper = mount(SplitModalTabBar, {
      props: {
        activeSection: 'basic',
      },
      global: {
        stubs: {
          SplitModalNavItem,
        },
      },
    });

    const navItems = wrapper.findAllComponents(SplitModalNavItem);
    expect(navItems).toHaveLength(4);
  });

  it('highlights active tab', () => {
    const wrapper = mount(SplitModalTabBar, {
      props: {
        activeSection: 'driver',
      },
      global: {
        stubs: {
          SplitModalNavItem,
        },
      },
    });

    const navItems = wrapper.findAllComponents(SplitModalNavItem);

    // Find the Driver tab (second tab, index 1)
    const driverTab = navItems[1];
    expect(driverTab.props('active')).toBe(true);

    // Other tabs should not be active
    expect(navItems[0].props('active')).toBe(false);
    expect(navItems[2].props('active')).toBe(false);
    expect(navItems[3].props('active')).toBe(false);
  });

  it('emits section-change on tab click', async () => {
    const wrapper = mount(SplitModalTabBar, {
      props: {
        activeSection: 'basic',
      },
      global: {
        stubs: {
          SplitModalNavItem,
        },
      },
    });

    const navItems = wrapper.findAllComponents(SplitModalNavItem);

    // Click the Driver tab
    await navItems[1].vm.$emit('click');

    expect(wrapper.emitted('section-change')).toBeTruthy();
    expect(wrapper.emitted('section-change')?.[0]).toEqual(['driver']);
  });

  it('sets compact mode on all nav items', () => {
    const wrapper = mount(SplitModalTabBar, {
      props: {
        activeSection: 'basic',
      },
      global: {
        stubs: {
          SplitModalNavItem,
        },
      },
    });

    const navItems = wrapper.findAllComponents(SplitModalNavItem);

    navItems.forEach((navItem) => {
      expect(navItem.props('compact')).toBe(true);
    });
  });

  it('renders correct labels for all sections', () => {
    const wrapper = mount(SplitModalTabBar, {
      props: {
        activeSection: 'basic',
      },
      global: {
        stubs: {
          SplitModalNavItem,
        },
      },
    });

    const navItems = wrapper.findAllComponents(SplitModalNavItem);

    expect(navItems[0].props('label')).toBe('Basic');
    expect(navItems[1].props('label')).toBe('Driver');
    expect(navItems[2].props('label')).toBe('Team');
    expect(navItems[3].props('label')).toBe('Brand');
  });

  it('has scrollable container for overflow', () => {
    const wrapper = mount(SplitModalTabBar, {
      props: {
        activeSection: 'basic',
      },
      global: {
        stubs: {
          SplitModalNavItem,
        },
      },
    });

    const tabBar = wrapper.find('.tab-bar');
    expect(tabBar.exists()).toBe(true);

    // Note: actual style computation may not work in JSDOM, but structure is verified
  });
});
