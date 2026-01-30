import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import VrlPanel from './VrlPanel.vue';

describe('VrlPanel', () => {
  it('renders title prop', () => {
    const wrapper = mount(VrlPanel, {
      props: { title: 'Test Panel' },
    });
    expect(wrapper.text()).toContain('Test Panel');
  });

  it('renders slot content', () => {
    const wrapper = mount(VrlPanel, {
      slots: { default: '<p>Test Content</p>' },
    });
    expect(wrapper.html()).toContain('Test Content');
  });

  it('starts expanded by default', () => {
    const wrapper = mount(VrlPanel, {
      props: { collapsible: true },
      slots: { default: '<p>Content</p>' },
    });
    const content = wrapper.find('[data-test="vrl-panel-content"]');
    expect(content.exists()).toBe(true);
    expect(content.isVisible()).toBe(true);
  });

  it('starts collapsed when defaultExpanded is false', () => {
    const wrapper = mount(VrlPanel, {
      props: {
        collapsible: true,
        defaultExpanded: false,
      },
      slots: { default: '<p>Content</p>' },
    });
    const header = wrapper.find('[data-test="vrl-panel-header"]');
    // Check aria-expanded attribute to verify collapsed state
    expect(header.attributes('aria-expanded')).toBe('false');
  });

  it('toggles on header click when collapsible', async () => {
    const wrapper = mount(VrlPanel, {
      props: {
        collapsible: true,
        title: 'Test',
        defaultExpanded: false, // Start collapsed
      },
      slots: { default: '<p>Content</p>' },
    });

    const header = wrapper.find('[data-test="vrl-panel-header"]');
    await header.trigger('click');

    expect(wrapper.emitted('toggle')).toBeTruthy();
    expect(wrapper.emitted('toggle')![0]).toEqual([true]); // Should expand to true
  });

  it('does not toggle when not collapsible', async () => {
    const wrapper = mount(VrlPanel, {
      props: {
        collapsible: false,
        title: 'Test',
      },
      slots: { default: '<p>Content</p>' },
    });

    const header = wrapper.find('[data-test="vrl-panel-header"]');
    await header.trigger('click');

    expect(wrapper.emitted('toggle')).toBeFalsy();
  });

  it('supports v-model:expanded', async () => {
    const wrapper = mount(VrlPanel, {
      props: {
        collapsible: true,
        expanded: true,
        'onUpdate:expanded': (value: boolean) => wrapper.setProps({ expanded: value }),
      },
      slots: { default: '<p>Content</p>' },
    });

    const header = wrapper.find('[data-test="vrl-panel-header"]');
    await header.trigger('click');

    expect(wrapper.emitted('update:expanded')).toBeTruthy();
    expect(wrapper.emitted('update:expanded')![0]).toEqual([false]);
  });

  it('handles keyboard navigation (Enter key)', async () => {
    const wrapper = mount(VrlPanel, {
      props: {
        collapsible: true,
        title: 'Test',
        defaultExpanded: false,
      },
      slots: { default: '<p>Content</p>' },
    });

    const header = wrapper.find('[data-test="vrl-panel-header"]');
    await header.trigger('keydown', { key: 'Enter' });

    expect(wrapper.emitted('toggle')).toBeTruthy();
    expect(wrapper.emitted('toggle')![0]).toEqual([true]);
  });

  it('handles keyboard navigation (Space key)', async () => {
    const wrapper = mount(VrlPanel, {
      props: {
        collapsible: true,
        title: 'Test',
      },
      slots: { default: '<p>Content</p>' },
    });

    const header = wrapper.find('[data-test="vrl-panel-header"]');
    await header.trigger('keydown', { key: ' ' });

    expect(wrapper.emitted('toggle')).toBeTruthy();
  });

  it('has correct ARIA attributes when collapsible', () => {
    const wrapper = mount(VrlPanel, {
      props: {
        collapsible: true,
        title: 'Test',
        defaultExpanded: false, // Start collapsed
      },
      slots: { default: '<p>Content</p>' },
    });

    const header = wrapper.find('[data-test="vrl-panel-header"]');
    expect(header.attributes('role')).toBe('button');
    expect(header.attributes('aria-expanded')).toBe('false'); // Should be false when collapsed
    expect(header.attributes('tabindex')).toBe('0');
  });

  it('does not have ARIA button role when not collapsible', () => {
    const wrapper = mount(VrlPanel, {
      props: {
        collapsible: false,
        title: 'Test',
      },
      slots: { default: '<p>Content</p>' },
    });

    const header = wrapper.find('[data-test="vrl-panel-header"]');
    expect(header.attributes('role')).toBeUndefined();
  });

  it('renders custom header slot', () => {
    const wrapper = mount(VrlPanel, {
      props: { collapsible: true },
      slots: {
        header: '<span>Custom Header</span>',
        default: '<p>Content</p>',
      },
    });

    expect(wrapper.text()).toContain('Custom Header');
  });

  it('renders actions slot', () => {
    const wrapper = mount(VrlPanel, {
      props: { title: 'Test', collapsible: true },
      slots: {
        actions: '<button>Action</button>',
        default: '<p>Content</p>',
      },
    });

    expect(wrapper.html()).toContain('<button>Action</button>');
  });

  it('applies custom CSS classes', () => {
    const wrapper = mount(VrlPanel, {
      props: {
        class: 'custom-panel',
        headerClass: 'custom-header',
        contentClass: 'custom-content',
      },
      slots: { default: '<p>Content</p>' },
    });

    expect(wrapper.find('[data-test="vrl-panel"]').classes()).toContain('custom-panel');
    expect(wrapper.find('[data-test="vrl-panel-header"]').classes()).toContain('custom-header');
    expect(wrapper.find('[data-test="vrl-panel-content"]').classes()).toContain('custom-content');
  });
});
