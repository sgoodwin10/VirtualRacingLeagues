import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import VrlPositionIndicator from '../VrlPositionIndicator.vue';

describe('VrlPositionIndicator', () => {
  describe('Rendering', () => {
    it('renders position number', () => {
      const wrapper = mount(VrlPositionIndicator, {
        props: { position: 5 },
      });

      expect(wrapper.text()).toBe('5');
    });

    it('applies base styling', () => {
      const wrapper = mount(VrlPositionIndicator, {
        props: { position: 5 },
      });

      expect(wrapper.classes()).toContain('inline-flex');
      expect(wrapper.classes()).toContain('items-center');
      expect(wrapper.classes()).toContain('justify-center');
    });

    it('renders as a span element', () => {
      const wrapper = mount(VrlPositionIndicator, {
        props: { position: 1 },
      });

      expect(wrapper.element.tagName).toBe('SPAN');
    });

    it('has correct dimensions', () => {
      const wrapper = mount(VrlPositionIndicator, {
        props: { position: 1 },
      });

      // Check that size classes are applied
      expect(wrapper.classes()).toContain('w-8');
      expect(wrapper.classes()).toContain('h-8');
    });
  });

  describe('Podium Positions', () => {
    it('renders position 1 with gold styling', () => {
      const wrapper = mount(VrlPositionIndicator, {
        props: { position: 1 },
      });

      expect(wrapper.text()).toBe('1');
      expect(wrapper.classes()).toContain('bg-[var(--yellow-dim)]');
      expect(wrapper.classes()).toContain('text-[var(--yellow)]');
    });

    it('renders position 2 with silver styling', () => {
      const wrapper = mount(VrlPositionIndicator, {
        props: { position: 2 },
      });

      expect(wrapper.text()).toBe('2');
      expect(wrapper.classes()).toContain('bg-[rgba(192,192,192,0.15)]');
      expect(wrapper.classes()).toContain('text-[#c0c0c0]');
    });

    it('renders position 3 with bronze styling', () => {
      const wrapper = mount(VrlPositionIndicator, {
        props: { position: 3 },
      });

      expect(wrapper.text()).toBe('3');
      expect(wrapper.classes()).toContain('bg-[rgba(205,127,50,0.15)]');
      expect(wrapper.classes()).toContain('text-[#cd7f32]');
    });
  });

  describe('Regular Positions', () => {
    it('renders position 4 with default styling', () => {
      const wrapper = mount(VrlPositionIndicator, {
        props: { position: 4 },
      });

      expect(wrapper.text()).toBe('4');
      expect(wrapper.classes()).toContain('bg-[var(--bg-elevated)]');
      expect(wrapper.classes()).toContain('text-[var(--text-primary)]');
    });

    it('renders position 10 with default styling', () => {
      const wrapper = mount(VrlPositionIndicator, {
        props: { position: 10 },
      });

      expect(wrapper.text()).toBe('10');
      expect(wrapper.classes()).toContain('bg-[var(--bg-elevated)]');
    });

    it('renders position 99 with default styling', () => {
      const wrapper = mount(VrlPositionIndicator, {
        props: { position: 99 },
      });

      expect(wrapper.text()).toBe('99');
    });

    it('renders position 100 with default styling', () => {
      const wrapper = mount(VrlPositionIndicator, {
        props: { position: 100 },
      });

      expect(wrapper.text()).toBe('100');
    });
  });

  describe('Typography', () => {
    it('applies Orbitron font family', () => {
      const wrapper = mount(VrlPositionIndicator, {
        props: { position: 1 },
      });

      // Font family is set via CSS variable, check that class is applied
      expect(wrapper.classes()).toContain('font-[var(--font-display)]');
    });

    it('renders text centered', () => {
      const wrapper = mount(VrlPositionIndicator, {
        props: { position: 1 },
      });

      // Check that the element has proper display class
      expect(wrapper.classes()).toContain('justify-center');
      expect(wrapper.classes()).toContain('items-center');
    });
  });

  describe('Edge Cases', () => {
    it('handles position 0', () => {
      const wrapper = mount(VrlPositionIndicator, {
        props: { position: 0 },
      });

      expect(wrapper.text()).toBe('0');
    });

    it('handles negative position', () => {
      const wrapper = mount(VrlPositionIndicator, {
        props: { position: -1 },
      });

      expect(wrapper.text()).toBe('-1');
    });

    it('handles decimal position', () => {
      const wrapper = mount(VrlPositionIndicator, {
        props: { position: 1.5 },
      });

      expect(wrapper.text()).toBe('1.5');
    });

    it('handles very large position numbers', () => {
      const wrapper = mount(VrlPositionIndicator, {
        props: { position: 999 },
      });

      expect(wrapper.text()).toBe('999');
    });

    it('multiple indicators can be rendered together', () => {
      const wrapper1 = mount(VrlPositionIndicator, {
        props: { position: 1 },
      });

      const wrapper2 = mount(VrlPositionIndicator, {
        props: { position: 2 },
      });

      const wrapper3 = mount(VrlPositionIndicator, {
        props: { position: 10 },
      });

      expect(wrapper1.exists()).toBe(true);
      expect(wrapper2.exists()).toBe(true);
      expect(wrapper3.exists()).toBe(true);
      expect(wrapper1.classes()).toContain('bg-[var(--yellow-dim)]');
      expect(wrapper2.classes()).toContain('bg-[rgba(192,192,192,0.15)]');
      expect(wrapper3.classes()).toContain('bg-[var(--bg-elevated)]');
    });
  });

  describe('Accessibility', () => {
    it('position number is readable by screen readers', () => {
      const wrapper = mount(VrlPositionIndicator, {
        props: { position: 5 },
      });

      expect(wrapper.text()).toBe('5');
    });

    it('has semantic structure', () => {
      const wrapper = mount(VrlPositionIndicator, {
        props: { position: 1 },
      });

      expect(wrapper.element.tagName).toBe('SPAN');
    });
  });

  describe('Snapshots', () => {
    it('matches snapshot for position 1 (gold)', () => {
      const wrapper = mount(VrlPositionIndicator, {
        props: { position: 1 },
      });
      expect(wrapper.html()).toMatchSnapshot();
    });

    it('matches snapshot for position 2 (silver)', () => {
      const wrapper = mount(VrlPositionIndicator, {
        props: { position: 2 },
      });
      expect(wrapper.html()).toMatchSnapshot();
    });

    it('matches snapshot for position 3 (bronze)', () => {
      const wrapper = mount(VrlPositionIndicator, {
        props: { position: 3 },
      });
      expect(wrapper.html()).toMatchSnapshot();
    });

    it('matches snapshot for position 4+ (default)', () => {
      const wrapper = mount(VrlPositionIndicator, {
        props: { position: 4 },
      });
      expect(wrapper.html()).toMatchSnapshot();
    });

    it('matches snapshot for large position number', () => {
      const wrapper = mount(VrlPositionIndicator, {
        props: { position: 99 },
      });
      expect(wrapper.html()).toMatchSnapshot();
    });
  });
});
