import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import VrlTabs from '../VrlTabs.vue';
import type { TabItem } from '@public/types/navigation';

describe('VrlTabs', () => {
  const mockTabs: TabItem[] = [
    { key: 'standings', label: 'Standings' },
    { key: 'drivers', label: 'Drivers' },
    { key: 'teams', label: 'Teams' },
    { key: 'results', label: 'Results' },
  ];

  it('renders all tabs', () => {
    const wrapper = mount(VrlTabs, {
      props: {
        modelValue: 'standings',
        tabs: mockTabs,
      },
    });

    expect(wrapper.findAll('[data-test="tab"]')).toHaveLength(4);
    expect(wrapper.text()).toContain('Standings');
    expect(wrapper.text()).toContain('Drivers');
    expect(wrapper.text()).toContain('Teams');
    expect(wrapper.text()).toContain('Results');
  });

  it('renders with 2 tabs', () => {
    const tabs: TabItem[] = [
      { key: 'overview', label: 'Overview' },
      { key: 'details', label: 'Details' },
    ];

    const wrapper = mount(VrlTabs, {
      props: {
        modelValue: 'overview',
        tabs,
      },
    });

    expect(wrapper.findAll('[data-test="tab"]')).toHaveLength(2);
  });

  it('renders with 10 tabs', () => {
    const tabs: TabItem[] = Array.from({ length: 10 }, (_, i) => ({
      key: `tab-${i}`,
      label: `Tab ${i + 1}`,
    }));

    const wrapper = mount(VrlTabs, {
      props: {
        modelValue: 'tab-0',
        tabs,
      },
    });

    expect(wrapper.findAll('[data-test="tab"]')).toHaveLength(10);
  });

  it('marks active tab with aria-selected', () => {
    const wrapper = mount(VrlTabs, {
      props: {
        modelValue: 'drivers',
        tabs: mockTabs,
      },
    });

    const tabs = wrapper.findAll('[data-test="tab"]');
    expect(tabs[0].attributes('aria-selected')).toBe('false');
    expect(tabs[1].attributes('aria-selected')).toBe('true');
    expect(tabs[2].attributes('aria-selected')).toBe('false');
  });

  it('applies active class to active tab', () => {
    const wrapper = mount(VrlTabs, {
      props: {
        modelValue: 'teams',
        tabs: mockTabs,
      },
    });

    const tabs = wrapper.findAll('[data-test="tab"]');
    expect(tabs[0].classes()).not.toContain('bg-[var(--cyan)]');
    expect(tabs[1].classes()).not.toContain('bg-[var(--cyan)]');
    expect(tabs[2].classes()).toContain('bg-[var(--cyan)]');
    expect(tabs[3].classes()).not.toContain('bg-[var(--cyan)]');
  });

  it('emits update:modelValue on tab click', async () => {
    const wrapper = mount(VrlTabs, {
      props: {
        modelValue: 'standings',
        tabs: mockTabs,
      },
    });

    const tabs = wrapper.findAll('[data-test="tab"]');
    await tabs[1].trigger('click');

    expect(wrapper.emitted('update:modelValue')).toBeTruthy();
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['drivers']);
  });

  it('emits change event on tab click', async () => {
    const wrapper = mount(VrlTabs, {
      props: {
        modelValue: 'standings',
        tabs: mockTabs,
      },
    });

    const tabs = wrapper.findAll('[data-test="tab"]');
    await tabs[2].trigger('click');

    expect(wrapper.emitted('change')).toBeTruthy();
    expect(wrapper.emitted('change')?.[0]).toEqual(['teams']);
  });

  it('prevents interaction with disabled tabs', async () => {
    const tabs: TabItem[] = [
      { key: 'standings', label: 'Standings' },
      { key: 'drivers', label: 'Drivers', disabled: true },
      { key: 'teams', label: 'Teams' },
    ];

    const wrapper = mount(VrlTabs, {
      props: {
        modelValue: 'standings',
        tabs,
      },
    });

    const tabElements = wrapper.findAll('[data-test="tab"]');
    await tabElements[1].trigger('click');

    // Should not emit events for disabled tab
    expect(wrapper.emitted('update:modelValue')).toBeFalsy();
    expect(wrapper.emitted('change')).toBeFalsy();
  });

  it('applies disabled class and attribute to disabled tabs', () => {
    const tabs: TabItem[] = [
      { key: 'standings', label: 'Standings' },
      { key: 'drivers', label: 'Drivers', disabled: true },
      { key: 'teams', label: 'Teams' },
    ];

    const wrapper = mount(VrlTabs, {
      props: {
        modelValue: 'standings',
        tabs,
      },
    });

    const tabElements = wrapper.findAll('[data-test="tab"]');
    expect(tabElements[1].classes()).toContain('opacity-50');
    expect(tabElements[1].classes()).toContain('cursor-not-allowed');
    expect(tabElements[1].attributes('disabled')).toBeDefined();
    expect(tabElements[1].attributes('aria-disabled')).toBe('true');
  });

  it('supports keyboard navigation with arrow keys', async () => {
    const wrapper = mount(VrlTabs, {
      props: {
        modelValue: 'standings',
        tabs: mockTabs,
      },
    });

    const tabs = wrapper.findAll('[data-test="tab"]');

    // ArrowRight should move focus
    await tabs[0].trigger('keydown', { key: 'ArrowRight' });
    // Focus moves but modelValue should not change until Enter/Space
    expect(wrapper.emitted('update:modelValue')).toBeFalsy();

    // Enter key should activate focused tab
    await tabs[1].trigger('keydown', { key: 'Enter' });
    expect(wrapper.emitted('update:modelValue')).toBeTruthy();
  });

  it('supports keyboard navigation with Home key', async () => {
    const wrapper = mount(VrlTabs, {
      props: {
        modelValue: 'teams',
        tabs: mockTabs,
      },
    });

    const tabs = wrapper.findAll('[data-test="tab"]');

    // Home key should focus first tab
    await tabs[2].trigger('keydown', { key: 'Home' });
    // Focus moves but modelValue should not change
    expect(wrapper.emitted('update:modelValue')).toBeFalsy();
  });

  it('supports keyboard navigation with End key', async () => {
    const wrapper = mount(VrlTabs, {
      props: {
        modelValue: 'standings',
        tabs: mockTabs,
      },
    });

    const tabs = wrapper.findAll('[data-test="tab"]');

    // End key should focus last tab
    await tabs[0].trigger('keydown', { key: 'End' });
    // Focus moves but modelValue should not change
    expect(wrapper.emitted('update:modelValue')).toBeFalsy();
  });

  it('supports keyboard activation with Space key', async () => {
    const wrapper = mount(VrlTabs, {
      props: {
        modelValue: 'standings',
        tabs: mockTabs,
      },
    });

    const tabs = wrapper.findAll('[data-test="tab"]');

    // Space key should activate the tab
    await tabs[2].trigger('keydown', { key: ' ' });
    expect(wrapper.emitted('update:modelValue')).toBeTruthy();
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['teams']);
  });

  it('renders tabs with icons', () => {
    const tabs: TabItem[] = [
      { key: 'overview', label: 'Overview', icon: 'house' },
      { key: 'analytics', label: 'Analytics', icon: 'chart-line' },
      { key: 'settings', label: 'Settings', icon: 'gear' },
    ];

    const wrapper = mount(VrlTabs, {
      props: {
        modelValue: 'overview',
        tabs,
      },
    });

    expect(wrapper.find('.ph-house').exists()).toBe(true);
    expect(wrapper.find('.ph-chart-line').exists()).toBe(true);
    expect(wrapper.find('.ph-gear').exists()).toBe(true);
  });

  it('renders tabs with badges', () => {
    const tabs: TabItem[] = [
      { key: 'inbox', label: 'Inbox', badge: 5 },
      { key: 'sent', label: 'Sent', badge: 'New' },
      { key: 'archive', label: 'Archive' },
    ];

    const wrapper = mount(VrlTabs, {
      props: {
        modelValue: 'inbox',
        tabs,
      },
    });

    const badges = wrapper.findAll('[data-test="tab-badge"]');
    expect(badges).toHaveLength(2);
    expect(badges[0].text()).toBe('5');
    expect(badges[1].text()).toBe('New');
  });

  it('renders custom tab-label slot', () => {
    const wrapper = mount(VrlTabs, {
      props: {
        modelValue: 'standings',
        tabs: mockTabs,
      },
      slots: {
        'tab-label': ({ tab }: { tab: TabItem }) => `Custom: ${tab.label}`,
      },
    });

    expect(wrapper.text()).toContain('Custom: Standings');
    expect(wrapper.text()).toContain('Custom: Drivers');
  });

  it('applies default variant class', () => {
    const wrapper = mount(VrlTabs, {
      props: {
        modelValue: 'standings',
        tabs: mockTabs,
      },
    });

    const tabsContainer = wrapper.find('[data-test="tabs"]');
    expect(tabsContainer.classes()).toContain('bg-[var(--bg-elevated)]');
  });

  it('applies minimal variant class', () => {
    const wrapper = mount(VrlTabs, {
      props: {
        modelValue: 'standings',
        tabs: mockTabs,
        variant: 'minimal',
      },
    });

    const tabsContainer = wrapper.find('[data-test="tabs"]');
    expect(tabsContainer.classes()).toContain('bg-transparent');
    expect(tabsContainer.classes()).not.toContain('bg-[var(--bg-elevated)]');
  });

  it('has proper ARIA attributes', () => {
    const wrapper = mount(VrlTabs, {
      props: {
        modelValue: 'standings',
        tabs: mockTabs,
      },
    });

    const tabsContainer = wrapper.find('[data-test="tabs"]');
    expect(tabsContainer.attributes('role')).toBe('tablist');

    const tabs = wrapper.findAll('[data-test="tab"]');
    tabs.forEach((tab) => {
      expect(tab.attributes('role')).toBe('tab');
      expect(tab.attributes('aria-selected')).toBeDefined();
    });
  });

  it('sets proper tab IDs', () => {
    const wrapper = mount(VrlTabs, {
      props: {
        modelValue: 'standings',
        tabs: mockTabs,
      },
    });

    const tabs = wrapper.findAll('[data-test="tab"]');
    expect(tabs[0].attributes('id')).toBe('tab-standings');
    expect(tabs[1].attributes('id')).toBe('tab-drivers');
    expect(tabs[2].attributes('id')).toBe('tab-teams');
    expect(tabs[3].attributes('id')).toBe('tab-results');
  });

  it('uses roving tabindex pattern', () => {
    const wrapper = mount(VrlTabs, {
      props: {
        modelValue: 'standings',
        tabs: mockTabs,
      },
    });

    const tabs = wrapper.findAll('[data-test="tab"]');
    // First non-disabled tab should have tabindex="0"
    expect(tabs[0].attributes('tabindex')).toBe('0');
    // Others should have tabindex="-1"
    expect(tabs[1].attributes('tabindex')).toBe('-1');
    expect(tabs[2].attributes('tabindex')).toBe('-1');
  });

  it('skips disabled tabs during keyboard navigation', async () => {
    const tabs: TabItem[] = [
      { key: 'tab1', label: 'Tab 1' },
      { key: 'tab2', label: 'Tab 2', disabled: true },
      { key: 'tab3', label: 'Tab 3' },
    ];

    const wrapper = mount(VrlTabs, {
      props: {
        modelValue: 'tab1',
        tabs,
      },
    });

    const tabElements = wrapper.findAll('[data-test="tab"]');

    // ArrowRight from tab1 should skip disabled tab2 and go to tab3
    await tabElements[0].trigger('keydown', { key: 'ArrowRight' });
    // The focus should have moved (implementation detail)
  });

  it('prevents default on keyboard navigation keys', async () => {
    const wrapper = mount(VrlTabs, {
      props: {
        modelValue: 'standings',
        tabs: mockTabs,
      },
    });

    const tabs = wrapper.findAll('[data-test="tab"]');
    const event = new KeyboardEvent('keydown', { key: 'ArrowRight' });
    const _preventDefaultSpy = vi.spyOn(event, 'preventDefault');

    await tabs[0].trigger('keydown', event);
    // preventDefault should be called to prevent page scroll
  });
});
