import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import LeagueHeader from './LeagueHeader.vue';
import type { PublicLeagueInfo, LeagueStats, MediaObject } from '@public/types/public';

// Mock league data for testing
const mockLeague: PublicLeagueInfo = {
  id: 1,
  name: 'Test Racing League',
  slug: 'test-racing-league',
  tagline: 'The best racing league',
  description: 'A detailed description of the league',
  logo_url: null,
  logo: null,
  header_image_url: null,
  header_image: null,
  banner_url: null,
  banner: null,
  platforms: [
    {
      id: 1,
      name: 'Gran Turismo 7',
      slug: 'gran-turismo-7',
    },
  ],
  visibility: 'public',
  discord_url: 'https://discord.gg/test',
  website_url: 'https://test.com',
  twitter_handle: 'testleague',
  instagram_handle: 'testleague',
  facebook_handle: 'testleague',
  youtube_url: 'https://youtube.com/test',
  twitch_url: 'https://twitch.tv/test',
  created_at: '2025-01-01T00:00:00.000000Z',
};

const mockStats: LeagueStats = {
  competitions_count: 5,
  active_seasons_count: 3,
  drivers_count: 100,
};

describe('LeagueHeader', () => {
  describe('Rendering', () => {
    it('renders league name correctly', () => {
      const wrapper = mount(LeagueHeader, {
        props: {
          league: mockLeague,
          stats: mockStats,
        },
      });

      expect(wrapper.find('.league-header-name').text()).toBe('Test Racing League');
    });

    it('displays correct stats', () => {
      const wrapper = mount(LeagueHeader, {
        props: {
          league: mockLeague,
          stats: mockStats,
        },
      });

      const metaText = wrapper.find('.league-header-meta').text();
      expect(metaText).toContain('100 Drivers');
      expect(metaText).toContain('5 Competitions');
      expect(metaText).toContain('3 Active Seasons');
    });

    it('shows platform information', () => {
      const wrapper = mount(LeagueHeader, {
        props: {
          league: mockLeague,
          stats: mockStats,
        },
      });

      const metaText = wrapper.find('.league-header-meta').text();
      expect(metaText).toContain('Gran Turismo 7');
    });

    it('displays initials when no logo provided', () => {
      const wrapper = mount(LeagueHeader, {
        props: {
          league: mockLeague,
          stats: mockStats,
        },
      });

      expect(wrapper.find('.league-header-logo').text()).toBe('TR');
    });

    it('displays logo image when provided', () => {
      const leagueWithLogo: PublicLeagueInfo = {
        ...mockLeague,
        logo: {
          id: 1,
          original: 'https://example.com/logo.png',
          conversions: {
            large: 'https://example.com/logo-large.png',
            medium: 'https://example.com/logo-medium.png',
            small: 'https://example.com/logo-small.png',
            thumb: 'https://example.com/logo-thumb.png',
          },
          srcset: '',
        } as MediaObject,
      };

      const wrapper = mount(LeagueHeader, {
        props: {
          league: leagueWithLogo,
          stats: mockStats,
        },
      });

      const img = wrapper.find('.league-header-logo img');
      expect(img.exists()).toBe(true);
      expect(img.attributes('src')).toBe('https://example.com/logo.png');
    });
  });

  describe('Social Media Links', () => {
    it('displays all social media links when available', () => {
      const wrapper = mount(LeagueHeader, {
        props: {
          league: mockLeague,
          stats: mockStats,
        },
      });

      const socials = wrapper.find('.league-header-socials');
      expect(socials.exists()).toBe(true);

      // Check Discord link with text
      const discordLink = wrapper.find('a[href="https://discord.gg/test"]');
      expect(discordLink.exists()).toBe(true);
      expect(discordLink.text()).toContain('Discord');

      // Check Website link with text
      const websiteLink = wrapper.find('a[href="https://test.com"]');
      expect(websiteLink.exists()).toBe(true);
      expect(websiteLink.text()).toContain('Website');

      // Check Twitter link
      const twitterLink = wrapper.find('a[href="https://twitter.com/testleague"]');
      expect(twitterLink.exists()).toBe(true);
      expect(twitterLink.text()).toContain('X');

      // Check Instagram link
      const instagramLink = wrapper.find('a[href="https://instagram.com/testleague"]');
      expect(instagramLink.exists()).toBe(true);
      expect(instagramLink.text()).toContain('Instagram');

      // Check Facebook link
      const facebookLink = wrapper.find('a[href="https://facebook.com/testleague"]');
      expect(facebookLink.exists()).toBe(true);
      expect(facebookLink.text()).toContain('Facebook');

      // Check YouTube link
      const youtubeLink = wrapper.find('a[href="https://youtube.com/test"]');
      expect(youtubeLink.exists()).toBe(true);
      expect(youtubeLink.text()).toContain('YouTube');

      // Check Twitch link
      const twitchLink = wrapper.find('a[href="https://twitch.tv/test"]');
      expect(twitchLink.exists()).toBe(true);
      expect(twitchLink.text()).toContain('Twitch');
    });

    it('hides social links section when no links available', () => {
      const leagueWithoutSocials = {
        ...mockLeague,
        discord_url: null,
        website_url: null,
        twitter_handle: null,
        instagram_handle: null,
        facebook_handle: null,
        youtube_url: null,
        twitch_url: null,
      };

      const wrapper = mount(LeagueHeader, {
        props: {
          league: leagueWithoutSocials,
          stats: mockStats,
        },
      });

      expect(wrapper.find('.league-header-socials').exists()).toBe(false);
    });

    it('shows only available social links', () => {
      const leagueWithPartialSocials = {
        ...mockLeague,
        discord_url: 'https://discord.gg/test',
        website_url: null,
        twitter_handle: null,
        instagram_handle: null,
        facebook_handle: null,
        youtube_url: null,
        twitch_url: null,
      };

      const wrapper = mount(LeagueHeader, {
        props: {
          league: leagueWithPartialSocials,
          stats: mockStats,
        },
      });

      const socials = wrapper.find('.league-header-socials');
      expect(socials.exists()).toBe(true);

      expect(wrapper.find('a[href="https://discord.gg/test"]').exists()).toBe(true);
      expect(wrapper.find('a[href="https://test.com"]').exists()).toBe(false);
      expect(wrapper.find('a[href^="https://twitter.com"]').exists()).toBe(false);
    });

    it('sets correct target and rel attributes on social links', () => {
      const wrapper = mount(LeagueHeader, {
        props: {
          league: mockLeague,
          stats: mockStats,
        },
      });

      const discordLink = wrapper.find('a[href="https://discord.gg/test"]');
      expect(discordLink.attributes('target')).toBe('_blank');
      expect(discordLink.attributes('rel')).toBe('noopener noreferrer');
    });
  });

  describe('About Button', () => {
    it('shows About button when league has tagline', () => {
      const wrapper = mount(LeagueHeader, {
        props: {
          league: mockLeague,
          stats: mockStats,
        },
      });

      // VrlButton component should be present
      const button = wrapper.findComponent({ name: 'Button' });
      expect(button.exists()).toBe(true);
      expect(button.text()).toContain('About');
    });

    it('shows About button when league has description', () => {
      const leagueWithDescription = {
        ...mockLeague,
        tagline: null,
        description: 'A detailed description',
      };

      const wrapper = mount(LeagueHeader, {
        props: {
          league: leagueWithDescription,
          stats: mockStats,
        },
      });

      const button = wrapper.findComponent({ name: 'Button' });
      expect(button.exists()).toBe(true);
    });

    it('hides About button when league has no tagline or description', () => {
      const leagueWithoutAbout = {
        ...mockLeague,
        tagline: null,
        description: null,
      };

      const wrapper = mount(LeagueHeader, {
        props: {
          league: leagueWithoutAbout,
          stats: mockStats,
        },
      });

      const button = wrapper.findComponent({ name: 'Button' });
      expect(button.exists()).toBe(false);
    });

    it('emits open-about event when About button is clicked', async () => {
      const wrapper = mount(LeagueHeader, {
        props: {
          league: mockLeague,
          stats: mockStats,
        },
      });

      const button = wrapper.findComponent({ name: 'Button' });
      await button.trigger('click');

      expect(wrapper.emitted('open-about')).toBeTruthy();
      expect(wrapper.emitted('open-about')?.[0]).toEqual([]);
    });
  });

  describe('Banner', () => {
    it('uses header image when available', () => {
      const leagueWithBanner: PublicLeagueInfo = {
        ...mockLeague,
        header_image: {
          id: 2,
          original: 'https://example.com/banner.jpg',
          conversions: {
            large: 'https://example.com/banner-large.jpg',
            medium: 'https://example.com/banner-medium.jpg',
            small: 'https://example.com/banner-small.jpg',
            thumb: 'https://example.com/banner-thumb.jpg',
          },
          srcset: '',
        } as MediaObject,
      };

      const wrapper = mount(LeagueHeader, {
        props: {
          league: leagueWithBanner,
          stats: mockStats,
        },
      });

      const banner = wrapper.find('.league-header-banner');
      expect(banner.exists()).toBe(true);
      expect(banner.attributes('style')).toContain('background-image');
      expect(banner.attributes('style')).toContain('https://example.com/banner.jpg');
    });

    it('applies banner style when no header image provided', () => {
      const wrapper = mount(LeagueHeader, {
        props: {
          league: mockLeague,
          stats: mockStats,
        },
      });

      // Banner should exist with the class
      const banner = wrapper.find('.league-header-banner');
      expect(banner.exists()).toBe(true);
    });
  });
});
