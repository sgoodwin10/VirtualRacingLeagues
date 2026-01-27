import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import TeamIndicator from './TeamIndicator.vue';

describe('TeamIndicator', () => {
  describe('rendering', () => {
    it('renders with default props', () => {
      const wrapper = mount(TeamIndicator);

      expect(wrapper.find('.team-indicator').exists()).toBe(true);
      expect(wrapper.find('.team-indicator__dot').exists()).toBe(true);
      expect(wrapper.find('.team-indicator__name').exists()).toBe(false); // Empty name should not render
    });

    it('renders team name when provided', () => {
      const wrapper = mount(TeamIndicator, {
        props: {
          name: 'Red Bull Racing',
        },
      });

      const nameElement = wrapper.find('.team-indicator__name');
      expect(nameElement.exists()).toBe(true);
      expect(nameElement.text()).toBe('Red Bull Racing');
    });

    it('renders color dot with custom color', () => {
      const wrapper = mount(TeamIndicator, {
        props: {
          color: '#ff0000',
        },
      });

      const dotElement = wrapper.find('.team-indicator__dot');
      expect(dotElement.exists()).toBe(true);
      expect(dotElement.attributes('style')).toContain('background-color: #ff0000');
    });

    it('renders color dot with default color when not provided', () => {
      const wrapper = mount(TeamIndicator);

      const dotElement = wrapper.find('.team-indicator__dot');
      expect(dotElement.exists()).toBe(true);
      expect(dotElement.attributes('style')).toContain('background-color: #58a6ff');
    });

    it('renders logo when provided', () => {
      const wrapper = mount(TeamIndicator, {
        props: {
          name: 'Red Bull Racing',
          logo: '/logos/red-bull.png',
        },
      });

      const logoElement = wrapper.find('.team-indicator__logo');
      expect(logoElement.exists()).toBe(true);
      expect(logoElement.attributes('src')).toBe('/logos/red-bull.png');
      expect(logoElement.attributes('alt')).toBe('Red Bull Racing');
    });

    it('does not render logo when not provided', () => {
      const wrapper = mount(TeamIndicator, {
        props: {
          name: 'Red Bull Racing',
        },
      });

      expect(wrapper.find('.team-indicator__logo').exists()).toBe(false);
    });
  });

  describe('showName prop', () => {
    it('shows team name when showName is true (default)', () => {
      const wrapper = mount(TeamIndicator, {
        props: {
          name: 'Mercedes AMG',
        },
      });

      expect(wrapper.find('.team-indicator__name').exists()).toBe(true);
      expect(wrapper.find('.team-indicator__name').text()).toBe('Mercedes AMG');
    });

    it('hides team name when showName is false', () => {
      const wrapper = mount(TeamIndicator, {
        props: {
          name: 'Mercedes AMG',
          showName: false,
        },
      });

      expect(wrapper.find('.team-indicator__name').exists()).toBe(false);
    });

    it('shows team name when showName is explicitly true', () => {
      const wrapper = mount(TeamIndicator, {
        props: {
          name: 'Ferrari',
          showName: true,
        },
      });

      expect(wrapper.find('.team-indicator__name').exists()).toBe(true);
      expect(wrapper.find('.team-indicator__name').text()).toBe('Ferrari');
    });
  });

  describe('complete team configurations', () => {
    it('renders complete team with name, color, and logo', () => {
      const wrapper = mount(TeamIndicator, {
        props: {
          name: 'McLaren',
          color: '#ff8700',
          logo: '/logos/mclaren.png',
        },
      });

      expect(wrapper.find('.team-indicator').exists()).toBe(true);
      expect(wrapper.find('.team-indicator__dot').attributes('style')).toContain(
        'background-color: #ff8700',
      );
      expect(wrapper.find('.team-indicator__logo').attributes('src')).toBe('/logos/mclaren.png');
      expect(wrapper.find('.team-indicator__name').text()).toBe('McLaren');
    });

    it('renders minimal team with only color dot', () => {
      const wrapper = mount(TeamIndicator, {
        props: {
          showName: false,
        },
      });

      expect(wrapper.find('.team-indicator').exists()).toBe(true);
      expect(wrapper.find('.team-indicator__dot').exists()).toBe(true);
      expect(wrapper.find('.team-indicator__logo').exists()).toBe(false);
      expect(wrapper.find('.team-indicator__name').exists()).toBe(false);
    });

    it('renders team with logo but no name', () => {
      const wrapper = mount(TeamIndicator, {
        props: {
          name: 'Alpine',
          color: '#0090ff',
          logo: '/logos/alpine.png',
          showName: false,
        },
      });

      expect(wrapper.find('.team-indicator__dot').exists()).toBe(true);
      expect(wrapper.find('.team-indicator__logo').exists()).toBe(true);
      expect(wrapper.find('.team-indicator__name').exists()).toBe(false);
    });
  });

  describe('styling', () => {
    it('applies correct CSS classes', () => {
      const wrapper = mount(TeamIndicator, {
        props: {
          name: 'Aston Martin',
          logo: '/logos/aston-martin.png',
        },
      });

      expect(wrapper.find('.team-indicator').classes()).toContain('team-indicator');
      expect(wrapper.find('.team-indicator__dot').classes()).toContain('team-indicator__dot');
      expect(wrapper.find('.team-indicator__logo').classes()).toContain('team-indicator__logo');
      expect(wrapper.find('.team-indicator__name').classes()).toContain('team-indicator__name');
    });

    it('renders as inline-flex container', () => {
      const wrapper = mount(TeamIndicator);

      const indicator = wrapper.find('.team-indicator');
      expect(indicator.element).toBeInstanceOf(HTMLSpanElement);
    });
  });

  describe('edge cases', () => {
    it('handles empty string name', () => {
      const wrapper = mount(TeamIndicator, {
        props: {
          name: '',
        },
      });

      expect(wrapper.find('.team-indicator__name').exists()).toBe(false);
    });

    it('handles very long team names', () => {
      const wrapper = mount(TeamIndicator, {
        props: {
          name: 'Very Long Team Name That Should Not Wrap To Multiple Lines',
        },
      });

      const nameElement = wrapper.find('.team-indicator__name');
      expect(nameElement.exists()).toBe(true);
      expect(nameElement.text()).toBe('Very Long Team Name That Should Not Wrap To Multiple Lines');
    });

    it('handles special characters in team name', () => {
      const wrapper = mount(TeamIndicator, {
        props: {
          name: 'Team & Co. <Special> "Chars"',
        },
      });

      expect(wrapper.find('.team-indicator__name').text()).toBe('Team & Co. <Special> "Chars"');
    });

    it('handles invalid color hex values gracefully', () => {
      const wrapper = mount(TeamIndicator, {
        props: {
          color: 'not-a-color',
        },
      });

      const dotElement = wrapper.find('.team-indicator__dot');
      expect(dotElement.exists()).toBe(true);
      // Component renders even with invalid color value
      // Browser may ignore invalid CSS values, so we just verify the element exists
    });

    it('handles empty logo URL', () => {
      const wrapper = mount(TeamIndicator, {
        props: {
          name: 'Team',
          logo: '',
        },
      });

      // Empty string is falsy in v-if, so logo should not render
      const logoElement = wrapper.find('.team-indicator__logo');
      expect(logoElement.exists()).toBe(false);
    });
  });

  describe('accessibility', () => {
    it('includes alt text for logo with team name', () => {
      const wrapper = mount(TeamIndicator, {
        props: {
          name: 'Williams',
          logo: '/logos/williams.png',
        },
      });

      const logoElement = wrapper.find('.team-indicator__logo');
      expect(logoElement.attributes('alt')).toBe('Williams');
    });

    it('includes alt text even when name is not shown', () => {
      const wrapper = mount(TeamIndicator, {
        props: {
          name: 'Haas',
          logo: '/logos/haas.png',
          showName: false,
        },
      });

      const logoElement = wrapper.find('.team-indicator__logo');
      expect(logoElement.attributes('alt')).toBe('Haas');
    });
  });
});
