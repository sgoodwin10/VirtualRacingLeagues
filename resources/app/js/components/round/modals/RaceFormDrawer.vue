<template>
  <BaseModal
    v-model:visible="localVisible"
    :header="
      mode === 'edit'
        ? isQualifying
          ? 'Edit Qualifying'
          : 'Edit Race'
        : isQualifying
          ? 'Create Qualifying'
          : 'Create Race'
    "
    width="6xl"
    :closable="!saving"
    :dismissable-mask="false"
    :loading="saving"
    content-class="!p-0"
    @hide="handleClose"
  >
    <!-- Split Layout -->
    <div class="grid grid-cols-[200px_1fr] min-h-[520px] max-h-[72vh]">
      <!-- Sidebar -->
      <RaceEditSidebar
        :active-section="activeSection"
        :is-qualifying="isQualifying"
        @change-section="handleSectionChange"
      />

      <!-- Main Content -->
      <main class="overflow-y-auto bg-[var(--bg-dark)] p-6">
        <!-- Basic Info Section -->
        <RaceBasicInfoSection
          v-show="activeSection === 'basic'"
          :is-qualifying="isQualifying"
          :race-type="form.race_type as string"
          :race-name="form.name || ''"
          :qualifying-format="form.qualifying_format as string"
          :qualifying-length="form.qualifying_length"
          :qualifying-tire="form.qualifying_tire || ''"
          :qualifying-pole="form.qualifying_pole"
          :qualifying-pole-top10="form.qualifying_pole_top_10"
          :grid-source="form.grid_source as string"
          :grid-source-race-id="form.grid_source_race_id"
          :source-race-options="sourceRaceOptions"
          :length-type="form.length_type as string"
          :length-value="form.length_value"
          :track-limits-enforced="form.track_limits_enforced"
          :false-start-detection="form.false_start_detection"
          :mandatory-pit-stop="form.mandatory_pit_stop"
          :errors="{
            race_type: errors.race_type,
            name: errors.name,
            qualifying_format: undefined,
            qualifying_length: errors.qualifying_length,
            grid_source: undefined,
            grid_source_race_id: errors.grid_source_race_id,
            length_type: undefined,
            length_value: errors.length_value,
          }"
          :disabled="saving"
          @update:race-type="form.race_type = $event as any"
          @update:race-name="form.name = $event"
          @update:qualifying-format="form.qualifying_format = $event as any"
          @update:qualifying-length="form.qualifying_length = $event ?? form.qualifying_length"
          @update:qualifying-tire="form.qualifying_tire = $event"
          @update:qualifying-pole="form.qualifying_pole = $event"
          @update:qualifying-pole-top10="form.qualifying_pole_top_10 = $event"
          @update:grid-source="form.grid_source = $event as any"
          @update:grid-source-race-id="form.grid_source_race_id = $event"
          @update:length-type="form.length_type = $event as any"
          @update:length-value="form.length_value = $event ?? 0"
          @update:track-limits-enforced="form.track_limits_enforced = $event"
          @update:false-start-detection="form.false_start_detection = $event"
          @update:mandatory-pit-stop="form.mandatory_pit_stop = $event"
          @blur-length-value="handleLengthValueBlur"
        />

        <!-- Points Section -->
        <RacePointsSection
          v-show="activeSection === 'points'"
          :is-qualifying="isQualifying"
          :race-points="form.race_points"
          :points-system="form.points_system"
          :fastest-lap="form.fastest_lap ?? null"
          :fastest-lap-top10="form.fastest_lap_top_10"
          :dnf-points="form.dnf_points"
          :can-copy-round-points="canCopyRoundPoints"
          :can-copy-race1-points="canCopyRace1Points"
          :is-first-race="isFirstRace"
          :errors="{
            race_points: undefined,
            points_system: errors.points_system,
            fastest_lap: undefined,
          }"
          :disabled="saving"
          @update:race-points="form.race_points = $event"
          @update:points-system="form.points_system = $event"
          @update:fastest-lap="form.fastest_lap = $event ?? null"
          @update:fastest-lap-top10="form.fastest_lap_top_10 = $event"
          @update:dnf-points="form.dnf_points = $event ?? form.dnf_points"
          @copy-round-points="copyRoundPoints"
          @copy-race1-points="copyRace1Points"
        />

        <!-- Notes Section -->
        <RaceNotesSection
          v-show="activeSection === 'notes'"
          :race-notes="form.race_notes || ''"
          :disabled="saving"
          @update:race-notes="form.race_notes = $event"
        />
      </main>
    </div>

    <template #footer>
      <div class="flex gap-2 justify-end">
        <Button label="Cancel" variant="secondary" :disabled="saving" @click="handleClose" />
        <Button
          :label="
            mode === 'edit'
              ? isQualifying
                ? 'Update Qualifying'
                : 'Update Race'
              : isQualifying
                ? 'Create Qualifying'
                : 'Create Race'
          "
          :loading="saving"
          :disabled="saving"
          variant="success"
          @click="handleSave"
        />
      </div>
    </template>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref, reactive, watch, computed, nextTick } from 'vue';
