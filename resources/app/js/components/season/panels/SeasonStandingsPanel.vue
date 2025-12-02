<template>
  <BasePanel>
    <template #header>
      <PanelHeader
        :icon="PhTrophy"
        :icon-size="20"
        icon-class="text-amber-600"
        title="Season Standings"
        description="Championship points and driver rankings across all rounds"
        gradient="from-amber-50 to-yellow-50"
      />
    </template>

    <!-- Loading State -->
    <div v-if="isLoading" class="p-8 flex items-center justify-center">
      <i class="pi pi-spin pi-spinner text-4xl text-gray-400"></i>
    </div>

    <!-- Error State -->
    <Message v-else-if="error" severity="error" class="m-4">{{ error }}</Message>

    <!-- Empty State -->
    <div v-else-if="!standingsData || standingsData.standings.length === 0" class="p-8">
      <Message severity="info">No standings data available yet.</Message>
    </div>

    <!-- Standings Content -->
    <div v-else class="p-4 overflow-x-auto">
      <!-- Divisions: TabView -->
      <Tabs
        v-if="standingsData.has_divisions && divisionsWithStandings.length > 0"
        v-model:value="activeDivisionId"
      >
        <TabList>
          <Tab
            v-for="division in divisionsWithStandings"
            :key="division.division_id"
            :value="division.division_id"
          >
            {{ division.division_name }}
          </Tab>
        </TabList>

        <TabPanels>
          <TabPanel
            v-for="division in divisionsWithStandings"
            :key="division.division_id"
            :value="division.division_id"
          >
            <StandingsTable
              :drivers="division.drivers"
              :rounds="getRoundNumbers(division.drivers)"
            />
          </TabPanel>
        </TabPanels>
      </Tabs>

      <!-- No Divisions: Single Table -->
      <StandingsTable
        v-else
        :drivers="flatDriverStandings"
        :rounds="getRoundNumbers(flatDriverStandings)"
      />
    </div>
  </BasePanel>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, h, defineComponent } from 'vue';
import type { PropType } from 'vue';
import { PhTrophy, PhCheck } from '@phosphor-icons/vue';
import BasePanel from '@app/components/common/panels/BasePanel.vue';
import PanelHeader from '@app/components/common/panels/PanelHeader.vue';
import Message from 'primevue/message';
import Tabs from 'primevue/tabs';
import TabList from 'primevue/tablist';
import Tab from 'primevue/tab';
import TabPanels from 'primevue/tabpanels';
import TabPanel from 'primevue/tabpanel';
import { getSeasonStandings } from '@app/services/seasonService';
import { getPodiumRowClass } from '@app/constants/podiumColors';
import type {
  SeasonStandingsResponse,
  SeasonStandingDriver,
  SeasonStandingDivision,
  RoundPoints,
} from '@app/types/seasonStandings';
import { isDivisionStandings } from '@app/types/seasonStandings';

interface Props {
  seasonId: number;
}

const props = defineProps<Props>();

const isLoading = ref(false);
const error = ref<string | null>(null);
const standingsData = ref<SeasonStandingsResponse | null>(null);
const activeDivisionId = ref<number>(0);

/**
 * Get divisions with standings (only when divisions enabled)
 */
const divisionsWithStandings = computed<readonly SeasonStandingDivision[]>(() => {
  if (!standingsData.value) {
    return [];
  }

  if (isDivisionStandings(standingsData.value)) {
    return standingsData.value.standings;
  }

  return [];
});

/**
 * Get flat driver standings (only when divisions disabled)
 */
const flatDriverStandings = computed<readonly SeasonStandingDriver[]>(() => {
  if (!standingsData.value) {
    return [];
  }

  if (!isDivisionStandings(standingsData.value)) {
    return standingsData.value.standings;
  }

  return [];
});

/**
 * Extract unique round numbers from drivers array
 */
function getRoundNumbers(drivers: readonly SeasonStandingDriver[]): number[] {
  if (!drivers || drivers.length === 0) {
    return [];
  }

  const firstDriver = drivers[0];
  if (firstDriver && firstDriver.rounds && firstDriver.rounds.length > 0) {
    return firstDriver.rounds.map((r) => r.round_number).sort((a, b) => a - b);
  }

  return [];
}

/**
 * Fetch season standings from API
 */
async function fetchStandings(): Promise<void> {
  isLoading.value = true;
  error.value = null;

  try {
    standingsData.value = await getSeasonStandings(props.seasonId);

    // Set initial active division if divisions exist
    if (standingsData.value.has_divisions && divisionsWithStandings.value.length > 0) {
      const firstDivision = divisionsWithStandings.value[0];
      if (firstDivision) {
        activeDivisionId.value = firstDivision.division_id;
      }
    }
  } catch (err) {
    console.error('Failed to fetch season standings:', err);
    error.value = 'Failed to load season standings';
  } finally {
    isLoading.value = false;
  }
}

onMounted(() => {
  fetchStandings();
});

