import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import VrlStatusIndicator from '../VrlStatusIndicator.vue';

describe('VrlStatusIndicator', () => {
  describe('Rendering', () => {
    it('renders with default status', () => {
      const wrapper = mount(VrlStatusIndicator);

      expect(wrapper.classes()).toContain('inline-flex');
      expect(wrapper.classes()).toContain('items-center');
      expect(wrapper.text()).toBe('Inactive');
    });

    it('renders status dot', () => {
      const wrapper = mount(VrlStatusIndicator, {
        props: { status: 'active' },
      });

      const dot = wrapper.find('.w-2');
      expect(dot.exists()).toBe(true);
    });

    it('renders status label', () => {
      const wrapper = mount(VrlStatusIndicator, {
        props: { status: 'active' },
      });

      expect(wrapper.text()).toBe('Active');
    });

    it('renders as a span element', () => {
      const wrapper = mount(VrlStatusIndicator);
      expect(wrapper.element.tagName).toBe('SPAN');
    });
  });

  describe('Status Types', () => {
    it('renders active status with green dot and label', () => {
      const wrapper = mount(VrlStatusIndicator, {
        props: { status: 'active' },
      });

      expect(wrapper.text()).toBe('Active');
      const dot = wrapper.find('.w-2');
      expect(dot.exists()).toBe(true);
      expect(dot.classes()).toContain('bg-[var(--green)]');
    });

    it('renders pending status with orange dot and label', () => {
      const wrapper = mount(VrlStatusIndicator, {
        props: { status: 'pending' },
      });

      expect(wrapper.text()).toBe('Pending');
      const dot = wrapper.find('.w-2');
      expect(dot.exists()).toBe(true);
      expect(dot.classes()).toContain('bg-[var(--orange)]');
    });

    it('renders inactive status with muted dot and label', () => {
      const wrapper = mount(VrlStatusIndicator, {
        props: { status: 'inactive' },
      });

      expect(wrapper.text()).toBe('Inactive');
      const dot = wrapper.find('.w-2');
      expect(dot.exists()).toBe(true);
      expect(dot.classes()).toContain('bg-[var(--text-muted)]');
    });

    it('renders error status with red dot and label', () => {
      const wrapper = mount(VrlStatusIndicator, {
        props: { status: 'error' },
      });

      expect(wrapper.text()).toBe('Error');
      const dot = wrapper.find('.w-2');
      expect(dot.exists()).toBe(true);
      expect(dot.classes()).toContain('bg-[var(--red)]');
    });
  });

  describe('Custom Labels', () => {
    it('uses default label when no slot content provided', () => {
      const wrapper = mount(VrlStatusIndicator, {
        props: { status: 'active' },
      });

      expect(wrapper.text()).toBe('Active');
    });

    it('uses custom label from slot content', () => {
      const wrapper = mount(VrlStatusIndicator, {
        props: { status: 'pending' },
        slots: {
          default: 'Awaiting Results',
        },
      });

      expect(wrapper.text()).toBe('Awaiting Results');
    });

    it('uses custom label for error status', () => {
      const wrapper = mount(VrlStatusIndicator, {
        props: { status: 'error' },
        slots: {
          default: 'Race Cancelled',
        },
      });

      expect(wrapper.text()).toBe('Race Cancelled');
    });

    it('handles empty slot content by showing default label', () => {
      const wrapper = mount(VrlStatusIndicator, {
        props: { status: 'active' },
        slots: {
          default: '',
        },
      });

      // Should show default label when slot is empty
      expect(wrapper.text()).toBeTruthy();
    });
  });

  describe('Accessibility', () => {
    it('text content is readable by screen readers', () => {
      const wrapper = mount(VrlStatusIndicator, {
        props: { status: 'active' },
      });

      expect(wrapper.text()).toBe('Active');
    });

    it('color is not the only indicator (text label present)', () => {
      const wrapper = mount(VrlStatusIndicator, {
        props: { status: 'active' },
      });

      const dot = wrapper.find('.w-2');
      expect(dot.exists()).toBe(true);
      expect(wrapper.text()).toBe('Active');
    });

    it('renders as inline element', () => {
      const wrapper = mount(VrlStatusIndicator);
      // Check that it renders as a span (which is inline by default)
      expect(wrapper.element.tagName).toBe('SPAN');
    });
  });

  describe('Edge Cases', () => {
    it('handles very long custom labels', () => {
      const longLabel = 'This is a very long status label that might cause overflow';
      const wrapper = mount(VrlStatusIndicator, {
        props: { status: 'pending' },
        slots: {
          default: longLabel,
        },
      });

      expect(wrapper.text()).toBe(longLabel);
    });

    it('handles special characters in custom labels', () => {
      const wrapper = mount(VrlStatusIndicator, {
        props: { status: 'error' },
        slots: {
          default: 'Error: System Failure & Alert!',
        },
      });

      expect(wrapper.text()).toBe('Error: System Failure & Alert!');
    });

    it('multiple indicators can be rendered together', () => {
      const wrapper1 = mount(VrlStatusIndicator, {
        props: { status: 'active' },
      });

      const wrapper2 = mount(VrlStatusIndicator, {
        props: { status: 'pending' },
      });

      expect(wrapper1.exists()).toBe(true);
      expect(wrapper2.exists()).toBe(true);
      const dot1 = wrapper1.find('.w-2');
      const dot2 = wrapper2.find('.w-2');
      expect(dot1.classes()).toContain('bg-[var(--green)]');
      expect(dot2.classes()).toContain('bg-[var(--orange)]');
    });
  });

  describe('Snapshots', () => {
    it('matches snapshot for active status', () => {
      const wrapper = mount(VrlStatusIndicator, {
        props: { status: 'active' },
      });
      expect(wrapper.html()).toMatchSnapshot();
    });

    it('matches snapshot for pending status', () => {
      const wrapper = mount(VrlStatusIndicator, {
        props: { status: 'pending' },
      });
      expect(wrapper.html()).toMatchSnapshot();
    });

    it('matches snapshot for inactive status', () => {
      const wrapper = mount(VrlStatusIndicator, {
        props: { status: 'inactive' },
      });
      expect(wrapper.html()).toMatchSnapshot();
    });

    it('matches snapshot for error status', () => {
      const wrapper = mount(VrlStatusIndicator, {
        props: { status: 'error' },
      });
      expect(wrapper.html()).toMatchSnapshot();
    });

    it('matches snapshot with custom label', () => {
      const wrapper = mount(VrlStatusIndicator, {
        props: { status: 'pending' },
        slots: {
          default: 'Custom Status',
        },
      });
      expect(wrapper.html()).toMatchSnapshot();
    });
  });
});
