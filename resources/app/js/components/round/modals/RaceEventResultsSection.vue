<template>
  <TechnicalAccordion :model-value="['results']">
    <TechnicalAccordionPanel value="results">
      <TechnicalAccordionHeader
        :title="raceEventTitle"
        :subtitle="getResultsSummary()"
        :icon="raceEvent.is_qualifier ? PhMedal : PhFlagCheckered"
        :icon-variant="raceEvent.is_qualifier ? 'purple' : 'cyan'"
        padding="xs"
      />
      <TechnicalAccordionContent padding="none">
        <!-- Results Table -->
        <div class="overflow-x-auto">
          <TechDataTable
            :value="filteredResults"
            :rows="50"
            :podium-highlight="!raceEvent.is_qualifier"
            position-field="position"
          >
            <!-- Position Column -->
            <Column field="position" header="#" class="w-16">
              <template #body="{ data }">
                <PositionCell :position="data.position" />
              </template>
            </Column>

            <!-- Driver Column -->
            <Column field="driver.name" header="Driver" class="min-w-[170px]">
              <template #body="{ data }">
                <div class="flex items-center gap-2">
                  <span class="font-medium text-primary">{{ data.driver?.name || 'Unknown' }}</span>
                  <Tag
                    v-if="data.has_pole && raceEvent.is_qualifier"
                    value="P"
                    class="text-xs"
                    :pt="{
                      root: {
                        style: {
                          backgroundColor: 'var(--purple-dim)',
                          color: 'var(--purple)',
                          border: '1px solid var(--purple)',
                          fontSize: '10px',
                          padding: '2px 6px',
                        },
                      },
                    }"
                  />
                  <Tag
                    v-if="data.has_fastest_lap && !raceEvent.is_qualifier && !raceTimesRequired"
                    value="FL"
                    class="text-xs"
                    :pt="{
                      root: {
                        style: {
                          backgroundColor: 'var(--purple)',
                          color: 'var(--bg-dark)',
                          border: '1px solid var(--purple)',
                          fontSize: '10px',
                          padding: '2px 6px',
                        },
                      },
                    }"
                  />
                  <Tag
                    v-if="data.dnf && !raceTimesRequired"
                    value="DNF"
                    severity="danger"
                    class="text-xs"
                  />
                </div>
              </template>
            </Column>

            <!-- Time Column -->
            <Column
              v-if="!raceEvent.is_qualifier && raceTimesRequired"
              field="final_race_time"
              header="Time"
              class="w-42"
            >
              <template #body="{ data }">
                <div
                  class="text-center"
                  :class="{
                    'text-red-600 font-semibold': data.penalties && data.penalties !== '',
                    'text-secondary': !data.penalties || data.penalties === '',
                  }"
                >
                  <Tag v-if="data.dnf" value="DNF" severity="danger" class="text-xs" />
                  <span v-else>{{ formatRaceTime(data.final_race_time) }}</span>
                </div>
              </template>
            </Column>

            <!-- Gap Column -->
            <Column
              v-if="!raceEvent.is_qualifier && raceTimesRequired"
              field="calculated_time_diff"
              header="Gap"
              class="w-42"
            >
              <template #body="{ data }">
                <div
                  class="text-center"
                  :class="{
                    'text-red-600 font-semibold': data.penalties && data.penalties !== '',
                    'text-secondary': !data.penalties || data.penalties === '',
                  }"
                >
                  <span
                    v-if="
                      (data.calculated_time_diff ??
                        data.final_race_time_difference ??
                        data.original_race_time_difference) !== null &&
                      (data.calculated_time_diff ??
                        data.final_race_time_difference ??
                        data.original_race_time_difference) !== ''
                    "
                  >
                    +{{
                      formatRaceTime(
                        data.calculated_time_diff ??
                          data.final_race_time_difference ??
                          data.original_race_time_difference,
                      )
                    }}
                  </span>
                </div>
              </template>
            </Column>

            <!-- Fastest Lap / Lap Time Column -->
            <Column v-if="raceTimesRequired" field="fastest_lap" class="w-42">
              <template #header>
                <span>{{ raceEvent.is_qualifier ? 'Lap Time' : 'Fastest Lap' }}</span>
              </template>
              <template #body="{ data }">
                <div
                  class="flex items-center justify-center gap-2"
                  :class="{
                    'text-purple-500': data.has_pole || data.has_fastest_lap,
                    'text-secondary': !data.has_pole && !data.has_fastest_lap,
                  }"
                >
                  <span>{{ formatRaceTime(data.fastest_lap) }}</span>
                  <Tag
                    v-if="data.has_fastest_lap && !raceEvent.is_qualifier"
                    value="FL"
                    class="text-xs"
                    :pt="{
                      root: {
                        style: {
                          backgroundColor: 'var(--purple)',
                          color: 'var(--bg-dark)',
                          border: '1px solid var(--purple)',
                          fontSize: '10px',
                          padding: '2px 6px',
                        },
                      },
                    }"
                  />
                </div>
              </template>
            </Column>

            <!-- Penalties Column -->
            <Column
              v-if="!raceEvent.is_qualifier && raceTimesRequired"
              field="penalties"
              header="Penalties"
              class="w-42"
            >
              <template #body="{ data }">
                <div
                  class="text-center"
                  :class="{
                    'text-red-600 font-semibold': data.penalties && data.penalties !== '',
                    'text-secondary': !data.penalties || data.penalties === '',
                  }"
                >
                  {{ formatRaceTime(data.penalties) }}
                </div>
              </template>
            </Column>

            <!-- Positions Gained Column -->
            <Column
              v-if="!raceEvent.is_qualifier"
              field="positions_gained"
              header="+/-"
              class="w-24"
            >
              <template #body="{ data }">
                <div
                  class="text-center font-semibold"
                  :class="{
                    'text-green-600': data.positions_gained > 0,
                    'text-red-600': data.positions_gained < 0,
                    'text-secondary': data.positions_gained === 0 || data.positions_gained === null,
                  }"
                >
                  {{ formatPositionsGained(data.positions_gained) }}
                </div>
              </template>
            </Column>

            <!-- Points Column -->
            <Column v-if="raceEvent.race_points" field="race_points" header="Points" class="w-24">
              <template #body="{ data }">
                <PointsCell :points="data.race_points ?? 0" bold />
              </template>
            </Column>

            <template #empty>
              <div class="text-center py-6 text-gray-500">
                No results recorded for this
                {{ raceEvent.is_qualifier ? 'qualifying session' : 'race' }}
              </div>
            </template>
          </TechDataTable>
        </div>
      </TechnicalAccordionContent>
    </TechnicalAccordionPanel>
  </TechnicalAccordion>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useMemoize } from '@vueuse/core';
