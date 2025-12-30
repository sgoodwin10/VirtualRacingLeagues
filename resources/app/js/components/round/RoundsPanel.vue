<template>
  <BasePanel>
    <template #default>
      <!-- Loading State -->
      <div v-if="roundStore.isLoading && !initialLoadComplete" class="space-y-4">
        <Skeleton height="4rem" class="mb-2" />
        <Skeleton height="4rem" class="mb-2" />
        <Skeleton height="4rem" class="mb-2" />
      </div>

      <!-- Empty State -->
      <div
        v-else-if="rounds.length === 0"
        class="flex flex-col items-center justify-center py-12 text-center"
      >
        <i class="pi pi-calendar text-4xl text-gray-400 mb-4"></i>
        <p class="text-gray-600 mb-4">No rounds scheduled yet</p>
        <Button
          label="Create First Round"
          :icon="PhPlus"
          variant="outline"
          @click="handleCreateRound"
        />
      </div>

      <!-- Rounds List -->
      <TechnicalAccordion v-else v-model="activeIndexes" :multiple="true" gap="md">
        <TechnicalAccordionPanel
          v-for="(round, index) in rounds"
          :key="round.id"
          :value="String(round.id)"
        >
          <TechnicalAccordionHeader
            :title="round.name || `Round ${round.round_number}`"
            :subtitle="getTrackAndLocation(round.platform_track_id)"
            :status="getRoundStatus(round)"
            padding="none"
          >
            <!-- Round number badge in prefix slot -->
            <template #prefix>
              <div
                class="round-number-badge"
                :style="{ backgroundColor: getRoundBackgroundColor(index) }"
              >
                <span class="round-label">Round</span>
                <span class="round-number">{{ round.round_number }}</span>
              </div>
            </template>

            <!-- Date display in suffix slot -->
            <template #suffix>
              <div v-if="round.scheduled_at" class="w-36 flex flex-col">
                <div>
                  <span class="text-sm text-secondary font-medium">Date</span>
                </div>
                <span class="text-md text-primary font-normal">
                  {{ formatScheduledDate(round.scheduled_at) }}
                </span>
              </div>
            </template>

            <!-- Action buttons in actions slot -->
            <template #actions>
              <AccordionBadge
                v-if="round.round_points"
                v-tooltip.top="{
                  value: formatRoundPointsTooltip(round),
                  escape: false,
                  pt: {
                    text: 'max-w-md whitespace-pre-wrap font-mono text-xs leading-relaxed',
                  },
                }"
                text="Round Points"
                severity="info"
              >
                <template #icon>
                  <PhCalculator :size="14" weight="regular" />
                </template>
              </AccordionBadge>
              <Button
                v-if="round.status === 'completed'"
                label="Results"
                :icon="PhTrophy"
                size="sm"
                variant="success"
                @click.stop="handleViewRoundResults(round)"
              />
              <div class="flex items-center gap-2" @click.stop>
                <ToggleSwitch
                  :model-value="round.status === 'completed'"
                  :disabled="completingRoundId === round.id"
                  @update:model-value="handleToggleCompletion(round)"
                >
                  <template #handle="{ checked }">
                    <i :class="['!text-xs pi', { 'pi-check': checked, 'pi-times': !checked }]" />
                  </template>
                </ToggleSwitch>
                <span
                  :class="[
                    'text-sm font-medium',
                    round.status === 'completed' ? 'text-green' : 'text-muted',
                  ]"
                >
                  Completed
                </span>
              </div>
              <EditButton v-if="round.status !== 'completed'" @click="handleEditRound(round)" />
              <DeleteButton v-if="round.status !== 'completed'" @click="handleDeleteRound(round)" />
            </template>
          </TechnicalAccordionHeader>

          <TechnicalAccordionContent padding="md">
            <div class="space-y-2">
              <!-- Round Details -->
              <div
                v-if="round.technical_notes || round.stream_url || round.internal_notes"
                class="grid grid-cols-3 gap-4 border-b border-default pb-4"
              >
                <BasePanel
                  v-if="round.technical_notes"
                  content-class="p-4 border border-default rounded-md bg-elevated"
                >
                  <template #header>
                    <div class="flex items-center gap-2 py-2 mx-2 w-full">
                      <span class="font-medium text-surface-700">Technical Notes</span>
                    </div>
                  </template>
                  <div class="whitespace-pre-wrap">{{ round.technical_notes }}</div>
                </BasePanel>

                <BasePanel
                  v-if="round.stream_url"
                  content-class="p-4 border border-default rounded-md bg-elevated"
                >
                  <template #header>
                    <div class="flex items-center gap-2 py-2 mx-2 w-full">
                      <span class="font-medium text-surface-700">Stream URL</span>
                    </div>
                  </template>
                  <a :href="round.stream_url" target="_blank" class="text-blue-600 hover:underline">
                    {{ round.stream_url }}
                  </a>
                </BasePanel>

                <BasePanel
                  v-if="round.internal_notes"
                  content-class="p-4 border border-default rounded-md bg-elevated"
                >
                  <template #header>
                    <div class="flex items-center gap-2 py-2 mx-2 w-full">
                      <span class="font-medium text-surface-700">Internal Notes</span>
                    </div>
                  </template>
                  <div class="whitespace-pre-wrap">{{ round.internal_notes }}</div>
                </BasePanel>
              </div>

              <!-- Race Events Section (Qualifying + Races) -->
              <div>
                <div class="flex items-center justify-between my-3">
                  <div v-if="round.status !== 'completed'" class="flex items-center gap-2">
                    <Button
                      label="Add Event"
                      :icon="PhPlus"
                      size="sm"
                      variant="outline"
                      @click="handleCreateRace(round.id)"
                    />
                  </div>
                </div>

                <div v-if="loadingRaces" class="space-y-2">
                  <Skeleton height="4rem" />
                  <Skeleton height="4rem" />
                </div>

                <div
                  v-else-if="getAllRaceEvents(round.id).length === 0"
                  class="text-md text-gray-500 text-center py-4"
                >
                  No race events added yet
                </div>

                <div v-else class="space-y-2">
                  <template v-for="race in getAllRaceEvents(round.id)" :key="race.id">
                    <QualifierListItem
                      v-if="isQualifier(race)"
                      :race="getRaceWithOrphanedFlag(race, round)"
                      :is-round-completed="round.status === 'completed'"
                      @edit="handleEditQualifier"
                      @delete="handleDeleteQualifier"
                      @enter-results="handleEnterResults($event, round)"
                      @toggle-status="handleToggleRaceStatus"
                      @refresh="handleRefreshOrphanedResults(round)"
                    />
                    <RaceListItem
                      v-else
                      :race="getRaceWithOrphanedFlag(race, round)"
                      :is-round-completed="round.status === 'completed'"
                      @edit="handleEditRace"
                      @delete="handleDeleteRace"
                      @enter-results="handleEnterResults($event, round)"
                      @toggle-status="handleToggleRaceStatus"
                      @refresh="handleRefreshOrphanedResults(round)"
                    />
                  </template>
                </div>
              </div>
            </div>
          </TechnicalAccordionContent>
        </TechnicalAccordionPanel>
      </TechnicalAccordion>

      <!-- Add Round Button (shown when rounds exist) -->
      <FooterAddButton
        v-if="!roundStore.isLoading && rounds.length > 0"
        label="Add Round"
        variant="elevated"
        @click="handleCreateRound"
      />
    </template>
  </BasePanel>

  <!-- Round Form Drawer -->
  <RoundFormDrawer
    v-model:visible="showFormDrawer"
    :season-id="seasonId"
    :platform-id="platformId"
    :round="selectedRound"
    :mode="formMode"
    @saved="handleRoundSaved"
  />

  <!-- Race Form Drawer (now handles both races and qualifiers) -->
  <RaceFormDrawer
    v-if="selectedRoundId"
    v-model:visible="showRaceFormDrawer"
    :round-id="selectedRoundId"
    :platform-id="platformId"
    :race="selectedRace"
    :mode="raceFormMode"
    :race-type="raceFormType"
    @saved="handleRaceSaved"
  />

  <!-- Race Results Modal -->
  <RaceResultModal
    v-if="selectedRaceForResults && selectedRoundForResults"
    v-model:visible="showResultsModal"
    :race="selectedRaceForResults"
    :round="selectedRoundForResults"
    :season-id="seasonId"
    @saved="handleResultsSaved"
  />

  <!-- Round Results Modal -->
  <RoundResultsModal
    v-if="selectedRoundForRoundResults"
    v-model:visible="showRoundResultsModal"
    :round="selectedRoundForRoundResults"
    :season-id="seasonId"
  />

  <!-- Confirm Delete Dialogs -->
  <ConfirmDialog group="round-delete" />
  <ConfirmDialog group="race-delete" />
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from 'vue';
import { format, parseISO } from 'date-fns';
import { useToast } from 'primevue/usetoast';
import { useConfirm } from 'primevue/useconfirm';
import { PhPlus, PhCalculator, PhTrophy } from '@phosphor-icons/vue';
import BasePanel from '@app/components/common/panels/BasePanel.vue';
import { Button, EditButton, DeleteButton, FooterAddButton } from '@app/components/common/buttons';
import RoundFormDrawer from '@app/components/round/modals/RoundFormDrawer.vue';
import RaceFormDrawer from '@app/components/round/modals/RaceFormDrawer.vue';
import RaceListItem from '@app/components/round/RaceListItem.vue';
import QualifierListItem from '@app/components/round/QualifierListItem.vue';
import RaceResultModal from '@app/components/result/RaceResultModal.vue';
import RoundResultsModal from '@app/components/round/modals/RoundResultsModal.vue';
import {
  TechnicalAccordion,
  TechnicalAccordionPanel,
  TechnicalAccordionHeader,
  TechnicalAccordionContent,
  AccordionBadge,
} from '@app/components/common/accordions';
import type { AccordionStatus } from '@app/components/common/accordions';
import Skeleton from 'primevue/skeleton';
import ConfirmDialog from 'primevue/confirmdialog';
import ToggleSwitch from 'primevue/toggleswitch';
import { useRoundStore } from '@app/stores/roundStore';
import { useRaceStore } from '@app/stores/raceStore';
import { useTrackStore } from '@app/stores/trackStore';
import type { Round } from '@app/types/round';
import type { Race } from '@app/types/race';
import { isQualifier } from '@app/types/race';
import type { RGBColor } from '@app/types/competition';
import { useColorRange } from '@app/composables/useColorRange';
import { useOrphanedResults } from '@app/composables/useOrphanedResults';
import { createLogger } from '@app/utils/logger';
import { DEFAULT_COLOR_RANGE_STEPS } from '@app/constants/pagination';

