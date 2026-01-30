<template>
  <VrlAccordionItem :value="raceEvent.id.toString()" class="mt-2">
    <template #header="{ active }">
      <div class="flex items-center justify-between w-full pr-2">
        <div class="flex items-center gap-3 flex-grow">
          <PhMedal
            v-if="raceEvent.is_qualifier"
            class="text-[var(--purple)]"
            :size="20"
            weight="fill"
          />
          <PhFlagCheckered v-else class="text-[var(--cyan)]" :size="20" weight="fill" />
          <i
            :class="[
              'ph',
              raceEvent.is_qualifier ? 'ph-medal' : 'ph-flag-checkered',
              'text-xl',
              raceEvent.is_qualifier ? 'text-[var(--purple)]' : 'text-[var(--cyan)]',
            ]"
          ></i>
          <div class="flex flex-col gap-1">
            <h5
              class="font-[family-name:var(--font-display)] text-sm font-semibold text-[var(--text-primary)]"
            >
              {{ raceEventTitle }}
            </h5>
            <span class="text-xs text-[var(--text-secondary)]">
              {{ resultsSummary }}
            </span>
          </div>
        </div>
        <VrlButton
          variant="secondary"
          outline
          size="sm"
          label="Export Data"
          :icon="PhDownloadSimple"
          @click.stop="exportToCSV()"
        />
      </div>
    </template>

    <VrlDataTable
      :value="filteredResults"
      :podium-highlight="!raceEvent.is_qualifier"
      position-field="position"
      :paginated="false"
      :hoverable="true"
      :striped="false"
      empty-message="No results recorded"
      table-class="!rounded-none"
    >
      <!-- Position Column -->
      <Column field="position" header="Pos" style="width: 60px">
        <template #body="{ data }">
          <VrlPositionCell :position="data.position" />
        </template>
      </Column>

      <!-- Driver Column -->
      <Column field="driver.name" header="Driver" class="min-w-[170px]">
        <template #body="{ data }">
          <div class="flex items-center gap-2">
            <span class="font-medium text-[var(--text-primary)]">
              {{ data.driver?.name || 'Unknown' }}
            </span>
            <span
              v-if="data.has_pole && raceEvent.is_qualifier"
              class="px-1.5 py-0.5 text-[10px] font-bold bg-[var(--purple-dim)] text-[var(--purple)] border border-[var(--purple)] rounded-[var(--radius-sm)]"
            >
              P
            </span>
            <span
              v-if="data.has_fastest_lap && !raceEvent.is_qualifier && !raceTimesRequired"
              class="px-1.5 py-0.5 text-[10px] font-bold bg-[var(--purple)] text-[var(--bg-dark)] border border-[var(--purple)] rounded-[var(--radius-sm)]"
            >
              FL
            </span>
            <span
              v-if="data.dnf && !raceTimesRequired"
              class="px-1.5 py-0.5 text-[10px] font-bold bg-[var(--red-dim)] text-[var(--red)] border border-[var(--red)] rounded-[var(--radius-sm)]"
            >
              DNF
            </span>
          </div>
        </template>
      </Column>

      <!-- Time Column (for races only, if race times required) -->
      <Column
        v-if="!raceEvent.is_qualifier && raceTimesRequired"
        field="final_race_time"
        style="width: 120px"
      >
        <template #header>
          <span class="block w-full text-center">Time</span>
        </template>
        <template #body="{ data }">
          <div
            class="text-center font-[family-name:var(--font-mono)]"
            :class="{
              'text-[var(--red)] font-semibold': data.penalties && data.penalties !== '',
              'text-[var(--text-secondary)]': !data.penalties || data.penalties === '',
            }"
          >
            <span
              v-if="data.dnf"
              class="px-1.5 py-0.5 text-[10px] font-bold bg-[var(--red-dim)] text-[var(--red)] border border-[var(--red)] rounded-[var(--radius-sm)]"
            >
              DNF
            </span>
            <span v-else>{{ formatRaceTime(data.final_race_time) }}</span>
          </div>
        </template>
      </Column>

      <!-- Gap Column (for races only, if race times required) -->
      <Column
        v-if="!raceEvent.is_qualifier && raceTimesRequired"
        field="calculated_time_diff"
        style="width: 100px"
      >
        <template #header>
          <span class="block w-full text-center">Gap</span>
        </template>
        <template #body="{ data }">
          <div
            class="text-center font-[family-name:var(--font-mono)]"
            :class="{
              'text-[var(--red)] font-semibold': data.penalties && data.penalties !== '',
              'text-[var(--text-secondary)]': !data.penalties || data.penalties === '',
            }"
          >
            <span v-if="data.calculated_time_diff">
              +{{ formatRaceTime(data.calculated_time_diff) }}
            </span>
          </div>
        </template>
      </Column>

      <!-- Fastest Lap / Lap Time Column (if race times required) -->
      <Column v-if="raceTimesRequired" field="fastest_lap" style="width: 120px">
        <template #header>
          <span class="block w-full text-center">{{
            raceEvent.is_qualifier ? 'Lap Time' : 'Fastest Lap'
          }}</span>
        </template>
        <template #body="{ data }">
          <div
            class="flex items-center justify-center gap-2 font-[family-name:var(--font-mono)]"
            :class="{
              'text-[var(--purple)]': data.has_pole || data.has_fastest_lap,
              'text-[var(--text-secondary)]': !data.has_pole && !data.has_fastest_lap,
            }"
          >
            <span>{{ formatRaceTime(data.fastest_lap) }}</span>
            <span
              v-if="data.has_fastest_lap && !raceEvent.is_qualifier"
              class="px-1.5 py-0.5 text-[10px] font-bold bg-[var(--purple)] text-[var(--bg-dark)] border border-[var(--purple)] rounded-[var(--radius-sm)]"
            >
              FL
            </span>
          </div>
        </template>
      </Column>

      <!-- Penalties Column (for races only, if race times required) -->
      <Column
        v-if="!raceEvent.is_qualifier && raceTimesRequired"
        field="penalties"
        header="Penalties"
        style="width: 100px"
      >
        <template #body="{ data }">
          <div
            class="text-center font-[family-name:var(--font-mono)]"
            :class="{
              'text-[var(--red)] font-semibold': data.penalties && data.penalties !== '',
              'text-[var(--text-secondary)]': !data.penalties || data.penalties === '',
            }"
          >
            {{ formatRaceTime(data.penalties) }}
          </div>
        </template>
      </Column>

      <!-- Positions Gained Column (for races only) -->
      <Column v-if="!raceEvent.is_qualifier" field="positions_gained" style="width: 80px">
        <template #header>
          <span class="block w-full text-center">+/-</span>
        </template>
        <template #body="{ data }">
          <div
            class="flex justify-center font-[family-name:var(--font-mono)] font-semibold"
            :class="{
              'text-[var(--green)]': data.positions_gained > 0,
              'text-[var(--red)]': data.positions_gained < 0,
              'text-[var(--text-secondary)]':
                data.positions_gained === 0 || data.positions_gained === null,
            }"
          >
            {{ formatPositionsGained(data.positions_gained) }}
          </div>
        </template>
      </Column>

      <!-- Points Column (if race has points enabled) -->
      <Column v-if="raceEvent.race_points" field="race_points" header="Points" style="width: 80px">
        <template #body="{ data }">
          <VrlPointsCell :value="data.race_points ?? 0" />
        </template>
      </Column>
    </VrlDataTable>
  </VrlAccordionItem>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import Column from 'primevue/column';
