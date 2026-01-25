<template>
  <div class="overflow-x-auto">
    <table class="w-full mt-2">
      <thead>
        <tr>
          <!-- Drag handle column (shown in edit mode, hidden in read-only) -->
          <th v-if="!readOnly" class="px-1 py-1 text-center font-medium text-gray-700 w-8"></th>
          <th class="px-1 py-1 text-center font-medium text-[var(--text-secondary)] w-6">#</th>
          <th
            class="px-1 py-1 pl-3 font-medium text-left text-[var(--text-secondary)] min-w-[180px]"
          >
            Driver
          </th>
          <!-- Time columns (hidden in no-times mode) -->
          <th
            v-if="!isQualifying && raceTimesRequired"
            class="px-1 py-1 font-medium text-[var(--text-secondary)] w-42"
            :class="{ 'text-right pr-4': readOnly }"
          >
            {{ readOnly ? 'Race Time' : 'Original Time' }}
          </th>
          <th
            v-if="!isQualifying && raceTimesRequired"
            class="px-1 py-1 font-medium text-[var(--text-secondary)] w-42"
            :class="{ 'text-right pr-4': readOnly }"
          >
            Time Diff
          </th>
          <!-- Fastest Lap column: Show for qualifying OR for races with times -->
          <th
            v-if="isQualifying || raceTimesRequired"
            class="px-1 py-1 font-medium text-[var(--text-secondary)] w-42"
            :class="{ 'pr-6': isQualifying, 'text-right pr-4': readOnly }"
          >
            {{ isQualifying ? 'Lap Time' : 'Fastest Lap' }}
          </th>
          <th
            v-if="!isQualifying && raceTimesRequired"
            class="px-1 py-1 font-medium text-[var(--text-secondary)] w-42"
            :class="{ 'text-right pr-4': readOnly }"
          >
            Penalties
          </th>
          <!-- DNF/FL column -->
          <th v-if="!isQualifying" class="px-1 py-1 font-medium text-[var(--text-secondary)] w-20">
            <template v-if="raceTimesRequired">DNF</template>
            <template v-else>
              <div class="flex justify-center gap-4">
                <span>DNF</span>
                <span>FL</span>
              </div>
            </template>
          </th>
          <th
            v-if="isQualifying && !raceTimesRequired"
            class="px-1 py-1 font-medium text-[var(--text-secondary)] w-20"
            :class="{ 'text-right pr-4': readOnly }"
          >
            Pole
          </th>
          <th
            v-if="!readOnly"
            class="px-1 py-1 text-center font-medium text-[var(--text-secondary)] w-4"
          ></th>
        </tr>
      </thead>
      <!-- Draggable tbody for edit mode (both times-required and no-times modes) -->
      <draggable
        v-if="!readOnly"
        v-model="localResults"
        tag="tbody"
        item-key="driver_id"
        handle=".drag-handle"
        @end="onDragEnd"
      >
        <template #item="{ element: row, index }">
          <tr
            :class="[
              'border-b border-[var(--color-border-muted)]',
              row.dnf || row.penalties ? 'bg-red-50' : 'hover:bg-[var(--bg-highlight)]',
              index === 0 && sortedFinishers.length > 0 && (row.dnf || row.penalties)
                ? 'border-t-2 border-red-200'
                : '',
            ]"
          >
            <!-- Drag handle -->
            <td class="px-1 py-1 text-center">
              <PhDotsSixVertical
                :size="20"
                class="drag-handle cursor-move text-gray-400 hover:text-gray-600"
                tabindex="0"
                role="button"
                aria-label="Reorder row. Use Alt+Up or Alt+Down arrow keys to move this row"
                @keydown="(event: Event) => handleKeyDown(event, index)"
              />
            </td>
            <td class="px-1 py-1 text-gray-500 text-center">{{ index + 1 }}</td>
            <td class="px-1 py-1">
              <Select
                v-model="row.driver_id"
                :options="getAvailableDrivers(row.driver_id)"
                option-label="name"
                option-value="id"
                placeholder="Select driver"
                class="w-full text-white"
                filter
                @change="handleDriverChange"
              />
            </td>
            <!-- Race Time column (shown if not qualifying and times required) -->
            <td v-if="!isQualifying && raceTimesRequired" class="px-1 py-1 text-end">
              <ResultTimeInput
                v-model="row.original_race_time"
                placeholder="00:00:00.000"
                @update:model-value="handleTimeChange"
              />
            </td>
            <!-- Time Difference column (shown if not qualifying and times required) -->
            <td v-if="!isQualifying && raceTimesRequired" class="px-1 py-1 text-end">
              <ResultTimeInput
                v-model="row.original_race_time_difference"
                placeholder="+00:00:00.000"
                @update:model-value="handleTimeChange"
              />
            </td>
            <!-- Fastest Lap column (shown if qualifying OR times required) -->
            <td
              v-if="isQualifying || raceTimesRequired"
              class="px-1 py-1 text-end"
              :class="{ 'pr-6': isQualifying }"
            >
              <ResultTimeInput
                v-model="row.fastest_lap"
                placeholder="00:00:00.000"
                @update:model-value="handleTimeChange"
              />
            </td>
            <!-- Penalties column (shown if not qualifying and times required) -->
            <td v-if="!isQualifying && raceTimesRequired" class="px-1 py-1 text-end">
              <div class="flex items-center gap-2">
                <ResultTimeInput
                  v-model="row.penalties"
                  placeholder="00:00:00.000"
                  class="flex-1"
                  :class="{
                    'border border-red-500': row.penalties && row.penalties !== '',
                  }"
                  @update:model-value="handlePenaltyChange(row)"
                />
                <span
                  v-if="row._penaltyChanged"
                  class="w-2 h-2 rounded-full bg-orange-500 flex-shrink-0"
                  title="Penalty modified this session"
                  aria-label="Penalty modified this session"
                ></span>
              </div>
            </td>
            <!-- DNF column (for times-required mode) OR DNF/FL column (for no-times mode) -->
            <td v-if="!isQualifying" class="px-1 py-1 text-center">
              <template v-if="raceTimesRequired">
                <Checkbox
                  v-model="row.dnf"
                  :binary="true"
                  @change.stop="() => handleDnfChange(row)"
                />
              </template>
              <template v-else>
                <div class="flex justify-center gap-6">
                  <Checkbox
                    v-model="row.dnf"
                    :binary="true"
                    @change.stop="() => handleDnfChangeNoTimes(row)"
                  />
                  <Checkbox v-model="row.has_fastest_lap" :binary="true" />
                </div>
              </template>
            </td>
            <!-- Pole position checkbox (for qualifying and no-times mode) -->
            <td v-if="isQualifying && !raceTimesRequired" class="px-1 py-1 text-center">
              <Checkbox v-model="row.has_pole" :binary="true" />
            </td>
            <!-- Delete button -->
            <td class="px-1 py-1 text-center">
              <Button
                :icon="PhTrash"
                size="sm"
                variant="danger"
                text
                @click="handleRemoveRow(index)"
              />
            </td>
          </tr>
        </template>
      </draggable>
      <!-- Standard tbody for read-only mode -->
      <tbody v-else>
        <tr
          v-for="(row, index) in displayResults"
          :key="row.driver_id ?? `empty-${index}`"
          :class="getRowClass(index)"
        >
          <td class="px-4 py-3.5 text-center text-[var(--text-secondary)]">{{ index + 1 }}</td>
          <td class="px-4 py-3.5">
            <span class="font-medium text-[var(--text-primary)]">{{
              getDriverName(row.driver_id)
            }}</span>
          </td>
          <td v-if="!isQualifying && raceTimesRequired" class="px-4 py-3.5 text-end">
            <div class="flex flex-col items-end">
              <span
                class="text-[var(--text-primary)] font-mono"
                :class="{
                  'text-[var(--red)] font-semibold': row.penalties && row.penalties !== '',
                }"
              >
                {{ formatRaceTime(row.final_race_time || row.original_race_time) }}
              </span>
            </div>
          </td>
          <td v-if="!isQualifying && raceTimesRequired" class="px-4 py-3.5 text-end">
            <span
              v-if="
                (row.calculated_time_diff ??
                  row.final_race_time_difference ??
                  row.original_race_time_difference) !== null &&
                (row.calculated_time_diff ??
                  row.final_race_time_difference ??
                  row.original_race_time_difference) !== ''
              "
              class="text-[var(--text-primary)] font-mono"
              :class="{
                'text-[var(--red)] font-semibold': row.penalties && row.penalties !== '',
                'text-[var(--text-primary)]': !row.penalties || row.penalties === '',
              }"
              >+{{
                formatRaceTime(
                  row.calculated_time_diff ??
                    row.final_race_time_difference ??
                    row.original_race_time_difference,
                )
              }}</span
            >
          </td>
          <td
            v-if="isQualifying || raceTimesRequired"
            class="px-4 py-3.5 text-end"
            :class="{ 'pr-6': isQualifying }"
          >
            <Tag
              v-if="row.has_fastest_lap && !isQualifying"
              value="FL"
              class="text-xs bg-[var(--purple)] text-white mr-1"
              :pt="{ root: { class: 'bg-[var(--purple)] text-white border-purple-600' } }"
            />
            <span
              class="font-mono"
              :class="{
                'text-[var(--purple)]': row.has_pole || row.has_fastest_lap,
                'text-[var(--text-primary)]': !row.has_fastest_lap,
              }"
              >{{ formatRaceTime(row.fastest_lap) }}</span
            >
          </td>
          <td v-if="!isQualifying && raceTimesRequired" class="px-4 py-3.5 text-end">
            <span
              class="font-mono"
              :class="{
                'text-[var(--red)] font-semibold': row.penalties && row.penalties !== '',
                'text-[var(--text-primary)]': !row.penalties || row.penalties === '',
              }"
            >
              {{ formatRaceTime(row.penalties) }}
            </span>
          </td>
          <td v-if="!isQualifying" class="px-4 py-3.5 text-center">
            <span v-if="row.dnf" class="text-[var(--red)] font-medium">DNF</span>
            <span v-else class="text-[var(--text-muted)]">-</span>
          </td>
        </tr>
      </tbody>
    </table>

    <!-- Add Driver Button (hidden in read-only mode) -->
    <div v-if="!readOnly" class="mt-4 flex justify-center">
      <Button
        label="Add Driver"
        :icon="PhPlus"
        size="sm"
        variant="outline"
        :disabled="isAddDriverDisabled"
        @click="handleAddDriver"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import draggable from 'vuedraggable';
