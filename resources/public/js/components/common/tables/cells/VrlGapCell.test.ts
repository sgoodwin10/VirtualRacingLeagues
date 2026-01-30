import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import VrlGapCell from './../cells/VrlGapCell.vue';

describe('VrlGapCell', () => {
  describe('Rendering', () => {
    it('renders gap value', () => {
      const wrapper = mount(VrlGapCell, {
        props: { value: -13 },
      });

      expect(wrapper.text()).toBe('-13');
    });

    it('has gap-cell class', () => {
      const wrapper = mount(VrlGapCell, {
        props: { value: -5 },
      });

      expect(wrapper.find('[data-test="gap-cell"]').exists()).toBe(true);
    });
  });

  describe('Leader Indicator', () => {
    it('shows "—" for null value (leader)', () => {
      const wrapper = mount(VrlGapCell, {
        props: { value: null },
      });

      expect(wrapper.text()).toBe('—');
    });

    it('shows "—" for zero value (leader)', () => {
      const wrapper = mount(VrlGapCell, {
        props: { value: 0 },
      });

      expect(wrapper.text()).toBe('—');
    });

    it('shows "—" for string "0" (leader)', () => {
      const wrapper = mount(VrlGapCell, {
        props: { value: '0' },
      });

      expect(wrapper.text()).toBe('—');
    });
  });

  describe('Gap Formatting', () => {
    it('formats negative gap correctly (already negative)', () => {
      const wrapper = mount(VrlGapCell, {
        props: { value: -13 },
      });

      expect(wrapper.text()).toBe('-13');
    });

    it('formats positive gap with minus sign', () => {
      const wrapper = mount(VrlGapCell, {
        props: { value: 13 },
      });

      expect(wrapper.text()).toBe('-13');
    });

    it('handles string values', () => {
      const wrapper = mount(VrlGapCell, {
        props: { value: '25' },
      });

      expect(wrapper.text()).toBe('-25');
    });

    it('handles negative string values', () => {
      const wrapper = mount(VrlGapCell, {
        props: { value: '-25' },
      });

      expect(wrapper.text()).toBe('-25');
    });

    it('handles decimal values', () => {
      const wrapper = mount(VrlGapCell, {
        props: { value: 5.5 },
      });

      expect(wrapper.text()).toBe('-5.5');
    });
  });

  describe('Formatted Gap', () => {
    it('formats gap correctly for leader', () => {
      const wrapper = mount(VrlGapCell, {
        props: { value: null },
      });

      expect(wrapper.text()).toBe('—');
    });

    it('formats gap correctly for non-leader', () => {
      const wrapper = mount(VrlGapCell, {
        props: { value: 10 },
      });

      expect(wrapper.text()).toBe('-10');
    });

    it('formats gap correctly for negative value', () => {
      const wrapper = mount(VrlGapCell, {
        props: { value: -10 },
      });

      expect(wrapper.text()).toBe('-10');
    });
  });

  describe('Edge Cases', () => {
    it('handles very small gaps', () => {
      const wrapper = mount(VrlGapCell, {
        props: { value: 0.1 },
      });

      expect(wrapper.text()).toBe('-0.1');
    });

    it('handles very large gaps', () => {
      const wrapper = mount(VrlGapCell, {
        props: { value: 999 },
      });

      expect(wrapper.text()).toBe('-999');
    });
  });

  describe('Structure', () => {
    it('renders as div element', () => {
      const wrapper = mount(VrlGapCell, {
        props: { value: -5 },
      });

      expect(wrapper.element.tagName).toBe('DIV');
    });

    it('applies correct CSS classes', () => {
      const wrapper = mount(VrlGapCell, {
        props: { value: -5 },
      });

      expect(wrapper.find('[data-test="gap-cell"]').exists()).toBe(true);
      expect(wrapper.classes()).toContain('font-[family-name:var(--font-display)]');
    });
  });
});
