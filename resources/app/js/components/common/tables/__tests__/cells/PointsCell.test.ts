import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import PointsCell from '../../cells/PointsCell.vue';

describe('PointsCell', () => {
  it('renders points value with no decimals by default', () => {
    const wrapper = mount(PointsCell, {
      props: {
        value: 100,
      },
    });

    expect(wrapper.text()).toBe('100');
  });

  it('renders points value with specified decimals', () => {
    const wrapper = mount(PointsCell, {
      props: {
        value: 100.567,
        decimals: 2,
      },
    });

    expect(wrapper.text()).toBe('100.57');
  });

  it('renders placeholder for null value', () => {
    const wrapper = mount(PointsCell, {
      props: {
        value: null,
      },
    });

    expect(wrapper.text()).toBe('—');
  });

  it('renders placeholder for undefined value', () => {
    const wrapper = mount(PointsCell, {
      props: {
        value: undefined,
      },
    });

    expect(wrapper.text()).toBe('—');
  });

  it('renders custom placeholder when provided', () => {
    const wrapper = mount(PointsCell, {
      props: {
        value: null,
        placeholder: 'N/A',
      },
    });

    expect(wrapper.text()).toBe('N/A');
  });

  it('formats zero correctly', () => {
    const wrapper = mount(PointsCell, {
      props: {
        value: 0,
      },
    });

    expect(wrapper.text()).toBe('0');
  });

  it('formats decimal values correctly with 1 decimal place', () => {
    const wrapper = mount(PointsCell, {
      props: {
        value: 25.5,
        decimals: 1,
      },
    });

    expect(wrapper.text()).toBe('25.5');
  });

  it('rounds decimal values correctly', () => {
    const wrapper = mount(PointsCell, {
      props: {
        value: 100.999,
        decimals: 1,
      },
    });

    expect(wrapper.text()).toBe('101.0');
  });

  it('has correct CSS class', () => {
    const wrapper = mount(PointsCell, {
      props: {
        value: 100,
      },
    });

    // Component uses Tailwind classes instead of points-cell class
    expect(wrapper.find('.font-mono').exists()).toBe(true);
  });
});