/**
 * StandingsTable - Internal component for rendering the standings table
 */
const StandingsTable = defineComponent({
  name: 'StandingsTable',
  props: {
    drivers: {
      type: Array as PropType<readonly SeasonStandingDriver[]>,
      required: true,
    },
    rounds: {
      type: Array as PropType<readonly number[]>,
      required: true,
    },
  },
  setup(tableProps) {
    /**
     * Get round data for a driver
     */
    function getRoundData(driver: SeasonStandingDriver, roundNumber: number): RoundPoints | null {
      return driver.rounds.find((r) => r.round_number === roundNumber) ?? null;
    }

    return () =>
      h('div', { class: 'overflow-x-auto' }, [
        h('table', { class: 'w-full text-sm border-collapse' }, [
          // Header
          h('thead', {}, [
            // Main header row with round group headers
            h('tr', { class: 'bg-gray-50 border-b border-gray-200' }, [
              h(
                'th',
                {
                  class: 'px-3 py-2 text-center font-semibold text-gray-700 w-12',
                  rowspan: 2,
                },
                '#',
              ),
              h(
                'th',
                {
                  class:
                    'px-3 py-2 text-left font-semibold text-gray-700 min-w-[160px] border-r border-gray-200',
                  rowspan: 2,
                },
                'Driver',
              ),
              ...tableProps.rounds.map((roundNum) =>
                h(
                  'th',
                  {
                    class:
                      'px-1 py-1 text-center font-semibold text-gray-700 border-r border-gray-200',
                    colspan: 3,
                  },
                  `R${roundNum}`,
                ),
              ),
              h(
                'th',
                {
                  class: 'w-16 px-3 py-2 text-center font-bold text-gray-900 bg-gray-100',
                  rowspan: 2,
                },
                'Total',
              ),
            ]),
            // Sub-header row for P, FL, Pts
            h('tr', { class: 'bg-gray-50 border-b border-gray-300' }, [
              ...tableProps.rounds.flatMap((roundNum) => [
                h(
                  'th',
                  {
                    key: `${roundNum}-p`,
                    class: 'px-1 py-1 text-center text-xs text-gray-500 w-8',
                    title: 'Pole Position',
                  },
                  'P',
                ),
                h(
                  'th',
                  {
                    key: `${roundNum}-fl`,
                    class: 'px-1 py-1 text-center text-xs text-gray-500 w-8',
                    title: 'Fastest Lap',
                  },
                  'FL',
                ),
                h(
                  'th',
                  {
                    key: `${roundNum}-pts`,
                    class:
                      'px-1 py-1 text-center text-xs text-gray-500 w-10 border-r border-gray-200',
                    title: 'Points',
                  },
                  'Pts',
                ),
              ]),
            ]),
          ]),
          // Body
          h(
            'tbody',
            {},
            tableProps.drivers.map((driver) =>
              h(
                'tr',
                {
                  key: driver.driver_id,
                  class: [getPodiumRowClass(driver.position), 'border-b border-gray-100'],
                },
                [
                  // Position
                  h('td', { class: 'px-3 py-2 text-center font-bold' }, driver.position),
                  // Driver name
                  h(
                    'td',
                    { class: 'px-3 py-2 font-medium text-gray-900 border-r border-gray-200' },
                    driver.driver_name,
                  ),
                  // Round columns (P, FL, Pts for each round)
                  ...tableProps.rounds.flatMap((roundNum) => {
                    const roundData = getRoundData(driver, roundNum);
                    return [
                      // Pole Position
                      h(
                        'td',
                        {
                          key: `${driver.driver_id}-${roundNum}-p`,
                          class: 'px-1 py-2 text-center',
                        },
                        roundData?.has_pole
                          ? h(PhCheck, {
                              size: 14,
                              weight: 'bold',
                              class: 'inline text-purple-600',
                            })
                          : h('span', { class: 'text-gray-300' }, '-'),
                      ),
                      // Fastest Lap
                      h(
                        'td',
                        {
                          key: `${driver.driver_id}-${roundNum}-fl`,
                          class: 'px-1 py-2 text-center',
                        },
                        roundData?.has_fastest_lap
                          ? h(PhCheck, {
                              size: 14,
                              weight: 'bold',
                              class: 'inline text-fuchsia-600',
                            })
                          : h('span', { class: 'text-gray-300' }, '-'),
                      ),
                      // Points
                      h(
                        'td',
                        {
                          key: `${driver.driver_id}-${roundNum}-pts`,
                          class: 'px-1 py-2 text-center text-gray-700 border-r border-gray-200',
                        },
                        roundData?.points ?? 0,
                      ),
                    ];
                  }),
                  // Total points
                  h(
                    'td',
                    {
                      class:
                        'w-16 px-3 py-2 text-center font-bold text-lg text-gray-900 bg-gray-50',
                    },
                    driver.total_points,
                  ),
                ],
              ),
            ),
          ),
        ]),
      ]);
  },
});
</script>
