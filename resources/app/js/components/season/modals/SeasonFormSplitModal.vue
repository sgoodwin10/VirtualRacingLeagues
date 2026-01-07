<script setup lang="ts">
import { ref, reactive, computed, watch, onUnmounted } from 'vue';
import { useDebounceFn } from '@vueuse/core';
import { useToast } from 'primevue/usetoast';
import { useSeasonStore } from '@app/stores/seasonStore';
import { useSeasonValidation } from '@app/composables/useSeasonValidation';
import { checkSeasonSlugAvailability, getSeasonTiebreakerRules } from '@app/services/seasonService';
import type {
  Season,
  SeasonForm,
  SlugCheckResponse,
  SeasonTiebreakerRule,
} from '@app/types/season';

// Icons
import { PhGear } from '@phosphor-icons/vue';

// Common Components
import BaseModal from '@app/components/common/modals/BaseModal.vue';
import { Button } from '@app/components/common/buttons';

// Season Modal Components
import SeasonEditSidebar from './partials/SeasonEditSidebar.vue';
import BasicInfoSection from './partials/sections/BasicInfoSection.vue';
import DriverSettingsSection from './partials/sections/DriverSettingsSection.vue';
import TeamSettingsSection from './partials/sections/TeamSettingsSection.vue';
import BrandingSection from './partials/sections/BrandingSection.vue';
import type { SectionId } from './partials/SeasonEditSidebar.vue';

type SectionType = 'basic' | 'driver' | 'team' | 'branding';

// Props
interface Props {
  visible: boolean;
  competitionId: number;
  season?: Season | null;
  isEditMode?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  season: null,
  isEditMode: false,
});

// Emits
interface Emits {
  (e: 'update:visible', value: boolean): void;
  (e: 'season-saved', season: Season): void;
}

const emit = defineEmits<Emits>();

// Composables
const toast = useToast();
const seasonStore = useSeasonStore();

// Internal form type with 'all' option for dropdown compatibility
interface InternalSeasonForm extends Omit<SeasonForm, 'teams_drivers_for_calculation'> {
  teams_drivers_for_calculation: number | 'all' | null;
}

// State
const activeSection = ref<SectionType>('basic');
const form = reactive<InternalSeasonForm>({
  name: '',
  car_class: '',
  description: '',
  technical_specs: '',
  logo: null,
  logo_url: null,
  banner: null,
  banner_url: null,
  race_divisions_enabled: false,
  team_championship_enabled: false,
  race_times_required: true,
  drop_round: false,
  total_drop_rounds: 0,
  teams_drivers_for_calculation: 'all',
  teams_drop_rounds: false,
  teams_total_drop_rounds: null,
  round_totals_tiebreaker_rules_enabled: false,
});

const isSubmitting = ref(false);
const isLoadingData = ref(false);

// Track if existing images should be removed
const removeExistingLogo = ref(false);
const removeExistingBanner = ref(false);

// Tiebreaker rules state
const orderedRules = ref<SeasonTiebreakerRule[]>([]);
const isLoadingRules = ref(false);
const tiebreakerRulesError = ref<string | null>(null);

// Slug preview state
const slugPreview = ref('');
const slugStatus = ref<'checking' | 'available' | 'taken' | 'error' | 'timeout' | null>(null);
const slugSuggestion = ref<string | null>(null);

// Slug check abort controller and timeout
let slugCheckTimeoutId: ReturnType<typeof setTimeout> | null = null;
const slugCheckController = ref<AbortController | null>(null);
const originalSeasonName = ref<string>('');

// Validation
const { errors, validateAll, clearError, clearErrors } = useSeasonValidation(form);

// Computed
const modalTitle = computed(() =>
  props.isEditMode ? `Edit Season: ${form.name}` : 'Create Season',
);
const modalSubtitle = computed(() =>
  props.isEditMode ? 'Update season configuration' : 'Create new racing season',
);

const submitButtonLabel = computed(() => (props.isEditMode ? 'Save Changes' : 'Create Season'));

const canSubmit = computed(() => {
  return (
    !isSubmitting.value &&
    form.name.trim().length >= 3 &&
    !errors.name &&
    !errors.car_class &&
    !errors.description &&
    !errors.technical_specs
  );
});