import { useToast } from 'primevue/usetoast';
import { useRaceStore } from '@app/stores/raceStore';
import { useRoundStore } from '@app/stores/roundStore';
import { useRaceSettingsStore } from '@app/stores/raceSettingsStore';
import { useRaceValidation } from '@app/composables/useRaceValidation';
import BaseModal from '@app/components/common/modals/BaseModal.vue';
import { Button } from '@app/components/common/buttons';
import RaceEditSidebar from './partials/RaceEditSidebar.vue';
import RaceBasicInfoSection from './partials/sections/RaceBasicInfoSection.vue';
import RacePointsSection from './partials/sections/RacePointsSection.vue';
import RaceNotesSection from './partials/sections/RaceNotesSection.vue';
import type { SectionId } from './partials/RaceEditSidebar.vue';
import type {
  Race,
  RaceForm,
  CreateRaceRequest,
  UpdateRaceRequest,
  PlatformRaceSettings,
} from '@app/types/race';
import type { PointsSystemMap } from '@app/types/round';
import { F1_STANDARD_POINTS } from '@app/types/race';

interface Props {
  visible: boolean;
  roundId: number;
  platformId: number;
  race?: Race | null;
  mode?: 'create' | 'edit';
}

interface Emits {
  (e: 'update:visible', value: boolean): void;
  (e: 'saved'): void;
  (e: 'cancel'): void;
}

const props = withDefaults(defineProps<Props>(), {
  race: null,
  mode: 'create',
});

const emit = defineEmits<Emits>();

const raceStore = useRaceStore();
const roundStore = useRoundStore();
const raceSettingsStore = useRaceSettingsStore();
const toast = useToast();

const saving = ref(false);
const platformSettings = ref<PlatformRaceSettings | null>(null);
const loadingSettings = ref(false);
const activeSection = ref<SectionId>('basic');

const form = reactive<RaceForm>({
  race_number: 1,
  name: '',
  race_type: 'feature',
  qualifying_format: 'standard',
  qualifying_length: 10,
  qualifying_tire: '',
  grid_source: 'qualifying',
  grid_source_race_id: null,
  length_type: 'laps',
  length_value: 20,
  extra_lap_after_time: false,
  weather: '',
  tire_restrictions: '',
  fuel_usage: '',
  damage_model: '',
  track_limits_enforced: true,
  false_start_detection: true,
  collision_penalties: true,
  mandatory_pit_stop: false,
  minimum_pit_time: 0,
  assists_restrictions: '',
  race_points: false,
  points_system: { ...F1_STANDARD_POINTS },
  fastest_lap: null,
  fastest_lap_top_10: false,
  qualifying_pole: 1,
  qualifying_pole_top_10: false,
  dnf_points: 0,
  dns_points: 0,
  race_notes: '',
});

const isQualifying = computed(() => form.race_type === 'qualifying');

// Computed property to determine if this is the first race for the round
const isFirstRaceForRound = computed(() => {
  const races = raceStore.racesByRoundId(props.roundId);
  return races.length === 0;
});

// Pass the reactive computed ref to useRaceValidation so validation adapts dynamically
const { errors, validateAll, validateLengthValue, clearErrors } = useRaceValidation(
  form,
  isQualifying,
);

