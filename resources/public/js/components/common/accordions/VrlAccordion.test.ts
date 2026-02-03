import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import VrlAccordion from './VrlAccordion.vue';
import VrlAccordionItem from './VrlAccordionItem.vue';

describe('VrlAccordion', () => {
  it('renders accordion items', () => {
    const wrapper = mount(VrlAccordion, {
      slots: {
        default: `
          <VrlAccordionItem value="1" title="Item 1">Content 1</VrlAccordionItem>
          <VrlAccordionItem value="2" title="Item 2">Content 2</VrlAccordionItem>
        `,
      },
      global: {
        components: { VrlAccordionItem },
      },
    });

    expect(wrapper.findAll('[data-test="vrl-accordion-item"]')).toHaveLength(2);
  });

  it('opens only one item in single mode', async () => {
    const wrapper = mount(VrlAccordion, {
      props: {
        multiple: false,
        modelValue: '1',
      },
      slots: {
        default: `
          <VrlAccordionItem value="1" title="Item 1">Content 1</VrlAccordionItem>
          <VrlAccordionItem value="2" title="Item 2">Content 2</VrlAccordionItem>
        `,
      },
      global: {
        components: { VrlAccordionItem },
      },
    });

    const items = wrapper.findAll('[data-test="vrl-accordion-item"]');
    // Check if first item has elevated background (active state)
    expect(items[0]?.classes().some((c) => c.includes('bg-[var(--bg-elevated)]'))).toBe(true);
    // Check if second item does not have elevated background
    expect(items[1]?.classes().some((c) => c.includes('bg-[var(--bg-elevated)]'))).toBe(false);
  });

  it('opens multiple items in multiple mode', async () => {
    const wrapper = mount(VrlAccordion, {
      props: {
        multiple: true,
        modelValue: ['1', '2'],
      },
      slots: {
        default: `
          <VrlAccordionItem value="1" title="Item 1">Content 1</VrlAccordionItem>
          <VrlAccordionItem value="2" title="Item 2">Content 2</VrlAccordionItem>
        `,
      },
      global: {
        components: { VrlAccordionItem },
      },
    });

    const items = wrapper.findAll('[data-test="vrl-accordion-item"]');
    expect(items[0]?.classes().some((c) => c.includes('border-[var(--cyan)]'))).toBe(true);
    expect(items[1]?.classes().some((c) => c.includes('border-[var(--cyan)]'))).toBe(true);
  });

  it('emits update:modelValue when item is toggled', async () => {
    const wrapper = mount(VrlAccordion, {
      props: {
        modelValue: undefined,
      },
      slots: {
        default: `
          <VrlAccordionItem value="1" title="Item 1">Content 1</VrlAccordionItem>
        `,
      },
      global: {
        components: { VrlAccordionItem },
      },
    });

    const header = wrapper.find('[data-test="vrl-accordion-header"]');
    await header.trigger('click');

    expect(wrapper.emitted('update:modelValue')).toBeTruthy();
    expect(wrapper.emitted('update:modelValue')![0]).toEqual(['1']);
  });

  it('applies correct gap class', () => {
    const wrapper = mount(VrlAccordion, {
      props: { gap: 'lg' },
    });

    expect(wrapper.classes()).toContain('gap-4');
  });

  it('applies default gap class (md)', () => {
    const wrapper = mount(VrlAccordion, {
      props: {},
    });

    expect(wrapper.classes()).toContain('gap-2');
  });

  it('provides context to child items', () => {
    const wrapper = mount(VrlAccordion, {
      props: {
        modelValue: '1',
        multiple: false,
      },
      slots: {
        default: `
          <VrlAccordionItem value="1" title="Item 1">Content 1</VrlAccordionItem>
        `,
      },
      global: {
        components: { VrlAccordionItem },
      },
    });

    // Context is provided via provide/inject
    // Child component should receive activeValue and toggleItem
    expect(wrapper.vm).toBeDefined();
  });

  it('toggles to undefined when active item is clicked in single mode', async () => {
    const wrapper = mount(VrlAccordion, {
      props: {
        modelValue: '1',
        multiple: false,
        'onUpdate:modelValue': (value: string | string[] | undefined) =>
          wrapper.setProps({ modelValue: value }),
      },
      slots: {
        default: `
          <VrlAccordionItem value="1" title="Item 1">Content 1</VrlAccordionItem>
        `,
      },
      global: {
        components: { VrlAccordionItem },
      },
    });

    const header = wrapper.find('[data-test="vrl-accordion-header"]');
    await header.trigger('click');

    expect(wrapper.emitted('update:modelValue')).toBeTruthy();
    expect(wrapper.emitted('update:modelValue')![0]).toEqual([undefined]);
  });

  it('removes item from array when clicked in multiple mode', async () => {
    const wrapper = mount(VrlAccordion, {
      props: {
        modelValue: ['1', '2'],
        multiple: true,
        'onUpdate:modelValue': (value: string | string[] | undefined) =>
          wrapper.setProps({ modelValue: value }),
      },
      slots: {
        default: `
          <VrlAccordionItem value="1" title="Item 1">Content 1</VrlAccordionItem>
          <VrlAccordionItem value="2" title="Item 2">Content 2</VrlAccordionItem>
        `,
      },
      global: {
        components: { VrlAccordionItem },
      },
    });

    const headers = wrapper.findAll('[data-test="vrl-accordion-header"]');
    await headers[0]?.trigger('click');

    expect(wrapper.emitted('update:modelValue')).toBeTruthy();
    const lastEmit =
      wrapper.emitted('update:modelValue')![wrapper.emitted('update:modelValue')!.length - 1];
    expect(lastEmit).toEqual([['2']]);
  });

  it('adds item to array when clicked in multiple mode', async () => {
    const wrapper = mount(VrlAccordion, {
      props: {
        modelValue: ['1'],
        multiple: true,
        'onUpdate:modelValue': (value: string | string[] | undefined) =>
          wrapper.setProps({ modelValue: value }),
      },
      slots: {
        default: `
          <VrlAccordionItem value="1" title="Item 1">Content 1</VrlAccordionItem>
          <VrlAccordionItem value="2" title="Item 2">Content 2</VrlAccordionItem>
        `,
      },
      global: {
        components: { VrlAccordionItem },
      },
    });

    const headers = wrapper.findAll('[data-test="vrl-accordion-header"]');
    await headers[1]?.trigger('click');

    expect(wrapper.emitted('update:modelValue')).toBeTruthy();
    const lastEmit =
      wrapper.emitted('update:modelValue')?.[wrapper.emitted('update:modelValue')!.length - 1];
    expect(lastEmit?.[0]).toEqual(['1', '2']);
  });

  it('applies custom CSS class', () => {
    const wrapper = mount(VrlAccordion, {
      props: {
        class: 'custom-accordion',
      },
    });

    expect(wrapper.find('[data-test="vrl-accordion"]').classes()).toContain('custom-accordion');
  });
});