import { PhDotsSixVertical, PhTrash, PhPlus } from '@phosphor-icons/vue';
import Select from 'primevue/select';
import { Button } from '@app/components/common/buttons';
import Tag from 'primevue/tag';
import Checkbox from 'primevue/checkbox';
import ResultTimeInput from '@app/components/result/ResultTimeInput.vue';
import { useRaceTimeCalculation } from '@app/composables/useRaceTimeCalculation';
import { useTimeFormat } from '@app/composables/useTimeFormat';
import { getPodiumRowClass } from '@app/constants/podiumColors';
import type { RaceResultFormData, DriverOption } from '@app/types/raceResult';

interface Props {
  results: RaceResultFormData[];
  drivers: DriverOption[];
  isQualifying: boolean;
  selectedDriverIds: Set<number>;
  readOnly?: boolean;
  raceTimesRequired?: boolean;
}

interface Emits {
  (e: 'update:results', results: RaceResultFormData[]): void;
  (e: 'penalty-change', row: RaceResultFormData): void;
}

const props = withDefaults(defineProps<Props>(), {
  readOnly: false,
  raceTimesRequired: true,
});
const emit = defineEmits<Emits>();

const { sortResultsByTime, parseTimeToMs, calculateEffectiveTime, formatMsToTime } =
  useRaceTimeCalculation();
