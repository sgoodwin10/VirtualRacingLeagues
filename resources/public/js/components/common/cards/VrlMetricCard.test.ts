import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import VrlMetricCard from './VrlMetricCard.vue';

// Mock icon component
const MockIcon = {
  name: 'MockIcon',
  template: '<svg class="mock-icon"><path /></svg>',
};

describe('VrlMetricCard', () => {
  it('renders with required props', () => {
    const wrapper = mount(VrlMetricCard, {
      props: {
        label: 'Active Drivers',
        value: '247',
      },
    });
    expect(wrapper.find('[data-test="metric-card"]').exists()).toBe(true);
    expect(wrapper.find('[data-test="metric-label"]').text()).toBe('Active Drivers');
    expect(wrapper.find('[data-test="metric-value"]').text()).toBe('247');
  });

  it('renders with number value', () => {
    const wrapper = mount(VrlMetricCard, {
      props: {
        label: 'Total Races',
        value: 1842,
      },
    });
    expect(wrapper.find('[data-test="metric-value"]').text()).toBe('1,842');
  });

  it('formats large numbers with locale', () => {
    const wrapper = mount(VrlMetricCard, {
      props: {
        label: 'Users',
        value: 1234567,
      },
    });
    expect(wrapper.find('[data-test="metric-value"]').text()).toBe('1,234,567');
  });

  it('applies default accent color (cyan)', () => {
    const wrapper = mount(VrlMetricCard, {
      props: {
        label: 'Metric',
        value: '100',
      },
    });
    const card = wrapper.find('[data-test="metric-card"]');
    expect(card.attributes('data-accent')).toBe('cyan');
  });

  it('applies green accent color', () => {
    const wrapper = mount(VrlMetricCard, {
      props: {
        label: 'Metric',
        value: '100',
        accentColor: 'green',
      },
    });
    const card = wrapper.find('[data-test="metric-card"]');
    expect(card.attributes('data-accent')).toBe('green');
  });

  it('applies orange accent color', () => {
    const wrapper = mount(VrlMetricCard, {
      props: {
        label: 'Metric',
        value: '100',
        accentColor: 'orange',
      },
    });
    const card = wrapper.find('[data-test="metric-card"]');
    expect(card.attributes('data-accent')).toBe('orange');
  });

  it('applies purple accent color', () => {
    const wrapper = mount(VrlMetricCard, {
      props: {
        label: 'Metric',
        value: '100',
        accentColor: 'purple',
      },
    });
    const card = wrapper.find('[data-test="metric-card"]');
    expect(card.attributes('data-accent')).toBe('purple');
  });

  it('applies text color class based on accent color', () => {
    const wrapper = mount(VrlMetricCard, {
      props: {
        label: 'Metric',
        value: '100',
        accentColor: 'green',
      },
    });
    const value = wrapper.find('[data-test="metric-value"]');
    expect(value.classes()).toContain('text-[var(--green)]');
  });

  it('renders change indicator', () => {
    const wrapper = mount(VrlMetricCard, {
      props: {
        label: 'Sales',
        value: '1000',
        change: '↑ 12% from last month',
      },
    });
    expect(wrapper.find('[data-test="metric-change"]').exists()).toBe(true);
    expect(wrapper.find('[data-test="metric-change"]').text()).toBe('↑ 12% from last month');
  });

  it('does not render change indicator when not provided', () => {
    const wrapper = mount(VrlMetricCard, {
      props: {
        label: 'Metric',
        value: '100',
      },
    });
    expect(wrapper.find('[data-test="metric-change"]').exists()).toBe(false);
  });

  it('applies positive change direction class', () => {
    const wrapper = mount(VrlMetricCard, {
      props: {
        label: 'Metric',
        value: '100',
        change: '↑ 10%',
        changeDirection: 'positive',
      },
    });
    const change = wrapper.find('[data-test="metric-change"]');
    expect(change.attributes('data-direction')).toBe('positive');
  });

  it('applies negative change direction class', () => {
    const wrapper = mount(VrlMetricCard, {
      props: {
        label: 'Metric',
        value: '100',
        change: '↓ 5%',
        changeDirection: 'negative',
      },
    });
    const change = wrapper.find('[data-test="metric-change"]');
    expect(change.attributes('data-direction')).toBe('negative');
  });

  it('applies neutral change direction class by default', () => {
    const wrapper = mount(VrlMetricCard, {
      props: {
        label: 'Metric',
        value: '100',
        change: 'No change',
      },
    });
    const change = wrapper.find('[data-test="metric-change"]');
    expect(change.attributes('data-direction')).toBe('neutral');
  });

  it('renders icon when provided', () => {
    const wrapper = mount(VrlMetricCard, {
      props: {
        label: 'Metric',
        value: '100',
        icon: MockIcon,
      },
    });
    expect(wrapper.find('[data-test="metric-icon"]').exists()).toBe(true);
    expect(wrapper.find('.mock-icon').exists()).toBe(true);
  });

  it('does not render icon container when icon not provided', () => {
    const wrapper = mount(VrlMetricCard, {
      props: {
        label: 'Metric',
        value: '100',
      },
    });
    expect(wrapper.find('[data-test="metric-icon"]').exists()).toBe(false);
  });

  it('renders label slot content', () => {
    const wrapper = mount(VrlMetricCard, {
      props: {
        label: 'Default Label',
        value: '100',
      },
      slots: {
        label: '<span class="custom-label">Custom Label</span>',
      },
    });
    expect(wrapper.find('.custom-label').exists()).toBe(true);
    expect(wrapper.html()).toContain('Custom Label');
    // Note: aria-label will still contain the prop value for accessibility
    expect(wrapper.find('[data-test="metric-label"]').text()).toBe('Custom Label');
  });

  it('renders value slot content', () => {
    const wrapper = mount(VrlMetricCard, {
      props: {
        label: 'Label',
        value: '100',
      },
      slots: {
        value: '<strong class="custom-value">999</strong>',
      },
    });
    expect(wrapper.find('.custom-value').exists()).toBe(true);
    expect(wrapper.html()).toContain('999');
    // Note: aria-label will still contain the prop value for accessibility
    expect(wrapper.find('[data-test="metric-value"]').text()).toBe('999');
  });

  it('renders icon slot content', () => {
    const wrapper = mount(VrlMetricCard, {
      props: {
        label: 'Label',
        value: '100',
      },
      slots: {
        icon: '<div class="custom-icon">⚡</div>',
      },
    });
    expect(wrapper.find('[data-test="metric-icon"]').exists()).toBe(true);
    expect(wrapper.find('.custom-icon').exists()).toBe(true);
  });

  it('renders change slot content', () => {
    const wrapper = mount(VrlMetricCard, {
      props: {
        label: 'Label',
        value: '100',
        change: 'Default change',
      },
      slots: {
        change: '<span class="custom-change">Custom change text</span>',
      },
    });
    expect(wrapper.find('.custom-change').exists()).toBe(true);
    expect(wrapper.html()).toContain('Custom change text');
    expect(wrapper.html()).not.toContain('Default change');
  });

  it('applies custom classes', () => {
    const wrapper = mount(VrlMetricCard, {
      props: {
        label: 'Label',
        value: '100',
        class: 'custom-metric-class',
      },
    });
    const card = wrapper.find('[data-test="metric-card"]');
    expect(card.classes()).toContain('custom-metric-class');
  });

  it('has correct accessibility attributes', () => {
    const wrapper = mount(VrlMetricCard, {
      props: {
        label: 'Active Users',
        value: '247',
      },
    });
    const card = wrapper.find('[data-test="metric-card"]');
    expect(card.attributes('role')).toBe('region');
    expect(card.attributes('aria-label')).toBe('Active Users: 247');
  });

  it('aria-label includes number value', () => {
    const wrapper = mount(VrlMetricCard, {
      props: {
        label: 'Total',
        value: 1234,
      },
    });
    const card = wrapper.find('[data-test="metric-card"]');
    expect(card.attributes('aria-label')).toBe('Total: 1234');
  });

  it('renders complete card with all features', () => {
    const wrapper = mount(VrlMetricCard, {
      props: {
        label: 'Active Drivers',
        value: 247,
        change: '↑ 12% from last month',
        icon: MockIcon,
        accentColor: 'green',
        changeDirection: 'positive',
        class: 'complete-card',
      },
    });
    expect(wrapper.find('[data-test="metric-card"]').exists()).toBe(true);
    expect(wrapper.find('[data-test="metric-card"][data-accent="green"]').exists()).toBe(true);
    expect(wrapper.find('[data-test="metric-label"]').exists()).toBe(true);
    expect(wrapper.find('[data-test="metric-value"]').exists()).toBe(true);
    expect(wrapper.find('[data-test="metric-icon"]').exists()).toBe(true);
    expect(wrapper.find('[data-test="metric-change"]').exists()).toBe(true);
    expect(wrapper.find('[data-test="metric-change"][data-direction="positive"]').exists()).toBe(
      true,
    );
    expect(wrapper.classes()).toContain('complete-card');
  });
});