import {
  TechnicalAccordion,
  TechnicalAccordionPanel,
  TechnicalAccordionHeader,
  TechnicalAccordionContent,
} from '@app/components/common/accordions';
import { TechDataTable, PositionCell, PointsCell } from '@app/components/common/tables';
import Column from 'primevue/column';
import Tag from 'primevue/tag';
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

// Memoize time calculations per result to avoid recalculating on every change
const memoizedCalculateEffectiveTime = useMemoize(
  (raceTimeMs: number | null, penaltiesMs: number | null) =>
    calculateEffectiveTime(raceTimeMs, penaltiesMs),
);

const memoizedFormatMsToTime = useMemoize((timeMs: number) => formatMsToTime(timeMs));

// Computed
const raceEventTitle = computed(() => {
  if (props.raceEvent.is_qualifier) {
    return props.raceEvent.name || 'Qualifying';
  }
  return props.raceEvent.name || `Race ${props.raceEvent.race_number}`;
});

/**
 * Get results summary for the accordion subtitle
 */
function getResultsSummary(): string {
  const count = filteredResults.value?.length || 0;
  if (props.raceEvent.is_qualifier) {
    return `${count} drivers qualified`;
  }
  return `${count} finishers`;
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
      const effectiveA = memoizedCalculateEffectiveTime(
        parseTimeToMs(a.original_race_time),
        parseTimeToMs(a.penalties),
      );
      const effectiveB = memoizedCalculateEffectiveTime(
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
      // Calculate position 1's effective time (use memoized function)
      const position1RaceTimeMs = parseTimeToMs(position1Driver.original_race_time);
      const position1PenaltiesMs = parseTimeToMs(position1Driver.penalties);
      const position1EffectiveTimeMs = memoizedCalculateEffectiveTime(
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

        // Calculate time difference for other drivers (use memoized functions)
        const driverRaceTimeMs = parseTimeToMs(result.original_race_time);
        const driverPenaltiesMs = parseTimeToMs(result.penalties);
        const driverEffectiveTimeMs = memoizedCalculateEffectiveTime(
          driverRaceTimeMs,
          driverPenaltiesMs,
        );

        let calculatedTimeDiff: string | null = null;
        if (position1EffectiveTimeMs !== null && driverEffectiveTimeMs !== null) {
          const timeDiffMs = driverEffectiveTimeMs - position1EffectiveTimeMs;
          calculatedTimeDiff = memoizedFormatMsToTime(timeDiffMs);
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
</script>
