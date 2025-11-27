<template>
  <BasePanel>
    <template #default>
      <!-- Loading State -->
      <div v-if="roundStore.isLoading" class="space-y-4">
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
        <Button label="Create First Round" icon="pi pi-plus" outlined @click="handleCreateRound" />
      </div>

      <!-- Rounds List -->
      <Accordion v-else :multiple="true" :active-index="activeIndexes">
        <AccordionPanel
          v-for="(round, index) in rounds"
          :key="round.id"
          :value="round.id"
          class="mb-1"
          :pt="{
            root: ({ context }: { context: { active: boolean } }) => ({
              class: context.active
                ? 'border border-slate-300 rounded-md bg-slate-50'
                : 'border-1 border-gray-200 rounded-md',
            }),
          }"
        >
          <AccordionHeader
            class="pl-0 py-0"
            :pt="{
              root: ({ context }: { context: { active: boolean } }) => ({
                class: context.active
                  ? 'bg-slate-100 hover:bg-blue-50 shadow-md border-b-1 border-slate-300 rounded-l-md'
                  : 'hover:bg-blue-50 border-b-1 border-gray-200 rounded-l-md',
              }),
            }"
          >
            <div class="flex items-center flex-row gap-2 w-full pr-4">
              <div
                class="h-16 w-16 flex flex-col items-center justify-center rounded-l-md"
                :style="{ backgroundColor: getRoundBackgroundColor(index) }"
              >
                <span class="text-xs uppercase text-white">Round</span>
                <span class="text-2xl font-bold text-shadow-sm text-white">{{
                  round.round_number
                }}</span>
              </div>

              <div v-if="round.name" class="flex flex-none items-center mr-4 gap-2">
                <span v-if="round.name" class="font-medium text-lg text-gray-700">{{
                  round.name || 'Untitled Round'
                }}</span>
              </div>
              <div class="flex flex-grow flex-row pr-4 space-y-0">
                <div class="flex-none flex-col">
                  <div>
                    <span class="text-sm text-gray-400 font-medium">Track</span>
                  </div>
                  <span class="text-md text-gray-700 font-normal">
                    {{ getTrackAndLocation(round.platform_track_id) }}
                  </span>
                </div>
              </div>

              <div v-if="round.scheduled_at" class="w-36 flex flex-col">
                <div>
                  <span class="text-sm text-gray-400 font-medium">Date</span>
                </div>
                <span class="text-md text-gray-700 font-normal">
                  {{ formatScheduledDate(round.scheduled_at) }}
                </span>
              </div>
              <div class="flex items-center gap-2">
                <Tag
                  v-if="round.round_points"
                  v-tooltip.top="
                    'Round points enabled: Race results are combined to create a round standing'
                  "
                  icon="pi pi-calculator"
                  severity="info"
                  value="Round Points"
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
                      round.status === 'completed' ? 'text-green-600' : 'text-slate-400',
                    ]"
                  >
                    Completed
                  </span>
                </div>
                <EditButton v-if="round.status !== 'completed'" @click="handleEditRound(round)" />
                <DeleteButton
                  v-if="round.status !== 'completed'"
                  @click="handleDeleteRound(round)"
                />
              </div>
            </div>
          </AccordionHeader>

          <AccordionContent>
            <div class="space-y-2">
              <!-- Round Details -->
              <div
                v-if="
                  round.technical_notes ||
                  round.stream_url ||
                  round.internal_notes ||
                  (round.round_points && round.points_system)
                "
                class="grid grid-cols-3 gap-4 border-b border-slate-300 pb-4"
              >
                <BasePanel
                  v-if="round.technical_notes"
                  content-class="p-4 border border-slate-300 rounded-md bg-surface-50"
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
                  content-class="p-4 border border-slate-300 rounded-md bg-surface-50"
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
                  content-class="p-4 border border-slate-300 rounded-md bg-surface-50"
                >
                  <template #header>
                    <div class="flex items-center gap-2 py-2 mx-2 w-full">
                      <span class="font-medium text-surface-700">Internal Notes</span>
                    </div>
                  </template>
                  <div class="whitespace-pre-wrap">{{ round.internal_notes }}</div>
                </BasePanel>

                <BasePanel
                  v-if="round.round_points && round.points_system"
                  content-class="p-4 border border-slate-300 rounded-md bg-surface-50"
                >
                  <template #header>
                    <div class="flex items-center gap-2 py-2 mx-2 w-full">
                      <i class="pi pi-calculator text-blue-600"></i>
                      <span class="font-medium text-surface-700">Round Points System</span>
                    </div>
                  </template>
                  <div class="whitespace-pre-wrap font-mono text-sm">{{ round.points_system }}</div>
                </BasePanel>
              </div>

              <!-- Race Events Section (Qualifying + Races) -->
              <div>
                <div class="flex items-center justify-between my-3">
                  <HTag :level="3">Round {{ round.round_number }} Race Events</HTag>
                  <div v-if="round.status !== 'completed'" class="flex items-center gap-2">
                    <Button
                      label="Add Event"
                      icon="pi pi-plus"
                      size="small"
                      outlined
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
                      :race="race"
                      :is-round-completed="round.status === 'completed'"
                      @edit="handleEditQualifier"
                      @delete="handleDeleteQualifier"
                      @enter-results="handleEnterResults($event, round)"
                      @toggle-status="handleToggleRaceStatus"
                    />
                    <RaceListItem
                      v-else
                      :race="race"
                      :is-round-completed="round.status === 'completed'"
                      @edit="handleEditRace"
                      @delete="handleDeleteRace"
                      @enter-results="handleEnterResults($event, round)"
                      @toggle-status="handleToggleRaceStatus"
                    />
                  </template>
                </div>
              </div>
            </div>
          </AccordionContent>
        </AccordionPanel>
      </Accordion>

      <!-- Add Round Button (shown when rounds exist) -->
      <div v-if="!roundStore.isLoading && rounds.length > 0" class="mt-2">
        <button
          type="button"
          class="flex items-center justify-center gap-2 w-full p-2 bg-slate-50 rounded border-2 border-dashed border-slate-300 hover:border-primary-400 hover:bg-primary-50/20 transition-all cursor-pointer group text-slate-500 hover:text-primary-600"
          @click.stop="handleCreateRound"
        >
          <PhPlus :size="16" weight="bold" class="text-slate-400 group-hover:text-primary-500" />
          <span class="text-sm font-medium">Add Round</span>
        </button>
      </div>
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

  <!-- Confirm Delete Dialogs -->
  <ConfirmDialog group="round-delete" />
  <ConfirmDialog group="race-delete" />
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue';
import { format, parseISO } from 'date-fns';
import { useToast } from 'primevue/usetoast';
import { useConfirm } from 'primevue/useconfirm';
import { PhPlus } from '@phosphor-icons/vue';
import BasePanel from '@app/components/common/panels/BasePanel.vue';
import { EditButton, DeleteButton } from '@app/components/common/buttons';
import RoundFormDrawer from '@app/components/round/modals/RoundFormDrawer.vue';
import RaceFormDrawer from '@app/components/round/modals/RaceFormDrawer.vue';
import RaceListItem from '@app/components/round/RaceListItem.vue';
import QualifierListItem from '@app/components/round/QualifierListItem.vue';
import RaceResultModal from '@app/components/result/RaceResultModal.vue';
import Button from 'primevue/button';
import Accordion from 'primevue/accordion';
import AccordionPanel from 'primevue/accordionpanel';
import AccordionHeader from 'primevue/accordionheader';
import AccordionContent from 'primevue/accordioncontent';
import Skeleton from 'primevue/skeleton';
import ConfirmDialog from 'primevue/confirmdialog';
import ToggleSwitch from 'primevue/toggleswitch';
import Tag from 'primevue/tag';
import { useRoundStore } from '@app/stores/roundStore';
import { useRaceStore } from '@app/stores/raceStore';
import { useTrackStore } from '@app/stores/trackStore';
import type { Round } from '@app/types/round';
import type { Race } from '@app/types/race';
import { isQualifier } from '@app/types/race';
import type { RGBColor } from '@app/types/competition';
import HTag from '@app/components/common/HTag.vue';
import { useColorRange } from '@app/composables/useColorRange';
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
const activeIndexes = ref<number[]>([]);

