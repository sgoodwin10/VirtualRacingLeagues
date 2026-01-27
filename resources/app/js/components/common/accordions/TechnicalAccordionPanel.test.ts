import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import { ref } from 'vue';
import AccordionPanel from 'primevue/accordionpanel';
import TechnicalAccordionPanel from './TechnicalAccordionPanel.vue';

describe('TechnicalAccordionPanel', () => {
  const mockAccordionContext = {
    $pcAccordion: {
      value: 'panel-1',
      changeActiveValue: () => {},
      isItemActive: () => false,
    },
  };

  it('renders PrimeVue AccordionPanel component', () => {
    const wrapper = mount(TechnicalAccordionPanel, {
      global: {
        provide: mockAccordionContext,
      },
      props: {
        value: 'panel-1',
      },
    });

    expect(wrapper.findComponent(AccordionPanel).exists()).toBe(true);
  });

  it('binds value prop correctly', () => {
    const wrapper = mount(TechnicalAccordionPanel, {
      global: {
        provide: mockAccordionContext,
      },
      props: {
        value: 'panel-1',
      },
    });

    const panel = wrapper.findComponent(AccordionPanel);
    expect(panel.props('value')).toBe('panel-1');
  });

  it('accepts numeric value', () => {
    const wrapper = mount(TechnicalAccordionPanel, {
      global: {
        provide: mockAccordionContext,
      },
      props: {
        value: 1,
      },
    });

    const panel = wrapper.findComponent(AccordionPanel);
    expect(panel.props('value')).toBe(1);
  });

  it('supports disabled state', () => {
    const wrapper = mount(TechnicalAccordionPanel, {
      global: {
        provide: mockAccordionContext,
      },
      props: {
        value: 'panel-1',
        disabled: true,
      },
    });

    const panel = wrapper.findComponent(AccordionPanel);
    expect(panel.props('disabled')).toBe(true);
  });

  it('applies technical-accordion-panel class', () => {
    const wrapper = mount(TechnicalAccordionPanel, {
      global: {
        provide: mockAccordionContext,
      },
      props: {
        value: 'panel-1',
      },
    });

    const panel = wrapper.findComponent(AccordionPanel);
    const classes = panel.props('pt')?.root?.class;
    expect(Array.isArray(classes)).toBe(true);
    expect(classes).toContainEqual('technical-accordion-panel');
  });

  it('adds is-active class when panel is active', () => {
    const wrapper = mount(TechnicalAccordionPanel, {
      props: {
        value: 'panel-1',
      },
      global: {
        provide: {
          ...mockAccordionContext,
          'accordion-value': ref('panel-1'),
        },
      },
    });

    const panel = wrapper.findComponent(AccordionPanel);
    const classes = panel.props('pt')?.root?.class;
    expect(Array.isArray(classes)).toBe(true);
    const classObj = classes.find((c: any) => typeof c === 'object');
    expect(classObj).toEqual({ 'is-active': true });
  });

  it('does not add is-active class when panel is inactive', () => {
    const wrapper = mount(TechnicalAccordionPanel, {
      props: {
        value: 'panel-1',
      },
      global: {
        provide: {
          ...mockAccordionContext,
          'accordion-value': ref('panel-2'),
        },
      },
    });

    const panel = wrapper.findComponent(AccordionPanel);
    const classes = panel.props('pt')?.root?.class;
    expect(Array.isArray(classes)).toBe(true);
    const classObj = classes.find((c: any) => typeof c === 'object');
    expect(classObj).toEqual({ 'is-active': false });
  });

  it('handles multiple active panels', () => {
    const wrapper = mount(TechnicalAccordionPanel, {
      props: {
        value: 'panel-1',
      },
      global: {
        provide: {
          ...mockAccordionContext,
          'accordion-value': ref(['panel-1', 'panel-2']),
        },
      },
    });

    const panel = wrapper.findComponent(AccordionPanel);
    const classes = panel.props('pt')?.root?.class;
    expect(Array.isArray(classes)).toBe(true);
    const classObj = classes.find((c: any) => typeof c === 'object');
    expect(classObj).toEqual({ 'is-active': true });
  });

  it('renders slot content', () => {
    const wrapper = mount(TechnicalAccordionPanel, {
      global: {
        provide: mockAccordionContext,
      },
      props: {
        value: 'panel-1',
      },
      slots: {
        default: '<div class="test-content">Test Content</div>',
      },
    });

    expect(wrapper.html()).toContain('test-content');
  });
});
