import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import { defineComponent, h } from 'vue';
import CardHeader from '@app/components/common/cards/CardHeader.vue';

// Mock icon component for testing
const MockIcon = defineComponent({
  name: 'MockIcon',
  props: {
    size: Number,
    class: String,
  },
  setup(props) {
    return () => h('svg', { class: ['mock-icon', props.class], 'data-testid': 'mock-icon' });
  },
});

describe('CardHeader', () => {
  it('renders with title prop', () => {
    const wrapper = mount(CardHeader, {
      props: { title: 'Test Title' },
    });
    expect(wrapper.text()).toContain('Test Title');
  });

  it('renders description when provided', () => {
    const wrapper = mount(CardHeader, {
      props: {
        title: 'Test Title',
        description: 'Test description text',
      },
    });
    expect(wrapper.text()).toContain('Test Title');
    expect(wrapper.text()).toContain('Test description text');
    expect(wrapper.find('p').exists()).toBe(true);
    expect(wrapper.find('p').classes()).toContain('text-xs');
  });

  it('does not render description element when not provided', () => {
    const wrapper = mount(CardHeader, {
      props: { title: 'Test Title' },
    });
    expect(wrapper.find('p').exists()).toBe(false);
  });

  it('renders icon when icon prop is provided', () => {
    const wrapper = mount(CardHeader, {
      props: {
        title: 'Test Title',
        icon: MockIcon,
      },
    });
    expect(wrapper.findComponent(MockIcon).exists()).toBe(true);
  });

  it('does not render icon container when no icon prop', () => {
    const wrapper = mount(CardHeader, {
      props: { title: 'Test Title' },
    });
    // Icon container should not exist
    expect(wrapper.find('[class*="h-10 w-10"]').exists()).toBe(false);
  });

  it('renders icon with gradient background classes', () => {
    const wrapper = mount(CardHeader, {
      props: {
        title: 'Test Title',
        icon: MockIcon,
        gradientFrom: 'yellow-50',
        gradientTo: 'amber-50',
      },
    });
    const iconContainer = wrapper.find('.rounded-lg');
    expect(iconContainer.exists()).toBe(true);
    expect(iconContainer.classes()).toContain('bg-gradient-to-br');
    expect(iconContainer.classes()).toContain('from-yellow-50');
    expect(iconContainer.classes()).toContain('to-amber-50');
  });

  it('renders icon without gradient when gradient props not provided', () => {
    const wrapper = mount(CardHeader, {
      props: {
        title: 'Test Title',
        icon: MockIcon,
      },
    });
    const iconContainer = wrapper.find('.rounded-lg');
    expect(iconContainer.exists()).toBe(true);
    expect(iconContainer.classes()).not.toContain('bg-gradient-to-br');
    expect(iconContainer.classes()).toContain('border');
  });

  it('applies icon color class when provided', () => {
    const wrapper = mount(CardHeader, {
      props: {
        title: 'Test Title',
        icon: MockIcon,
        iconColor: 'blue-600',
      },
    });
    const icon = wrapper.findComponent(MockIcon);
    expect(icon.exists()).toBe(true);
    expect(icon.classes()).toContain('text-blue-600');
  });

  it('applies default icon color when iconColor prop not provided', () => {
    const wrapper = mount(CardHeader, {
      props: {
        title: 'Test Title',
        icon: MockIcon,
      },
    });
    const icon = wrapper.findComponent(MockIcon);
    expect(icon.exists()).toBe(true);
    expect(icon.classes()).toContain('text-[var(--text-secondary)]');
  });

  it('renders without title prop', () => {
    const wrapper = mount(CardHeader, {
      slots: {
        default: '<span>Custom content</span>',
      },
    });
    expect(wrapper.text()).toContain('Custom content');
  });

  it('renders default slot content', () => {
    const wrapper = mount(CardHeader, {
      slots: {
        default: '<span class="custom-header">Custom</span>',
      },
    });
    expect(wrapper.find('.custom-header').exists()).toBe(true);
  });

  it('renders icon slot content', () => {
    const wrapper = mount(CardHeader, {
      props: { title: 'Test' },
      slots: {
        icon: '<div class="custom-icon">Custom Icon</div>',
      },
    });
    expect(wrapper.find('.custom-icon').exists()).toBe(true);
  });

  it('renders actions slot content', () => {
    const wrapper = mount(CardHeader, {
      props: { title: 'Test' },
      slots: {
        actions: '<button>Action</button>',
      },
    });
    expect(wrapper.find('button').exists()).toBe(true);
  });

  it('applies custom classes', () => {
    const wrapper = mount(CardHeader, {
      props: { title: 'Test', class: 'custom-class' },
    });
    expect(wrapper.find('.custom-class').exists()).toBe(true);
  });

  it('has correct layout classes', () => {
    const wrapper = mount(CardHeader, {
      props: { title: 'Test' },
    });
    expect(wrapper.classes()).toContain('flex');
    expect(wrapper.classes()).toContain('items-center');
    expect(wrapper.classes()).toContain('justify-between');
  });

  it('title has correct typography classes', () => {
    const wrapper = mount(CardHeader, {
      props: { title: 'Test Title' },
    });
    const title = wrapper.find('.font-mono');
    expect(title.exists()).toBe(true);
    expect(title.classes()).toContain('font-semibold');
  });

  it('renders complete header with all props', () => {
    const wrapper = mount(CardHeader, {
      props: {
        title: 'Season Standings',
        description: 'Championship points and driver rankings',
        icon: MockIcon,
        gradientFrom: 'yellow-50',
        gradientTo: 'amber-50',
        iconColor: 'yellow-600',
      },
    });

    // Check title and description
    expect(wrapper.text()).toContain('Season Standings');
    expect(wrapper.text()).toContain('Championship points and driver rankings');

    // Check icon
    expect(wrapper.findComponent(MockIcon).exists()).toBe(true);

    // Check gradient
    const iconContainer = wrapper.find('.rounded-lg');
    expect(iconContainer.classes()).toContain('bg-gradient-to-br');
    expect(iconContainer.classes()).toContain('from-yellow-50');
    expect(iconContainer.classes()).toContain('to-amber-50');

    // Check icon color
    const icon = wrapper.findComponent(MockIcon);
    expect(icon.classes()).toContain('text-yellow-600');
  });
});
