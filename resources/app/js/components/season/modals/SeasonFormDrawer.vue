<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue';
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

// PrimeVue Components
import InputText from 'primevue/inputtext';
import Textarea from 'primevue/textarea';
import { Button } from '@app/components/common/buttons';
import Message from 'primevue/message';
import Dialog from 'primevue/dialog';
import Checkbox from 'primevue/checkbox';
import InputNumber from 'primevue/inputnumber';
import Select from 'primevue/select';
import Tabs from 'primevue/tabs';
import TabList from 'primevue/tablist';
import Tab from 'primevue/tab';
import TabPanels from 'primevue/tabpanels';
import TabPanel from 'primevue/tabpanel';
import OrderList from 'primevue/orderlist';

// Common Components
import BaseModal from '@app/components/common/modals/BaseModal.vue';
import FormLabel from '@app/components/common/forms/FormLabel.vue';
import FormError from '@app/components/common/forms/FormError.vue';
import FormInputGroup from '@app/components/common/forms/FormInputGroup.vue';
import FormOptionalText from '@app/components/common/forms/FormOptionalText.vue';
import ImageUpload from '@app/components/common/forms/ImageUpload.vue';
import BasePanel from '@app/components/common/panels/BasePanel.vue';

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
  (e: 'hide'): void;
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
const activeTab = ref('0');
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

const originalName = ref('');
const isSubmitting = ref(false);
const isLoadingData = ref(false);
const showNameChangeDialog = ref(false);

// Tiebreaker rules state
const orderedRules = ref<SeasonTiebreakerRule[]>([]);
const isLoadingRules = ref(false);
const tiebreakerRulesError = ref<string | null>(null);

// Slug preview state
const slugPreview = ref('');
const slugStatus = ref<'checking' | 'available' | 'taken' | 'error' | 'timeout' | null>(null);
const slugSuggestion = ref<string | null>(null);

// Team championship options
// Note: Using string 'all' instead of null for PrimeVue compatibility
// Will convert 'all' to null when submitting to API
const teamsDriversOptions = [
  { label: 'All', value: 'all' },
  { label: '1', value: 1 },
  { label: '2', value: 2 },
  { label: '3', value: 3 },
  { label: '4', value: 4 },
  { label: '5', value: 5 },
  { label: '6', value: 6 },
  { label: '7', value: 7 },
  { label: '8', value: 8 },
  { label: '9', value: 9 },
  { label: '10', value: 10 },
  { label: '11', value: 11 },
  { label: '12', value: 12 },
  { label: '13', value: 13 },
  { label: '14', value: 14 },
  { label: '15', value: 15 },
  { label: '16', value: 16 },
];

// Validation
const { errors, validateAll, clearError, clearErrors } = useSeasonValidation(form);

// Computed
const localVisible = computed({
  get: () => props.visible,
  set: (value) => emit('update:visible', value),
});

const modalTitle = computed(() => (props.isEditMode ? 'Edit Season' : 'Create Season'));

const nameChanged = computed(() => {
  return props.isEditMode && form.name !== originalName.value;
});

const canSubmit = computed(() => {
  return (
    !isSubmitting.value &&
    form.name.trim().length >= 3 &&
    !errors.name &&
    !errors.car_class &&
    !errors.description &&
    !errors.technical_specs &&
    !errors.logo &&
    !errors.banner
  );
});

