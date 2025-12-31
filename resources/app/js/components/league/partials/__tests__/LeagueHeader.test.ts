import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import LeagueHeader from '../LeagueHeader.vue';
import type { League } from '@app/types/league';

const mockLeague: League = {
  id: 1,
  name: 'Test League',
  slug: 'test-league',
  tagline: 'Test tagline',
  description: 'Test description',
  organizer_name: 'Test Organizer',
  contact_email: 'test@example.com',
  logo_url: 'https://example.com/logo.png',
  banner_url: null,
  header_image_url: 'https://example.com/header.png',
  timezone: 'America/New_York',
  visibility: 'public',
  platform_ids: [],
  platforms: [],
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

describe('LeagueHeader', () => {
  it('renders league name', () => {
    const wrapper = mount(LeagueHeader, {
      props: { league: mockLeague },
    });

    expect(wrapper.text()).toContain('Test League');
  });

  it('renders header image when provided', () => {
    const wrapper = mount(LeagueHeader, {
      props: { league: mockLeague },
    });

    const headerImage = wrapper.find('img[alt="Test League"]');
    expect(headerImage.exists()).toBe(true);
  });

  it('renders gradient fallback when no header image', () => {
    const leagueWithoutHeader = { ...mockLeague, header_image_url: null };
    const wrapper = mount(LeagueHeader, {
      props: { league: leagueWithoutHeader },
    });

    const gradient = wrapper.find('.bg-gradient-to-br');
    expect(gradient.exists()).toBe(true);
  });

  it('renders logo image', () => {
    const wrapper = mount(LeagueHeader, {
      props: { league: mockLeague },
    });

    const logo = wrapper.find('img[alt="Test League logo"]');
    expect(logo.exists()).toBe(true);
  });

  it('renders visibility tag', () => {
    const wrapper = mount(LeagueHeader, {
      props: { league: mockLeague },
    });

    expect(wrapper.findComponent({ name: 'LeagueVisibilityTag' }).exists()).toBe(true);
  });

  it('renders edit button', () => {
    const wrapper = mount(LeagueHeader, {
      props: { league: mockLeague },
    });

    const editButton = wrapper.findComponent({ name: 'Button' });
    expect(editButton.exists()).toBe(true);
    expect(editButton.text()).toContain('Edit League');
  });

  it('emits edit event when edit button clicked', async () => {
    const wrapper = mount(LeagueHeader, {
      props: { league: mockLeague },
    });

    const editButton = wrapper.findComponent({ name: 'Button' });
    await editButton.trigger('click');

    expect(wrapper.emitted('edit')).toBeTruthy();
    expect(wrapper.emitted('edit')).toHaveLength(1);
  });
});