// Watch for race type changes and apply appropriate defaults
watch(
  () => form.race_type,
  (newType, oldType) => {
    // Guard: Only apply defaults when type actually changes (not on initial load or same value)
    // This prevents infinite loops when modifying form fields
    if (oldType === undefined || oldType === null || newType === oldType) {
      return;
    }

    if (newType === 'qualifying') {
      // Switching to qualifying - apply qualifying defaults
      form.qualifying_format = 'standard';
      form.qualifying_length = 15;
      form.grid_source = 'qualifying';
      form.grid_source_race_id = null;
      form.length_type = 'time';
      form.length_value = form.qualifying_length;
      form.extra_lap_after_time = false;
      form.mandatory_pit_stop = false;
      form.minimum_pit_time = 0;
      // Clear race-specific errors
      clearErrors();
    } else if (oldType === 'qualifying') {
      // Switching from qualifying to race - apply race defaults
      form.grid_source = 'qualifying';
      form.grid_source_race_id = null;
      form.length_type = 'laps';
      form.length_value = 20;
      form.extra_lap_after_time = false;
      // Clear qualifying-specific errors
      clearErrors();
    }
  },
);

const localVisible = computed({
  get: () => props.visible,
  set: (value) => emit('update:visible', value),
});

const requiresGridSourceRace = computed(() => {
  return (
    form.grid_source === 'qualifying' ||
    form.grid_source === 'previous_race' ||
    form.grid_source === 'reverse_previous'
  );
});

const availableQualifiers = computed(() => {
  const races = raceStore.racesByRoundId(props.roundId);
  return races
    .filter((race) => race.is_qualifier && race.id !== props.race?.id)
    .map((race) => ({
      value: race.id,
      label: race.name ? race.name : 'Qualifying',
    }));
});

const availableRaces = computed(() => {
  const races = raceStore.racesByRoundId(props.roundId);
  return races
    .filter((race) => !race.is_qualifier && race.id !== props.race?.id)
    .map((race) => ({
      value: race.id,
      label: `Race ${race.race_number}${race.name ? ` - ${race.name}` : ''}`,
    }));
});

const sourceRaceOptions = computed(() => {
  if (form.grid_source === 'qualifying') {
    return availableQualifiers.value;
  } else if (form.grid_source === 'previous_race' || form.grid_source === 'reverse_previous') {
    return availableRaces.value;
  }
  return [];
});

// Computed property to check if this is the first race (race_number === 1)
const isFirstRace = computed(() => {
  if (props.mode === 'create') {
    // In create mode, check how many non-qualifier races exist in this round
    const races = raceStore.racesByRoundId(props.roundId);
    const nonQualifierRaces = races.filter((race) => !race.is_qualifier);
    return nonQualifierRaces.length === 0; // This will be the first race
  } else if (props.race) {
    // In edit mode, check the race_number
    return props.race.race_number === 1;
  }
  return false;
});

// Get the current round
const currentRound = computed(() => {
  return roundStore.getRoundById(props.roundId);
});

// Check if round points system is available
const canCopyRoundPoints = computed(() => {
  const round = currentRound.value;
  if (!round || !round.points_system) {
    return false;
  }
  try {
    const parsed = JSON.parse(round.points_system) as PointsSystemMap;
    return Object.keys(parsed).length > 0;
  } catch {
    return false;
  }
});

// Get race 1 (first non-qualifier race) for this round
const race1 = computed(() => {
  const races = raceStore.racesByRoundId(props.roundId);
  const nonQualifierRaces = races
    .filter((race) => !race.is_qualifier)
    .sort((a, b) => a.race_number - b.race_number);
  return nonQualifierRaces[0] || null;
});

// Check if race 1 points system is available
const canCopyRace1Points = computed(() => {
  const firstRace = race1.value;
  if (!firstRace || !firstRace.race_points) {
    return false;
  }
  return Object.keys(firstRace.points_system).length > 0;
});

// Function to copy round points to race
function copyRoundPoints(): void {
  const round = currentRound.value;
  if (!round || !round.points_system) {
    toast.add({
      severity: 'warn',
      summary: 'Warning',
      detail: 'Round points system is not available',
      life: 3000,
    });
    return;
  }

  try {
    const roundPoints = JSON.parse(round.points_system) as PointsSystemMap;
    form.points_system = { ...roundPoints };
    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: 'Round points copied successfully',
      life: 3000,
    });
  } catch {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to parse round points system',
      life: 3000,
    });
  }
}

