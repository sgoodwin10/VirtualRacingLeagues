import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import PositionIndicator from '../PositionIndicator.vue';

describe('PositionIndicator', () => {
  describe('Rendering', () => {
    it('renders with default props', () => {
      const wrapper = mount(PositionIndicator);

      expect(wrapper.find('.position-indicator').exists()).toBe(true);
      expect(wrapper.text()).toBe('1');
    });

    it('renders the position number', () => {
      const wrapper = mount(PositionIndicator, {
        props: {
          position: 5,
        },
      });

      expect(wrapper.text()).toBe('5');
    });

    it('renders double-digit positions correctly', () => {
      const wrapper = mount(PositionIndicator, {
        props: {
          position: 12,
        },
      });

      expect(wrapper.text()).toBe('12');
    });
  });

  describe('Position-based Styling', () => {
    describe('Position 1 (Gold)', () => {
      it('applies gold background color', () => {
        const wrapper = mount(PositionIndicator, {
          props: {
            position: 1,
          },
        });

        const element = wrapper.element as HTMLElement;
        expect(element.style.backgroundColor).toBe('#d29922');
      });

      it('applies dark text color for gold background', () => {
        const wrapper = mount(PositionIndicator, {
          props: {
            position: 1,
          },
        });

        const element = wrapper.element as HTMLElement;
        expect(element.style.color).toBe('#0d1117');
      });

      it('applies bold font weight (700)', () => {
        const wrapper = mount(PositionIndicator, {
          props: {
            position: 1,
          },
        });

        const element = wrapper.element as HTMLElement;
        expect(element.style.fontWeight).toBe('700');
      });
    });

    describe('Position 2 (Silver)', () => {
      it('applies silver background color', () => {
        const wrapper = mount(PositionIndicator, {
          props: {
            position: 2,
          },
        });

        const element = wrapper.element as HTMLElement;
        expect(element.style.backgroundColor).toBe('#c0c0c0');
      });

      it('applies dark text color for silver background', () => {
        const wrapper = mount(PositionIndicator, {
          props: {
            position: 2,
          },
        });

        const element = wrapper.element as HTMLElement;
        expect(element.style.color).toBe('#0d1117');
      });

      it('applies bold font weight (700)', () => {
        const wrapper = mount(PositionIndicator, {
          props: {
            position: 2,
          },
        });

        const element = wrapper.element as HTMLElement;
        expect(element.style.fontWeight).toBe('700');
      });
    });

    describe('Position 3 (Bronze)', () => {
      it('applies bronze background color', () => {
        const wrapper = mount(PositionIndicator, {
          props: {
            position: 3,
          },
        });

        const element = wrapper.element as HTMLElement;
        expect(element.style.backgroundColor).toBe('#cd7f32');
      });

      it('applies dark text color for bronze background', () => {
        const wrapper = mount(PositionIndicator, {
          props: {
            position: 3,
          },
        });

        const element = wrapper.element as HTMLElement;
        expect(element.style.color).toBe('#0d1117');
      });

      it('applies bold font weight (700)', () => {
        const wrapper = mount(PositionIndicator, {
          props: {
            position: 3,
          },
        });

        const element = wrapper.element as HTMLElement;
        expect(element.style.fontWeight).toBe('700');
      });
    });

    describe('Position 4+ (Default)', () => {
      it('applies default background color for position 4', () => {
        const wrapper = mount(PositionIndicator, {
          props: {
            position: 4,
          },
        });

        const element = wrapper.element as HTMLElement;
        expect(element.style.backgroundColor).toBe('var(--bg-elevated)');
      });

      it('applies default text color for position 4', () => {
        const wrapper = mount(PositionIndicator, {
          props: {
            position: 4,
          },
        });

        const element = wrapper.element as HTMLElement;
        expect(element.style.color).toBe('var(--text-secondary)');
      });

      it('applies regular font weight (600) for position 4', () => {
        const wrapper = mount(PositionIndicator, {
          props: {
            position: 4,
          },
        });

        const element = wrapper.element as HTMLElement;
        expect(element.style.fontWeight).toBe('600');
      });

      it('applies default styling for position 10', () => {
        const wrapper = mount(PositionIndicator, {
          props: {
            position: 10,
          },
        });

        const element = wrapper.element as HTMLElement;
        expect(element.style.backgroundColor).toBe('var(--bg-elevated)');
        expect(element.style.color).toBe('var(--text-secondary)');
        expect(element.style.fontWeight).toBe('600');
      });

      it('applies default styling for position 99', () => {
        const wrapper = mount(PositionIndicator, {
          props: {
            position: 99,
          },
        });

        const element = wrapper.element as HTMLElement;
        expect(element.style.backgroundColor).toBe('var(--bg-elevated)');
        expect(element.style.color).toBe('var(--text-secondary)');
        expect(element.style.fontWeight).toBe('600');
      });
    });
  });

  describe('Font Weight Prop', () => {
    it('applies bold font weight (700) for positions 1-3', () => {
      const positions = [1, 2, 3];

      positions.forEach((position) => {
        const wrapper = mount(PositionIndicator, {
          props: { position },
        });

        const element = wrapper.element as HTMLElement;
        expect(element.style.fontWeight).toBe('700');
      });
    });

    it('applies regular font weight (600) for positions 4+', () => {
      const positions = [4, 5, 10, 20];

      positions.forEach((position) => {
        const wrapper = mount(PositionIndicator, {
          props: { position },
        });

        const element = wrapper.element as HTMLElement;
        expect(element.style.fontWeight).toBe('600');
      });
    });
  });

  describe('Size Variants', () => {
    it('applies md size by default', () => {
      const wrapper = mount(PositionIndicator);

      expect(wrapper.classes()).toContain('min-w-[24px]');
      expect(wrapper.classes()).toContain('h-[24px]');
      expect(wrapper.classes()).toContain('text-[11px]');
      expect(wrapper.classes()).toContain('rounded');
    });

    it('applies sm size when specified', () => {
      const wrapper = mount(PositionIndicator, {
        props: {
          size: 'sm',
        },
      });

      expect(wrapper.classes()).toContain('min-w-[20px]');
      expect(wrapper.classes()).toContain('h-[20px]');
      expect(wrapper.classes()).toContain('text-[10px]');
      expect(wrapper.classes()).toContain('rounded-[3px]');
    });

    it('applies md size when explicitly specified', () => {
      const wrapper = mount(PositionIndicator, {
        props: {
          size: 'md',
        },
      });

      expect(wrapper.classes()).toContain('min-w-[24px]');
      expect(wrapper.classes()).toContain('h-[24px]');
      expect(wrapper.classes()).toContain('text-[11px]');
      expect(wrapper.classes()).toContain('rounded');
    });

    it('applies lg size when specified', () => {
      const wrapper = mount(PositionIndicator, {
        props: {
          size: 'lg',
        },
      });

      expect(wrapper.classes()).toContain('min-w-[28px]');
      expect(wrapper.classes()).toContain('h-[28px]');
      expect(wrapper.classes()).toContain('text-[12px]');
      expect(wrapper.classes()).toContain('rounded-md');
    });
  });

  describe('Combined Props', () => {
    it('renders position 1 with small size', () => {
      const wrapper = mount(PositionIndicator, {
        props: {
          position: 1,
          size: 'sm',
        },
      });

      expect(wrapper.text()).toBe('1');
      expect(wrapper.classes()).toContain('min-w-[20px]');
      expect(wrapper.classes()).toContain('h-[20px]');

      const element = wrapper.element as HTMLElement;
      expect(element.style.backgroundColor).toBe('#d29922');
      expect(element.style.fontWeight).toBe('700');
    });

    it('renders position 2 with large size', () => {
      const wrapper = mount(PositionIndicator, {
        props: {
          position: 2,
          size: 'lg',
        },
      });

      expect(wrapper.text()).toBe('2');
      expect(wrapper.classes()).toContain('min-w-[28px]');
      expect(wrapper.classes()).toContain('h-[28px]');

      const element = wrapper.element as HTMLElement;
      expect(element.style.backgroundColor).toBe('#c0c0c0');
      expect(element.style.fontWeight).toBe('700');
    });

    it('renders position 3 with medium size', () => {
      const wrapper = mount(PositionIndicator, {
        props: {
          position: 3,
          size: 'md',
        },
      });

      expect(wrapper.text()).toBe('3');
      expect(wrapper.classes()).toContain('min-w-[24px]');
      expect(wrapper.classes()).toContain('h-[24px]');

      const element = wrapper.element as HTMLElement;
      expect(element.style.backgroundColor).toBe('#cd7f32');
      expect(element.style.fontWeight).toBe('700');
    });

    it('renders position 10 with small size', () => {
      const wrapper = mount(PositionIndicator, {
        props: {
          position: 10,
          size: 'sm',
        },
      });

      expect(wrapper.text()).toBe('10');
      expect(wrapper.classes()).toContain('min-w-[20px]');
      expect(wrapper.classes()).toContain('h-[20px]');

      const element = wrapper.element as HTMLElement;
      expect(element.style.backgroundColor).toBe('var(--bg-elevated)');
      expect(element.style.fontWeight).toBe('600');
    });
  });

  describe('HTML Structure', () => {
    it('renders as a div element', () => {
      const wrapper = mount(PositionIndicator);

      expect(wrapper.element.tagName).toBe('DIV');
    });

    it('always includes position-indicator class', () => {
      const wrapper = mount(PositionIndicator, {
        props: {
          position: 5,
          size: 'lg',
        },
      });

      expect(wrapper.classes()).toContain('position-indicator');
    });
  });

  describe('Accessibility', () => {
    it('displays position number as text content', () => {
      const wrapper = mount(PositionIndicator, {
        props: {
          position: 7,
        },
      });

      expect(wrapper.text()).toBe('7');
    });

    it('renders readable content for screen readers', () => {
      const wrapper = mount(PositionIndicator, {
        props: {
          position: 1,
        },
      });

      expect(wrapper.text()).toContain('1');
      expect(wrapper.find('.position-indicator').exists()).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('handles position 0', () => {
      const wrapper = mount(PositionIndicator, {
        props: {
          position: 0,
        },
      });

      expect(wrapper.text()).toBe('0');

      const element = wrapper.element as HTMLElement;
      expect(element.style.backgroundColor).toBe('var(--bg-elevated)');
      // Position 0 is treated the same as positions 1-3 (bold) based on the component logic
      expect(element.style.fontWeight).toBe('700');
    });

    it('handles very large position numbers', () => {
      const wrapper = mount(PositionIndicator, {
        props: {
          position: 999,
        },
      });

      expect(wrapper.text()).toBe('999');

      const element = wrapper.element as HTMLElement;
      expect(element.style.backgroundColor).toBe('var(--bg-elevated)');
      expect(element.style.fontWeight).toBe('600');
    });
  });

  describe('All Size and Position Combinations', () => {
    const sizes = ['sm', 'md', 'lg'] as const;
    const positions = [1, 2, 3, 4, 10];

    sizes.forEach((size) => {
      positions.forEach((position) => {
        it(`renders position ${position} with ${size} size correctly`, () => {
          const wrapper = mount(PositionIndicator, {
            props: {
              position,
              size,
            },
          });

          expect(wrapper.text()).toBe(position.toString());
          expect(wrapper.find('.position-indicator').exists()).toBe(true);
        });
      });
    });
  });
});
