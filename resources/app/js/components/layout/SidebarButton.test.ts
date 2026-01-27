import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import SidebarButton from './SidebarButton.vue';
import { PhGear } from '@phosphor-icons/vue';

describe('SidebarButton', () => {
  it('renders correctly with label and icon', () => {
    const wrapper = mount(SidebarButton, {
      props: {
        icon: PhGear,
        label: 'Settings',
      },
    });

    expect(wrapper.text()).toContain('Settings');
    expect(wrapper.find('button').exists()).toBe(true);
  });

  it('renders tag when provided', () => {
    const wrapper = mount(SidebarButton, {
      props: {
        icon: PhGear,
        label: 'Settings',
        tag: '5',
      },
    });

    expect(wrapper.text()).toContain('5');
    const tag = wrapper.find('.tag');
    expect(tag.exists()).toBe(true);
  });

  it('applies warning variant to tag', () => {
    const wrapper = mount(SidebarButton, {
      props: {
        icon: PhGear,
        label: 'Settings',
        tag: '3',
        tagVariant: 'warning',
      },
    });

    const tag = wrapper.find('.tag');
    expect(tag.classes()).toContain('warning');
  });

  it('emits click event when button is clicked', async () => {
    const wrapper = mount(SidebarButton, {
      props: {
        icon: PhGear,
        label: 'Settings',
      },
    });

    await wrapper.find('button').trigger('click');

    expect(wrapper.emitted('click')).toBeTruthy();
    expect(wrapper.emitted('click')).toHaveLength(1);
  });

  it('has proper button type attribute', () => {
    const wrapper = mount(SidebarButton, {
      props: {
        icon: PhGear,
        label: 'Settings',
      },
    });

    expect(wrapper.find('button').attributes('type')).toBe('button');
  });
});