const isNameValid = computed(() => {
  return form.name.trim() !== '' && slugStatus.value !== 'taken';
});

const driverSettingsCount = computed(() => {
  let count = 0;
  if (form.race_divisions_enabled) count++;
  if (form.drop_round) count++;
  if (form.round_totals_tiebreaker_rules_enabled) count++;
  return count;
});

const mediaCount = computed(() => {
  let count = 0;
  if (form.logo || form.logo_url) count++;
  if (form.banner || form.banner_url) count++;
  return count;
});

// Slug checking (debounced with timeout)
const checkSlug = useDebounceFn(async () => {
  if (!form.name || form.name.trim().length < 3) {
    slugPreview.value = '';
    slugStatus.value = null;
    return;
  }

  // Skip slug check if the name hasn't changed from the original (edit mode)
  if (props.isEditMode && form.name === originalSeasonName.value) {
    slugStatus.value = 'available';
    slugPreview.value = props.season?.slug || '';
    return;
  }

  // Clear any existing timeout
  if (slugCheckTimeoutId) {
    clearTimeout(slugCheckTimeoutId);
    slugCheckTimeoutId = null;
  }

  // Abort any pending slug check
  if (slugCheckController.value) {
    slugCheckController.value.abort();
  }

  // Create new controller for this request
  slugCheckController.value = new AbortController();

  slugStatus.value = 'checking';

  // Set timeout for the request (10 seconds)
  slugCheckTimeoutId = setTimeout(() => {
    slugCheckController.value?.abort();
    slugStatus.value = 'timeout';
    slugPreview.value = '';
    slugSuggestion.value = null;
  }, 10000);

  try {
    const result: SlugCheckResponse = await checkSeasonSlugAvailability(
      props.competitionId,
      form.name,
      props.season?.id,
      slugCheckController.value.signal,
    );

    // Clear timeout on success
    if (slugCheckTimeoutId) {
      clearTimeout(slugCheckTimeoutId);
      slugCheckTimeoutId = null;
    }

    slugPreview.value = result.slug;
    slugStatus.value = result.available ? 'available' : 'taken';
    slugSuggestion.value = result.suggestion;
  } catch (error) {
    // Clear timeout on error
    if (slugCheckTimeoutId) {
      clearTimeout(slugCheckTimeoutId);
      slugCheckTimeoutId = null;
    }

    // Ignore abort errors (timeout or manual cancellation)
    if (error instanceof Error && error.name === 'AbortError') {
      // Status might already be 'timeout' if the timeout fired
      // Don't overwrite it in that case
      return;
    }

    slugStatus.value = 'error';
    slugPreview.value = '';
    slugSuggestion.value = null;
  }
}, 500);

// Watch name changes for slug preview
watch(
  () => form.name,
  () => {
    clearError('name');
    checkSlug();
  },
);

// Watch tiebreaker toggle
watch(
  () => form.round_totals_tiebreaker_rules_enabled,
  async (enabled) => {
    if (enabled) {
      await seasonStore.fetchTiebreakerRules();

      if (props.isEditMode && props.season?.id) {
        await loadSeasonTiebreakerRules(props.season.id);
      } else {
        orderedRules.value = seasonStore.availableTiebreakerRules.map((rule, index) => ({
          id: 0,
          season_id: 0,
          rule_id: rule.id,
          rule_name: rule.name,
          rule_slug: rule.slug,
          rule_description: rule.description,
          order: index + 1,
        }));
      }
    } else {
      orderedRules.value = [];
      tiebreakerRulesError.value = null;
    }
  },
);

// Watch for modal visibility changes
watch(
  () => props.visible,
  async (newValue: boolean) => {
    if (newValue) {
      // Load tiebreaker rules when modal opens
      try {
        await seasonStore.fetchTiebreakerRules();

        // If in edit mode, load the season data
        if (props.isEditMode && props.season) {
          loadSeasonData();
        }
      } catch {
        toast.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load required data. Please try again.',
          life: 5000,
        });
        closeModal();
      }
    } else {
      // Reset form when modal closes
      resetForm();
    }
  },
);