const showRaceFormDrawer = ref(false);
const selectedRace = ref<Race | null>(null);
const selectedRoundId = ref<number | null>(null);
const raceFormMode = ref<'create' | 'edit'>('create');
const raceFormType = ref<'race' | 'qualifier'>('race');
const loadingRaces = ref(false);
const completingRoundId = ref<number | null>(null);

const showResultsModal = ref(false);
const selectedRaceForResults = ref<Race | null>(null);
const selectedRoundForResults = ref<Round | null>(null);

const rounds = computed(() => {
  return roundStore
    .roundsBySeasonId(props.seasonId)
    .sort((a, b) => a.round_number - b.round_number);
});

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

onMounted(async () => {
  try {
    // First, fetch rounds
    await roundStore.fetchRounds(props.seasonId);

    // Also fetch tracks for this platform to display track names (non-blocking)
    try {
      await trackStore.fetchTracks({ platform_id: props.platformId, is_active: true });
    } catch (trackError) {
      logger.error('Error loading tracks', { data: trackError });
      // Continue anyway - tracks are just for display names
    }

    // Then fetch races for all rounds
    loadingRaces.value = true;
    const fetchedRounds = roundStore.roundsBySeasonId(props.seasonId);

    for (const round of fetchedRounds) {
      await raceStore.fetchRaces(round.id);
    }

    loadingRaces.value = false;
  } catch {
    loadingRaces.value = false;
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to load rounds and races',
      life: 5000,
    });
  }
});

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
  toast.add({
    severity: 'success',
    summary: 'Success',
    detail: 'Race results saved successfully',
    life: 3000,
  });
}

async function handleToggleRaceStatus(
  race: Race,
  newStatus: 'scheduled' | 'completed',
): Promise<void> {
  try {
    // Call the race store to update the race status
    await raceStore.updateExistingRace(race.id, { status: newStatus }, race.is_qualifier);

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
</script>