const { formatRaceTime } = useTimeFormat();

// Local results for both drag-and-drop and times-required modes
const localResults = ref<RaceResultFormData[]>([...props.results]);

// Timestamp to track internal updates and prevent race conditions
// Using timestamp instead of boolean flag to handle rapid updates correctly
const lastInternalUpdate = ref(0);

// Watch for changes to props.results and update localResults
watch(
  () => props.results,
  (newResults) => {
    const now = Date.now();
    // Only update if this change came from parent (not from our internal update)
    // Allow 250ms window for internal updates to complete (better reliability on slower devices)
    if (now - lastInternalUpdate.value > 250) {
      localResults.value = [...newResults];
    }
  },
  { deep: true },
);

/**
 * Check if a result row has meaningful data to display
 * A row is considered to have data if it has:
 * - Time data: original_race_time, fastest_lap
 * - Status flags: dnf, has_pole
 * - Position (for qualifying without times)
 */
function hasResultData(row: RaceResultFormData): boolean {
  return Boolean(
    row.original_race_time || row.fastest_lap || row.dnf || row.has_pole || row.position !== null,
  );
}

/**
 * Computed: Sorted finishers (non-DNF drivers)
 * Used for determining when to show DNF separator
 */
const sortedFinishers = computed(() => {
  return localResults.value.filter((r) => !r.dnf);
});

