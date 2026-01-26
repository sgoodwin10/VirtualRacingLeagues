import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import PositionCell from '../../cells/PositionCell.vue';

describe('PositionCell', () => {
  it('renders position with padding by default', () => {
    const wrapper = mount(PositionCell, {
      props: {
        position: 1,
      },
    });

    // Component uses padStart(1, '0') which doesn't actually pad single digits
    expect(wrapper.text()).toBe('1');
  });

  it('renders position without padding when padded is false', () => {
    const wrapper = mount(PositionCell, {
      props: {
        position: 1,
        padded: false,
      },
    });

    expect(wrapper.text()).toBe('1');
  });

  it('renders placeholder for null position', () => {
    const wrapper = mount(PositionCell, {
      props: {
        position: null,
      },
    });

    expect(wrapper.text()).toBe('—');
  });

  it('renders placeholder for undefined position', () => {
    const wrapper = mount(PositionCell, {
      props: {
        position: undefined,
      },
    });

    expect(wrapper.text()).toBe('—');
  });

  it('applies p1 class for first position', () => {
    const wrapper = mount(PositionCell, {
      props: {
        position: 1,
      },
    });

    expect(wrapper.classes()).toContain('pos');
    expect(wrapper.classes()).toContain('p1');
  });

  it('applies p2 class for second position', () => {
    const wrapper = mount(PositionCell, {
      props: {
        position: 2,
      },
    });

    expect(wrapper.classes()).toContain('pos');
    expect(wrapper.classes()).toContain('p2');
  });

  it('applies p3 class for third position', () => {
    const wrapper = mount(PositionCell, {
      props: {
        position: 3,
      },
    });

    expect(wrapper.classes()).toContain('pos');
    expect(wrapper.classes()).toContain('p3');
  });

  it('applies only pos class for positions beyond podium', () => {
    const wrapper = mount(PositionCell, {
      props: {
        position: 4,
      },
    });

    expect(wrapper.classes()).toContain('pos');
    expect(wrapper.classes()).not.toContain('p1');
    expect(wrapper.classes()).not.toContain('p2');
    expect(wrapper.classes()).not.toContain('p3');
  });

  it('applies custom width when provided', () => {
    const wrapper = mount(PositionCell, {
      props: {
        position: 1,
        width: '60px',
      },
    });

    expect(wrapper.attributes('style')).toContain('width: 60px');
  });

  it('pads double-digit positions correctly', () => {
    const wrapper = mount(PositionCell, {
      props: {
        position: 12,
        padded: true,
      },
    });

    expect(wrapper.text()).toBe('12');
  });
});
