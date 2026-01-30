import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import VrlInfoBox from './VrlInfoBox.vue';

describe('VrlInfoBox', () => {
  it('renders with required props', () => {
    const wrapper = mount(VrlInfoBox, {
      props: {
        title: 'Test Info Box',
      },
    });
    expect(wrapper.find('[data-test="info-box"]').exists()).toBe(true);
    expect(wrapper.find('[data-test="info-box-title"]').text()).toBe('Test Info Box');
  });

  it('renders with title and message', () => {
    const wrapper = mount(VrlInfoBox, {
      props: {
        title: 'Tip',
        message: 'This is a helpful tip',
      },
    });
    expect(wrapper.find('[data-test="info-box-title"]').text()).toBe('Tip');
    expect(wrapper.find('[data-test="info-box-message"]').text()).toBe('This is a helpful tip');
  });

  it('applies default type (info)', () => {
    const wrapper = mount(VrlInfoBox, {
      props: {
        title: 'Info',
      },
    });
    expect(wrapper.find('[data-test="info-box"][data-type="info"]').exists()).toBe(true);
  });

  it('applies success type', () => {
    const wrapper = mount(VrlInfoBox, {
      props: {
        type: 'success',
        title: 'Success',
      },
    });
    expect(wrapper.find('[data-test="info-box"][data-type="success"]').exists()).toBe(true);
  });

  it('applies warning type', () => {
    const wrapper = mount(VrlInfoBox, {
      props: {
        type: 'warning',
        title: 'Warning',
      },
    });
    expect(wrapper.find('[data-test="info-box"][data-type="warning"]').exists()).toBe(true);
  });

  it('applies danger type', () => {
    const wrapper = mount(VrlInfoBox, {
      props: {
        type: 'danger',
        title: 'Danger',
      },
    });
    expect(wrapper.find('[data-test="info-box"][data-type="danger"]').exists()).toBe(true);
  });

  it('applies cyan text color for info type', () => {
    const wrapper = mount(VrlInfoBox, {
      props: {
        type: 'info',
        title: 'Info',
      },
    });
    const title = wrapper.find('[data-test="info-box-title"]');
    expect(title.classes()).toContain('text-[var(--cyan)]');
  });

  it('applies green text color for success type', () => {
    const wrapper = mount(VrlInfoBox, {
      props: {
        type: 'success',
        title: 'Success',
      },
    });
    const title = wrapper.find('[data-test="info-box-title"]');
    expect(title.classes()).toContain('text-[var(--green)]');
  });

  it('applies orange text color for warning type', () => {
    const wrapper = mount(VrlInfoBox, {
      props: {
        type: 'warning',
        title: 'Warning',
      },
    });
    const title = wrapper.find('[data-test="info-box-title"]');
    expect(title.classes()).toContain('text-[var(--orange)]');
  });

  it('applies red text color for danger type', () => {
    const wrapper = mount(VrlInfoBox, {
      props: {
        type: 'danger',
        title: 'Danger',
      },
    });
    const title = wrapper.find('[data-test="info-box-title"]');
    expect(title.classes()).toContain('text-[var(--red)]');
  });

  it('renders title slot content', () => {
    const wrapper = mount(VrlInfoBox, {
      props: {
        title: 'Default Title',
      },
      slots: {
        title: '<strong class="custom-title">Custom Title</strong>',
      },
    });
    expect(wrapper.find('.custom-title').exists()).toBe(true);
    expect(wrapper.html()).toContain('Custom Title');
    // Note: aria-label will still contain the prop value for accessibility
    expect(wrapper.find('[data-test="info-box-title"]').text()).toBe('Custom Title');
  });

  it('renders default slot as message', () => {
    const wrapper = mount(VrlInfoBox, {
      props: {
        title: 'Title',
      },
      slots: {
        default: '<p class="slot-message">Slot message content</p>',
      },
    });
    expect(wrapper.find('[data-test="info-box-message"]').exists()).toBe(true);
    expect(wrapper.find('.slot-message').exists()).toBe(true);
    expect(wrapper.html()).toContain('Slot message content');
  });

  it('does not render message container when no message or slot', () => {
    const wrapper = mount(VrlInfoBox, {
      props: {
        title: 'Title Only',
      },
    });
    expect(wrapper.find('[data-test="info-box-message"]').exists()).toBe(false);
  });

  it('renders message from prop', () => {
    const wrapper = mount(VrlInfoBox, {
      props: {
        title: 'Title',
        message: 'Message from prop',
      },
    });
    expect(wrapper.find('[data-test="info-box-message"]').text()).toBe('Message from prop');
  });

  it('default slot overrides message prop', () => {
    const wrapper = mount(VrlInfoBox, {
      props: {
        title: 'Title',
        message: 'Prop message',
      },
      slots: {
        default: '<span>Slot message</span>',
      },
    });
    expect(wrapper.html()).toContain('Slot message');
    expect(wrapper.html()).not.toContain('Prop message');
  });

  it('applies custom classes', () => {
    const wrapper = mount(VrlInfoBox, {
      props: {
        title: 'Info',
        class: 'custom-info-class',
      },
    });
    const infoBox = wrapper.find('[data-test="info-box"]');
    expect(infoBox.classes()).toContain('custom-info-class');
  });

  it('applies multiple custom classes', () => {
    const wrapper = mount(VrlInfoBox, {
      props: {
        title: 'Info',
        class: 'class-one class-two',
      },
    });
    const infoBox = wrapper.find('[data-test="info-box"]');
    expect(infoBox.classes()).toContain('class-one');
    expect(infoBox.classes()).toContain('class-two');
  });

  it('has correct accessibility attributes', () => {
    const wrapper = mount(VrlInfoBox, {
      props: {
        title: 'Accessible Info Box',
      },
    });
    const infoBox = wrapper.find('[data-test="info-box"]');
    expect(infoBox.attributes('role')).toBe('note');
    expect(infoBox.attributes('aria-label')).toBe('Accessible Info Box');
  });

  it('renders complete info box with all features', () => {
    const wrapper = mount(VrlInfoBox, {
      props: {
        type: 'warning',
        title: 'Important Note',
        message: 'This is an important warning message',
        class: 'custom-class',
      },
    });
    const infoBox = wrapper.find('[data-test="info-box"]');
    expect(infoBox.exists()).toBe(true);
    expect(infoBox.attributes('data-type')).toBe('warning');
    expect(wrapper.find('[data-test="info-box-title"]').text()).toBe('Important Note');
    expect(wrapper.find('[data-test="info-box-title"]').classes()).toContain(
      'text-[var(--orange)]',
    );
    expect(wrapper.find('[data-test="info-box-message"]').text()).toBe(
      'This is an important warning message',
    );
    expect(infoBox.classes()).toContain('custom-class');
  });

  it('maintains correct structure', () => {
    const wrapper = mount(VrlInfoBox, {
      props: {
        title: 'Structure Test',
        message: 'Testing structure',
      },
    });
    const infoBox = wrapper.find('[data-test="info-box"]');
    expect(infoBox.find('[data-test="info-box-title"]').exists()).toBe(true);
    expect(infoBox.find('[data-test="info-box-message"]').exists()).toBe(true);
  });

  it('renders complex slot content', () => {
    const wrapper = mount(VrlInfoBox, {
      props: {
        title: 'Title',
      },
      slots: {
        default: `
          <div class="complex-content">
            <p>First paragraph</p>
            <ul>
              <li>Item 1</li>
              <li>Item 2</li>
            </ul>
          </div>
        `,
      },
    });
    expect(wrapper.find('.complex-content').exists()).toBe(true);
    expect(wrapper.html()).toContain('<ul>');
    expect(wrapper.html()).toContain('Item 1');
  });
});
