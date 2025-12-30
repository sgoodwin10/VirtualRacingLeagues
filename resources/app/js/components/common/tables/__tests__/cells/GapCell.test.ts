import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import GapCell from '../../cells/GapCell.vue';

describe('GapCell', () => {
  it('renders placeholder for leader (value 0)', () => {
    const wrapper = mount(GapCell, {
      props: {
        value: 0,
      },
    });

    expect(wrapper.text()).toBe('—');
  });

  it('renders placeholder for null value', () => {
    const wrapper = mount(GapCell, {
      props: {
        value: null,
      },
    });

    expect(wrapper.text()).toBe('—');
  });

  it('renders placeholder for undefined value', () => {
    const wrapper = mount(GapCell, {
      props: {
        value: undefined,
      },
    });

    expect(wrapper.text()).toBe('—');
  });

  it('renders custom leader placeholder when provided', () => {
    const wrapper = mount(GapCell, {
      props: {
        value: 0,
        leaderPlaceholder: 'LEADER',
      },
    });

    expect(wrapper.text()).toBe('LEADER');
  });

  it('renders positive gap without plus sign by default', () => {
    const wrapper = mount(GapCell, {
      props: {
        value: 25,
      },
    });

    expect(wrapper.text()).toBe('25');
  });

  it('renders positive gap with plus sign when showPlus is true', () => {
    const wrapper = mount(GapCell, {
      props: {
        value: 25,
        showPlus: true,
      },
    });

    expect(wrapper.text()).toBe('+25');
  });

  it('renders negative gap with minus sign', () => {
    const wrapper = mount(GapCell, {
      props: {
        value: -15,
      },
    });

    expect(wrapper.text()).toBe('-15');
  });

  it('formats gap with specified decimals', () => {
    const wrapper = mount(GapCell, {
      props: {
        value: 12.567,
        decimals: 2,
      },
    });

    expect(wrapper.text()).toBe('12.57');
  });

  it('formats negative gap with decimals correctly', () => {
    const wrapper = mount(GapCell, {
      props: {
        value: -8.345,
        decimals: 2,
      },
    });

    expect(wrapper.text()).toBe('-8.35');
  });

  it('applies positive class for positive values', () => {
    const wrapper = mount(GapCell, {
      props: {
        value: 25,
      },
    });

    expect(wrapper.classes()).toContain('gap-cell');
    expect(wrapper.classes()).toContain('positive');
  });

  it('applies negative class for negative values', () => {
    const wrapper = mount(GapCell, {
      props: {
        value: -15,
      },
    });

    expect(wrapper.classes()).toContain('gap-cell');
    expect(wrapper.classes()).toContain('negative');
  });

  it('does not apply positive or negative class for leader', () => {
    const wrapper = mount(GapCell, {
      props: {
        value: 0,
      },
    });

    expect(wrapper.classes()).toContain('gap-cell');
    expect(wrapper.classes()).not.toContain('positive');
    expect(wrapper.classes()).not.toContain('negative');
  });

  it('rounds values correctly', () => {
    const wrapper = mount(GapCell, {
      props: {
        value: 25.999,
        decimals: 1,
      },
    });

    expect(wrapper.text()).toBe('26.0');
  });
});
