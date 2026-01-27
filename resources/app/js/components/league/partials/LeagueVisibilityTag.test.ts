import { describe, it, expect, vi } from 'vitest';
import { mount, VueWrapper } from '@vue/test-utils';
import LeagueVisibilityTag from './LeagueVisibilityTag.vue';

// Mock PrimeVue Tag component
vi.mock('primevue/tag', () => ({
  default: {
    name: 'Tag',
    template: '<span :class="`tag-${severity}`" :data-icon="icon">{{ value }}</span>',
    props: ['value', 'severity', 'icon', 'class'],
  },
}));

describe('LeagueVisibilityTag', () => {
  let wrapper: VueWrapper;

  describe('Visibility Value Display', () => {
    it('should display PUBLIC in uppercase for public visibility', () => {
      wrapper = mount(LeagueVisibilityTag, {
        props: {
          visibility: 'public',
        },
      });

      expect(wrapper.text()).toContain('PUBLIC');
    });

    it('should display PRIVATE in uppercase for private visibility', () => {
      wrapper = mount(LeagueVisibilityTag, {
        props: {
          visibility: 'private',
        },
      });

      expect(wrapper.text()).toContain('PRIVATE');
    });

    it('should display UNLISTED in uppercase for unlisted visibility', () => {
      wrapper = mount(LeagueVisibilityTag, {
        props: {
          visibility: 'unlisted',
        },
      });

      expect(wrapper.text()).toContain('UNLISTED');
    });
  });

  describe('Severity Mapping', () => {
    it('should apply success severity for public visibility', () => {
      wrapper = mount(LeagueVisibilityTag, {
        props: {
          visibility: 'public',
        },
      });

      const tag = wrapper.findComponent({ name: 'Tag' });
      expect(tag.props('severity')).toBe('success');
    });

    it('should apply warning severity for private visibility', () => {
      wrapper = mount(LeagueVisibilityTag, {
        props: {
          visibility: 'private',
        },
      });

      const tag = wrapper.findComponent({ name: 'Tag' });
      expect(tag.props('severity')).toBe('warning');
    });

    it('should apply info severity for unlisted visibility', () => {
      wrapper = mount(LeagueVisibilityTag, {
        props: {
          visibility: 'unlisted',
        },
      });

      const tag = wrapper.findComponent({ name: 'Tag' });
      expect(tag.props('severity')).toBe('info');
    });
  });

  describe('Icon Prop', () => {
    it('should use default icon "pi pi-eye" when no icon prop is provided', () => {
      wrapper = mount(LeagueVisibilityTag, {
        props: {
          visibility: 'public',
        },
      });

      const tag = wrapper.findComponent({ name: 'Tag' });
      expect(tag.props('icon')).toBe('pi pi-eye');
    });

    it('should use custom icon when icon prop is provided', () => {
      wrapper = mount(LeagueVisibilityTag, {
        props: {
          visibility: 'private',
          icon: 'pi pi-lock',
        },
      });

      const tag = wrapper.findComponent({ name: 'Tag' });
      expect(tag.props('icon')).toBe('pi pi-lock');
    });

    it('should accept different icon formats', () => {
      const testIcons = ['pi pi-globe', 'pi pi-shield', 'custom-icon'];

      testIcons.forEach((icon) => {
        wrapper = mount(LeagueVisibilityTag, {
          props: {
            visibility: 'public',
            icon,
          },
        });

        const tag = wrapper.findComponent({ name: 'Tag' });
        expect(tag.props('icon')).toBe(icon);
      });
    });
  });

  describe('Class Attributes', () => {
    it('should apply text-xs uppercase border classes to Tag', () => {
      wrapper = mount(LeagueVisibilityTag, {
        props: {
          visibility: 'public',
        },
      });

      const tag = wrapper.findComponent({ name: 'Tag' });
      expect(tag.props('class')).toBe('text-xs uppercase border');
    });

    it('should apply classes consistently across all visibility types', () => {
      const visibilities: Array<'public' | 'private' | 'unlisted'> = [
        'public',
        'private',
        'unlisted',
      ];

      visibilities.forEach((visibility) => {
        wrapper = mount(LeagueVisibilityTag, {
          props: {
            visibility,
          },
        });

        const tag = wrapper.findComponent({ name: 'Tag' });
        expect(tag.props('class')).toBe('text-xs uppercase border');
      });
    });
  });

  describe('Integration Tests', () => {
    it('should render complete component with all props correctly', () => {
      wrapper = mount(LeagueVisibilityTag, {
        props: {
          visibility: 'public',
          icon: 'pi pi-globe',
        },
      });

      const tag = wrapper.findComponent({ name: 'Tag' });

      // Check all props are correctly passed
      expect(tag.props('value')).toBe('PUBLIC');
      expect(tag.props('severity')).toBe('success');
      expect(tag.props('icon')).toBe('pi pi-globe');
      expect(tag.props('class')).toBe('text-xs uppercase border');
    });

    it('should maintain reactivity when props change', async () => {
      wrapper = mount(LeagueVisibilityTag, {
        props: {
          visibility: 'public',
        },
      });

      let tag = wrapper.findComponent({ name: 'Tag' });
      expect(tag.props('severity')).toBe('success');
      expect(tag.props('value')).toBe('PUBLIC');

      // Change visibility prop
      await wrapper.setProps({ visibility: 'private' });

      tag = wrapper.findComponent({ name: 'Tag' });
      expect(tag.props('severity')).toBe('warning');
      expect(tag.props('value')).toBe('PRIVATE');

      // Change visibility to unlisted
      await wrapper.setProps({ visibility: 'unlisted' });

      tag = wrapper.findComponent({ name: 'Tag' });
      expect(tag.props('severity')).toBe('info');
      expect(tag.props('value')).toBe('UNLISTED');
    });

    it('should maintain icon reactivity when icon prop changes', async () => {
      wrapper = mount(LeagueVisibilityTag, {
        props: {
          visibility: 'public',
          icon: 'pi pi-eye',
        },
      });

      let tag = wrapper.findComponent({ name: 'Tag' });
      expect(tag.props('icon')).toBe('pi pi-eye');

      // Change icon prop
      await wrapper.setProps({ icon: 'pi pi-lock' });

      tag = wrapper.findComponent({ name: 'Tag' });
      expect(tag.props('icon')).toBe('pi pi-lock');
    });
  });

  describe('Edge Cases', () => {
    it('should handle all visibility values correctly in a batch test', () => {
      const testCases: Array<{
        visibility: 'public' | 'private' | 'unlisted';
        expectedSeverity: 'success' | 'warning' | 'info';
        expectedValue: string;
      }> = [
        { visibility: 'public', expectedSeverity: 'success', expectedValue: 'PUBLIC' },
        { visibility: 'private', expectedSeverity: 'warning', expectedValue: 'PRIVATE' },
        { visibility: 'unlisted', expectedSeverity: 'info', expectedValue: 'UNLISTED' },
      ];

      testCases.forEach(({ visibility, expectedSeverity, expectedValue }) => {
        wrapper = mount(LeagueVisibilityTag, {
          props: {
            visibility,
          },
        });

        const tag = wrapper.findComponent({ name: 'Tag' });
        expect(tag.props('severity')).toBe(expectedSeverity);
        expect(tag.props('value')).toBe(expectedValue);
      });
    });

    it('should render without errors when only required prop is provided', () => {
      expect(() => {
        wrapper = mount(LeagueVisibilityTag, {
          props: {
            visibility: 'public',
          },
        });
      }).not.toThrow();

      expect(wrapper.exists()).toBe(true);
    });

    it('should render Tag component', () => {
      wrapper = mount(LeagueVisibilityTag, {
        props: {
          visibility: 'public',
        },
      });

      const tag = wrapper.findComponent({ name: 'Tag' });
      expect(tag.exists()).toBe(true);
    });
  });

  describe('Correct Color Scheme Verification', () => {
    it('should use success (green) for public visibility - NOT info', () => {
      wrapper = mount(LeagueVisibilityTag, {
        props: {
          visibility: 'public',
        },
      });

      const tag = wrapper.findComponent({ name: 'Tag' });
      // Verify it uses 'success' (green), not 'info' (blue)
      expect(tag.props('severity')).toBe('success');
      expect(tag.props('severity')).not.toBe('info');
    });

    it('should verify the complete correct color mapping', () => {
      // This test explicitly verifies the CORRECT mapping
      // public → success (green) - NOT info
      // private → warning (orange)
      // unlisted → info (blue)

      const correctMapping = [
        { visibility: 'public', correctSeverity: 'success', incorrectSeverity: 'info' },
        { visibility: 'private', correctSeverity: 'warning', incorrectSeverity: null },
        { visibility: 'unlisted', correctSeverity: 'info', incorrectSeverity: null },
      ] as const;

      correctMapping.forEach(({ visibility, correctSeverity, incorrectSeverity }) => {
        wrapper = mount(LeagueVisibilityTag, {
          props: {
            visibility,
          },
        });

        const tag = wrapper.findComponent({ name: 'Tag' });

        // Verify correct mapping
        expect(tag.props('severity')).toBe(correctSeverity);

        // For public, explicitly verify it's NOT using the incorrect info severity
        if (incorrectSeverity) {
          expect(tag.props('severity')).not.toBe(incorrectSeverity);
        }
      });
    });
  });
});
