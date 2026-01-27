import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import InfoItem from './InfoItem.vue';
import { PhGameController, PhTrophy } from '@phosphor-icons/vue';

describe('InfoItem', () => {
  it('renders with icon and text only (no title)', () => {
    const wrapper = mount(InfoItem, {
      props: {
        icon: PhTrophy,
        text: '5 Active Competitions',
      },
    });

    expect(wrapper.text()).toContain('5 Active Competitions');
    expect(wrapper.findComponent(PhTrophy).exists()).toBe(true);

    // Should have items-center class when no title
    const contentDiv = wrapper.find('.flex.items-center');
    expect(contentDiv.exists()).toBe(true);
    expect(contentDiv.text()).toBe('5 Active Competitions');
  });

  it('renders with icon, title, and text', () => {
    const wrapper = mount(InfoItem, {
      props: {
        icon: PhGameController,
        title: 'Platforms',
        text: 'PC, PlayStation, Xbox',
      },
    });

    expect(wrapper.text()).toContain('Platforms');
    expect(wrapper.text()).toContain('PC, PlayStation, Xbox');
    expect(wrapper.findComponent(PhGameController).exists()).toBe(true);

    // Should have space-y-0.5 class when title exists
    const contentDiv = wrapper.find('.flex.flex-col.space-y-0\\.5');
    expect(contentDiv.exists()).toBe(true);
  });

  it('applies correct styling to icon', () => {
    const wrapper = mount(InfoItem, {
      props: {
        icon: PhGameController,
        text: 'Test text',
      },
    });

    const icon = wrapper.findComponent(PhGameController);
    expect(icon.classes()).toContain('text-slate-400');
    expect(icon.classes()).toContain('shrink-0');
    expect(icon.props('size')).toBe(28);
  });

  it('applies correct styling to title when present', () => {
    const wrapper = mount(InfoItem, {
      props: {
        icon: PhGameController,
        title: 'Test Title',
        text: 'Test text',
      },
    });

    const title = wrapper.find('.text-xs.uppercase.text-primary-300');
    expect(title.exists()).toBe(true);
    expect(title.text()).toBe('Test Title');
  });

  it('applies correct styling to text', () => {
    const wrapper = mount(InfoItem, {
      props: {
        icon: PhGameController,
        title: 'Test Title',
        text: 'Test text content',
      },
    });

    const text = wrapper.find('.text-slate-600');
    expect(text.exists()).toBe(true);
    expect(text.text()).toBe('Test text content');
  });

  it('applies correct container styling', () => {
    const wrapper = mount(InfoItem, {
      props: {
        icon: PhGameController,
        text: 'Test text',
      },
    });

    const container = wrapper.find('.flex.gap-2.bg-slate-50');
    expect(container.exists()).toBe(true);
    expect(container.classes()).toContain('py-3');
    expect(container.classes()).toContain('px-3');
  });

  it('handles long text gracefully', () => {
    const longText =
      'This is a very long text that should be displayed properly without breaking the layout or causing any overflow issues';
    const wrapper = mount(InfoItem, {
      props: {
        icon: PhGameController,
        title: 'Long Text',
        text: longText,
      },
    });

    expect(wrapper.text()).toContain(longText);
  });

  it('renders different icon types correctly', () => {
    const wrapper1 = mount(InfoItem, {
      props: {
        icon: PhGameController,
        text: 'Test 1',
      },
    });

    const wrapper2 = mount(InfoItem, {
      props: {
        icon: PhTrophy,
        text: 'Test 2',
      },
    });

    expect(wrapper1.findComponent(PhGameController).exists()).toBe(true);
    expect(wrapper1.findComponent(PhTrophy).exists()).toBe(false);

    expect(wrapper2.findComponent(PhTrophy).exists()).toBe(true);
    expect(wrapper2.findComponent(PhGameController).exists()).toBe(false);
  });
});
