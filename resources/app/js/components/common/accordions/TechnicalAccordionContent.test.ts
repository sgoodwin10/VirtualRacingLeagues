import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import AccordionContent from 'primevue/accordioncontent';
import TechnicalAccordionContent from './TechnicalAccordionContent.vue';

describe('TechnicalAccordionContent', () => {
  const mockAccordionContext = {
    $pcAccordion: {
      value: 'panel-1',
      changeActiveValue: () => {},
    },
    $pcAccordionPanel: {
      value: 'panel-1',
      active: false,
    },
  };

  it('renders PrimeVue AccordionContent component', () => {
    const wrapper = mount(TechnicalAccordionContent, {
      global: {
        provide: mockAccordionContext,
      },
    } as any);

    expect(wrapper.findComponent(AccordionContent).exists()).toBe(true);
  });

  it('renders slot content', () => {
    const wrapper = mount(TechnicalAccordionContent, {
      global: {
        provide: mockAccordionContext,
      },
      slots: {
        default: '<div class="test-content">Test Content</div>',
      },
    } as any);

    expect(wrapper.html()).toContain('test-content');
    expect(wrapper.html()).toContain('Test Content');
  });

  it('renders with default wrapper when elevated is false', () => {
    const wrapper = mount(TechnicalAccordionContent, {
      global: {
        provide: mockAccordionContext,
      },
      slots: {
        default: '<div class="test-content">Test Content</div>',
      },
    } as any);

    expect(wrapper.find('.content-wrapper').exists()).toBe(true);
    expect(wrapper.find('.content-elevated').exists()).toBe(false);
  });

  it('renders with elevated wrapper when elevated is true', () => {
    const wrapper = mount(TechnicalAccordionContent, {
      global: {
        provide: mockAccordionContext,
      },
      props: {
        elevated: true,
      },
      slots: {
        default: '<div class="test-content">Test Content</div>',
      },
    } as any);

    expect(wrapper.find('.content-elevated').exists()).toBe(true);
    expect(wrapper.find('.content-wrapper').exists()).toBe(false);
  });

  it('applies default medium padding', () => {
    const wrapper = mount(TechnicalAccordionContent, {
      global: {
        provide: mockAccordionContext,
      },
    } as any);

    const contentWrapper = wrapper.find('.content-wrapper');
    expect(contentWrapper.attributes('style')).toContain('padding: 20px');
  });

  it('applies small padding', () => {
    const wrapper = mount(TechnicalAccordionContent, {
      global: {
        provide: mockAccordionContext,
      },
      props: {
        padding: 'sm',
      },
    } as any);

    const contentWrapper = wrapper.find('.content-wrapper');
    expect(contentWrapper.attributes('style')).toContain('padding: 12px');
  });

  it('applies large padding', () => {
    const wrapper = mount(TechnicalAccordionContent, {
      global: {
        provide: mockAccordionContext,
      },
      props: {
        padding: 'lg',
      },
    } as any);

    const contentWrapper = wrapper.find('.content-wrapper');
    expect(contentWrapper.attributes('style')).toContain('padding: 28px');
  });

  it('applies no padding when padding is none', () => {
    const wrapper = mount(TechnicalAccordionContent, {
      global: {
        provide: mockAccordionContext,
      },
      props: {
        padding: 'none',
      },
    } as any);

    const contentWrapper = wrapper.find('.content-wrapper');
    expect(contentWrapper.attributes('style')).toContain('padding: 0');
  });

  it('applies padding to elevated wrapper', () => {
    const wrapper = mount(TechnicalAccordionContent, {
      global: {
        provide: mockAccordionContext,
      },
      props: {
        elevated: true,
        padding: 'lg',
      },
    } as any);

    const contentElevated = wrapper.find('.content-elevated');
    expect(contentElevated.attributes('style')).toContain('padding: 28px');
  });

  it('has technical-accordion-content class', () => {
    const wrapper = mount(TechnicalAccordionContent, {
      global: {
        provide: mockAccordionContext,
      },
    } as any);

    const accordionContent = wrapper.findComponent(AccordionContent);
    expect((accordionContent.props('pt') as any)?.root?.class).toBe('technical-accordion-content');
  });
});