/**
 * Sort DNF drivers to the bottom of the list
 * Maintains order within finishers and within DNFs
 */
function sortDnfToBottom(): void {
  const finishers = localResults.value.filter((r) => !r.dnf);
  const dnfs = localResults.value.filter((r) => r.dnf);
  localResults.value = [...finishers, ...dnfs];
}

/**
 * Emit updated results with timestamp tracking to prevent watch race conditions
 */
function emitUpdate(): void {
  lastInternalUpdate.value = Date.now();
  emit('update:results', [...localResults.value]);
}

/**
 * Handle drag end event
 * Only sorts DNFs to bottom if there are DNF drivers out of place
 */
function onDragEnd(): void {
  // Only sort if there are DNF drivers that might be out of place
  const hasOutOfPlaceDnf = localResults.value.some((result, index, arr) => {
    if (!result.dnf) return false;
    // Check if there's a non-DNF driver after this DNF driver
    return arr.slice(index + 1).some((r) => !r.dnf);
  });

  if (hasOutOfPlaceDnf) {
    sortDnfToBottom();
  }

  emitUpdate();
}

/**
 * Handle DNF checkbox change in no-times mode
 * When DNF is toggled ON, moves driver to bottom of list
 * When DNF is toggled OFF, moves driver to end of finishers (just above DNFs)
 */
function handleDnfChangeNoTimes(row: RaceResultFormData): void {
  if (row.dnf) {
    // When DNF is toggled ON, move to bottom of list
    sortDnfToBottom();
  } else {
    // When DNF is toggled OFF, move to end of finishers (just above DNFs)
    const index = localResults.value.findIndex((r) => r.driver_id === row.driver_id);
    if (index === -1 || index >= localResults.value.length) return;

    // Remove the driver from current position
    const removed = localResults.value.splice(index, 1);
    const driver = removed[0];

    // Guard against undefined (should never happen since we checked index !== -1)
    if (!driver) return;

    // Find the first DNF driver's position
    const firstDnfIndex = localResults.value.findIndex((r) => r.dnf);

    if (firstDnfIndex === -1) {
      // No DNF drivers, add to end
      localResults.value.push(driver);
    } else {
      // Insert just before the first DNF driver
      localResults.value.splice(firstDnfIndex, 0, driver);
    }
  }
  emitUpdate();
}

