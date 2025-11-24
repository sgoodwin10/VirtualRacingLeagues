import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import LeagueSocialMediaPanel from '../LeagueSocialMediaPanel.vue';
import type { League } from '@app/types/league';

const mockLeagueWithDates: League = {
  id: 1,
  name: 'Test League',
  slug: 'test-league',
  tagline: null,
  description: null,
  organizer_name: 'Test Organizer',
  contact_email: 'test@example.com',
  logo_url: null,
  header_image_url: null,
  timezone: 'America/New_York',
  visibility: 'public',
  platform_ids: [],
  platforms: [],
  owner_user_id: 1,
  status: 'active',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-15T00:00:00Z',
  competitions_count: 0,
  drivers_count: 0,
  discord_url: 'https://discord.gg/test',
  website_url: 'https://example.com',
  twitter_handle: '@testleague',
  instagram_handle: '@testleague',
  youtube_url: 'https://youtube.com/test',
  twitch_url: 'https://twitch.tv/test',
};

describe('LeagueSocialMediaPanel', () => {
  it('renders created date', () => {
    const wrapper = mount(LeagueSocialMediaPanel, {
      props: { league: mockLeagueWithDates },
    });

    expect(wrapper.text()).toContain('Created');
  });

  it('renders updated date', () => {
    const wrapper = mount(LeagueSocialMediaPanel, {
      props: { league: mockLeagueWithDates },
    });

    expect(wrapper.text()).toContain('Last Updated');
  });

  it('renders discord link when provided', () => {
    const wrapper = mount(LeagueSocialMediaPanel, {
      props: { league: mockLeagueWithDates },
    });

    const discordLink = wrapper.find('a[href="https://discord.gg/test"]');
    expect(discordLink.exists()).toBe(true);
    expect(wrapper.text()).toContain('Discord');
  });

  it('renders website link when provided', () => {
    const wrapper = mount(LeagueSocialMediaPanel, {
      props: { league: mockLeagueWithDates },
    });

    const websiteLink = wrapper.find('a[href="https://example.com"]');
    expect(websiteLink.exists()).toBe(true);
    expect(wrapper.text()).toContain('Website');
  });

  it('renders twitter link when provided', () => {
    const wrapper = mount(LeagueSocialMediaPanel, {
      props: { league: mockLeagueWithDates },
    });

    const twitterLink = wrapper.find('a[href="https://twitter.com/testleague"]');
    expect(twitterLink.exists()).toBe(true);
    expect(wrapper.text()).toContain('Twitter');
  });

  it('strips @ from twitter handle in URL', () => {
    const leagueWithAt = {
      ...mockLeagueWithDates,
      twitter_handle: '@testleague',
    };
    const wrapper = mount(LeagueSocialMediaPanel, {
      props: { league: leagueWithAt },
    });

    const twitterLink = wrapper.find('a[href="https://twitter.com/testleague"]');
    expect(twitterLink.exists()).toBe(true);
  });

  it('renders instagram link when provided', () => {
    const wrapper = mount(LeagueSocialMediaPanel, {
      props: { league: mockLeagueWithDates },
    });

    const instagramLink = wrapper.find('a[href="https://instagram.com/testleague"]');
    expect(instagramLink.exists()).toBe(true);
    expect(wrapper.text()).toContain('Instagram');
  });

  it('renders youtube link when provided', () => {
    const wrapper = mount(LeagueSocialMediaPanel, {
      props: { league: mockLeagueWithDates },
    });

    const youtubeLink = wrapper.find('a[href="https://youtube.com/test"]');
    expect(youtubeLink.exists()).toBe(true);
    expect(wrapper.text()).toContain('YouTube');
  });

  it('renders twitch link when provided', () => {
    const wrapper = mount(LeagueSocialMediaPanel, {
      props: { league: mockLeagueWithDates },
    });

    const twitchLink = wrapper.find('a[href="https://twitch.tv/test"]');
    expect(twitchLink.exists()).toBe(true);
    expect(wrapper.text()).toContain('Twitch');
  });

  it('does not render social panel when no social links', () => {
    const leagueWithoutSocial: League = {
      ...mockLeagueWithDates,
      discord_url: null,
      website_url: null,
      twitter_handle: null,
      instagram_handle: null,
      youtube_url: null,
      twitch_url: null,
    };
    const wrapper = mount(LeagueSocialMediaPanel, {
      props: { league: leagueWithoutSocial },
    });

    // Should only have one BasePanel (the dates one)
    const panels = wrapper.findAllComponents({ name: 'BasePanel' });
    expect(panels).toHaveLength(1);
  });

  it('renders both panels when social links exist', () => {
    const wrapper = mount(LeagueSocialMediaPanel, {
      props: { league: mockLeagueWithDates },
    });

    const panels = wrapper.findAllComponents({ name: 'BasePanel' });
    expect(panels).toHaveLength(2);
  });
});
