<template>
  <div class="cross-division-results">
    <!-- Header with export button -->
    <div class="flex items-center justify-between mb-3">
      <h4
        class="font-[family-name:var(--font-display)] text-base font-semibold text-[var(--text-primary)]"
      >
        All Times
      </h4>
      <VrlButton
        variant="secondary"
        outline
        size="sm"
        label="Export Data"
        :icon="PhDownloadSimple"
        @click="exportToCSV()"
      />
    </div>

    <div class="all-times-table-wrapper">
      <table v-if="sortedData.length > 0" class="all-times-table">
        <thead>
          <tr>
            <th rowspan="2" class="th-pos">#</th>
            <th rowspan="2" class="th-driver">Driver</th>
            <th v-if="hasDivisions" rowspan="2" class="th-division">
              <span class="hidden md:block">Division</span>
              <span class="block md:hidden">Div</span>
            </th>
            <th
              colspan="2"
              class="th-time-group sortable"
              :class="{ 'is-sorted': sortColumn === 'qualifying' }"
              @click="setSortColumn('qualifying')"
            >
              <span class="hidden md:block">Qualifying Time</span>
              <span class="block md:hidden">Quali</span>
              <span v-if="sortColumn === 'qualifying'" class="sort-arrow">▲</span>
            </th>
            <th
              colspan="2"
              class="th-time-group sortable"
              :class="{ 'is-sorted': sortColumn === 'race' }"
              @click="setSortColumn('race')"
            >
              <span class="hidden md:block">Race Time</span>
              <span class="block md:hidden">Race</span>
              <span v-if="sortColumn === 'race'" class="sort-arrow">▲</span>
            </th>
            <th
              colspan="2"
              class="th-time-group sortable"
              :class="{ 'is-sorted': sortColumn === 'fastest' }"
              @click="setSortColumn('fastest')"
            >
              <span class="hidden md:block">Fastest Lap</span>
              <span class="block md:hidden">FL</span>
              <span v-if="sortColumn === 'fastest'" class="sort-arrow">▲</span>
            </th>
          </tr>
          <tr class="sub-header-row">
            <th class="th-sub th-time">Time</th>
            <th class="th-sub th-gap">Gap</th>
            <th class="th-sub th-time">Time</th>
            <th class="th-sub th-gap">Gap</th>
            <th class="th-sub th-time">Time</th>
            <th class="th-sub th-gap">Gap</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="entry in sortedData"
            :key="`${entry.driverName}-${entry.divisionId}`"
            :class="getPodiumClass(entry.position)"
          >
            <td :class="['td-pos', getPodiumClass(entry.position)]">
              {{ entry.position }}
            </td>
            <td class="td-driver">{{ entry.driverName }}</td>
            <td v-if="hasDivisions" class="td-division">
              <div
                v-if="entry.divisionName"
                :class="[
                  'inline-block px-2 py-1 text-xs font-[family-name:var(--font-mono)] font-semibold rounded-[var(--radius-sm)]',
                  getDivisionBadgeClass(entry.divisionId),
                ]"
              >
                <span class="hidden md:block">
                  {{ entry.divisionName }}
                </span>
                <span class="block md:hidden">
                  {{
                    entry.divisionName
                      .split(' ')
                      .map((w: string) => w[0])
                      .join('')
                  }}
                </span>
              </div>
              <span v-else class="text-[var(--text-muted)]">-</span>
            </td>
            <!-- Qualifying Time & Gap -->
            <td :class="['td-time', { 'column-sorted': sortColumn === 'qualifying' }]">
              {{ entry.qualifyingTimeAbsolute }}
            </td>
            <td :class="['td-gap', { 'column-sorted': sortColumn === 'qualifying' }]">
              {{ entry.qualifyingGap || '-' }}
            </td>
            <!-- Race Time & Gap -->
            <td :class="['td-time', { 'column-sorted': sortColumn === 'race' }]">
              {{ entry.raceTimeAbsolute }}
            </td>
            <td :class="['td-gap', { 'column-sorted': sortColumn === 'race' }]">
              {{ entry.raceGap || '-' }}
            </td>
            <!-- Fastest Lap Time & Gap -->
            <td :class="['td-time', { 'column-sorted': sortColumn === 'fastest' }]">
              {{ entry.fastestLapAbsolute }}
            </td>
            <td :class="['td-gap', { 'column-sorted': sortColumn === 'fastest' }]">
              {{ entry.fastestLapGap || '-' }}
            </td>
          </tr>
        </tbody>
      </table>
      <div v-else class="empty-state">No times available</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import type { CrossDivisionResult, RaceEventResults } from '@public/types/public';
