import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import DivisionTabs from './DivisionTabs.vue';
import type { SeasonStandingDivision } from '@public/types/public';

describe('DivisionTabs', () => {
  const mockDivisions: SeasonStandingDivision[] = [
    {
      division_id: 1,
      division_name: 'Division 1',
      drivers: [],
    },
    {
      division_id: 2,
      division_name: 'Division 2',
      drivers: [],
    },
    {
      division_id: 3,
      division_name: 'Division 3',
      drivers: [],
    },
  ];

  const defaultProps = {
    divisions: mockDivisions,
    modelValue: null as number | null,
  };

  describe('Rendering', () => {
    it('should render tabs for all divisions', () => {
      const wrapper = mount(DivisionTabs, {
        props: defaultProps,
      });

      const tabs = wrapper.findAll('.standings-tab');
      expect(tabs.length).toBe(3);
    });

    it('should render division names', () => {
      const wrapper = mount(DivisionTabs, {
        props: defaultProps,
      });

      const tabs = wrapper.findAll('.standings-tab');
      expect(tabs[0]?.text()).toBe('Division 1');
      expect(tabs[1]?.text()).toBe('Division 2');
      expect(tabs[2]?.text()).toBe('Division 3');
    });

    it('should render tabs container with proper styling', () => {
      const wrapper = mount(DivisionTabs, {
        props: defaultProps,
      });

      const container = wrapper.find('.standings-tabs');
      expect(container.exists()).toBe(true);
      expect(container.classes()).toContain('flex');
      expect(container.classes()).toContain('gap-2');
    });
  });

  describe('Active Tab State', () => {
    it('should apply active styles to selected division', () => {
      const wrapper = mount(DivisionTabs, {
        props: {
          ...defaultProps,
          modelValue: 1,
        },
      });

      const tabs = wrapper.findAll('.standings-tab');
      const firstTab = tabs[0];

      expect(firstTab?.classes()).toContain('bg-[var(--cyan)]');
      expect(firstTab?.classes()).toContain('border-[var(--cyan)]');
      expect(firstTab?.classes()).toContain('text-[var(--bg-dark)]');
    });

    it('should apply inactive styles to non-selected divisions', () => {
      const wrapper = mount(DivisionTabs, {
        props: {
          ...defaultProps,
          modelValue: 1,
        },
      });

      const tabs = wrapper.findAll('.standings-tab');
      const secondTab = tabs[1];

      expect(secondTab?.classes()).toContain('bg-transparent');
      expect(secondTab?.classes()).toContain('border-[var(--border)]');
      expect(secondTab?.classes()).toContain('text-[var(--text-secondary)]');
    });

    it('should apply inactive styles when no division is selected', () => {
      const wrapper = mount(DivisionTabs, {
        props: {
          ...defaultProps,
          modelValue: null,
        },
      });

      const tabs = wrapper.findAll('.standings-tab');
      tabs.forEach((tab) => {
        expect(tab.classes()).toContain('bg-transparent');
      });
    });

    it('should update active tab when modelValue changes', async () => {
      const wrapper = mount(DivisionTabs, {
        props: {
          ...defaultProps,
          modelValue: 1,
        },
      });

      await wrapper.setProps({ modelValue: 2 });

      const tabs = wrapper.findAll('.standings-tab');
      expect(tabs[0]?.classes()).toContain('bg-transparent');
      expect(tabs[1]?.classes()).toContain('bg-[var(--cyan)]');
    });
  });

  describe('Interactions', () => {
    it('should emit update:modelValue when tab is clicked', async () => {
      const wrapper = mount(DivisionTabs, {
        props: defaultProps,
      });

      const tabs = wrapper.findAll('.standings-tab');
      await tabs[0]?.trigger('click');

      expect(wrapper.emitted('update:modelValue')).toBeTruthy();
      expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([1]);
    });

    it('should emit correct division ID when clicking different tabs', async () => {
      const wrapper = mount(DivisionTabs, {
        props: defaultProps,
      });

      const tabs = wrapper.findAll('.standings-tab');
      await tabs[1]?.trigger('click');

      expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([2]);

      await tabs[2]?.trigger('click');
      expect(wrapper.emitted('update:modelValue')?.[1]).toEqual([3]);
    });

    it('should allow clicking already active tab', async () => {
      const wrapper = mount(DivisionTabs, {
        props: {
          ...defaultProps,
          modelValue: 1,
        },
      });

      const tabs = wrapper.findAll('.standings-tab');
      await tabs[0]?.trigger('click');

      expect(wrapper.emitted('update:modelValue')).toBeTruthy();
      expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([1]);
    });
  });

  describe('Styling', () => {
    it('should apply hover effect to tabs', () => {
      const wrapper = mount(DivisionTabs, {
        props: defaultProps,
      });

      const tabs = wrapper.findAll('.standings-tab');
      tabs.forEach((tab) => {
        expect(tab.classes()).toContain('hover:border-[var(--cyan)]');
      });
    });

    it('should apply cursor pointer to all tabs', () => {
      const wrapper = mount(DivisionTabs, {
        props: defaultProps,
      });

      const tabs = wrapper.findAll('.standings-tab');
      tabs.forEach((tab) => {
        expect(tab.classes()).toContain('cursor-pointer');
      });
    });

    it('should apply transition to tabs', () => {
      const wrapper = mount(DivisionTabs, {
        props: defaultProps,
      });

      const tabs = wrapper.findAll('.standings-tab');
      tabs.forEach((tab) => {
        expect(tab.classes()).toContain('transition-all');
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty divisions array', () => {
      const wrapper = mount(DivisionTabs, {
        props: {
          divisions: [],
          modelValue: null,
        },
      });

      const tabs = wrapper.findAll('.standings-tab');
      expect(tabs.length).toBe(0);
    });

    it('should handle single division', () => {
      const wrapper = mount(DivisionTabs, {
        props: {
          divisions: [mockDivisions[0] as SeasonStandingDivision],
          modelValue: null,
        },
      });

      const tabs = wrapper.findAll('.standings-tab');
      expect(tabs.length).toBe(1);
      expect(tabs[0]?.text()).toBe('Division 1');
    });
  });
});
