import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import VrlListRowAction from '../VrlListRowAction.vue';

describe('VrlListRowAction', () => {
  it('renders slot content', () => {
    const wrapper = mount(VrlListRowAction, {
      slots: {
        default: '<button class="test-button">View</button>',
      },
    });

    expect(wrapper.find('.test-button').exists()).toBe(true);
    expect(wrapper.text()).toBe('View');
  });

  it('has opacity-0 and group-hover classes', () => {
    const wrapper = mount(VrlListRowAction);

    expect(wrapper.classes()).toContain('opacity-0');
    expect(wrapper.classes()).toContain('group-hover:opacity-100');
    expect(wrapper.classes()).toContain('shrink-0');
  });

  it('has data-test attribute', () => {
    const wrapper = mount(VrlListRowAction);

    expect(wrapper.attributes('data-test')).toBe('list-row-action');
  });

  it('applies custom classes', () => {
    const wrapper = mount(VrlListRowAction, {
      props: {
        class: 'custom-class',
      },
    });

    expect(wrapper.classes()).toContain('custom-class');
    expect(wrapper.classes()).toContain('opacity-0');
  });

  it('renders complex slot content', () => {
    const wrapper = mount(VrlListRowAction, {
      slots: {
        default: `
          <div class="action-group">
            <button class="btn-edit">Edit</button>
            <button class="btn-delete">Delete</button>
          </div>
        `,
      },
    });

    expect(wrapper.find('.action-group').exists()).toBe(true);
    expect(wrapper.find('.btn-edit').exists()).toBe(true);
    expect(wrapper.find('.btn-delete').exists()).toBe(true);
  });
});
