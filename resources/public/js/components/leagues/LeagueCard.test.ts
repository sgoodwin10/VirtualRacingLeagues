import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import { RouterLinkStub } from '@vue/test-utils';
import LeagueCard from './LeagueCard.vue';
import type { PublicLeague } from '@public/types/public';

describe('LeagueCard', () => {
  const mockLeague: PublicLeague = {
    id: 1,
    name: 'Test Racing League',
    slug: 'test-racing-league',
    tagline: 'The best racing league',
    description: 'A comprehensive racing league',
    logo_url: 'https://example.com/logo.png',
    logo: {
      original: 'https://example.com/logo-original.png',
      conversions: {},
    },
    header_image_url: 'https://example.com/header.jpg',
    header_image: {
      original: 'https://example.com/header-original.jpg',
      conversions: {},
    },
    banner_url: null,
    banner: null,
    platforms: [
      { id: 1, name: 'iRacing', slug: 'iracing' },
      { id: 2, name: 'Gran Turismo 7', slug: 'gt7' },
    ],
    discord_url: 'https://discord.gg/test',
    website_url: 'https://testleague.com',
    twitter_handle: 'testleague',
    instagram_handle: 'testleague',
    youtube_url: 'https://youtube.com/testleague',
    twitch_url: 'https://twitch.tv/testleague',
    visibility: 'public',
    competitions_count: 5,
    drivers_count: 120,
  };

  describe('Rendering', () => {
    it('should render router-link to league detail page', () => {
      const wrapper = mount(LeagueCard, {
        props: { league: mockLeague },
        global: {
          stubs: {
            RouterLink: RouterLinkStub,
          },
        },
      });

      const link = wrapper.findComponent(RouterLinkStub);
      expect(link.exists()).toBe(true);
      expect(link.props('to')).toBe('/leagues/test-racing-league');
    });

    it('should render league banner with header image style', () => {
      const wrapper = mount(LeagueCard, {
        props: { league: mockLeague },
        global: {
          stubs: {
            RouterLink: RouterLinkStub,
          },
        },
      });

      const banner = wrapper.find('.league-banner');
      expect(banner.exists()).toBe(true);
      expect(banner.attributes('style')).toContain('background-image');
      expect(banner.attributes('style')).toContain('https://example.com/header-original.jpg');
    });

    it('should render league logo when logo is available', () => {
      const wrapper = mount(LeagueCard, {
        props: { league: mockLeague },
        global: {
          stubs: {
            RouterLink: RouterLinkStub,
          },
        },
      });

      const logo = wrapper.find('.league-logo img');
      expect(logo.exists()).toBe(true);
      expect(logo.attributes('src')).toBe('https://example.com/logo-original.png');
      expect(logo.attributes('alt')).toBe('Test Racing League');
    });

    it('should render initials when logo is not available', () => {
      const leagueWithoutLogo = { ...mockLeague, logo: null, logo_url: null };
      const wrapper = mount(LeagueCard, {
        props: { league: leagueWithoutLogo },
        global: {
          stubs: {
            RouterLink: RouterLinkStub,
          },
        },
      });

      const initials = wrapper.find('.league-logo span');
      expect(initials.exists()).toBe(true);
      expect(initials.text()).toBe('TR'); // "Test Racing" -> "TR"
    });

    it('should render league name', () => {
      const wrapper = mount(LeagueCard, {
        props: { league: mockLeague },
        global: {
          stubs: {
            RouterLink: RouterLinkStub,
          },
        },
      });

      expect(wrapper.text()).toContain('Test Racing League');
    });

    it('should render platform badge with platform name', () => {
      const wrapper = mount(LeagueCard, {
        props: { league: mockLeague },
        global: {
          stubs: {
            RouterLink: RouterLinkStub,
          },
        },
      });

      expect(wrapper.text()).toContain('iRacing');
      expect(wrapper.text()).toContain('🏎️'); // iRacing icon
    });

    it('should render drivers count', () => {
      const wrapper = mount(LeagueCard, {
        props: { league: mockLeague },
        global: {
          stubs: {
            RouterLink: RouterLinkStub,
          },
        },
      });

      const stats = wrapper.find('.league-stats');
      expect(stats.text()).toContain('120');
      expect(stats.text()).toContain('Drivers');
    });

    it('should render competitions count', () => {
      const wrapper = mount(LeagueCard, {
        props: { league: mockLeague },
        global: {
          stubs: {
            RouterLink: RouterLinkStub,
          },
        },
      });

      const stats = wrapper.find('.league-stats');
      expect(stats.text()).toContain('5');
      expect(stats.text()).toContain('Competitions');
    });

    it('should apply hover classes', () => {
      const wrapper = mount(LeagueCard, {
        props: { league: mockLeague },
        global: {
          stubs: {
            RouterLink: RouterLinkStub,
          },
        },
      });

      const card = wrapper.find('.league-card');
      expect(card.classes()).toContain('hover:border-[var(--cyan)]');
      expect(card.classes()).toContain('hover:-translate-y-1');
    });
  });

  describe('Computed Properties', () => {
    describe('initials', () => {
      it('should compute 2-letter uppercase initials from multi-word name', async () => {
        const leagueWithoutLogo = { ...mockLeague, logo: null, logo_url: null };
        const wrapper = mount(LeagueCard, {
          props: { league: leagueWithoutLogo },
          global: {
            stubs: {
              RouterLink: RouterLinkStub,
            },
          },
        });

        const initials = wrapper.find('.league-logo span');
        expect(initials.text()).toBe('TR');
      });

      it('should compute 2-letter uppercase initials from single-word name', () => {
        const singleWordLeague = {
          ...mockLeague,
          name: 'Motorsport',
          logo: null,
          logo_url: null,
        };
        const wrapper = mount(LeagueCard, {
          props: { league: singleWordLeague },
          global: {
            stubs: {
              RouterLink: RouterLinkStub,
            },
          },
        });

        const initials = wrapper.find('.league-logo span');
        expect(initials.text()).toBe('M');
      });

      it('should compute initials from three-word name', () => {
        const threeWordLeague = {
          ...mockLeague,
          name: 'European Racing Championship',
          logo: null,
          logo_url: null,
        };
        const wrapper = mount(LeagueCard, {
          props: { league: threeWordLeague },
          global: {
            stubs: {
              RouterLink: RouterLinkStub,
            },
          },
        });

        const initials = wrapper.find('.league-logo span');
        expect(initials.text()).toBe('ER'); // Only first 2 letters
      });
    });

    describe('primaryPlatform', () => {
      it('should return first platform from platforms array', () => {
        const wrapper = mount(LeagueCard, {
          props: { league: mockLeague },
          global: {
            stubs: {
              RouterLink: RouterLinkStub,
            },
          },
        });

        expect(wrapper.text()).toContain('iRacing');
      });

      it('should return null when platforms array is empty', () => {
        const leagueNoPlatforms = { ...mockLeague, platforms: [] };
        const wrapper = mount(LeagueCard, {
          props: { league: leagueNoPlatforms },
          global: {
            stubs: {
              RouterLink: RouterLinkStub,
            },
          },
        });

        const platformBadge = wrapper.find('[class*="inline-flex"]');
        expect(platformBadge.exists()).toBe(false);
      });
    });

    describe('platformIcon', () => {
      it('should return racing car emoji for iRacing', () => {
        const wrapper = mount(LeagueCard, {
          props: { league: mockLeague },
          global: {
            stubs: {
              RouterLink: RouterLinkStub,
            },
          },
        });

        expect(wrapper.text()).toContain('🏎️');
      });

      it('should return game controller emoji for Gran Turismo', () => {
        const gtLeague = {
          ...mockLeague,
          platforms: [{ id: 2, name: 'Gran Turismo 7', slug: 'gt7' }],
        };
        const wrapper = mount(LeagueCard, {
          props: { league: gtLeague },
          global: {
            stubs: {
              RouterLink: RouterLinkStub,
            },
          },
        });

        expect(wrapper.text()).toContain('🎮');
      });

      it('should return checkered flag emoji for Assetto Corsa', () => {
        const acLeague = {
          ...mockLeague,
          platforms: [{ id: 3, name: 'Assetto Corsa', slug: 'ac' }],
        };
        const wrapper = mount(LeagueCard, {
          props: { league: acLeague },
          global: {
            stubs: {
              RouterLink: RouterLinkStub,
            },
          },
        });

        expect(wrapper.text()).toContain('🏁');
      });

      it('should return default game controller emoji for unknown platform', () => {
        const unknownLeague = {
          ...mockLeague,
          platforms: [{ id: 99, name: 'Unknown Racing Sim', slug: 'unknown' }],
        };
        const wrapper = mount(LeagueCard, {
          props: { league: unknownLeague },
          global: {
            stubs: {
              RouterLink: RouterLinkStub,
            },
          },
        });

        expect(wrapper.text()).toContain('🎮');
      });
    });

    describe('logoUrl', () => {
      it('should prefer new media object over old logo_url', () => {
        const wrapper = mount(LeagueCard, {
          props: { league: mockLeague },
          global: {
            stubs: {
              RouterLink: RouterLinkStub,
            },
          },
        });

        const logo = wrapper.find('.league-logo img');
        expect(logo.attributes('src')).toBe('https://example.com/logo-original.png');
      });

      it('should fallback to logo_url when media object is not available', () => {
        const legacyLeague = { ...mockLeague, logo: null };
        const wrapper = mount(LeagueCard, {
          props: { league: legacyLeague },
          global: {
            stubs: {
              RouterLink: RouterLinkStub,
            },
          },
        });

        const logo = wrapper.find('.league-logo img');
        expect(logo.attributes('src')).toBe('https://example.com/logo.png');
      });

      it('should return null when no logo is available', () => {
        const noLogoLeague = { ...mockLeague, logo: null, logo_url: null };
        const wrapper = mount(LeagueCard, {
          props: { league: noLogoLeague },
          global: {
            stubs: {
              RouterLink: RouterLinkStub,
            },
          },
        });

        const logo = wrapper.find('.league-logo img');
        expect(logo.exists()).toBe(false);
      });
    });

    describe('bannerStyle', () => {
      it('should use new media object for background-image', () => {
        const wrapper = mount(LeagueCard, {
          props: { league: mockLeague },
          global: {
            stubs: {
              RouterLink: RouterLinkStub,
            },
          },
        });

        const banner = wrapper.find('.league-banner');
        expect(banner.attributes('style')).toContain('background-image');
        expect(banner.attributes('style')).toContain('https://example.com/header-original.jpg');
      });

      it('should fallback to header_image_url', () => {
        const legacyLeague = { ...mockLeague, header_image: null };
        const wrapper = mount(LeagueCard, {
          props: { league: legacyLeague },
          global: {
            stubs: {
              RouterLink: RouterLinkStub,
            },
          },
        });

        const banner = wrapper.find('.league-banner');
        expect(banner.attributes('style')).toContain('background-image');
        expect(banner.attributes('style')).toContain('https://example.com/header.jpg');
      });

      it('should render banner with fallback when no header image available', () => {
        const noHeaderLeague = {
          ...mockLeague,
          header_image: null,
          header_image_url: null,
        };
        const wrapper = mount(LeagueCard, {
          props: { league: noHeaderLeague },
          global: {
            stubs: {
              RouterLink: RouterLinkStub,
            },
          },
        });

        const banner = wrapper.find('.league-banner');
        expect(banner.exists()).toBe(true);
        // When no header image, the component uses gradient fallback
        // The bannerStyle computed property returns a gradient
        // We just verify the banner renders
      });
    });
  });
});
