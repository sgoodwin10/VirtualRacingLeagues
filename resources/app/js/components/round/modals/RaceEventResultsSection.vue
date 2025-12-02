<template>
  <Accordion class="bg-white border border-slate-200 rounded">
    <AccordionPanel value="0">
      <AccordionHeader class="bg-gray-50 px-4 py-3 border-b border-gray-200">
        <div class="flex items-center gap-2 w-full">
          <PhMedal v-if="raceEvent.is_qualifier" :size="20" weight="fill" class="text-purple-500" />
          <PhFlagCheckered v-else :size="20" weight="fill" class="text-slate-600" />
          <h3 class="font-semibold text-gray-900">
            {{ raceEventTitle }}
          </h3>
        </div>
      </AccordionHeader>
      <AccordionContent>
        <!-- Results Table -->
        <div class="overflow-x-auto">
          <DataTable :value="filteredResults" :rows="50" :row-class="getRowClass" class="">
            <Column field="position" header="#" class="w-16">
              <template #body="{ data }">
                <div class="text-center font-medium">
                  {{ data.position }}
                </div>
              </template>
            </Column>

            <Column field="driver.name" header="Driver" class="min-w-[170px]">
              <template #body="{ data }">
                <div class="flex items-center gap-2">
                  <span class="font-medium text-gray-900">{{
                    data.driver?.name || 'Unknown'
                  }}</span>
                  <Tag
                    v-if="data.has_pole && raceEvent.is_qualifier"
                    value="P"
                    class="text-xs bg-purple-200 text-purple-800"
                    :pt="{ root: { class: 'bg-purple-200 text-purple-800 border-purple-300' } }"
                  />
                </div>
              </template>
            </Column>

            <Column v-if="!raceEvent.is_qualifier" field="race_time" header="Time" class="w-42">
              <template #body="{ data }">
                <Tag v-if="data.dnf" severity="danger" value="DNF" class="text-xs" />
                <span v-else class="font-mono text-gray-900">{{
                  formatRaceTime(data.race_time)
                }}</span>
              </template>
            </Column>

            <Column
              v-if="!raceEvent.is_qualifier"
              field="race_time_difference"
              header="Gap"
              class="w-42"
            >
              <template #body="{ data }">
                <span
                  v-if="data.race_time_difference !== null && data.race_time_difference !== ''"
                  class="font-mono text-gray-600"
                  >+{{ formatRaceTime(data.race_time_difference) }}</span
                >
              </template>
            </Column>

            <Column
              field="fastest_lap"
              :header="raceEvent.is_qualifier ? 'Lap Time' : 'Fastest Lap'"
              class="w-42"
            >
              <template #body="{ data }">
                <div class="flex items-center gap-2">
                  <span
                    class="font-mono"
                    :class="{
                      'text-purple-600': data.has_pole || data.has_fastest_lap,
                      'text-gray-900': !data.has_fastest_lap || raceEvent.is_qualifier,
                    }"
                  >
                    {{ formatRaceTime(data.fastest_lap) }}
                  </span>
                  <Tag
                    v-if="data.has_fastest_lap && !raceEvent.is_qualifier"
                    value="FL"
                    class="text-xs bg-purple-500 text-white"
                    :pt="{ root: { class: 'bg-purple-500 text-white border-purple-600' } }"
                  />
                </div>
              </template>
            </Column>

            <Column
              v-if="!raceEvent.is_qualifier"
              field="penalties"
              header="Penalties"
              class="w-42"
            >
              <template #body="{ data }">
                <div class="flex items-center gap-2">
                  <span class="font-mono text-gray-900">{{ formatRaceTime(data.penalties) }}</span>
                </div>
              </template>
            </Column>

            <Column
              v-if="!raceEvent.is_qualifier"
              field="positions_gained"
              header="+/-"
              class="w-24"
            >
              <template #body="{ data }">
                <div class="text-center font-semibold" :class="getPositionsGainedClass(data)">
                  {{ formatPositionsGained(data.positions_gained) }}
                </div>
              </template>
            </Column>

            <Column v-if="raceEvent.race_points" field="race_points" header="Points" class="w-24">
              <template #body="{ data }">
                <div class="text-center font-semibold text-gray-900">
                  {{ data.race_points }}
                </div>
              </template>
            </Column>

            <template #empty>
              <div class="text-center py-6 text-gray-500">
                No results recorded for this
                {{ raceEvent.is_qualifier ? 'qualifying session' : 'race' }}
              </div>
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
import Tag from 'primevue/tag';
import { getPodiumRowClass } from '@app/constants/podiumColors';
import { useTimeFormat } from '@app/composables/useTimeFormat';
import type { RaceEventResults, RaceResultWithDriver } from '@app/types/roundResult';
import { PhFlagCheckered, PhMedal } from '@phosphor-icons/vue';

