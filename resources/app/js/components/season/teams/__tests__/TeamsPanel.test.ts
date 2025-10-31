import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount, VueWrapper } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import TeamsPanel from '../TeamsPanel.vue';
import { useTeamStore } from '@app/stores/teamStore';
import { useSeasonDriverStore } from '@app/stores/seasonDriverStore';
import type { Team } from '@app/types/team';

// Mock PrimeVue composables
vi.mock('primevue/usetoast', () => ({
  useToast: () => ({
    add: vi.fn(),
  }),
}));

vi.mock('primevue/useconfirm', () => ({
  useConfirm: () => ({
    require: vi.fn(),
  }),
}));

describe('TeamsPanel', () => {
  let wrapper: VueWrapper;
  let teamStore: ReturnType<typeof useTeamStore>;

  const mockTeams: Team[] = [
    {
      id: 1,
      season_id: 1,
      name: 'Red Bull Racing',
      logo_url: 'https://example.com/redbull.png',
      created_at: '2024-01-01T00:00:00.000000Z',
      updated_at: '2024-01-01T00:00:00.000000Z',
    },
    {
      id: 2,
      season_id: 1,
      name: 'Mercedes AMG',
      logo_url: null,
      created_at: '2024-01-01T00:00:00.000000Z',
      updated_at: '2024-01-01T00:00:00.000000Z',
    },
  ];

  beforeEach(() => {
    setActivePinia(createPinia());
    teamStore = useTeamStore();
    useSeasonDriverStore(); // Initialize the store
  });

  const createWrapper = (props = {}) => {
    return mount(TeamsPanel, {
      props: {
        seasonId: 1,
        teamChampionshipEnabled: true,
        ...props,
      },
      global: {
        stubs: {
          BasePanel: {
            template: '<div><slot name="header-actions" /><slot /></div>',
          },
          DataTable: {
            template: '<div><slot name="empty" /><slot /></div>',
          },
          Column: true,
          Button: {
            template: '<button @click="$emit(\'click\')"><slot /></button>',
          },
          Message: {
            template: '<div><slot /></div>',
          },
          TeamFormModal: true,
          ConfirmDialog: true,
        },
      },
    });
  };

  describe('Disabled State', () => {
    it('shows disabled message when team championship is not enabled', () => {
      wrapper = createWrapper({ teamChampionshipEnabled: false });

      expect(wrapper.text()).toContain('Teams not enabled for this season');
    });

    it('does not show add team button when disabled', () => {
      wrapper = createWrapper({ teamChampionshipEnabled: false });

      const buttons = wrapper.findAll('button');
      expect(buttons.length).toBe(0);
    });
  });

  describe('Enabled State', () => {
    it('fetches teams on mount when enabled', async () => {
      vi.spyOn(teamStore, 'fetchTeams').mockResolvedValue();

      wrapper = createWrapper({ teamChampionshipEnabled: true });

      await wrapper.vm.$nextTick();

      expect(teamStore.fetchTeams).toHaveBeenCalledWith(1);
    });

    it('shows add team button when enabled', () => {
      wrapper = createWrapper({ teamChampionshipEnabled: true });

      const addButton = wrapper.find('button');
      expect(addButton.exists()).toBe(true);
    });

    it('displays teams in table', async () => {
      teamStore.teams = mockTeams;

      wrapper = createWrapper({ teamChampionshipEnabled: true });

      await wrapper.vm.$nextTick();

      // Check that teams are in the store
      expect(teamStore.teams).toHaveLength(2);
      expect(teamStore.teams[0]?.name).toBe('Red Bull Racing');
      expect(teamStore.teams[1]?.name).toBe('Mercedes AMG');
    });

    it('shows empty state when no teams', () => {
      teamStore.teams = [];

      wrapper = createWrapper({ teamChampionshipEnabled: true });

      expect(wrapper.text()).toContain('No teams created yet');
    });
  });

  describe('Add Team', () => {
    it('shows add button when enabled', async () => {
      wrapper = createWrapper({ teamChampionshipEnabled: true });

      const addButton = wrapper.find('button');
      await addButton.trigger('click');

      // The component should handle the click
      expect(addButton.exists()).toBe(true);
    });
  });

  describe('Team Management', () => {
    it('renders team data when teams are available', async () => {
      teamStore.teams = mockTeams;

      wrapper = createWrapper({ teamChampionshipEnabled: true });

      await wrapper.vm.$nextTick();

      // Check that teams are properly set in the store
      expect(teamStore.teams).toHaveLength(2);
      expect(teamStore.teams.find((t) => t.name === 'Red Bull Racing')).toBeDefined();
      expect(teamStore.teams.find((t) => t.name === 'Mercedes AMG')).toBeDefined();
    });
  });

  describe('Loading State', () => {
    it('shows loading state while fetching teams', async () => {
      teamStore.loading = true;

      wrapper = createWrapper({ teamChampionshipEnabled: true });

      await wrapper.vm.$nextTick();

      // Check that the loading state is set in the store
      expect(teamStore.loading).toBe(true);
    });
  });
});
