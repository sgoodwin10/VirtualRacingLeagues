import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount, VueWrapper } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import PrimeVue from 'primevue/config';
import Aura from '@primevue/themes/aura';
import ToastService from 'primevue/toastservice';

import SeasonFormDrawer from '../SeasonFormDrawer.vue';
import { useSeasonStore } from '@app/stores/seasonStore';
import type { Season } from '@app/types/season';

// Mock child components
vi.mock('@app/components/common/modals/BaseModal.vue', () => ({
  default: {
    name: 'BaseModal',
    template: '<div class="base-modal"><slot /><slot name="footer" /></div>',
    props: ['visible', 'header', 'width', 'closable', 'dismissableMask', 'loading', 'contentClass'],
    emits: ['update:visible'],
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
    template: '<div class="base-panel"><slot /></div>',
    props: ['class'],
  },
}));

vi.mock('@app/services/seasonService', () => ({
  checkSeasonSlugAvailability: vi.fn().mockResolvedValue({
    available: true,
    slug: 'test-season',
    suggestion: null,
  }),
}));

describe('SeasonFormDrawer - Team Championship Settings', () => {
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
    teams_drivers_for_calculation: null,
    teams_drop_rounds: false,
    teams_total_drop_rounds: null,
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

  const createWrapper = (props: {
    visible: boolean;
    competitionId: number;
    season?: Season | null;
    isEditMode?: boolean;
  }) => {
    return mount(SeasonFormDrawer, {
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
      },
    });
  };

  beforeEach(() => {
    setActivePinia(createPinia());
    mockSeasonStore = useSeasonStore();

    // Mock store methods
    mockSeasonStore.createNewSeason = vi.fn().mockResolvedValue(createMockSeason());
    mockSeasonStore.updateExistingSeason = vi.fn().mockResolvedValue(createMockSeason());
  });

  describe('Team Championship Settings Panel Visibility', () => {
    it('does not show team championship settings panel when team championship is disabled', async () => {
      wrapper = createWrapper({
        visible: true,
        competitionId: 1,
        isEditMode: false,
      });

      await wrapper.vm.$nextTick();

      // Panel should not be visible
      const teamSettingsPanel = wrapper.findAll('.base-panel').filter((p) => {
        return p.text().includes('Team Championship Settings');
      });
      expect(teamSettingsPanel.length).toBe(0);
    });

    it('shows team championship settings panel when team championship is enabled', async () => {
      wrapper = createWrapper({
        visible: true,
        competitionId: 1,
        isEditMode: false,
      });

      await wrapper.vm.$nextTick();

      // Enable team championship checkbox
      const teamChampCheckbox = wrapper.findAllComponents({ name: 'Checkbox' }).find((c) => {
        return c.attributes('input-id') === 'team_championship';
      });

      expect(teamChampCheckbox).toBeDefined();
      await teamChampCheckbox?.setValue(true);
      await wrapper.vm.$nextTick();

      // Panel should now be visible
      const teamSettingsPanel = wrapper.findAll('.base-panel').filter((p) => {
        return p.text().includes('Team Championship Settings');
      });
      expect(teamSettingsPanel.length).toBeGreaterThan(0);
    });
  });

  describe('Team Championship Settings Panel Content', () => {
    beforeEach(async () => {
      wrapper = createWrapper({
        visible: true,
        competitionId: 1,
        isEditMode: false,
      });

      await wrapper.vm.$nextTick();

      // Enable team championship
      const teamChampCheckbox = wrapper.findAllComponents({ name: 'Checkbox' }).find((c) => {
        return c.attributes('input-id') === 'team_championship';
      });
      await teamChampCheckbox?.setValue(true);
      await wrapper.vm.$nextTick();
    });

    it('displays drivers for team calculation dropdown', () => {
      const dropdown = wrapper.findAllComponents({ name: 'Dropdown' }).find((d) => {
        return d.attributes('id') === 'teams_drivers_calculation';
      });

      expect(dropdown?.exists()).toBe(true);
      expect(wrapper.text()).toContain('Drivers for Team Calculation');
    });

    it('displays enable teams drop rounds checkbox', () => {
      const checkbox = wrapper.findAllComponents({ name: 'Checkbox' }).find((c) => {
        return c.attributes('input-id') === 'teams_drop_rounds';
      });

      expect(checkbox?.exists()).toBe(true);
      expect(wrapper.text()).toContain('Enable Teams Drop Rounds');
    });

    it('does not show total teams drop rounds input initially', () => {
      const inputNumber = wrapper.findAllComponents({ name: 'InputNumber' }).find((i) => {
        return i.attributes('id') === 'teams_total_drop_rounds';
      });

      expect(inputNumber).toBeUndefined();
    });

    it('shows total teams drop rounds input when teams drop rounds is enabled', async () => {
      const checkbox = wrapper.findAllComponents({ name: 'Checkbox' }).find((c) => {
        return c.attributes('input-id') === 'teams_drop_rounds';
      });

      await checkbox?.setValue(true);
      await wrapper.vm.$nextTick();

      const inputNumber = wrapper.findAllComponents({ name: 'InputNumber' }).find((i) => {
        return i.attributes('id') === 'teams_total_drop_rounds';
      });

      expect(inputNumber?.exists()).toBe(true);
      expect(wrapper.text()).toContain('Total Teams Drop Rounds');
    });

    it('displays helper text for drivers calculation', () => {
      const optionalText = wrapper.findAllComponents({ name: 'FormOptionalText' }).find((t) => {
        return t.props('text')?.includes("drivers' points count towards team round scores");
      });

      expect(optionalText?.exists()).toBe(true);
    });

    it('displays helper text for teams drop rounds', () => {
      const optionalText = wrapper.findAllComponents({ name: 'FormOptionalText' }).find((t) => {
        return t.props('text')?.includes('Exclude lowest scoring rounds from team standings');
      });

      expect(optionalText?.exists()).toBe(true);
    });

    it('uses correct panel styling with blue theme', () => {
      const panel = wrapper.findAllComponents({ name: 'BasePanel' }).find((p) => {
        return p.text().includes('Team Championship Settings');
      });

      expect(panel?.props('class')).toContain('bg-blue-50/50');
      expect(panel?.props('class')).toContain('border-blue-200');
    });

    it('displays panel header with users icon', () => {
      const panelContent = wrapper.html();
      expect(panelContent).toContain('pi-users');
      expect(panelContent).toContain('text-blue-600');
    });
  });

  describe('Dropdown Options for Drivers Calculation', () => {
    beforeEach(async () => {
      wrapper = createWrapper({
        visible: true,
        competitionId: 1,
        isEditMode: false,
      });

      await wrapper.vm.$nextTick();

      // Enable team championship
      const teamChampCheckbox = wrapper.findAllComponents({ name: 'Checkbox' }).find((c) => {
        return c.attributes('input-id') === 'team_championship';
      });
      await teamChampCheckbox?.setValue(true);
      await wrapper.vm.$nextTick();
    });

    it('provides dropdown with All option and numbers 1-16', () => {
      const dropdown = wrapper.findAllComponents({ name: 'Dropdown' }).find((d) => {
        return d.attributes('id') === 'teams_drivers_calculation';
      });

      const options = dropdown?.props('options') as Array<{ label: string; value: number | 'all' }>;
      expect(options).toBeDefined();
      expect(options.length).toBe(17); // All + 1-16

      // Check first option is "All" with 'all' value (for PrimeVue compatibility)
      expect(options[0]).toEqual({ label: 'All', value: 'all' });

      // Check numeric options 1-16
      expect(options[1]).toEqual({ label: '1', value: 1 });
      expect(options[16]).toEqual({ label: '16', value: 16 });
    });
  });

  describe('Form State Management - Create Mode', () => {
    it('initializes with default team championship values', async () => {
      wrapper = createWrapper({
        visible: true,
        competitionId: 1,
        isEditMode: false,
      });

      await wrapper.vm.$nextTick();

      const vm = wrapper.vm as unknown as {
        form: {
          teams_drivers_for_calculation: number | 'all' | null;
          teams_drop_rounds: boolean;
          teams_total_drop_rounds: number | null;
        };
      };

      // Default value is 'all' for PrimeVue dropdown compatibility
      expect(vm.form.teams_drivers_for_calculation).toBe('all');
      expect(vm.form.teams_drop_rounds).toBe(false);
      expect(vm.form.teams_total_drop_rounds).toBeNull();
    });

    it('submits form with team championship settings when creating season', async () => {
      wrapper = createWrapper({
        visible: true,
        competitionId: 1,
        isEditMode: false,
      });

      await wrapper.vm.$nextTick();

      // Fill in required fields
      const nameInput = wrapper.findAllComponents({ name: 'InputText' }).find((i) => {
        return i.attributes('id') === 'name';
      });
      await nameInput?.setValue('Test Season');
      await wrapper.vm.$nextTick();

      // Enable team championship
      const teamChampCheckbox = wrapper.findAllComponents({ name: 'Checkbox' }).find((c) => {
        return c.attributes('input-id') === 'team_championship';
      });
      await teamChampCheckbox?.setValue(true);
      await wrapper.vm.$nextTick();

      // Set drivers for calculation to 2
      const vm = wrapper.vm as unknown as {
        form: { teams_drivers_for_calculation: number | null };
      };
      vm.form.teams_drivers_for_calculation = 2;
      await wrapper.vm.$nextTick();

      // Enable teams drop rounds
      const teamsDropCheckbox = wrapper.findAllComponents({ name: 'Checkbox' }).find((c) => {
        return c.attributes('input-id') === 'teams_drop_rounds';
      });
      await teamsDropCheckbox?.setValue(true);
      await wrapper.vm.$nextTick();

      // Set total drop rounds to 1
      const teamsDropInput = wrapper.findAllComponents({ name: 'InputNumber' }).find((i) => {
        return i.attributes('id') === 'teams_total_drop_rounds';
      });
      await teamsDropInput?.setValue(1);
      await wrapper.vm.$nextTick();

      // Submit form
      const submitButton = wrapper.findAllComponents({ name: 'Button' }).find((b) => {
        return b.props('label') === 'Create Season';
      });
      await submitButton?.trigger('click');
      await wrapper.vm.$nextTick();

      // Verify store was called with team championship settings
      expect(mockSeasonStore.createNewSeason).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          name: 'Test Season',
          team_championship_enabled: true,
          teams_drivers_for_calculation: 2,
          teams_drop_rounds: true,
          teams_total_drop_rounds: 1,
        }),
      );
    });
  });

  describe('Form State Management - Edit Mode', () => {
    it('loads existing team championship settings when editing', async () => {
      const season = createMockSeason({
        team_championship_enabled: true,
        teams_drivers_for_calculation: 3,
        teams_drop_rounds: true,
        teams_total_drop_rounds: 2,
      });

      wrapper = createWrapper({
        visible: true,
        competitionId: 1,
        season,
        isEditMode: true,
      });

      await wrapper.vm.$nextTick();

      const vm = wrapper.vm as unknown as {
        form: {
          teams_drivers_for_calculation: number | 'all' | null;
          teams_drop_rounds: boolean;
          teams_total_drop_rounds: number | null;
        };
      };

      expect(vm.form.teams_drivers_for_calculation).toBe(3);
      expect(vm.form.teams_drop_rounds).toBe(true);
      expect(vm.form.teams_total_drop_rounds).toBe(2);
    });

    it('loads season with null teams_drivers_for_calculation as "all" for dropdown compatibility', async () => {
      const season = createMockSeason({
        team_championship_enabled: true,
        teams_drivers_for_calculation: null, // This is the bug - null should show as "All"
        teams_drop_rounds: false,
        teams_total_drop_rounds: null,
      });

      wrapper = createWrapper({
        visible: true,
        competitionId: 1,
        season,
        isEditMode: true,
      });

      await wrapper.vm.$nextTick();

      const vm = wrapper.vm as unknown as {
        form: {
          teams_drivers_for_calculation: number | 'all' | null;
          teams_drop_rounds: boolean;
          teams_total_drop_rounds: number | null;
        };
      };

      // null from database should be converted to 'all' for dropdown display
      expect(vm.form.teams_drivers_for_calculation).toBe('all');
      expect(vm.form.teams_drop_rounds).toBe(false);
      expect(vm.form.teams_total_drop_rounds).toBeNull();
    });

    it('submits form with updated team championship settings', async () => {
      const season = createMockSeason({
        name: 'Original Season',
        team_championship_enabled: true,
        teams_drivers_for_calculation: 2,
        teams_drop_rounds: false,
        teams_total_drop_rounds: null,
      });

      wrapper = createWrapper({
        visible: true,
        competitionId: 1,
        season,
        isEditMode: true,
      });

      await wrapper.vm.$nextTick();

      // Update values
      const vm = wrapper.vm as unknown as {
        form: {
          teams_drivers_for_calculation: number | 'all' | null;
          teams_drop_rounds: boolean;
          teams_total_drop_rounds: number | null;
        };
      };
      vm.form.teams_drivers_for_calculation = 4;
      vm.form.teams_drop_rounds = true;
      vm.form.teams_total_drop_rounds = 1;
      await wrapper.vm.$nextTick();

      // Submit form
      const submitButton = wrapper.findAllComponents({ name: 'Button' }).find((b) => {
        return b.props('label') === 'Save Changes';
      });
      await submitButton?.trigger('click');
      await wrapper.vm.$nextTick();

      // Verify store was called with updated values
      expect(mockSeasonStore.updateExistingSeason).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          teams_drivers_for_calculation: 4,
          teams_drop_rounds: true,
          teams_total_drop_rounds: 1,
        }),
      );
    });

    it('converts "all" to null when submitting to API', async () => {
      const season = createMockSeason({
        name: 'Test Season',
        team_championship_enabled: true,
        teams_drivers_for_calculation: 3,
        teams_drop_rounds: false,
        teams_total_drop_rounds: null,
      });

      wrapper = createWrapper({
        visible: true,
        competitionId: 1,
        season,
        isEditMode: true,
      });

      await wrapper.vm.$nextTick();

      // Change to 'all'
      const vm = wrapper.vm as unknown as {
        form: {
          teams_drivers_for_calculation: number | 'all' | null;
        };
      };
      vm.form.teams_drivers_for_calculation = 'all';
      await wrapper.vm.$nextTick();

      // Submit form
      const submitButton = wrapper.findAllComponents({ name: 'Button' }).find((b) => {
        return b.props('label') === 'Save Changes';
      });
      await submitButton?.trigger('click');
      await wrapper.vm.$nextTick();

      // Verify 'all' was converted to null in API call
      expect(mockSeasonStore.updateExistingSeason).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          teams_drivers_for_calculation: null,
        }),
      );
    });
  });

  describe('Form Reset', () => {
    it('resets team championship settings when form is cancelled', async () => {
      wrapper = createWrapper({
        visible: true,
        competitionId: 1,
        isEditMode: false,
      });

      await wrapper.vm.$nextTick();

      // Enable team championship and set values
      const teamChampCheckbox = wrapper.findAllComponents({ name: 'Checkbox' }).find((c) => {
        return c.attributes('input-id') === 'team_championship';
      });
      await teamChampCheckbox?.setValue(true);
      await wrapper.vm.$nextTick();

      const vm = wrapper.vm as unknown as {
        form: {
          teams_drivers_for_calculation: number | 'all' | null;
          teams_drop_rounds: boolean;
          teams_total_drop_rounds: number | null;
        };
      };
      vm.form.teams_drivers_for_calculation = 2;
      vm.form.teams_drop_rounds = true;
      vm.form.teams_total_drop_rounds = 1;
      await wrapper.vm.$nextTick();

      // Cancel form
      const cancelButton = wrapper.findAllComponents({ name: 'Button' }).find((b) => {
        return b.props('label') === 'Cancel';
      });
      await cancelButton?.trigger('click');
      await wrapper.vm.$nextTick();

      // Reopen modal
      await wrapper.setProps({ visible: true });
      await wrapper.vm.$nextTick();

      // Values should be reset to 'all' (default)
      expect(vm.form.teams_drivers_for_calculation).toBe('all');
      expect(vm.form.teams_drop_rounds).toBe(false);
      expect(vm.form.teams_total_drop_rounds).toBeNull();
    });
  });

  describe('Conditional Visibility Logic', () => {
    it('hides total teams drop rounds when teams drop rounds is disabled', async () => {
      wrapper = createWrapper({
        visible: true,
        competitionId: 1,
        isEditMode: false,
      });

      await wrapper.vm.$nextTick();

      // Enable team championship
      const teamChampCheckbox = wrapper.findAllComponents({ name: 'Checkbox' }).find((c) => {
        return c.attributes('input-id') === 'team_championship';
      });
      await teamChampCheckbox?.setValue(true);
      await wrapper.vm.$nextTick();

      // Enable teams drop rounds
      const teamsDropCheckbox = wrapper.findAllComponents({ name: 'Checkbox' }).find((c) => {
        return c.attributes('input-id') === 'teams_drop_rounds';
      });
      await teamsDropCheckbox?.setValue(true);
      await wrapper.vm.$nextTick();

      // Input should be visible
      let inputNumber = wrapper.findAllComponents({ name: 'InputNumber' }).find((i) => {
        return i.attributes('id') === 'teams_total_drop_rounds';
      });
      expect(inputNumber?.exists()).toBe(true);

      // Disable teams drop rounds
      await teamsDropCheckbox?.setValue(false);
      await wrapper.vm.$nextTick();

      // Input should be hidden
      inputNumber = wrapper.findAllComponents({ name: 'InputNumber' }).find((i) => {
        return i.attributes('id') === 'teams_total_drop_rounds';
      });
      expect(inputNumber).toBeUndefined();
    });

    it('hides entire panel when team championship is disabled', async () => {
      const season = createMockSeason({
        team_championship_enabled: true,
      });

      wrapper = createWrapper({
        visible: true,
        competitionId: 1,
        season,
        isEditMode: true,
      });

      await wrapper.vm.$nextTick();

      // Panel should be visible initially
      let teamSettingsPanel = wrapper.findAll('.base-panel').filter((p) => {
        return p.text().includes('Team Championship Settings');
      });
      expect(teamSettingsPanel.length).toBeGreaterThan(0);

      // Disable team championship
      const teamChampCheckbox = wrapper.findAllComponents({ name: 'Checkbox' }).find((c) => {
        return c.attributes('input-id') === 'team_championship';
      });
      await teamChampCheckbox?.setValue(false);
      await wrapper.vm.$nextTick();

      // Panel should be hidden
      teamSettingsPanel = wrapper.findAll('.base-panel').filter((p) => {
        return p.text().includes('Team Championship Settings');
      });
      expect(teamSettingsPanel.length).toBe(0);
    });
  });

  describe('InputNumber Constraints', () => {
    beforeEach(async () => {
      wrapper = createWrapper({
        visible: true,
        competitionId: 1,
        isEditMode: false,
      });

      await wrapper.vm.$nextTick();

      // Enable team championship and teams drop rounds
      const teamChampCheckbox = wrapper.findAllComponents({ name: 'Checkbox' }).find((c) => {
        return c.attributes('input-id') === 'team_championship';
      });
      await teamChampCheckbox?.setValue(true);
      await wrapper.vm.$nextTick();

      const teamsDropCheckbox = wrapper.findAllComponents({ name: 'Checkbox' }).find((c) => {
        return c.attributes('input-id') === 'teams_drop_rounds';
      });
      await teamsDropCheckbox?.setValue(true);
      await wrapper.vm.$nextTick();
    });

    it('sets minimum value to 0 for total teams drop rounds', () => {
      const inputNumber = wrapper.findAllComponents({ name: 'InputNumber' }).find((i) => {
        return i.attributes('id') === 'teams_total_drop_rounds';
      });

      expect(inputNumber?.props('min')).toBe(0);
    });

    it('sets maximum value to 10 for total teams drop rounds', () => {
      const inputNumber = wrapper.findAllComponents({ name: 'InputNumber' }).find((i) => {
        return i.attributes('id') === 'teams_total_drop_rounds';
      });

      expect(inputNumber?.props('max')).toBe(10);
    });

    it('enables show-buttons for total teams drop rounds', () => {
      const inputNumber = wrapper.findAllComponents({ name: 'InputNumber' }).find((i) => {
        return i.attributes('id') === 'teams_total_drop_rounds';
      });

      expect(inputNumber?.props('showButtons')).toBe(true);
    });

    it('uses horizontal button layout for total teams drop rounds', () => {
      const inputNumber = wrapper.findAllComponents({ name: 'InputNumber' }).find((i) => {
        return i.attributes('id') === 'teams_total_drop_rounds';
      });

      expect(inputNumber?.props('buttonLayout')).toBe('horizontal');
    });
  });
});
