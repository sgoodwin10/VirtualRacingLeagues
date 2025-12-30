import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import Accordion from 'primevue/accordion';
import TechnicalAccordion from '../TechnicalAccordion.vue';

describe('TechnicalAccordion', () => {
  it('renders PrimeVue Accordion component', () => {
    const wrapper = mount(TechnicalAccordion);

    expect(wrapper.findComponent(Accordion).exists()).toBe(true);
  });

  it('binds modelValue correctly', () => {
    const wrapper = mount(TechnicalAccordion, {
      props: {
        modelValue: 'panel-1',
      },
    });

    const accordion = wrapper.findComponent(Accordion);
    expect(accordion.props('value')).toBe('panel-1');
  });

  it('emits update:modelValue when accordion value changes', async () => {
    const wrapper = mount(TechnicalAccordion, {
      props: {
        modelValue: 'panel-1',
      },
    });

    const accordion = wrapper.findComponent(Accordion);
    await accordion.vm.$emit('update:value', 'panel-2');

    expect(wrapper.emitted('update:modelValue')).toBeTruthy();
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['panel-2']);
  });

  it('supports multiple prop', () => {
    const wrapper = mount(TechnicalAccordion, {
      props: {
        multiple: true,
        modelValue: ['panel-1', 'panel-2'],
      },
    });

    const accordion = wrapper.findComponent(Accordion);
    expect(accordion.props('multiple')).toBe(true);
  });

  it('applies default medium gap', () => {
    const wrapper = mount(TechnicalAccordion);

    const accordion = wrapper.findComponent(Accordion);
    expect(accordion.props('pt')?.root?.style?.gap).toBe('8px');
  });

  it('applies small gap', () => {
    const wrapper = mount(TechnicalAccordion, {
      props: {
        gap: 'sm',
      },
    });

    const accordion = wrapper.findComponent(Accordion);
    expect(accordion.props('pt')?.root?.style?.gap).toBe('4px');
  });

  it('applies large gap', () => {
    const wrapper = mount(TechnicalAccordion, {
      props: {
        gap: 'lg',
      },
    });

    const accordion = wrapper.findComponent(Accordion);
    expect(accordion.props('pt')?.root?.style?.gap).toBe('12px');
  });

  it('applies no gap when gap is none', () => {
    const wrapper = mount(TechnicalAccordion, {
      props: {
        gap: 'none',
      },
    });

    const accordion = wrapper.findComponent(Accordion);
    expect(accordion.props('pt')?.root?.style?.gap).toBe('0');
  });

  it('renders slot content', () => {
    const wrapper = mount(TechnicalAccordion, {
      slots: {
        default: '<div class="test-content">Test Content</div>',
      },
    });

    expect(wrapper.html()).toContain('test-content');
  });
});
