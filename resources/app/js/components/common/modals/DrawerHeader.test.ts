import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import DrawerHeader from './DrawerHeader.vue';

describe('DrawerHeader', () => {
  it('renders the title correctly', () => {
    const wrapper = mount(DrawerHeader, {
      props: {
        title: 'Test Drawer Title',
      },
    });

    const heading = wrapper.find('h2');
    expect(heading.exists()).toBe(true);
    expect(heading.text()).toBe('Test Drawer Title');
  });

  it('renders the subtitle when provided', () => {
    const wrapper = mount(DrawerHeader, {
      props: {
        title: 'Test Drawer Title',
        subtitle: 'This is a test subtitle',
      },
    });

    const subtitle = wrapper.find('p');
    expect(subtitle.exists()).toBe(true);
    expect(subtitle.text()).toBe('This is a test subtitle');
    expect(subtitle.classes()).toContain('text-gray-600');
  });

  it('does not render subtitle when not provided', () => {
    const wrapper = mount(DrawerHeader, {
      props: {
        title: 'Test Drawer Title',
      },
    });

    const subtitle = wrapper.find('p');
    expect(subtitle.exists()).toBe(false);
  });

  it('applies correct container classes', () => {
    const wrapper = mount(DrawerHeader, {
      props: {
        title: 'Test Drawer Title',
      },
    });

    const container = wrapper.find('div');
    expect(container.classes()).toContain('container');
    expect(container.classes()).toContain('mx-auto');
    expect(container.classes()).toContain('flex');
    expect(container.classes()).toContain('flex-col');
    expect(container.classes()).toContain('max-w-7xl');
  });

  it('uses HTag component with level 2 for the title', () => {
    const wrapper = mount(DrawerHeader, {
      props: {
        title: 'Test Drawer Title',
      },
    });

    // Verify h2 tag is rendered (from HTag component)
    const heading = wrapper.find('h2');
    expect(heading.exists()).toBe(true);

    // Verify heading has the correct classes from HTag defaults
    expect(heading.classes()).toContain('text-2xl');
    expect(heading.classes()).toContain('font-bold');
    expect(heading.classes()).toContain('mb-1');
  });

  it('handles empty subtitle gracefully', () => {
    const wrapper = mount(DrawerHeader, {
      props: {
        title: 'Test Drawer Title',
        subtitle: '',
      },
    });

    // Empty subtitle should not render the paragraph element
    const subtitle = wrapper.find('p');
    expect(subtitle.exists()).toBe(false);
  });

  it('renders with both title and subtitle together', () => {
    const wrapper = mount(DrawerHeader, {
      props: {
        title: 'Create New League',
        subtitle: 'Complete the information below to create your racing league',
      },
    });

    const heading = wrapper.find('h2');
    const subtitle = wrapper.find('p');

    expect(heading.text()).toBe('Create New League');
    expect(subtitle.text()).toBe('Complete the information below to create your racing league');
  });

  it('updates when props change', async () => {
    const wrapper = mount(DrawerHeader, {
      props: {
        title: 'Original Title',
        subtitle: 'Original Subtitle',
      },
    });

    expect(wrapper.find('h2').text()).toBe('Original Title');
    expect(wrapper.find('p').text()).toBe('Original Subtitle');

    await wrapper.setProps({
      title: 'Updated Title',
      subtitle: 'Updated Subtitle',
    });

    expect(wrapper.find('h2').text()).toBe('Updated Title');
    expect(wrapper.find('p').text()).toBe('Updated Subtitle');
  });

  it('handles long titles correctly', () => {
    const longTitle = 'This is a very long title that might wrap to multiple lines in the UI';
    const wrapper = mount(DrawerHeader, {
      props: {
        title: longTitle,
      },
    });

    const heading = wrapper.find('h2');
    expect(heading.text()).toBe(longTitle);
  });

  it('handles long subtitles correctly', () => {
    const longSubtitle =
      'This is a very long subtitle with lots of descriptive text that provides detailed context about what the user should do in this drawer';
    const wrapper = mount(DrawerHeader, {
      props: {
        title: 'Test Title',
        subtitle: longSubtitle,
      },
    });

    const subtitle = wrapper.find('p');
    expect(subtitle.text()).toBe(longSubtitle);
  });
});