import VrlButton from '@public/components/common/buttons/VrlButton.vue';
import { useGtm } from '@public/composables/useGtm';
import { PhDownloadSimple } from '@phosphor-icons/vue';

const MS_PER_SECOND = 1000;
const SECONDS_PER_MINUTE = 60;

interface Props {
  qualifyingResults: CrossDivisionResult[] | null;
  raceTimeResults: CrossDivisionResult[] | null;
  fastestLapResults: CrossDivisionResult[] | null;
  raceEvents: RaceEventResults[];
  divisions: Array<{ id: number; name: string }>;
  competitionName?: string;
  seasonName?: string;
  roundName?: string;
}

interface CombinedTimeEntry {
  position: number;
  driverName: string;
  divisionId: number | null;
  divisionName: string | null;
  qualifyingTimeMs: number | null;
  raceTimeMs: number | null;
  fastestLapMs: number | null;
  qualifyingFormatted: string;
  raceFormatted: string;
  fastestLapFormatted: string;
  // Separate absolute time and gap fields for display
  qualifyingTimeAbsolute: string;
  qualifyingGap: string | null;
  raceTimeAbsolute: string;
  raceGap: string | null;
  fastestLapAbsolute: string;
  fastestLapGap: string | null;
}

type SortColumn = 'qualifying' | 'race' | 'fastest';

const props = withDefaults(defineProps<Props>(), {
  competitionName: '',
  seasonName: '',
  roundName: '',
});

const sortColumn = ref<SortColumn>('qualifying');

const { trackEvent } = useGtm();

function setSortColumn(column: SortColumn): void {
  sortColumn.value = column;
}

const raceResultsMap = computed(() => {
  const map = new Map();
  props.raceEvents.forEach((event) => {
    event.results.forEach((result) => map.set(result.id, result));
  });
  return map;
});

const divisionsMap = computed(() => {
  const map = new Map();
  props.divisions.forEach((division) => map.set(division.id, division.name));
  return map;
});

const hasDivisions = computed(() => props.divisions.length > 0);

