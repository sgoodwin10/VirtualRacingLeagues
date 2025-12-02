<template>
  <Accordion value="0" class="bg-white border border-slate-200 rounded">
    <AccordionPanel value="0">
      <AccordionHeader class="bg-gray-50 px-4 py-3 border-b border-gray-200">
        <div class="flex items-center gap-2">
          <PhTrophy :size="20" class="text-amber-600" />
          <h3 class="font-semibold text-gray-900">Round Standings</h3>
        </div>
      </AccordionHeader>
      <AccordionContent>
        <!-- Standings Table -->
        <div class="overflow-x-auto">
          <DataTable :value="displayStandings" :rows="50" :row-class="getRowClass" class="">
            <Column field="position" header="#" class="w-16">
              <template #body="{ data }">
                <div class="text-center font-bold">
                  {{ data.position }}
                </div>
              </template>
            </Column>

            <Column field="driver_name" header="Driver" class="min-w-[170px]">
              <template #body="{ data }">
                <span class="font-medium text-gray-900">{{ data.driver_name }}</span>
              </template>
            </Column>

            <Column
              v-if="showTotalRacePoints"
              field="race_points"
              header="Total Race Points"
              class="w-32"
            >
              <template #body="{ data }">
                <div class="text-center text-gray-900">
                  {{ data.race_points ?? '' }}
                </div>
              </template>
            </Column>

            <Column field="fastest_lap_points" header="Fastest Lap" class="w-32">
              <template #body="{ data }">
                <div v-if="data.fastest_lap_points" class="flex items-center justify-center gap-2">
                  <PhLightning :size="16" weight="fill" class="text-purple-500" />
                  <span class="text-gray-900">{{ data.fastest_lap_points }}</span>
                </div>
              </template>
            </Column>

            <Column field="pole_position_points" header="Pole Position" class="w-32">
              <template #body="{ data }">
                <div
                  v-if="data.pole_position_points"
                  class="flex items-center justify-center gap-2 text-purple-500 font-bold"
                >
                  <PhMedal :size="16" weight="fill" class="text-purple-500" />
                  <span class="text-gray-900">{{ data.pole_position_points }}</span>
                </div>
              </template>
            </Column>

            <Column field="total_positions_gained" header="+/-" class="w-24">
              <template #body="{ data }">
                <div class="text-center font-semibold" :class="getPositionsGainedClass(data)">
                  {{ formatPositionsGained(data.total_positions_gained) }}
                </div>
              </template>
            </Column>

            <Column field="total_points" header="Final Points" class="w-32">
              <template #body="{ data }">
                <div class="text-center font-bold text-gray-900">
                  {{ data.total_points ?? '' }}
                </div>
              </template>
            </Column>

            <template #empty>
              <div class="text-center py-6 text-gray-500">No standings data available</div>
            </template>
          </DataTable>
        </div>
      </AccordionContent>
    </AccordionPanel>
  </Accordion>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import Accordion from 'primevue/accordion';
import AccordionPanel from 'primevue/accordionpanel';
import AccordionHeader from 'primevue/accordionheader';
import AccordionContent from 'primevue/accordioncontent';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import { PhTrophy, PhLightning, PhMedal } from '@phosphor-icons/vue';
import { getPodiumRowClass } from '@app/constants/podiumColors';
import type {
  RoundStandings,
  RoundStandingDriver,
  RoundStandingDivision,
} from '@app/types/roundResult';

interface Props {
  roundStandings: RoundStandings | null;
  divisionId?: number;
  hasRacePointsEnabled?: boolean;
}

const props = defineProps<Props>();

/**
 * Type guard to check if standings contain division data
 * @param standings - The standings array to check
 * @returns true if standings contain RoundStandingDivision objects
 */
function isDivisionStandings(
  standings: (RoundStandingDriver | RoundStandingDivision)[],
): standings is RoundStandingDivision[] {
  if (standings.length === 0) return false;
  const firstItem = standings[0];
  // Runtime type check: divisions have division_id property and results array
  return (
    firstItem !== null &&
    typeof firstItem === 'object' &&
    'division_id' in firstItem &&
    'results' in firstItem &&
    Array.isArray((firstItem as RoundStandingDivision).results)
  );
}

// Computed
const showTotalRacePoints = computed(() => {
  // Only show Total Race Points column if any race in the round has race_points enabled
  return props.hasRacePointsEnabled ?? false;
});

const displayStandings = computed<RoundStandingDriver[]>(() => {
  if (!props.roundStandings?.standings || props.roundStandings.standings.length === 0) {
    return [];
  }

  const standings = props.roundStandings.standings;
  let results: RoundStandingDriver[];

  // Use type guard to determine structure
  if (isDivisionStandings(standings)) {
    // Divisions exist - filter by active division
    const divisionStanding = standings.find((div) => div.division_id === props.divisionId);
    results = divisionStanding?.results || [];
  } else {
    // No divisions - return all standings (already RoundStandingDriver[])
    results = standings;
  }

  // Return all drivers - the backend already includes only drivers with race results
  // This includes drivers with 0 points (e.g., last place, DNF) who still participated
  return results;
});

// Row class for podium positions
function getRowClass(data: RoundStandingDriver): string {
  return getPodiumRowClass(data.position);
}

// Format positions gained/lost
function formatPositionsGained(value: number): string {
  if (value === 0) {
    return '0';
  }
  if (value > 0) {
    return `+${value}`;
  }
  return value.toString();
}

// Get CSS class for positions gained/lost
function getPositionsGainedClass(data: RoundStandingDriver): string {
  if (data.total_positions_gained === 0) {
    return 'text-gray-600';
  }
  if (data.total_positions_gained > 0) {
    return 'text-green-600';
  }
  return 'text-red-600';
}
</script>