interface Props {
  seasonId: number;
  platformId: number;
  competitionColour?: string | null;
}

const props = defineProps<Props>();

const roundStore = useRoundStore();
const raceStore = useRaceStore();
const trackStore = useTrackStore();
const toast = useToast();
const confirm = useConfirm();

// Orphaned results management
const {
  fetchBatchOrphanedResults,
  hasOrphanedResults,
  fetchOrphanedResultsStatus,
  clearOrphanedResultsCache,
} = useOrphanedResults();

// Create a logger instance for this component
const logger = createLogger('RoundsPanel');

// Parse competition color from JSON string
const competitionColor = computed<RGBColor | null>(() => {
  if (!props.competitionColour) {
    return null;
  }

  try {
    const parsed = JSON.parse(props.competitionColour) as RGBColor;
    // Validate the parsed color has r, g, b properties
    if (
      typeof parsed.r === 'number' &&
      typeof parsed.g === 'number' &&
      typeof parsed.b === 'number'
    ) {
      return parsed;
    }
    return null;
  } catch {
    logger.warn('Invalid competition color format', { data: props.competitionColour });
    return null;
  }
});

// Generate color range based on competition color (pass computed ref for reactivity)
const { getColor } = useColorRange(competitionColor, { steps: DEFAULT_COLOR_RANGE_STEPS });