const combinedData = computed<CombinedTimeEntry[]>(() => {
  const entryMap = new Map<string, CombinedTimeEntry>();

  function getOrCreateEntry(raceResultId: number): CombinedTimeEntry | null {
    const raceResult = raceResultsMap.value.get(raceResultId);
    const driverName = raceResult?.driver?.name || 'Unknown Driver';
    const divisionId = raceResult?.division_id ?? null;
    const key = `${driverName}-${divisionId}`;

    if (!entryMap.has(key)) {
      const divisionName = divisionId ? (divisionsMap.value.get(divisionId) ?? null) : null;
      entryMap.set(key, {
        position: 0,
        driverName,
        divisionId,
        divisionName,
        qualifyingTimeMs: null,
        raceTimeMs: null,
        fastestLapMs: null,
        qualifyingFormatted: '-',
        raceFormatted: '-',
        fastestLapFormatted: '-',
        qualifyingTimeAbsolute: '-',
        qualifyingGap: null,
        raceTimeAbsolute: '-',
        raceGap: null,
        fastestLapAbsolute: '-',
        fastestLapGap: null,
      });
    }

    return entryMap.get(key) ?? null;
  }

  // Populate qualifying times
  if (props.qualifyingResults) {
    for (const result of props.qualifyingResults) {
      const entry = getOrCreateEntry(result.race_result_id);
      if (entry) {
        entry.qualifyingTimeMs = result.time_ms;
      }
    }
  }

  // Populate race times
  if (props.raceTimeResults) {
    for (const result of props.raceTimeResults) {
      const entry = getOrCreateEntry(result.race_result_id);
      if (entry) {
        entry.raceTimeMs = result.time_ms;
      }
    }
  }

  // Populate fastest lap times
  if (props.fastestLapResults) {
    for (const result of props.fastestLapResults) {
      const entry = getOrCreateEntry(result.race_result_id);
      if (entry) {
        entry.fastestLapMs = result.time_ms;
      }
    }
  }

  // Find fastest time in each category
  const entries = Array.from(entryMap.values());
  const fastestQualifying = Math.min(
    ...entries.filter((e) => e.qualifyingTimeMs != null).map((e) => e.qualifyingTimeMs!),
  );
  const fastestRace = Math.min(
    ...entries.filter((e) => e.raceTimeMs != null).map((e) => e.raceTimeMs!),
  );
  const fastestLap = Math.min(
    ...entries.filter((e) => e.fastestLapMs != null).map((e) => e.fastestLapMs!),
  );

  // Format times: absolute for all, gap for non-leaders
  for (const entry of entries) {
    // Legacy formatted fields (keep for backwards compatibility)
    entry.qualifyingFormatted = formatColumnTime(entry.qualifyingTimeMs, fastestQualifying);
    entry.raceFormatted = formatColumnTime(entry.raceTimeMs, fastestRace);
    entry.fastestLapFormatted = formatColumnTime(entry.fastestLapMs, fastestLap);

    // Absolute times (always show the actual time)
    entry.qualifyingTimeAbsolute =
      entry.qualifyingTimeMs != null ? formatTime(entry.qualifyingTimeMs) : '-';
    entry.raceTimeAbsolute = entry.raceTimeMs != null ? formatTime(entry.raceTimeMs) : '-';
    entry.fastestLapAbsolute = entry.fastestLapMs != null ? formatTime(entry.fastestLapMs) : '-';

    // Gaps (null for leader, formatted difference for others)
    entry.qualifyingGap =
      entry.qualifyingTimeMs != null &&
      entry.qualifyingTimeMs !== fastestQualifying &&
      isFinite(fastestQualifying)
        ? formatTimeDifference(entry.qualifyingTimeMs - fastestQualifying)
        : null;
    entry.raceGap =
      entry.raceTimeMs != null && entry.raceTimeMs !== fastestRace && isFinite(fastestRace)
        ? formatTimeDifference(entry.raceTimeMs - fastestRace)
        : null;
    entry.fastestLapGap =
      entry.fastestLapMs != null && entry.fastestLapMs !== fastestLap && isFinite(fastestLap)
        ? formatTimeDifference(entry.fastestLapMs - fastestLap)
        : null;
  }

  return entries;
});

const sortedData = computed<CombinedTimeEntry[]>(() => {
  const data = [...combinedData.value];

  const getTimeMs = (entry: CombinedTimeEntry): number | null => {
    switch (sortColumn.value) {
      case 'qualifying':
        return entry.qualifyingTimeMs;
      case 'race':
        return entry.raceTimeMs;
      case 'fastest':
        return entry.fastestLapMs;
    }
  };

  data.sort((a, b) => {
    const timeA = getTimeMs(a);
    const timeB = getTimeMs(b);

    // Nulls to bottom
    if (timeA == null && timeB == null) return 0;
    if (timeA == null) return 1;
    if (timeB == null) return -1;

    return timeA - timeB;
  });

  // Recalculate position after sort
  return data.map((entry, index) => ({
    ...entry,
    position: index + 1,
  }));
});

function formatColumnTime(timeMs: number | null, fastestMs: number): string {
  if (timeMs == null) return '-';
  if (timeMs === fastestMs || !isFinite(fastestMs)) return formatTime(timeMs);
  return formatTimeDifference(timeMs - fastestMs);
}

function formatTime(timeMs: number): string {
  if (timeMs == null) return '-';

  const totalSeconds = Math.floor(timeMs / MS_PER_SECOND);
  const milliseconds = timeMs % MS_PER_SECOND;
  const minutes = Math.floor(totalSeconds / SECONDS_PER_MINUTE);
  const seconds = totalSeconds % SECONDS_PER_MINUTE;

  const formattedMinutes = minutes.toString().padStart(2, '0');
  const formattedSeconds = seconds.toString().padStart(2, '0');
  const formattedMs = milliseconds.toString().padStart(3, '0');

  return `${formattedMinutes}:${formattedSeconds}.${formattedMs}`;
}

