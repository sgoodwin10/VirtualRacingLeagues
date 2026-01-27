import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import PrimeVue from 'primevue/config';
import Aura from '@primevue/themes/aura';
import ToastService from 'primevue/toastservice';
import SeasonFormSplitModal from './SeasonFormSplitModal.vue';
import { useSeasonStore } from '@app/stores/seasonStore';
import type { Season } from '@app/types/season';

// Mock services
vi.mock('@app/services/seasonService', () => ({
  checkSeasonSlugAvailability: vi.fn(() =>
    Promise.resolve({ slug: 'test-season', available: true, suggestion: null }),
  ),
  getSeasonTiebreakerRules: vi.fn(() => Promise.resolve([])),
}));

// Mock validation composable
const mockValidationResult = {
  errors: {},
  validateAll: vi.fn(() => true),
  clearError: vi.fn(),
  clearErrors: vi.fn(),
};

vi.mock('@app/composables/useSeasonValidation', () => ({
  useSeasonValidation: () => mockValidationResult,
}));

describe('SeasonFormSplitModal', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  // Helper function to create properly configured wrapper
  const createWrapper = (props: Record<string, unknown>) => {
    return mount(SeasonFormSplitModal, {
      props,
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
          ToastService,
        ],
        stubs: {
          BaseModal: {
            template: '<div><slot name="header" /><slot /><slot name="footer" /></div>',
            props: ['visible', 'header'],
          },
          SeasonFormSidebar: {
            name: 'SeasonFormSidebar',
            template: '<div class="mock-sidebar"><slot /></div>',
            props: [
              'activeSection',
              'isNameValid',
              'raceDivisionsStatus',
              'teamChampionshipStatus',
              'dropRoundStatus',
              'tiebreakerStatus',
            ],
            emits: ['change-section'],
          },
          BasicInfoFormSection: {
            name: 'BasicInfoFormSection',
            template: '<div class="mock-basic-info"><slot /></div>',
            props: ['form', 'errors', 'slugStatus', 'slugSuggestion'],
            emits: ['update:name', 'update:slug', 'update:carClass', 'update:description'],
          },
          DriverManagementFormSection: {
            name: 'DriverManagementFormSection',
            template: '<div class="mock-driver-mgmt"><slot /></div>',
            props: ['form', 'errors'],
            emits: [
              'update:raceDivisionsEnabled',
              'update:teamChampionshipEnabled',
              'update:raceTimesRequired',
              'update:driversForCalculation',
            ],
          },
          ScoringFormSection: {
            name: 'ScoringFormSection',
            template: '<div class="mock-scoring"><slot /></div>',
            props: ['form', 'errors', 'tiebreakerRules'],
            emits: [
              'update:dropRound',
              'update:totalDropRounds',
              'update:teamsDropRounds',
              'update:teamsTotalDropRounds',
              'update:tiebreakerEnabled',
              'update:tiebreakerRules',
            ],
          },
          MediaFormSection: {
            name: 'MediaFormSection',
            template: '<div class="mock-media"><slot /></div>',
            props: ['form', 'errors', 'isEditMode'],
            emits: [
              'update:logo',
              'update:banner',
              'update:hasOwnLogo',
              'remove:logo',
              'remove:banner',
            ],
          },
          TechnicalFormSection: {
            name: 'TechnicalFormSection',
            template: '<div class="mock-technical"><slot /></div>',
            props: ['form', 'errors'],
            emits: ['update:technicalSpecs'],
          },
          Transition: false,
        },
      },
    });
  };

  const mockSeason: Season = {
    id: 1,
    competition_id: 1,
    name: 'Test Season',
    slug: 'test-season',
    car_class: 'GT3',
    description: 'Test description',
    technical_specs: 'Test specs',
    logo_url: null,
    banner_url: null,
    has_own_logo: false,
    race_divisions_enabled: false,
    team_championship_enabled: false,
    race_times_required: true,
    drop_round: false,
    total_drop_rounds: 0,
    teams_drivers_for_calculation: null,
    teams_drop_rounds: false,
    teams_total_drop_rounds: null,
    round_totals_tiebreaker_rules_enabled: false,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  };

  describe('rendering', () => {
    it('renders modal when visible is true', () => {
      const wrapper = createWrapper({
        visible: true,
        competitionId: 1,
      });

      expect(wrapper.text()).toContain('Create Season');
    });

    it('displays correct title for create mode', () => {
      const wrapper = createWrapper({
        visible: true,
        competitionId: 1,
        isEditMode: false,
      });

      expect(wrapper.text()).toContain('Create new season');
    });

    it('displays correct title for edit mode', () => {
      const wrapper = createWrapper({
        visible: true,
        competitionId: 1,
        season: mockSeason,
        isEditMode: true,
      });

      expect(wrapper.text()).toContain('Update season configuration');
    });

    it('displays competition name when provided', () => {
      const wrapper = createWrapper({
        visible: true,
        competitionId: 1,
        competitionName: 'GT3 Championship',
      });

      expect(wrapper.text()).toContain('Competition:');
      expect(wrapper.text()).toContain('GT3 Championship');
    });

    it('does not display competition banner when competitionName is not provided', () => {
      const wrapper = createWrapper({
        visible: true,
        competitionId: 1,
      });

      expect(wrapper.text()).not.toContain('Competition:');
    });
  });

  describe('navigation', () => {
    it('starts with Basic Info section active', () => {
      const wrapper = createWrapper({
        visible: true,
        competitionId: 1,
      });

      expect(wrapper.vm.activeSection).toBe('basic');
    });

    it('navigates to different sections', async () => {
      const wrapper = createWrapper({
        visible: true,
        competitionId: 1,
      });

      wrapper.vm.activeSection = 'driver';
      await wrapper.vm.$nextTick();

      expect(wrapper.vm.activeSection).toBe('driver');
    });
  });

  describe('status summary', () => {
    it('shows OFF for all settings by default', () => {
      const wrapper = createWrapper({
        visible: true,
        competitionId: 1,
      });

      expect(wrapper.vm.form.race_divisions_enabled).toBe(false);
      expect(wrapper.vm.form.team_championship_enabled).toBe(false);
      expect(wrapper.vm.form.drop_round).toBe(false);
      expect(wrapper.vm.form.round_totals_tiebreaker_rules_enabled).toBe(false);
    });

    it('tracks enabled settings', async () => {
      const wrapper = createWrapper({
        visible: true,
        competitionId: 1,
      });

      wrapper.vm.form.race_divisions_enabled = true;
      wrapper.vm.form.team_championship_enabled = true;

      await wrapper.vm.$nextTick();

      expect(wrapper.vm.form.race_divisions_enabled).toBe(true);
      expect(wrapper.vm.form.team_championship_enabled).toBe(true);
    });
  });

  describe('form validation', () => {
    it('requires season name', () => {
      const wrapper = createWrapper({
        visible: true,
        competitionId: 1,
      });

      expect(wrapper.vm.canSubmit).toBe(false);

      wrapper.vm.form.name = 'Test Season';

      expect(wrapper.vm.form.name).toBe('Test Season');
    });

    it('validates name minimum length', () => {
      const wrapper = createWrapper({
        visible: true,
        competitionId: 1,
      });

      wrapper.vm.form.name = 'ab';
      expect(wrapper.vm.canSubmit).toBe(false);

      wrapper.vm.form.name = 'abc';
      expect(wrapper.vm.canSubmit).toBe(true);
    });
  });

  describe('image upload', () => {
    it('allows removing existing logo', () => {
      const wrapper = createWrapper({
        visible: true,
        competitionId: 1,
        season: mockSeason,
        isEditMode: true,
      });

      wrapper.vm.handleRemoveExistingLogo();

      expect(wrapper.vm.removeExistingLogo).toBe(true);
      expect(wrapper.vm.form.logo_url).toBe(null);
    });

    it('allows removing existing banner', () => {
      const wrapper = createWrapper({
        visible: true,
        competitionId: 1,
        season: mockSeason,
        isEditMode: true,
      });

      wrapper.vm.handleRemoveExistingBanner();

      expect(wrapper.vm.removeExistingBanner).toBe(true);
      expect(wrapper.vm.form.banner_url).toBe(null);
    });
  });

  describe('submission', () => {
    // TODO: Fix these tests after refactoring to match EditLeagueModal pattern
    it.skip('emits season-saved on successful create', async () => {
      const store = useSeasonStore();
      const createdSeason = { ...mockSeason, id: 2 };

      store.createNewSeason = vi.fn(() => Promise.resolve(createdSeason));
      store.updateTiebreakerRulesOrder = vi.fn(() => Promise.resolve());
      store.fetchTiebreakerRules = vi.fn(() => Promise.resolve());
      store.availableTiebreakerRules = [];

      const wrapper = createWrapper({
        visible: true,
        competitionId: 1,
      });

      wrapper.vm.form.name = 'New Season';
      wrapper.vm.slugStatus = 'available';
      await wrapper.vm.$nextTick();

      expect(wrapper.vm.canSubmit).toBe(true);

      await wrapper.vm.handleSubmit();
      await flushPromises();

      expect(wrapper.emitted('season-saved')).toBeTruthy();
      expect(wrapper.emitted('update:visible')).toBeTruthy();
    });

    it.skip('converts all to null for teams_drivers_for_calculation', async () => {
      const store = useSeasonStore();
      const createdSeason = { ...mockSeason, id: 2 };

      store.createNewSeason = vi.fn(() => Promise.resolve(createdSeason));
      store.updateTiebreakerRulesOrder = vi.fn(() => Promise.resolve());
      store.fetchTiebreakerRules = vi.fn(() => Promise.resolve());
      store.availableTiebreakerRules = [];

      const wrapper = createWrapper({
        visible: true,
        competitionId: 1,
      });

      wrapper.vm.form.name = 'New Season';
      wrapper.vm.form.teams_drivers_for_calculation = 'all';
      wrapper.vm.slugStatus = 'available';
      await wrapper.vm.$nextTick();

      await wrapper.vm.handleSubmit();
      await flushPromises();

      expect(store.createNewSeason).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          teams_drivers_for_calculation: null,
        }),
      );
    });
  });
});