import type { RaceEventResults, RaceResultWithDriver } from '@public/types/public';
import VrlAccordionItem from '@public/components/common/accordions/VrlAccordionItem.vue';
import VrlButton from '@public/components/common/buttons/VrlButton.vue';
import VrlDataTable from '@public/components/common/tables/VrlDataTable.vue';
import VrlPositionCell from '@public/components/common/tables/cells/VrlPositionCell.vue';
import VrlPointsCell from '@public/components/common/tables/cells/VrlPointsCell.vue';
import { useTimeFormat } from '@public/composables/useTimeFormat';
import { PhMedal, PhFlagCheckered, PhDownloadSimple } from '@phosphor-icons/vue';

interface RaceResultWithCalculatedDiff extends RaceResultWithDriver {
  calculated_time_diff?: string | null;
}

interface Props {
  raceEvent: RaceEventResults;
  divisionId?: number;
  raceTimesRequired?: boolean;
  competitionName?: string;
  seasonName?: string;
}

const props = withDefaults(defineProps<Props>(), {
  divisionId: undefined,
  raceTimesRequired: false,
  competitionName: '',
  seasonName: '',
});

const { formatRaceTime } = useTimeFormat();

const raceEventTitle = computed(() => {
  if (props.raceEvent.is_qualifier) {
    return props.raceEvent.name || 'Qualifying';
  }
  return props.raceEvent.name || `Race ${props.raceEvent.race_number}`;
});

const resultsSummary = computed(() => {
  const count = filteredResults.value?.length || 0;
  if (props.raceEvent.is_qualifier) {
    return `${count} drivers qualified`;
  }
  return `${count} finishers`;
});

function filterByDivision(
  results: RaceResultWithDriver[],
  divisionId: number | undefined,
): RaceResultWithDriver[] {
  if (divisionId === undefined) {
    return results;
  }
  return results.filter((result) => result.division_id === divisionId);
}

function parseTimeToMs(timeString: string | null): number | null {
  if (!timeString || timeString.trim() === '') {
    return null;
  }

  const timePattern = /^([+]?)(\d{2}):(\d{2}):(\d{2})\.(\d{1,3})$/;
  const match = timeString.match(timePattern);

  if (!match) {
    return null;
  }

  const hours = parseInt(match[2] ?? '0', 10);
  const minutes = parseInt(match[3] ?? '0', 10);
  const seconds = parseInt(match[4] ?? '0', 10);
  const milliseconds = parseInt(match[5] ?? '0', 10);

  return hours * 3600000 + minutes * 60000 + seconds * 1000 + milliseconds;
}

