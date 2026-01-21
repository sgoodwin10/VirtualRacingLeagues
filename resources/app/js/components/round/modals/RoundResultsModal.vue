<template>
  <BaseModal
    v-model:visible="isVisible"
    width="4xl"
    :closable="!isLoading"
    :pt="{ content: { class: '!pt-2' } }"
    @hide="handleClose"
  >
    <template #header>
      <div class="flex items-center justify-between w-full">
        <div class="flex items-center gap-3">
          <PhTrophy :size="24" class="text-amber-600" />
          <h2 class="text-xl font-semibold text-gray-900">
            Round {{ roundData?.round_number }}
            <span v-if="roundData?.name">- {{ roundData.name }}</span>
            Results
          </h2>
        </div>
        <div class="pr-2">
          <Button
            v-if="roundData?.round_results && isRoundCompleted"
            label="Download Round Results"
            variant="secondary"
            outline
            :title="'Download Round Results'"
            :icon="PhDownload"
            :loading="isDownloadingStandings"
            @click="handleDownloadRoundStandings"
          />
        </div>
      </div>
    </template>

    <div>
      <!-- Loading State -->
      <div v-if="isLoading" class="flex items-center justify-center py-12">
        <i class="pi pi-spin pi-spinner text-4xl text-gray-400"></i>
        <span class="ml-3 text-gray-500">Loading results...</span>
      </div>

      <!-- Empty State -->
      <div v-else-if="!hasResults" class="flex flex-col items-center justify-center py-12">
        <PhClipboardText :size="64" class="text-gray-300 mb-4" />
        <p class="text-gray-500 text-lg">No results available for this round</p>
      </div>

      <!-- Results Content -->
      <template v-else>
        <!-- Main Content Tabs (Round Results vs Cross-Division Results) -->
        <div class="overflow-hidden">
          <Tabs v-model:value="activeMainTab">
            <TabList>
              <Tab value="round-results">Round Results</Tab>
              <Tab v-if="raceTimesRequired" value="qualifying-times">Qualifying Times</Tab>
              <Tab v-if="raceTimesRequired" value="race-times">Race Times</Tab>
              <Tab v-if="raceTimesRequired" value="fastest-laps">Fastest Laps</Tab>
            </TabList>
            <TabPanels>
              <!-- Round Results Tab -->
              <TabPanel value="round-results">
                <!-- Division Tabs (if divisions exist) -->
                <div v-if="hasDivisions">
                  <Tabs v-model:value="activeDivisionId">
                    <TabList>
                      <Tab v-for="division in divisions" :key="division.id" :value="division.id">
                        {{ division.name }}
                      </Tab>
                    </TabList>
                    <TabPanels>
                      <TabPanel
                        v-for="division in divisions"
                        :key="division.id"
                        :value="division.id"
                      >
                        <div class="space-y-2 mt-4">
                          <!-- Round Standings Section -->
                          <RoundStandingsSection
                            v-if="roundData?.round_results"
                            :key="`standings-${division.id}`"
                            :round-standings="roundData.round_results"
                            :division-id="division.id"
                            :has-race-points-enabled="hasRacePointsEnabled"
                          />
                          <!-- Race Events Results -->
                          <RaceEventResultsSection
                            v-for="raceEvent in raceEvents"
                            :key="raceEvent.id"
                            :race-event="raceEvent"
                            :division-id="division.id"
                            :is-round-completed="isRoundCompleted"
                            :race-times-required="raceTimesRequired"
                          />
                        </div>
                      </TabPanel>
                    </TabPanels>
                  </Tabs>
                </div>

                <!-- No Divisions: Show All Results -->
                <div v-else class="space-y-2">
                  <!-- Round Standings Section -->
                  <RoundStandingsSection
                    v-if="roundData?.round_results"
                    :round-standings="roundData.round_results"
                    :has-race-points-enabled="hasRacePointsEnabled"
                  />

                  <!-- Race Events Results -->
                  <RaceEventResultsSection
                    v-for="raceEvent in raceEvents"
                    :key="raceEvent.id"
                    :race-event="raceEvent"
                    :is-round-completed="isRoundCompleted"
                    :race-times-required="raceTimesRequired"
                  />
                </div>
              </TabPanel>

              <!-- Qualifying Times Tab (only shown if race times are required) -->
              <TabPanel v-if="raceTimesRequired" value="qualifying-times">
                <CrossDivisionResultsSection
                  title="Qualifying Times - All Divisions"
                  :results="roundData?.qualifying_results ?? null"
                  :race-events="raceEvents"
                  :divisions="divisions"
                  download-label="Download CSV"
                  :is-downloading="isDownloadingQualifying"
                  @download="handleDownloadQualifying"
                />
              </TabPanel>

              <!-- Race Times Tab (only shown if race times are required) -->
              <TabPanel v-if="raceTimesRequired" value="race-times">
                <CrossDivisionResultsSection
                  title="Race Times - All Divisions"
                  :results="roundData?.race_time_results ?? null"
                  :race-events="raceEvents"
                  :divisions="divisions"
                  download-label="Download CSV"
                  :is-downloading="isDownloadingRaceTimes"
                  @download="handleDownloadRaceTimes"
                />
              </TabPanel>

              <!-- Fastest Laps Tab (only shown if race times are required) -->
              <TabPanel v-if="raceTimesRequired" value="fastest-laps">
                <CrossDivisionResultsSection
                  title="Fastest Laps - All Divisions"
                  :results="roundData?.fastest_lap_results ?? null"
                  :race-events="raceEvents"
                  :divisions="divisions"
                  download-label="Download CSV"
                  :is-downloading="isDownloadingFastestLaps"
                  @download="handleDownloadFastestLaps"
                />
              </TabPanel>
            </TabPanels>
          </Tabs>
        </div>
      </template>
    </div>

    <template #footer>
      <div class="flex justify-end">
        <Button label="Close" variant="secondary" @click="handleClose" />
      </div>
    </template>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { Button } from '@app/components/common/buttons';