const showFormDrawer = ref(false);
const selectedRound = ref<Round | null>(null);
const formMode = ref<'create' | 'edit'>('create');
const activeIndexes = ref<string[]>([]);
const initialLoadComplete = ref(false);

const showRaceFormDrawer = ref(false);
const selectedRace = ref<Race | null>(null);
const selectedRoundId = ref<number | null>(null);
const raceFormMode = ref<'create' | 'edit'>('create');
const raceFormType = ref<'race' | 'qualifier'>('race');
const loadingRaces = ref(false);
const completingRoundId = ref<number | null>(null);
const loadAbortController = ref<AbortController | null>(null);

const showResultsModal = ref(false);
const selectedRaceForResults = ref<Race | null>(null);
const selectedRoundForResults = ref<Round | null>(null);

// Round results modal state
const showRoundResultsModal = ref(false);
const selectedRoundForRoundResults = ref<Round | null>(null);

const rounds = computed(() => {
  return roundStore
    .roundsBySeasonId(props.seasonId)
    .sort((a, b) => a.round_number - b.round_number);
});

/**
 * Determine the status of a round for the accordion status indicator
 */
function getRoundStatus(round: Round): AccordionStatus {
  if (round.status === 'completed') return 'completed';
  if (round.status === 'in_progress') return 'active';

  // Check if scheduled in next 7 days
  if (round.scheduled_at) {
    const scheduledDate = new Date(round.scheduled_at);
    const now = new Date();
    const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    if (scheduledDate >= now && scheduledDate <= weekFromNow) {
      return 'upcoming';
    }
  }

  if (round.status === 'scheduled') return 'pending';
  return 'inactive';
}

