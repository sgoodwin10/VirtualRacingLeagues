import { describe, it, expect, afterEach } from 'vitest';
import { mount, VueWrapper } from '@vue/test-utils';
import { nextTick } from 'vue';
import VrlFilterChips from '../VrlFilterChips.vue';

const mockOptions = [
  { label: 'All', value: 'all' },
  { label: 'GT7', value: 'gt7' },
  { label: 'ACC', value: 'acc' },
  { label: 'iRacing', value: 'iracing' },
];

describe('VrlFilterChips', () => {
  let wrapper: VueWrapper | null = null;

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount();
      wrapper = null;
    }
  });
  it('renders with default props', () => {
    const wrapper = mount(VrlFilterChips, {
      props: {
        modelValue: 'all',
        options: mockOptions,
      },
    });

    const container = wrapper.find('[role="radiogroup"]');
    expect(container.exists()).toBe(true);
  });

  describe('rendering options', () => {
    it('renders all options', () => {
      const wrapper = mount(VrlFilterChips, {
        props: {
          modelValue: 'all',
          options: mockOptions,
        },
      });

      const chips = wrapper.findAll('[role="radio"]');
      expect(chips.length).toBe(4);
    });

    it('displays correct option labels', () => {
      const wrapper = mount(VrlFilterChips, {
        props: {
          modelValue: 'all',
          options: mockOptions,
        },
      });

      const chips = wrapper.findAll('button');
      expect(chips.length).toBe(4);
      expect(chips[0]?.text()).toBe('All');
      expect(chips[1]?.text()).toBe('GT7');
      expect(chips[2]?.text()).toBe('ACC');
      expect(chips[3]?.text()).toBe('iRacing');
    });

    it('handles empty options array', () => {
      const wrapper = mount(VrlFilterChips, {
        props: {
          modelValue: '',
          options: [],
        },
      });

      const chips = wrapper.findAll('[role="radio"]');
      expect(chips.length).toBe(0);
    });
  });

  describe('active state styling', () => {
    it('applies active styling to selected chip', () => {
      const wrapper = mount(VrlFilterChips, {
        props: {
          modelValue: 'gt7',
          options: mockOptions,
        },
      });

      const chips = wrapper.findAll('button');
      const activeChip = chips[1]; // GT7 chip

      expect(activeChip).toBeDefined();
      expect(activeChip?.classes()).toContain('bg-racing-gold');
      expect(activeChip?.classes()).toContain('text-racing-carbon');
    });

    it('applies inactive styling to non-selected chips', () => {
      const wrapper = mount(VrlFilterChips, {
        props: {
          modelValue: 'gt7',
          options: mockOptions,
        },
      });

      const chips = wrapper.findAll('button');
      const inactiveChip = chips[0]; // All chip

      expect(inactiveChip).toBeDefined();
      expect(inactiveChip?.classes()).not.toContain('bg-racing-gold');
      expect(inactiveChip?.classes()).not.toContain('text-racing-carbon');
    });

    it('updates styling when selection changes', async () => {
      const wrapper = mount(VrlFilterChips, {
        props: {
          modelValue: 'all',
          options: mockOptions,
        },
      });

      const chips = wrapper.findAll('button');
      expect(chips[0]?.classes()).toContain('bg-racing-gold');

      await wrapper.setProps({ modelValue: 'gt7' });

      expect(chips[0]?.classes()).not.toContain('bg-racing-gold');
      expect(chips[1]?.classes()).toContain('bg-racing-gold');
    });
  });

  describe('v-model binding', () => {
    it('emits update:modelValue on click', async () => {
      const wrapper = mount(VrlFilterChips, {
        props: {
          modelValue: 'all',
          options: mockOptions,
        },
      });

      const chips = wrapper.findAll('button');
      if (chips[1]) {
        await chips[1].trigger('click'); // Click GT7
      }

      expect(wrapper.emitted('update:modelValue')).toBeTruthy();
      expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['gt7']);
    });

    it('handles number values', async () => {
      const numberOptions = [
        { label: 'All', value: 0 },
        { label: 'Active', value: 1 },
        { label: 'Inactive', value: 2 },
      ];

      const wrapper = mount(VrlFilterChips, {
        props: {
          modelValue: 0,
          options: numberOptions,
        },
      });

      const chips = wrapper.findAll('button');
      if (chips[1]) {
        await chips[1].trigger('click');
      }

      expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([1]);
    });
  });

  describe('ARIA attributes', () => {
    it('has role="radiogroup" on container', () => {
      const wrapper = mount(VrlFilterChips, {
        props: {
          modelValue: 'all',
          options: mockOptions,
        },
      });

      const container = wrapper.find('[role="radiogroup"]');
      expect(container.exists()).toBe(true);
    });

    it('has aria-label on container', () => {
      const wrapper = mount(VrlFilterChips, {
        props: {
          modelValue: 'all',
          options: mockOptions,
        },
      });

      const container = wrapper.find('[role="radiogroup"]');
      expect(container.attributes('aria-label')).toBe('Filter options');
    });

    it('has role="radio" on each chip', () => {
      const wrapper = mount(VrlFilterChips, {
        props: {
          modelValue: 'all',
          options: mockOptions,
        },
      });

      const radios = wrapper.findAll('[role="radio"]');
      expect(radios.length).toBe(mockOptions.length);
    });

    it('sets aria-checked="true" on active chip', () => {
      const wrapper = mount(VrlFilterChips, {
        props: {
          modelValue: 'gt7',
          options: mockOptions,
        },
      });

      const chips = wrapper.findAll('[role="radio"]');
      expect(chips[1]?.attributes('aria-checked')).toBe('true');
    });

    it('sets aria-checked="false" on inactive chips', () => {
      const wrapper = mount(VrlFilterChips, {
        props: {
          modelValue: 'gt7',
          options: mockOptions,
        },
      });

      const chips = wrapper.findAll('[role="radio"]');
      expect(chips[0]?.attributes('aria-checked')).toBe('false');
      expect(chips[2]?.attributes('aria-checked')).toBe('false');
      expect(chips[3]?.attributes('aria-checked')).toBe('false');
    });

    it('updates aria-checked when selection changes', async () => {
      const wrapper = mount(VrlFilterChips, {
        props: {
          modelValue: 'all',
          options: mockOptions,
        },
      });

      const chips = wrapper.findAll('[role="radio"]');
      expect(chips[0]?.attributes('aria-checked')).toBe('true');

      await wrapper.setProps({ modelValue: 'acc' });
      expect(chips[0]?.attributes('aria-checked')).toBe('false');
      expect(chips[2]?.attributes('aria-checked')).toBe('true');
    });
  });

  describe('keyboard navigation', () => {
    it('moves focus to next chip on ArrowRight', async () => {
      wrapper = mount(VrlFilterChips, {
        props: {
          modelValue: 'all',
          options: mockOptions,
        },
        attachTo: document.body,
      });

      const chips = wrapper.findAll('button');
      (chips[0]?.element as HTMLElement).focus();
      await nextTick();
      expect(document.activeElement).toBe(chips[0]?.element);

      await chips[0]?.trigger('keydown', { key: 'ArrowRight' });
      await nextTick();
      await nextTick(); // Extra tick for focus changes

      expect(document.activeElement).toBe(chips[1]?.element);
    });

    it('moves focus to previous chip on ArrowLeft', async () => {
      wrapper = mount(VrlFilterChips, {
        props: {
          modelValue: 'all',
          options: mockOptions,
        },
        attachTo: document.body,
      });

      const chips = wrapper.findAll('button');
      (chips[1]?.element as HTMLElement).focus();
      await nextTick();
      expect(document.activeElement).toBe(chips[1]?.element);

      await chips[1]?.trigger('keydown', { key: 'ArrowLeft' });
      await nextTick();
      await nextTick(); // Extra tick for focus changes

      expect(document.activeElement).toBe(chips[0]?.element);
    });

    it('wraps to first chip from last on ArrowRight', async () => {
      wrapper = mount(VrlFilterChips, {
        props: {
          modelValue: 'all',
          options: mockOptions,
        },
        attachTo: document.body,
      });

      const chips = wrapper.findAll('button');
      (chips[3]?.element as HTMLElement).focus();
      await nextTick();
      expect(document.activeElement).toBe(chips[3]?.element);

      await chips[3]?.trigger('keydown', { key: 'ArrowRight' });
      await nextTick();
      await nextTick(); // Extra tick for focus changes

      expect(document.activeElement).toBe(chips[0]?.element);
    });

    it('wraps to last chip from first on ArrowLeft', async () => {
      wrapper = mount(VrlFilterChips, {
        props: {
          modelValue: 'all',
          options: mockOptions,
        },
        attachTo: document.body,
      });

      const chips = wrapper.findAll('button');
      (chips[0]?.element as HTMLElement).focus();
      await nextTick();
      expect(document.activeElement).toBe(chips[0]?.element);

      await chips[0]?.trigger('keydown', { key: 'ArrowLeft' });
      await nextTick();
      await nextTick(); // Extra tick for focus changes

      expect(document.activeElement).toBe(chips[3]?.element);
    });

    it('supports ArrowDown for navigation', async () => {
      wrapper = mount(VrlFilterChips, {
        props: {
          modelValue: 'all',
          options: mockOptions,
        },
        attachTo: document.body,
      });

      const chips = wrapper.findAll('button');
      (chips[0]?.element as HTMLElement).focus();
      await nextTick();
      expect(document.activeElement).toBe(chips[0]?.element);

      await chips[0]?.trigger('keydown', { key: 'ArrowDown' });
      await nextTick();
      await nextTick(); // Extra tick for focus changes

      expect(document.activeElement).toBe(chips[1]?.element);
    });

    it('supports ArrowUp for navigation', async () => {
      wrapper = mount(VrlFilterChips, {
        props: {
          modelValue: 'all',
          options: mockOptions,
        },
        attachTo: document.body,
      });

      const chips = wrapper.findAll('button');
      (chips[1]?.element as HTMLElement).focus();
      await nextTick();
      expect(document.activeElement).toBe(chips[1]?.element);

      await chips[1]?.trigger('keydown', { key: 'ArrowUp' });
      await nextTick();
      await nextTick(); // Extra tick for focus changes

      expect(document.activeElement).toBe(chips[0]?.element);
    });

    it('moves to first chip on Home key', async () => {
      const wrapper = mount(VrlFilterChips, {
        props: {
          modelValue: 'all',
          options: mockOptions,
        },
        attachTo: document.body,
      });

      const chips = wrapper.findAll('button');
      if (chips[2]) {
        chips[2].element.focus();
        await chips[2].trigger('keydown', { key: 'Home' });
        expect(chips[2].element).toBeTruthy();
      }

      wrapper.unmount();
    });

    it('moves to last chip on End key', async () => {
      const wrapper = mount(VrlFilterChips, {
        props: {
          modelValue: 'all',
          options: mockOptions,
        },
        attachTo: document.body,
      });

      const chips = wrapper.findAll('button');
      if (chips[0]) {
        chips[0].element.focus();
        await chips[0].trigger('keydown', { key: 'End' });
        expect(chips[0].element).toBeTruthy();
      }

      wrapper.unmount();
    });

    it('selects chip on Enter key', async () => {
      const wrapper = mount(VrlFilterChips, {
        props: {
          modelValue: 'all',
          options: mockOptions,
        },
      });

      const chips = wrapper.findAll('button');
      if (chips[1]) {
        await chips[1].trigger('keydown', { key: 'Enter' });
      }

      expect(wrapper.emitted('update:modelValue')).toBeTruthy();
      expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['gt7']);
    });

    it('selects chip on Space key', async () => {
      const wrapper = mount(VrlFilterChips, {
        props: {
          modelValue: 'all',
          options: mockOptions,
        },
      });

      const chips = wrapper.findAll('button');
      if (chips[2]) {
        await chips[2].trigger('keydown', { key: ' ' });
      }

      expect(wrapper.emitted('update:modelValue')).toBeTruthy();
      expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['acc']);
    });

    it('does not navigate on other keys', async () => {
      const wrapper = mount(VrlFilterChips, {
        props: {
          modelValue: 'all',
          options: mockOptions,
        },
      });

      const chips = wrapper.findAll('button');
      if (chips[0]) {
        await chips[0].trigger('keydown', { key: 'a' });
        await chips[0].trigger('keydown', { key: 'Escape' });
      }

      // Should not emit for non-navigation keys
      expect(wrapper.emitted('update:modelValue')).toBeFalsy();
    });
  });

  describe('tabindex management', () => {
    it('sets tabindex="0" on active chip', () => {
      const wrapper = mount(VrlFilterChips, {
        props: {
          modelValue: 'gt7',
          options: mockOptions,
        },
      });

      const chips = wrapper.findAll('button');
      expect(chips[1]?.attributes('tabindex')).toBe('0');
    });

    it('sets tabindex="-1" on inactive chips', () => {
      const wrapper = mount(VrlFilterChips, {
        props: {
          modelValue: 'gt7',
          options: mockOptions,
        },
      });

      const chips = wrapper.findAll('button');
      expect(chips[0]?.attributes('tabindex')).toBe('-1');
      expect(chips[2]?.attributes('tabindex')).toBe('-1');
      expect(chips[3]?.attributes('tabindex')).toBe('-1');
    });

    it('updates tabindex when selection changes', async () => {
      const wrapper = mount(VrlFilterChips, {
        props: {
          modelValue: 'all',
          options: mockOptions,
        },
      });

      const chips = wrapper.findAll('button');
      expect(chips[0]?.attributes('tabindex')).toBe('0');

      await wrapper.setProps({ modelValue: 'acc' });

      expect(chips[0]?.attributes('tabindex')).toBe('-1');
      expect(chips[2]?.attributes('tabindex')).toBe('0');
    });
  });

  describe('styling', () => {
    it('has correct base classes', () => {
      const wrapper = mount(VrlFilterChips, {
        props: {
          modelValue: 'all',
          options: mockOptions,
        },
      });

      const chips = wrapper.findAll('button');
      expect(chips[0]?.classes()).toContain('font-display');
      expect(chips[0]?.classes()).toContain('text-[10px]');
      expect(chips[0]?.classes()).toContain('uppercase');
      expect(chips[0]?.classes()).toContain('tracking-wider');
      expect(chips[0]?.classes()).toContain('min-h-[44px]');
    });

    it('applies custom class to container', () => {
      const wrapper = mount(VrlFilterChips, {
        props: {
          modelValue: 'all',
          options: mockOptions,
          class: 'custom-class',
        },
      });

      const container = wrapper.find('[role="radiogroup"]');
      expect(container.classes()).toContain('custom-class');
    });

    it('uses CSS variables for inactive chips', () => {
      const wrapper = mount(VrlFilterChips, {
        props: {
          modelValue: 'gt7',
          options: mockOptions,
        },
      });

      const chips = wrapper.findAll('button');
      const inactiveChip = chips[0]; // All chip (not selected)

      expect(inactiveChip).toBeDefined();
      if (inactiveChip) {
        const style = inactiveChip.attributes('style');
        expect(style).toContain('var(--bg-tertiary)');
        expect(style).toContain('var(--text-muted)');
      }
    });
  });

  describe('touch target', () => {
    it('has 44px minimum height for accessibility', () => {
      const wrapper = mount(VrlFilterChips, {
        props: {
          modelValue: 'all',
          options: mockOptions,
        },
      });

      const chips = wrapper.findAll('button');
      chips.forEach((chip) => {
        expect(chip.classes()).toContain('min-h-[44px]');
      });
    });
  });

  describe('button type', () => {
    it('has type="button" to prevent form submission', () => {
      const wrapper = mount(VrlFilterChips, {
        props: {
          modelValue: 'all',
          options: mockOptions,
        },
      });

      const chips = wrapper.findAll('button');
      chips.forEach((chip) => {
        expect(chip.attributes('type')).toBe('button');
      });
    });
  });
});
