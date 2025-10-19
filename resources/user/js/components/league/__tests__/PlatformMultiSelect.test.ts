import { describe, it, expect } from 'vitest';
import { nextTick } from 'vue';
import { mountWithStubs } from '@user/__tests__/setup';
import PlatformMultiSelect from '../partials/PlatformMultiSelect.vue';
import type { Platform } from '@user/types/league';

describe('PlatformMultiSelect', () => {
  const mockPlatforms: Platform[] = [
    { id: 1, name: 'Gran Turismo 7', slug: 'gran-turismo-7' },
    { id: 2, name: 'iRacing', slug: 'iracing' },
    { id: 3, name: 'Assetto Corsa Competizione', slug: 'acc' },
  ];

  it('renders with label', () => {
    const wrapper = mountWithStubs(PlatformMultiSelect, {
      props: {
        modelValue: [],
        platforms: mockPlatforms,
      },
    });

    expect(wrapper.text()).toContain('Platforms');
  });

  it('shows required asterisk when required prop is true', () => {
    const wrapper = mountWithStubs(PlatformMultiSelect, {
      props: {
        modelValue: [],
        platforms: mockPlatforms,
        required: true,
      },
    });

    const label = wrapper.find('label');
    expect(label.html()).toContain('text-red-500');
    expect(label.text()).toContain('*');
  });

  it('renders MultiSelect component with correct props', () => {
    const wrapper = mountWithStubs(PlatformMultiSelect, {
      props: {
        modelValue: [],
        platforms: mockPlatforms,
      },
    });

    const multiSelect = wrapper.findComponent({ name: 'MultiSelect' });
    expect(multiSelect.exists()).toBe(true);
    expect(multiSelect.props('options')).toEqual(mockPlatforms);
    expect(multiSelect.props('optionLabel')).toBe('name');
    expect(multiSelect.props('optionValue')).toBe('id');
    expect(multiSelect.props('placeholder')).toBe('Select platforms');
  });

  it('displays selected platforms', () => {
    const wrapper = mountWithStubs(PlatformMultiSelect, {
      props: {
        modelValue: [1, 2],
        platforms: mockPlatforms,
      },
    });

    const multiSelect = wrapper.findComponent({ name: 'MultiSelect' });
    expect(multiSelect.props('modelValue')).toEqual([1, 2]);
  });

  it('emits update:modelValue when selection changes', async () => {
    const wrapper = mountWithStubs(PlatformMultiSelect, {
      props: {
        modelValue: [],
        platforms: mockPlatforms,
      },
    });

    const multiSelect = wrapper.findComponent({ name: 'MultiSelect' });
    await multiSelect.vm.$emit('update:modelValue', [1, 2]);

    expect(wrapper.emitted('update:modelValue')).toBeTruthy();
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([[1, 2]]);
  });

  it('supports multiple platform selection', async () => {
    const wrapper = mountWithStubs(PlatformMultiSelect, {
      props: {
        modelValue: [1],
        platforms: mockPlatforms,
      },
    });

    const multiSelect = wrapper.findComponent({ name: 'MultiSelect' });

    // Add another platform
    await multiSelect.vm.$emit('update:modelValue', [1, 2, 3]);

    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([[1, 2, 3]]);
  });

  it('displays help text', () => {
    const wrapper = mountWithStubs(PlatformMultiSelect, {
      props: {
        modelValue: [],
        platforms: mockPlatforms,
      },
    });

    expect(wrapper.text()).toContain('Select all platforms your league supports');
  });

  it('displays error message when error prop is provided', () => {
    const wrapper = mountWithStubs(PlatformMultiSelect, {
      props: {
        modelValue: [],
        platforms: mockPlatforms,
        error: 'Please select at least one platform',
      },
    });

    expect(wrapper.text()).toContain('Please select at least one platform');
  });

  it('adds invalid class when error exists', () => {
    const wrapper = mountWithStubs(PlatformMultiSelect, {
      props: {
        modelValue: [],
        platforms: mockPlatforms,
        error: 'Please select at least one platform',
      },
    });

    const multiSelect = wrapper.findComponent({ name: 'MultiSelect' });
    expect(multiSelect.classes()).toContain('p-invalid');
  });

  it('does not add invalid class when no error', () => {
    const wrapper = mountWithStubs(PlatformMultiSelect, {
      props: {
        modelValue: [],
        platforms: mockPlatforms,
      },
    });

    const multiSelect = wrapper.findComponent({ name: 'MultiSelect' });
    expect(multiSelect.classes()).not.toContain('p-invalid');
  });

  it('handles empty platforms array', () => {
    const wrapper = mountWithStubs(PlatformMultiSelect, {
      props: {
        modelValue: [],
        platforms: [],
      },
    });

    const multiSelect = wrapper.findComponent({ name: 'MultiSelect' });
    expect(multiSelect.props('options')).toEqual([]);
  });

  it('allows deselecting platforms', async () => {
    const wrapper = mountWithStubs(PlatformMultiSelect, {
      props: {
        modelValue: [1, 2, 3],
        platforms: mockPlatforms,
      },
    });

    const multiSelect = wrapper.findComponent({ name: 'MultiSelect' });

    // Remove one platform
    await multiSelect.vm.$emit('update:modelValue', [1, 3]);

    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([[1, 3]]);
  });

  it('allows clearing all selections', async () => {
    const wrapper = mountWithStubs(PlatformMultiSelect, {
      props: {
        modelValue: [1, 2],
        platforms: mockPlatforms,
      },
    });

    const multiSelect = wrapper.findComponent({ name: 'MultiSelect' });

    // Clear all
    await multiSelect.vm.$emit('update:modelValue', []);

    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([[]]);
  });

  it('configures display mode as chip', () => {
    const wrapper = mountWithStubs(PlatformMultiSelect, {
      props: {
        modelValue: [],
        platforms: mockPlatforms,
      },
    });

    const multiSelect = wrapper.findComponent({ name: 'MultiSelect' });
    expect(multiSelect.props('display')).toBe('chip');
  });

  it('sets max selected labels to 3', () => {
    const wrapper = mountWithStubs(PlatformMultiSelect, {
      props: {
        modelValue: [],
        platforms: mockPlatforms,
      },
    });

    const multiSelect = wrapper.findComponent({ name: 'MultiSelect' });
    expect(multiSelect.props('maxSelectedLabels')).toBe(3);
  });

  it('has full width styling', () => {
    const wrapper = mountWithStubs(PlatformMultiSelect, {
      props: {
        modelValue: [],
        platforms: mockPlatforms,
      },
    });

    const multiSelect = wrapper.findComponent({ name: 'MultiSelect' });
    expect(multiSelect.classes()).toContain('w-full');
  });

  it('reactively updates when modelValue prop changes', async () => {
    const wrapper = mountWithStubs(PlatformMultiSelect, {
      props: {
        modelValue: [1],
        platforms: mockPlatforms,
      },
    });

    const multiSelect = wrapper.findComponent({ name: 'MultiSelect' });
    expect(multiSelect.props('modelValue')).toEqual([1]);

    await wrapper.setProps({ modelValue: [1, 2] });
    await nextTick();

    expect(multiSelect.props('modelValue')).toEqual([1, 2]);
  });

  it('reactively updates when platforms prop changes', async () => {
    const wrapper = mountWithStubs(PlatformMultiSelect, {
      props: {
        modelValue: [],
        platforms: mockPlatforms,
      },
    });

    const newPlatforms: Platform[] = [{ id: 4, name: 'F1 23', slug: 'f1-23' }];

    await wrapper.setProps({ platforms: newPlatforms });
    await nextTick();

    const multiSelect = wrapper.findComponent({ name: 'MultiSelect' });
    expect(multiSelect.props('options')).toEqual(newPlatforms);
  });
});
