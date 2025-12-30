import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { createRouter, createMemoryHistory } from 'vue-router';
import Sidebar from '@app/components/layout/Sidebar.vue';
import { useNavigationStore } from '@app/stores/navigationStore';
import type { Season, SeasonCompetition } from '@app/types/season';

describe('Sidebar.vue', () => {
  let router: ReturnType<typeof createRouter>;

  beforeEach(() => {
    setActivePinia(createPinia());

    router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/', name: 'home', component: { template: '<div>Home</div>' } },
        {
          path: '/leagues/:id',
          name: 'league-detail',
          component: { template: '<div>League</div>' },
        },
        {
          path: '/leagues/:leagueId/competitions/:competitionId/seasons/:seasonId',
          name: 'season-detail',
          component: { template: '<div>Season</div>' },
        },
      ],
    });
  });

  it('renders when showSidebar is true', () => {
    const navigationStore = useNavigationStore();
    navigationStore.setShowSidebar(true);

    const wrapper = mount(Sidebar, {
      global: {
        plugins: [router],
        stubs: {
          SidebarLink: true,
        },
      },
    });

    expect(wrapper.find('.sidebar').exists()).toBe(true);
  });

  it('does not render when showSidebar is false', () => {
    const navigationStore = useNavigationStore();
    navigationStore.setShowSidebar(false);

    const wrapper = mount(Sidebar, {
      global: {
        plugins: [router],
        stubs: {
          SidebarLink: true,
        },
      },
    });

    expect(wrapper.find('.sidebar').exists()).toBe(false);
  });

  it('displays competition and season name in header', () => {
    const navigationStore = useNavigationStore();
    navigationStore.setShowSidebar(true);

    const mockCompetition: SeasonCompetition = {
      id: 1,
      name: 'Test Championship',
      slug: 'test-championship',
      platform_id: 1,
      logo_url: 'https://example.com/logo.png',
      competition_colour: null,
    };

    const mockSeason: Season = {
      id: 1,
      name: '2024 Season',
      slug: '2024-season',
      competition_id: 1,
      car_class: null,
      description: null,
      technical_specs: null,
      logo_url: 'https://example.com/logo.png',
      has_own_logo: false,
      banner_url: null,
      has_own_banner: false,
      race_divisions_enabled: false,
      team_championship_enabled: false,
      race_times_required: false,
      drop_round: false,
      total_drop_rounds: 0,
      teams_drivers_for_calculation: null,
      teams_drop_rounds: false,
      teams_total_drop_rounds: null,
      round_totals_tiebreaker_rules_enabled: false,
      status: 'active',
      is_setup: false,
      is_active: true,
      is_completed: false,
      is_archived: false,
      is_deleted: false,
      created_at: '2024-01-01',
      updated_at: '2024-01-01',
      deleted_at: null,
      created_by_user_id: 1,
      stats: {
        total_drivers: 20,
        active_drivers: 20,
        total_races: 10,
        completed_races: 0,
        total_rounds: 10,
      },
    };

    navigationStore.setCompetitionData(mockCompetition, mockSeason);

    const wrapper = mount(Sidebar, {
      global: {
        plugins: [router],
        stubs: {
          SidebarLink: true,
        },
      },
    });

    expect(wrapper.find('.sidebar-title').text()).toContain('Test Championship');
    expect(wrapper.find('.sidebar-subtitle').text()).toBe('2024 Season');
  });

  it('displays navigation section label', () => {
    const navigationStore = useNavigationStore();
    navigationStore.setShowSidebar(true);
    navigationStore.setCompetitionContext(1, 1, 1);

    const mockCompetition: SeasonCompetition = {
      id: 1,
      name: 'Test Championship',
      slug: 'test-championship',
      platform_id: 1,
      logo_url: 'https://example.com/logo.png',
      competition_colour: null,
    };

    const mockSeason: Season = {
      id: 1,
      name: '2024 Season',
      slug: '2024-season',
      competition_id: 1,
      car_class: null,
      description: null,
      technical_specs: null,
      logo_url: 'https://example.com/logo.png',
      has_own_logo: false,
      banner_url: null,
      has_own_banner: false,
      race_divisions_enabled: false,
      team_championship_enabled: false,
      race_times_required: false,
      drop_round: false,
      total_drop_rounds: 0,
      teams_drivers_for_calculation: null,
      teams_drop_rounds: false,
      teams_total_drop_rounds: null,
      round_totals_tiebreaker_rules_enabled: false,
      status: 'active',
      is_setup: false,
      is_active: true,
      is_completed: false,
      is_archived: false,
      is_deleted: false,
      created_at: '2024-01-01',
      updated_at: '2024-01-01',
      deleted_at: null,
      created_by_user_id: 1,
      stats: {
        total_drivers: 20,
        active_drivers: 20,
        total_races: 10,
        completed_races: 0,
        total_rounds: 10,
      },
    };

    navigationStore.setCompetitionData(mockCompetition, mockSeason);

    const wrapper = mount(Sidebar, {
      global: {
        plugins: [router],
        stubs: {
          SidebarLink: true,
        },
      },
    });

    expect(wrapper.find('.sidebar-label').exists()).toBe(true);
    expect(wrapper.find('.sidebar-label').text()).toBe('Navigation');
  });

  it('displays navigation links when in competition context', async () => {
    const navigationStore = useNavigationStore();
    navigationStore.setShowSidebar(true);
    navigationStore.setCompetitionContext(1, 1, 1);

    const mockCompetition: SeasonCompetition = {
      id: 1,
      name: 'Test Championship',
      slug: 'test-championship',
      platform_id: 1,
      logo_url: 'https://example.com/logo.png',
      competition_colour: null,
    };

    const mockSeason: Season = {
      id: 1,
      name: '2024 Season',
      slug: '2024-season',
      competition_id: 1,
      car_class: null,
      description: null,
      technical_specs: null,
      logo_url: 'https://example.com/logo.png',
      has_own_logo: false,
      banner_url: null,
      has_own_banner: false,
      race_divisions_enabled: false,
      team_championship_enabled: false,
      race_times_required: false,
      drop_round: false,
      total_drop_rounds: 0,
      teams_drivers_for_calculation: null,
      teams_drop_rounds: false,
      teams_total_drop_rounds: null,
      round_totals_tiebreaker_rules_enabled: false,
      status: 'active',
      is_setup: false,
      is_active: true,
      is_completed: false,
      is_archived: false,
      is_deleted: false,
      created_at: '2024-01-01',
      updated_at: '2024-01-01',
      deleted_at: null,
      created_by_user_id: 1,
      stats: {
        total_drivers: 20,
        active_drivers: 20,
        total_races: 10,
        completed_races: 0,
        total_rounds: 10,
      },
    };

    navigationStore.setCompetitionData(mockCompetition, mockSeason);

    const wrapper = mount(Sidebar, {
      global: {
        plugins: [router],
        stubs: {
          SidebarLink: {
            template: '<a>{{ label }}</a>',
            props: ['to', 'label', 'icon', 'tag'],
          },
        },
      },
    });

    await wrapper.vm.$nextTick();

    const navSection = wrapper.findAll('.sidebar-section').find((section) => {
      const label = section.find('.sidebar-label');
      return label.exists() && label.text() === 'Navigation';
    });

    expect(navSection).toBeDefined();
    if (!navSection) return;

    const links = wrapper.findAll('a');
    const linkTexts = links.map((link) => link.text());

    expect(linkTexts).toContain('Rounds');
    expect(linkTexts).toContain('Standings');
    expect(linkTexts).toContain('Drivers');
    expect(linkTexts).toContain('Divisions & Teams');
    expect(linkTexts).toContain('Settings');
  });

});
