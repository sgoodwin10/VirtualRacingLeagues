import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import { PhCheckCircle } from '@phosphor-icons/vue';
import TechnicalAccordionHeader from './TechnicalAccordionHeader.vue';
import AccordionStatusIndicator from './AccordionStatusIndicator.vue';
import AccordionIcon from './AccordionIcon.vue';
import AccordionBadge from './AccordionBadge.vue';

describe('TechnicalAccordionHeader', () => {
  const mockAccordionContext = {
    $pcAccordion: {
      value: 'panel-1',
      changeActiveValue: () => {},
      isItemActive: () => false,
    },
    $pcAccordionPanel: {
      value: 'panel-1',
      active: false,
    },
    $primevue: {
      config: {
        pt: {
          accordionheader: {
            expandicon: {},
          },
        },
      },
    },
  };

  const globalConfig = {
    provide: mockAccordionContext,
    stubs: {
      AccordionHeader: {
        template: '<div class="stubbed-accordion-header"><slot /></div>',
      },
    },
  };

  it('renders PrimeVue AccordionHeader component', () => {
    const wrapper = mount(TechnicalAccordionHeader, {
      global: globalConfig,
      props: {
        title: 'Test Title',
      },
    });

    expect(wrapper.find('.stubbed-accordion-header').exists()).toBe(true);
  });

  it('displays title text', () => {
    const wrapper = mount(TechnicalAccordionHeader, {
      global: globalConfig,
      props: {
        title: 'Test Title',
      },
    });

    expect(wrapper.text()).toContain('Test Title');
  });

  it('displays subtitle when provided', () => {
    const wrapper = mount(TechnicalAccordionHeader, {
      global: globalConfig,
      props: {
        title: 'Test Title',
        subtitle: 'Test Subtitle',
      },
    });

    expect(wrapper.text()).toContain('Test Subtitle');
  });

  it('does not display subtitle when not provided', () => {
    const wrapper = mount(TechnicalAccordionHeader, {
      global: globalConfig,
      props: {
        title: 'Test Title',
      },
    });

    const subtitle = wrapper.find('.header-subtitle');
    expect(subtitle.exists()).toBe(false);
  });

  it('renders status indicator when status is provided', () => {
    const wrapper = mount(TechnicalAccordionHeader, {
      global: globalConfig,
      props: {
        title: 'Test Title',
        status: 'active',
      },
    });

    expect(wrapper.findComponent(AccordionStatusIndicator).exists()).toBe(true);
    expect(wrapper.findComponent(AccordionStatusIndicator).props('status')).toBe('active');
  });

  it('does not render status indicator when status is not provided', () => {
    const wrapper = mount(TechnicalAccordionHeader, {
      global: globalConfig,
      props: {
        title: 'Test Title',
      },
    });

    expect(wrapper.findComponent(AccordionStatusIndicator).exists()).toBe(false);
  });

  it('renders icon when provided', () => {
    const wrapper = mount(TechnicalAccordionHeader, {
      global: globalConfig,
      props: {
        title: 'Test Title',
        icon: PhCheckCircle,
      },
    });

    expect(wrapper.findComponent(AccordionIcon).exists()).toBe(true);
    expect(wrapper.findComponent(AccordionIcon).props('icon')).toStrictEqual(PhCheckCircle);
  });

  it('applies icon variant correctly', () => {
    const wrapper = mount(TechnicalAccordionHeader, {
      global: globalConfig,
      props: {
        title: 'Test Title',
        icon: PhCheckCircle,
        iconVariant: 'green',
      },
    });

    expect(wrapper.findComponent(AccordionIcon).props('variant')).toBe('green');
  });

  it('renders badge when provided', () => {
    const wrapper = mount(TechnicalAccordionHeader, {
      global: globalConfig,
      props: {
        title: 'Test Title',
        badge: 'NEW',
      },
    });

    expect(wrapper.findComponent(AccordionBadge).exists()).toBe(true);
    expect(wrapper.findComponent(AccordionBadge).props('text')).toBe('NEW');
  });

  it('applies badge severity correctly', () => {
    const wrapper = mount(TechnicalAccordionHeader, {
      global: globalConfig,
      props: {
        title: 'Test Title',
        badge: 'WARNING',
        badgeSeverity: 'warning',
      },
    });

    expect(wrapper.findComponent(AccordionBadge).props('severity')).toBe('warning');
  });

  it('does not render chevron element (removed from component)', () => {
    const wrapper = mount(TechnicalAccordionHeader, {
      global: globalConfig,
      props: {
        title: 'Test Title',
      },
    });

    const chevron = wrapper.find('.header-chevron');
    expect(chevron.exists()).toBe(false);
  });

  it('hideChevron prop is accepted but has no effect (chevron removed)', () => {
    const wrapper = mount(TechnicalAccordionHeader, {
      global: globalConfig,
      props: {
        title: 'Test Title',
        hideChevron: true,
      },
    });

    const chevron = wrapper.find('.header-chevron');
    expect(chevron.exists()).toBe(false);
  });

  it('applies default medium padding', () => {
    const wrapper = mount(TechnicalAccordionHeader, {
      global: globalConfig,
      props: {
        title: 'Test Title',
      },
    });

    const content = wrapper.find('.header-content');
    expect(content.attributes('style')).toContain('padding: 20px');
  });

  it('applies small padding', () => {
    const wrapper = mount(TechnicalAccordionHeader, {
      global: globalConfig,
      props: {
        title: 'Test Title',
        padding: 'sm',
      },
    });

    const content = wrapper.find('.header-content');
    expect(content.attributes('style')).toContain('padding: 12px');
  });

  it('applies large padding', () => {
    const wrapper = mount(TechnicalAccordionHeader, {
      global: globalConfig,
      props: {
        title: 'Test Title',
        padding: 'lg',
      },
    });

    const content = wrapper.find('.header-content');
    expect(content.attributes('style')).toContain('padding: 28px');
  });

  it('applies no padding when padding is none', () => {
    const wrapper = mount(TechnicalAccordionHeader, {
      global: globalConfig,
      props: {
        title: 'Test Title',
        padding: 'none',
      },
    });

    const content = wrapper.find('.header-content');
    expect(content.attributes('style')).toContain('padding: 0');
  });

  it('applies custom padding value when provided as string', () => {
    const wrapper = mount(TechnicalAccordionHeader, {
      global: globalConfig,
      props: {
        title: 'Test Title',
        padding: '16px 24px',
      },
    });

    const content = wrapper.find('.header-content');
    expect(content.attributes('style')).toContain('padding: 16px 24px');
  });

  it('removes actions padding-right when padding is none', () => {
    const wrapper = mount(TechnicalAccordionHeader, {
      global: globalConfig,
      props: {
        title: 'Test Title',
        padding: 'none',
      },
    });

    const actions = wrapper.find('.header-actions');
    expect(actions.attributes('style')).toContain('padding-right: 0');
  });

  it('removes actions padding-right when padding is 0', () => {
    const wrapper = mount(TechnicalAccordionHeader, {
      global: globalConfig,
      props: {
        title: 'Test Title',
        padding: '0',
      },
    });

    const actions = wrapper.find('.header-actions');
    expect(actions.attributes('style')).toContain('padding-right: 0');
  });

  it('keeps default actions padding-right when padding is not none', () => {
    const wrapper = mount(TechnicalAccordionHeader, {
      global: globalConfig,
      props: {
        title: 'Test Title',
        padding: 'md',
      },
    });

    const actions = wrapper.find('.header-actions');
    expect(actions.attributes('style')).toContain('padding-right: 8px');
  });

  it('renders prefix slot content', () => {
    const wrapper = mount(TechnicalAccordionHeader, {
      global: globalConfig,
      props: {
        title: 'Test Title',
      },
      slots: {
        prefix: '<div class="custom-prefix">Prefix</div>',
      },
    });

    expect(wrapper.html()).toContain('custom-prefix');
  });

  it('renders title slot content', () => {
    const wrapper = mount(TechnicalAccordionHeader, {
      global: globalConfig,
      props: {
        title: 'Default Title',
      },
      slots: {
        title: '<h3 class="custom-title">Custom Title</h3>',
      },
    });

    expect(wrapper.html()).toContain('custom-title');
    expect(wrapper.html()).toContain('Custom Title');
  });

  it('renders subtitle slot content', () => {
    const wrapper = mount(TechnicalAccordionHeader, {
      global: globalConfig,
      props: {
        title: 'Test Title',
      },
      slots: {
        subtitle: '<p class="custom-subtitle">Custom Subtitle</p>',
      },
    });

    expect(wrapper.html()).toContain('custom-subtitle');
  });

  it('renders suffix slot content', () => {
    const wrapper = mount(TechnicalAccordionHeader, {
      global: globalConfig,
      props: {
        title: 'Test Title',
      },
      slots: {
        suffix: '<div class="custom-suffix">Suffix</div>',
      },
    });

    expect(wrapper.html()).toContain('custom-suffix');
  });

  it('renders actions slot content', () => {
    const wrapper = mount(TechnicalAccordionHeader, {
      global: globalConfig,
      props: {
        title: 'Test Title',
      },
      slots: {
        actions: '<button class="custom-action">Action</button>',
      },
    });

    expect(wrapper.html()).toContain('custom-action');
  });
});
