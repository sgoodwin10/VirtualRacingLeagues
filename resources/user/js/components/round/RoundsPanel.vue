<template>
  <BasePanel>
    <template #header>
      <div class="flex items-center justify-between">
        <h2 class="font-semibold">Rounds</h2>
        <Button
          label="Add Round"
          icon="pi pi-plus"
          size="small"
          :disabled="roundStore.isLoading"
          @click="handleCreateRound"
        />
      </div>
    </template>

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
        <AccordionPanel v-for="round in rounds" :key="round.id" :value="round.id">
          <AccordionHeader>
            <div class="flex items-center justify-between w-full pr-4">
              <div class="flex items-center gap-3">
                <Tag :value="`Round ${round.round_number}`" severity="info" />
                <span class="font-medium">{{ round.name || 'Untitled Round' }}</span>
                <span class="text-sm text-gray-600">
                  {{ formatScheduledDate(round.scheduled_at) }}
                </span>
              </div>
              <div class="flex items-center gap-2">
                <Tag :value="round.status_label" :severity="getStatusSeverity(round.status)" />
                <Button
                  v-tooltip.top="'Edit Round'"
                  icon="pi pi-pencil"
                  text
                  rounded
                  size="small"
                  severity="secondary"
                  @click.stop="handleEditRound(round)"
                />
                <Button
                  v-tooltip.top="'Delete Round'"
                  icon="pi pi-trash"
                  text
                  rounded
                  size="small"
                  severity="danger"
                  @click.stop="handleDeleteRound(round)"
                />
              </div>
            </div>
          </AccordionHeader>

          <AccordionContent>
            <div class="space-y-4">
              <!-- Round Details -->
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <div class="font-medium text-sm text-gray-600">Track</div>
                  <div>{{ getTrackAndLocation(round.platform_track_id) }}</div>
                </div>
                <div v-if="round.track_layout">
                  <div class="font-medium text-sm text-gray-600">Layout</div>
                  <div>{{ round.track_layout }}</div>
                </div>
                <div v-if="round.track_conditions">
                  <div class="font-medium text-sm text-gray-600">Conditions</div>
                  <div>{{ round.track_conditions }}</div>
                </div>
                <div>
                  <div class="font-medium text-sm text-gray-600">Timezone</div>
                  <div>{{ round.timezone }}</div>
                </div>
              </div>

              <div v-if="round.technical_notes">
                <div class="font-medium text-sm text-gray-600">Technical Notes</div>
                <div class="whitespace-pre-wrap">{{ round.technical_notes }}</div>
              </div>

              <div v-if="round.stream_url">
                <div class="font-medium text-sm text-gray-600">Stream URL</div>
                <a :href="round.stream_url" target="_blank" class="text-blue-600 hover:underline">
                  {{ round.stream_url }}
                </a>
              </div>

              <div v-if="round.internal_notes">
                <div class="font-medium text-sm text-gray-600">Internal Notes</div>
                <div class="whitespace-pre-wrap">{{ round.internal_notes }}</div>
              </div>

              <!-- Qualifier Section -->
              <div>
                <div class="flex items-center justify-between mb-3">
                  <h3 class="font-semibold flex items-center gap-2">
                    <i class="pi pi-stopwatch text-blue-600"></i>
                    Qualifying
                  </h3>
                  <Button
                    v-if="!getQualifier(round.id)"
                    label="Add Qualifying"
                    icon="pi pi-plus"
                    size="small"
                    outlined
                    severity="info"
                    @click="handleCreateQualifier(round.id)"
                  />
                </div>

                <div v-if="loadingRaces" class="mb-4">
                  <Skeleton height="4rem" />
                </div>

                <div
                  v-else-if="!getQualifier(round.id)"
                  class="text-sm text-gray-500 text-center py-4 mb-4 bg-blue-50 rounded-lg border border-blue-200"
                >
                  <i class="pi pi-info-circle mr-2"></i>
                  No qualifying session configured
                </div>

                <div v-else class="mb-4">
                  <QualifierListItem
                    :race="getQualifier(round.id)!"
                    @edit="handleEditQualifier"
                    @delete="handleDeleteQualifier"
                  />
                </div>
              </div>

              <Divider />

              <!-- Races Section -->
              <div>
                <div class="flex items-center justify-between mb-3">
                  <h3 class="font-semibold">Races</h3>
                  <Button
                    label="Add Race"
                    icon="pi pi-plus"
                    size="small"
                    outlined
                    @click="handleCreateRace(round.id)"
                  />
                </div>

                <div v-if="loadingRaces" class="space-y-2">
                  <Skeleton height="4rem" />
                  <Skeleton height="4rem" />
                </div>

                <div
                  v-else-if="getRaces(round.id).length === 0"
                  class="text-sm text-gray-500 text-center py-4"
                >
                  No races added yet
                </div>

                <div v-else class="space-y-2">
                  <RaceListItem
                    v-for="race in getRaces(round.id)"
                    :key="race.id"
                    :race="race"
                    @edit="handleEditRace"
                    @delete="handleDeleteRace"
                  />
                </div>
              </div>
            </div>
          </AccordionContent>
        </AccordionPanel>
      </Accordion>
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

  <!-- Confirm Delete Dialogs -->
  <ConfirmDialog group="round-delete" />
  <ConfirmDialog group="race-delete" />
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { format, parseISO } from 'date-fns';
import { useToast } from 'primevue/usetoast';
import { useConfirm } from 'primevue/useconfirm';
import BasePanel from '@user/components/common/panels/BasePanel.vue';
import RoundFormDrawer from '@user/components/round/modals/RoundFormDrawer.vue';
import RaceFormDrawer from '@user/components/round/modals/RaceFormDrawer.vue';
import RaceListItem from '@user/components/round/RaceListItem.vue';
import QualifierListItem from '@user/components/round/QualifierListItem.vue';
import Button from 'primevue/button';
import Accordion from 'primevue/accordion';
import AccordionPanel from 'primevue/accordionpanel';
import AccordionHeader from 'primevue/accordionheader';
import AccordionContent from 'primevue/accordioncontent';
import Tag from 'primevue/tag';
import Skeleton from 'primevue/skeleton';
import Divider from 'primevue/divider';
import ConfirmDialog from 'primevue/confirmdialog';
import { useRoundStore } from '@user/stores/roundStore';
import { useRaceStore } from '@user/stores/raceStore';
import { useTrackStore } from '@user/stores/trackStore';
import type { Round, RoundStatus } from '@user/types/round';
import type { Race } from '@user/types/race';
import { isQualifier } from '@user/types/race';

