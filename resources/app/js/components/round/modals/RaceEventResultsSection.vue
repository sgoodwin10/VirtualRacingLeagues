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
                  <Tag
                    v-if="data.has_fastest_lap && !raceEvent.is_qualifier && !raceTimesRequired"
                    value="FL"
                    class="text-xs bg-purple-500 text-white"
                    :pt="{ root: { class: 'bg-purple-500 text-white border-purple-600' } }"
                  />
                  <Tag
                    v-if="data.dnf && !raceTimesRequired"
                    severity="danger"
                    value="DNF"
                    class="text-xs"
                  />
                </div>
              </template>
            </Column>

            <Column
              v-if="!raceEvent.is_qualifier && raceTimesRequired"
              field="final_race_time"
              header="Time"
              class="w-42"
            >
              <template #body="{ data }">
                <Tag v-if="data.dnf" severity="danger" value="DNF" class="text-xs" />
                <span
                  v-else
                  class="font-mono text-gray-900"
                  :class="{
                    'text-red-600 font-semibold': data.penalties && data.penalties !== '',
                  }"
                  >{{ formatRaceTime(data.final_race_time) }}</span
                >
              </template>
            </Column>

            <Column
              v-if="!raceEvent.is_qualifier && raceTimesRequired"
              field="calculated_time_diff"
              header="Gap"
              class="w-42"
            >
              <template #body="{ data }">
                <span
                  v-if="
                    (data.calculated_time_diff ??
                      data.final_race_time_difference ??
                      data.original_race_time_difference) !== null &&
                    (data.calculated_time_diff ??
                      data.final_race_time_difference ??
                      data.original_race_time_difference) !== ''
                  "
                  class="font-mono text-gray-900"
                  :class="{
                    'text-red-600 font-semibold': data.penalties && data.penalties !== '',
                  }"
                  >+{{
                    formatRaceTime(
                      data.calculated_time_diff ??
                        data.final_race_time_difference ??
                        data.original_race_time_difference,
                    )
                  }}</span
                >
              </template>
            </Column>

            <Column
              v-if="raceTimesRequired"
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
              v-if="!raceEvent.is_qualifier && raceTimesRequired"
              field="penalties"
              header="Penalties"
              class="w-42"
            >
              <template #body="{ data }">
                <div class="flex items-center gap-2">
                  <span
                    class="font-mono text-gray-900"
                    :class="{
                      'text-red-600 font-semibold': data.penalties && data.penalties !== '',
                    }"
                    >{{ formatRaceTime(data.penalties) }}</span
                  >
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
                  {{ formatPoints(data.race_points) }}
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
import { useRaceTimeCalculation } from '@app/composables/useRaceTimeCalculation';
import type { RaceEventResults, RaceResultWithDriver } from '@app/types/roundResult';
import { PhFlagCheckered, PhMedal } from '@phosphor-icons/vue';

// Extended type for results with calculated time diff
interface RaceResultWithCalculatedDiff extends RaceResultWithDriver {
  calculated_time_diff?: string | null;
}

interface Props {
  raceEvent: RaceEventResults;
  divisionId?: number;
  isRoundCompleted?: boolean;
  raceTimesRequired?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  divisionId: undefined,
  isRoundCompleted: false,
  raceTimesRequired: false, // Safer default - hide time features unless explicitly enabled
});

// Composables
const { formatRaceTime } = useTimeFormat();
const { parseTimeToMs, calculateEffectiveTime, formatMsToTime } = useRaceTimeCalculation();

// Computed
const raceEventTitle = computed(() => {
  if (props.raceEvent.is_qualifier) {
    return props.raceEvent.name || 'Qualifying';
  }
  return props.raceEvent.name || `Race ${props.raceEvent.race_number}`;
});

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

const filteredResults = computed<RaceResultWithCalculatedDiff[]>(() => {
  let results = props.raceEvent.results;

  // Filter by division if provided
  results = filterByDivision(results, props.divisionId);

  // For races (not qualifying), calculate time differences dynamically
  if (!props.raceEvent.is_qualifier && props.raceTimesRequired && results.length > 0) {
    // Separate non-DNF results (those with valid race times)
    const nonDnfResults = results.filter(
      (r) => !r.dnf && r.original_race_time !== null && r.original_race_time !== '',
    );

    // Sort non-DNF results by effective time (original_race_time + penalties)
    const sortedNonDnf = [...nonDnfResults].sort((a, b) => {
      const effectiveA = calculateEffectiveTime(
        parseTimeToMs(a.original_race_time),
        parseTimeToMs(a.penalties),
      );
      const effectiveB = calculateEffectiveTime(
        parseTimeToMs(b.original_race_time),
        parseTimeToMs(b.penalties),
      );
      if (effectiveA === null && effectiveB === null) return 0;
      if (effectiveA === null) return 1;
      if (effectiveB === null) return -1;
      return effectiveA - effectiveB;
    });

    // Find position 1 driver (first in sorted list)
    const position1Driver = sortedNonDnf[0];

    if (position1Driver) {
      // Calculate position 1's effective time
      const position1RaceTimeMs = parseTimeToMs(position1Driver.original_race_time);
      const position1PenaltiesMs = parseTimeToMs(position1Driver.penalties);
      const position1EffectiveTimeMs = calculateEffectiveTime(
        position1RaceTimeMs,
        position1PenaltiesMs,
      );

      // Calculate time differences for all drivers
      return results.map((result): RaceResultWithCalculatedDiff => {
        // DNF drivers have no time difference
        if (result.dnf) {
          return {
            ...result,
            calculated_time_diff: null,
          };
        }

        // Driver without valid race time has no time difference
        if (result.original_race_time === null || result.original_race_time === '') {
          return {
            ...result,
            calculated_time_diff: null,
          };
        }

        // Position 1 driver (same as position1Driver) has no time difference
        if (result.id === position1Driver.id) {
          return {
            ...result,
            calculated_time_diff: null,
          };
        }

        // Calculate time difference for other drivers
        const driverRaceTimeMs = parseTimeToMs(result.original_race_time);
        const driverPenaltiesMs = parseTimeToMs(result.penalties);
        const driverEffectiveTimeMs = calculateEffectiveTime(driverRaceTimeMs, driverPenaltiesMs);

        let calculatedTimeDiff: string | null = null;
        if (position1EffectiveTimeMs !== null && driverEffectiveTimeMs !== null) {
          const timeDiffMs = driverEffectiveTimeMs - position1EffectiveTimeMs;
          calculatedTimeDiff = formatMsToTime(timeDiffMs);
        }

        return {
          ...result,
          calculated_time_diff: calculatedTimeDiff,
        };
      });
    }
  }

  // Return results without calculated diff for qualifying or when no valid results
  return results.map((result) => ({
    ...result,
    calculated_time_diff: null,
  }));
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

// Format points to show up to 2 decimal places (removes trailing zeros)
function formatPoints(points: number): string {
  // If it's a whole number, show it without decimals
  if (Number.isInteger(points)) {
    return points.toString();
  }
  // Otherwise, show up to 2 decimal places and remove trailing zeros
  return parseFloat(points.toFixed(2)).toString();
}
</script>
