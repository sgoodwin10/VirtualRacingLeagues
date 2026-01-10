<template>
  <TechnicalAccordion model-value="standings">
    <TechnicalAccordionPanel value="standings">
      <TechnicalAccordionHeader
        title="Round Standings"
        :subtitle="standingsSummary"
        :icon="PhTrophy"
        icon-variant="orange"
        padding="xs"
      />
      <TechnicalAccordionContent padding="none">
        <!-- Standings Table -->
        <div class="overflow-x-auto">
          <TechDataTable
            :value="displayStandings"
            :rows="50"
            :podium-highlight="true"
            position-field="position"
          >
            <Column
              field="position"
              header="#"
              class="w-16"
              :pt="{
                headerCell: { style: { borderRight: '1px solid var(--border)' } },
                bodyCell: { style: { borderRight: '1px solid var(--border)' } },
              }"
            >
              <template #body="{ data }">
                <PositionCell :position="data.position" />
              </template>
            </Column>

            <Column
              field="driver_name"
              header="Driver"
              class="min-w-[170px]"
              :pt="{
                headerCell: { style: { borderRight: '1px solid var(--border)' } },
                bodyCell: { style: { borderRight: '1px solid var(--border)' } },
              }"
            >
              <template #body="{ data }">
                <span class="font-medium text-primary">{{ data.driver_name }}</span>
              </template>
            </Column>

            <Column
              v-if="showTotalRacePoints"
              field="race_points"
              header="Total Race Points"
              class="w-32"
              :pt="{
                headerCell: { style: { borderRight: '1px solid var(--border)' } },
                bodyCell: { style: { borderRight: '1px solid var(--border)' } },
              }"
            >
              <template #body="{ data }">
                <PointsCell :points="data.race_points" />
              </template>
            </Column>

            <Column
              field="fastest_lap_points"
              header="Fastest Lap"
              class="w-32"
              :pt="{
                headerCell: { style: { borderRight: '1px solid var(--border)' } },
                bodyCell: { style: { borderRight: '1px solid var(--border)' } },
              }"
            >
              <template #body="{ data }">
                <div v-if="data.fastest_lap_points" class="flex items-center justify-center gap-2">
                  <PhLightning :size="16" weight="fill" class="text-purple-500" />
                  <span class="text-primary">{{ data.fastest_lap_points }}</span>
                </div>
              </template>
            </Column>

            <Column
              field="pole_position_points"
              header="Pole Position"
              class="w-32"
              :pt="{
                headerCell: { style: { borderRight: '1px solid var(--border)' } },
                bodyCell: { style: { borderRight: '1px solid var(--border)' } },
              }"
            >
              <template #body="{ data }">
                <div
                  v-if="data.pole_position_points"
                  class="flex items-center justify-center gap-2 text-purple-500 font-bold"
                >
                  <PhMedal :size="16" weight="fill" class="text-purple-500" />
                  <span class="text-primary">{{ data.pole_position_points }}</span>
                </div>
              </template>
            </Column>

            <Column
              field="total_positions_gained"
              header="+/-"
              class="w-24"
              :pt="{
                headerCell: {
                  style: { borderRight: '1px solid var(--border)', textAlign: 'center' },
                },
                bodyCell: { style: { borderRight: '1px solid var(--border)' } },
              }"
            >
              <template #body="{ data }">
                <div class="text-center font-semibold" :class="getPositionsGainedClass(data)">
                  {{ formatPositionsGained(data.total_positions_gained) }}
                </div>
              </template>
            </Column>

            <Column
              field="total_points"
              header="Final Points"
              class="w-32"
              :pt="{
                headerCell: { style: { borderRight: '1px solid var(--border)' } },
                bodyCell: {
                  style: { borderRight: '1px solid var(--border)', textAlign: 'center' },
                },
              }"
            >
              <template #body="{ data }">
                <PointsCell :points="data.total_points" bold />
              </template>
            </Column>

            <template #empty>
              <div class="text-center py-6 text-gray-500">No standings data available</div>
            </template>
          </TechDataTable>
        </div>
      </TechnicalAccordionContent>
    </TechnicalAccordionPanel>
  </TechnicalAccordion>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import {
  TechnicalAccordion,
  TechnicalAccordionPanel,
  TechnicalAccordionHeader,
  TechnicalAccordionContent,
} from '@app/components/common/accordions';
import Column from 'primevue/column';
import { PhTrophy, PhLightning, PhMedal } from '@phosphor-icons/vue';
import { TechDataTable, PositionCell, PointsCell } from '@app/components/common/tables';
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

const standingsSummary = computed(() => {
  if (!props.roundStandings?.standings || props.roundStandings.standings.length === 0) {
    return 'No standings data';
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

  if (results.length === 0) return 'No standings data';

  const leader = results[0];
  return leader ? `Winner: ${leader.driver_name}` : 'No standings data';
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
    return 'text-gray-400';
  }
  if (data.total_positions_gained > 0) {
    return 'text-green-600';
  }
  return 'text-red-600';
}
</script>
