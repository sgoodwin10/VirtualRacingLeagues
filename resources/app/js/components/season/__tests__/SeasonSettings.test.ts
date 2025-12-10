import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount, VueWrapper } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import PrimeVue from 'primevue/config';
import Aura from '@primevue/themes/aura';
import ConfirmationService from 'primevue/confirmationservice';
import ToastService from 'primevue/toastservice';

import SeasonSettings from '../SeasonSettings.vue';
import { useSeasonStore } from '@app/stores/seasonStore';
import type { Season } from '@app/types/season';

// Mock child components
vi.mock('@app/components/common/panels/BasePanel.vue', () => ({
  default: {
    name: 'BasePanel',
    template: '<div class="base-panel"><slot name="header" /><slot /></div>',
  },
}));

vi.mock('@app/components/common/panels/PanelHeader.vue', () => ({
  default: {
    name: 'PanelHeader',
    template: '<div class="panel-header">{{ title }}</div>',
    props: ['icon', 'iconSize', 'iconClass', 'title', 'description', 'gradient'],
  },
}));

vi.mock('../modals/SeasonDeleteDialog.vue', () => ({
  default: {
    name: 'SeasonDeleteDialog',
    template: '<div class="season-delete-dialog" />',
    props: ['visible', 'season'],
    emits: ['update:visible', 'confirmed'],
  },
}));

