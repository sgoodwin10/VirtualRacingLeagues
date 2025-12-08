import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import VrlStatsCard from '../VrlStatsCard.vue';

describe('VrlStatsCard', () => {
  describe('Rendering', () => {
    it('renders with required props', () => {
      const wrapper = mount(VrlStatsCard, {
        props: {
          label: 'Total Races',
          value: 42,
        },
      });

      expect(wrapper.exists()).toBe(true);
      expect(wrapper.text()).toContain('42');
      expect(wrapper.text()).toContain('Total Races');
    });

    it('renders string value', () => {
      const wrapper = mount(VrlStatsCard, {
        props: {
          label: 'Active Users',
          value: '1,234',
        },
      });

      expect(wrapper.text()).toContain('1,234');
    });

    it('renders number value', () => {
      const wrapper = mount(VrlStatsCard, {
        props: {
          label: 'Events',
          value: 15,
        },
      });

      expect(wrapper.text()).toContain('15');
    });

    it('renders custom class', () => {
      const wrapper = mount(VrlStatsCard, {
        props: {
          label: 'Test',
          value: 10,
          class: 'custom-class',
        },
      });

      expect(wrapper.classes()).toContain('custom-class');
    });
  });

  describe('Icon Slot', () => {
    it('renders icon slot content', () => {
      const wrapper = mount(VrlStatsCard, {
        props: {
          label: 'Races',
          value: 10,
        },
        slots: {
          icon: '<span class="test-icon">Icon</span>',
        },
      });

      expect(wrapper.find('.test-icon').exists()).toBe(true);
    });

    it('renders default icon text when no slot provided', () => {
      const wrapper = mount(VrlStatsCard, {
        props: {
          icon: 'flag',
          label: 'Test',
          value: 5,
        },
      });

      expect(wrapper.text()).toContain('flag');
    });

    it('renders icon container with correct classes', () => {
      const wrapper = mount(VrlStatsCard, {
        props: {
          label: 'Test',
          value: 5,
        },
      });

      const iconContainer = wrapper.find('.bg-racing-gold\\/10');
      expect(iconContainer.exists()).toBe(true);
    });
  });

  describe('Label', () => {
    it('renders label text', () => {
      const wrapper = mount(VrlStatsCard, {
        props: {
          label: 'Total Championships',
          value: 3,
        },
      });

      expect(wrapper.text()).toContain('Total Championships');
    });

    it('applies correct label styling classes', () => {
      const wrapper = mount(VrlStatsCard, {
        props: {
          label: 'Test Label',
          value: 100,
        },
      });

      const label = wrapper.find('.font-data.text-\\[9px\\]');
      expect(label.exists()).toBe(true);
      expect(label.classes()).toContain('uppercase');
      expect(label.classes()).toContain('tracking-wider');
    });
  });

  describe('Value', () => {
    it('applies default text color when not highlighted', () => {
      const wrapper = mount(VrlStatsCard, {
        props: {
          label: 'Test',
          value: 50,
          highlighted: false,
        },
      });

      const valueElement = wrapper.find('.font-display.text-2xl');
      expect(valueElement.classes()).not.toContain('text-racing-gold');
    });

    it('applies gold color when highlighted', () => {
      const wrapper = mount(VrlStatsCard, {
        props: {
          label: 'Test',
          value: 50,
          highlighted: true,
        },
      });

      const valueElement = wrapper.find('.font-display.text-2xl');
      expect(valueElement.classes()).toContain('text-racing-gold');
    });

    it('applies correct value styling classes', () => {
      const wrapper = mount(VrlStatsCard, {
        props: {
          label: 'Test',
          value: 99,
        },
      });

      const valueElement = wrapper.find('.font-display.text-2xl');
      expect(valueElement.exists()).toBe(true);
      expect(valueElement.classes()).toContain('leading-none');
    });
  });

  describe('Highlighted Prop', () => {
    it('has default highlighted value of false', () => {
      const wrapper = mount(VrlStatsCard, {
        props: {
          label: 'Test',
          value: 10,
        },
      });

      const valueElement = wrapper.find('.font-display.text-2xl');
      expect(valueElement.classes()).not.toContain('text-racing-gold');
    });

    it('applies gold color when highlighted is true', () => {
      const wrapper = mount(VrlStatsCard, {
        props: {
          label: 'Featured Stat',
          value: 1000,
          highlighted: true,
        },
      });

      const valueElement = wrapper.find('.font-display.text-2xl');
      expect(valueElement.classes()).toContain('text-racing-gold');
    });

    it('does not apply gold color when highlighted is false', () => {
      const wrapper = mount(VrlStatsCard, {
        props: {
          label: 'Normal Stat',
          value: 500,
          highlighted: false,
        },
      });

      const valueElement = wrapper.find('.font-display.text-2xl');
      expect(valueElement.classes()).not.toContain('text-racing-gold');
    });
  });

  describe('Styling', () => {
    it('has gradient-border class', () => {
      const wrapper = mount(VrlStatsCard, {
        props: {
          label: 'Test',
          value: 10,
        },
      });

      expect(wrapper.classes()).toContain('gradient-border');
    });

    it('has card-racing class', () => {
      const wrapper = mount(VrlStatsCard, {
        props: {
          label: 'Test',
          value: 10,
        },
      });

      expect(wrapper.classes()).toContain('card-racing');
    });

    it('has rounded corners', () => {
      const wrapper = mount(VrlStatsCard, {
        props: {
          label: 'Test',
          value: 10,
        },
      });

      expect(wrapper.classes()).toContain('rounded');
    });

    it('has transition-all class', () => {
      const wrapper = mount(VrlStatsCard, {
        props: {
          label: 'Test',
          value: 10,
        },
      });

      expect(wrapper.classes()).toContain('transition-all');
    });

    it('has text-center class', () => {
      const wrapper = mount(VrlStatsCard, {
        props: {
          label: 'Test',
          value: 10,
        },
      });

      expect(wrapper.classes()).toContain('text-center');
    });
  });

  describe('Layout', () => {
    it('renders icon and value in flex container', () => {
      const wrapper = mount(VrlStatsCard, {
        props: {
          label: 'Test',
          value: 10,
        },
      });

      const flexContainer = wrapper.find('.flex.items-center.justify-center');
      expect(flexContainer.exists()).toBe(true);
    });

    it('renders icon container with correct classes', () => {
      const wrapper = mount(VrlStatsCard, {
        props: {
          label: 'Test',
          value: 10,
        },
      });

      const iconContainer = wrapper.find('.bg-racing-gold\\/10.rounded');
      expect(iconContainer.exists()).toBe(true);
      expect(iconContainer.classes()).toContain('flex');
      expect(iconContainer.classes()).toContain('items-center');
      expect(iconContainer.classes()).toContain('justify-center');
    });

    it('renders text content in left-aligned container', () => {
      const wrapper = mount(VrlStatsCard, {
        props: {
          label: 'Test',
          value: 10,
        },
      });

      const textContainer = wrapper.find('.text-left');
      expect(textContainer.exists()).toBe(true);
    });
  });
});
