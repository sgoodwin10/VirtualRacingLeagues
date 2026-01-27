import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import ResultTimeInput from './ResultTimeInput.vue';
import { InputTextStub } from '@app/__tests__/setup/primevueStubs';

describe('ResultTimeInput', () => {
  const mountOptions = {
    global: {
      stubs: {
        InputText: InputTextStub,
      },
    },
  };

  it('renders with initial value', () => {
    const wrapper = mount(ResultTimeInput, {
      ...mountOptions,
      props: {
        modelValue: '01:23:45.678',
      },
    });

    const input = wrapper.find('input');
    expect(input.element.value).toBe('01:23:45.678');
  });

  it('normalizes minutes:seconds.ms format on blur', async () => {
    const wrapper = mount(ResultTimeInput, {
      ...mountOptions,
      props: {
        modelValue: '',
      },
    });

    const input = wrapper.find('input');
    await input.setValue('1:23.456');
    await input.trigger('blur');

    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['00:01:23.456']);
  });

  it('normalizes seconds.ms format on blur', async () => {
    const wrapper = mount(ResultTimeInput, {
      ...mountOptions,
      props: {
        modelValue: '',
      },
    });

    const input = wrapper.find('input');
    await input.setValue('23.456');
    await input.trigger('blur');

    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['00:00:23.456']);
  });

  it('normalizes full format with padding on blur', async () => {
    const wrapper = mount(ResultTimeInput, {
      ...mountOptions,
      props: {
        modelValue: '',
      },
    });

    const input = wrapper.find('input');
    await input.setValue('1:02:03.4');
    await input.trigger('blur');

    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['01:02:03.400']);
  });

  it('handles + prefix for time differences', async () => {
    const wrapper = mount(ResultTimeInput, {
      ...mountOptions,
      props: {
        modelValue: '',
      },
    });

    const input = wrapper.find('input');
    await input.setValue('+5.234');
    await input.trigger('blur');

    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['+00:00:05.234']);
  });

  it('emits empty string for empty input on blur', async () => {
    const wrapper = mount(ResultTimeInput, {
      ...mountOptions,
      props: {
        modelValue: '01:23:45.678',
      },
    });

    const input = wrapper.find('input');
    await input.setValue('');
    await input.trigger('blur');

    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['']);
  });

  it('does not emit if value unchanged on blur', async () => {
    const wrapper = mount(ResultTimeInput, {
      ...mountOptions,
      props: {
        modelValue: '01:23:45.678',
      },
    });

    const input = wrapper.find('input');
    await input.trigger('blur');

    expect(wrapper.emitted('update:modelValue')).toBeUndefined();
  });

  it('normalizes on Enter key press', async () => {
    const wrapper = mount(ResultTimeInput, {
      ...mountOptions,
      props: {
        modelValue: '',
      },
    });

    const input = wrapper.find('input');
    await input.setValue('1:23.456');
    await input.trigger('keydown.enter');

    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['00:01:23.456']);
  });

  it('shows invalid state for incorrect format', async () => {
    const wrapper = mount(ResultTimeInput, {
      ...mountOptions,
      props: {
        modelValue: '',
      },
    });

    const input = wrapper.find('input');
    await input.setValue('invalid');

    // Invalid state is computed, check if invalid class is applied
    expect(input.classes()).toContain('p-invalid');
  });

  it('shows valid state for correct format before normalization', async () => {
    const wrapper = mount(ResultTimeInput, {
      ...mountOptions,
      props: {
        modelValue: '',
      },
    });

    const input = wrapper.find('input');
    await input.setValue('1:23.456');

    // Should be valid before blur (normalization)
    expect(input.classes()).not.toContain('p-invalid');
  });

  it('uses custom placeholder if provided', () => {
    const wrapper = mount(ResultTimeInput, {
      ...mountOptions,
      props: {
        modelValue: '',
        placeholder: 'Custom placeholder',
      },
    });

    const input = wrapper.find('input');
    expect(input.attributes('placeholder')).toBe('Custom placeholder');
  });

  it('uses default placeholder if not provided', () => {
    const wrapper = mount(ResultTimeInput, {
      ...mountOptions,
      props: {
        modelValue: '',
      },
    });

    const input = wrapper.find('input');
    expect(input.attributes('placeholder')).toBe('00:00:00.000');
  });
});
