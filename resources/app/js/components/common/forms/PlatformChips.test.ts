import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import PlatformChips from './PlatformChips.vue';
import type { Platform } from '@app/types/league';

const mockPlatforms: Platform[] = [
  { id: 1, name: 'PC', slug: 'pc' },
  { id: 2, name: 'PlayStation', slug: 'playstation' },
  { id: 3, name: 'Xbox', slug: 'xbox' },
];

describe('PlatformChips', () => {
  it('renders correctly with platforms', () => {
    const wrapper = mount(PlatformChips, {
      props: {
        modelValue: [],
        platforms: mockPlatforms,
      },
    });

    expect(wrapper.find('button').exists()).toBe(true);
    expect(wrapper.findAll('button')).toHaveLength(3);
    expect(wrapper.text()).toContain('PC');
    expect(wrapper.text()).toContain('PlayStation');
    expect(wrapper.text()).toContain('Xbox');
  });

  it('shows selected platforms with active styling', () => {
    const wrapper = mount(PlatformChips, {
      props: {
        modelValue: [1, 2],
        platforms: mockPlatforms,
      },
    });

    const buttons = wrapper.findAll('button');
    expect(buttons[0]!.classes()).toContain('bg-[var(--cyan-dim)]');
    expect(buttons[1]!.classes()).toContain('bg-[var(--cyan-dim)]');
    expect(buttons[2]!.classes()).not.toContain('bg-[var(--cyan-dim)]');
  });

  it('emits update:modelValue when platform is clicked', async () => {
    const wrapper = mount(PlatformChips, {
      props: {
        modelValue: [],
        platforms: mockPlatforms,
      },
    });

    const button = wrapper.find('button');
    await button.trigger('click');

    expect(wrapper.emitted('update:modelValue')).toBeTruthy();
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([[1]]);
  });

  it('removes platform when clicked again', async () => {
    const wrapper = mount(PlatformChips, {
      props: {
        modelValue: [1, 2],
        platforms: mockPlatforms,
      },
    });

    const button = wrapper.find('button');
    await button.trigger('click');

    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([[2]]);
  });

  it('displays error styling when error prop is provided', () => {
    const wrapper = mount(PlatformChips, {
      props: {
        modelValue: [],
        platforms: mockPlatforms,
        error: 'Please select at least one platform',
      },
    });

    expect(wrapper.text()).toContain('Please select at least one platform');
    const buttons = wrapper.findAll('button');
    buttons.forEach((button) => {
      expect(button.classes()).toContain('border-[var(--red)]');
    });
  });

  it('shows required indicator when required prop is true', () => {
    const wrapper = mount(PlatformChips, {
      props: {
        modelValue: [],
        platforms: mockPlatforms,
        required: true,
      },
    });

    // Check for the asterisk (*) which indicates a required field
    expect(wrapper.html()).toContain('*');
  });

  it('toggles multiple platforms', async () => {
    const wrapper = mount(PlatformChips, {
      props: {
        modelValue: [],
        platforms: mockPlatforms,
      },
    });

    const buttons = wrapper.findAll('button');
    await buttons[0]!.trigger('click');

    // After first click, modelValue should be [1]
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([[1]]);

    // Update the wrapper's props to reflect the change
    await wrapper.setProps({ modelValue: [1] });

    // Click the third button (platform id 3)
    await buttons[2]!.trigger('click');

    // The second emission should now have [1, 3]
    expect(wrapper.emitted('update:modelValue')?.[1]).toEqual([[1, 3]]);
  });
});