// Function to copy race 1 points to current race
function copyRace1Points(): void {
  const firstRace = race1.value;
  if (!firstRace || !firstRace.race_points) {
    toast.add({
      severity: 'warn',
      summary: 'Warning',
      detail: 'Race 1 points system is not available',
      life: 3000,
    });
    return;
  }

  form.points_system = { ...firstRace.points_system };
  toast.add({
    severity: 'success',
    summary: 'Success',
    detail: 'Race 1 points copied successfully',
    life: 3000,
  });
}

watch(
  () => props.visible,
  async (visible) => {
    if (visible) {
      clearErrors();
      activeSection.value = 'basic';
      await loadPlatformSettings();
      if (props.race) {
        loadRaceIntoForm(props.race);
      } else {
        // Use nextTick to ensure all reactive data (including race store) is ready
        await nextTick();
        resetForm();
      }
    }
  },
  { immediate: true },
);

// Watch for changes to the race prop (e.g., when switching between edit races)
watch(
  () => props.race,
  (newRace) => {
    if (newRace && props.visible) {
      loadRaceIntoForm(newRace);
    }
  },
  { deep: true },
);

// Watch for changes in isFirstRaceForRound to update race_type in create mode
// This ensures the form updates reactively when race data becomes available
// NOTE: No immediate option - we only want this to run when the race count CHANGES,
// not on initial mount (resetForm handles the initial value)
watch(isFirstRaceForRound, (isFirst) => {
  // Only update if in create mode, modal is visible, and no race is being edited
  if (props.visible && props.mode === 'create' && !props.race) {
    form.race_type = isFirst ? 'qualifying' : 'sprint';
  }
});

async function loadPlatformSettings(): Promise<void> {
  loadingSettings.value = true;
  try {
    platformSettings.value = await raceSettingsStore.fetchRaceSettings(props.platformId);
  } catch (error) {
    console.error('Failed to load platform settings:', error);
  } finally {
    loadingSettings.value = false;
  }
}

function loadRaceIntoForm(race: Race): void {
  // Clear errors first to prevent stale validation messages
  clearErrors();

  form.race_number = race.race_number;
  form.name = race.name || '';
  form.race_type = race.race_type;
  form.qualifying_format = race.qualifying_format;
  form.qualifying_length = race.qualifying_length || 15;
  form.qualifying_tire = race.qualifying_tire || '';
  form.grid_source = race.grid_source;
  form.grid_source_race_id = race.grid_source_race_id;
  form.length_type = race.length_type;
  form.length_value = race.length_value;
  form.extra_lap_after_time = race.extra_lap_after_time;
  form.weather = race.weather || '';
  form.tire_restrictions = race.tire_restrictions || '';
  form.fuel_usage = race.fuel_usage || '';
  form.damage_model = race.damage_model || '';
  form.track_limits_enforced = race.track_limits_enforced;
  form.false_start_detection = race.false_start_detection;
  form.collision_penalties = race.collision_penalties;
  form.mandatory_pit_stop = race.mandatory_pit_stop;
  form.minimum_pit_time = race.minimum_pit_time || 0;
  form.assists_restrictions = race.assists_restrictions || '';
  form.race_points = race.race_points;
  form.points_system = { ...race.points_system };
  form.fastest_lap = race.fastest_lap;
  form.fastest_lap_top_10 = race.fastest_lap_top_10;
  form.qualifying_pole = race.qualifying_pole;
  form.qualifying_pole_top_10 = race.qualifying_pole_top_10;
  form.dnf_points = race.dnf_points;
  form.dns_points = race.dns_points;
  form.race_notes = race.race_notes || '';
}

function resetForm(): void {
  form.race_number = 1;
  form.name = '';
  // Default to 'qualifying' if this is the first race, otherwise 'sprint'
  // Use .value to access the computed property
  form.race_type = isFirstRaceForRound.value ? 'qualifying' : 'sprint';
  form.qualifying_format = 'standard';
  form.qualifying_length = 15;
  form.qualifying_tire = '';
  form.grid_source = 'qualifying';
  form.grid_source_race_id = null;
  form.length_type = 'laps';
  form.length_value = 20;
  form.extra_lap_after_time = false;
  form.weather = '';
  form.tire_restrictions = '';
  form.fuel_usage = '';
  form.damage_model = '';
  form.track_limits_enforced = true;
  form.false_start_detection = true;
  form.collision_penalties = true;
  form.mandatory_pit_stop = false;
  form.minimum_pit_time = 0;
  form.assists_restrictions = '';
  form.race_points = false;
  form.points_system = { ...F1_STANDARD_POINTS };
  form.fastest_lap = null;
  form.fastest_lap_top_10 = false;
  form.qualifying_pole = 1;
  form.qualifying_pole_top_10 = false;
  form.dnf_points = 0;
  form.dns_points = 0;
  form.race_notes = '';
}

