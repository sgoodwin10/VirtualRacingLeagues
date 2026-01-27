import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import LeagueStatsBar from './LeagueStatsBar.vue';
import type { League } from '@app/types/league';

const mockLeague: League = {
  id: 1,
  name: 'Test League',
  slug: 'test-league',
  tagline: null,
  description: null,
  organizer_name: 'Test Organizer',
  contact_email: 'test@example.com',
  logo_url: null,
  banner_url: null,
  header_image_url: null,
  timezone: 'America/New_York',
  visibility: 'public',
  platform_ids: [1, 2],
  platforms: [
    { id: 1, name: 'PC', slug: 'pc' },
    { id: 2, name: 'PlayStation', slug: 'playstation' },
  ],
  owner_user_id: 1,
  status: 'active',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  competitions_count: 5,
  drivers_count: 10,
  active_seasons_count: 2,
  total_races_count: 15,
  discord_url: null,
  website_url: null,
  twitter_handle: null,
  instagram_handle: null,
  youtube_url: null,
  twitch_url: null,
};

describe('LeagueStatsBar', () => {
  it('renders platform names', () => {
    const wrapper = mount(LeagueStatsBar, {
      props: { league: mockLeague },
    });

    expect(wrapper.text()).toContain('PC, PlayStation');
  });

  it('shows "No platforms" when platforms array is empty', () => {
    const leagueWithoutPlatforms = { ...mockLeague, platforms: [] };
    const wrapper = mount(LeagueStatsBar, {
      props: { league: leagueWithoutPlatforms },
    });

    expect(wrapper.text()).toContain('No platforms');
  });

  it('renders timezone', () => {
    const wrapper = mount(LeagueStatsBar, {
      props: { league: mockLeague },
    });

    expect(wrapper.text()).toContain('America/New_York');
  });

  it('renders competitions count', () => {
    const wrapper = mount(LeagueStatsBar, {
      props: { league: mockLeague },
    });

    expect(wrapper.text()).toContain('5 Competitions');
  });

  it('renders singular competition text when count is 1', () => {
    const leagueWithOneCompetition = { ...mockLeague, competitions_count: 1 };
    const wrapper = mount(LeagueStatsBar, {
      props: { league: leagueWithOneCompetition },
    });

    expect(wrapper.text()).toContain('1 Competition');
  });

  it('renders drivers count', () => {
    const wrapper = mount(LeagueStatsBar, {
      props: { league: mockLeague },
    });

    expect(wrapper.text()).toContain('10 Drivers');
  });

  it('renders singular driver text when count is 1', () => {
    const leagueWithOneDriver = { ...mockLeague, drivers_count: 1 };
    const wrapper = mount(LeagueStatsBar, {
      props: { league: leagueWithOneDriver },
    });

    expect(wrapper.text()).toContain('1 Driver');
  });

  it('renders all four info items', () => {
    const wrapper = mount(LeagueStatsBar, {
      props: { league: mockLeague },
    });

    const infoItems = wrapper.findAllComponents({ name: 'InfoItem' });
    expect(infoItems).toHaveLength(4);
  });
});
