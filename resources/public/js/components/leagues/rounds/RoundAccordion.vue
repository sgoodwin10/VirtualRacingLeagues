<template>
  <VrlAccordionItem :value="value" :class="accordionClass">
    <!-- Custom header with round information -->
    <template #header="{ active }">
      <div class="flex items-center justify-between w-full">
        <div class="flex items-center gap-4">
          <!-- Round number badge -->
          <div class="round-number-badge">
            <span class="text-sm font-[family-name:var(--font-mono)] font-bold"
              >R{{ round.round_number }}</span
            >
          </div>

          <!-- Round details -->
          <div class="flex flex-col gap-1">
            <div class="flex items-center gap-2">
              <h5
                class="font-[family-name:var(--font-display)] text-base font-semibold text-[var(--text-primary)]"
              >
                {{ roundTitle }}
              </h5>
            </div>
            <div class="flex items-center text-sm text-[var(--text-secondary)] font-body gap-1">
              <PhMapPin size="16" weight="regular" />
              <span class="text-sm font-light">{{ circuitInfo }}</span>
            </div>
          </div>
        </div>

        <!-- Chevron indicator -->
        <i
          :class="[
            'ph ph-caret-down text-xl text-[var(--text-secondary)] transition-transform',
            active && 'rotate-180',
          ]"
        ></i>
      </div>
    </template>

    <!-- Accordion content with tabs -->
    <div class="md:p-4 bg-[var(--bg-dark)]">
      <!-- Loading State -->
      <div v-if="isLoading" class="flex items-center justify-center py-12">
        <i class="ph ph-circle-notch ph-spin text-4xl text-[var(--text-muted)] mr-3"></i>
        <span class="text-[var(--text-secondary)]">Loading results...</span>
      </div>

      <!-- Empty State -->
      <div v-else-if="!hasResults" class="flex flex-col items-center justify-center py-12">
        <i class="ph ph-clipboard-text text-5xl text-[var(--text-muted)] mb-3"></i>
        <p class="text-[var(--text-secondary)]">No results available for this round</p>
      </div>

      <!-- Results Content -->
      <template v-else>
        <!-- Main Content Tabs (Round Results vs Cross-Division Results) -->
        <VrlTabs
          v-model="activeMainTab"
          :tabs="mainTabs"
          class="mb-2 pl-1 md:pl-0 md:mb-6 md:ml-0 border-t md:border-t-0"
        >
          <template #tab-label="{ tab }">
            <span class="hidden md:block">{{ tab.label }}</span>
            <span class="block md:hidden">
              {{ tab.label === 'Round Results' ? 'Results' : 'Times' }}
            </span>
          </template>
        </VrlTabs>

        <!-- Round Results Tab Content -->
        <div v-if="activeMainTab === 'round-results'">
          <!-- Division Tabs (if divisions exist) -->
          <VrlTabs
            v-if="hasDivisions && divisionTabs.length > 0"
            v-model="activeDivisionKey"
            :tabs="divisionTabs"
            variant="minimal"
            class="mb-6"
          >
            <template #tab-label="{ tab }">
              <span class="hidden md:block">
                {{ tab.label }}
              </span>
              <span class="block md:hidden">
                {{
                  tab.label
                    .split(' ')
                    .map((w) => w[0])
                    .join('')
                }}
              </span>
            </template>
          </VrlTabs>

          <!-- Round Content (per division or overall) -->
          <VrlAccordion v-model="openAccordions" multiple>
            <!-- Round Standings Section -->
            <RoundStandingsTable
              v-if="hasRoundStandings"
              :standings="currentDivisionStandings"
              :has-race-points-enabled="hasRacePointsEnabled"
            />

            <!-- Race Events Results -->
            <RaceEventAccordion
              v-for="raceEvent in filteredRaceEvents"
              :key="raceEvent.id"
              :race-event="raceEvent"
              :division-id="activeDivisionId"
              :race-times-required="raceTimesRequired"
              :competition-name="props.competitionName"
              :season-name="props.seasonName"
            />
          </VrlAccordion>
        </div>

        <!-- Cross Division Times Tab Content -->
        <div v-if="activeMainTab === 'cross-division-times' && roundData">
          <CrossDivisionAllTimesTable
            :qualifying-results="roundData.qualifying_results"
            :race-time-results="roundData.race_time_results"
            :fastest-lap-results="roundData.fastest_lap_results"
            :race-events="raceEvents"
            :divisions="divisions"
            :competition-name="props.competitionName"
            :season-name="props.seasonName"
            :round-name="roundTitle"
          />
        </div>
      </template>
    </div>
  </VrlAccordionItem>