// Methods
async function loadSeasonTiebreakerRules(seasonId: number): Promise<void> {
  isLoadingRules.value = true;
  tiebreakerRulesError.value = null;

  try {
    const rules = await getSeasonTiebreakerRules(seasonId);

    orderedRules.value = rules.map((rule) => {
      const availableRule = seasonStore.availableTiebreakerRules.find(
        (ar) => ar.slug === rule.rule_slug,
      );
      return {
        ...rule,
        rule_name: availableRule?.name ?? rule.rule_slug,
        rule_description: availableRule?.description ?? null,
      };
    });
  } catch (error) {
    tiebreakerRulesError.value = 'Failed to load tiebreaker rules';
    console.error('Error loading tiebreaker rules:', error);
  } finally {
    isLoadingRules.value = false;
  }
}

function loadSeasonData(): void {
  if (!props.season) return;

  isLoadingData.value = true;

  // Store the original name for comparison
  originalSeasonName.value = props.season.name;

  form.name = props.season.name;
  form.car_class = props.season.car_class || '';
  form.description = props.season.description || '';
  form.technical_specs = props.season.technical_specs || '';
  form.logo = null;
  form.logo_url = props.season.has_own_logo
    ? props.season.logo?.original || props.season.logo_url
    : null;
  form.banner = null;
  form.banner_url = props.season.banner?.original || props.season.banner_url;
  form.race_divisions_enabled = props.season.race_divisions_enabled;
  form.team_championship_enabled = props.season.team_championship_enabled;
  form.race_times_required = props.season.race_times_required;
  form.drop_round = props.season.drop_round;
  form.total_drop_rounds = props.season.total_drop_rounds;
  form.teams_drivers_for_calculation =
    props.season.teams_drivers_for_calculation === null
      ? 'all'
      : props.season.teams_drivers_for_calculation;
  form.teams_drop_rounds = props.season.teams_drop_rounds;
  form.teams_total_drop_rounds = props.season.teams_total_drop_rounds;
  form.round_totals_tiebreaker_rules_enabled = props.season.round_totals_tiebreaker_rules_enabled;

  removeExistingLogo.value = false;
  removeExistingBanner.value = false;

  isLoadingData.value = false;
}

function resetForm(): void {
  // Clear timeout if active
  if (slugCheckTimeoutId) {
    clearTimeout(slugCheckTimeoutId);
    slugCheckTimeoutId = null;
  }

  // Abort any pending slug checks
  if (slugCheckController.value) {
    slugCheckController.value.abort();
    slugCheckController.value = null;
  }

  activeSection.value = 'basic';
  form.name = '';
  form.car_class = '';
  form.description = '';
  form.technical_specs = '';
  form.logo = null;
  form.logo_url = null;
  form.banner = null;
  form.banner_url = null;
  form.race_divisions_enabled = false;
  form.team_championship_enabled = false;
  form.race_times_required = true;
  form.drop_round = false;
  form.total_drop_rounds = 0;
  form.teams_drivers_for_calculation = 'all';
  form.teams_drop_rounds = false;
  form.teams_total_drop_rounds = null;
  form.round_totals_tiebreaker_rules_enabled = false;
  slugPreview.value = '';
  slugStatus.value = null;
  slugSuggestion.value = null;
  originalSeasonName.value = '';
  orderedRules.value = [];
  isLoadingRules.value = false;
  tiebreakerRulesError.value = null;
  removeExistingLogo.value = false;
  removeExistingBanner.value = false;
  clearErrors();
}

// Cleanup on component unmount
onUnmounted(() => {
  if (slugCheckTimeoutId) {
    clearTimeout(slugCheckTimeoutId);
    slugCheckTimeoutId = null;
  }

  if (slugCheckController.value) {
    slugCheckController.value.abort();
    slugCheckController.value = null;
  }
});

function closeModal(): void {
  emit('update:visible', false);
}

function handleCancel(): void {
  closeModal();
}

function handleRemoveExistingLogo(): void {
  removeExistingLogo.value = true;
  form.logo_url = null;
}

function handleRemoveExistingBanner(): void {
  removeExistingBanner.value = true;
  form.banner_url = null;
}