// Slug checking (debounced with timeout)
const checkSlug = useDebounceFn(async () => {
  if (!form.name || form.name.trim().length < 3) {
    slugPreview.value = '';
    slugStatus.value = null;
    return;
  }

  slugStatus.value = 'checking';

  // Create timeout promise
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error('Slug check timeout')), 10000);
  });

  try {
    const result: SlugCheckResponse = await Promise.race([
      checkSeasonSlugAvailability(props.competitionId, form.name, props.season?.id),
      timeoutPromise,
    ]);

    slugPreview.value = result.slug;
    slugStatus.value = result.available ? 'available' : 'taken';
    slugSuggestion.value = result.suggestion;
  } catch (error) {
    if (error instanceof Error && error.message === 'Slug check timeout') {
      slugStatus.value = 'timeout';
    } else {
      slugStatus.value = 'error';
    }
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
      // Load available rules from store
      await seasonStore.fetchTiebreakerRules();

      if (props.isEditMode && props.season?.id) {
        // Edit mode: Load existing rules for this season
        await loadSeasonTiebreakerRules(props.season.id);
      } else {
        // Create mode: Use default order from available rules
        orderedRules.value = seasonStore.availableTiebreakerRules.map((rule, index) => ({
          id: 0, // New rule, no ID yet
          season_id: 0,
          rule_id: rule.id,
          rule_name: rule.name,
          rule_slug: rule.slug,
          rule_description: rule.description,
          order: index + 1,
        }));
      }
    } else {
      // Disabled: Clear rules
      orderedRules.value = [];
      tiebreakerRulesError.value = null;
    }
  },
);

// Watch drawer visibility
watch(
  () => props.visible,
  (visible) => {
    if (visible) {
      if (props.isEditMode && props.season) {
        loadSeasonData();
      } else {
        resetForm();
      }
    }
  },
  { immediate: true }, // Run immediately on mount if visible is true
);

