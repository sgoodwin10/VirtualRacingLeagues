import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import MetricCard from '@app/components/common/cards/MetricCard.vue';
import { PhUser } from '@phosphor-icons/vue';

describe('MetricCard', () => {
  it('renders with required props', () => {
    const wrapper = mount(MetricCard, {
      props: {
        label: 'Drivers',
        value: 20,
      },
    });
    expect(wrapper.text()).toContain('Drivers');
    expect(wrapper.text()).toContain('20');
  });

  it('renders icon when provided', () => {
    const wrapper = mount(MetricCard, {
      props: {
        label: 'Drivers',
        value: 20,
        icon: PhUser,
      },
    });
    expect(wrapper.findComponent(PhUser).exists()).toBe(true);
  });

  it('renders change indicator when provided', () => {
    const wrapper = mount(MetricCard, {
      props: {
        label: 'Drivers',
        value: 20,
        change: '+2 active',
      },
    });
    expect(wrapper.text()).toContain('+2 active');
  });

  it('shows positive change icon', () => {
    const wrapper = mount(MetricCard, {
      props: {
        label: 'Drivers',
        value: 20,
        change: '+2 active',
        changeDirection: 'positive',
      },
    });
    expect(wrapper.find('.metric-change--positive').exists()).toBe(true);
  });

  it('shows negative change icon', () => {
    const wrapper = mount(MetricCard, {
      props: {
        label: 'Drivers',
        value: 20,
        change: '-2 inactive',
        changeDirection: 'negative',
      },
    });
    expect(wrapper.find('.metric-change--negative').exists()).toBe(true);
  });

  it('applies default variant class', () => {
    const wrapper = mount(MetricCard, {
      props: {
        label: 'Drivers',
        value: 20,
        variant: 'default',
      },
    });
    expect(wrapper.find('.metric-card--default').exists()).toBe(true);
  });

  it('applies all variant classes correctly', () => {
    const variants = ['default', 'green', 'orange', 'purple', 'red'] as const;

    variants.forEach((variant) => {
      const wrapper = mount(MetricCard, {
        props: {
          label: 'Test',
          value: 10,
          variant,
        },
      });
      expect(wrapper.find(`.metric-card--${variant}`).exists()).toBe(true);
    });
  });

  it('formats numeric values with locale', () => {
    const wrapper = mount(MetricCard, {
      props: {
        label: 'Points',
        value: 5420,
      },
    });
    expect(wrapper.text()).toContain('5,420');
  });

  it('displays string values as-is', () => {
    const wrapper = mount(MetricCard, {
      props: {
        label: 'Races',
        value: '14/22',
      },
    });
    expect(wrapper.text()).toContain('14/22');
  });

  it('applies custom classes', () => {
    const wrapper = mount(MetricCard, {
      props: {
        label: 'Test',
        value: 10,
        class: 'custom-class',
      },
    });
    expect(wrapper.find('.custom-class').exists()).toBe(true);
  });

  it('has accessible role and label', () => {
    const wrapper = mount(MetricCard, {
      props: {
        label: 'Drivers',
        value: 20,
      },
    });
    expect(wrapper.attributes('role')).toBe('region');
    expect(wrapper.attributes('aria-label')).toBe('Drivers: 20');
  });

  it('hides icons from screen readers', () => {
    const wrapper = mount(MetricCard, {
      props: {
        label: 'Drivers',
        value: 20,
        icon: PhUser,
        change: '+2',
        changeDirection: 'positive',
      },
    });
    const iconContainers = wrapper.findAll('[aria-hidden="true"]');
    expect(iconContainers.length).toBeGreaterThan(0);
  });

  it('renders label slot content', () => {
    const wrapper = mount(MetricCard, {
      props: {
        label: 'Drivers',
        value: 20,
      },
      slots: {
        label: '<span class="custom-label">Custom Label</span>',
      },
    });
    expect(wrapper.find('.custom-label').exists()).toBe(true);
  });

  it('renders value slot content', () => {
    const wrapper = mount(MetricCard, {
      props: {
        label: 'Drivers',
        value: 20,
      },
      slots: {
        value: '<span class="custom-value">100</span>',
      },
    });
    expect(wrapper.find('.custom-value').exists()).toBe(true);
  });

  it('renders change slot content', () => {
    const wrapper = mount(MetricCard, {
      props: {
        label: 'Drivers',
        value: 20,
      },
      slots: {
        change: '<span class="custom-change">+5</span>',
      },
    });
    expect(wrapper.find('.custom-change').exists()).toBe(true);
  });

  describe('full-content slot', () => {
    it('renders full-content slot when provided', () => {
      const wrapper = mount(MetricCard, {
        props: {
          label: 'Test',
          value: 20,
        },
        slots: {
          'full-content': '<div class="custom-full-content">Fully custom content</div>',
        },
      });
      expect(wrapper.find('.custom-full-content').exists()).toBe(true);
      expect(wrapper.text()).toContain('Fully custom content');
    });

    it('replaces all default content when full-content slot is used', () => {
      const wrapper = mount(MetricCard, {
        props: {
          label: 'Drivers',
          value: 20,
          change: '+2 active',
          icon: PhUser,
        },
        slots: {
          'full-content': '<div class="custom-content">Custom</div>',
        },
      });

      expect(wrapper.text()).not.toContain('Drivers');
      expect(wrapper.text()).not.toContain('20');
      expect(wrapper.text()).not.toContain('+2 active');
      expect(wrapper.find('.custom-content').exists()).toBe(true);
    });

    it('keeps accent bar when using full-content slot', () => {
      const wrapper = mount(MetricCard, {
        props: {
          label: 'Test',
          value: 20,
          variant: 'green',
        },
        slots: {
          'full-content': '<div>Custom</div>',
        },
      });

      expect(wrapper.find('.metric-card--green').exists()).toBe(true);
    });
  });

  describe('half-content slot', () => {
    it('renders half-content slot when provided', () => {
      const wrapper = mount(MetricCard, {
        props: {
          label: 'Season',
          value: 20,
        },
        slots: {
          'half-content': '<div class="custom-half-content">Custom bottom</div>',
        },
      });
      expect(wrapper.find('.custom-half-content').exists()).toBe(true);
      expect(wrapper.text()).toContain('Custom bottom');
    });

    it('keeps header when half-content slot is used', () => {
      const wrapper = mount(MetricCard, {
        props: {
          label: 'Drivers',
          value: 20,
          icon: PhUser,
        },
        slots: {
          'half-content': '<div class="custom-bottom">Custom</div>',
        },
      });

      expect(wrapper.text()).toContain('Drivers');
      expect(wrapper.findComponent(PhUser).exists()).toBe(true);
      expect(wrapper.find('.custom-bottom').exists()).toBe(true);
    });

    it('replaces value and change when half-content slot is used', () => {
      const wrapper = mount(MetricCard, {
        props: {
          label: 'Drivers',
          value: 20,
          change: '+2 active',
          changeDirection: 'positive',
        },
        slots: {
          'half-content': '<div class="custom-bottom">Progress bar here</div>',
        },
      });

      expect(wrapper.text()).not.toContain('20');
      expect(wrapper.text()).not.toContain('+2 active');
      expect(wrapper.text()).toContain('Progress bar here');
    });
  });

  describe('slot priority', () => {
    it('full-content slot takes priority over half-content', () => {
      const wrapper = mount(MetricCard, {
        props: {
          label: 'Test',
          value: 20,
        },
        slots: {
          'full-content': '<div class="full">Full content</div>',
          'half-content': '<div class="half">Half content</div>',
        },
      });

      expect(wrapper.find('.full').exists()).toBe(true);
      expect(wrapper.find('.half').exists()).toBe(false);
    });

    it('half-content slot takes priority over value and change slots', () => {
      const wrapper = mount(MetricCard, {
        props: {
          label: 'Test',
          value: 20,
        },
        slots: {
          'half-content': '<div class="half">Half</div>',
          value: '<span class="value">Value</span>',
          change: '<span class="change">Change</span>',
        },
      });

      expect(wrapper.find('.half').exists()).toBe(true);
      expect(wrapper.find('.value').exists()).toBe(false);
      expect(wrapper.find('.change').exists()).toBe(false);
    });
  });
});