// Unified list of all race events (qualifiers + races) sorted by created_at
const allRaceEventsByRound = computed(() => {
  const raceMap = new Map<number, Race[]>();
  rounds.value.forEach((round) => {
    const allRaces = raceStore.racesByRoundId(round.id).sort((a, b) => {
      // Sort by created_at timestamp (ascending - oldest first)
      const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
      return dateA - dateB;
    });
    raceMap.set(round.id, allRaces);
  });
  return raceMap;
});

/**
 * Load all rounds and races for the current season
 */
async function loadRoundsAndRaces(): Promise<void> {
  try {
    // First, fetch rounds
    await roundStore.fetchRounds(props.seasonId);

    // Mark initial load as complete after rounds are fetched
    initialLoadComplete.value = true;

    // Also fetch tracks for this platform to display track names (non-blocking)
    try {
      await trackStore.fetchTracks({ platform_id: props.platformId, is_active: true });
    } catch (trackError) {
      logger.error('Error loading tracks', { data: trackError });
      // Continue anyway - tracks are just for display names
    }

    // Then fetch races for all rounds in parallel
    loadingRaces.value = true;
    const fetchedRounds = roundStore.roundsBySeasonId(props.seasonId);

    await Promise.all(fetchedRounds.map((round) => raceStore.fetchRaces(round.id)));

    loadingRaces.value = false;

    // Fetch orphaned results status for all completed rounds (non-blocking)
    const completedRoundIds = fetchedRounds
      .filter((r) => r.status === 'completed')
      .map((r) => r.id);

    if (completedRoundIds.length > 0) {
      try {
        await fetchBatchOrphanedResults(completedRoundIds);
      } catch (orphanedError) {
        logger.error('Error loading orphaned results status', { data: orphanedError });
        // Continue anyway - orphaned results are just warnings
      }
    }
  } catch {
    loadingRaces.value = false;
    // Mark initial load as complete even on error to prevent perpetual skeleton
    initialLoadComplete.value = true;
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to load rounds and races',
      life: 5000,
    });
  }
}

onMounted(async () => {
  await loadRoundsAndRaces();
});

// Watch for seasonId changes to reload data when navigating between seasons
watch(
  () => props.seasonId,
  async (newSeasonId, oldSeasonId) => {
    if (newSeasonId && newSeasonId !== oldSeasonId) {
      // Cancel any pending load operation
      if (loadAbortController.value) {
        loadAbortController.value.abort();
      }

      // Create new AbortController for this load operation
      loadAbortController.value = new AbortController();

      // Reset state
      initialLoadComplete.value = false;
      activeIndexes.value = [];

      // Reload all data
      await loadRoundsAndRaces();
    }
  },
);

function formatScheduledDate(dateString: string | null): string {
  if (!dateString) {
    return 'Not scheduled';
  }
  try {
    return format(parseISO(dateString), 'MMM dd, yyyy HH:mm');
  } catch {
    return dateString;
  }
}

