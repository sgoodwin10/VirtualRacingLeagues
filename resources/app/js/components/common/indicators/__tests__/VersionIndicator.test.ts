import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import VersionIndicator from '../VersionIndicator.vue';

describe('VersionIndicator', () => {
  describe('Rendering', () => {
    it('renders with version prop', () => {
      const wrapper = mount(VersionIndicator, {
        props: {
          version: 'v1.0.0',
        },
      });

      expect(wrapper.text()).toBe('v1.0.0');
    });

    it('renders empty when no version provided', () => {
      const wrapper = mount(VersionIndicator);

      expect(wrapper.text()).toBe('');
    });

    it('renders as span element', () => {
      const wrapper = mount(VersionIndicator, {
        props: {
          version: 'v1.0.0',
        },
      });

      expect(wrapper.element.tagName).toBe('SPAN');
    });
  });

  describe('Props - version', () => {
    it('renders version string exactly as provided', () => {
      const wrapper = mount(VersionIndicator, {
        props: {
          version: 'v2.3.1',
        },
      });

      expect(wrapper.text()).toBe('v2.3.1');
    });

    it('renders version without auto-prefixing "v"', () => {
      const wrapper = mount(VersionIndicator, {
        props: {
          version: '1.0.0',
        },
      });

      expect(wrapper.text()).toBe('1.0.0');
      expect(wrapper.text()).not.toBe('v1.0.0');
    });

    it('renders custom version strings', () => {
      const wrapper = mount(VersionIndicator, {
        props: {
          version: 'beta-3',
        },
      });

      expect(wrapper.text()).toBe('beta-3');
    });

    it('renders version with special characters', () => {
      const wrapper = mount(VersionIndicator, {
        props: {
          version: 'v1.0.0-rc.1',
        },
      });

      expect(wrapper.text()).toBe('v1.0.0-rc.1');
    });

    it('renders empty string version', () => {
      const wrapper = mount(VersionIndicator, {
        props: {
          version: '',
        },
      });

      expect(wrapper.text()).toBe('');
    });
  });

  describe('Props - variant', () => {
    it('uses success variant by default', () => {
      const wrapper = mount(VersionIndicator, {
        props: {
          version: 'v1.0.0',
        },
      });

      const span = wrapper.find('span');
      expect(span.classes()).toContain('bg-[var(--green-dim)]');
      expect(span.classes()).toContain('text-[var(--green)]');
    });

    it('applies success variant classes', () => {
      const wrapper = mount(VersionIndicator, {
        props: {
          version: 'v1.0.0',
          variant: 'success',
        },
      });

      const span = wrapper.find('span');
      expect(span.classes()).toContain('bg-[var(--green-dim)]');
      expect(span.classes()).toContain('text-[var(--green)]');
    });

    it('applies info variant classes', () => {
      const wrapper = mount(VersionIndicator, {
        props: {
          version: 'v1.0.0',
          variant: 'info',
        },
      });

      const span = wrapper.find('span');
      expect(span.classes()).toContain('bg-[var(--cyan-dim)]');
      expect(span.classes()).toContain('text-[var(--cyan)]');
    });

    it('applies warning variant classes', () => {
      const wrapper = mount(VersionIndicator, {
        props: {
          version: 'v1.0.0',
          variant: 'warning',
        },
      });

      const span = wrapper.find('span');
      expect(span.classes()).toContain('bg-[var(--orange-dim)]');
      expect(span.classes()).toContain('text-[var(--orange)]');
    });
  });

  describe('CSS Classes', () => {
    it('applies base structural classes', () => {
      const wrapper = mount(VersionIndicator, {
        props: {
          version: 'v1.0.0',
        },
      });

      const span = wrapper.find('span');
      expect(span.classes()).toContain('inline-block');
      expect(span.classes()).toContain('rounded-[3px]');
      expect(span.classes()).toContain('px-[6px]');
      expect(span.classes()).toContain('py-[2px]');
    });

    it('applies typography classes', () => {
      const wrapper = mount(VersionIndicator, {
        props: {
          version: 'v1.0.0',
        },
      });

      const span = wrapper.find('span');
      expect(span.classes()).toContain('font-mono');
      expect(span.classes()).toContain('text-[10px]');
      expect(span.classes()).toContain('font-medium');
    });

    it('does not apply variant classes from other variants - success', () => {
      const wrapper = mount(VersionIndicator, {
        props: {
          version: 'v1.0.0',
          variant: 'success',
        },
      });

      const span = wrapper.find('span');
      // Should have success classes
      expect(span.classes()).toContain('bg-[var(--green-dim)]');
      expect(span.classes()).toContain('text-[var(--green)]');
      // Should NOT have info classes
      expect(span.classes()).not.toContain('bg-[var(--cyan-dim)]');
      expect(span.classes()).not.toContain('text-[var(--cyan)]');
      // Should NOT have warning classes
      expect(span.classes()).not.toContain('bg-[var(--orange-dim)]');
      expect(span.classes()).not.toContain('text-[var(--orange)]');
    });

    it('does not apply variant classes from other variants - info', () => {
      const wrapper = mount(VersionIndicator, {
        props: {
          version: 'v1.0.0',
          variant: 'info',
        },
      });

      const span = wrapper.find('span');
      // Should have info classes
      expect(span.classes()).toContain('bg-[var(--cyan-dim)]');
      expect(span.classes()).toContain('text-[var(--cyan)]');
      // Should NOT have success classes
      expect(span.classes()).not.toContain('bg-[var(--green-dim)]');
      expect(span.classes()).not.toContain('text-[var(--green)]');
      // Should NOT have warning classes
      expect(span.classes()).not.toContain('bg-[var(--orange-dim)]');
      expect(span.classes()).not.toContain('text-[var(--orange)]');
    });

    it('does not apply variant classes from other variants - warning', () => {
      const wrapper = mount(VersionIndicator, {
        props: {
          version: 'v1.0.0',
          variant: 'warning',
        },
      });

      const span = wrapper.find('span');
      // Should have warning classes
      expect(span.classes()).toContain('bg-[var(--orange-dim)]');
      expect(span.classes()).toContain('text-[var(--orange)]');
      // Should NOT have success classes
      expect(span.classes()).not.toContain('bg-[var(--green-dim)]');
      expect(span.classes()).not.toContain('text-[var(--green)]');
      // Should NOT have info classes
      expect(span.classes()).not.toContain('bg-[var(--cyan-dim)]');
      expect(span.classes()).not.toContain('text-[var(--cyan)]');
    });
  });

  describe('HTML Structure', () => {
    it('renders single span element', () => {
      const wrapper = mount(VersionIndicator, {
        props: {
          version: 'v1.0.0',
        },
      });

      const spans = wrapper.findAll('span');
      expect(spans).toHaveLength(1);
    });

    it('renders version text directly in span', () => {
      const wrapper = mount(VersionIndicator, {
        props: {
          version: 'v1.0.0',
        },
      });

      const span = wrapper.find('span');
      expect(span.text()).toBe('v1.0.0');
    });

    it('contains no nested elements', () => {
      const wrapper = mount(VersionIndicator, {
        props: {
          version: 'v1.0.0',
        },
      });

      const span = wrapper.find('span');
      expect(span.element.children.length).toBe(0);
    });
  });

  describe('TypeScript Props', () => {
    it('accepts all valid props', () => {
      const wrapper = mount(VersionIndicator, {
        props: {
          version: 'v1.0.0',
          variant: 'info',
        },
      });

      expect(wrapper.props()).toEqual({
        version: 'v1.0.0',
        variant: 'info',
      });
    });

    it('uses default values for optional props', () => {
      const wrapper = mount(VersionIndicator);

      expect(wrapper.props()).toEqual({
        version: '',
        variant: 'success',
      });
    });

    it('handles version prop only', () => {
      const wrapper = mount(VersionIndicator, {
        props: {
          version: 'v2.0.0',
        },
      });

      expect(wrapper.props()).toEqual({
        version: 'v2.0.0',
        variant: 'success',
      });
    });

    it('handles variant prop only', () => {
      const wrapper = mount(VersionIndicator, {
        props: {
          variant: 'warning',
        },
      });

      expect(wrapper.props()).toEqual({
        version: '',
        variant: 'warning',
      });
    });
  });

  describe('Integration Scenarios', () => {
    it('renders semantic version correctly', () => {
      const wrapper = mount(VersionIndicator, {
        props: {
          version: 'v1.2.3',
          variant: 'success',
        },
      });

      expect(wrapper.text()).toBe('v1.2.3');
      const span = wrapper.find('span');
      expect(span.classes()).toContain('bg-[var(--green-dim)]');
      expect(span.classes()).toContain('text-[var(--green)]');
    });

    it('renders pre-release version with info variant', () => {
      const wrapper = mount(VersionIndicator, {
        props: {
          version: 'v2.0.0-beta.1',
          variant: 'info',
        },
      });

      expect(wrapper.text()).toBe('v2.0.0-beta.1');
      const span = wrapper.find('span');
      expect(span.classes()).toContain('bg-[var(--cyan-dim)]');
      expect(span.classes()).toContain('text-[var(--cyan)]');
    });

    it('renders deprecated version with warning variant', () => {
      const wrapper = mount(VersionIndicator, {
        props: {
          version: 'v1.0.0-deprecated',
          variant: 'warning',
        },
      });

      expect(wrapper.text()).toBe('v1.0.0-deprecated');
      const span = wrapper.find('span');
      expect(span.classes()).toContain('bg-[var(--orange-dim)]');
      expect(span.classes()).toContain('text-[var(--orange)]');
    });

    it('handles version changes reactively', async () => {
      const wrapper = mount(VersionIndicator, {
        props: {
          version: 'v1.0.0',
        },
      });

      expect(wrapper.text()).toBe('v1.0.0');

      await wrapper.setProps({ version: 'v2.0.0' });
      expect(wrapper.text()).toBe('v2.0.0');
    });

    it('handles variant changes reactively', async () => {
      const wrapper = mount(VersionIndicator, {
        props: {
          version: 'v1.0.0',
          variant: 'success',
        },
      });

      const span = wrapper.find('span');
      expect(span.classes()).toContain('bg-[var(--green-dim)]');
      expect(span.classes()).toContain('text-[var(--green)]');

      await wrapper.setProps({ variant: 'warning' });
      expect(span.classes()).toContain('bg-[var(--orange-dim)]');
      expect(span.classes()).toContain('text-[var(--orange)]');
      expect(span.classes()).not.toContain('bg-[var(--green-dim)]');
      expect(span.classes()).not.toContain('text-[var(--green)]');
    });

    it('renders custom version formats', () => {
      const testCases = ['alpha', '2024.01', 'nightly', '1.0', '1', 'latest'];

      testCases.forEach((version) => {
        const wrapper = mount(VersionIndicator, {
          props: {
            version,
          },
        });

        expect(wrapper.text()).toBe(version);
      });
    });
  });
});