interface Props {
  seasonId: number;
  platformId: number;
}

const props = defineProps<Props>();

const roundStore = useRoundStore();
const raceStore = useRaceStore();
const trackStore = useTrackStore();
const toast = useToast();
const confirm = useConfirm();

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

const rounds = computed(() => {
  return roundStore
    .roundsBySeasonId(props.seasonId)
    .sort((a, b) => a.round_number - b.round_number);
});

// Computed getters for races to ensure proper reactivity
const racesByRound = computed(() => {
  const raceMap = new Map<number, Race[]>();
  rounds.value.forEach((round) => {
    const roundRaces = raceStore
      .racesByRoundId(round.id)
      .filter((race) => !isQualifier(race))
      .sort((a, b) => a.race_number - b.race_number);
    raceMap.set(round.id, roundRaces);
  });
  return raceMap;
});

const qualifiersByRound = computed(() => {
  const qualifierMap = new Map<number, Race | null>();
  rounds.value.forEach((round) => {
    const qualifier = raceStore.racesByRoundId(round.id).find((race) => isQualifier(race)) || null;
    qualifierMap.set(round.id, qualifier);
  });
  return qualifierMap;
});

onMounted(async () => {
  try {
    // First, fetch rounds
    await roundStore.fetchRounds(props.seasonId);

    // Also fetch tracks for this platform to display track names (non-blocking)
    try {
      await trackStore.fetchTracks({ platform_id: props.platformId, is_active: true });
    } catch (trackError) {
      console.error('[RoundsPanel] Error loading tracks:', trackError);
      // Continue anyway - tracks are just for display names
    }

    // Then fetch races for all rounds
    loadingRaces.value = true;
    const fetchedRounds = roundStore.roundsBySeasonId(props.seasonId);

    for (const round of fetchedRounds) {
      await raceStore.fetchRaces(round.id);
    }

    loadingRaces.value = false;
  } catch (error) {
    console.error('[RoundsPanel] Error loading rounds and races:', error);
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

function getStatusSeverity(
  status: RoundStatus,
): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
  const severityMap: Record<RoundStatus, 'success' | 'info' | 'warn' | 'danger' | 'secondary'> = {
    scheduled: 'info',
    pre_race: 'warn',
    in_progress: 'success',
    completed: 'secondary',
    cancelled: 'danger',
  };
  return severityMap[status] || 'info';
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
    ? `${track.name} - ${trackLocation.name} (${trackLocation.country})`
    : `${track.name} (${track.location?.country})`;
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

function handleRoundSaved(): void {
  showFormDrawer.value = false;
  selectedRound.value = null;
}

function getQualifier(roundId: number): Race | null {
  return qualifiersByRound.value.get(roundId) || null;
}

function getRaces(roundId: number): Race[] {
  return racesByRound.value.get(roundId) || [];
}

function handleCreateQualifier(roundId: number): void {
  selectedRoundId.value = roundId;
  selectedRace.value = null;
  raceFormMode.value = 'create';
  raceFormType.value = 'qualifier';
  showRaceFormDrawer.value = true;
}

function handleEditQualifier(qualifier: Race): void {
  selectedRoundId.value = qualifier.round_id;
  selectedRace.value = qualifier;
  raceFormMode.value = 'edit';
  raceFormType.value = 'qualifier';
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
        await raceStore.deleteExistingRace(qualifier.id);
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

function handleEditRace(race: Race): void {
  selectedRoundId.value = race.round_id;
  selectedRace.value = race;
  raceFormMode.value = 'edit';
  raceFormType.value = 'race';
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
    } catch (error) {
      console.error('Failed to reload races:', error);
    }
  }

  toast.add({
    severity: 'success',
    summary: 'Success',
    detail: `${entityType} ${action} successfully`,
    life: 3000,
  });
}
</script>
