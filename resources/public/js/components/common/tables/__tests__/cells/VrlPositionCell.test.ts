import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import VrlPositionCell from '../../cells/VrlPositionCell.vue';

describe('VrlPositionCell', () => {
  describe('Rendering', () => {
    it('renders position number', () => {
      const wrapper = mount(VrlPositionCell, {
        props: { position: 5 },
      });

      expect(wrapper.text()).toBe('5');
    });

    it('has position-indicator class', () => {
      const wrapper = mount(VrlPositionCell, {
        props: { position: 5 },
      });

      expect(wrapper.find('.position-indicator').exists()).toBe(true);
    });
  });

  describe('Podium Colors', () => {
    it('applies gold class for 1st place', () => {
      const wrapper = mount(VrlPositionCell, {
        props: { position: 1 },
      });

      expect(wrapper.find('.position-1').exists()).toBe(true);
    });

    it('applies silver class for 2nd place', () => {
      const wrapper = mount(VrlPositionCell, {
        props: { position: 2 },
      });

      expect(wrapper.find('.position-2').exists()).toBe(true);
    });

    it('applies bronze class for 3rd place', () => {
      const wrapper = mount(VrlPositionCell, {
        props: { position: 3 },
      });

      expect(wrapper.find('.position-3').exists()).toBe(true);
    });

    it('does not apply podium class for positions > 3', () => {
      const wrapper = mount(VrlPositionCell, {
        props: { position: 4 },
      });

      expect(wrapper.find('.position-1').exists()).toBe(false);
      expect(wrapper.find('.position-2').exists()).toBe(false);
      expect(wrapper.find('.position-3').exists()).toBe(false);
      expect(wrapper.find('.position-indicator').exists()).toBe(true);
    });
  });

  describe('CSS Classes', () => {
    it('applies correct classes for 1st', () => {
      const wrapper = mount(VrlPositionCell, {
        props: { position: 1 },
      });

      const classes = wrapper.classes();
      expect(classes).toContain('position-indicator');
      expect(classes).toContain('position-1');
    });

    it('applies correct classes for 2nd', () => {
      const wrapper = mount(VrlPositionCell, {
        props: { position: 2 },
      });

      const classes = wrapper.classes();
      expect(classes).toContain('position-indicator');
      expect(classes).toContain('position-2');
    });

    it('applies correct classes for 3rd', () => {
      const wrapper = mount(VrlPositionCell, {
        props: { position: 3 },
      });

      const classes = wrapper.classes();
      expect(classes).toContain('position-indicator');
      expect(classes).toContain('position-3');
    });

    it('applies correct classes for non-podium', () => {
      const wrapper = mount(VrlPositionCell, {
        props: { position: 10 },
      });

      const classes = wrapper.classes();
      expect(classes).toContain('position-indicator');
      expect(classes).not.toContain('position-1');
      expect(classes).not.toContain('position-2');
      expect(classes).not.toContain('position-3');
    });
  });

  describe('Different Positions', () => {
    it('renders position 1 correctly', () => {
      const wrapper = mount(VrlPositionCell, {
        props: { position: 1 },
      });

      expect(wrapper.text()).toBe('1');
      expect(wrapper.classes()).toContain('position-1');
    });

    it('renders position 10 correctly', () => {
      const wrapper = mount(VrlPositionCell, {
        props: { position: 10 },
      });

      expect(wrapper.text()).toBe('10');
    });

    it('renders position 99 correctly', () => {
      const wrapper = mount(VrlPositionCell, {
        props: { position: 99 },
      });

      expect(wrapper.text()).toBe('99');
    });
  });
});
