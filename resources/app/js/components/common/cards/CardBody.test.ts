import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import CardBody from '@app/components/common/cards/CardBody.vue';

describe('CardBody', () => {
  it('renders with default padding', () => {
    const wrapper = mount(CardBody, {
      slots: {
        default: '<p>Test content</p>',
      },
    });
    expect(wrapper.find('[class*="p-[18px]"]').exists()).toBe(true);
    expect(wrapper.text()).toContain('Test content');
  });

  it('renders without padding when noPadding is true', () => {
    const wrapper = mount(CardBody, {
      props: { noPadding: true },
      slots: {
        default: '<p>Test content</p>',
      },
    });
    expect(wrapper.find('.p-0').exists()).toBe(true);
  });

  it('applies custom classes', () => {
    const wrapper = mount(CardBody, {
      props: { class: 'custom-class' },
    });
    expect(wrapper.find('.custom-class').exists()).toBe(true);
  });

  it('renders slot content', () => {
    const wrapper = mount(CardBody, {
      slots: {
        default: '<div class="test-content">Body content</div>',
      },
    });
    expect(wrapper.find('.test-content').exists()).toBe(true);
    expect(wrapper.text()).toContain('Body content');
  });
});