function getTrackAndLocation(trackId: number | null): string {
  if (!trackId) {
    return 'No track selected';
  }
  const track = trackStore.getTrackById(trackId);
  if (!track) {
    return `Track #${trackId}`;
  }
  const trackLocation = trackStore.trackLocationById(track.platform_track_location_id);
  return trackLocation
    ? `${trackLocation.name} - ${track.name}`
    : `${track.name} (${track.location?.country})`;
}

function getRoundBackgroundColor(index: number): string {
  return getColor(index);
}

function formatRoundPointsTooltip(round: Round): string {
  const lines: string[] = ['<strong>Round Points Configuration</strong>', ''];

  // Parse points system
  if (round.points_system) {
    try {
      const pointsSystem = JSON.parse(round.points_system) as Record<string, number>;
      const positions = Object.entries(pointsSystem)
        .sort(([a], [b]) => parseInt(a) - parseInt(b))
        .map(([pos, pts]) => `<span class="w-6">P${pos}:</span> ${pts}`);

      lines.push('<strong>Position Points:</strong>');

      // Create a grid layout for position points
      lines.push(
        '<div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.25rem 0.5rem; margin-top: 0.5rem;">',
      );
      positions.forEach((positionText) => {
        lines.push(`<div style="white-space: nowrap;">${positionText}</div>`);
      });
      lines.push('</div>');
      lines.push('');
    } catch {
      lines.push('<strong>Position Points:</strong> Not configured');
      lines.push('');
    }
  }

  // Bonus points
  const bonuses: string[] = [];

  if (round.fastest_lap !== null && round.fastest_lap > 0) {
    const restriction = round.fastest_lap_top_10 ? ' (Top 10 only)' : '';
    bonuses.push(`Fastest Lap: +${round.fastest_lap} pts${restriction}`);
  }

  if (round.qualifying_pole !== null && round.qualifying_pole > 0) {
    const restriction = round.qualifying_pole_top_10 ? ' (Top 10 only)' : '';
    bonuses.push(`Pole Position: +${round.qualifying_pole} pts${restriction}`);
  }

  if (bonuses.length > 0) {
    lines.push('<strong>Bonus Points:</strong>');
    lines.push(bonuses.join('\n'));
  } else {
    lines.push('<strong>Bonus Points:</strong> None');
  }

  return lines.join('\n');
}

function handleCreateRound(): void {
  selectedRound.value = null;
  formMode.value = 'create';
  showFormDrawer.value = true;
}

function handleEditRound(round: Round): void {
  selectedRound.value = round;
  formMode.value = 'edit';
  showFormDrawer.value = true;
}

function handleDeleteRound(round: Round): void {
  confirm.require({
    group: 'round-delete',
    message: `Are you sure you want to delete Round ${round.round_number}${round.name ? ` - ${round.name}` : ''}?`,
    header: 'Confirm Delete',
    icon: 'pi pi-exclamation-triangle',
    rejectClass: 'p-button-secondary p-button-outlined',
    rejectLabel: 'Cancel',
    acceptLabel: 'Delete',
    acceptClass: 'p-button-danger',
    accept: async () => {
      try {
        await roundStore.deleteExistingRound(round.id);
        toast.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Round deleted successfully',
          life: 3000,
        });
      } catch (error) {
        toast.add({
          severity: 'error',
          summary: 'Error',
          detail: error instanceof Error ? error.message : 'Failed to delete round',
          life: 5000,
        });
      }
    },
  });
}

async function handleRoundSaved(): Promise<void> {
  showFormDrawer.value = false;
  selectedRound.value = null;

  // Reload rounds to get updated data
  await roundStore.fetchRounds(props.seasonId);

  // Ensure tracks are loaded for all rounds
  try {
    await trackStore.fetchTracks({ platform_id: props.platformId, is_active: true });
  } catch {
    // Silently handle track loading errors
  }
}

