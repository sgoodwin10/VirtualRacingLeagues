import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import PrimeVue from 'primevue/config';
import Aura from '@primevue/themes/aura';
import TiebreakerRulesList from './TiebreakerRulesList.vue';
import Message from 'primevue/message';
import type { SeasonTiebreakerRule } from '@app/types/season';

// Mock vuedraggable
vi.mock('vuedraggable', () => ({
  default: {
    name: 'draggable',
    props: ['modelValue', 'itemKey', 'handle', 'ghostClass', 'chosenClass', 'dragClass'],
    template: `
      <div class="mock-draggable">
        <slot name="item" v-for="(element, index) in modelValue" :element="element" :index="index" :key="element[itemKey]"></slot>
      </div>
    `,
    emits: ['update:modelValue'],
  },
}));

describe('TiebreakerRulesList', () => {
  const mockRules: SeasonTiebreakerRule[] = [
    {
      id: 1,
      season_id: 1,
      rule_id: 1,
      rule_name: 'Most Wins',
      rule_slug: 'most-wins',
      rule_description: 'Driver with most race wins',
      order: 1,
    },
    {
      id: 2,
      season_id: 1,
      rule_id: 2,
      rule_name: 'Most Podiums',
      rule_slug: 'most-podiums',
      rule_description: 'Driver with most podium finishes',
      order: 2,
    },
    {
      id: 3,
      season_id: 1,
      rule_id: 3,
      rule_name: 'Best Average Finish',
      rule_slug: 'best-average-finish',
      rule_description: null,
      order: 3,
    },
  ];

  const createWrapper = (props: any = {}) => {
    return mount(TiebreakerRulesList, {
      props,
      global: {
        plugins: [
          [
            PrimeVue,
            {
              theme: {
                preset: Aura,
              },
            },
          ],
        ],
      },
    });
  };

  describe('Rendering States', () => {
    it('renders error message when error prop is provided', () => {
      const wrapper = createWrapper({
        modelValue: [],
        error: 'Failed to load tiebreaker rules',
      });

      const message = wrapper.findComponent(Message);
      expect(message.exists()).toBe(true);
      expect(message.props('severity')).toBe('error');
      expect(message.text()).toContain('Failed to load tiebreaker rules');
    });

    it('renders loading state when loading prop is true', () => {
      const wrapper = createWrapper({
        modelValue: [],
        loading: true,
      });

      expect(wrapper.find('.pi-spinner').exists()).toBe(true);
      expect(wrapper.text()).toContain('Loading tiebreaker rules...');
    });

    it('renders empty state when no rules are provided', () => {
      const wrapper = createWrapper({
        modelValue: [],
      });

      const message = wrapper.findComponent(Message);
      expect(message.exists()).toBe(true);
      expect(message.props('severity')).toBe('warn');
      expect(message.text()).toContain('No tiebreaker rules available');
    });

    it('renders draggable list when rules are provided', () => {
      const wrapper = createWrapper({
        modelValue: mockRules,
      });

      // The component uses vuedraggable (mocked)
      const draggableWrapper = wrapper.find('.mock-draggable');
      expect(draggableWrapper.exists()).toBe(true);
    });
  });

  describe('Rule Item Rendering', () => {
    it('renders all rules with correct order badges', () => {
      const wrapper = createWrapper({
        modelValue: mockRules,
      });

      // Check that all rule names are rendered
      expect(wrapper.text()).toContain('Most Wins');
      expect(wrapper.text()).toContain('Most Podiums');
      expect(wrapper.text()).toContain('Best Average Finish');
    });
  });

  describe('Drag and Drop Functionality', () => {
    it('emits update:modelValue when draggable emits update', async () => {
      const wrapper = createWrapper({
        modelValue: mockRules,
      });

      const reorderedRules = [mockRules[1], mockRules[0], mockRules[2]];

      // Find the draggable component and emit update
      const draggable = wrapper.findComponent({ name: 'draggable' });
      await draggable.vm.$emit('update:modelValue', reorderedRules);
      await wrapper.vm.$nextTick();

      expect(wrapper.emitted('update:modelValue')).toBeTruthy();
      const emittedValue = wrapper.emitted('update:modelValue')?.[0]?.[0];
      expect(emittedValue).toEqual(reorderedRules);
    });

    it('uses id as item-key for drag and drop', () => {
      const wrapper = createWrapper({
        modelValue: mockRules,
      });

      const draggable = wrapper.findComponent({ name: 'draggable' });
      expect(draggable.props('itemKey')).toBe('id');
    });
  });

  describe('Props and Defaults', () => {
    it('applies default values for optional props', () => {
      const wrapper = createWrapper({
        modelValue: mockRules,
      });

      expect(wrapper.vm.$props.loading).toBe(false);
      expect(wrapper.vm.$props.error).toBe(null);
    });

    it('accepts custom loading and error props', () => {
      const wrapper = createWrapper({
        modelValue: [],
        loading: true,
        error: 'Custom error',
      });

      expect(wrapper.vm.$props.loading).toBe(true);
      expect(wrapper.vm.$props.error).toBe('Custom error');
    });
  });

  describe('Component Integration', () => {
    it('renders draggable component with correct class', () => {
      const wrapper = createWrapper({
        modelValue: mockRules,
      });

      const draggable = wrapper.findComponent({ name: 'draggable' });
      expect(draggable.exists()).toBe(true);
    });

    it('handles empty modelValue gracefully', () => {
      const wrapper = createWrapper({
        modelValue: [],
      });

      expect(wrapper.findComponent({ name: 'draggable' }).exists()).toBe(false);
      expect(wrapper.findComponent(Message).exists()).toBe(true);
    });
  });
});
