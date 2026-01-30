import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { ref } from 'vue';
import VrlAccordionItem from './VrlAccordionItem.vue';

describe('VrlAccordionItem', () => {
  it('renders title prop', () => {
    const wrapper = mount(VrlAccordionItem, {
      props: {
        value: '1',
        title: 'Test Item',
      },
      global: {
        provide: {
          'vrl-accordion': {
            activeValue: ref(undefined),
            multiple: false,
            toggleItem: () => {},
          },
        },
      },
    });

    expect(wrapper.text()).toContain('Test Item');
  });

  it('renders content slot', () => {
    const wrapper = mount(VrlAccordionItem, {
      props: { value: '1' },
      slots: {
        default: '<p>Test Content</p>',
      },
      global: {
        provide: {
          'vrl-accordion': {
            activeValue: ref('1'),
            multiple: false,
            toggleItem: () => {},
          },
        },
      },
    });

    expect(wrapper.html()).toContain('Test Content');
  });

  it('is active when value matches activeValue', () => {
    const wrapper = mount(VrlAccordionItem, {
      props: {
        value: '1',
        title: 'Test',
      },
      global: {
        provide: {
          'vrl-accordion': {
            activeValue: ref('1'),
            multiple: false,
            toggleItem: () => {},
          },
        },
      },
    });

    // Check for active state via elevated background
    expect(wrapper.classes().some((c) => c.includes('bg-[var(--bg-elevated)]'))).toBe(true);
  });

  it('is not active when value does not match', () => {
    const wrapper = mount(VrlAccordionItem, {
      props: {
        value: '1',
        title: 'Test',
      },
      global: {
        provide: {
          'vrl-accordion': {
            activeValue: ref('2'),
            multiple: false,
            toggleItem: () => {},
          },
        },
      },
    });

    // Check for inactive state (should not have elevated background)
    expect(wrapper.classes().some((c) => c.includes('bg-[var(--bg-elevated)]'))).toBe(false);
  });

  it('is active in multiple mode when value is in array', () => {
    const wrapper = mount(VrlAccordionItem, {
      props: {
        value: '1',
        title: 'Test',
      },
      global: {
        provide: {
          'vrl-accordion': {
            activeValue: ref(['1', '2']),
            multiple: true,
            toggleItem: () => {},
          },
        },
      },
    });

    expect(wrapper.classes().some((c) => c.includes('bg-[var(--bg-elevated)]'))).toBe(true);
  });

  it('is not active in multiple mode when value is not in array', () => {
    const wrapper = mount(VrlAccordionItem, {
      props: {
        value: '3',
        title: 'Test',
      },
      global: {
        provide: {
          'vrl-accordion': {
            activeValue: ref(['1', '2']),
            multiple: true,
            toggleItem: () => {},
          },
        },
      },
    });

    expect(wrapper.classes().some((c) => c.includes('bg-[var(--bg-elevated)]'))).toBe(false);
  });

  it('calls toggleItem when clicked', async () => {
    const toggleItem = vi.fn();
    const wrapper = mount(VrlAccordionItem, {
      props: {
        value: '1',
        title: 'Test',
      },
      global: {
        provide: {
          'vrl-accordion': {
            activeValue: ref(undefined),
            multiple: false,
            toggleItem,
          },
        },
      },
    });

    const header = wrapper.find('[data-test="vrl-accordion-header"]');
    await header.trigger('click');

    expect(toggleItem).toHaveBeenCalledWith('1');
  });

  it('does not toggle when disabled', async () => {
    const toggleItem = vi.fn();
    const wrapper = mount(VrlAccordionItem, {
      props: {
        value: '1',
        title: 'Test',
        disabled: true,
      },
      global: {
        provide: {
          'vrl-accordion': {
            activeValue: ref(undefined),
            multiple: false,
            toggleItem,
          },
        },
      },
    });

    const header = wrapper.find('[data-test="vrl-accordion-header"]');
    await header.trigger('click');

    expect(toggleItem).not.toHaveBeenCalled();
  });

  it('has disabled class when disabled', () => {
    const wrapper = mount(VrlAccordionItem, {
      props: {
        value: '1',
        disabled: true,
      },
      global: {
        provide: {
          'vrl-accordion': {
            activeValue: ref(undefined),
            multiple: false,
            toggleItem: () => {},
          },
        },
      },
    });

    // Check for disabled state via opacity and cursor classes
    expect(wrapper.classes().some((c) => c.includes('opacity-50'))).toBe(true);
    expect(wrapper.classes().some((c) => c.includes('cursor-not-allowed'))).toBe(true);
  });

  it('renders custom header slot', () => {
    const wrapper = mount(VrlAccordionItem, {
      props: {
        value: '1',
      },
      slots: {
        header: '<span>Custom Header</span>',
        default: '<p>Content</p>',
      },
      global: {
        provide: {
          'vrl-accordion': {
            activeValue: ref('1'),
            multiple: false,
            toggleItem: () => {},
          },
        },
      },
    });

    expect(wrapper.text()).toContain('Custom Header');
  });

  it('applies custom CSS class', () => {
    const wrapper = mount(VrlAccordionItem, {
      props: {
        value: '1',
        class: 'custom-item',
      },
      global: {
        provide: {
          'vrl-accordion': {
            activeValue: ref(undefined),
            multiple: false,
            toggleItem: () => {},
          },
        },
      },
    });

    expect(wrapper.find('[data-test="vrl-accordion-item"]').classes()).toContain('custom-item');
  });

  it('handles keyboard navigation (Enter key)', async () => {
    const toggleItem = vi.fn();
    const wrapper = mount(VrlAccordionItem, {
      props: {
        value: '1',
        title: 'Test',
      },
      global: {
        provide: {
          'vrl-accordion': {
            activeValue: ref(undefined),
            multiple: false,
            toggleItem,
          },
        },
      },
    });

    const header = wrapper.find('[data-test="vrl-accordion-header"]');
    await header.trigger('keydown', { key: 'Enter' });

    expect(toggleItem).toHaveBeenCalledWith('1');
  });

  it('handles keyboard navigation (Space key)', async () => {
    const toggleItem = vi.fn();
    const wrapper = mount(VrlAccordionItem, {
      props: {
        value: '1',
        title: 'Test',
      },
      global: {
        provide: {
          'vrl-accordion': {
            activeValue: ref(undefined),
            multiple: false,
            toggleItem,
          },
        },
      },
    });

    const header = wrapper.find('[data-test="vrl-accordion-header"]');
    await header.trigger('keydown', { key: ' ' });

    expect(toggleItem).toHaveBeenCalledWith('1');
  });

  it('has correct ARIA attributes', () => {
    const wrapper = mount(VrlAccordionItem, {
      props: {
        value: '1',
        title: 'Test',
      },
      global: {
        provide: {
          'vrl-accordion': {
            activeValue: ref('1'),
            multiple: false,
            toggleItem: () => {},
          },
        },
      },
    });

    const header = wrapper.find('[data-test="vrl-accordion-header"]');
    expect(header.attributes('role')).toBe('button');
    expect(header.attributes('aria-expanded')).toBe('true');
    expect(header.attributes('aria-disabled')).toBe('false');
    expect(header.attributes('tabindex')).toBe('0');
  });

  it('has aria-disabled true when disabled', () => {
    const wrapper = mount(VrlAccordionItem, {
      props: {
        value: '1',
        title: 'Test',
        disabled: true,
      },
      global: {
        provide: {
          'vrl-accordion': {
            activeValue: ref(undefined),
            multiple: false,
            toggleItem: () => {},
          },
        },
      },
    });

    const header = wrapper.find('[data-test="vrl-accordion-header"]');
    expect(header.attributes('aria-disabled')).toBe('true');
    expect(header.attributes('tabindex')).toBe('-1');
  });

  it('throws error when used outside VrlAccordion', () => {
    expect(() => {
      mount(VrlAccordionItem, {
        props: {
          value: '1',
        },
      });
    }).toThrow('VrlAccordionItem must be used within a VrlAccordion component');
  });
});
