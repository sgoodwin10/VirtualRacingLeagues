import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import PrimeVue from 'primevue/config';
import Aura from '@primevue/themes/aura';
import PointsSystemEditor from '../PointsSystemEditor.vue';
import StyledInputNumber from '../StyledInputNumber.vue';
import { Button } from '@app/components/common/buttons';
import type { PointsSystemMap } from '@app/types/race';

describe('PointsSystemEditor', () => {
  const mockPointsSystem: PointsSystemMap = {
    1: 25,
    2: 18,
    3: 15,
  };

  const globalConfig: Parameters<typeof mount>[1] = {
    global: {
      plugins: [[PrimeVue, { theme: { preset: Aura } }]],
    },
  };

  describe('Rendering', () => {
    it('renders all position inputs', () => {
      const wrapper = mount(PointsSystemEditor, {
        ...globalConfig,
        props: {
          modelValue: mockPointsSystem,
        },
      });

      const inputs = wrapper.findAllComponents(StyledInputNumber);
      expect(inputs).toHaveLength(3);
    });

    it('renders positions in sorted order', () => {
      const wrapper = mount(PointsSystemEditor, {
        ...globalConfig,
        props: {
          modelValue: { 3: 15, 1: 25, 2: 18 },
        },
      });

      const inputs = wrapper.findAllComponents(StyledInputNumber);
      expect(inputs[0].props('modelValue')).toBe(25);
      expect(inputs[1].props('modelValue')).toBe(18);
      expect(inputs[2].props('modelValue')).toBe(15);
    });

    it('renders Add Position button', () => {
      const wrapper = mount(PointsSystemEditor, {
        ...globalConfig,
        props: {
          modelValue: mockPointsSystem,
        },
      });

      const buttons = wrapper.findAllComponents(Button);
      const addButton = buttons.find((btn) => btn.text().includes('Add Position'));
      expect(addButton?.exists()).toBe(true);
    });

    it('renders Remove Last button', () => {
      const wrapper = mount(PointsSystemEditor, {
        ...globalConfig,
        props: {
          modelValue: mockPointsSystem,
        },
      });

      const buttons = wrapper.findAllComponents(Button);
      const removeButton = buttons.find((btn) => btn.text().includes('Remove Last'));
      expect(removeButton?.exists()).toBe(true);
    });

    it('does not render copy button by default', () => {
      const wrapper = mount(PointsSystemEditor, {
        ...globalConfig,
        props: {
          modelValue: mockPointsSystem,
        },
      });

      const buttons = wrapper.findAllComponents(Button);
      const copyButton = buttons.find((btn) => btn.text().includes('Copy'));
      expect(copyButton?.exists()).toBe(false);
    });

    it('renders copy button when showCopyButton is true', () => {
      const wrapper = mount(PointsSystemEditor, {
        ...globalConfig,
        props: {
          modelValue: mockPointsSystem,
          showCopyButton: true,
        },
      });

      const buttons = wrapper.findAllComponents(Button);
      const copyButton = buttons.find((btn) => btn.text().includes('Copy from Round 1'));
      expect(copyButton?.exists()).toBe(true);
    });
  });

  describe('Props', () => {
    it('accepts modelValue prop', () => {
      const wrapper = mount(PointsSystemEditor, {
        ...globalConfig,
        props: {
          modelValue: mockPointsSystem,
        },
      });

      expect(wrapper.props('modelValue')).toEqual(mockPointsSystem);
    });

    it('accepts disabled prop', () => {
      const wrapper = mount(PointsSystemEditor, {
        ...globalConfig,
        props: {
          modelValue: mockPointsSystem,
          disabled: true,
        },
      });

      const inputs = wrapper.findAllComponents(StyledInputNumber);
      inputs.forEach((input) => {
        expect(input.props('disabled')).toBe(true);
      });
    });

    it('accepts custom copy button label', () => {
      const wrapper = mount(PointsSystemEditor, {
        ...globalConfig,
        props: {
          modelValue: mockPointsSystem,
          showCopyButton: true,
          copyButtonLabel: 'Custom Copy Label',
        },
      });

      const buttons = wrapper.findAllComponents(Button);
      const copyButton = buttons.find((btn) => btn.text().includes('Custom Copy Label'));
      expect(copyButton?.exists()).toBe(true);
    });
  });

  describe('Events', () => {
    it('emits update:modelValue when point value changes', async () => {
      const wrapper = mount(PointsSystemEditor, {
        ...globalConfig,
        props: {
          modelValue: mockPointsSystem,
        },
      });

      const inputs = wrapper.findAllComponents(StyledInputNumber);
      await inputs[0].vm.$emit('update:modelValue', 30);

      expect(wrapper.emitted('update:modelValue')).toBeTruthy();
      const emitted = wrapper.emitted('update:modelValue')?.[0] as PointsSystemMap[];
      expect(emitted[0]).toEqual({ 1: 30, 2: 18, 3: 15 });
    });

    it('emits update:modelValue when adding position', async () => {
      const wrapper = mount(PointsSystemEditor, {
        ...globalConfig,
        props: {
          modelValue: mockPointsSystem,
        },
      });

      const buttons = wrapper.findAllComponents(Button);
      const addButton = buttons.find((btn) => btn.text().includes('Add Position'));
      await addButton?.trigger('click');

      expect(wrapper.emitted('update:modelValue')).toBeTruthy();
      const emitted = wrapper.emitted('update:modelValue')?.[0] as PointsSystemMap[];
      expect(emitted[0]).toEqual({ 1: 25, 2: 18, 3: 15, 4: 0 });
    });

    it('emits update:modelValue when removing position', async () => {
      const wrapper = mount(PointsSystemEditor, {
        ...globalConfig,
        props: {
          modelValue: mockPointsSystem,
        },
      });

      const buttons = wrapper.findAllComponents(Button);
      const removeButton = buttons.find((btn) => btn.text().includes('Remove Last'));
      await removeButton?.trigger('click');

      expect(wrapper.emitted('update:modelValue')).toBeTruthy();
      const emitted = wrapper.emitted('update:modelValue')?.[0] as PointsSystemMap[];
      expect(emitted[0]).toEqual({ 1: 25, 2: 18 });
    });

    it('emits copy event when copy button is clicked', async () => {
      const wrapper = mount(PointsSystemEditor, {
        ...globalConfig,
        props: {
          modelValue: mockPointsSystem,
          showCopyButton: true,
        },
      });

      const buttons = wrapper.findAllComponents(Button);
      const copyButton = buttons.find((btn) => btn.text().includes('Copy'));
      await copyButton?.trigger('click');

      expect(wrapper.emitted('copy')).toBeTruthy();
    });
  });

  describe('Behavior', () => {
    it('disables remove button when only one position exists', () => {
      const wrapper = mount(PointsSystemEditor, {
        ...globalConfig,
        props: {
          modelValue: { 1: 25 },
        },
      });

      const buttons = wrapper.findAllComponents(Button);
      const removeButton = buttons.find((btn) => btn.text().includes('Remove Last'));
      expect(removeButton?.props('disabled')).toBe(true);
    });

    it('enables remove button when multiple positions exist', () => {
      const wrapper = mount(PointsSystemEditor, {
        ...globalConfig,
        props: {
          modelValue: mockPointsSystem,
        },
      });

      const buttons = wrapper.findAllComponents(Button);
      const removeButton = buttons.find((btn) => btn.text().includes('Remove Last'));
      expect(removeButton?.props('disabled')).toBe(false);
    });

    it('adds new position with value 0', async () => {
      const wrapper = mount(PointsSystemEditor, {
        ...globalConfig,
        props: {
          modelValue: { 1: 25 },
        },
      });

      const buttons = wrapper.findAllComponents(Button);
      const addButton = buttons.find((btn) => btn.text().includes('Add Position'));
      await addButton?.trigger('click');

      const emitted = wrapper.emitted('update:modelValue')?.[0] as PointsSystemMap[];
      expect(emitted[0]).toEqual({ 1: 25, 2: 0 });
    });
  });
});
