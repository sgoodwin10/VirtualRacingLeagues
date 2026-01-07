import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import VisibilityToggle from '../VisibilityToggle.vue';
import type { LeagueVisibility } from '@app/types/league';

describe('VisibilityToggle', () => {
  it('renders correctly with public visibility', () => {
    const wrapper = mount(VisibilityToggle, {
      props: {
        modelValue: 'public' as LeagueVisibility,
      },
    });

    expect(wrapper.text()).toContain('Public');
    expect(wrapper.text()).toContain('Unlisted');
    expect(wrapper.text()).toContain('Discoverable in Search');
  });

  it('shows active styling for selected visibility', () => {
    const wrapper = mount(VisibilityToggle, {
      props: {
        modelValue: 'public' as LeagueVisibility,
      },
    });

    const buttons = wrapper.findAll('button');
    expect(buttons[0].classes()).toContain('bg-[var(--cyan)]');
    expect(buttons[1].classes()).not.toContain('bg-[var(--cyan)]');
  });

  it('emits update:modelValue when visibility is changed', async () => {
    const wrapper = mount(VisibilityToggle, {
      props: {
        modelValue: 'public' as LeagueVisibility,
      },
    });

    const buttons = wrapper.findAll('button');
    await buttons[1].trigger('click');

    expect(wrapper.emitted('update:modelValue')).toBeTruthy();
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['unlisted']);
  });

  it('updates status panel when visibility changes', async () => {
    const wrapper = mount(VisibilityToggle, {
      props: {
        modelValue: 'public' as LeagueVisibility,
      },
    });

    expect(wrapper.text()).toContain('Discoverable in Search');

    await wrapper.setProps({ modelValue: 'unlisted' as LeagueVisibility });

    expect(wrapper.text()).toContain('Link Access Only');
    expect(wrapper.text()).toContain('hidden from search');
  });

  it('displays error message when error prop is provided', () => {
    const wrapper = mount(VisibilityToggle, {
      props: {
        modelValue: 'public' as LeagueVisibility,
        error: 'Visibility is required',
      },
    });

    expect(wrapper.text()).toContain('Visibility is required');
  });

  it('applies correct styling for public status panel', () => {
    const wrapper = mount(VisibilityToggle, {
      props: {
        modelValue: 'public' as LeagueVisibility,
      },
    });

    // Find the status panel by looking for elements with green border styling
    const allDivs = wrapper.findAll('div');
    const statusPanel = allDivs.find((div) => {
      const classStr = div.classes().join(' ');
      return classStr.includes('border') && classStr.includes('green');
    });

    expect(statusPanel).toBeTruthy();
  });

  it('applies correct styling for unlisted status panel', () => {
    const wrapper = mount(VisibilityToggle, {
      props: {
        modelValue: 'unlisted' as LeagueVisibility,
      },
    });

    // Find the status panel by looking for elements with orange border styling
    const allDivs = wrapper.findAll('div');
    const statusPanel = allDivs.find((div) => {
      const classStr = div.classes().join(' ');
      return classStr.includes('border') && classStr.includes('orange');
    });

    expect(statusPanel).toBeTruthy();
  });
});