async function handleToggleCompletion(round: Round): Promise<void> {
  completingRoundId.value = round.id;

  try {
    if (round.status === 'completed') {
      // Uncompleting a round - just update the round status
      // DO NOT cascade to child races - they keep their current status
      await roundStore.uncompleteRound(round.id);

      // Clear orphaned results cache for this round
      clearOrphanedResultsCache(round.id);

      toast.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Round marked as incomplete',
        life: 3000,
      });
    } else {
      // Completing a round - update round status
      // The backend also completes all races and confirms results
      await roundStore.completeRound(round.id);

      // Update local race statuses to 'completed' (optimistic update)
      // This is a frontend-only visual update - no API calls for child items
      const racesForRound = raceStore.racesByRoundId(round.id);
      racesForRound.forEach((race) => {
        const existingRace = raceStore.races.find((r) => r.id === race.id);
        if (existingRace) {
          existingRace.status = 'completed';
        }
      });

      // Fetch orphaned results status for this newly completed round
      try {
        await fetchOrphanedResultsStatus(round.id);
      } catch (orphanedError) {
        logger.error('Error fetching orphaned results status', { data: orphanedError });
        // Continue anyway - orphaned results are just warnings
      }

      toast.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Round and all races marked as completed',
        life: 3000,
      });
    }
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error instanceof Error ? error.message : 'Failed to update round status',
      life: 5000,
    });
  } finally {
    completingRoundId.value = null;
  }
}

function getAllRaceEvents(roundId: number): Race[] {
  return allRaceEventsByRound.value.get(roundId) || [];
}

/**
 * Enriches a race with the orphaned results flag from the round-level data
 * @param race - The race to enrich
 * @param round - The round this race belongs to
 * @returns Race object with has_orphaned_results populated
 */
function getRaceWithOrphanedFlag(race: Race, round: Round): Race {
  // If race already has the flag, return as is
  if (race.has_orphaned_results !== undefined) {
    return race;
  }

  // Check if the round has orphaned results (only for completed rounds)
  if (round.status === 'completed') {
    return {
      ...race,
      has_orphaned_results: hasOrphanedResults(race),
    };
  }

  return race;
}

async function handleEditQualifier(qualifier: Race): Promise<void> {
  // Set all state FIRST, before showing the drawer
  selectedRoundId.value = qualifier.round_id;
  selectedRace.value = qualifier;
  raceFormMode.value = 'edit';
  raceFormType.value = 'qualifier';

  // Use nextTick to ensure all reactive updates are completed
  // before showing the drawer
  await nextTick();
  showRaceFormDrawer.value = true;
}

function handleDeleteQualifier(qualifier: Race): void {
  confirm.require({
    group: 'race-delete',
    message: `Are you sure you want to delete the qualifying session${qualifier.name ? ` - ${qualifier.name}` : ''}?`,
    header: 'Confirm Delete',
    icon: 'pi pi-exclamation-triangle',
    rejectClass: 'p-button-secondary p-button-outlined',
    rejectLabel: 'Cancel',
    acceptLabel: 'Delete',
    acceptClass: 'p-button-danger',
    accept: async () => {
      try {
        await raceStore.deleteExistingRace(qualifier.id, true);
        toast.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Qualifying session deleted successfully',
          life: 3000,
        });
      } catch (error) {
        toast.add({
          severity: 'error',
          summary: 'Error',
          detail: error instanceof Error ? error.message : 'Failed to delete qualifying session',
          life: 5000,
        });
      }
    },
  });
}

function handleCreateRace(roundId: number): void {
  selectedRoundId.value = roundId;
  selectedRace.value = null;
  raceFormMode.value = 'create';
  raceFormType.value = 'race';
  showRaceFormDrawer.value = true;
}

async function handleEditRace(race: Race): Promise<void> {
  // Set all state FIRST, before showing the drawer
  selectedRoundId.value = race.round_id;
  selectedRace.value = race;
  raceFormMode.value = 'edit';
  raceFormType.value = 'race';

  // Use nextTick to ensure all reactive updates are completed
  // before showing the drawer
  await nextTick();
  showRaceFormDrawer.value = true;
}

function handleDeleteRace(race: Race): void {
  confirm.require({
    group: 'race-delete',
    message: `Are you sure you want to delete Race ${race.race_number}${race.name ? ` - ${race.name}` : ''}?`,
    header: 'Confirm Delete',
    icon: 'pi pi-exclamation-triangle',
    rejectClass: 'p-button-secondary p-button-outlined',
    rejectLabel: 'Cancel',
    acceptLabel: 'Delete',
    acceptClass: 'p-button-danger',
    accept: async () => {
      try {
        await raceStore.deleteExistingRace(race.id);
        toast.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Race deleted successfully',
          life: 3000,
        });
      } catch (error) {
        toast.add({
          severity: 'error',
          summary: 'Error',
          detail: error instanceof Error ? error.message : 'Failed to delete race',
          life: 5000,
        });
      }
    },
  });
}

