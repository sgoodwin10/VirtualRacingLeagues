<script setup lang="ts">
import { ref, computed, watch, onUnmounted } from 'vue';
import { format } from 'date-fns';
import { useToast } from 'primevue/usetoast';
import { Button } from '@app/components/common/buttons';
import BaseModal from '@app/components/common/modals/BaseModal.vue';
import RoundEditSidebar from './partials/RoundEditSidebar.vue';
import BasicInfoSection from './partials/sections/BasicInfoSection.vue';
import PointsSection from './partials/sections/PointsSection.vue';
import { useRoundStore } from '@app/stores/roundStore';
import { useTrackStore } from '@app/stores/trackStore';
import { useRoundValidation } from '@app/composables/useRoundValidation';
import { useTrackSearch } from '@app/composables/useTrackSearch';
import type { Round, RoundForm, CreateRoundRequest, UpdateRoundRequest } from '@app/types/round';
import { F1_STANDARD_POINTS } from '@app/types/race';
import type { Track } from '@app/types/track';
import type { SectionId } from './partials/RoundEditSidebar.vue';

interface Props {
  visible: boolean;
  seasonId: number;
  platformId: number;
  round?: Round | null;
  mode: 'create' | 'edit';
}

interface Emits {
  (e: 'update:visible', value: boolean): void;
  (e: 'saved'): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const roundStore = useRoundStore();
const trackStore = useTrackStore();
const toast = useToast();
const validation = useRoundValidation();
const trackSearch = useTrackSearch();

const saving = ref(false);
const selectedTrack = ref<Track | null>(null);
const activeSection = ref<SectionId>('basic');

// AbortController for async operations
const abortController = ref<AbortController | null>(null);

// Computed property to unwrap the ref for TypeScript
const trackSuggestions = computed(() => trackSearch.searchResults.value);

// Cleanup on unmount
onUnmounted(() => {
  if (abortController.value) {
    abortController.value.abort();
  }
});

const form = ref<RoundForm>({
  round_number: 1,
  name: '',
  scheduled_at: null,
  platform_track_id: null,
  track_layout: '',
  track_conditions: '',
  technical_notes: '',
  stream_url: '',
  internal_notes: '',
  fastest_lap: null,
  fastest_lap_top_10: false,
  qualifying_pole: null,
  qualifying_pole_top_10: false,
  points_system: { ...F1_STANDARD_POINTS },
  round_points: true,
});

const isVisible = computed({
  get: () => props.visible,
  set: (value) => emit('update:visible', value),
});

const validationErrors = computed(() => validation.errors.value);

const modalTitle = computed(() => {
  return props.mode === 'create' ? 'Create Round' : `Edit Round: ${form.value.round_number}`;
});

// Check if we can copy from Round 1
const canCopyFromRoundOne = computed(() => {
  // Only show if round_points is enabled
  if (!form.value.round_points) return false;

  // Get rounds for this season
  const seasonRounds = roundStore.roundsBySeasonId(props.seasonId);

  // Find Round 1
  const roundOne = seasonRounds.find((r) => r.round_number === 1);
  if (!roundOne) return false;

  // Don't show on Round 1 itself
  if (props.mode === 'edit' && props.round?.round_number === 1) return false;

  // Don't show on create mode if this would be Round 1
  if (props.mode === 'create' && form.value.round_number === 1) return false;

  // Must have points_system configured
  return !!roundOne.points_system;
});

// Copy points configuration from Round 1
function copyFromRoundOne(): void {
  const seasonRounds = roundStore.roundsBySeasonId(props.seasonId);
  const roundOne = seasonRounds.find((r) => r.round_number === 1);

  if (!roundOne || !roundOne.points_system) {
    toast.add({
      severity: 'warn',
      summary: 'Cannot Copy',
      detail: 'Round 1 does not have a points system configured',
      life: 3000,
    });
    return;
  }

  try {
    // Parse Round 1's points system
    const roundOnePoints = JSON.parse(roundOne.points_system);

    // Copy to current form
    form.value.points_system = { ...roundOnePoints };
    form.value.fastest_lap = roundOne.fastest_lap;
    form.value.fastest_lap_top_10 = roundOne.fastest_lap_top_10;
    form.value.qualifying_pole = roundOne.qualifying_pole;
    form.value.qualifying_pole_top_10 = roundOne.qualifying_pole_top_10;

    toast.add({
      severity: 'success',
      summary: 'Points Copied',
      detail: 'Round 1 points configuration has been copied',
      life: 3000,
    });
  } catch (error) {
    console.error('Failed to parse Round 1 points system:', error);
    toast.add({
      severity: 'error',
      summary: 'Copy Failed',
      detail: 'Failed to copy points configuration from Round 1',
      life: 3000,
    });
  }
}

// Watch for modal opening to initialize form
watch(
  () => props.visible,
  async (visible) => {
    if (visible) {
      // Cancel any previous requests
      if (abortController.value) {
        abortController.value.abort();
      }
      // Create new AbortController for this session
      abortController.value = new AbortController();

      await initializeForm();
      activeSection.value = 'basic';
    } else {
      // Cancel requests when modal closes
      if (abortController.value) {
        abortController.value.abort();
        abortController.value = null;
      }
    }
  },
);

async function initializeForm(): Promise<void> {
  validation.clearErrors();

  if (props.mode === 'create') {
    // Reset form for create mode
    form.value = {
      round_number: 1,
      name: '',
      scheduled_at: null,
      platform_track_id: null,
      track_layout: '',
      track_conditions: '',
      technical_notes: '',
      stream_url: '',
      internal_notes: '',
      fastest_lap: null,
      fastest_lap_top_10: false,
      qualifying_pole: null,
      qualifying_pole_top_10: false,
      points_system: { ...F1_STANDARD_POINTS },
      round_points: true,
    };
    selectedTrack.value = null;

    // Fetch next round number
    try {
      const nextNumber = await roundStore.fetchNextRoundNumber(props.seasonId);
      form.value.round_number = nextNumber;
    } catch (error) {
      console.error('Failed to fetch next round number:', error);
    }
  } else if (props.mode === 'edit' && props.round) {
    // Parse points_system from string to object
    let pointsSystemObject = { ...F1_STANDARD_POINTS };

    if (props.round.points_system && props.round.points_system.trim()) {
      try {
        pointsSystemObject = JSON.parse(props.round.points_system);
      } catch (error) {
        console.error('Failed to parse points_system:', error);
        // Fall back to F1 standard
        pointsSystemObject = { ...F1_STANDARD_POINTS };
      }
    }

    // Populate form for edit mode
    form.value = {
      round_number: props.round.round_number,
      name: props.round.name || '',
      scheduled_at: props.round.scheduled_at ? new Date(props.round.scheduled_at) : null,
      platform_track_id: props.round.platform_track_id,
      track_layout: props.round.track_layout || '',
      track_conditions: props.round.track_conditions || '',
      technical_notes: props.round.technical_notes || '',
      stream_url: props.round.stream_url || '',
      internal_notes: props.round.internal_notes || '',
      fastest_lap: props.round.fastest_lap,
      fastest_lap_top_10: props.round.fastest_lap_top_10,
      qualifying_pole: props.round.qualifying_pole,
      qualifying_pole_top_10: props.round.qualifying_pole_top_10,
      points_system: pointsSystemObject,
      round_points: props.round.round_points,
    };

    // Load selected track
    if (props.round.platform_track_id) {
      try {
        const track = await trackStore.fetchTrack(props.round.platform_track_id);
        selectedTrack.value = track;
      } catch (error) {
        console.error('Failed to load track:', error);
      }
    }
  }
}

function handleTrackSearch(query: string): void {
  trackSearch.search(props.platformId, query);
}

function handleTrackSelect(track: Track): void {
  form.value.platform_track_id = track.id;
  selectedTrack.value = track;
  validation.validatePlatformTrackId(form.value.platform_track_id);
}

function handleSectionChange(sectionId: SectionId): void {
  activeSection.value = sectionId;
}

async function handleSubmit(): Promise<void> {
  if (!validation.validateAll(form.value)) {
    toast.add({
      severity: 'warn',
      summary: 'Validation Error',
      detail: 'Please fix the validation errors before saving',
      life: 5000,
    });
    return;
  }

  saving.value = true;

  try {
    if (props.mode === 'create') {
      const requestData: CreateRoundRequest = {
        round_number: form.value.round_number,
      };

      if (form.value.scheduled_at) {
        requestData.scheduled_at = format(form.value.scheduled_at, 'yyyy-MM-dd HH:mm:ss');
      }
      if (form.value.platform_track_id) {
        requestData.platform_track_id = form.value.platform_track_id;
      }
      // Always include text fields (convert empty strings to undefined for create)
      requestData.name = form.value.name.trim() || undefined;
      requestData.track_layout = form.value.track_layout.trim() || undefined;
      requestData.track_conditions = form.value.track_conditions.trim() || undefined;
      requestData.technical_notes = form.value.technical_notes.trim() || undefined;
      requestData.stream_url = form.value.stream_url.trim() || undefined;
      requestData.internal_notes = form.value.internal_notes.trim() || undefined;
      if (form.value.fastest_lap !== null) {
        requestData.fastest_lap = form.value.fastest_lap;
        requestData.fastest_lap_top_10 = form.value.fastest_lap_top_10;
      }
      if (form.value.qualifying_pole !== null) {
        requestData.qualifying_pole = form.value.qualifying_pole;
        requestData.qualifying_pole_top_10 = form.value.qualifying_pole_top_10;
      }
      // Always include round_points (boolean)
      requestData.round_points = form.value.round_points;
      // Include points_system if provided and round_points is enabled
      if (form.value.round_points && Object.keys(form.value.points_system).length > 0) {
        requestData.points_system = JSON.stringify(form.value.points_system);
      }

      await roundStore.createNewRound(props.seasonId, requestData);

      toast.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Round created successfully',
        life: 3000,
      });

      emit('saved');
    } else if (props.round) {
      const requestData: UpdateRoundRequest = {};

      if (form.value.round_number !== props.round.round_number) {
        requestData.round_number = form.value.round_number;
      }

      const formNameTrimmed = (form.value.name || '').trim();
      const originalName = props.round.name || '';
      if (formNameTrimmed !== originalName) {
        requestData.name = formNameTrimmed || null;
      }

      // Handle scheduled_at changes including null
      const currentScheduledAt = form.value.scheduled_at
        ? format(form.value.scheduled_at, 'yyyy-MM-dd HH:mm:ss')
        : null;
      const originalScheduledAt = props.round.scheduled_at || null;

      if (currentScheduledAt !== originalScheduledAt) {
        requestData.scheduled_at = currentScheduledAt;
      }

      if (form.value.platform_track_id !== props.round.platform_track_id) {
        requestData.platform_track_id = form.value.platform_track_id ?? undefined;
      }

      const formTrackLayoutTrimmed = (form.value.track_layout || '').trim();
      const originalTrackLayout = props.round.track_layout || '';
      if (formTrackLayoutTrimmed !== originalTrackLayout) {
        requestData.track_layout = formTrackLayoutTrimmed || null;
      }

      const formTrackConditionsTrimmed = (form.value.track_conditions || '').trim();
      const originalTrackConditions = props.round.track_conditions || '';
      if (formTrackConditionsTrimmed !== originalTrackConditions) {
        requestData.track_conditions = formTrackConditionsTrimmed || null;
      }

      const formTechnicalNotesTrimmed = (form.value.technical_notes || '').trim();
      const originalTechnicalNotes = props.round.technical_notes || '';
      if (formTechnicalNotesTrimmed !== originalTechnicalNotes) {
        requestData.technical_notes = formTechnicalNotesTrimmed || null;
      }

      const formStreamUrlTrimmed = (form.value.stream_url || '').trim();
      const originalStreamUrl = props.round.stream_url || '';
      if (formStreamUrlTrimmed !== originalStreamUrl) {
        requestData.stream_url = formStreamUrlTrimmed || null;
      }

      const formInternalNotesTrimmed = (form.value.internal_notes || '').trim();
      const originalInternalNotes = props.round.internal_notes || '';
      if (formInternalNotesTrimmed !== originalInternalNotes) {
        requestData.internal_notes = formInternalNotesTrimmed || null;
      }

      if (form.value.fastest_lap !== props.round.fastest_lap) {
        requestData.fastest_lap = form.value.fastest_lap;
      }

      if (form.value.fastest_lap_top_10 !== props.round.fastest_lap_top_10) {
        requestData.fastest_lap_top_10 = form.value.fastest_lap_top_10;
      }

      if (form.value.qualifying_pole !== props.round.qualifying_pole) {
        requestData.qualifying_pole = form.value.qualifying_pole;
      }

      if (form.value.qualifying_pole_top_10 !== props.round.qualifying_pole_top_10) {
        requestData.qualifying_pole_top_10 = form.value.qualifying_pole_top_10;
      }

      if (form.value.round_points !== props.round.round_points) {
        requestData.round_points = form.value.round_points;
      }

      // Compare points_system objects
      const formPointsSystemJson = JSON.stringify(form.value.points_system);
      const originalPointsSystem = props.round.points_system || '';
      if (formPointsSystemJson !== originalPointsSystem) {
        requestData.points_system =
          Object.keys(form.value.points_system).length > 0 ? formPointsSystemJson : null;
      }

      if (Object.keys(requestData).length > 0) {
        await roundStore.updateExistingRound(props.round.id, requestData);

        toast.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Round updated successfully',
          life: 3000,
        });