function handleSectionChange(sectionId: SectionId): void {
  activeSection.value = sectionId;
}

async function handleSubmit(): Promise<void> {
  if (!validateAll()) {
    toast.add({
      severity: 'error',
      summary: 'Validation Error',
      detail: 'Please fix the errors before submitting',
      life: 3000,
    });
    return;
  }

  isSubmitting.value = true;

  try {
    const teamsDriversValue =
      form.teams_drivers_for_calculation === 'all' ? null : form.teams_drivers_for_calculation;

    if (props.isEditMode && props.season) {
      const updated = await seasonStore.updateExistingSeason(props.season.id, {
        name: form.name,
        car_class: form.car_class || null,
        description: form.description || null,
        technical_specs: form.technical_specs || null,
        logo: form.logo,
        banner: form.banner,
        race_divisions_enabled: form.race_divisions_enabled,
        team_championship_enabled: form.team_championship_enabled,
        race_times_required: form.race_times_required,
        drop_round: form.drop_round,
        total_drop_rounds: form.total_drop_rounds,
        teams_drivers_for_calculation: teamsDriversValue,
        teams_drop_rounds: form.teams_drop_rounds,
        teams_total_drop_rounds: form.teams_total_drop_rounds,
        round_totals_tiebreaker_rules_enabled: form.round_totals_tiebreaker_rules_enabled,
      });

      if (form.round_totals_tiebreaker_rules_enabled && orderedRules.value.length > 0) {
        const ruleOrder = orderedRules.value.map((rule, index) => ({
          id: rule.rule_id,
          order: index + 1,
        }));
        await seasonStore.updateTiebreakerRulesOrder(updated.id, ruleOrder);
      }

      toast.add({
        severity: 'success',
        summary: 'Season Updated',
        detail: 'Season has been updated successfully',
        life: 3000,
      });

      emit('season-saved', updated);
    } else {
      const created = await seasonStore.createNewSeason(props.competitionId, {
        name: form.name,
        car_class: form.car_class || undefined,
        description: form.description || undefined,
        technical_specs: form.technical_specs || undefined,
        logo: form.logo || undefined,
        banner: form.banner || undefined,
        race_divisions_enabled: form.race_divisions_enabled,
        team_championship_enabled: form.team_championship_enabled,
        race_times_required: form.race_times_required,
        drop_round: form.drop_round,
        total_drop_rounds: form.total_drop_rounds,
        teams_drivers_for_calculation: teamsDriversValue,
        teams_drop_rounds: form.teams_drop_rounds,
        teams_total_drop_rounds: form.teams_total_drop_rounds,
        round_totals_tiebreaker_rules_enabled: form.round_totals_tiebreaker_rules_enabled,
      });

      if (form.round_totals_tiebreaker_rules_enabled && orderedRules.value.length > 0) {
        const ruleOrder = orderedRules.value.map((rule, index) => ({
          id: rule.rule_id,
          order: index + 1,
        }));
        await seasonStore.updateTiebreakerRulesOrder(created.id, ruleOrder);
      }

      toast.add({
        severity: 'success',
        summary: 'Season Created',
        detail: 'You can now assign drivers to this season.',
        life: 5000,
      });

      emit('season-saved', created);
    }

    closeModal();
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to save season';

    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: errorMessage,
      life: 5000,
    });
  } finally {
    isSubmitting.value = false;
  }
}
</script>