/**
 * Display results for the template
 * In read-only mode: filters and sorts data from props for display WITH dynamically calculated time differences
 * In edit mode: returns localResults directly (no sorting)
 */
const displayResults = computed(() => {
  if (props.readOnly) {
    // In read-only mode, filter out drivers without any result data
    const resultsToProcess = props.results.filter(hasResultData);

    // Check if times-required mode
    if (props.raceTimesRequired) {
      // Check if any results have times entered - if not, keep original order
      const hasAnyTimes = resultsToProcess.some((r) =>
        props.isQualifying
          ? r.fastest_lap
          : r.original_race_time || r.original_race_time_difference,
      );

      if (!hasAnyTimes) {
        // Return results in original order (by driver name order from props)
        return resultsToProcess;
      }

      // Sort results by time, then separate DNF drivers to the bottom
      const sorted = sortResultsByTime(resultsToProcess, props.isQualifying);

      // Separate into non-DNF and DNF groups
      const nonDnfResults = sorted.filter((r) => !r.dnf);
      const dnfResults = sorted.filter((r) => r.dnf);

      // Combine non-DNF first, then DNF at the bottom
      const orderedResults = [...nonDnfResults, ...dnfResults];

      // For race mode (non-qualifying), dynamically calculate time differences
      if (!props.isQualifying && nonDnfResults.length > 0) {
        // Find position 1 driver (first non-DNF driver after sorting)
        const position1Driver = nonDnfResults[0];

        if (position1Driver) {
          // Calculate position 1's effective time (original_race_time + penalties)
          const position1RaceTimeMs = parseTimeToMs(position1Driver.original_race_time);
          const position1PenaltiesMs = parseTimeToMs(position1Driver.penalties);
          const position1EffectiveTimeMs = calculateEffectiveTime(
            position1RaceTimeMs,
            position1PenaltiesMs,
          );

          // Calculate time differences for all drivers
          return orderedResults.map((result, index) => {
            // Position 1 driver has no time difference
            if (index === 0 && !result.dnf) {
              return {
                ...result,
                calculated_time_diff: null,
              };
            }

            // DNF drivers have no time difference
            if (result.dnf) {
              return {
                ...result,
                calculated_time_diff: null,
              };
            }

            // Calculate time difference for other drivers
            const driverRaceTimeMs = parseTimeToMs(result.original_race_time);
            const driverPenaltiesMs = parseTimeToMs(result.penalties);
            const driverEffectiveTimeMs = calculateEffectiveTime(
              driverRaceTimeMs,
              driverPenaltiesMs,
            );

            // Calculate time difference
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

      // Return ordered results without time difference calculation for qualifying
      return orderedResults;
    }

    return resultsToProcess;
  }

  // Edit mode: return localResults directly (no sorting)
  return localResults.value;
});

// Check if all drivers are already selected
const isAddDriverDisabled = computed(() => {
  return props.selectedDriverIds.size >= props.drivers.length;
});

// Get available drivers that are NOT already selected
const availableDrivers = computed(() => {
  return props.drivers
    .filter((driver) => !props.selectedDriverIds.has(driver.id))
    .sort((a, b) => a.name.localeCompare(b.name));
});

// Create a driver lookup map to avoid O(n) find operations in getDriverName
const driverMap = computed(() => {
  const map = new Map<number, string>();
  props.drivers.forEach((d) => map.set(d.id, d.name));
  return map;
});

function getAvailableDrivers(currentDriverId: number | null): DriverOption[] {
  return props.drivers.map((driver) => ({
    ...driver,
    disabled: driver.id !== currentDriverId && props.selectedDriverIds.has(driver.id),
  }));
}

function getDriverName(driverId: number | null): string {
  if (driverId === null) return '';
  return driverMap.value.get(driverId) ?? '';
}

/**
 * Get row class for podium styling in read-only mode
 * Position is 1-indexed (index + 1)
 */
function getRowClass(index: number): string {
  if (!props.readOnly) return '';
  const podiumClass = getPodiumRowClass(index + 1);
  // Base classes that match PrimeVue DataTable styling
  const baseClasses = 'border-b border-[var(--color-border-muted)] hover:bg-[var(--bg-elevated)]';
  return podiumClass ? `${podiumClass} ${baseClasses}` : baseClasses;
}

function handleDriverChange(): void {
  emitUpdate();
}

function handleTimeChange(): void {
  // No automatic sorting - user controls order via drag/drop
  emitUpdate();
}

function handleDnfChange(row: RaceResultFormData): void {
  // When DNF is toggled on, clear race time fields but keep fastest lap
  if (row.dnf) {
    row.original_race_time = '';
    row.original_race_time_difference = '';
    row.penalties = '';
    row._penaltyChanged = false;
  }
  // No automatic sorting - user controls order via drag/drop
  emitUpdate();
}

function handleRemoveRow(index: number): void {
  // Get the actual row from displayResults (which is what's rendered)
  const rowToRemove = displayResults.value[index];

  if (!rowToRemove) {
    return;
  }

  // Use driver_id as the key to remove the correct result
  // Filter out the result with matching driver_id instead of using index
  localResults.value = localResults.value.filter((r) => r.driver_id !== rowToRemove.driver_id);
  emitUpdate();
}

function handleAddDriver(): void {
  // Get first available driver (alphabetically)
  const firstAvailableDriver = availableDrivers.value[0];

  if (!firstAvailableDriver) {
    return;
  }

  const newRow: RaceResultFormData = {
    driver_id: firstAvailableDriver.id,
    division_id: firstAvailableDriver.division_id,
    position: null,
    original_race_time: '',
    original_race_time_difference: '',
    fastest_lap: '',
    penalties: '',
    has_fastest_lap: false,
    has_pole: false,
    dnf: false,
    _originalPenalties: '',
    _penaltyChanged: false,
  };

  localResults.value = [...localResults.value, newRow];
  emitUpdate();
}

/**
 * Handle penalty change - emit to parent for tracking
 */
function handlePenaltyChange(row: RaceResultFormData): void {
  const originalPenalty = row._originalPenalties ?? '';
  const currentPenalty = row.penalties ?? '';
  row._penaltyChanged = originalPenalty !== currentPenalty;
  emit('penalty-change', row);
}

/**
 * Handle keyboard reordering (Alt+Up/Down arrows)
 * @param event - Keyboard event
 * @param index - Index of the row
 */
function handleKeyDown(event: Event, index: number): void {
  const keyboardEvent = event as unknown as {
    altKey: boolean;
    key: string;
    preventDefault: () => void;
  };
  if (!keyboardEvent.altKey) return;

  if (keyboardEvent.key === 'ArrowUp') {
    if (index <= 0 || index >= localResults.value.length) return;
    keyboardEvent.preventDefault();
    // Move item up (swap with previous item)
    const item = localResults.value[index];
    const prevItem = localResults.value[index - 1];
    if (item && prevItem) {
      localResults.value[index - 1] = item;
      localResults.value[index] = prevItem;
      emitUpdate();
    }
  } else if (keyboardEvent.key === 'ArrowDown') {
    if (index < 0 || index >= localResults.value.length - 1) return;
    keyboardEvent.preventDefault();
    // Move item down (swap with next item)
    const item = localResults.value[index];
    const nextItem = localResults.value[index + 1];
    if (item && nextItem) {
      localResults.value[index + 1] = item;
      localResults.value[index] = nextItem;
      emitUpdate();
    }
  }
}
</script>