async function handleRaceSaved(): Promise<void> {
  const roundId = selectedRoundId.value;

  showRaceFormDrawer.value = false;
  selectedRace.value = null;
  selectedRoundId.value = null;

  // Clear orphaned results cache since race structure changed
  if (roundId) {
    clearOrphanedResultsCache(roundId);
  }

  const entityType = raceFormType.value === 'qualifier' ? 'Qualifying session' : 'Race';
  const action = raceFormMode.value === 'edit' ? 'updated' : 'created';

  // Reload races for this round to ensure proper display
  if (roundId) {
    try {
      await raceStore.fetchRaces(roundId);
    } catch {
      // Silently handle race reload errors
    }
  }

  toast.add({
    severity: 'success',
    summary: 'Success',
    detail: `${entityType} ${action} successfully`,
    life: 3000,
  });
}

function handleEnterResults(race: Race, round: Round): void {
  selectedRaceForResults.value = race;
  selectedRoundForResults.value = round;
  showResultsModal.value = true;
}

function handleResultsSaved(): void {
  // Clear orphaned results cache for this round since results changed
  if (selectedRoundForResults.value) {
    clearOrphanedResultsCache(selectedRoundForResults.value.id);

    // Re-fetch orphaned results status
    fetchOrphanedResultsStatus(selectedRoundForResults.value.id).catch((error) => {
      logger.error('Error re-fetching orphaned results status', { data: error });
    });
  }

  toast.add({
    severity: 'success',
    summary: 'Success',
    detail: 'Race results saved successfully',
    life: 3000,
  });
}

function handleViewRoundResults(round: Round): void {
  selectedRoundForRoundResults.value = round;
  showRoundResultsModal.value = true;
}

async function handleToggleRaceStatus(
  race: Race,
  newStatus: 'scheduled' | 'completed',
): Promise<void> {
  try {
    // Call the race store to update the race status
    await raceStore.updateExistingRace(race.id, { status: newStatus }, race.is_qualifier);

    // If race was completed, refresh orphaned results status
    if (newStatus === 'completed') {
      try {
        await fetchOrphanedResultsStatus(race.round_id);
      } catch (error) {
        logger.error('Error fetching orphaned results status', { data: error });
      }
    }

    // Determine the success message
    let detail: string;
    if (race.is_qualifier && newStatus === 'completed') {
      // Check if pole bonus points are configured
      const hasPoleBonus = race.qualifying_pole !== null && race.qualifying_pole > 0;
      detail = hasPoleBonus
        ? 'Qualifying completed. Pole position points calculated.'
        : 'Qualifying session marked as completed';
    } else if (!race.is_qualifier && newStatus === 'completed') {
      // Handle race completion
      if (race.race_points) {
        const hasFastestLapBonus = race.fastest_lap !== null && race.fastest_lap > 0;
        detail = hasFastestLapBonus
          ? 'Race completed. Points and fastest lap bonus calculated.'
          : 'Race completed. Points calculated.';
      } else {
        detail = 'Race marked as completed';
      }
    } else {
      detail = `${race.is_qualifier ? 'Qualifying session' : 'Race'} marked as ${newStatus}`;
    }

    toast.add({
      severity: 'success',
      summary: 'Success',
      detail,
      life: 3000,
    });
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error instanceof Error ? error.message : 'Failed to update race status',
      life: 5000,
    });
  }
}

async function handleRefreshOrphanedResults(round: Round): Promise<void> {
  // Clear the orphaned results cache for this round
  clearOrphanedResultsCache(round.id);

  // Re-fetch the orphaned results status to update the UI
  try {
    await fetchOrphanedResultsStatus(round.id);
    logger.debug('Orphaned results status refreshed', { roundId: round.id });
  } catch (error) {
    logger.error('Error refreshing orphaned results status', { data: error, roundId: round.id });
    // Don't show error toast - this is a background refresh
  }
}
</script>
