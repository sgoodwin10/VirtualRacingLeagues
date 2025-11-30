<template>
  <BaseModal v-model:visible="isVisible" width="4xl" :closable="!isLoading" @hide="handleClose">
    <template #header>
      <div class="flex items-center gap-3">
        <PhTrophy :size="24" class="text-amber-600" />
        <h2 class="text-xl font-semibold text-gray-900">
          Round {{ roundData?.round_number }}
          <span v-if="roundData?.name">- {{ roundData.name }}</span>
          Results
        </h2>
      </div>
    </template>

    <div class="space-y-6">
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
        <div class="border border-gray-200 rounded-lg overflow-hidden">
          <Tabs v-model:value="activeMainTab">
            <TabList>
              <Tab value="round-results">Round Results</Tab>
              <Tab value="qualifying-times">Qualifying Times</Tab>
              <Tab value="race-times">Race Times</Tab>
              <Tab value="fastest-laps">Fastest Laps</Tab>
            </TabList>
            <TabPanels>
              <!-- Round Results Tab -->
              <TabPanel value="round-results">
                <!-- Division Tabs (if divisions exist) -->
                <div v-if="hasDivisions" class="p-4">
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
                        <div class="space-y-6 pt-4">
                          <!-- Round Standings Section -->
                          <RoundStandingsSection
                            v-if="roundData?.round_results"
                            :round-standings="roundData.round_results"
                            :division-id="division.id"
                            :race-count="raceCount"
                          />

                          <!-- Divider -->
                          <div v-if="roundData?.round_results" class="border-t border-gray-200" />

                          <!-- Race Events Results -->
                          <RaceEventResultsSection
                            v-for="raceEvent in raceEvents"
                            :key="raceEvent.id"
                            :race-event="raceEvent"
                            :division-id="division.id"
                          />
                        </div>
                      </TabPanel>
                    </TabPanels>
                  </Tabs>
                </div>

                <!-- No Divisions: Show All Results -->
                <div v-else class="space-y-6 p-4">
                  <!-- Round Standings Section -->
                  <RoundStandingsSection
                    v-if="roundData?.round_results"
                    :round-standings="roundData.round_results"
                    :race-count="raceCount"
                  />

                  <!-- Divider -->
                  <div v-if="roundData?.round_results" class="border-t border-gray-200" />

                  <!-- Race Events Results -->
                  <RaceEventResultsSection
                    v-for="raceEvent in raceEvents"
                    :key="raceEvent.id"
                    :race-event="raceEvent"
                  />
                </div>
              </TabPanel>

              <!-- Qualifying Times Tab -->
              <TabPanel value="qualifying-times">
                <div class="p-4">
                  <CrossDivisionResultsSection
                    title="Qualifying Times - All Divisions"
                    :results="roundData?.qualifying_results ?? null"
                    :race-events="raceEvents"
                    :divisions="divisions"
                  />
                </div>
              </TabPanel>

              <!-- Race Times Tab -->
              <TabPanel value="race-times">
                <div class="p-4">
                  <CrossDivisionResultsSection
                    title="Race Times - All Divisions"
                    :results="roundData?.race_time_results ?? null"
                    :race-events="raceEvents"
                    :divisions="divisions"
                  />
                </div>
              </TabPanel>

              <!-- Fastest Laps Tab -->
              <TabPanel value="fastest-laps">
                <div class="p-4">
                  <CrossDivisionResultsSection
                    title="Fastest Laps - All Divisions"
                    :results="roundData?.fastest_lap_results ?? null"
                    :race-events="raceEvents"
                    :divisions="divisions"
                  />
                </div>
              </TabPanel>
            </TabPanels>
          </Tabs>
        </div>
      </template>
    </div>

    <template #footer>
      <div class="flex justify-end">
        <Button label="Close" severity="secondary" @click="handleClose" />
      </div>
    </template>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import Button from 'primevue/button';
import Tabs from 'primevue/tabs';
import TabList from 'primevue/tablist';
import Tab from 'primevue/tab';
import TabPanels from 'primevue/tabpanels';
import TabPanel from 'primevue/tabpanel';
import { useToast } from 'primevue/usetoast';
import { PhTrophy, PhClipboardText } from '@phosphor-icons/vue';
import BaseModal from '@app/components/common/modals/BaseModal.vue';
import RaceEventResultsSection from './RaceEventResultsSection.vue';
import RoundStandingsSection from './RoundStandingsSection.vue';
import CrossDivisionResultsSection from './CrossDivisionResultsSection.vue';
import { getRoundResults } from '@app/services/roundService';
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

// Constants
const NO_DIVISION_SELECTED = -1;

// Local state
const isLoading = ref(false);
const roundData = ref<RoundResultsResponse['round'] | null>(null);
const divisions = ref<RoundResultsResponse['divisions']>([]);
const raceEvents = ref<RaceEventResults[]>([]);
const activeDivisionId = ref<number>(NO_DIVISION_SELECTED);
const activeMainTab = ref<string>('round-results');

// Computed
const isVisible = computed({
  get: () => props.visible,
  set: (value) => emit('update:visible', value),
});

const hasDivisions = computed(() => divisions.value.length > 0);

const hasResults = computed(() => {
  return raceEvents.value.length > 0 && raceEvents.value.some((event) => event.results.length > 0);
});

const raceCount = computed(() => {
  // Count only races (not qualifiers)
  return raceEvents.value.filter((event) => !event.is_qualifier).length;
});

// Methods
async function loadResults(): Promise<void> {
  isLoading.value = true;

  try {
    const response = await getRoundResults(props.round.id);

    roundData.value = response.round;
    divisions.value = response.divisions;
    raceEvents.value = response.race_events;

    // Set initial active division - always set to first division when data loads
    if (divisions.value.length > 0) {
      activeDivisionId.value = divisions.value[0]?.id ?? NO_DIVISION_SELECTED;
    }
  } catch (error) {
    console.error('Failed to load round results:', error);

    // Show user-friendly error notification
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
}

// Watch for modal open to load data
watch(
  () => props.visible,
  async (visible) => {
    if (visible) {
      await loadResults();
    }
  },
);
</script>
