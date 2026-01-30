import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import VrlListRowContent from './VrlListRowContent.vue';

describe('VrlListRowContent', () => {
  it('renders title from prop', () => {
    const wrapper = mount(VrlListRowContent, {
      props: {
        title: 'GT4 Championship 2026',
      },
    });

    expect(wrapper.text()).toContain('GT4 Championship 2026');
    expect(wrapper.find('[data-test="list-row-title"]').text()).toBe('GT4 Championship 2026');
  });

  it('renders subtitle from prop', () => {
    const wrapper = mount(VrlListRowContent, {
      props: {
        title: 'GT4 Championship',
        subtitle: 'Started Jan 15, 2026',
      },
    });

    expect(wrapper.find('[data-test="list-row-subtitle"]').exists()).toBe(true);
    expect(wrapper.find('[data-test="list-row-subtitle"]').text()).toBe('Started Jan 15, 2026');
  });

  it('hides subtitle when not provided', () => {
    const wrapper = mount(VrlListRowContent, {
      props: {
        title: 'GT4 Championship',
      },
    });

    expect(wrapper.find('[data-test="list-row-subtitle"]').exists()).toBe(false);
  });

  it('renders title from slot', () => {
    const wrapper = mount(VrlListRowContent, {
      props: {
        title: 'Default Title',
      },
      slots: {
        title: '<strong>Custom Title</strong>',
      },
    });

    expect(wrapper.html()).toContain('<strong>Custom Title</strong>');
    expect(wrapper.text()).not.toContain('Default Title');
  });

  it('renders subtitle from slot', () => {
    const wrapper = mount(VrlListRowContent, {
      props: {
        title: 'Title',
        subtitle: 'Default Subtitle',
      },
      slots: {
        subtitle: '<span>Custom Subtitle</span>',
      },
    });

    expect(wrapper.html()).toContain('<span>Custom Subtitle</span>');
    expect(wrapper.text()).not.toContain('Default Subtitle');
  });

  it('shows subtitle when slot provided even without subtitle prop', () => {
    const wrapper = mount(VrlListRowContent, {
      props: {
        title: 'Title',
      },
      slots: {
        subtitle: 'Subtitle from slot',
      },
    });

    expect(wrapper.find('[data-test="list-row-subtitle"]').exists()).toBe(true);
    expect(wrapper.find('[data-test="list-row-subtitle"]').text()).toBe('Subtitle from slot');
  });

  it('has flex-1 and min-w-0 classes', () => {
    const wrapper = mount(VrlListRowContent, {
      props: {
        title: 'Test',
      },
    });

    expect(wrapper.classes()).toContain('flex-1');
    expect(wrapper.classes()).toContain('min-w-0');
  });

  it('has data-test attribute', () => {
    const wrapper = mount(VrlListRowContent, {
      props: {
        title: 'Test',
      },
    });

    expect(wrapper.attributes('data-test')).toBe('list-row-content');
  });

  it('applies custom classes', () => {
    const wrapper = mount(VrlListRowContent, {
      props: {
        title: 'Test',
        class: 'custom-class',
      },
    });

    expect(wrapper.classes()).toContain('custom-class');
    expect(wrapper.classes()).toContain('flex-1');
  });
});