function formatTimeDifference(differenceMs: number): string {
  if (differenceMs == null) return '-';

  const totalSeconds = Math.floor(differenceMs / MS_PER_SECOND);
  const milliseconds = differenceMs % MS_PER_SECOND;
  const minutes = Math.floor(totalSeconds / SECONDS_PER_MINUTE);
  const seconds = totalSeconds % SECONDS_PER_MINUTE;

  const formattedSeconds = seconds.toString().padStart(2, '0');
  const formattedMs = milliseconds.toString().padStart(3, '0');

  if (minutes > 0) {
    return `+${minutes}:${formattedSeconds}.${formattedMs}`;
  } else {
    return `+${formattedSeconds}.${formattedMs}`;
  }
}

function getDivisionBadgeClass(divisionId: number | null): string {
  if (!divisionId || divisionId < 1) {
    return 'bg-[var(--bg-elevated)] text-[var(--text-secondary)] border border-[var(--border)]';
  }

  const variants = [
    'bg-[var(--cyan-dim)] text-[var(--cyan)] border border-[var(--cyan)]',
    'bg-[var(--green-dim)] text-[var(--green)] border border-[var(--green)]',
    'bg-[var(--purple-dim)] text-[var(--purple)] border border-[var(--purple)]',
    'bg-[var(--orange-dim)] text-[var(--orange)] border border-[var(--orange)]',
    'bg-[var(--red-dim)] text-[var(--red)] border border-[var(--red)]',
  ];

  const variantIndex = (divisionId - 1) % variants.length;
  return variants[variantIndex] ?? variants[0] ?? '';
}

function getPodiumClass(position: number): string {
  if (position === 1) return 'podium-1';
  if (position === 2) return 'podium-2';
  if (position === 3) return 'podium-3';
  return '';
}

