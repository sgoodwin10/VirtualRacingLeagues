import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import VrlCardFooter from './VrlCardFooter.vue';

describe('VrlCardFooter', () => {
  it('renders without props', () => {
    const wrapper = mount(VrlCardFooter);
    expect(wrapper.find('[data-test="card-footer"]').exists()).toBe(true);
  });

  it('renders slot content', () => {
    const wrapper = mount(VrlCardFooter, {
      slots: {
        default: '<p class="footer-content">Footer text</p>',
      },
    });
    expect(wrapper.find('.footer-content').exists()).toBe(true);
    expect(wrapper.html()).toContain('Footer text');
  });

  it('applies custom classes', () => {
    const wrapper = mount(VrlCardFooter, {
      props: {
        class: 'custom-footer-class',
      },
    });
    const footer = wrapper.find('[data-test="card-footer"]');
    expect(footer.classes()).toContain('custom-footer-class');
  });

  it('applies multiple custom classes', () => {
    const wrapper = mount(VrlCardFooter, {
      props: {
        class: 'class-one class-two',
      },
    });
    const footer = wrapper.find('[data-test="card-footer"]');
    expect(footer.classes()).toContain('class-one');
    expect(footer.classes()).toContain('class-two');
  });

  it('has card-footer class', () => {
    const wrapper = mount(VrlCardFooter);
    expect(wrapper.find('[data-test="card-footer"]').exists()).toBe(true);
  });

  it('renders button in footer', () => {
    const wrapper = mount(VrlCardFooter, {
      slots: {
        default: '<button class="footer-btn">Action</button>',
      },
    });
    expect(wrapper.find('.footer-btn').exists()).toBe(true);
    expect(wrapper.html()).toContain('Action');
  });

  it('renders multiple elements in footer', () => {
    const wrapper = mount(VrlCardFooter, {
      slots: {
        default: `
          <button>Cancel</button>
          <button>Save</button>
        `,
      },
    });
    expect(wrapper.html()).toContain('Cancel');
    expect(wrapper.html()).toContain('Save');
  });

  it('renders complex slot content', () => {
    const wrapper = mount(VrlCardFooter, {
      slots: {
        default: `
          <div class="footer-actions">
            <span class="footer-text">Last updated: Today</span>
            <div class="footer-buttons">
              <button>Edit</button>
              <button>Delete</button>
            </div>
          </div>
        `,
      },
    });
    expect(wrapper.find('.footer-actions').exists()).toBe(true);
    expect(wrapper.find('.footer-text').exists()).toBe(true);
    expect(wrapper.find('.footer-buttons').exists()).toBe(true);
  });
});
