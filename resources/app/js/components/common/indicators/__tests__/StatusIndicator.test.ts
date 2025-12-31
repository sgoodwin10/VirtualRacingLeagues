import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import StatusIndicator from '../StatusIndicator.vue';

describe('StatusIndicator', () => {
  describe('Rendering', () => {
    it('renders with default props', () => {
      const wrapper = mount(StatusIndicator);

      expect(wrapper.find('.status-indicator').exists()).toBe(true);
      expect(wrapper.find('.status-indicator__dot').exists()).toBe(true);
      expect(wrapper.find('.status-indicator__label').text()).toBe('Inactive');
    });

    it('renders without dot when showDot is false', () => {
      const wrapper = mount(StatusIndicator, {
        props: {
          showDot: false,
        },
      });

      expect(wrapper.find('.status-indicator__dot').exists()).toBe(false);
      expect(wrapper.find('.status-indicator__label').exists()).toBe(true);
    });

    it('renders custom label when provided', () => {
      const wrapper = mount(StatusIndicator, {
        props: {
          status: 'active',
          label: 'Custom Status',
        },
      });

      expect(wrapper.find('.status-indicator__label').text()).toBe('Custom Status');
    });
  });

  describe('Status Types', () => {
    it('renders active status correctly', () => {
      const wrapper = mount(StatusIndicator, {
        props: {
          status: 'active',
        },
      });

      expect(wrapper.find('.status-indicator--green').exists()).toBe(true);
      expect(wrapper.find('.status-indicator__label').text()).toBe('Active');
    });

    it('renders success status correctly', () => {
      const wrapper = mount(StatusIndicator, {
        props: {
          status: 'success',
        },
      });

      expect(wrapper.find('.status-indicator--green').exists()).toBe(true);
      expect(wrapper.find('.status-indicator__label').text()).toBe('Success');
    });

    it('renders pending status correctly', () => {
      const wrapper = mount(StatusIndicator, {
        props: {
          status: 'pending',
        },
      });

      expect(wrapper.find('.status-indicator--orange').exists()).toBe(true);
      expect(wrapper.find('.status-indicator__label').text()).toBe('Pending');
    });

    it('renders warning status correctly', () => {
      const wrapper = mount(StatusIndicator, {
        props: {
          status: 'warning',
        },
      });

      expect(wrapper.find('.status-indicator--orange').exists()).toBe(true);
      expect(wrapper.find('.status-indicator__label').text()).toBe('Warning');
    });

    it('renders inactive status correctly', () => {
      const wrapper = mount(StatusIndicator, {
        props: {
          status: 'inactive',
        },
      });

      expect(wrapper.find('.status-indicator--default').exists()).toBe(true);
      expect(wrapper.find('.status-indicator__label').text()).toBe('Inactive');
    });

    it('renders error status correctly', () => {
      const wrapper = mount(StatusIndicator, {
        props: {
          status: 'error',
        },
      });

      expect(wrapper.find('.status-indicator--red').exists()).toBe(true);
      expect(wrapper.find('.status-indicator__label').text()).toBe('Error');
    });
  });

  describe('Size Variants', () => {
    it('renders md size by default', () => {
      const wrapper = mount(StatusIndicator);

      expect(wrapper.find('.status-indicator--md').exists()).toBe(true);
    });

    it('renders sm size when specified', () => {
      const wrapper = mount(StatusIndicator, {
        props: {
          size: 'sm',
        },
      });

      expect(wrapper.find('.status-indicator--sm').exists()).toBe(true);
      expect(wrapper.find('.status-indicator--md').exists()).toBe(false);
    });

    it('renders md size when specified', () => {
      const wrapper = mount(StatusIndicator, {
        props: {
          size: 'md',
        },
      });

      expect(wrapper.find('.status-indicator--md').exists()).toBe(true);
      expect(wrapper.find('.status-indicator--sm').exists()).toBe(false);
    });
  });

  describe('Color Mapping', () => {
    it('maps active and success to green color', () => {
      const activeWrapper = mount(StatusIndicator, {
        props: { status: 'active' },
      });
      const successWrapper = mount(StatusIndicator, {
        props: { status: 'success' },
      });

      expect(activeWrapper.find('.status-indicator--green').exists()).toBe(true);
      expect(successWrapper.find('.status-indicator--green').exists()).toBe(true);
    });

    it('maps pending and warning to orange color', () => {
      const pendingWrapper = mount(StatusIndicator, {
        props: { status: 'pending' },
      });
      const warningWrapper = mount(StatusIndicator, {
        props: { status: 'warning' },
      });

      expect(pendingWrapper.find('.status-indicator--orange').exists()).toBe(true);
      expect(warningWrapper.find('.status-indicator--orange').exists()).toBe(true);
    });

    it('maps error to red color', () => {
      const wrapper = mount(StatusIndicator, {
        props: { status: 'error' },
      });

      expect(wrapper.find('.status-indicator--red').exists()).toBe(true);
    });

    it('maps inactive to default color', () => {
      const wrapper = mount(StatusIndicator, {
        props: { status: 'inactive' },
      });

      expect(wrapper.find('.status-indicator--default').exists()).toBe(true);
    });
  });

  describe('Props Combination', () => {
    it('handles all props together', () => {
      const wrapper = mount(StatusIndicator, {
        props: {
          status: 'success',
          showDot: true,
          label: 'Completed',
          size: 'sm',
        },
      });

      expect(wrapper.find('.status-indicator').exists()).toBe(true);
      expect(wrapper.find('.status-indicator--sm').exists()).toBe(true);
      expect(wrapper.find('.status-indicator--green').exists()).toBe(true);
      expect(wrapper.find('.status-indicator__dot').exists()).toBe(true);
      expect(wrapper.find('.status-indicator__label').text()).toBe('Completed');
    });

    it('handles sm size with custom label and no dot', () => {
      const wrapper = mount(StatusIndicator, {
        props: {
          status: 'warning',
          showDot: false,
          label: 'Needs Attention',
          size: 'sm',
        },
      });

      expect(wrapper.find('.status-indicator--sm').exists()).toBe(true);
      expect(wrapper.find('.status-indicator--orange').exists()).toBe(true);
      expect(wrapper.find('.status-indicator__dot').exists()).toBe(false);
      expect(wrapper.find('.status-indicator__label').text()).toBe('Needs Attention');
    });
  });

  describe('Accessibility', () => {
    it('renders as a span element', () => {
      const wrapper = mount(StatusIndicator);

      expect(wrapper.element.tagName).toBe('SPAN');
    });

    it('displays text content for screen readers', () => {
      const wrapper = mount(StatusIndicator, {
        props: {
          status: 'active',
          label: 'Currently Active',
        },
      });

      expect(wrapper.text()).toContain('Currently Active');
    });
  });
});