interface Props {
  raceEvent: RaceEventResults;
  divisionId?: number;
  isRoundCompleted?: boolean;
}

const props = defineProps<Props>();

// Composables
const { formatRaceTime } = useTimeFormat();

// Computed
const raceEventTitle = computed(() => {
  if (props.raceEvent.is_qualifier) {
    return props.raceEvent.name || 'Qualifying';
  }
  return props.raceEvent.name || `Race ${props.raceEvent.race_number}`;
});

/**
 * Check if a qualifying result is valid (has lap time)
 * Note: Qualifying only requires fastest_lap to be valid, as it's the primary
 * timing metric for qualification. Unlike races, qualifying has no DNF status,
 * race_time, or penalties to validate.
 */
function isValidQualifyingResult(result: RaceResultWithDriver): boolean {
  return result.fastest_lap !== null && result.fastest_lap !== '';
}

/**
 * Check if a race result is valid (has time, DNF, or fastest lap)
 * Note: Race results require at least one meaningful field populated. A result
 * is valid if it has any of: race_time (finish time), dnf (did not finish status),
 * or fastest_lap (lap time). This is more permissive than qualifying because
 * races have multiple ways to record results.
 */
function isValidRaceResult(result: RaceResultWithDriver): boolean {
  return (
    (result.race_time !== null && result.race_time !== '') ||
    result.dnf === true ||
    (result.fastest_lap !== null && result.fastest_lap !== '')
  );
}

/**
 * Filter results by division (if divisionId provided)
 */
function filterByDivision(
  results: RaceResultWithDriver[],
  divisionId: number | undefined,
): RaceResultWithDriver[] {
  if (divisionId === undefined) {
    return results;
  }
  return results.filter((result) => result.division_id === divisionId);
}

/**
 * Filter out invalid results (only when round is completed)
 */
function filterValidResults(
  results: RaceResultWithDriver[],
  isQualifying: boolean,
  isRoundCompleted: boolean,
): RaceResultWithDriver[] {
  if (!isRoundCompleted) {
    return results;
  }

  return results.filter((result) => {
    if (isQualifying) {
      return isValidQualifyingResult(result);
    } else {
      return isValidRaceResult(result);
    }
  });
}

const filteredResults = computed<RaceResultWithDriver[]>(() => {
  let results = props.raceEvent.results;

  // Filter by division if provided
  results = filterByDivision(results, props.divisionId);

  // Filter out invalid results when round is completed
  results = filterValidResults(results, props.raceEvent.is_qualifier, props.isRoundCompleted);

  return results;
});

// Row class for podium positions (only for races, not qualifying)
function getRowClass(data: RaceResultWithDriver): string {
  if (props.raceEvent.is_qualifier) {
    return '';
  }

  return getPodiumRowClass(data.position);
}

// Format positions gained/lost
function formatPositionsGained(value: number | null): string {
  if (value === null) {
    return '-';
  }
  if (value === 0) {
    return '0';
  }
  if (value > 0) {
    return `+${value}`;
  }
  return value.toString();
}

// Get CSS class for positions gained/lost
function getPositionsGainedClass(data: RaceResultWithDriver): string {
  if (data.positions_gained === null || data.positions_gained === 0) {
    return 'text-gray-600';
  }
  if (data.positions_gained > 0) {
    return 'text-green-600';
  }
  return 'text-red-600';
}
</script>
