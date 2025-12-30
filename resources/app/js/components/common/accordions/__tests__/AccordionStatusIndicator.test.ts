import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import AccordionStatusIndicator from '../AccordionStatusIndicator.vue';

describe('AccordionStatusIndicator', () => {
  it('renders with default height', () => {
    const wrapper = mount(AccordionStatusIndicator, {
      props: {
        status: 'active',
      },
    });

    const indicator = wrapper.find('.status-indicator');
    expect(indicator.exists()).toBe(true);
    expect(indicator.attributes('style')).toContain('height: 40px');
  });

  it('renders with custom height', () => {
    const wrapper = mount(AccordionStatusIndicator, {
      props: {
        status: 'active',
        height: '60px',
      },
    });

    const indicator = wrapper.find('.status-indicator');
    expect(indicator.attributes('style')).toContain('height: 60px');
  });

  it('applies active status color with glow', () => {
    const wrapper = mount(AccordionStatusIndicator, {
      props: {
        status: 'active',
      },
    });

    const indicator = wrapper.find('.status-indicator');
    expect(indicator.attributes('style')).toContain('background-color: #7ee787');
    expect(indicator.attributes('style')).toContain('box-shadow: 0 0 8px #7ee787');
  });

  it('applies upcoming status color without glow', () => {
    const wrapper = mount(AccordionStatusIndicator, {
      props: {
        status: 'upcoming',
      },
    });

    const indicator = wrapper.find('.status-indicator');
    expect(indicator.attributes('style')).toContain('background-color: #58a6ff');
    expect(indicator.attributes('style')).not.toContain('box-shadow');
  });

  it('applies completed status color', () => {
    const wrapper = mount(AccordionStatusIndicator, {
      props: {
        status: 'completed',
      },
    });

    const indicator = wrapper.find('.status-indicator');
    expect(indicator.attributes('style')).toContain('background-color: #6e7681');
  });

  it('applies pending status color', () => {
    const wrapper = mount(AccordionStatusIndicator, {
      props: {
        status: 'pending',
      },
    });

    const indicator = wrapper.find('.status-indicator');
    expect(indicator.attributes('style')).toContain('background-color: #f0883e');
  });

  it('applies inactive status color', () => {
    const wrapper = mount(AccordionStatusIndicator, {
      props: {
        status: 'inactive',
      },
    });

    const indicator = wrapper.find('.status-indicator');
    expect(indicator.attributes('style')).toContain('background-color: #30363d');
  });

  it('has correct CSS classes for styling', () => {
    const wrapper = mount(AccordionStatusIndicator, {
      props: {
        status: 'active',
      },
    });

    const indicator = wrapper.find('.status-indicator');
    expect(indicator.classes()).toContain('status-indicator');
  });
});
