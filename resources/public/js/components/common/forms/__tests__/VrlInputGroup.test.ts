import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import VrlInputGroup from '../VrlInputGroup.vue';

describe('VrlInputGroup', () => {
  describe('Rendering', () => {
    it('renders with default props', () => {
      const wrapper = mount(VrlInputGroup, {
        slots: {
          default: '<div>Child 1</div><div>Child 2</div>',
        },
      });
      expect(wrapper.find('.input-group').exists()).toBe(true);
    });

    it('renders slot content', () => {
      const wrapper = mount(VrlInputGroup, {
        slots: {
          default: '<div class="test-child">Child Content</div>',
        },
      });
      expect(wrapper.find('.test-child').exists()).toBe(true);
      expect(wrapper.text()).toContain('Child Content');
    });

    it('renders multiple slot children', () => {
      const wrapper = mount(VrlInputGroup, {
        slots: {
          default: `
            <div class="child-1">Child 1</div>
            <div class="child-2">Child 2</div>
            <div class="child-3">Child 3</div>
          `,
        },
      });
      expect(wrapper.find('.child-1').exists()).toBe(true);
      expect(wrapper.find('.child-2').exists()).toBe(true);
      expect(wrapper.find('.child-3').exists()).toBe(true);
    });

    it('renders with custom class', () => {
      const wrapper = mount(VrlInputGroup, {
        props: {
          class: 'custom-class',
        },
      });
      expect(wrapper.find('.custom-class').exists()).toBe(true);
    });
  });

  describe('Grid Layout - Columns', () => {
    it('applies 2 columns class by default', () => {
      const wrapper = mount(VrlInputGroup);
      expect(wrapper.find('.input-group').classes()).toContain('columns-2');
    });

    it('applies 2 columns class explicitly', () => {
      const wrapper = mount(VrlInputGroup, {
        props: {
          columns: 2,
        },
      });
      expect(wrapper.find('.input-group').classes()).toContain('columns-2');
    });

    it('applies 3 columns class', () => {
      const wrapper = mount(VrlInputGroup, {
        props: {
          columns: 3,
        },
      });
      expect(wrapper.find('.input-group').classes()).toContain('columns-3');
    });

    it('applies 4 columns class', () => {
      const wrapper = mount(VrlInputGroup, {
        props: {
          columns: 4,
        },
      });
      expect(wrapper.find('.input-group').classes()).toContain('columns-4');
    });

    it('changes column class when prop changes', async () => {
      const wrapper = mount(VrlInputGroup, {
        props: {
          columns: 2,
        },
      });

      expect(wrapper.find('.input-group').classes()).toContain('columns-2');

      await wrapper.setProps({ columns: 3 });
      expect(wrapper.find('.input-group').classes()).toContain('columns-3');
      expect(wrapper.find('.input-group').classes()).not.toContain('columns-2');

      await wrapper.setProps({ columns: 4 });
      expect(wrapper.find('.input-group').classes()).toContain('columns-4');
      expect(wrapper.find('.input-group').classes()).not.toContain('columns-3');
    });
  });

  describe('Grid Layout - Gap', () => {
    it('does not apply inline style when using default gap', () => {
      const wrapper = mount(VrlInputGroup);
      expect(wrapper.find('.input-group').attributes('style')).toBeUndefined();
    });

    it('applies custom gap as inline style', () => {
      const wrapper = mount(VrlInputGroup, {
        props: {
          gap: '2rem',
        },
      });
      const style = wrapper.find('.input-group').attributes('style');
      expect(style).toBeDefined();
      expect(style).toContain('gap: 2rem');
    });

    it('applies different gap values', () => {
      const gapValues = ['0.5rem', '1.5rem', '24px', '2em'];

      gapValues.forEach((gap) => {
        const wrapper = mount(VrlInputGroup, {
          props: {
            gap,
          },
        });
        const style = wrapper.find('.input-group').attributes('style');
        expect(style).toContain(`gap: ${gap}`);
      });
    });

    it('updates gap when prop changes', async () => {
      const wrapper = mount(VrlInputGroup, {
        props: {
          gap: '1rem',
        },
      });

      // Default gap should not apply inline style
      expect(wrapper.find('.input-group').attributes('style')).toBeUndefined();

      await wrapper.setProps({ gap: '2rem' });
      expect(wrapper.find('.input-group').attributes('style')).toContain('gap: 2rem');

      await wrapper.setProps({ gap: '1rem' });
      expect(wrapper.find('.input-group').attributes('style')).toBeUndefined();
    });
  });

  describe('Responsive Behavior', () => {
    it('has responsive classes defined via CSS', () => {
      const wrapper = mount(VrlInputGroup, {
        props: {
          columns: 3,
        },
      });

      // The responsive behavior is handled by CSS (@media queries)
      // We verify the correct classes are applied
      expect(wrapper.find('.input-group').classes()).toContain('columns-3');
    });

    it('maintains column class across all breakpoints', () => {
      // CSS media queries handle responsive stacking
      // Component should maintain its column class
      const wrapper = mount(VrlInputGroup, {
        props: {
          columns: 4,
        },
      });

      expect(wrapper.find('.input-group').classes()).toContain('columns-4');
    });
  });

  describe('Composition', () => {
    it('works with multiple child components', () => {
      const wrapper = mount(VrlInputGroup, {
        slots: {
          default: `
            <div class="input-1">Input 1</div>
            <div class="input-2">Input 2</div>
            <div class="input-3">Input 3</div>
            <div class="input-4">Input 4</div>
          `,
        },
        props: {
          columns: 4,
        },
      });

      // Find all child divs with input- class, excluding the wrapper
      const children = wrapper.findAll('.input-group > [class^="input-"]');
      expect(children.length).toBeGreaterThanOrEqual(4);
    });

    it('preserves child component props and structure', () => {
      const wrapper = mount(VrlInputGroup, {
        slots: {
          default: `
            <div class="test-input" data-testid="child-input">
              <label>Test Label</label>
              <input type="text" />
            </div>
          `,
        },
      });

      const child = wrapper.find('[data-testid="child-input"]');
      expect(child.exists()).toBe(true);
      expect(child.find('label').text()).toBe('Test Label');
      expect(child.find('input').exists()).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('renders with no children', () => {
      const wrapper = mount(VrlInputGroup);
      expect(wrapper.find('.input-group').exists()).toBe(true);
      expect(wrapper.text()).toBe('');
    });

    it('handles single child', () => {
      const wrapper = mount(VrlInputGroup, {
        slots: {
          default: '<div>Single Child</div>',
        },
        props: {
          columns: 3,
        },
      });

      expect(wrapper.find('.input-group').exists()).toBe(true);
      expect(wrapper.text()).toBe('Single Child');
    });

    it('combines custom class with column class', () => {
      const wrapper = mount(VrlInputGroup, {
        props: {
          columns: 3,
          class: 'my-custom-class another-class',
        },
      });

      const classes = wrapper.find('.input-group').classes();
      expect(classes).toContain('columns-3');
      expect(classes).toContain('my-custom-class');
      expect(classes).toContain('another-class');
    });

    it('handles prop changes without losing slot content', async () => {
      const wrapper = mount(VrlInputGroup, {
        slots: {
          default: '<div class="persistent-child">Persistent Content</div>',
        },
        props: {
          columns: 2,
          gap: '1rem',
        },
      });

      expect(wrapper.find('.persistent-child').exists()).toBe(true);

      await wrapper.setProps({ columns: 3 });
      expect(wrapper.find('.persistent-child').exists()).toBe(true);

      await wrapper.setProps({ gap: '2rem' });
      expect(wrapper.find('.persistent-child').exists()).toBe(true);
    });

    it('maintains grid structure with dynamic children', () => {
      const wrapper = mount(VrlInputGroup, {
        slots: {
          default: `
            <div v-for="i in 6" :key="i" class="dynamic-item">Item {{ i }}</div>
          `,
        },
        props: {
          columns: 3,
        },
      });

      expect(wrapper.find('.input-group').exists()).toBe(true);
      expect(wrapper.find('.input-group').classes()).toContain('columns-3');
    });
  });

  describe('Accessibility', () => {
    it('has no implicit accessibility issues', () => {
      const wrapper = mount(VrlInputGroup, {
        slots: {
          default: '<div>Content</div>',
        },
      });

      // Input group is a simple container div with no interactive elements
      expect(wrapper.find('.input-group').element.tagName).toBe('DIV');
    });

    it('preserves child accessibility attributes', () => {
      const wrapper = mount(VrlInputGroup, {
        slots: {
          default: `
            <div role="group" aria-label="Test Group">
              <input aria-required="true" />
            </div>
          `,
        },
      });

      expect(wrapper.find('[role="group"]').exists()).toBe(true);
      expect(wrapper.find('[aria-label="Test Group"]').exists()).toBe(true);
      expect(wrapper.find('[aria-required="true"]').exists()).toBe(true);
    });
  });

  describe('TypeScript Type Safety', () => {
    it('accepts valid column values', () => {
      // These should compile without TypeScript errors
      const validColumns: (2 | 3 | 4)[] = [2, 3, 4];

      validColumns.forEach((columns) => {
        const wrapper = mount(VrlInputGroup, {
          props: {
            columns,
          },
        });
        expect(wrapper.find('.input-group').classes()).toContain(`columns-${columns}`);
      });
    });

    it('accepts string gap values', () => {
      const validGaps = ['1rem', '16px', '1em', '2rem'];

      validGaps.forEach((gap) => {
        const wrapper = mount(VrlInputGroup, {
          props: {
            gap,
          },
        });

        if (gap !== '1rem') {
          expect(wrapper.find('.input-group').attributes('style')).toContain(`gap: ${gap}`);
        }
      });
    });
  });
});
