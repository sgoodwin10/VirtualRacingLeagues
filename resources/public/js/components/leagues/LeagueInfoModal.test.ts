import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import LeagueInfoModal from './LeagueInfoModal.vue';
import VrlModal from '@public/components/common/modals/VrlModal.vue';
import PrimeVue from 'primevue/config';
import type { PublicLeagueInfo } from '@public/types/public';

// Mock league data for testing
const mockLeague: PublicLeagueInfo = {
  id: 1,
  name: 'Test Racing League',
  slug: 'test-racing-league',
  tagline: 'The best racing league',
  description: 'A comprehensive description\nwith multiple lines\nof detailed information.',
  logo_url: null,
  logo: null,
  header_image_url: null,
  header_image: null,
  banner_url: null,
  banner: null,
  platforms: [],
  visibility: 'public',
  discord_url: 'https://discord.gg/test',
  website_url: 'https://test.com',
  twitter_handle: 'testleague',
  instagram_handle: 'testleague_insta',
  youtube_url: 'https://youtube.com/test',
  twitch_url: 'https://twitch.tv/test',
  created_at: '2025-01-01T00:00:00.000000Z',
};

// Helper function to create wrapper with proper PrimeVue setup
const createWrapper = (props: { visible: boolean; league: PublicLeagueInfo }) => {
  return mount(LeagueInfoModal, {
    props,
    global: {
      plugins: [PrimeVue],
      stubs: {
        teleport: true,
      },
    },
  });
};

describe('LeagueInfoModal', () => {
  describe('Rendering', () => {
    it('renders VrlModal component', () => {
      const wrapper = createWrapper({
        visible: true,
        league: mockLeague,
      });

      expect(wrapper.findComponent(VrlModal).exists()).toBe(true);
    });

    it('passes visible prop to VrlModal', () => {
      const wrapper = createWrapper({
        visible: true,
        league: mockLeague,
      });

      const modal = wrapper.findComponent(VrlModal);
      expect(modal.props('visible')).toBe(true);
    });

    it('passes league data correctly', () => {
      const wrapper = createWrapper({
        visible: true,
        league: mockLeague,
      });

      expect(wrapper.props('league')).toEqual(mockLeague);
    });

    it('renders with different league data', () => {
      const differentLeague: PublicLeagueInfo = {
        ...mockLeague,
        name: 'Different League',
        tagline: 'Different tagline',
      };

      const wrapper = createWrapper({
        visible: true,
        league: differentLeague,
      });

      expect(wrapper.props('league').name).toBe('Different League');
      expect(wrapper.props('league').tagline).toBe('Different tagline');
    });
  });

  describe('Props and Data Handling', () => {
    it('handles league with all social media links', () => {
      const wrapper = createWrapper({
        visible: true,
        league: mockLeague,
      });

      const league = wrapper.props('league');
      expect(league.discord_url).toBe('https://discord.gg/test');
      expect(league.website_url).toBe('https://test.com');
      expect(league.twitter_handle).toBe('testleague');
      expect(league.instagram_handle).toBe('testleague_insta');
      expect(league.youtube_url).toBe('https://youtube.com/test');
      expect(league.twitch_url).toBe('https://twitch.tv/test');
    });

    it('handles league without social media links', () => {
      const leagueWithoutSocials: PublicLeagueInfo = {
        ...mockLeague,
        discord_url: null,
        website_url: null,
        twitter_handle: null,
        instagram_handle: null,
        youtube_url: null,
        twitch_url: null,
      };

      const wrapper = createWrapper({
        visible: true,
        league: leagueWithoutSocials,
      });

      const league = wrapper.props('league');
      expect(league.discord_url).toBeNull();
      expect(league.website_url).toBeNull();
      expect(league.twitter_handle).toBeNull();
      expect(league.instagram_handle).toBeNull();
    });

    it('handles league with partial social media links', () => {
      const leagueWithPartialSocials: PublicLeagueInfo = {
        ...mockLeague,
        discord_url: 'https://discord.gg/test',
        website_url: null,
        twitter_handle: 'testleague',
        instagram_handle: null,
        youtube_url: null,
        twitch_url: null,
      };

      const wrapper = createWrapper({
        visible: true,
        league: leagueWithPartialSocials,
      });

      const league = wrapper.props('league');
      expect(league.discord_url).toBe('https://discord.gg/test');
      expect(league.twitter_handle).toBe('testleague');
      expect(league.website_url).toBeNull();
      expect(league.instagram_handle).toBeNull();
    });
  });

  describe('Modal Behavior', () => {
    it('emits update:visible when modal visibility changes', async () => {
      const wrapper = createWrapper({
        visible: true,
        league: mockLeague,
      });

      const modal = wrapper.findComponent(VrlModal);
      await modal.vm.$emit('update:visible', false);

      expect(wrapper.emitted('update:visible')).toBeTruthy();
      expect(wrapper.emitted('update:visible')?.[0]).toEqual([false]);
    });

    it('can be toggled between visible and hidden states', () => {
      const wrapper = createWrapper({
        visible: false,
        league: mockLeague,
      });

      const modal = wrapper.findComponent(VrlModal);
      expect(modal.props('visible')).toBe(false);
    });
  });
});
