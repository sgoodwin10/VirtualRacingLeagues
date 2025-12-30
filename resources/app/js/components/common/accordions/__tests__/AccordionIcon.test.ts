import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import { PhCheckCircle } from '@phosphor-icons/vue';
import AccordionIcon from '../AccordionIcon.vue';

describe('AccordionIcon', () => {
  it('renders the provided icon component', () => {
    const wrapper = mount(AccordionIcon, {
      props: {
        icon: PhCheckCircle,
      },
    });

    expect(wrapper.findComponent(PhCheckCircle).exists()).toBe(true);
  });

  it('applies default cyan variant', () => {
    const wrapper = mount(AccordionIcon, {
      props: {
        icon: PhCheckCircle,
      },
    });

    const container = wrapper.find('.accordion-icon-container');
    expect(container.attributes('style')).toContain('background-color: #58a6ff26');
  });

  it('applies green variant', () => {
    const wrapper = mount(AccordionIcon, {
      props: {
        icon: PhCheckCircle,
        variant: 'green',
      },
    });

    const container = wrapper.find('.accordion-icon-container');
    expect(container.attributes('style')).toContain('background-color: #7ee78726');
  });

  it('applies orange variant', () => {
    const wrapper = mount(AccordionIcon, {
      props: {
        icon: PhCheckCircle,
        variant: 'orange',
      },
    });

    const container = wrapper.find('.accordion-icon-container');
    expect(container.attributes('style')).toContain('background-color: #f0883e26');
  });

  it('applies purple variant', () => {
    const wrapper = mount(AccordionIcon, {
      props: {
        icon: PhCheckCircle,
        variant: 'purple',
      },
    });

    const container = wrapper.find('.accordion-icon-container');
    expect(container.attributes('style')).toContain('background-color: #bc8cff26');
  });

  it('applies red variant', () => {
    const wrapper = mount(AccordionIcon, {
      props: {
        icon: PhCheckCircle,
        variant: 'red',
      },
    });

    const container = wrapper.find('.accordion-icon-container');
    expect(container.attributes('style')).toContain('background-color: #f8514926');
  });

  it('applies default medium size', () => {
    const wrapper = mount(AccordionIcon, {
      props: {
        icon: PhCheckCircle,
      },
    });

    const container = wrapper.find('.accordion-icon-container');
    expect(container.attributes('style')).toContain('width: 32px');
    expect(container.attributes('style')).toContain('height: 32px');
  });

  it('applies small size', () => {
    const wrapper = mount(AccordionIcon, {
      props: {
        icon: PhCheckCircle,
        size: 'sm',
      },
    });

    const container = wrapper.find('.accordion-icon-container');
    expect(container.attributes('style')).toContain('width: 24px');
    expect(container.attributes('style')).toContain('height: 24px');
  });

  it('applies large size', () => {
    const wrapper = mount(AccordionIcon, {
      props: {
        icon: PhCheckCircle,
        size: 'lg',
      },
    });

    const container = wrapper.find('.accordion-icon-container');
    expect(container.attributes('style')).toContain('width: 40px');
    expect(container.attributes('style')).toContain('height: 40px');
  });

  it('has correct CSS class', () => {
    const wrapper = mount(AccordionIcon, {
      props: {
        icon: PhCheckCircle,
      },
    });

    expect(wrapper.find('.accordion-icon-container').exists()).toBe(true);
  });
});
