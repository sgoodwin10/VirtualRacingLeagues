import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import VrlPointsCell from '../../cells/VrlPointsCell.vue';

describe('VrlPointsCell', () => {
  describe('Rendering', () => {
    it('renders points value', () => {
      const wrapper = mount(VrlPointsCell, {
        props: { value: 256 },
      });

      expect(wrapper.text()).toBe('256');
    });

    it('has points-cell class', () => {
      const wrapper = mount(VrlPointsCell, {
        props: { value: 100 },
      });

      expect(wrapper.find('.points-cell').exists()).toBe(true);
    });
  });

  describe('Different Values', () => {
    it('renders zero correctly', () => {
      const wrapper = mount(VrlPointsCell, {
        props: { value: 0 },
      });

      expect(wrapper.text()).toBe('0');
    });

    it('renders small values correctly', () => {
      const wrapper = mount(VrlPointsCell, {
        props: { value: 5 },
      });

      expect(wrapper.text()).toBe('5');
    });

    it('renders large values correctly', () => {
      const wrapper = mount(VrlPointsCell, {
        props: { value: 999 },
      });

      expect(wrapper.text()).toBe('999');
    });

    it('renders decimal values correctly', () => {
      const wrapper = mount(VrlPointsCell, {
        props: { value: 25.5 },
      });

      expect(wrapper.text()).toBe('25.5');
    });

    it('renders negative values correctly', () => {
      const wrapper = mount(VrlPointsCell, {
        props: { value: -10 },
      });

      expect(wrapper.text()).toBe('-10');
    });
  });

  describe('Structure', () => {
    it('renders as div element', () => {
      const wrapper = mount(VrlPointsCell, {
        props: { value: 100 },
      });

      expect(wrapper.element.tagName).toBe('DIV');
    });

    it('applies correct CSS classes', () => {
      const wrapper = mount(VrlPointsCell, {
        props: { value: 100 },
      });

      expect(wrapper.classes()).toContain('points-cell');
    });
  });
});