</template>

<script setup lang="ts">
import { ref, computed, watch, inject, onMounted } from 'vue';
import * as Sentry from '@sentry/vue';
import type {
  PublicRound,
  RoundStandingDriver,
  RoundStandingDivision,
  RoundResultsResponse,
  RaceEventResults,
} from '@public/types/public';
import type { TabItem } from '@public/types/navigation';
import type { AccordionContext } from '@public/components/common/accordions/types';
import VrlAccordionItem from '@public/components/common/accordions/VrlAccordionItem.vue';
import VrlAccordion from '@public/components/common/accordions/VrlAccordion.vue';
import VrlTabs from '@public/components/common/navigation/VrlTabs.vue';
import RoundStandingsTable from '@public/components/leagues/rounds/RoundStandingsTable.vue';
import RaceEventAccordion from '@public/components/leagues/rounds/RaceEventAccordion.vue';
import CrossDivisionAllTimesTable from '@public/components/leagues/rounds/CrossDivisionAllTimesTable.vue';
import { leagueService } from '@public/services/leagueService';
import { PhMapPin } from '@phosphor-icons/vue';

interface Props {
  round: PublicRound;
  hasDivisions: boolean;
  value: string;
  raceTimesRequired: boolean;
  initiallyExpanded?: boolean;
  competitionName?: string;
  seasonName?: string;
}

const props = defineProps<Props>();

// Inject accordion context to detect when this item is active
const accordion = inject<AccordionContext>('vrl-accordion');

// Compute whether this accordion item is currently active/expanded
const isActive = computed(() => {
  if (!accordion?.activeValue.value) return false;

  if (Array.isArray(accordion.activeValue.value)) {
    return accordion.activeValue.value.includes(props.value);
  }

  return accordion.activeValue.value === props.value;
});

const isLoading = ref(false);
const hasLoaded = ref(false);
const roundData = ref<RoundResultsResponse['round'] | null>(null);
const divisions = ref<RoundResultsResponse['divisions']>([]);
const raceEvents = ref<RaceEventResults[]>([]);
const activeMainTab = ref<string>('round-results');
const activeDivisionKey = ref<string>('all');
const openAccordions = ref<string[]>([]);

const roundTitle = computed(() => {
  return props.round.name || `Round ${props.round.round_number}`;
});

const circuitInfo = computed(() => {
  const parts: string[] = [];

  if (props.round.circuit_name) {
    parts.push(props.round.circuit_name);
  }

  if (props.round.track_layout) {
    parts.push(`(${props.round.track_layout})`);
  }

  if (props.round.circuit_country) {
    parts.push(`- ${props.round.circuit_country}`);
  }

  return parts.length > 0 ? parts.join(' ') : 'Circuit TBD';
});

const accordionClass = computed(() => {
  if (props.round.status === 'completed') {
    // return 'border-l-4 border-l-[var(--green)]';
  }
  if (props.round.status === 'in_progress') {
    // return 'border-l-4 border-l-[var(--yellow)]';
  }
  return '';
});

const hasResults = computed(() => {
  return raceEvents.value.length > 0 && raceEvents.value.some((event) => event.results.length > 0);
});

