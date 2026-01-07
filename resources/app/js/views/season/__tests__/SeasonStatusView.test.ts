import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import SeasonStatusView from '../SeasonStatusView.vue';
import { useSeasonStore } from '@app/stores/seasonStore';
import type { Season } from '@app/types/season';

// Mock vue-router
vi.mock('vue-router', () => ({
  useRoute: () => ({
    params: {
      seasonId: '1',
      leagueId: '1',
      competitionId: '1',
    },
  }),
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

describe('SeasonStatusView', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('renders loading state when season is not loaded', () => {
    const wrapper = mount(SeasonStatusView);

    expect(wrapper.text()).toContain('Loading season data...');
  });

  it('renders season information when season is loaded', () => {
    const seasonStore = useSeasonStore();
    const mockSeason: Season = {
      id: 1,
      name: 'Test Season',
      status: 'active',
      startDate: '2024-01-01',
      endDate: '2024-12-31',
      competitionId: 1,
      leagueId: 1,
      createdAt: '2024-01-01',
      updatedAt: '2024-01-01',
    };

    seasonStore.currentSeason = mockSeason;

    const wrapper = mount(SeasonStatusView);

    expect(wrapper.text()).toContain('Season Status');
    expect(wrapper.text()).toContain('Test Season');
    expect(wrapper.text()).toContain('active');
  });

  it('displays formatted dates when available', () => {
    const seasonStore = useSeasonStore();
    const mockSeason: Season = {
      id: 1,
      name: 'Test Season',
      status: 'active',
      startDate: '2024-01-01',
      endDate: '2024-12-31',
      competitionId: 1,
      leagueId: 1,
      createdAt: '2024-01-01',
      updatedAt: '2024-01-01',
    };

    seasonStore.currentSeason = mockSeason;

    const wrapper = mount(SeasonStatusView);

    // Check that dates are displayed (exact format may vary by locale)
    expect(wrapper.text()).toContain('Start Date:');
    expect(wrapper.text()).toContain('End Date:');
  });

  it('renders the placeholder content structure', () => {
    const seasonStore = useSeasonStore();
    const mockSeason: Season = {
      id: 1,
      name: 'Test Season',
      status: 'active',
      startDate: '2024-01-01',
      endDate: '2024-12-31',
      competitionId: 1,
      leagueId: 1,
      createdAt: '2024-01-01',
      updatedAt: '2024-01-01',
    };

    seasonStore.currentSeason = mockSeason;

    const wrapper = mount(SeasonStatusView);

    expect(wrapper.text()).toContain('Season Information');
    expect(wrapper.text()).toContain('Season Name:');
    expect(wrapper.text()).toContain('Status:');
  });
});