function exportToCSV(): void {
  // Build headers based on visible columns
  const headers: string[] = ['Position', 'Driver Name'];

  if (hasDivisions.value) {
    headers.push('Division');
  }

  // Add time columns with both absolute and gap
  headers.push('Qualifying Time', 'Qualifying Gap');
  headers.push('Race Time', 'Race Gap');
  headers.push('Fastest Lap', 'Fastest Lap Gap');

  // Build rows from sortedData
  const rows = sortedData.value.map((entry) => {
    const row: (string | number)[] = [entry.position, entry.driverName];

    if (hasDivisions.value) {
      row.push(entry.divisionName || '-');
    }

    row.push(entry.qualifyingTimeAbsolute);
    row.push(entry.qualifyingGap || '-');
    row.push(entry.raceTimeAbsolute);
    row.push(entry.raceGap || '-');
    row.push(entry.fastestLapAbsolute);
    row.push(entry.fastestLapGap || '-');

    return row;
  });

  // Convert to CSV format with proper escaping
  const csvContent = [
    headers.join(','),
    ...rows.map((row) =>
      row
        .map((cell) => {
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

  // Generate filename
  const sanitize = (str: string) => str.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  const parts = [
    props.competitionName && sanitize(props.competitionName),
    props.seasonName && sanitize(props.seasonName),
    props.roundName && sanitize(props.roundName),
    'all_times',
  ].filter(Boolean);
  const filename = `${parts.join('_')}.csv`;

  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  // Track CSV download event
  trackEvent('csv_download_click', {
    csv_filename: filename,
    league_name: props.competitionName,
    season_name: props.seasonName,
    table_type: 'cross_division_all_times',
  });
}
</script>

<style scoped>
.cross-division-results {
  border-radius: var(--radius);
}

/* Table Wrapper */
.all-times-table-wrapper {
  width: 100%;
  overflow-x: auto;
  border-radius: var(--radius);
  border: 1px solid var(--border);
  background: var(--bg-elevated);
}

/* Table */
.all-times-table {
  width: 100%;
  border-collapse: collapse;
  font-family: var(--font-body);
}

/* Table Header */
.all-times-table thead th {
  background: var(--bg-elevated);
  color: var(--text-primary);
  font-family: var(--font-display);
  font-weight: 600;
  font-size: 0.875rem;
  text-align: center;
  padding: 0.75rem;
  border-bottom: 1px solid var(--border);
}

.all-times-table .th-pos {
  width: 60px;
  text-align: center;
}

.all-times-table .th-driver {
  min-width: 200px;
  text-align: left;
}

.all-times-table .th-division {
  width: 180px;
  text-align: center;
}

/* Group Headers (Qualifying Time, Race Time, Fastest Lap) */
.all-times-table .th-time-group {
  text-align: center;
  border-bottom: 1px solid var(--border);
}

.all-times-table .th-time-group.sortable {
  cursor: pointer;
  user-select: none;
  transition: background-color 0.15s ease;
  position: relative;
  padding-right: 1.5rem;
}

.all-times-table .th-time-group.sortable:hover {
  background: var(--bg-hover);
}

.all-times-table .th-time-group.sortable.is-sorted {
  background: var(--cyan);
  color: white;
}

.all-times-table .sort-arrow {
  position: absolute;
  right: 0.5rem;
  top: 50%;
  transform: translateY(-50%);
  font-size: 0.65rem;
}

/* Sub-headers (Time | Gap) */
.all-times-table .sub-header-row .th-sub {
  font-size: 0.65rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding: 0.25rem 0.5rem;
  background: var(--bg-hover);
  color: var(--text-secondary);
  width: 6.5rem;
}

.all-times-table .th-sub.th-time {
  width: 6.5rem;
  border-right: 1px solid var(--border);
}

.all-times-table .th-sub.th-gap {
  width: 6.5rem;
}

/* Table Body */
.all-times-table tbody tr {
  border-bottom: 1px solid var(--border);
  transition: background-color 0.15s ease;
}

.all-times-table tbody tr:hover {
  background: var(--bg-hover);
}

.all-times-table tbody tr:last-child {
  border-bottom: none;
}

.all-times-table tbody td {
  padding: 0.75rem;
  font-size: 0.875rem;
  color: var(--text-primary);
}

/* Position Cell */
.all-times-table .td-pos {
  width: 60px;
  text-align: center;
  font-family: var(--font-mono);
  font-weight: 600;
}

/* Driver Cell */
.all-times-table .td-driver {
  min-width: 200px;
  text-align: left;
  font-weight: 500;
  font-size: 1rem;
}

/* Division Cell */
.all-times-table .td-division {
  width: 180px;
  text-align: center;
}

/* Time and Gap Columns - equal width */
.all-times-table .td-time,
.all-times-table .td-gap {
  width: 6.5rem;
  min-width: 6.5rem;
  text-align: center;
  font-family: var(--font-mono);
}

.all-times-table .td-time {
  font-weight: 700;
  font-size: 1rem;
  border-right: 1px solid var(--border);
}

.all-times-table .td-gap {
  font-size: 0.85rem;
  color: var(--text-secondary);
}

/* Column Sorted Highlight */
.all-times-table .td-time.column-sorted,
.all-times-table .td-gap.column-sorted {
  background: rgba(6, 182, 212, 0.08);
}

/* Podium Rows */
.all-times-table tbody tr.podium-1 {
  background: rgba(255, 215, 0, 0.1);
}

.all-times-table tbody tr.podium-2 {
  background: rgba(192, 192, 192, 0.1);
}

.all-times-table tbody tr.podium-3 {
  background: rgba(205, 127, 50, 0.1);
}

.all-times-table tbody tr.podium-1:hover,
.all-times-table tbody tr.podium-2:hover,
.all-times-table tbody tr.podium-3:hover {
  background: var(--bg-hover);
}

/* Podium Position Cells */
.all-times-table .td-pos.podium-1 {
  color: #ffd700;
}

.all-times-table .td-pos.podium-2 {
  color: #c0c0c0;
}

.all-times-table .td-pos.podium-3 {
  color: #cd7f32;
}

/* Empty State */
.empty-state {
  padding: 3rem 1.5rem;
  text-align: center;
  color: var(--text-secondary);
  font-size: 0.875rem;
  background: var(--bg-elevated);
}
</style>
