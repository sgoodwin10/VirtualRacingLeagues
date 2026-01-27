import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import AccordionBadge from './AccordionBadge.vue';

describe('AccordionBadge', () => {
  it('renders badge text', () => {
    const wrapper = mount(AccordionBadge, {
      props: {
        text: 'ACTIVE',
      },
    });

    expect(wrapper.text()).toBe('ACTIVE');
  });

  it('applies default muted severity', () => {
    const wrapper = mount(AccordionBadge, {
      props: {
        text: 'Default',
      },
    });

    const badge = wrapper.find('.accordion-badge');
    expect(badge.attributes('style')).toContain('color: #6e7681');
  });

  it('applies success severity styling', () => {
    const wrapper = mount(AccordionBadge, {
      props: {
        text: 'Success',
        severity: 'success',
      },
    });

    const badge = wrapper.find('.accordion-badge');
    expect(badge.attributes('style')).toContain('color: #7ee787');
    expect(badge.attributes('style')).toContain('background-color: #7ee78726');
  });

  it('applies info severity styling', () => {
    const wrapper = mount(AccordionBadge, {
      props: {
        text: 'Info',
        severity: 'info',
      },
    });

    const badge = wrapper.find('.accordion-badge');
    expect(badge.attributes('style')).toContain('color: #58a6ff');
  });

  it('applies warning severity styling', () => {
    const wrapper = mount(AccordionBadge, {
      props: {
        text: 'Warning',
        severity: 'warning',
      },
    });

    const badge = wrapper.find('.accordion-badge');
    expect(badge.attributes('style')).toContain('color: #f0883e');
  });

  it('applies danger severity styling', () => {
    const wrapper = mount(AccordionBadge, {
      props: {
        text: 'Danger',
        severity: 'danger',
      },
    });

    const badge = wrapper.find('.accordion-badge');
    expect(badge.attributes('style')).toContain('color: #f85149');
  });

  it('has correct CSS class', () => {
    const wrapper = mount(AccordionBadge, {
      props: {
        text: 'Test',
      },
    });

    expect(wrapper.find('.accordion-badge').exists()).toBe(true);
  });
});
