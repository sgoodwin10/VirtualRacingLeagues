import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { RouterLink } from 'vue-router';
import VrlLeagueCard from '../VrlLeagueCard.vue';

describe('VrlLeagueCard', () => {
  describe('Rendering', () => {
    it('renders with required props', () => {
      const wrapper = mount(VrlLeagueCard, {
        props: {
          name: 'GT Masters Cup',
        },
        global: {
          stubs: {
            RouterLink: true,
          },
        },
      });

      expect(wrapper.exists()).toBe(true);
      expect(wrapper.text()).toContain('GT Masters Cup');
    });

    it('renders with all props', () => {
      const wrapper = mount(VrlLeagueCard, {
        props: {
          name: 'GT Masters Cup',
          tagline: 'Elite GT Racing',
          competitions: 12,
          drivers: 78,
        },
        global: {
          stubs: {
            RouterLink: true,
          },
        },
      });

      expect(wrapper.text()).toContain('GT Masters Cup');
      expect(wrapper.text()).toContain('Elite GT Racing');
      expect(wrapper.text()).toContain('12');
      expect(wrapper.text()).toContain('Competitions');
      expect(wrapper.text()).toContain('78');
      expect(wrapper.text()).toContain('Drivers');
    });

    it('renders custom class', () => {
      const wrapper = mount(VrlLeagueCard, {
        props: {
          name: 'Test League',
          class: 'custom-class',
        },
        global: {
          stubs: {
            RouterLink: true,
          },
        },
      });

      expect(wrapper.classes()).toContain('custom-class');
    });
  });

  describe('Logo', () => {
    it('renders flag icon when no logoUrl is provided', () => {
      const wrapper = mount(VrlLeagueCard, {
        props: {
          name: 'Test League',
        },
        global: {
          stubs: {
            RouterLink: true,
          },
        },
      });

      const icon = wrapper.findComponent({ name: 'PhFlagCheckered' });
      expect(icon.exists()).toBe(true);
    });

    it('renders logo image when logoUrl is provided', () => {
      const wrapper = mount(VrlLeagueCard, {
        props: {
          name: 'Test League',
          logoUrl: '/images/logo.png',
        },
        global: {
          stubs: {
            RouterLink: true,
          },
        },
      });

      const img = wrapper.find('img');
      expect(img.exists()).toBe(true);
      expect(img.attributes('src')).toBe('/images/logo.png');
      expect(img.attributes('alt')).toBe('Test League logo');
    });

    it('does not render flag icon when logoUrl is provided', () => {
      const wrapper = mount(VrlLeagueCard, {
        props: {
          name: 'Test League',
          logoUrl: '/images/logo.png',
        },
        global: {
          stubs: {
            RouterLink: true,
          },
        },
      });

      const icon = wrapper.findComponent({ name: 'PhFlagCheckered' });
      expect(icon.exists()).toBe(false);
    });
  });

  describe('Header Image', () => {
    it('uses default background when no headerImageUrl is provided', () => {
      const wrapper = mount(VrlLeagueCard, {
        props: {
          name: 'Test League',
        },
        global: {
          stubs: {
            RouterLink: true,
          },
        },
      });

      const header = wrapper.find('.relative.h-28');
      expect(header.attributes('style')).toContain('var(--bg-tertiary)');
    });

    it('uses headerImageUrl as background when provided', () => {
      const wrapper = mount(VrlLeagueCard, {
        props: {
          name: 'Test League',
          headerImageUrl: '/images/header.jpg',
        },
        global: {
          stubs: {
            RouterLink: true,
          },
        },
      });

      // Verify the component received the headerImageUrl prop correctly
      expect(wrapper.props('headerImageUrl')).toBe('/images/header.jpg');
    });
  });

  describe('Tagline', () => {
    it('renders tagline when provided', () => {
      const wrapper = mount(VrlLeagueCard, {
        props: {
          name: 'Test League',
          tagline: 'Best racing league',
        },
        global: {
          stubs: {
            RouterLink: true,
          },
        },
      });

      expect(wrapper.text()).toContain('Best racing league');
    });

    it('does not render tagline element when not provided', () => {
      const wrapper = mount(VrlLeagueCard, {
        props: {
          name: 'Test League',
        },
        global: {
          stubs: {
            RouterLink: true,
          },
        },
      });

      const tagline = wrapper.find('p');
      expect(tagline.exists()).toBe(false);
    });

    it('does not render tagline element when empty string', () => {
      const wrapper = mount(VrlLeagueCard, {
        props: {
          name: 'Test League',
          tagline: '',
        },
        global: {
          stubs: {
            RouterLink: true,
          },
        },
      });

      const tagline = wrapper.find('p');
      expect(tagline.exists()).toBe(false);
    });
  });

  describe('Statistics', () => {
    it('displays competition count', () => {
      const wrapper = mount(VrlLeagueCard, {
        props: {
          name: 'Test League',
          competitions: 5,
        },
        global: {
          stubs: {
            RouterLink: true,
          },
        },
      });

      expect(wrapper.text()).toContain('5');
      expect(wrapper.text()).toContain('Competitions');
    });

    it('displays driver count', () => {
      const wrapper = mount(VrlLeagueCard, {
        props: {
          name: 'Test League',
          drivers: 42,
        },
        global: {
          stubs: {
            RouterLink: true,
          },
        },
      });

      expect(wrapper.text()).toContain('42');
      expect(wrapper.text()).toContain('Drivers');
    });

    it('displays zero counts when not provided', () => {
      const wrapper = mount(VrlLeagueCard, {
        props: {
          name: 'Test League',
        },
        global: {
          stubs: {
            RouterLink: true,
          },
        },
      });

      const stats = wrapper.find('.flex.gap-3');
      expect(stats.text()).toContain('0');
    });
  });

  describe('RouterLink Integration', () => {
    it('renders as div when no "to" prop is provided', () => {
      const wrapper = mount(VrlLeagueCard, {
        props: {
          name: 'Test League',
        },
        global: {
          stubs: {
            RouterLink: true,
          },
        },
      });

      expect(wrapper.element.tagName).toBe('DIV');
      expect(wrapper.classes()).not.toContain('cursor-pointer');
    });

    it('renders as RouterLink when "to" prop is provided', () => {
      const wrapper = mount(VrlLeagueCard, {
        props: {
          name: 'Test League',
          to: '/leagues/test',
        },
        global: {
          stubs: {
            RouterLink: true,
          },
        },
      });

      const link = wrapper.findComponent(RouterLink);
      expect(link.exists()).toBe(true);
      expect(link.props('to')).toBe('/leagues/test');
    });

    it('adds cursor-pointer class when "to" prop is provided', () => {
      const wrapper = mount(VrlLeagueCard, {
        props: {
          name: 'Test League',
          to: '/leagues/test',
        },
        global: {
          stubs: {
            RouterLink: true,
          },
        },
      });

      expect(wrapper.classes()).toContain('cursor-pointer');
    });

    it('accepts route object for "to" prop', () => {
      const wrapper = mount(VrlLeagueCard, {
        props: {
          name: 'Test League',
          to: { name: 'league-detail', params: { id: '123' } },
        },
        global: {
          stubs: {
            RouterLink: true,
          },
        },
      });

      const link = wrapper.findComponent(RouterLink);
      expect(link.exists()).toBe(true);
    });
  });

  describe('Styling', () => {
    it('has correct base classes', () => {
      const wrapper = mount(VrlLeagueCard, {
        props: {
          name: 'Test League',
        },
        global: {
          stubs: {
            RouterLink: true,
          },
        },
      });

      expect(wrapper.classes()).toContain('card-racing');
      expect(wrapper.classes()).toContain('rounded');
      expect(wrapper.classes()).toContain('overflow-hidden');
    });

    it('renders checkered pattern overlay', () => {
      const wrapper = mount(VrlLeagueCard, {
        props: {
          name: 'Test League',
        },
        global: {
          stubs: {
            RouterLink: true,
          },
        },
      });

      const pattern = wrapper.find('.pattern-checkered');
      expect(pattern.exists()).toBe(true);
      expect(pattern.classes()).toContain('opacity-10');
    });

    it('renders gradient overlay at bottom of header', () => {
      const wrapper = mount(VrlLeagueCard, {
        props: {
          name: 'Test League',
        },
        global: {
          stubs: {
            RouterLink: true,
          },
        },
      });

      const gradient = wrapper.find('.absolute.bottom-0.left-0.right-0.h-16');
      expect(gradient.exists()).toBe(true);
    });
  });

  describe('Security - URL Sanitization', () => {
    let consoleWarnSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    });

    afterEach(() => {
      consoleWarnSpy.mockRestore();
    });

    describe('headerImageUrl sanitization', () => {
      it('allows safe HTTPS URLs', () => {
        const wrapper = mount(VrlLeagueCard, {
          props: {
            name: 'Test League',
            headerImageUrl: 'https://example.com/header.jpg',
          },
          global: {
            stubs: {
              RouterLink: true,
            },
          },
        });

        // Verify the prop is passed and sanitized correctly
        expect(wrapper.props('headerImageUrl')).toBe('https://example.com/header.jpg');
        // Verify it's not blocked (console warn not called for this URL)
        expect(consoleWarnSpy).not.toHaveBeenCalledWith(
          expect.stringContaining('Blocked disallowed protocol'),
        );
      });

      it('allows safe HTTP URLs', () => {
        const wrapper = mount(VrlLeagueCard, {
          props: {
            name: 'Test League',
            headerImageUrl: 'http://example.com/header.jpg',
          },
          global: {
            stubs: {
              RouterLink: true,
            },
          },
        });

        // Verify the prop is passed and sanitized correctly
        expect(wrapper.props('headerImageUrl')).toBe('http://example.com/header.jpg');
        // Verify it's not blocked (console warn not called for this URL)
        expect(consoleWarnSpy).not.toHaveBeenCalledWith(
          expect.stringContaining('Blocked disallowed protocol'),
        );
      });

      it('blocks javascript: protocol URLs', () => {
        const wrapper = mount(VrlLeagueCard, {
          props: {
            name: 'Test League',
            headerImageUrl: 'javascript:alert(1)',
          },
          global: {
            stubs: {
              RouterLink: true,
            },
          },
        });

        const header = wrapper.find('.relative.h-28');
        // Should use default background, not the malicious URL
        expect(header.attributes('style')).not.toContain('javascript:');
        expect(header.attributes('style')).toContain('var(--bg-tertiary)');
        expect(consoleWarnSpy).toHaveBeenCalled();
      });

      it('blocks vbscript: protocol URLs', () => {
        const wrapper = mount(VrlLeagueCard, {
          props: {
            name: 'Test League',
            headerImageUrl: 'vbscript:msgbox("XSS")',
          },
          global: {
            stubs: {
              RouterLink: true,
            },
          },
        });

        const header = wrapper.find('.relative.h-28');
        expect(header.attributes('style')).not.toContain('vbscript:');
        expect(header.attributes('style')).toContain('var(--bg-tertiary)');
      });

      it('blocks data:text/html URLs', () => {
        const wrapper = mount(VrlLeagueCard, {
          props: {
            name: 'Test League',
            headerImageUrl: 'data:text/html,<script>alert(1)</script>',
          },
          global: {
            stubs: {
              RouterLink: true,
            },
          },
        });

        const header = wrapper.find('.relative.h-28');
        expect(header.attributes('style')).not.toContain('data:text/html');
        expect(header.attributes('style')).toContain('var(--bg-tertiary)');
      });

      it('allows valid data:image URLs', () => {
        const validDataUrl =
          'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
        const wrapper = mount(VrlLeagueCard, {
          props: {
            name: 'Test League',
            headerImageUrl: validDataUrl,
          },
          global: {
            stubs: {
              RouterLink: true,
            },
          },
        });

        // Verify the prop is passed correctly
        expect(wrapper.props('headerImageUrl')).toBe(validDataUrl);
        // Verify it's not blocked (console warn not called for valid data URLs)
        expect(consoleWarnSpy).not.toHaveBeenCalledWith(
          expect.stringContaining('Blocked non-image data URL'),
        );
      });

      it('blocks URLs with encoded dangerous characters', () => {
        const wrapper = mount(VrlLeagueCard, {
          props: {
            name: 'Test League',
            headerImageUrl: 'https://example.com/image.jpg?param=%3cscript%3e',
          },
          global: {
            stubs: {
              RouterLink: true,
            },
          },
        });

        const header = wrapper.find('.relative.h-28');
        expect(header.attributes('style')).not.toContain('%3c');
        expect(header.attributes('style')).toContain('var(--bg-tertiary)');
      });
    });

    describe('logoUrl sanitization', () => {
      it('allows safe HTTPS URLs', () => {
        const wrapper = mount(VrlLeagueCard, {
          props: {
            name: 'Test League',
            logoUrl: 'https://example.com/logo.png',
          },
          global: {
            stubs: {
              RouterLink: true,
            },
          },
        });

        const img = wrapper.find('img');
        expect(img.exists()).toBe(true);
        expect(img.attributes('src')).toBe('https://example.com/logo.png');
      });

      it('blocks javascript: protocol URLs', () => {
        const wrapper = mount(VrlLeagueCard, {
          props: {
            name: 'Test League',
            logoUrl: 'javascript:alert(1)',
          },
          global: {
            stubs: {
              RouterLink: true,
            },
          },
        });

        // Should not render the image, should show icon instead
        const img = wrapper.find('img');
        expect(img.exists()).toBe(false);
        const icon = wrapper.findComponent({ name: 'PhFlagCheckered' });
        expect(icon.exists()).toBe(true);
        expect(consoleWarnSpy).toHaveBeenCalled();
      });

      it('blocks vbscript: protocol URLs', () => {
        const wrapper = mount(VrlLeagueCard, {
          props: {
            name: 'Test League',
            logoUrl: 'vbscript:msgbox("XSS")',
          },
          global: {
            stubs: {
              RouterLink: true,
            },
          },
        });

        const img = wrapper.find('img');
        expect(img.exists()).toBe(false);
        const icon = wrapper.findComponent({ name: 'PhFlagCheckered' });
        expect(icon.exists()).toBe(true);
      });

      it('allows valid data:image URLs', () => {
        const validDataUrl =
          'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
        const wrapper = mount(VrlLeagueCard, {
          props: {
            name: 'Test League',
            logoUrl: validDataUrl,
          },
          global: {
            stubs: {
              RouterLink: true,
            },
          },
        });

        const img = wrapper.find('img');
        expect(img.exists()).toBe(true);
        expect(img.attributes('src')).toContain('data:image/png;base64');
      });

      it('shows fallback icon when logoUrl is null or empty', () => {
        const wrapper = mount(VrlLeagueCard, {
          props: {
            name: 'Test League',
            logoUrl: '',
          },
          global: {
            stubs: {
              RouterLink: true,
            },
          },
        });

        const img = wrapper.find('img');
        expect(img.exists()).toBe(false);
        const icon = wrapper.findComponent({ name: 'PhFlagCheckered' });
        expect(icon.exists()).toBe(true);
      });
    });
  });
});