        emit('saved');
      } else {
        // No changes detected
        toast.add({
          severity: 'info',
          summary: 'No Changes',
          detail: 'No changes were made to the round',
          life: 3000,
        });

        isVisible.value = false;
      }
    }
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error instanceof Error ? error.message : 'Failed to save round',
      life: 5000,
    });
  } finally {
    saving.value = false;
  }
}

function handleClose(): void {
  validation.clearErrors();
  trackSearch.clearSearch();
  isVisible.value = false;
}
</script>

<template>
  <BaseModal
    v-model:visible="isVisible"
    :header="modalTitle"
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
      <RoundEditSidebar
        :active-section="activeSection"
        :has-track="!!form.platform_track_id"
        :has-schedule="!!form.scheduled_at"
        :has-points-enabled="form.round_points"
        @change-section="handleSectionChange"
      />

      <!-- Main Content -->
      <main class="overflow-y-auto bg-[var(--bg-dark)] p-6">
        <!-- Basic Info Section -->
        <BasicInfoSection
          v-show="activeSection === 'basic'"
          :round-name="form.name"
          :selected-track="selectedTrack"
          :track-suggestions="trackSuggestions"
          :scheduled-at="form.scheduled_at"
          :errors="{
            name: validationErrors.name,
            platform_track_id: validationErrors.platform_track_id,
            scheduled_at: validationErrors.scheduled_at,
          }"
          :disabled="saving"
          @update:round-name="form.name = $event"
          @update:scheduled-at="form.scheduled_at = $event"
          @track-search="handleTrackSearch"
          @track-select="handleTrackSelect"
          @blur-name="validation.validateName(form.name)"
          @blur-track="validation.validatePlatformTrackId(form.platform_track_id)"
          @blur-schedule="validation.validateScheduledAt(form.scheduled_at)"
        />

        <!-- Points Section -->
        <PointsSection
          v-show="activeSection === 'points'"
          :round-points="form.round_points"
          :points-system="form.points_system"
          :fastest-lap="form.fastest_lap"
          :fastest-lap-top10="form.fastest_lap_top_10"
          :qualifying-pole="form.qualifying_pole"
          :qualifying-pole-top10="form.qualifying_pole_top_10"
          :can-copy-from-round-one="canCopyFromRoundOne"
          :errors="{
            round_points: validationErrors.round_points,
            points_system: validationErrors.points_system,
            fastest_lap: validationErrors.fastest_lap,
            qualifying_pole: validationErrors.qualifying_pole,
          }"
          :disabled="saving"
          @update:round-points="form.round_points = $event"
          @update:points-system="form.points_system = $event"
          @update:fastest-lap="form.fastest_lap = $event"
          @update:fastest-lap-top10="form.fastest_lap_top_10 = $event"
          @update:qualifying-pole="form.qualifying_pole = $event"
          @update:qualifying-pole-top10="form.qualifying_pole_top_10 = $event"
          @copy-from-round-one="copyFromRoundOne"
          @blur-round-points="validation.validateRoundPoints(form.round_points)"
          @blur-fastest-lap="validation.validateFastestLap(form.fastest_lap)"
          @blur-qualifying-pole="validation.validateQualifyingPole(form.qualifying_pole)"
        />
      </main>
    </div>

    <template #footer>
      <div class="flex gap-2 justify-end">
        <Button label="Cancel" variant="secondary" :disabled="saving" @click="handleClose" />
        <Button
          :label="mode === 'create' ? 'Create New Round' : 'Update Round'"
          :loading="saving"
          :disabled="saving"
          variant="success"
          @click="handleSubmit"
        />
      </div>
    </template>
  </BaseModal>
</template>