function handleSectionChange(sectionId: SectionId): void {
  activeSection.value = sectionId;
}

function handleLengthValueBlur(): void {
  errors.length_value = validateLengthValue();
}

function handleClose(): void {
  clearErrors();
  localVisible.value = false;
}

async function handleSave(): Promise<void> {
  const validationResult = validateAll();

  if (!validationResult) {
    return;
  }

  saving.value = true;
  try {
    // Build payload conditionally based on whether this is a qualifier or race
    const payload: CreateRaceRequest | UpdateRaceRequest = isQualifying.value
      ? {
          // Qualifier-specific payload
          race_number: 0, // Signal to backend this is a qualifier
          name: form.name.trim() || null,
          // Omit race_type for qualifiers
          qualifying_format: form.qualifying_format,
          qualifying_length:
            form.qualifying_format !== 'none' && form.qualifying_format !== 'previous_race'
              ? form.qualifying_length
              : null,
          qualifying_tire: form.qualifying_tire.trim() || null,
          // Qualifiers always use qualifying as grid source
          grid_source: 'qualifying',
          // Omit grid_source_race_id for qualifiers
          length_type: 'time',
          length_value: form.qualifying_length,
          extra_lap_after_time: false,
          weather: form.weather.trim() || null,
          tire_restrictions: form.tire_restrictions.trim() || null,
          fuel_usage: form.fuel_usage.trim() || null,
          damage_model: form.damage_model.trim() || null,
          // Omit penalty fields for qualifiers - they will be set to defaults in backend
          assists_restrictions: form.assists_restrictions.trim() || null,
          race_points: form.race_points,
          points_system: form.points_system,
          fastest_lap: null,
          fastest_lap_top_10: false,
          qualifying_pole: form.qualifying_pole,
          qualifying_pole_top_10: form.qualifying_pole_top_10,
          dnf_points: form.dnf_points,
          dns_points: form.dns_points,
          race_notes: form.race_notes.trim() || null,
        }
      : {
          // Regular race payload
          name: form.name.trim() || null,
          race_type: form.race_type || null,
          qualifying_format: null,
          qualifying_length: null,
          qualifying_tire: null,
          grid_source: form.grid_source,
          grid_source_race_id: requiresGridSourceRace.value
            ? form.grid_source_race_id || null
            : null,
          length_type: form.length_type,
          length_value: form.length_value || null,
          extra_lap_after_time: form.extra_lap_after_time,
          weather: form.weather.trim() || null,
          tire_restrictions: form.tire_restrictions.trim() || null,
          fuel_usage: form.fuel_usage.trim() || null,
          damage_model: form.damage_model.trim() || null,
          track_limits_enforced: form.track_limits_enforced,
          false_start_detection: form.false_start_detection,
          collision_penalties: form.collision_penalties,
          mandatory_pit_stop: form.mandatory_pit_stop,
          minimum_pit_time: form.mandatory_pit_stop ? form.minimum_pit_time : null,
          assists_restrictions: form.assists_restrictions.trim() || null,
          race_points: form.race_points,
          points_system: form.points_system,
          fastest_lap: form.fastest_lap,
          fastest_lap_top_10: form.fastest_lap_top_10,
          qualifying_pole: null,
          qualifying_pole_top_10: false,
          dnf_points: form.dnf_points,
          dns_points: form.dns_points,
          race_notes: form.race_notes.trim() || null,
        };

    if (props.mode === 'edit' && props.race) {
      // Include race_number for edit mode
      const updatePayload = {
        ...payload,
        race_number: form.race_number,
      };
      await raceStore.updateExistingRace(props.race.id, updatePayload, isQualifying.value);
    } else {
      // Don't include race_number for create mode - backend will auto-generate
      await raceStore.createNewRace(props.roundId, payload as CreateRaceRequest);
    }

    emit('saved');
    handleClose();
  } catch (error) {
    console.error('[RaceFormDrawer] Failed to save race:', error);
  } finally {
    saving.value = false;
  }
}
</script>
