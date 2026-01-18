import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import VrlCardBody from '../VrlCardBody.vue';

describe('VrlCardBody', () => {
  it('renders without props', () => {
    const wrapper = mount(VrlCardBody);
    expect(wrapper.find('[data-test="card-body"]').exists()).toBe(true);
  });

  it('renders slot content', () => {
    const wrapper = mount(VrlCardBody, {
      slots: {
        default: '<p class="test-content">Body content</p>',
      },
    });
    expect(wrapper.find('.test-content').exists()).toBe(true);
    expect(wrapper.html()).toContain('Body content');
  });

  it('applies padding by default', () => {
    const wrapper = mount(VrlCardBody);
    expect(wrapper.find('[data-test="card-body"]').attributes('data-padded')).toBe('true');
  });

  it('removes padding when noPadding is true', () => {
    const wrapper = mount(VrlCardBody, {
      props: {
        noPadding: true,
      },
    });
    expect(wrapper.find('[data-test="card-body"]').attributes('data-padded')).toBe('false');
    expect(wrapper.find('[data-test="card-body"]').exists()).toBe(true);
  });

  it('applies padding when noPadding is false', () => {
    const wrapper = mount(VrlCardBody, {
      props: {
        noPadding: false,
      },
    });
    expect(wrapper.find('[data-test="card-body"]').attributes('data-padded')).toBe('true');
  });

  it('applies custom classes', () => {
    const wrapper = mount(VrlCardBody, {
      props: {
        class: 'custom-body-class',
      },
    });
    const body = wrapper.find('[data-test="card-body"]');
    expect(body.classes()).toContain('custom-body-class');
  });

  it('applies multiple custom classes', () => {
    const wrapper = mount(VrlCardBody, {
      props: {
        class: 'class-one class-two',
      },
    });
    const body = wrapper.find('[data-test="card-body"]');
    expect(body.classes()).toContain('class-one');
    expect(body.classes()).toContain('class-two');
  });

  it('applies custom classes with padding', () => {
    const wrapper = mount(VrlCardBody, {
      props: {
        class: 'custom-class',
        noPadding: false,
      },
    });
    const body = wrapper.find('[data-test="card-body"]');
    // Card body no longer has a single 'card-body' class - uses Tailwind utilities;
    expect(body.attributes('data-padded')).toBe('true');
    expect(body.classes()).toContain('custom-class');
  });

  it('applies custom classes without padding', () => {
    const wrapper = mount(VrlCardBody, {
      props: {
        class: 'custom-class',
        noPadding: true,
      },
    });
    const body = wrapper.find('[data-test="card-body"]');
    // Card body no longer has a single 'card-body' class - uses Tailwind utilities;
    expect(body.classes()).toContain('custom-class');
    expect(body.attributes('data-padded')).toBe('false');
  });

  it('renders complex slot content', () => {
    const wrapper = mount(VrlCardBody, {
      slots: {
        default: `
          <div class="complex-content">
            <h4>Title</h4>
            <p>Paragraph</p>
            <ul>
              <li>Item 1</li>
              <li>Item 2</li>
            </ul>
          </div>
        `,
      },
    });
    expect(wrapper.find('.complex-content').exists()).toBe(true);
    expect(wrapper.html()).toContain('<h4>Title</h4>');
    expect(wrapper.html()).toContain('<ul>');
  });
});
