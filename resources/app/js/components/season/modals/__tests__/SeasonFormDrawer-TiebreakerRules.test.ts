import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount, VueWrapper } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import PrimeVue from 'primevue/config';
import Aura from '@primevue/themes/aura';
import ToastService from 'primevue/toastservice';

import SeasonFormDrawer from '../SeasonFormDrawer.vue';
import { useSeasonStore } from '@app/stores/seasonStore';
import type { Season, TiebreakerRule, SeasonTiebreakerRule } from '@app/types/season';

// Mock child components
vi.mock('@app/components/common/modals/BaseModal.vue', () => ({
  default: {
    name: 'BaseModal',
    template: '<div class="base-modal"><slot /><slot name="footer" /></div>',
    props: ['visible', 'header', 'width', 'closable', 'dismissableMask', 'loading', 'contentClass'],
    emits: ['update:visible', 'hide'],
  },
}));

vi.mock('@app/components/common/forms/FormLabel.vue', () => ({
  default: {
    name: 'FormLabel',
    template: '<label>{{ text }}</label>',
    props: ['for', 'text', 'required', 'class'],
  },
}));

vi.mock('@app/components/common/forms/FormError.vue', () => ({
  default: {
    name: 'FormError',
    template: '<div v-if="error" class="form-error">{{ error }}</div>',
    props: ['error'],
  },
}));

vi.mock('@app/components/common/forms/FormInputGroup.vue', () => ({
  default: {
    name: 'FormInputGroup',
    template: '<div class="form-input-group"><slot /></div>',
  },
}));

vi.mock('@app/components/common/forms/FormOptionalText.vue', () => ({
  default: {
    name: 'FormOptionalText',
    template: '<small class="form-optional-text">{{ text }}</small>',
    props: ['text'],
  },
}));

vi.mock('@app/components/common/forms/ImageUpload.vue', () => ({
  default: {
    name: 'ImageUpload',
    template: '<div class="image-upload" />',
    props: [
      'modelValue',
      'label',
      'existingImageUrl',
      'accept',
      'maxFileSize',
      'minDimensions',
      'recommendedDimensions',
      'previewSize',
      'helperText',
    ],
    emits: ['update:modelValue'],
  },
}));

vi.mock('@app/components/common/panels/BasePanel.vue', () => ({
  default: {
    name: 'BasePanel',
    template: '<div class="base-panel" v-bind="$attrs"><slot /></div>',
    inheritAttrs: true,
  },
}));

vi.mock('primevue/checkbox', () => ({
  default: {
    name: 'Checkbox',
    template:
      '<input type="checkbox" :id="inputId" :checked="modelValue" @change="$emit(\'update:modelValue\', $event.target.checked)" />',
    props: ['modelValue', 'inputId', 'binary', 'disabled'],
    emits: ['update:modelValue'],
  },
}));

vi.mock('primevue/orderlist', () => ({
  default: {
    name: 'OrderList',
    template:
      '<div class="order-list"><div v-for="(item, index) in modelValue" :key="item[dataKey]"><slot name="item" :item="item" :index="index" /></div></div>',
    props: ['modelValue', 'dataKey', 'pt'],
    emits: ['update:modelValue'],
  },
}));

vi.mock('primevue/message', () => ({
  default: {
    name: 'Message',
    template: '<div class="message" :data-severity="severity"><slot /></div>',
    props: ['severity', 'closable'],
  },
}));

// Mock services
vi.mock('@app/services/seasonService', () => ({
  checkSeasonSlugAvailability: vi.fn().mockResolvedValue({
    available: true,
    slug: 'test-season',
    suggestion: null,
  }),
  getSeasonTiebreakerRules: vi.fn(),
  getTiebreakerRules: vi.fn(),
}));

vi.mock('@app/composables/useSeasonValidation', () => ({
  useSeasonValidation: vi.fn(() => ({
    errors: {},
    validateAll: vi.fn(() => true),
    clearError: vi.fn(),
    clearErrors: vi.fn(),
  })),
}));