import Tabs from 'primevue/tabs';
import TabList from 'primevue/tablist';
import Tab from 'primevue/tab';
import TabPanels from 'primevue/tabpanels';
import TabPanel from 'primevue/tabpanel';
import { useToast } from 'primevue/usetoast';
import { PhTrophy, PhClipboardText, PhDownload } from '@phosphor-icons/vue';
import BaseModal from '@app/components/common/modals/BaseModal.vue';
import RaceEventResultsSection from './RaceEventResultsSection.vue';
import RoundStandingsSection from './RoundStandingsSection.vue';
import CrossDivisionResultsSection from './CrossDivisionResultsSection.vue';
import { getRoundResults } from '@app/services/roundService';
import { useSeasonStore } from '@app/stores/seasonStore';
import { useCsvExport } from '@app/composables/useCsvExport';
import type { Round } from '@app/types/round';
import type { RoundResultsResponse, RaceEventResults } from '@app/types/roundResult';

interface Props {
  visible: boolean;
  round: Round;
  seasonId: number;
}

interface Emits {
  (e: 'update:visible', value: boolean): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const toast = useToast();
const seasonStore = useSeasonStore();
const {
  isDownloading: isDownloadingStandings,
  downloadRoundStandingsCsv,
  downloadCrossDivisionCsv,
} = useCsvExport();

// Constants
const NO_DIVISION_SELECTED = -1;

// Local state
const isLoading = ref(false);
const roundData = ref<RoundResultsResponse['round'] | null>(null);
const divisions = ref<RoundResultsResponse['divisions']>([]);
const raceEvents = ref<RaceEventResults[]>([]);
const activeDivisionId = ref<number>(NO_DIVISION_SELECTED);
const activeMainTab = ref<string>('round-results');
const isDownloadingQualifying = ref(false);
const isDownloadingRaceTimes = ref(false);
const isDownloadingFastestLaps = ref(false);

// Computed
const isVisible = computed({
  get: () => props.visible,
  set: (value) => emit('update:visible', value),
});

const hasDivisions = computed(() => divisions.value.length > 0);

const hasResults = computed(() => {
  return raceEvents.value.length > 0 && raceEvents.value.some((event) => event.results.length > 0);
});

const hasRacePointsEnabled = computed(() => {
  // Check if any race (non-qualifier) has race_points enabled
  return raceEvents.value.some((event) => !event.is_qualifier && event.race_points);
});

const isRoundCompleted = computed(() => {
  return props.round.status === 'completed';
});

const raceTimesRequired = computed(() => {
  // Default to false (safer) - only show time features if season is loaded and explicitly enabled
  if (!seasonStore.currentSeason) {
    return false;
  }
  return seasonStore.currentSeason.race_times_required;
});

// Methods
async function loadResults(): Promise<void> {
  isLoading.value = true;

  try {
    // Ensure season data is loaded for race_times_required setting
    if (!seasonStore.currentSeason || seasonStore.currentSeason.id !== props.seasonId) {
      await seasonStore.fetchSeason(props.seasonId);
    }

    const response = await getRoundResults(props.round.id);

    roundData.value = response.round;
    divisions.value = response.divisions;
    raceEvents.value = response.race_events;

    // Set initial active division - always set to first division when data loads
    if (divisions.value.length > 0) {
      activeDivisionId.value = divisions.value[0]?.id ?? NO_DIVISION_SELECTED;
    }
  } catch (error) {
    // Show user-friendly error notification
    console.error('Failed to load round results:', error);
    toast.add({
      severity: 'error',
      summary: 'Error Loading Results',
      detail: 'Failed to load round results. Please try again.',
      life: 5000,
    });
  } finally {
    isLoading.value = false;
  }
}

function handleClose(): void {
  isVisible.value = false;
  // Reset state
  roundData.value = null;
  divisions.value = [];
  raceEvents.value = [];
  activeDivisionId.value = NO_DIVISION_SELECTED;
  activeMainTab.value = 'round-results';
  isDownloadingQualifying.value = false;
  isDownloadingRaceTimes.value = false;
  isDownloadingFastestLaps.value = false;
}

/**
 * Download round standings CSV
 */
async function handleDownloadRoundStandings(): Promise<void> {
  await downloadRoundStandingsCsv(props.round.id);
}

/**
 * Download qualifying times CSV
 */
async function handleDownloadQualifying(): Promise<void> {
  isDownloadingQualifying.value = true;
  try {
    await downloadCrossDivisionCsv(props.round.id, 'qualifying-times');
  } finally {
    isDownloadingQualifying.value = false;
  }
}

/**
 * Download race times CSV
 */
async function handleDownloadRaceTimes(): Promise<void> {
  isDownloadingRaceTimes.value = true;
  try {
    await downloadCrossDivisionCsv(props.round.id, 'race-times');
  } finally {
    isDownloadingRaceTimes.value = false;
  }
}

/**
 * Download fastest laps CSV
 */
async function handleDownloadFastestLaps(): Promise<void> {
  isDownloadingFastestLaps.value = true;
  try {
    await downloadCrossDivisionCsv(props.round.id, 'fastest-laps');
  } finally {
    isDownloadingFastestLaps.value = false;
  }
}

// Watch for modal open to load data
// Use immediate: true to handle cases where the modal is mounted with visible=true
watch(
  () => props.visible,
  async (visible) => {
    if (visible) {
      await loadResults();
    }
  },
  { immediate: true },
);
</script>