// Methods
async function loadSeasonTiebreakerRules(seasonId: number): Promise<void> {
  isLoadingRules.value = true;
  tiebreakerRulesError.value = null;

  try {
    const rules = await getSeasonTiebreakerRules(seasonId);

    // Enrich rules with names and descriptions from available rules
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

  form.name = props.season.name;
  form.car_class = props.season.car_class || '';
  form.description = props.season.description || '';
  form.technical_specs = props.season.technical_specs || '';
  form.logo = null;
  // Prefer MediaObject.original over old logo_url
  form.logo_url = props.season.has_own_logo
    ? props.season.logo?.original || props.season.logo_url
    : null;
  form.banner = null;
  // Prefer MediaObject.original over old banner_url
  form.banner_url = props.season.banner?.original || props.season.banner_url;
  form.race_divisions_enabled = props.season.race_divisions_enabled;
  form.team_championship_enabled = props.season.team_championship_enabled;
  form.race_times_required = props.season.race_times_required;
  form.drop_round = props.season.drop_round;
  form.total_drop_rounds = props.season.total_drop_rounds;
  // Convert null to 'all' for PrimeVue Dropdown compatibility
  form.teams_drivers_for_calculation =
    props.season.teams_drivers_for_calculation === null
      ? 'all'
      : props.season.teams_drivers_for_calculation;
  form.teams_drop_rounds = props.season.teams_drop_rounds;
  form.teams_total_drop_rounds = props.season.teams_total_drop_rounds;
  form.round_totals_tiebreaker_rules_enabled = props.season.round_totals_tiebreaker_rules_enabled;

  originalName.value = props.season.name;

  isLoadingData.value = false;
}

function resetForm(): void {
  activeTab.value = '0';
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
  form.teams_drivers_for_calculation = 'all'; // Default to 'all' instead of null
  form.teams_drop_rounds = false;
  form.teams_total_drop_rounds = null;
  form.round_totals_tiebreaker_rules_enabled = false;
  originalName.value = '';
  slugPreview.value = '';
  slugStatus.value = null;
  slugSuggestion.value = null;
  orderedRules.value = [];
  isLoadingRules.value = false;
  tiebreakerRulesError.value = null;
  clearErrors();
}

function handleCancel(): void {
  localVisible.value = false;
  resetForm();
}

async function handleSubmit(): Promise<void> {
  // If name changed in edit mode, show confirmation
  if (nameChanged.value) {
    showNameChangeDialog.value = true;
    return;
  }

  await submitForm();
}

async function submitForm(): Promise<void> {
  if (!validateAll()) {
    return;
  }

  isSubmitting.value = true;

  try {
    // Convert 'all' to null for API
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

      // Update tiebreaker rules order if enabled
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

      // Update tiebreaker rules order if enabled
      if (form.round_totals_tiebreaker_rules_enabled && orderedRules.value.length > 0) {
        const ruleOrder = orderedRules.value.map((rule, index) => ({
          id: rule.rule_id,
          order: index + 1,
        }));
        await seasonStore.updateTiebreakerRulesOrder(created.id, ruleOrder);
      }

      toast.add({
        severity: 'success',
        summary: 'Season Created!',
        detail: 'You can now assign drivers to this season.',
        life: 5000,
      });

      emit('season-saved', created);
    }

    localVisible.value = false;
    resetForm();
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

function confirmNameChange(): void {
  showNameChangeDialog.value = false;
  submitForm();
}

function cancelNameChange(): void {
  showNameChangeDialog.value = false;
}
</script>

<template>
  <BaseModal
    v-model:visible="localVisible"
    :header="modalTitle"
    width="4xl"
    :closable="!isSubmitting"
    :dismissable-mask="false"
    :loading="isLoadingData"
    content-class="bg-slate-50"
    @hide="emit('hide')"
  >
    <div class="space-y-3">
      <!-- Two-Column Layout: Main Fields (Left) + Toggles (Right) -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <!-- Left Column: Main Fields (2/3 width) -->
        <div class="lg:col-span-2 space-y-2.5">
          <!-- Name Field -->
          <FormInputGroup>
            <FormLabel for="name" text="Season Name" required />
            <InputText
              id="name"
              v-model="form.name"
              size="small"
              placeholder="e.g., Season 1, 2024 Winter Championship"
              :class="{ 'p-invalid': errors.name }"
              :disabled="isSubmitting"
              maxlength="100"
              class="w-full"
            />
            <FormError :error="errors.name" />

            <!-- Slug Preview - Compact -->
            <div v-if="slugPreview" class="mt-1.5 flex items-center gap-1.5">
              <template v-if="slugStatus === 'checking'">
                <i class="pi pi-spinner pi-spin text-xs text-blue-500"></i>
                <small class="text-gray-600">Checking...</small>
              </template>
              <template v-else-if="slugStatus === 'available'">
                <i class="pi pi-check-circle text-xs text-green-500"></i>
                <small class="text-gray-600">
                  URL: <span class="font-mono text-green-600">{{ slugPreview }}</span>
                </small>
              </template>
              <template v-else-if="slugStatus === 'taken'">
                <i class="pi pi-info-circle text-xs text-amber-500"></i>
                <small class="text-gray-600">
                  Will use: <span class="font-mono text-amber-700">{{ slugSuggestion }}</span>
                </small>
              </template>
              <template v-else-if="slugStatus === 'timeout'">
                <i class="pi pi-exclamation-triangle text-xs text-orange-500"></i>
                <small class="text-gray-600">Slug check timed out. Please try again.</small>
              </template>
            </div>
          </FormInputGroup>

          <!-- Car Class -->
          <FormInputGroup>
            <FormLabel for="car_class" text="Car Class" />
            <InputText
              id="car_class"
              v-model="form.car_class"
              size="small"
              placeholder="e.g., GT3, Formula 1, LMP1"
              :class="{ 'p-invalid': errors.car_class }"
              :disabled="isSubmitting"
              maxlength="150"
              class="w-full"
            />
            <FormOptionalText text="Specify the car class used in this season" />
            <FormError :error="errors.car_class" />
          </FormInputGroup>

          <!-- Description -->
          <FormInputGroup>
            <FormLabel for="description" text="Description" />
            <Textarea
              id="description"
              v-model="form.description"
              rows="3"
              placeholder="Describe this season, race format, rules..."
              :class="{ 'p-invalid': errors.description }"
              :disabled="isSubmitting"
              maxlength="2000"
              class="w-full"
            />
            <FormOptionalText text="Tell participants about this season" />
            <FormError :error="errors.description" />
          </FormInputGroup>

          <!-- Technical Specs -->
          <FormInputGroup>
            <FormLabel for="technical_specs" text="Technical Specifications" />
            <Textarea
              id="technical_specs"
              v-model="form.technical_specs"
              rows="3"
              placeholder="Car setup rules, performance restrictions, balance of performance..."
              :class="{ 'p-invalid': errors.technical_specs }"
              :disabled="isSubmitting"
              maxlength="2000"
              class="w-full"
            />
            <FormOptionalText text="Technical rules and car setup information" />
            <FormError :error="errors.technical_specs" />
          </FormInputGroup>
        </div>

        <!-- Right Column: Toggles & Info (1/3 width) -->
        <div class="lg:col-span-1 space-y-2.5">
          <!-- Race Divisions Toggle -->
          <FormInputGroup>
            <div class="flex items-center gap-3">
              <Checkbox
                v-model="form.race_divisions_enabled"
                input-id="race_divisions"
                :binary="true"
                :disabled="isSubmitting"
              />
              <FormLabel
                for="race_divisions"
                text="Enable division championship"
                class="mb-0 cursor-pointer"
              />
            </div>
            <FormOptionalText text="Organize drivers into competitive divisions" />
          </FormInputGroup>

          <!-- Team Championship Toggle -->
          <FormInputGroup>
            <div class="flex items-center gap-3">
              <Checkbox
                v-model="form.team_championship_enabled"
                input-id="team_championship"
                :binary="true"
                :disabled="isSubmitting"
              />
              <FormLabel
                for="team_championship"
                text="Enable Team Championship"
                class="mb-0 cursor-pointer"
              />
            </div>
            <FormOptionalText text="Track team standings alongside individual drivers" />
          </FormInputGroup>

          <!-- Race Times Required Toggle -->
          <FormInputGroup>
            <div class="flex items-center gap-3">
              <Checkbox
                v-model="form.race_times_required"
                input-id="race_times_required"
                :binary="true"
                :disabled="isSubmitting"
              />
              <FormLabel
                for="race_times_required"
                text="Require Race Times"
                class="mb-0 cursor-pointer"
              />
            </div>
            <FormOptionalText text="Require lap times to be recorded for race results" />
          </FormInputGroup>

          <!-- Drop Round Toggle -->
          <FormInputGroup>
            <div class="flex items-center gap-3">
              <Checkbox
                v-model="form.drop_round"
                input-id="drop_round"
                :binary="true"
                :disabled="isSubmitting"
              />
              <FormLabel for="drop_round" text="Enable Drop Round" class="mb-0 cursor-pointer" />
            </div>
            <FormOptionalText text="Exclude lowest scoring rounds from championship" />
          </FormInputGroup>

          <!-- Total Drop Rounds Input -->
          <FormInputGroup v-if="form.drop_round">
            <FormLabel for="total_drop_rounds" text="Total Drop Rounds" />
            <InputNumber
              id="total_drop_rounds"
              v-model="form.total_drop_rounds"
              :min="0"
              :max="10"
              :disabled="isSubmitting"
              show-buttons
              button-layout="horizontal"
              class="w-full"
              size="small"
            />
            <FormOptionalText text="Number of lowest scoring rounds to exclude" />
          </FormInputGroup>

          <!-- Team Championship Settings Card -->
          <BasePanel v-if="form.team_championship_enabled" class="bg-blue-50/50 border-blue-200">
            <div class="p-3 space-y-2.5">
              <div class="flex items-center gap-2 mb-2">
                <i class="pi pi-users text-blue-600"></i>
                <h4 class="font-semibold text-blue-900">Team Championship Settings</h4>
              </div>

              <!-- Drivers for Team Calculation -->
              <FormInputGroup>
                <FormLabel for="teams_drivers_calculation" text="Drivers for Team Calculation" />
                <Select
                  id="teams_drivers_calculation"
                  v-model="form.teams_drivers_for_calculation"
                  :options="teamsDriversOptions"
                  option-label="label"
                  option-value="value"
                  placeholder="Select number of drivers"
                  class="w-full"
                  size="small"
                  :disabled="isSubmitting"
                />
                <FormOptionalText text="How many drivers' points count towards team round scores" />
              </FormInputGroup>

              <!-- Enable Teams Drop Rounds -->
              <FormInputGroup>
                <div class="flex items-center gap-3">
                  <Checkbox
                    v-model="form.teams_drop_rounds"
                    input-id="teams_drop_rounds"
                    :binary="true"
                    :disabled="isSubmitting"
                  />
                  <FormLabel
                    for="teams_drop_rounds"
                    text="Enable Teams Drop Rounds"
                    class="mb-0 cursor-pointer"
                  />
                </div>
                <FormOptionalText text="Exclude lowest scoring rounds from team standings" />
              </FormInputGroup>

              <!-- Total Teams Drop Rounds -->
              <FormInputGroup v-if="form.teams_drop_rounds">
                <FormLabel for="teams_total_drop_rounds" text="Total Teams Drop Rounds" />
                <InputNumber
                  id="teams_total_drop_rounds"
                  v-model="form.teams_total_drop_rounds"
                  :min="0"
                  :max="10"
                  :disabled="isSubmitting"
                  show-buttons
                  button-layout="horizontal"
                  class="w-full"
                  size="small"
                />
                <FormOptionalText
                  text="Number of lowest scoring rounds to exclude from team standings"
                />
              </FormInputGroup>
            </div>
          </BasePanel>

          <!-- Tiebreaker Rules Toggle -->
          <FormInputGroup>
            <div class="flex items-center gap-3">
              <Checkbox
                v-model="form.round_totals_tiebreaker_rules_enabled"
                input-id="tiebreaker_rules"
                :binary="true"
                :disabled="isSubmitting"
              />
              <FormLabel
                for="tiebreaker_rules"
                text="Enable Tiebreaker Rules"
                class="mb-0 cursor-pointer"
              />
            </div>
            <FormOptionalText text="Apply tiebreaker rules when drivers have equal points" />
          </FormInputGroup>

          <!-- Tiebreaker Rules Configuration Panel -->
          <BasePanel
            v-if="form.round_totals_tiebreaker_rules_enabled"
            class="bg-amber-50/50 border-amber-200"
          >
            <div class="p-3 space-y-2.5">
              <div class="flex items-center gap-2 mb-2">
                <i class="pi pi-sort-alt text-amber-600"></i>
                <h4 class="font-semibold text-amber-900">Tiebreaker Rule Priority</h4>
              </div>

              <p class="text-sm text-gray-600 mb-3">
                Drag and drop to reorder. Rules are applied from top to bottom until a tie is
                broken.
              </p>

              <!-- Error State -->
              <Message v-if="tiebreakerRulesError" severity="error" :closable="false">
                {{ tiebreakerRulesError }}
              </Message>

              <!-- Loading State -->
              <div v-else-if="isLoadingRules" class="flex items-center justify-center py-4">
                <i class="pi pi-spinner pi-spin text-2xl text-amber-600"></i>
              </div>

              <!-- Empty State -->
              <Message v-else-if="orderedRules.length === 0" severity="warn" :closable="false">
                No tiebreaker rules available
              </Message>

              <!-- OrderList Component -->
              <OrderList
                v-else
                v-model="orderedRules"
                data-key="rule_id"
                :pt="{
                  list: { class: 'space-y-2' },
                  item: { class: 'bg-white border border-amber-200 rounded-md p-3 shadow-sm' },
                }"
              >
                <template #item="{ item, index }">
                  <div class="flex items-start gap-3">
                    <!-- Position Badge -->
                    <div
                      class="flex-shrink-0 w-7 h-7 rounded-full bg-amber-100 text-amber-800 font-bold flex items-center justify-center text-sm"
                    >
                      {{ index + 1 }}
                    </div>

                    <!-- Rule Details -->
                    <div class="flex-1 min-w-0">
                      <div class="font-semibold text-gray-900">{{ item.rule_name }}</div>
                      <div v-if="item.rule_description" class="text-sm text-gray-600 mt-1">
                        {{ item.rule_description }}
                      </div>
                    </div>

                    <!-- Drag Handle Icon -->
                    <div class="flex-shrink-0 text-gray-400">
                      <i class="pi pi-bars cursor-move"></i>
                    </div>
                  </div>
                </template>
              </OrderList>

              <!-- Info Message -->
              <Message severity="info" :closable="false" class="mt-3">
                <i class="pi pi-info-circle mr-2"></i>
                If no rule breaks the tie, drivers will share the same position and receive
                identical points.
              </Message>
            </div>
          </BasePanel>

          <!-- Info Message -->
          <Message severity="info" :closable="false">
            <i class="pi pi-info-circle mr-2"></i>
            Logo inherits from competition by default. You can upload a custom logo in the branding
            tab.
          </Message>
        </div>
      </div>

      <!-- Tabs Section - Branding -->
      <Tabs v-model:value="activeTab">
        <TabList>
          <Tab value="0">Branding</Tab>
        </TabList>
        <TabPanels>
          <!-- Tab: Branding -->
          <TabPanel value="0">
            <BasePanel>
              <div class="p-4">
                <div class="mb-3 text-sm text-gray-600">
                  Upload custom branding for this season. If not provided, the competition logo will
                  be used.
                </div>
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <!-- Logo Upload -->
                  <div>
                    <FormLabel text="Season Logo" class="mb-2" />
                    <div class="rounded-md border border-gray-200 p-2">
                      <ImageUpload
                        v-model="form.logo"
                        label="Season Logo"
                        :existing-image-url="form.logo_url"
                        accept="image/png,image/jpeg,image/jpg"
                        :max-file-size="2 * 1024 * 1024"
                        :min-dimensions="{ width: 200, height: 200 }"
                        :recommended-dimensions="{ width: 500, height: 500 }"
                        preview-size="small"
                        helper-text="Square logo, 500x500px recommended. Inherits from competition if not provided."
                      />
                    </div>
                    <FormError :error="errors.logo" />
                  </div>

                  <!-- Banner Upload -->
                  <div>
                    <FormLabel text="Season Banner" class="mb-2" />
                    <div class="rounded-md border border-gray-200 p-2">
                      <ImageUpload
                        v-model="form.banner"
                        label="Season Banner"
                        :existing-image-url="form.banner_url"
                        accept="image/png,image/jpeg,image/jpg"
                        :max-file-size="5 * 1024 * 1024"
                        :min-dimensions="{ width: 800, height: 200 }"
                        :recommended-dimensions="{ width: 1920, height: 400 }"
                        preview-size="large"
                        helper-text="Wide banner image, 1920x400px recommended"
                      />
                    </div>
                    <FormError :error="errors.banner" />
                  </div>
                </div>
              </div>
            </BasePanel>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </div>

    <template #footer>
      <div class="flex gap-2 justify-end">
        <Button label="Cancel" variant="outline" :disabled="isSubmitting" @click="handleCancel" />
        <Button
          :label="isEditMode ? 'Save Changes' : 'Create Season'"
          :loading="isSubmitting"
          :disabled="!canSubmit"
          variant="primary"
          @click="handleSubmit"
        />
      </div>
    </template>
  </BaseModal>

  <!-- Name Change Confirmation Dialog -->
  <Dialog
    v-model:visible="showNameChangeDialog"
    :modal="true"
    :closable="false"
    :style="{ width: '32rem' }"
  >
    <template #header>
      <div class="flex items-center gap-2">
        <i class="pi pi-exclamation-triangle text-orange-500 text-2xl"></i>
        <span class="text-xl font-semibold">Update Season Name?</span>
      </div>
    </template>

    <div class="py-4">
      <p class="mb-4">Changing the name will update the public URL:</p>

      <div class="bg-gray-50 p-3 rounded mb-4 space-y-2">
        <div>
          <span class="text-sm font-semibold text-gray-600">Old:</span>
          <code class="block text-xs mt-1 text-gray-700">
            /seasons/{{ season?.slug || 'old-slug' }}
          </code>
        </div>
        <div>
          <span class="text-sm font-semibold text-gray-600">New:</span>
          <code class="block text-xs mt-1 text-blue-700"> /seasons/{{ slugPreview }} </code>
        </div>
      </div>

      <Message severity="warn" :closable="false">
        Existing bookmarks and shared links will break.
      </Message>
    </div>

    <template #footer>
      <div class="flex gap-2 justify-end">
        <Button label="Cancel" variant="outline" @click="cancelNameChange" />
        <Button label="Continue" variant="warning" @click="confirmNameChange" />
      </div>
    </template>
  </Dialog>
</template>
