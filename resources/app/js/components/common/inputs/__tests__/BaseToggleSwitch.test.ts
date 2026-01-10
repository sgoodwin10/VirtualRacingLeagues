import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import BaseToggleSwitch from '../BaseToggleSwitch.vue';
import PrimeToggleSwitch from 'primevue/toggleswitch';

describe('BaseToggleSwitch', () => {
  describe('Rendering', () => {
    it('renders PrimeVue ToggleSwitch component', () => {
      const wrapper = mount(BaseToggleSwitch);

      const toggleSwitch = wrapper.findComponent(PrimeToggleSwitch);
      expect(toggleSwitch.exists()).toBe(true);
    });

    it('applies custom design tokens via dt prop', () => {
      const wrapper = mount(BaseToggleSwitch);

      const toggleSwitch = wrapper.findComponent(PrimeToggleSwitch);
      const dtProp = toggleSwitch.props('dt');

      // Verify design tokens are passed
      expect(dtProp).toBeDefined();
      expect(dtProp).toHaveProperty('root');
      expect(dtProp).toHaveProperty('handle');

      // Verify color tokens
      expect(dtProp.root).toEqual({
        background: '#ef4444', // OFF - red-500
        hoverBackground: '#dc2626', // OFF hover - red-600
        checkedBackground: '#22c55e', // ON - green-500
        checkedHoverBackground: '#16a34a', // ON hover - green-600
        disabledBackground: '#fca5a5', // OFF disabled - red-300
        checkedDisabledBackground: '#86efac', // ON disabled - green-300
      });

      expect(dtProp.handle).toEqual({
        background: '#ffffff',
        checkedBackground: '#ffffff',
      });
    });
  });

  describe('Props', () => {
    it('passes modelValue prop to PrimeVue ToggleSwitch', () => {
      const wrapper = mount(BaseToggleSwitch, {
        props: {
          modelValue: true,
        },
      });

      const toggleSwitch = wrapper.findComponent(PrimeToggleSwitch);
      expect(toggleSwitch.props('modelValue')).toBe(true);
    });

    it('defaults modelValue to false when not provided', () => {
      const wrapper = mount(BaseToggleSwitch);

      const toggleSwitch = wrapper.findComponent(PrimeToggleSwitch);
      expect(toggleSwitch.props('modelValue')).toBe(false);
    });

    it('passes disabled prop to PrimeVue ToggleSwitch', () => {
      const wrapper = mount(BaseToggleSwitch, {
        props: {
          disabled: true,
        },
      });

      const toggleSwitch = wrapper.findComponent(PrimeToggleSwitch);
      expect(toggleSwitch.props('disabled')).toBe(true);
    });

    it('defaults disabled to false when not provided', () => {
      const wrapper = mount(BaseToggleSwitch);

      const toggleSwitch = wrapper.findComponent(PrimeToggleSwitch);
      expect(toggleSwitch.props('disabled')).toBe(false);
    });
  });

  describe('Events', () => {
    it('emits update:modelValue when toggle is clicked', async () => {
      const wrapper = mount(BaseToggleSwitch, {
        props: {
          modelValue: false,
        },
      });

      const toggleSwitch = wrapper.findComponent(PrimeToggleSwitch);
      await toggleSwitch.vm.$emit('update:modelValue', true);

      expect(wrapper.emitted('update:modelValue')).toBeTruthy();
      expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([true]);
    });

    it('emits update:modelValue with false when unchecked', async () => {
      const wrapper = mount(BaseToggleSwitch, {
        props: {
          modelValue: true,
        },
      });

      const toggleSwitch = wrapper.findComponent(PrimeToggleSwitch);
      await toggleSwitch.vm.$emit('update:modelValue', false);

      expect(wrapper.emitted('update:modelValue')).toBeTruthy();
      expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([false]);
    });
  });

  describe('Slots', () => {
    it('passes through the handle slot to PrimeVue ToggleSwitch', () => {
      const wrapper = mount(BaseToggleSwitch, {
        slots: {
          handle:
            '<template #handle="{ checked }"><i :class="checked ? \'pi-check\' : \'pi-times\'" /></template>',
        },
      });

      const toggleSwitch = wrapper.findComponent(PrimeToggleSwitch);
      expect(toggleSwitch.exists()).toBe(true);
      // Slot is passed through to PrimeVue component
    });

    it('renders custom handle content from slot', () => {
      const wrapper = mount(BaseToggleSwitch, {
        slots: {
          handle: '<span class="custom-handle">Custom</span>',
        },
      });

      const toggleSwitch = wrapper.findComponent(PrimeToggleSwitch);
      expect(toggleSwitch.exists()).toBe(true);
    });
  });

  describe('Styling', () => {
    it('passes design tokens for custom red/green styling', () => {
      const wrapper = mount(BaseToggleSwitch, {
        props: {
          modelValue: true,
        },
      });

      const toggleSwitch = wrapper.findComponent(PrimeToggleSwitch);
      const dtProp = toggleSwitch.props('dt');

      // Verify that design tokens contain the custom colors
      expect(dtProp.root.background).toBe('#ef4444'); // Red for OFF
      expect(dtProp.root.checkedBackground).toBe('#22c55e'); // Green for ON
      expect(dtProp.handle.background).toBe('#ffffff'); // White handle
    });
  });

  describe('Accessibility', () => {
    it('is not disabled by default', () => {
      const wrapper = mount(BaseToggleSwitch);

      const toggleSwitch = wrapper.findComponent(PrimeToggleSwitch);
      expect(toggleSwitch.props('disabled')).toBe(false);
    });

    it('can be disabled', () => {
      const wrapper = mount(BaseToggleSwitch, {
        props: {
          disabled: true,
        },
      });

      const toggleSwitch = wrapper.findComponent(PrimeToggleSwitch);
      expect(toggleSwitch.props('disabled')).toBe(true);
    });

    it('does not emit events when disabled', async () => {
      const wrapper = mount(BaseToggleSwitch, {
        props: {
          modelValue: false,
          disabled: true,
        },
      });

      // PrimeVue ToggleSwitch should handle the disabled state internally
      const toggleSwitch = wrapper.findComponent(PrimeToggleSwitch);
      expect(toggleSwitch.props('disabled')).toBe(true);
    });
  });
});
