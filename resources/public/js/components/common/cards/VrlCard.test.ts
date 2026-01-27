import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import VrlCard from '../VrlCard.vue';

describe('VrlCard', () => {
  it('renders without props', () => {
    const wrapper = mount(VrlCard);
    expect(wrapper.find('[data-test="card"]').exists()).toBe(true);
  });

  it('renders with default slot content', () => {
    const wrapper = mount(VrlCard, {
      slots: {
        default: '<p>Card content</p>',
      },
    });
    expect(wrapper.html()).toContain('Card content');
  });

  it('renders title when provided', async () => {
    const wrapper = mount(VrlCard, {
      props: {
        title: 'Test Card Title',
        showHeader: true, // Explicitly enable header
      },
    });
    await wrapper.vm.$nextTick();
    const cardTitle = wrapper.find('[data-test="card-title"]');
    expect(cardTitle.exists()).toBe(true);
    expect(cardTitle.text()).toBe('Test Card Title');
  });

  it('shows header when title is provided', async () => {
    const wrapper = mount(VrlCard, {
      props: {
        title: 'Test Title',
        showHeader: true, // Explicitly set showHeader
      },
    });
    await wrapper.vm.$nextTick();
    const header = wrapper.find('[data-test="card-header"]');
    expect(header.exists()).toBe(true);
  });

  it('hides header when showHeader is false', () => {
    const wrapper = mount(VrlCard, {
      props: {
        title: 'Test Title',
        showHeader: false,
      },
    });
    expect(wrapper.find('[data-test="card-header"]').exists()).toBe(false);
  });

  it('shows header when showHeader is true even without title', () => {
    const wrapper = mount(VrlCard, {
      props: {
        showHeader: true,
      },
      slots: {
        header: '<div>Custom Header</div>',
      },
    });
    expect(wrapper.find('[data-test="card-header"]').exists()).toBe(true);
  });

  it('renders header slot content', () => {
    const wrapper = mount(VrlCard, {
      slots: {
        header: '<div class="custom-header">Custom Header</div>',
      },
    });
    expect(wrapper.find('.custom-header').exists()).toBe(true);
    expect(wrapper.html()).toContain('Custom Header');
  });

  it('renders body slot content', () => {
    const wrapper = mount(VrlCard, {
      slots: {
        body: '<div class="custom-body">Body Content</div>',
      },
    });
    expect(wrapper.find('.custom-body').exists()).toBe(true);
  });

  it('renders footer slot content', () => {
    const wrapper = mount(VrlCard, {
      slots: {
        footer: '<div class="custom-footer">Footer Content</div>',
      },
    });
    expect(wrapper.find('[data-test="card-footer"]').exists()).toBe(true);
    expect(wrapper.find('.custom-footer').exists()).toBe(true);
  });

  it('renders actions slot content', () => {
    const wrapper = mount(VrlCard, {
      props: {
        title: 'Test Title',
      },
      slots: {
        actions: '<button class="action-button">Action</button>',
      },
    });
    expect(wrapper.find('[data-test="card-header-actions"]').exists()).toBe(true);
    expect(wrapper.find('.action-button').exists()).toBe(true);
  });

  it('does not render footer when footer slot is empty', () => {
    const wrapper = mount(VrlCard, {
      slots: {
        default: '<p>Content</p>',
      },
    });
    expect(wrapper.find('[data-test="card-footer"]').exists()).toBe(false);
  });

  it('applies hoverable class when hoverable prop is true', () => {
    const wrapper = mount(VrlCard, {
      props: {
        hoverable: true,
      },
    });
    const card = wrapper.find('[data-test="card"]');
    expect(card.classes()).toContain('hover:border-[var(--cyan)]');
  });

  it('does not apply hoverable class when hoverable prop is false', () => {
    const wrapper = mount(VrlCard, {
      props: {
        hoverable: false,
      },
    });
    const card = wrapper.find('[data-test="card"]');
    expect(card.classes()).not.toContain('hover:border-[var(--cyan)]');
  });

  it('applies custom classes', () => {
    const wrapper = mount(VrlCard, {
      props: {
        class: 'custom-class another-class',
      },
    });
    const card = wrapper.find('[data-test="card"]');
    expect(card.classes()).toContain('custom-class');
    expect(card.classes()).toContain('another-class');
  });

  it('applies body padding by default', () => {
    const wrapper = mount(VrlCard);
    const body = wrapper.find('[data-test="card-body"]');
    expect(body.attributes('data-padded')).toBe('true');
  });

  it('removes body padding when bodyPadding is false', () => {
    const wrapper = mount(VrlCard, {
      props: {
        bodyPadding: false,
      },
    });
    const body = wrapper.find('[data-test="card-body"]');
    expect(body.attributes('data-padded')).toBe('false');
  });

  it('has correct accessibility attributes', () => {
    const wrapper = mount(VrlCard, {
      props: {
        title: 'Accessible Card',
      },
    });
    const card = wrapper.find('[data-test="card"]');
    expect(card.attributes('role')).toBe('region');
    expect(card.attributes('aria-label')).toBe('Accessible Card');
  });

  it('uses default aria-label when no title provided', () => {
    const wrapper = mount(VrlCard);
    const card = wrapper.find('[data-test="card"]');
    expect(card.attributes('aria-label')).toBe('Card');
  });

  it('renders all slots together', () => {
    const wrapper = mount(VrlCard, {
      props: {
        title: 'Full Card',
      },
      slots: {
        actions: '<button>Action</button>',
        default: '<p>Body Content</p>',
        footer: '<span>Footer Content</span>',
      },
    });
    expect(wrapper.find('[data-test="card-header"]').exists()).toBe(true);
    expect(wrapper.find('[data-test="card-title"]').text()).toBe('Full Card');
    expect(wrapper.find('[data-test="card-header-actions"]').exists()).toBe(true);
    expect(wrapper.find('[data-test="card-body"]').exists()).toBe(true);
    expect(wrapper.html()).toContain('Body Content');
    expect(wrapper.find('[data-test="card-footer"]').exists()).toBe(true);
    expect(wrapper.html()).toContain('Footer Content');
  });
});
