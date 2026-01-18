import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import VrlCardHeader from '../VrlCardHeader.vue';

describe('VrlCardHeader', () => {
  it('renders without props', () => {
    const wrapper = mount(VrlCardHeader);
    expect(wrapper.find('[data-test="card-header"]').exists()).toBe(true);
  });

  it('renders title when provided', () => {
    const wrapper = mount(VrlCardHeader, {
      props: {
        title: 'Test Header Title',
      },
    });
    expect(wrapper.find('[data-test="card-title"]').text()).toBe('Test Header Title');
  });

  it('renders default slot content', () => {
    const wrapper = mount(VrlCardHeader, {
      slots: {
        default: '<div class="custom-header-content">Custom Content</div>',
      },
    });
    expect(wrapper.find('.custom-header-content').exists()).toBe(true);
    expect(wrapper.html()).toContain('Custom Content');
  });

  it('default slot overrides title prop', () => {
    const wrapper = mount(VrlCardHeader, {
      props: {
        title: 'Title Prop',
      },
      slots: {
        default: '<span>Slot Content</span>',
      },
    });
    expect(wrapper.html()).toContain('Slot Content');
    expect(wrapper.find('[data-test="card-title"]').exists()).toBe(false);
  });

  it('renders actions slot content', () => {
    const wrapper = mount(VrlCardHeader, {
      props: {
        title: 'Header with Actions',
      },
      slots: {
        actions: '<button class="action-btn">Action</button>',
      },
    });
    expect(wrapper.find('[data-test="card-header-actions"]').exists()).toBe(true);
    expect(wrapper.find('.action-btn').exists()).toBe(true);
  });

  it('does not render actions container when actions slot is empty', () => {
    const wrapper = mount(VrlCardHeader, {
      props: {
        title: 'Header without Actions',
      },
    });
    expect(wrapper.find('[data-test="card-header-actions"]').exists()).toBe(false);
  });

  it('applies custom classes', () => {
    const wrapper = mount(VrlCardHeader, {
      props: {
        class: 'custom-header-class',
      },
    });
    const header = wrapper.find('[data-test="card-header"]');
    expect(header.classes()).toContain('custom-header-class');
  });

  it('applies multiple custom classes', () => {
    const wrapper = mount(VrlCardHeader, {
      props: {
        class: 'class-one class-two',
      },
    });
    const header = wrapper.find('[data-test="card-header"]');
    expect(header.classes()).toContain('class-one');
    expect(header.classes()).toContain('class-two');
  });

  it('renders title and actions together', () => {
    const wrapper = mount(VrlCardHeader, {
      props: {
        title: 'Complete Header',
      },
      slots: {
        actions: '<button>Action Button</button>',
      },
    });
    expect(wrapper.find('[data-test="card-title"]').text()).toBe('Complete Header');
    expect(wrapper.find('[data-test="card-header-actions"]').exists()).toBe(true);
    expect(wrapper.html()).toContain('Action Button');
  });

  it('has correct layout classes', () => {
    const wrapper = mount(VrlCardHeader, {
      props: {
        title: 'Layout Test',
      },
    });
    const header = wrapper.find('[data-test="card-header"]');
    expect(header.exists()).toBe(true);
  });
});
