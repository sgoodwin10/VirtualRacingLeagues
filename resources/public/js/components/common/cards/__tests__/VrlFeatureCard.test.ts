import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import VrlFeatureCard from '../VrlFeatureCard.vue';

// Mock icon component
const MockIcon = {
  name: 'MockIcon',
  template: '<svg class="mock-icon"><circle /></svg>',
};

describe('VrlFeatureCard', () => {
  it('renders with required props', () => {
    const wrapper = mount(VrlFeatureCard, {
      props: {
        title: 'Test Feature',
        description: 'Test description',
      },
    });
    expect(wrapper.find('[data-test="feature-card"]').exists()).toBe(true);
    expect(wrapper.find('[data-test="feature-title"]').text()).toBe('Test Feature');
    expect(wrapper.find('[data-test="feature-desc"]').text()).toBe('Test description');
  });

  it('renders with icon component', () => {
    const wrapper = mount(VrlFeatureCard, {
      props: {
        icon: MockIcon,
        title: 'Feature with Icon',
        description: 'Description text',
      },
    });
    expect(wrapper.find('[data-test="feature-icon"]').exists()).toBe(true);
    expect(wrapper.find('.mock-icon').exists()).toBe(true);
  });

  it('renders with iconText', () => {
    const wrapper = mount(VrlFeatureCard, {
      props: {
        iconText: '🚀',
        title: 'Feature with Emoji',
        description: 'Description text',
      },
    });
    expect(wrapper.find('[data-test="feature-icon"]').text()).toBe('🚀');
  });

  it('renders icon slot content', () => {
    const wrapper = mount(VrlFeatureCard, {
      props: {
        title: 'Custom Icon',
        description: 'Description',
      },
      slots: {
        icon: '<div class="custom-icon">⚡</div>',
      },
    });
    expect(wrapper.find('.custom-icon').exists()).toBe(true);
    expect(wrapper.html()).toContain('⚡');
  });

  it('icon slot overrides icon prop', () => {
    const wrapper = mount(VrlFeatureCard, {
      props: {
        icon: MockIcon,
        title: 'Test',
        description: 'Test desc',
      },
      slots: {
        icon: '<span class="slot-icon">Custom</span>',
      },
    });
    expect(wrapper.find('.slot-icon').exists()).toBe(true);
    expect(wrapper.find('.mock-icon').exists()).toBe(false);
  });

  it('renders title slot content', () => {
    const wrapper = mount(VrlFeatureCard, {
      props: {
        title: 'Default Title',
        description: 'Description',
      },
      slots: {
        title: '<span class="custom-title">Custom Title</span>',
      },
    });
    expect(wrapper.find('.custom-title').exists()).toBe(true);
    expect(wrapper.html()).toContain('Custom Title');
    expect(wrapper.html()).not.toContain('Default Title');
  });

  it('renders description slot content', () => {
    const wrapper = mount(VrlFeatureCard, {
      props: {
        title: 'Title',
        description: 'Default Description',
      },
      slots: {
        description: '<p class="custom-desc">Custom Description</p>',
      },
    });
    expect(wrapper.find('.custom-desc').exists()).toBe(true);
    expect(wrapper.html()).toContain('Custom Description');
    expect(wrapper.html()).not.toContain('Default Description');
  });

  it('renders default slot content', () => {
    const wrapper = mount(VrlFeatureCard, {
      props: {
        title: 'Title',
        description: 'Description',
      },
      slots: {
        default: '<div class="extra-content">Additional content</div>',
      },
    });
    expect(wrapper.find('.extra-content').exists()).toBe(true);
    expect(wrapper.html()).toContain('Additional content');
  });

  it('applies custom classes', () => {
    const wrapper = mount(VrlFeatureCard, {
      props: {
        title: 'Title',
        description: 'Description',
        class: 'custom-feature-class',
      },
    });
    const card = wrapper.find('[data-test="feature-card"]');
    expect(card.classes()).toContain('custom-feature-class');
  });

  it('applies multiple custom classes', () => {
    const wrapper = mount(VrlFeatureCard, {
      props: {
        title: 'Title',
        description: 'Description',
        class: 'class-one class-two',
      },
    });
    const card = wrapper.find('[data-test="feature-card"]');
    expect(card.classes()).toContain('class-one');
    expect(card.classes()).toContain('class-two');
  });

  it('renders all elements with correct classes', () => {
    const wrapper = mount(VrlFeatureCard, {
      props: {
        iconText: '💡',
        title: 'Complete Feature',
        description: 'Full description',
      },
    });
    expect(wrapper.find('[data-test="feature-card"]').exists()).toBe(true);
    expect(wrapper.find('[data-test="feature-icon"]').exists()).toBe(true);
    expect(wrapper.find('[data-test="feature-title"]').exists()).toBe(true);
    expect(wrapper.find('[data-test="feature-desc"]').exists()).toBe(true);
  });

  it('renders without icon', () => {
    const wrapper = mount(VrlFeatureCard, {
      props: {
        title: 'No Icon Feature',
        description: 'Description without icon',
      },
    });
    const iconContainer = wrapper.find('[data-test="feature-icon"]');
    expect(iconContainer.exists()).toBe(true);
    expect(iconContainer.text()).toBe('');
  });

  it('prefers icon prop over iconText', () => {
    const wrapper = mount(VrlFeatureCard, {
      props: {
        icon: MockIcon,
        iconText: '🚀',
        title: 'Title',
        description: 'Description',
      },
    });
    expect(wrapper.find('.mock-icon').exists()).toBe(true);
    expect(wrapper.find('[data-test="feature-icon"]').text()).not.toBe('🚀');
  });

  it('renders with all slots and props together', () => {
    const wrapper = mount(VrlFeatureCard, {
      props: {
        title: 'Original Title',
        description: 'Original Description',
        class: 'full-test',
      },
      slots: {
        icon: '<span>🎯</span>',
        title: '<strong>Slot Title</strong>',
        description: '<em>Slot Description</em>',
        default: '<button>Action</button>',
      },
    });
    expect(wrapper.find('[data-test="feature-card"]').exists()).toBe(true);
    expect(wrapper.html()).toContain('🎯');
    expect(wrapper.html()).toContain('<strong>Slot Title</strong>');
    expect(wrapper.html()).toContain('<em>Slot Description</em>');
    expect(wrapper.html()).toContain('<button>Action</button>');
    expect(wrapper.classes()).toContain('full-test');
  });
});
