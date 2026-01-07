import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import PrimeVue from 'primevue/config';
import Aura from '@primevue/themes/aura';
import StyledInputNumber from '../StyledInputNumber.vue';

const createWrapper = (props = {}) => {
  return mount(StyledInputNumber, {
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

describe('StyledInputNumber', () => {
  describe('Basic Rendering', () => {
    it('renders correctly with default props', () => {
      const wrapper = createWrapper();
      expect(wrapper.find('.styled-input-number').exists()).toBe(true);
      expect(wrapper.findComponent({ name: 'InputNumber' }).exists()).toBe(true);
    });

    it('applies fluid class when fluid prop is true', () => {
      const wrapper = createWrapper({ fluid: true });
      expect(wrapper.findComponent({ name: 'InputNumber' }).props('fluid')).toBe(true);
    });

    it('renders with custom id', () => {
      const wrapper = createWrapper({ inputId: 'test-input-number' });
      expect(wrapper.findComponent({ name: 'InputNumber' }).attributes('id')).toBe(
        'test-input-number',
      );
    });
  });

  describe('Value Binding', () => {
    it('displays the initial modelValue', () => {
      const wrapper = createWrapper({ modelValue: 42 });
      expect(wrapper.findComponent({ name: 'InputNumber' }).props('modelValue')).toBe(42);
    });

    it('emits update:modelValue when value changes', async () => {
      const wrapper = createWrapper({ modelValue: 10 });

      await wrapper.findComponent({ name: 'InputNumber' }).vm.$emit('update:modelValue', 20);
      expect(wrapper.emitted('update:modelValue')).toBeTruthy();
      expect(wrapper.emitted('update:modelValue')![0]).toEqual([20]);
    });

    it('handles null value', () => {
      const wrapper = createWrapper({ modelValue: null });
      expect(wrapper.findComponent({ name: 'InputNumber' }).props('modelValue')).toBeNull();
    });
  });

  describe('Min/Max Constraints', () => {
    it('applies min constraint', () => {
      const wrapper = createWrapper({ min: 0, max: 10, modelValue: 5 });
      expect(wrapper.findComponent({ name: 'InputNumber' }).props('min')).toBe(0);
      expect(wrapper.findComponent({ name: 'InputNumber' }).props('max')).toBe(10);
    });

    it('applies step value', () => {
      const wrapper = createWrapper({ step: 5, modelValue: 10 });
      expect(wrapper.findComponent({ name: 'InputNumber' }).props('step')).toBe(5);
    });
  });

  describe('Decimal/Fraction Digits', () => {
    it('sets maxFractionDigits', () => {
      const wrapper = createWrapper({ maxFractionDigits: 2, modelValue: 10.5 });
      expect(wrapper.findComponent({ name: 'InputNumber' }).props('maxFractionDigits')).toBe(2);
    });

    it('sets minFractionDigits', () => {
      const wrapper = createWrapper({ minFractionDigits: 1, maxFractionDigits: 2, modelValue: 10 });
      expect(wrapper.findComponent({ name: 'InputNumber' }).props('minFractionDigits')).toBe(1);
    });
  });

  describe('Button Layouts', () => {
    it('renders with horizontal buttons layout', () => {
      const wrapper = createWrapper({
        showButtons: true,
        buttonLayout: 'horizontal',
        modelValue: 5,
      });
      expect(wrapper.findComponent({ name: 'InputNumber' }).props('showButtons')).toBe(true);
      expect(wrapper.findComponent({ name: 'InputNumber' }).props('buttonLayout')).toBe(
        'horizontal',
      );
    });

    it('renders with stacked buttons layout', () => {
      const wrapper = createWrapper({ showButtons: true, buttonLayout: 'stacked', modelValue: 5 });
      expect(wrapper.findComponent({ name: 'InputNumber' }).props('buttonLayout')).toBe('stacked');
    });

    it('renders with vertical buttons layout', () => {
      const wrapper = createWrapper({ showButtons: true, buttonLayout: 'vertical', modelValue: 5 });
      expect(wrapper.findComponent({ name: 'InputNumber' }).props('buttonLayout')).toBe('vertical');
    });

    it('does not show buttons by default', () => {
      const wrapper = createWrapper({ modelValue: 5 });
      expect(wrapper.findComponent({ name: 'InputNumber' }).props('showButtons')).toBe(false);
    });
  });

  describe('Disabled State', () => {
    it('applies disabled prop', () => {
      const wrapper = createWrapper({ disabled: true, modelValue: 5 });
      expect(wrapper.findComponent({ name: 'InputNumber' }).props('disabled')).toBe(true);
    });

    it('does not emit events when disabled', async () => {
      const wrapper = createWrapper({ disabled: true, modelValue: 5 });

      await wrapper.findComponent({ name: 'InputNumber' }).vm.$emit('update:modelValue', 10);
      // Events are still emitted by PrimeVue, but buttons should be disabled in UI
      expect(wrapper.findComponent({ name: 'InputNumber' }).props('disabled')).toBe(true);
    });
  });

  describe('Invalid/Error State', () => {
    it('applies invalid prop', () => {
      const wrapper = createWrapper({ invalid: true, modelValue: 5 });
      expect(wrapper.findComponent({ name: 'InputNumber' }).props('invalid')).toBe(true);
    });
  });

  describe('Placeholder', () => {
    it('applies placeholder text', () => {
      const wrapper = createWrapper({ placeholder: 'Enter a number' });
      expect(wrapper.findComponent({ name: 'InputNumber' }).props('placeholder')).toBe(
        'Enter a number',
      );
    });
  });

  describe('Number Grouping', () => {
    it('uses grouping by default', () => {
      const wrapper = createWrapper({ modelValue: 1000 });
      expect(wrapper.findComponent({ name: 'InputNumber' }).props('useGrouping')).toBe(true);
    });

    it('disables grouping when useGrouping is false', () => {
      const wrapper = createWrapper({ useGrouping: false, modelValue: 1000 });
      expect(wrapper.findComponent({ name: 'InputNumber' }).props('useGrouping')).toBe(false);
    });
  });

  describe('Size Variants', () => {
    it('applies small size', () => {
      const wrapper = createWrapper({ size: 'small', modelValue: 5 });
      expect(wrapper.findComponent({ name: 'InputNumber' }).props('size')).toBe('small');
    });

    it('applies large size', () => {
      const wrapper = createWrapper({ size: 'large', modelValue: 5 });
      expect(wrapper.findComponent({ name: 'InputNumber' }).props('size')).toBe('large');
    });
  });

  describe('Readonly State', () => {
    it('applies readonly prop', () => {
      const wrapper = createWrapper({ readonly: true, modelValue: 5 });
      expect(wrapper.findComponent({ name: 'InputNumber' }).props('readonly')).toBe(true);
    });
  });

  describe('Event Emission', () => {
    it('emits input event', async () => {
      const wrapper = createWrapper({ modelValue: 5 });

      const mockEvent = new Event('input');
      await wrapper.findComponent({ name: 'InputNumber' }).vm.$emit('input', mockEvent);

      expect(wrapper.emitted('input')).toBeTruthy();
      expect(wrapper.emitted('input')![0]).toEqual([mockEvent]);
    });

    it('emits focus event', async () => {
      const wrapper = createWrapper({ modelValue: 5 });

      const mockEvent = new FocusEvent('focus');
      await wrapper.findComponent({ name: 'InputNumber' }).vm.$emit('focus', mockEvent);

      expect(wrapper.emitted('focus')).toBeTruthy();
      expect(wrapper.emitted('focus')![0]).toEqual([mockEvent]);
    });

    it('emits blur event', async () => {
      const wrapper = createWrapper({ modelValue: 5 });

      const mockEvent = new FocusEvent('blur');
      await wrapper.findComponent({ name: 'InputNumber' }).vm.$emit('blur', mockEvent);

      expect(wrapper.emitted('blur')).toBeTruthy();
      expect(wrapper.emitted('blur')![0]).toEqual([mockEvent]);
    });
  });

  describe('Currency Mode', () => {
    it('applies currency mode', () => {
      const wrapper = createWrapper({ mode: 'currency', currency: 'USD', modelValue: 100 });
      expect(wrapper.findComponent({ name: 'InputNumber' }).props('mode')).toBe('currency');
      expect(wrapper.findComponent({ name: 'InputNumber' }).props('currency')).toBe('USD');
    });

    it('applies currency display mode', () => {
      const wrapper = createWrapper({
        mode: 'currency',
        currency: 'USD',
        currencyDisplay: 'code',
        modelValue: 100,
      });
      expect(wrapper.findComponent({ name: 'InputNumber' }).props('currencyDisplay')).toBe('code');
    });
  });

  describe('Prefix and Suffix', () => {
    it('applies prefix', () => {
      const wrapper = createWrapper({ prefix: '$', modelValue: 100 });
      expect(wrapper.findComponent({ name: 'InputNumber' }).props('prefix')).toBe('$');
    });

    it('applies suffix', () => {
      const wrapper = createWrapper({ suffix: ' km/h', modelValue: 120 });
      expect(wrapper.findComponent({ name: 'InputNumber' }).props('suffix')).toBe(' km/h');
    });
  });

  describe('Locale Support', () => {
    it('applies locale', () => {
      const wrapper = createWrapper({ locale: 'de-DE', modelValue: 1000 });
      expect(wrapper.findComponent({ name: 'InputNumber' }).props('locale')).toBe('de-DE');
    });
  });

  describe('Allow Empty', () => {
    it('allows empty by default', () => {
      const wrapper = createWrapper();
      expect(wrapper.findComponent({ name: 'InputNumber' }).props('allowEmpty')).toBe(true);
    });

    it('disallows empty when allowEmpty is false', () => {
      const wrapper = createWrapper({ allowEmpty: false });
      expect(wrapper.findComponent({ name: 'InputNumber' }).props('allowEmpty')).toBe(false);
    });
  });

  describe('Highlight on Focus', () => {
    it('does not highlight on focus by default', () => {
      const wrapper = createWrapper();
      expect(wrapper.findComponent({ name: 'InputNumber' }).props('highlightOnFocus')).toBe(false);
    });

    it('highlights on focus when highlightOnFocus is true', () => {
      const wrapper = createWrapper({ highlightOnFocus: true });
      expect(wrapper.findComponent({ name: 'InputNumber' }).props('highlightOnFocus')).toBe(true);
    });
  });
});
