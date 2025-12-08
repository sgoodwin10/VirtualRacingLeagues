import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import VrlBadge from '../VrlBadge.vue';

describe('VrlBadge', () => {
  it('renders with default props', () => {
    const wrapper = mount(VrlBadge, {
      props: {
        label: 'Test Badge',
      },
    });

    expect(wrapper.text()).toContain('Test Badge');
    expect(wrapper.find('span').exists()).toBe(true);
  });

  describe('variant prop', () => {
    it('renders active variant with pulse', () => {
      const wrapper = mount(VrlBadge, {
        props: {
          label: 'Active',
          variant: 'active',
        },
      });

      expect(wrapper.text()).toContain('Active');
      expect(wrapper.classes()).toContain('bg-racing-success/10');
      expect(wrapper.classes()).toContain('text-racing-success');
      expect(wrapper.classes()).toContain('rounded-full');
      // Should have pulse indicator
      expect(wrapper.find('.animate-pulse').exists()).toBe(true);
    });

    it('renders featured variant with star icon', () => {
      const wrapper = mount(VrlBadge, {
        props: {
          label: 'Featured',
          variant: 'featured',
        },
      });

      expect(wrapper.text()).toContain('Featured');
      expect(wrapper.classes()).toContain('bg-racing-gold/10');
      expect(wrapper.classes()).toContain('text-racing-gold');
      expect(wrapper.classes()).toContain('rounded-full');
    });

    it('renders upcoming variant with clock icon', () => {
      const wrapper = mount(VrlBadge, {
        props: {
          label: 'Upcoming',
          variant: 'upcoming',
        },
      });

      expect(wrapper.text()).toContain('Upcoming');
      expect(wrapper.classes()).toContain('bg-racing-warning/10');
      expect(wrapper.classes()).toContain('text-racing-warning');
      expect(wrapper.classes()).toContain('rounded-full');
    });

    it('renders completed variant', () => {
      const wrapper = mount(VrlBadge, {
        props: {
          label: 'Completed',
          variant: 'completed',
        },
      });

      expect(wrapper.text()).toContain('Completed');
      expect(wrapper.classes()).toContain('bg-racing-tarmac');
      expect(wrapper.classes()).toContain('text-racing-barrier');
    });

    it('renders private variant with border', () => {
      const wrapper = mount(VrlBadge, {
        props: {
          label: 'Private',
          variant: 'private',
        },
      });

      expect(wrapper.text()).toContain('Private');
      expect(wrapper.classes()).toContain('bg-pink-500/20');
      expect(wrapper.classes()).toContain('text-pink-300');
      expect(wrapper.classes()).toContain('border');
    });

    it('renders race status variants without rounded-full', () => {
      const variants: Array<'dnf' | 'dns' | 'fastest-lap' | 'pole' | 'penalty'> = [
        'dnf',
        'dns',
        'fastest-lap',
        'pole',
        'penalty',
      ];

      variants.forEach((variant) => {
        const wrapper = mount(VrlBadge, {
          props: {
            label: variant.toUpperCase(),
            variant,
          },
        });

        expect(wrapper.classes()).toContain('rounded');
        expect(wrapper.classes()).not.toContain('rounded-full');
      });
    });

    it('renders platform variant', () => {
      const wrapper = mount(VrlBadge, {
        props: {
          label: 'GT7',
          variant: 'platform',
        },
      });

      expect(wrapper.text()).toContain('GT7');
      expect(wrapper.classes()).toContain('bg-racing-gold');
      expect(wrapper.classes()).toContain('text-racing-carbon');
    });
  });

  describe('rounded prop', () => {
    it('overrides default rounded behavior when set to true', () => {
      const wrapper = mount(VrlBadge, {
        props: {
          label: 'DNF',
          variant: 'dnf',
          rounded: true,
        },
      });

      expect(wrapper.classes()).toContain('rounded-full');
    });

    it('overrides default rounded behavior when set to false', () => {
      const wrapper = mount(VrlBadge, {
        props: {
          label: 'Active',
          variant: 'active',
          rounded: false,
        },
      });

      expect(wrapper.classes()).toContain('rounded');
      expect(wrapper.classes()).not.toContain('rounded-full');
    });
  });

  describe('pulse prop', () => {
    it('shows pulse when pulse prop is true', () => {
      const wrapper = mount(VrlBadge, {
        props: {
          label: 'Custom',
          pulse: true,
        },
      });

      expect(wrapper.find('.animate-pulse').exists()).toBe(true);
    });

    it('does not show pulse when variant is not active and pulse is false', () => {
      const wrapper = mount(VrlBadge, {
        props: {
          label: 'Completed',
          variant: 'completed',
          pulse: false,
        },
      });

      expect(wrapper.find('.animate-pulse').exists()).toBe(false);
    });
  });

  describe('accessibility', () => {
    it('has role status', () => {
      const wrapper = mount(VrlBadge, {
        props: {
          label: 'Test',
        },
      });

      expect(wrapper.attributes('role')).toBe('status');
    });
  });

  describe('styling', () => {
    it('applies font-display and uppercase classes', () => {
      const wrapper = mount(VrlBadge, {
        props: {
          label: 'Test',
        },
      });

      expect(wrapper.classes()).toContain('font-display');
      expect(wrapper.classes()).toContain('uppercase');
      expect(wrapper.classes()).toContain('tracking-wider');
    });

    it('has correct text size', () => {
      const wrapper = mount(VrlBadge, {
        props: {
          label: 'Test',
        },
      });

      expect(wrapper.classes()).toContain('text-[10px]');
    });
  });
});