function calculateEffectiveTime(
  raceTimeMs: number | null,
  penaltiesMs: number | null,
): number | null {
  if (raceTimeMs === null) {
    return null;
  }
  if (penaltiesMs === null || penaltiesMs === 0) {
    return raceTimeMs;
  }
  return raceTimeMs + penaltiesMs;
}

function formatMsToTime(timeMs: number): string {
  const hours = Math.floor(timeMs / 3600000);
  const minutes = Math.floor((timeMs % 3600000) / 60000);
  const seconds = Math.floor((timeMs % 60000) / 1000);
  const milliseconds = timeMs % 1000;

  const formattedHours = hours.toString().padStart(2, '0');
  const formattedMinutes = minutes.toString().padStart(2, '0');
  const formattedSeconds = seconds.toString().padStart(2, '0');
  const formattedMs = milliseconds.toString().padStart(3, '0');

  return `${formattedHours}:${formattedMinutes}:${formattedSeconds}.${formattedMs}`;
}

const filteredResults = computed<RaceResultWithCalculatedDiff[]>(() => {
  let results = props.raceEvent.results;

  results = filterByDivision(results, props.divisionId);

  if (!props.raceEvent.is_qualifier && props.raceTimesRequired && results.length > 0) {
    const nonDnfResults = results.filter(
      (r) => !r.dnf && r.original_race_time !== null && r.original_race_time !== '',
    );

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

    const position1Driver = sortedNonDnf[0];

    if (position1Driver) {
      const position1RaceTimeMs = parseTimeToMs(position1Driver.original_race_time);
      const position1PenaltiesMs = parseTimeToMs(position1Driver.penalties);
      const position1EffectiveTimeMs = calculateEffectiveTime(
        position1RaceTimeMs,
        position1PenaltiesMs,
      );

      return results.map((result): RaceResultWithCalculatedDiff => {
        if (result.dnf) {
          return {
            ...result,
            calculated_time_diff: null,
          };
        }

        if (result.original_race_time === null || result.original_race_time === '') {
          return {
            ...result,
            calculated_time_diff: null,
          };
        }

        if (result.id === position1Driver.id) {
          return {
            ...result,
            calculated_time_diff: null,
          };
        }

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

  return results.map((result) => ({
    ...result,
    calculated_time_diff: null,
  }));
});

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

function exportToCSV(): void {
  const isQualifier = props.raceEvent.is_qualifier;
  const hasRaceTimes = props.raceTimesRequired;

  // Build CSV headers based on visible columns
  const headers: string[] = ['Position', 'Driver Name'];

  if (!isQualifier && hasRaceTimes) {
    headers.push('Time', 'Gap');
  }

  if (hasRaceTimes) {
    headers.push(isQualifier ? 'Lap Time' : 'Fastest Lap');
  }

  if (!isQualifier && hasRaceTimes) {
    headers.push('Penalties');
  }

  if (!isQualifier) {
    headers.push('Positions Gained');
  }

  if (props.raceEvent.race_points) {
    headers.push('Points');
  }

  headers.push('DNF');

  if (isQualifier) {
    headers.push('Pole Position');
  }

  if (!isQualifier) {
    headers.push('Fastest Lap');
  }

  // Build CSV rows from filtered results
  const rows = filteredResults.value.map((result) => {
    const row: (string | number)[] = [result.position ?? '', result.driver?.name || 'Unknown'];

    if (!isQualifier && hasRaceTimes) {
      row.push(result.dnf ? 'DNF' : formatRaceTime(result.final_race_time) || '');
      row.push(
        result.calculated_time_diff ? `+${formatRaceTime(result.calculated_time_diff)}` : '',
      );
    }

    if (hasRaceTimes) {
      row.push(formatRaceTime(result.fastest_lap) || '');
    }

    if (!isQualifier && hasRaceTimes) {
      row.push(formatRaceTime(result.penalties) || '');
    }

    if (!isQualifier) {
      row.push(formatPositionsGained(result.positions_gained));
    }

    if (props.raceEvent.race_points) {
      row.push(result.race_points ?? 0);
    }

    row.push(result.dnf ? 'Yes' : 'No');

    if (isQualifier) {
      row.push(result.has_pole ? 'Yes' : 'No');
    }

    if (!isQualifier) {
      row.push(result.has_fastest_lap ? 'Yes' : 'No');
    }

    return row;
  });

  // Convert to CSV format
  const csvContent = [
    headers.join(','),
    ...rows.map((row) =>
      row
        .map((cell) => {
          // Escape cells containing commas, quotes, or newlines
          const cellStr = String(cell);
          if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
            return `"${cellStr.replace(/"/g, '""')}"`;
          }
          return cellStr;
        })
        .join(','),
    ),
  ].join('\n');

  // Create blob and trigger download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  // Generate filename based on competition, season, and race event title
  const sanitize = (str: string) => str.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  const parts = [
    props.competitionName && sanitize(props.competitionName),
    props.seasonName && sanitize(props.seasonName),
    sanitize(raceEventTitle.value),
    'results',
  ].filter(Boolean);
  const filename = `${parts.join('_')}.csv`;

  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
</script>
