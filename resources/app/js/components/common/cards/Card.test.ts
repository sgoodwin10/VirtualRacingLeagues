import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import Card from '@app/components/common/cards/Card.vue';

describe('Card', () => {
  it('renders without props', () => {
    const wrapper = mount(Card, {
      slots: {
        default: '<p>Test content</p>',
      },
    });
    expect(wrapper.html()).toContain('Test content');
  });

  it('renders title when provided', () => {
    const wrapper = mount(Card, {
      props: { title: '//CARD_TITLE' },
    });
    expect(wrapper.text()).toContain('//CARD_TITLE');
  });

  it('shows header when title is provided', () => {
    const wrapper = mount(Card, {
      props: { title: 'Test Title' },
    });
    expect(wrapper.find('.bg-elevated').exists()).toBe(true);
  });

  it('hides header when showHeader is false', () => {
    const wrapper = mount(Card, {
      props: {
        title: 'Test Title',
        showHeader: false,
      },
    });
    expect(wrapper.find('.bg-elevated').exists()).toBe(false);
  });

  it('renders header slot content', () => {
    const wrapper = mount(Card, {
      slots: {
        header: '<span class="custom-header">Custom</span>',
      },
    });
    expect(wrapper.find('.custom-header').exists()).toBe(true);
    expect(wrapper.text()).toContain('Custom');
  });

  it('renders actions slot content', () => {
    const wrapper = mount(Card, {
      props: { title: 'Test' },
      slots: {
        actions: '<button>Action</button>',
      },
    });
    expect(wrapper.find('button').exists()).toBe(true);
    expect(wrapper.text()).toContain('Action');
  });

  it('renders default slot content', () => {
    const wrapper = mount(Card, {
      slots: {
        default: '<p class="test-content">Body content</p>',
      },
    });
    expect(wrapper.find('.test-content').exists()).toBe(true);
  });

  it('renders body slot content', () => {
    const wrapper = mount(Card, {
      slots: {
        body: '<div class="body-content">Custom body</div>',
      },
    });
    expect(wrapper.find('.body-content').exists()).toBe(true);
  });

  it('applies custom classes', () => {
    const wrapper = mount(Card, {
      props: { class: 'custom-class' },
    });
    expect(wrapper.find('.custom-class').exists()).toBe(true);
  });

  it('applies correct background and border styles', () => {
    const wrapper = mount(Card);
    const card = wrapper.find('[class*="bg-card"]');
    expect(card.exists()).toBe(true);
    expect(card.classes()).toContain('border');
  });

  it('header has correct layout classes', () => {
    const wrapper = mount(Card, {
      props: { title: 'Test' },
    });
    const header = wrapper.find('.bg-elevated');
    expect(header.classes()).toContain('flex');
    expect(header.classes()).toContain('items-center');
    expect(header.classes()).toContain('justify-between');
  });

  it('title has correct typography classes', () => {
    const wrapper = mount(Card, {
      props: { title: 'Test Title' },
    });
    const title = wrapper.find('.font-mono');
    expect(title.exists()).toBe(true);
    expect(title.classes()).toContain('font-semibold');
    expect(title.classes()).toContain('tracking-wide');
  });

  it('has accessible role', () => {
    const wrapper = mount(Card, {
      props: { title: 'Test Card' },
    });
    expect(wrapper.attributes('role')).toBe('region');
  });

  it('has aria-label from title', () => {
    const wrapper = mount(Card, {
      props: { title: 'Test Card' },
    });
    expect(wrapper.attributes('aria-label')).toBe('Test Card');
  });

  it('has default aria-label when no title', () => {
    const wrapper = mount(Card);
    expect(wrapper.attributes('aria-label')).toBe('Card');
  });
});