describe('SeasonFormDrawer - Tiebreaker Rules', () => {
  let wrapper: VueWrapper;
  let mockSeasonStore: ReturnType<typeof useSeasonStore>;

  const mockAvailableRules: TiebreakerRule[] = [
    {
      id: 1,
      name: 'Highest Qualifying Position',
      slug: 'highest-qualifying-position',
      description: 'Driver with the highest qualifying position wins',
      is_active: true,
      default_order: 1,
    },
    {
      id: 2,
      name: 'Most Race Wins',
      slug: 'most-race-wins',
      description: 'Driver with the most race wins wins',
      is_active: true,
      default_order: 2,
    },
  ];

  const mockSeasonTiebreakerRules: SeasonTiebreakerRule[] = [
    {
      id: 1,
      season_id: 1,
      rule_id: 2,
      rule_name: 'Most Race Wins',
      rule_slug: 'most-race-wins',
      rule_description: 'Driver with the most race wins wins',
      order: 1,
    },
    {
      id: 2,
      season_id: 1,
      rule_id: 1,
      rule_name: 'Highest Qualifying Position',
      rule_slug: 'highest-qualifying-position',
      rule_description: 'Driver with the highest qualifying position wins',
      order: 2,
    },
  ];

  const mockSeason: Season = {
    id: 1,
    competition_id: 1,
    name: 'Test Season',
    slug: 'test-season',
    car_class: 'GT3',
    description: 'Test description',
    technical_specs: null,
    logo_url: 'https://example.com/logo.png',
    has_own_logo: false,
    banner_url: null,
    has_own_banner: false,
    race_divisions_enabled: false,
    team_championship_enabled: false,
    race_times_required: true,
    drop_round: false,
    total_drop_rounds: 0,
    teams_drivers_for_calculation: null,
    teams_drop_rounds: false,
    teams_total_drop_rounds: null,
    round_totals_tiebreaker_rules_enabled: false,
    status: 'setup',
    is_setup: true,
    is_active: false,
    is_completed: false,
    is_archived: false,
    is_deleted: false,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    deleted_at: null,
    created_by_user_id: 1,
    stats: {
      total_drivers: 0,
      active_drivers: 0,
      total_races: 0,
      completed_races: 0,
    },
  };

  beforeEach(async () => {
    const pinia = createPinia();
    setActivePinia(pinia);

    mockSeasonStore = useSeasonStore();
    mockSeasonStore.availableTiebreakerRules = mockAvailableRules;
    mockSeasonStore.fetchTiebreakerRules = vi.fn().mockResolvedValue(undefined);
    mockSeasonStore.updateTiebreakerRulesOrder = vi.fn().mockResolvedValue(undefined);
    mockSeasonStore.createNewSeason = vi.fn().mockResolvedValue(mockSeason);
    mockSeasonStore.updateExistingSeason = vi.fn().mockResolvedValue(mockSeason);

    // Import and configure the mocked function
    const seasonService = await import('@app/services/seasonService');
    vi.mocked(seasonService.getSeasonTiebreakerRules).mockResolvedValue(mockSeasonTiebreakerRules);

    wrapper = mount(SeasonFormDrawer, {
      global: {
        plugins: [
          pinia,
          [
            PrimeVue,
            {
              theme: { preset: Aura },
            },
          ],
          ToastService,
        ],
      },
      props: {
        visible: true,
        competitionId: 1,
        isEditMode: false,
      },
    });
  });

  describe('Tiebreaker Toggle', () => {
    it('should render tiebreaker toggle checkbox', () => {
      const checkbox = wrapper.find('input[type="checkbox"][id="tiebreaker_rules"]');
      expect(checkbox.exists()).toBe(true);
    });

    it('should not show tiebreaker panel when toggle is disabled', () => {
      const panel = wrapper.find('.base-panel.bg-amber-50\\/50');
      expect(panel.exists()).toBe(false);
    });

    it('should show tiebreaker panel when toggle is enabled', async () => {
      const checkbox = wrapper.find('input[type="checkbox"][id="tiebreaker_rules"]');
      await checkbox.setValue(true);
      await wrapper.vm.$nextTick();

      const panel = wrapper.find('.base-panel.bg-amber-50\\/50');
      expect(panel.exists()).toBe(true);
    });

    it('should fetch available tiebreaker rules when toggle is enabled', async () => {
      const checkbox = wrapper.find('input[type="checkbox"][id="tiebreaker_rules"]');
      await checkbox.setValue(true);
      await wrapper.vm.$nextTick();

      expect(mockSeasonStore.fetchTiebreakerRules).toHaveBeenCalled();
    });
  });

  describe('Tiebreaker Panel - Create Mode', () => {
    beforeEach(async () => {
      const checkbox = wrapper.find('input[type="checkbox"][id="tiebreaker_rules"]');
      await checkbox.setValue(true);
      await wrapper.vm.$nextTick();
    });

    it('should load default rule order in create mode', async () => {
      // Wait for the watch effect to complete
      await new Promise((resolve) => setTimeout(resolve, 100));

      const orderList = wrapper.find('.order-list');
      expect(orderList.exists()).toBe(true);
    });

    it('should display all available rules in default order', async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));

      const orderList = wrapper.find('.order-list');
      const items = orderList.findAll('div[class*="order-list"] > div');

      // We expect 2 rules to be rendered
      expect(items.length).toBe(mockAvailableRules.length);
    });
  });

  describe('Tiebreaker Panel - Edit Mode', () => {
    beforeEach(async () => {
      await wrapper.unmount();

      const pinia = createPinia();
      setActivePinia(pinia);

      // Initialize the store with available rules
      const editModeStore = useSeasonStore();
      editModeStore.availableTiebreakerRules = mockAvailableRules;
      editModeStore.fetchTiebreakerRules = vi.fn().mockResolvedValue(undefined);
      editModeStore.updateTiebreakerRulesOrder = vi.fn().mockResolvedValue(undefined);
      editModeStore.createNewSeason = vi.fn().mockResolvedValue(mockSeason);
      editModeStore.updateExistingSeason = vi.fn().mockResolvedValue(mockSeason);

      wrapper = mount(SeasonFormDrawer, {
        global: {
          plugins: [
            pinia,
            [
              PrimeVue,
              {
                theme: { preset: Aura },
              },
            ],
            ToastService,
          ],
        },
        props: {
          visible: true,
          competitionId: 1,
          season: {
            ...mockSeason,
            round_totals_tiebreaker_rules_enabled: true,
          },
          isEditMode: true,
        },
      });

      await wrapper.vm.$nextTick();
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    it('should load existing season tiebreaker rules in edit mode', async () => {
      const seasonService = await import('@app/services/seasonService');
      expect(seasonService.getSeasonTiebreakerRules).toHaveBeenCalledWith(mockSeason.id);
    });

    it('should display rules in the configured order', async () => {
      // The mock rules are in a different order than default
      const orderList = wrapper.find('.order-list');
      expect(orderList.exists()).toBe(true);
    });
  });

  describe('Form Submission', () => {
    it('should include tiebreaker enabled flag when creating season', async () => {
      // Fill in required name field
      const nameInput = wrapper.find('input#name');
      await nameInput.setValue('Test Season Name');
      await wrapper.vm.$nextTick();

      const checkbox = wrapper.find('input[type="checkbox"][id="tiebreaker_rules"]');
      await checkbox.setValue(true);
      await wrapper.vm.$nextTick();

      // Find and click the submit button
      const submitButton = wrapper.findAll('button').find((btn) => btn.text().includes('Create'));
      expect(submitButton).toBeDefined();
      await submitButton?.trigger('click');
      await wrapper.vm.$nextTick();

      expect(mockSeasonStore.createNewSeason).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          round_totals_tiebreaker_rules_enabled: true,
        }),
      );
    });

    it('should call updateTiebreakerRulesOrder after creating season with rules enabled', async () => {
      // Fill in required name field
      const nameInput = wrapper.find('input#name');
      await nameInput.setValue('Test Season Name');
      await wrapper.vm.$nextTick();

      const checkbox = wrapper.find('input[type="checkbox"][id="tiebreaker_rules"]');
      await checkbox.setValue(true);
      await wrapper.vm.$nextTick();
      await new Promise((resolve) => setTimeout(resolve, 100));

      const submitButton = wrapper.findAll('button').find((btn) => btn.text().includes('Create'));
      expect(submitButton).toBeDefined();
      await submitButton?.trigger('click');
      await wrapper.vm.$nextTick();

      expect(mockSeasonStore.updateTiebreakerRulesOrder).toHaveBeenCalledWith(
        mockSeason.id,
        expect.arrayContaining([
          expect.objectContaining({
            id: expect.any(Number),
            order: expect.any(Number),
          }),
        ]),
      );
    });

    it('should not call updateTiebreakerRulesOrder when rules are disabled', async () => {
      // Fill in required name field
      const nameInput = wrapper.find('input#name');
      await nameInput.setValue('Test Season Name');
      await wrapper.vm.$nextTick();

      const submitButton = wrapper.findAll('button').find((btn) => btn.text().includes('Create'));
      await submitButton?.trigger('click');
      await wrapper.vm.$nextTick();

      expect(mockSeasonStore.updateTiebreakerRulesOrder).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should display error message when rules fail to load', async () => {
      const seasonService = await import('@app/services/seasonService');
      vi.mocked(seasonService.getSeasonTiebreakerRules).mockRejectedValueOnce(
        new Error('Failed to load'),
      );

      await wrapper.unmount();

      wrapper = mount(SeasonFormDrawer, {
        global: {
          plugins: [
            createPinia(),
            [
              PrimeVue,
              {
                theme: { preset: Aura },
              },
            ],
            ToastService,
          ],
        },
        props: {
          visible: true,
          competitionId: 1,
          season: {
            ...mockSeason,
            round_totals_tiebreaker_rules_enabled: true,
          },
          isEditMode: true,
        },
      });

      await wrapper.vm.$nextTick();
      await new Promise((resolve) => setTimeout(resolve, 100));

      const errorMessage = wrapper.find('.message[data-severity="error"]');
      expect(errorMessage.exists()).toBe(true);
    });
  });

  describe('UI Elements', () => {
    beforeEach(async () => {
      const checkbox = wrapper.find('input[type="checkbox"][id="tiebreaker_rules"]');
      await checkbox.setValue(true);
      await wrapper.vm.$nextTick();
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    it('should display tiebreaker panel title', () => {
      expect(wrapper.text()).toContain('Tiebreaker Rule Priority');
    });

    it('should display helper text about drag and drop', () => {
      expect(wrapper.text()).toContain('Drag and drop to reorder');
    });

    it('should display info message about shared positions', () => {
      expect(wrapper.text()).toContain('drivers will share the same position');
    });
  });
});