<template>
  <BaseModal
    :visible="visible"
    :header="modalTitle"
    width="6xl"
    :closable="true"
    :block-scroll="true"
    :loading="isLoadingData"
    :show-header="true"
    content-class="!p-0"
    @update:visible="emit('update:visible', $event)"
  >
    <!-- Custom Header -->
    <template #header>
      <div
        class="w-9 h-9 flex items-center justify-center bg-[var(--cyan-dim)] rounded-lg border border-[var(--border)]"
      >
        <PhGear :size="18" weight="duotone" class="text-[var(--cyan)]" />
      </div>
      <div class="flex-auto pl-4">
        <div class="font-mono font-semibold tracking-wide text-[var(--text-primary)]">
          {{ modalTitle }}
        </div>
        <div class="text-[var(--text-secondary)]">
          {{ modalSubtitle }}
        </div>
      </div>
    </template>

    <!-- Split Layout -->
    <div class="grid grid-cols-[200px_1fr] min-h-[520px] max-h-[72vh]">
      <!-- Sidebar -->
      <SeasonEditSidebar
        :active-section="activeSection"
        :season-name="form.name"
        :is-name-valid="isNameValid"
        :driver-settings-count="driverSettingsCount"
        :team-settings-enabled="form.team_championship_enabled"
        :media-count="mediaCount"
        @change-section="handleSectionChange"
      />

      <!-- Main Content -->
      <main class="overflow-y-auto bg-[var(--bg-dark)] p-6">
        <!-- Basic Info Section -->
        <BasicInfoSection
          v-show="activeSection === 'basic'"
          :form="{
            name: form.name,
            car_class: form.car_class,
            description: form.description,
            technical_specs: form.technical_specs,
          }"
          :errors="errors"
          :is-submitting="isSubmitting"
          :slug-preview="slugPreview"
          :slug-status="slugStatus"
          @update:name="form.name = $event"
          @update:car-class="form.car_class = $event"
          @update:description="form.description = $event"
          @update:technical-specs="form.technical_specs = $event"
        />

        <!-- Driver Settings Section -->
        <DriverSettingsSection
          v-show="activeSection === 'driver'"
          :form="{
            race_divisions_enabled: form.race_divisions_enabled,
            race_times_required: form.race_times_required,
            drop_round: form.drop_round,
            total_drop_rounds: form.total_drop_rounds,
            round_totals_tiebreaker_rules_enabled: form.round_totals_tiebreaker_rules_enabled,
          }"
          :is-submitting="isSubmitting"
          :ordered-rules="orderedRules"
          :is-loading-rules="isLoadingRules"
          :tiebreaker-rules-error="tiebreakerRulesError"
          @update:race-divisions-enabled="form.race_divisions_enabled = $event"
          @update:race-times-required="form.race_times_required = $event"
          @update:drop-round="form.drop_round = $event"
          @update:total-drop-rounds="form.total_drop_rounds = $event"
          @update:tiebreaker-rules-enabled="form.round_totals_tiebreaker_rules_enabled = $event"
          @update:ordered-rules="orderedRules = $event"
          @retry:tiebreaker-rules="loadSeasonTiebreakerRules(props.season?.id || 0)"
        />

        <!-- Team Settings Section -->
        <TeamSettingsSection
          v-show="activeSection === 'team'"
          :form="{
            team_championship_enabled: form.team_championship_enabled,
            teams_drivers_for_calculation: form.teams_drivers_for_calculation,
            teams_drop_rounds: form.teams_drop_rounds,
            teams_total_drop_rounds: form.teams_total_drop_rounds,
          }"
          :is-submitting="isSubmitting"
          @update:team-championship-enabled="form.team_championship_enabled = $event"
          @update:teams-drivers-for-calculation="form.teams_drivers_for_calculation = $event"
          @update:teams-drop-rounds="form.teams_drop_rounds = $event"
          @update:teams-total-drop-rounds="form.teams_total_drop_rounds = $event"
        />

        <!-- Branding Section -->
        <BrandingSection
          v-show="activeSection === 'branding'"
          :form="{
            logo: form.logo,
            logo_url: form.logo_url,
            banner: form.banner,
            banner_url: form.banner_url,
          }"
          :is-submitting="isSubmitting"
          @update:logo="form.logo = $event"
          @update:banner="form.banner = $event"
          @remove-existing-logo="handleRemoveExistingLogo"
          @remove-existing-banner="handleRemoveExistingBanner"
        />
      </main>
    </div>

    <!-- Footer -->
    <template #footer>
      <div class="flex justify-end gap-3">
        <Button label="Cancel" variant="secondary" :disabled="isSubmitting" @click="handleCancel" />
        <Button
          :label="submitButtonLabel"
          :loading="isSubmitting"
          :disabled="!canSubmit"
          @click="handleSubmit"
        />
      </div>
    </template>
  </BaseModal>
</template>