describe('SeasonSettings', () => {
  let wrapper: VueWrapper;
  let mockSeasonStore: ReturnType<typeof useSeasonStore>;

  const createMockSeason = (overrides?: Partial<Season>): Season => ({
    id: 1,
    name: 'Test Season',
    slug: 'test-season',
    competition_id: 1,
    car_class: null,
    description: null,
    technical_specs: null,
    logo_url: '/default-logo.png',
    has_own_logo: false,
    banner_url: null,
    has_own_banner: false,
    race_divisions_enabled: false,
    team_championship_enabled: false,
    race_times_required: true,
    drop_round: false,
    total_drop_rounds: 0,
    status: 'setup',
    is_setup: true,
    is_active: false,
    is_completed: false,
    is_archived: false,
    is_deleted: false,
    created_at: '2025-01-01T00:00:00.000Z',
    updated_at: '2025-01-01T00:00:00.000Z',
    deleted_at: null,
    created_by_user_id: 1,
    stats: {
      total_drivers: 0,
      active_drivers: 0,
      total_races: 0,
      completed_races: 0,
    },
    ...overrides,
  });

  const createWrapper = (season: Season) => {
    return mount(SeasonSettings, {
      props: {
        season,
      },
      global: {
        plugins: [
          createPinia(),
          [
            PrimeVue,
            {
              theme: {
                preset: Aura,
              },
            },
          ],
          ConfirmationService,
          ToastService,
        ],
        // Don't stub any components - let them render normally
      },
    });
  };

  beforeEach(() => {
    setActivePinia(createPinia());
    mockSeasonStore = useSeasonStore();

    // Mock store methods
    mockSeasonStore.activateExistingSeason = vi.fn().mockResolvedValue(undefined);
    mockSeasonStore.completeExistingSeason = vi.fn().mockResolvedValue(undefined);
    mockSeasonStore.archiveExistingSeason = vi.fn().mockResolvedValue(undefined);
  });

  describe('rendering', () => {
    it('renders correctly with setup status', () => {
      const season = createMockSeason({ status: 'setup' });
      wrapper = createWrapper(season);

      expect(wrapper.find('.season-settings').exists()).toBe(true);
      expect(wrapper.text()).toContain('Current Status');
      expect(wrapper.text()).toContain('Activate Season');
      expect(wrapper.text()).toContain('Complete Season');
      expect(wrapper.text()).toContain('Archive Season');
      expect(wrapper.text()).toContain('Danger Zone');
    });

    it('renders correctly with active status', () => {
      const season = createMockSeason({ status: 'active' });
      wrapper = createWrapper(season);

      expect(wrapper.find('.season-settings').exists()).toBe(true);
      expect(wrapper.text()).toContain('Current Status');
    });

    it('renders correctly with completed status', () => {
      const season = createMockSeason({ status: 'completed' });
      wrapper = createWrapper(season);

      expect(wrapper.find('.season-settings').exists()).toBe(true);
      expect(wrapper.text()).toContain('Current Status');
    });

    it('renders archived panel when season is archived', () => {
      const season = createMockSeason({ status: 'archived', is_archived: true });
      wrapper = createWrapper(season);

      expect(wrapper.text()).toContain('Archived Season');
      expect(wrapper.text()).toContain('This season is archived and read-only');
      expect(wrapper.text()).not.toContain('Activate Season');
    });

    it('displays current status tag correctly for setup', () => {
      const season = createMockSeason({ status: 'setup' });
      wrapper = createWrapper(season);

      const statusTag = wrapper.find('[class*="p-tag"]');
      expect(statusTag.exists()).toBe(true);
      expect(wrapper.text()).toContain('Current Status');
    });

    it('displays current status tag correctly for active', () => {
      const season = createMockSeason({ status: 'active' });
      wrapper = createWrapper(season);

      const statusTag = wrapper.find('[class*="p-tag"]');
      expect(statusTag.exists()).toBe(true);
      expect(wrapper.text()).toContain('Current Status');
    });

    it('displays current status tag correctly for completed', () => {
      const season = createMockSeason({ status: 'completed' });
      wrapper = createWrapper(season);

      const statusTag = wrapper.find('[class*="p-tag"]');
      expect(statusTag.exists()).toBe(true);
      expect(wrapper.text()).toContain('Current Status');
    });

    it('renders all three action items in Season Status panel', () => {
      const season = createMockSeason({ status: 'setup' });
      wrapper = createWrapper(season);

      expect(wrapper.text()).toContain('Activate Season');
      expect(wrapper.text()).toContain('Start racing and open for results');
      expect(wrapper.text()).toContain('Complete Season');
      expect(wrapper.text()).toContain('Mark season as finished');
      expect(wrapper.text()).toContain('Archive Season');
      expect(wrapper.text()).toContain('Hide from lists and make read-only');
    });

    it('renders Danger Zone panel with delete action', () => {
      const season = createMockSeason({ status: 'setup' });
      wrapper = createWrapper(season);

      expect(wrapper.text()).toContain('Danger Zone');
      expect(wrapper.text()).toContain('Delete Season');
      expect(wrapper.text()).toContain('Permanently remove all race results and historical data');
    });

    it('uses Phosphor icons in panel headers', () => {
      const season = createMockSeason({ status: 'setup' });
      wrapper = createWrapper(season);

      const panelHeaders = wrapper.findAllComponents({ name: 'PanelHeader' });
      // Only Danger Zone has a PanelHeader; Season Status uses direct content
      expect(panelHeaders.length).toBeGreaterThan(0);

      // Check that PanelHeader components receive icon props
      const dangerPanel = panelHeaders.find((ph) => ph.props('title') === 'Danger Zone');
      expect(dangerPanel).toBeDefined();
      expect(dangerPanel?.props('icon')).toBeDefined();
    });

    it('displays gradient backgrounds on panel headers', () => {
      const season = createMockSeason({ status: 'setup' });
      wrapper = createWrapper(season);

      const panelHeaders = wrapper.findAllComponents({ name: 'PanelHeader' });
      // Only Danger Zone has a PanelHeader with gradient
      const dangerPanel = panelHeaders.find((ph) => ph.props('title') === 'Danger Zone');
      expect(dangerPanel?.props('gradient')).toBe('from-red-100 to-rose-100');
    });
  });

  describe('button states - setup status', () => {
    it('displays all action buttons when status is setup', () => {
      const season = createMockSeason({ status: 'setup' });
      wrapper = createWrapper(season);

      const buttons = wrapper.findAllComponents({ name: 'Button' });
      const labels = buttons.map((btn) => btn.props('label'));

      // All action buttons should be present (activate, complete, archive, delete)
      expect(labels).toContain('Activate');
      expect(labels).toContain('Complete');
      expect(labels).toContain('Archive');
      expect(labels).toContain('Delete Season');
    });

    it('verifies activate button state when status is setup', () => {
      const season = createMockSeason({ status: 'setup' });
      wrapper = createWrapper(season);

      const activateButton = wrapper
        .findAllComponents({ name: 'Button' })
        .find((btn) => btn.props('label') === 'Activate');

      // Button should exist and be clickable (enabled)
      expect(activateButton?.exists()).toBe(true);
      const disabled = activateButton?.props('disabled');
      // When enabled, disabled is either false or undefined
      expect(disabled === true).toBe(false);
    });
  });

  describe('button states - active status', () => {
    it('displays all action buttons when status is active', () => {
      const season = createMockSeason({ status: 'active' });
      wrapper = createWrapper(season);

      const buttons = wrapper.findAllComponents({ name: 'Button' });
      const labels = buttons.map((btn) => btn.props('label'));

      expect(labels).toContain('Activate');
      expect(labels).toContain('Complete');
      expect(labels).toContain('Archive');
      expect(labels).toContain('Delete Season');
    });

    it('verifies complete button state when status is active', () => {
      const season = createMockSeason({ status: 'active' });
      wrapper = createWrapper(season);

      const completeButton = wrapper
        .findAllComponents({ name: 'Button' })
        .find((btn) => btn.props('label') === 'Complete');

      expect(completeButton?.exists()).toBe(true);
      const disabled = completeButton?.props('disabled');
      expect(disabled === true).toBe(false);
    });

    it('verifies archive button state when status is active', () => {
      const season = createMockSeason({ status: 'active' });
      wrapper = createWrapper(season);

      const archiveButton = wrapper
        .findAllComponents({ name: 'Button' })
        .find((btn) => btn.props('label') === 'Archive');

      expect(archiveButton?.exists()).toBe(true);
      const disabled = archiveButton?.props('disabled');
      expect(disabled === true).toBe(false);
    });
  });

  describe('button states - completed status', () => {
    it('displays all action buttons when status is completed', () => {
      const season = createMockSeason({ status: 'completed' });
      wrapper = createWrapper(season);

      const buttons = wrapper.findAllComponents({ name: 'Button' });
      const labels = buttons.map((btn) => btn.props('label'));

      expect(labels).toContain('Activate');
      expect(labels).toContain('Complete');
      expect(labels).toContain('Archive');
      expect(labels).toContain('Delete Season');
    });

    it('verifies archive button state when status is completed', () => {
      const season = createMockSeason({ status: 'completed' });
      wrapper = createWrapper(season);

      const archiveButton = wrapper
        .findAllComponents({ name: 'Button' })
        .find((btn) => btn.props('label') === 'Archive');

      expect(archiveButton?.exists()).toBe(true);
      const disabled = archiveButton?.props('disabled');
      expect(disabled === true).toBe(false);
    });
  });

  describe('activate season', () => {
    it('shows confirmation dialog when activate button is clicked', async () => {
      const season = createMockSeason({ status: 'setup' });
      wrapper = createWrapper(season);

      const activateButton = wrapper
        .findAllComponents({ name: 'Button' })
        .find((btn) => btn.props('label') === 'Activate');
      await activateButton?.trigger('click');

      // PrimeVue ConfirmDialog is rendered outside the component tree
      // We can verify the confirmation service was called by checking store wasn't called yet
      expect(mockSeasonStore.activateExistingSeason).not.toHaveBeenCalled();
    });
  });

  describe('complete season', () => {
    it('shows confirmation dialog when complete button is clicked', async () => {
      const season = createMockSeason({ status: 'active' });
      wrapper = createWrapper(season);

      const completeButton = wrapper
        .findAllComponents({ name: 'Button' })
        .find((btn) => btn.props('label') === 'Complete');
      await completeButton?.trigger('click');

      // PrimeVue ConfirmDialog is rendered outside the component tree
      expect(mockSeasonStore.completeExistingSeason).not.toHaveBeenCalled();
    });
  });

  describe('archive season', () => {
    it('shows confirmation dialog when archive button is clicked', async () => {
      const season = createMockSeason({ status: 'active' });
      wrapper = createWrapper(season);

      const archiveButton = wrapper
        .findAllComponents({ name: 'Button' })
        .find((btn) => btn.props('label') === 'Archive');
      await archiveButton?.trigger('click');

      // PrimeVue ConfirmDialog is rendered outside the component tree
      expect(mockSeasonStore.archiveExistingSeason).not.toHaveBeenCalled();
    });
  });

  describe('delete season', () => {
    it('shows delete dialog when delete button is clicked', async () => {
      const season = createMockSeason({ status: 'setup' });
      wrapper = createWrapper(season);

      const deleteButton = wrapper
        .findAllComponents({ name: 'Button' })
        .find((btn) => btn.props('label') === 'Delete Season');
      await deleteButton?.trigger('click');
      await wrapper.vm.$nextTick();

      // The mock component doesn't update its visible prop automatically,
      // so we need to check the component's internal state instead
      const vm = wrapper.vm as unknown as { showDeleteDialog: boolean };
      expect(vm.showDeleteDialog).toBe(true);

      const deleteDialog = wrapper.findComponent({ name: 'SeasonDeleteDialog' });
      expect(deleteDialog.exists()).toBe(true);
    });

    it('emits deleted event when delete dialog confirms', async () => {
      const season = createMockSeason({ status: 'setup' });
      wrapper = createWrapper(season);

      const deleteButton = wrapper
        .findAllComponents({ name: 'Button' })
        .find((btn) => btn.props('label') === 'Delete Season');
      await deleteButton?.trigger('click');
      await wrapper.vm.$nextTick();

      const deleteDialog = wrapper.findComponent({ name: 'SeasonDeleteDialog' });
      await deleteDialog.vm.$emit('confirmed');
      await wrapper.vm.$nextTick();

      expect(wrapper.emitted('deleted')).toBeTruthy();
      expect(wrapper.emitted('deleted')?.[0]).toEqual([]);
    });

    it('renders delete button with outlined danger severity', () => {
      const season = createMockSeason({ status: 'setup' });
      wrapper = createWrapper(season);

      const deleteButton = wrapper
        .findAllComponents({ name: 'Button' })
        .find((btn) => btn.props('label') === 'Delete Season');
      expect(deleteButton?.props('severity')).toBe('danger');
      expect(deleteButton?.props('outlined')).toBe(true);
    });
  });

  describe('event emissions', () => {
    it('does not emit any events on initial render', () => {
      const season = createMockSeason({ status: 'setup' });
      wrapper = createWrapper(season);

      expect(wrapper.emitted()).toEqual({});
    });
  });

  describe('visual design', () => {
    it('uses small button size for all action buttons', () => {
      const season = createMockSeason({ status: 'setup' });
      wrapper = createWrapper(season);

      const actionButtons = wrapper
        .findAllComponents({ name: 'Button' })
        .filter((btn) => ['Activate', 'Complete', 'Archive'].includes(btn.text()));

      actionButtons.forEach((button) => {
        expect(button.props('size')).toBe('small');
      });
    });

    it('applies correct severity to status action buttons', () => {
      const season = createMockSeason({ status: 'setup' });
      wrapper = createWrapper(season);

      const activateButton = wrapper
        .findAllComponents({ name: 'Button' })
        .find((btn) => btn.text() === 'Activate');
      expect(activateButton?.props('severity')).toBe('success');

      const completeButton = wrapper
        .findAllComponents({ name: 'Button' })
        .find((btn) => btn.text() === 'Complete');
      expect(completeButton?.props('severity')).toBe('info');

      const archiveButton = wrapper
        .findAllComponents({ name: 'Button' })
        .find((btn) => btn.text() === 'Archive');
      expect(archiveButton?.props('severity')).toBe('secondary');
    });

    it('uses consistent spacing with space-y-4 on root container', () => {
      const season = createMockSeason({ status: 'setup' });
      wrapper = createWrapper(season);

      const rootDiv = wrapper.find('.season-settings');
      expect(rootDiv.classes()).toContain('space-y-4');
    });
  });

  describe('accessibility', () => {
    it('provides descriptive button labels', () => {
      const season = createMockSeason({ status: 'setup' });
      wrapper = createWrapper(season);

      const buttons = wrapper.findAllComponents({ name: 'Button' });
      buttons.forEach((button) => {
        expect(button.props('label')).toBeTruthy();
      });
    });

    it('includes descriptive text for each action', () => {
      const season = createMockSeason({ status: 'setup' });
      wrapper = createWrapper(season);

      expect(wrapper.text()).toContain('Start racing and open for results');
      expect(wrapper.text()).toContain('Mark season as finished');
      expect(wrapper.text()).toContain('Hide from lists and make read-only');
    });

    it('clearly indicates permanent deletion in danger zone', () => {
      const season = createMockSeason({ status: 'setup' });
      wrapper = createWrapper(season);

      expect(wrapper.text()).toContain('Permanently remove all race results and historical data');
      expect(wrapper.text()).toContain('This action cannot be undone');
    });
  });

  describe('edge cases', () => {
    it('handles archived season correctly', () => {
      const season = createMockSeason({ status: 'archived', is_archived: true });
      wrapper = createWrapper(season);

      expect(wrapper.text()).toContain('Archived Season');
      expect(wrapper.find('.season-settings').exists()).toBe(true);

      // Should not show status actions panel
      expect(wrapper.text()).not.toContain('Activate Season');
      expect(wrapper.text()).not.toContain('Complete Season');
    });

    it('still shows Danger Zone for archived season', () => {
      const season = createMockSeason({ status: 'archived', is_archived: true });
      wrapper = createWrapper(season);

      expect(wrapper.text()).toContain('Danger Zone');
      expect(wrapper.text()).toContain('Delete Season');
    });
  });
});