const hasRoundStandings = computed(() => {
  return roundData.value?.round_results !== null && roundData.value?.round_results !== undefined;
});

const hasRacePointsEnabled = computed(() => {
  return raceEvents.value.some((event) => !event.is_qualifier && event.race_points);
});

const mainTabs = computed((): TabItem[] => {
  const tabs: TabItem[] = [
    {
      key: 'round-results',
      label: 'Round Results',
    },
  ];

  if (props.raceTimesRequired) {
    tabs.push({
      key: 'cross-division-times',
      label: 'Cross Division Times',
    });
  }

  return tabs;
});

const divisionTabs = computed((): TabItem[] => {
  if (!props.hasDivisions || !hasRoundStandings.value) {
    return [];
  }

  const standings = roundData.value?.round_results?.standings ?? [];

  const firstStanding = standings[0];
  if (standings.length > 0 && firstStanding && 'division_id' in firstStanding) {
    const divisionStandings = standings as RoundStandingDivision[];

    // Create a map of division ID to order index from the divisions array
    // The divisions array is already sorted by order from the backend
    const divisionOrderMap = new Map(divisions.value.map((div, index) => [div.id, index]));

    // Sort standings by the division order from season settings
    const sortedStandings = [...divisionStandings].sort((a, b) => {
      const orderA = divisionOrderMap.get(a.division_id) ?? Number.MAX_SAFE_INTEGER;
      const orderB = divisionOrderMap.get(b.division_id) ?? Number.MAX_SAFE_INTEGER;
      return orderA - orderB;
    });

    return sortedStandings.map((div) => ({
      key: String(div.division_id),
      label: div.division_name,
    }));
  }

  return [];
});

const activeDivisionId = computed((): number | undefined => {
  if (!props.hasDivisions || divisionTabs.value.length === 0) {
    return undefined;
  }
  return parseInt(activeDivisionKey.value, 10);
});

const currentDivisionStandings = computed((): RoundStandingDriver[] => {
  if (!hasRoundStandings.value) {
    return [];
  }

  const standings = roundData.value?.round_results?.standings ?? [];

  if (!props.hasDivisions) {
    return standings as RoundStandingDriver[];
  }

  const divisions = standings as RoundStandingDivision[];
  const activeDivision = divisions.find(
    (div) => String(div.division_id) === activeDivisionKey.value,
  );

  return activeDivision ? activeDivision.results : [];
});

const filteredRaceEvents = computed((): RaceEventResults[] => {
  if (!activeDivisionId.value) {
    return raceEvents.value;
  }
  return raceEvents.value;
});

async function loadResults(): Promise<void> {
  // Don't reload if already loaded
  if (hasLoaded.value) return;

  isLoading.value = true;

  try {
    const response = await leagueService.getRoundResults(props.round.id);

    roundData.value = response.round;
    divisions.value = response.divisions;
    raceEvents.value = response.race_events;
    hasLoaded.value = true;

    if (divisions.value.length > 0 && divisions.value[0]) {
      activeDivisionKey.value = String(divisions.value[0].id);
    }
  } catch (error) {
    Sentry.captureException(error, {
      tags: { context: 'load_round_results' },
    });
  } finally {
    isLoading.value = false;
  }
}

// Watch for when this accordion becomes active (expanded)
watch(isActive, async (active) => {
  if (active && !hasLoaded.value) {
    await loadResults();
  }
});

// Handle initial load if accordion is expanded on mount
onMounted(async () => {
  // Use initiallyExpanded prop as a reliable way to know if we should load data
  // The accordion context might not be ready yet during mount
  if ((props.initiallyExpanded || isActive.value) && !hasLoaded.value) {
    await loadResults();
  }
});
</script>

<style scoped>
.round-number-badge {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  background: var(--bg-elevated);
  border: 2px solid var(--cyan);
  border-radius: var(--radius);
  color: var(--cyan);
}
</style>
