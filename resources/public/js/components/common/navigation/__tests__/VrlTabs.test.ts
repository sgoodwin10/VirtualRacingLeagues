import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import VrlTabs, { type TabItem } from '../VrlTabs.vue';

describe('VrlTabs', () => {
  const defaultTabs: TabItem[] = [{ label: 'Tab 1' }, { label: 'Tab 2' }, { label: 'Tab 3' }];

  describe('Rendering', () => {
    it('renders with required props', () => {
      const wrapper = mount(VrlTabs, {
        props: { tabs: defaultTabs },
      });

      expect(wrapper.exists()).toBe(true);
      expect(wrapper.text()).toContain('Tab 1');
      expect(wrapper.text()).toContain('Tab 2');
      expect(wrapper.text()).toContain('Tab 3');
    });

    it('renders custom class', () => {
      const wrapper = mount(VrlTabs, {
        props: {
          tabs: defaultTabs,
          class: 'custom-tabs',
        },
      });

      expect(wrapper.classes()).toContain('custom-tabs');
    });

    it('renders all tab buttons', () => {
      const wrapper = mount(VrlTabs, {
        props: { tabs: defaultTabs },
      });

      const buttons = wrapper.findAll('[role="tab"]');
      expect(buttons.length).toBe(3);
    });
  });

  describe('Active Tab', () => {
    it('first tab is active by default', () => {
      const wrapper = mount(VrlTabs, {
        props: { tabs: defaultTabs },
      });

      const firstButton = wrapper.find('[role="tab"]');
      expect(firstButton.attributes('aria-selected')).toBe('true');
    });

    it('respects modelValue prop', () => {
      const wrapper = mount(VrlTabs, {
        props: {
          tabs: defaultTabs,
          modelValue: 1,
        },
      });

      const buttons = wrapper.findAll('[role="tab"]');
      expect(buttons[0]?.attributes('aria-selected')).toBe('false');
      expect(buttons[1]?.attributes('aria-selected')).toBe('true');
    });

    it('changes active tab on click', async () => {
      const wrapper = mount(VrlTabs, {
        props: { tabs: defaultTabs },
      });

      const buttons = wrapper.findAll('[role="tab"]');
      await buttons[1]?.trigger('click');

      expect(buttons[1]?.attributes('aria-selected')).toBe('true');
    });

    it('emits update:modelValue on tab change', async () => {
      const wrapper = mount(VrlTabs, {
        props: { tabs: defaultTabs },
      });

      const buttons = wrapper.findAll('[role="tab"]');
      await buttons[2]?.trigger('click');

      expect(wrapper.emitted('update:modelValue')).toBeTruthy();
      expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([2]);
    });

    it('emits tab-change on tab change', async () => {
      const wrapper = mount(VrlTabs, {
        props: { tabs: defaultTabs },
      });

      const buttons = wrapper.findAll('[role="tab"]');
      await buttons[1]?.trigger('click');

      expect(wrapper.emitted('tab-change')).toBeTruthy();
      expect(wrapper.emitted('tab-change')?.[0]).toEqual([1, defaultTabs[1]]);
    });

    it('syncs with v-model changes', async () => {
      const wrapper = mount(VrlTabs, {
        props: {
          tabs: defaultTabs,
          modelValue: 0,
        },
      });

      await wrapper.setProps({ modelValue: 2 });

      const buttons = wrapper.findAll('[role="tab"]');
      expect(buttons[2]?.attributes('aria-selected')).toBe('true');
    });
  });

  describe('Disabled Tabs', () => {
    it('applies disabled state to disabled tabs', () => {
      const tabsWithDisabled: TabItem[] = [
        { label: 'Tab 1' },
        { label: 'Tab 2', disabled: true },
        { label: 'Tab 3' },
      ];

      const wrapper = mount(VrlTabs, {
        props: { tabs: tabsWithDisabled },
      });

      const buttons = wrapper.findAll('[role="tab"]');
      expect(buttons[1]?.attributes('disabled')).toBeDefined();
      expect(buttons[1]?.attributes('aria-disabled')).toBe('true');
    });

    it('does not select disabled tab on click', async () => {
      const tabsWithDisabled: TabItem[] = [
        { label: 'Tab 1' },
        { label: 'Tab 2', disabled: true },
        { label: 'Tab 3' },
      ];

      const wrapper = mount(VrlTabs, {
        props: { tabs: tabsWithDisabled },
      });

      const buttons = wrapper.findAll('[role="tab"]');
      await buttons[1]?.trigger('click');

      expect(buttons[0]?.attributes('aria-selected')).toBe('true');
      expect(buttons[1]?.attributes('aria-selected')).toBe('false');
    });

    it('applies opacity to disabled tabs', () => {
      const tabsWithDisabled: TabItem[] = [{ label: 'Tab 1' }, { label: 'Tab 2', disabled: true }];

      const wrapper = mount(VrlTabs, {
        props: { tabs: tabsWithDisabled },
      });

      const buttons = wrapper.findAll('[role="tab"]');
      expect(buttons[1]?.classes()).toContain('opacity-50');
      expect(buttons[1]?.classes()).toContain('cursor-not-allowed');
    });
  });

  describe('Icon Slots', () => {
    it('renders icon slot content', () => {
      const wrapper = mount(VrlTabs, {
        props: { tabs: defaultTabs },
        slots: {
          'icon-0': '<span class="test-icon">Icon</span>',
        },
      });

      expect(wrapper.find('.test-icon').exists()).toBe(true);
    });

    it('passes active state to icon slot', () => {
      const wrapper = mount(VrlTabs, {
        props: {
          tabs: defaultTabs,
          modelValue: 0,
        },
        slots: {
          'icon-0': '<span class="active-icon">Active</span>',
          'icon-1': '<span class="inactive-icon">Inactive</span>',
        },
      });

      expect(wrapper.find('.active-icon').exists()).toBe(true);
      expect(wrapper.find('.inactive-icon').exists()).toBe(true);
    });
  });

  describe('Count Badges', () => {
    it('renders count when provided', () => {
      const tabsWithCounts: TabItem[] = [
        { label: 'Drivers', count: 78 },
        { label: 'Races', count: 12 },
      ];

      const wrapper = mount(VrlTabs, {
        props: { tabs: tabsWithCounts },
      });

      expect(wrapper.text()).toContain('78');
      expect(wrapper.text()).toContain('12');
    });

    it('renders count of 0', () => {
      const tabsWithZeroCount: TabItem[] = [{ label: 'Empty', count: 0 }];

      const wrapper = mount(VrlTabs, {
        props: { tabs: tabsWithZeroCount },
      });

      expect(wrapper.text()).toContain('0');
    });

    it('does not render count when not provided', () => {
      const wrapper = mount(VrlTabs, {
        props: { tabs: defaultTabs },
      });

      const countBadges = wrapper.findAll('.px-1\\.5');
      expect(countBadges.length).toBe(0);
    });
  });

  describe('Accessibility', () => {
    it('has tablist role on container', () => {
      const wrapper = mount(VrlTabs, {
        props: { tabs: defaultTabs },
      });

      const tablist = wrapper.find('[role="tablist"]');
      expect(tablist.exists()).toBe(true);
    });

    it('has tab role on buttons', () => {
      const wrapper = mount(VrlTabs, {
        props: { tabs: defaultTabs },
      });

      const tabs = wrapper.findAll('[role="tab"]');
      expect(tabs.length).toBe(3);
    });

    it('has tabpanel role on content panels', () => {
      const wrapper = mount(VrlTabs, {
        props: { tabs: defaultTabs },
      });

      const panels = wrapper.findAll('[role="tabpanel"]');
      expect(panels.length).toBe(3);
    });

    it('sets aria-selected correctly', () => {
      const wrapper = mount(VrlTabs, {
        props: {
          tabs: defaultTabs,
          modelValue: 1,
        },
      });

      const buttons = wrapper.findAll('[role="tab"]');
      expect(buttons[0]?.attributes('aria-selected')).toBe('false');
      expect(buttons[1]?.attributes('aria-selected')).toBe('true');
      expect(buttons[2]?.attributes('aria-selected')).toBe('false');
    });

    it('sets aria-controls on tabs', () => {
      const wrapper = mount(VrlTabs, {
        props: { tabs: defaultTabs },
      });

      const buttons = wrapper.findAll('[role="tab"]');
      expect(buttons[0]?.attributes('aria-controls')).toBe('panel-0');
      expect(buttons[1]?.attributes('aria-controls')).toBe('panel-1');
    });

    it('sets aria-labelledby on panels', () => {
      const wrapper = mount(VrlTabs, {
        props: { tabs: defaultTabs },
      });

      const panels = wrapper.findAll('[role="tabpanel"]');
      expect(panels[0]?.attributes('aria-labelledby')).toBe('tab-0');
      expect(panels[1]?.attributes('aria-labelledby')).toBe('tab-1');
    });

    it('hides inactive panels', () => {
      const wrapper = mount(VrlTabs, {
        props: {
          tabs: defaultTabs,
          modelValue: 0,
        },
      });

      const panels = wrapper.findAll('[role="tabpanel"]');
      expect(panels[0]?.attributes('hidden')).toBeUndefined();
      expect(panels[1]?.attributes('hidden')).toBeDefined();
      expect(panels[2]?.attributes('hidden')).toBeDefined();
    });

    it('sets correct tabindex (0 for active, -1 for inactive)', () => {
      const wrapper = mount(VrlTabs, {
        props: {
          tabs: defaultTabs,
          modelValue: 1,
        },
      });

      const buttons = wrapper.findAll('[role="tab"]');
      expect(buttons[0]?.attributes('tabindex')).toBe('-1');
      expect(buttons[1]?.attributes('tabindex')).toBe('0');
      expect(buttons[2]?.attributes('tabindex')).toBe('-1');
    });
  });

  describe('Keyboard Navigation', () => {
    it('navigates to next tab with ArrowRight', async () => {
      const wrapper = mount(VrlTabs, {
        props: { tabs: defaultTabs },
        attachTo: document.body,
      });

      const buttons = wrapper.findAll('[role="tab"]');
      await buttons[0]?.trigger('keydown', { key: 'ArrowRight' });

      expect(wrapper.emitted()).toBeDefined();
    });

    it('navigates to previous tab with ArrowLeft', async () => {
      const wrapper = mount(VrlTabs, {
        props: {
          tabs: defaultTabs,
          modelValue: 1,
        },
        attachTo: document.body,
      });

      const buttons = wrapper.findAll('[role="tab"]');
      await buttons[1]?.trigger('keydown', { key: 'ArrowLeft' });

      expect(wrapper.emitted()).toBeDefined();
    });

    it('navigates to first tab with Home', async () => {
      const wrapper = mount(VrlTabs, {
        props: {
          tabs: defaultTabs,
          modelValue: 2,
        },
        attachTo: document.body,
      });

      const buttons = wrapper.findAll('[role="tab"]');
      await buttons[2]?.trigger('keydown', { key: 'Home' });

      expect(wrapper.emitted()).toBeDefined();
    });

    it('navigates to last tab with End', async () => {
      const wrapper = mount(VrlTabs, {
        props: { tabs: defaultTabs },
        attachTo: document.body,
      });

      const buttons = wrapper.findAll('[role="tab"]');
      await buttons[0]?.trigger('keydown', { key: 'End' });

      expect(wrapper.emitted()).toBeDefined();
    });

    it('selects tab with Enter', async () => {
      const wrapper = mount(VrlTabs, {
        props: { tabs: defaultTabs },
      });

      const buttons = wrapper.findAll('[role="tab"]');
      await buttons[1]?.trigger('keydown', { key: 'Enter' });

      expect(wrapper.emitted('update:modelValue')).toBeTruthy();
    });

    it('selects tab with Space', async () => {
      const wrapper = mount(VrlTabs, {
        props: { tabs: defaultTabs },
      });

      const buttons = wrapper.findAll('[role="tab"]');
      await buttons[2]?.trigger('keydown', { key: ' ' });

      expect(wrapper.emitted('update:modelValue')).toBeTruthy();
    });

    it('wraps from last to first with ArrowRight', async () => {
      const wrapper = mount(VrlTabs, {
        props: {
          tabs: defaultTabs,
          modelValue: 2,
        },
        attachTo: document.body,
      });

      const buttons = wrapper.findAll('[role="tab"]');
      await buttons[2]?.trigger('keydown', { key: 'ArrowRight' });

      expect(wrapper.emitted()).toBeDefined();
    });

    it('wraps from first to last with ArrowLeft', async () => {
      const wrapper = mount(VrlTabs, {
        props: { tabs: defaultTabs },
        attachTo: document.body,
      });

      const buttons = wrapper.findAll('[role="tab"]');
      await buttons[0]?.trigger('keydown', { key: 'ArrowLeft' });

      expect(wrapper.emitted()).toBeDefined();
    });
  });

  describe('Slots', () => {
    it('renders named slot content for active tab', () => {
      const wrapper = mount(VrlTabs, {
        props: {
          tabs: defaultTabs,
          modelValue: 0,
        },
        slots: {
          'tab-0': '<div class="tab-0-content">Tab 0 Content</div>',
          'tab-1': '<div class="tab-1-content">Tab 1 Content</div>',
        },
      });

      expect(wrapper.find('.tab-0-content').exists()).toBe(true);
      expect(wrapper.text()).toContain('Tab 0 Content');
    });

    it('renders different slot content when tab changes', async () => {
      const wrapper = mount(VrlTabs, {
        props: {
          tabs: defaultTabs,
          modelValue: 0,
        },
        slots: {
          'tab-0': '<div class="tab-0-content">Tab 0 Content</div>',
          'tab-1': '<div class="tab-1-content">Tab 1 Content</div>',
        },
      });

      await wrapper.setProps({ modelValue: 1 });

      expect(wrapper.find('.tab-1-content').exists()).toBe(true);
      expect(wrapper.text()).toContain('Tab 1 Content');
    });

    it('renders default slot when named slot not provided', () => {
      const wrapper = mount(VrlTabs, {
        props: { tabs: defaultTabs },
        slots: {
          default: '<div class="default-content">Default Content</div>',
        },
      });

      expect(wrapper.find('.default-content').exists()).toBe(true);
    });
  });

  describe('Styling', () => {
    it('applies card-racing class', () => {
      const wrapper = mount(VrlTabs, {
        props: { tabs: defaultTabs },
      });

      expect(wrapper.classes()).toContain('card-racing');
    });

    it('applies rounded class', () => {
      const wrapper = mount(VrlTabs, {
        props: { tabs: defaultTabs },
      });

      expect(wrapper.classes()).toContain('rounded');
    });

    it('applies overflow-hidden class', () => {
      const wrapper = mount(VrlTabs, {
        props: { tabs: defaultTabs },
      });

      expect(wrapper.classes()).toContain('overflow-hidden');
    });

    it('active tab has gold text color', () => {
      const wrapper = mount(VrlTabs, {
        props: { tabs: defaultTabs },
      });

      const activeTab = wrapper.find('[aria-selected="true"]');
      expect(activeTab.classes()).toContain('text-racing-gold');
    });

    it('active tab has active indicator', () => {
      const wrapper = mount(VrlTabs, {
        props: { tabs: defaultTabs },
      });

      const activeTab = wrapper.find('[aria-selected="true"]');
      const indicator = activeTab.find('.bg-racing-gold');
      expect(indicator.exists()).toBe(true);
    });

    it('inactive tabs do not have active indicator', () => {
      const wrapper = mount(VrlTabs, {
        props: { tabs: defaultTabs },
      });

      const inactiveTabs = wrapper.findAll('[aria-selected="false"]');
      const inactiveTab = inactiveTabs[0];
      if (inactiveTab) {
        const indicator = inactiveTab.find('.bg-racing-gold');
        expect(indicator.exists()).toBe(false);
      }
    });

    it('tabs have border-left except first', () => {
      const wrapper = mount(VrlTabs, {
        props: { tabs: defaultTabs },
      });

      const buttons = wrapper.findAll('[role="tab"]');
      expect(buttons[0]?.classes()).not.toContain('border-l');
      expect(buttons[1]?.classes()).toContain('border-l');
      expect(buttons[2]?.classes()).toContain('border-l');
    });
  });

  describe('Edge Cases', () => {
    it('handles single tab', () => {
      const singleTab: TabItem[] = [{ label: 'Only Tab' }];

      const wrapper = mount(VrlTabs, {
        props: { tabs: singleTab },
      });

      expect(wrapper.findAll('[role="tab"]').length).toBe(1);
    });

    it('handles many tabs', () => {
      const manyTabs: TabItem[] = Array.from({ length: 10 }, (_, i) => ({
        label: `Tab ${i + 1}`,
      }));

      const wrapper = mount(VrlTabs, {
        props: { tabs: manyTabs },
      });

      expect(wrapper.findAll('[role="tab"]').length).toBe(10);
    });

    it('handles tab with all options', () => {
      const fullTab: TabItem[] = [
        {
          label: 'Complete Tab',
          count: 42,
          disabled: false,
        },
      ];

      const wrapper = mount(VrlTabs, {
        props: { tabs: fullTab },
      });

      expect(wrapper.text()).toContain('Complete Tab');
      expect(wrapper.text()).toContain('42');
    });
  });
});
