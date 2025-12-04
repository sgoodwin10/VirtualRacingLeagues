<template>
  <div class="overflow-x-auto">
    <table class="w-full">
      <thead class="bg-gray-100">
        <tr>
          <!-- Drag handle column (only shown in no-times edit mode) -->
          <th
            v-if="!readOnly && !raceTimesRequired"
            class="px-2 py-2 text-center font-medium text-gray-700 w-8"
          ></th>
          <th class="px-2 py-2 text-center font-medium text-gray-700 w-6">#</th>
          <th class="px-2 py-2 text-left font-medium text-gray-700 min-w-[200px]">Driver</th>
          <!-- Time columns (hidden in no-times mode) -->
          <th
            v-if="!isQualifying && raceTimesRequired"
            class="px-2 py-2 text-right font-medium text-gray-700 w-42"
          >
            Race Time
          </th>
          <th
            v-if="!isQualifying && raceTimesRequired"
            class="px-2 py-2 text-right font-medium text-gray-700 w-42"
          >
            Time Diff
          </th>
          <!-- Fastest Lap column: Show for qualifying OR for races with times -->
          <th
            v-if="isQualifying || raceTimesRequired"
            class="px-2 py-2 text-right font-medium text-gray-700 w-42"
            :class="{ 'pr-6': isQualifying }"
          >
            {{ isQualifying ? 'Lap Time' : 'Fastest Lap' }}
          </th>
          <th
            v-if="!isQualifying && raceTimesRequired"
            class="px-2 py-2 text-right font-medium text-gray-700 w-42"
          >
            Penalties
          </th>
          <!-- DNF/FL column -->
          <th v-if="!isQualifying" class="px-2 py-2 text-right font-medium text-gray-700 w-20">
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
            class="px-2 py-2 text-center font-medium text-gray-700 w-20"
          >
            Pole
          </th>
          <th v-if="!readOnly" class="px-2 py-2 text-center font-medium text-gray-700 w-4"></th>
        </tr>
      </thead>
      <!-- Draggable tbody for no-times mode -->
      <draggable
        v-if="!readOnly && !raceTimesRequired"
        v-model="localResults"
        tag="tbody"
        item-key="driver_id"
        handle=".drag-handle"
        @end="onDragEnd"
      >
        <template #item="{ element: row, index }">
          <tr
            :class="[
              'border-b border-gray-100',
              row.dnf ? 'bg-red-50' : 'hover:bg-gray-50',
              index === 0 && sortedFinishers.length > 0 && row.dnf
                ? 'border-t-2 border-red-200'
                : '',
            ]"
          >
            <!-- Drag handle -->
            <td class="px-2 py-2 text-center">
              <PhDotsSixVertical
                :size="20"
                class="drag-handle cursor-move text-gray-400 hover:text-gray-600"
              />
            </td>
            <td class="px-2 py-2 text-gray-500 text-center">{{ index + 1 }}</td>
            <td class="px-2 py-2">
              <Select
                v-model="row.driver_id"
                :options="getAvailableDrivers(row.driver_id)"
                option-label="name"
                option-value="id"
                placeholder="Select driver"
                class="w-full"
                filter
                @change="handleDriverChange"
              />
            </td>
            <!-- DNF and FL checkboxes side by side -->
            <td class="px-2 py-2 text-center">
              <div class="flex justify-center gap-6">
                <Checkbox
                  v-model="row.dnf"
                  :binary="true"
                  @change.stop="() => handleDnfChangeNoTimes(row)"
                />
                <Checkbox v-model="row.has_fastest_lap" :binary="true" />
              </div>
            </td>
            <td v-if="isQualifying" class="px-2 py-2 text-center">
              <Checkbox v-model="row.has_pole" :binary="true" />
            </td>
            <td class="px-2 py-2 text-center">
              <Button
                icon="pi pi-trash"
                size="small"
                severity="danger"
                text
                @click="handleRemoveRow(index)"
              />
            </td>
          </tr>
        </template>
      </draggable>
      <!-- Standard tbody for times-required mode -->
      <tbody v-else>
        <tr
          v-for="(row, index) in displayResults"
          :key="row.driver_id ?? `empty-${index}`"
          :class="['border-b border-gray-100', getRowClass(index) || 'hover:bg-gray-50']"
        >
          <td class="px-2 py-2 text-gray-500 text-center">{{ index + 1 }}</td>
          <td class="px-2 py-2">
            <!-- Read-only: show driver name as text -->
            <template v-if="readOnly">
              <span class="text-gray-900">{{ getDriverName(row.driver_id) }}</span>
            </template>
            <!-- Edit mode: show select dropdown -->
            <template v-else>
              <Select
                v-model="localResults[index]!.driver_id"
                :options="getAvailableDrivers(row.driver_id)"
                option-label="name"
                option-value="id"
                placeholder="Select driver"
                class="w-full"
                filter
                @change="handleDriverChange"
              />
            </template>
          </td>
          <td v-if="!isQualifying" class="px-2 py-2 text-end">
            <!-- Read-only: show time as text -->
            <template v-if="readOnly">
              <span class="text-gray-900 font-mono">{{ formatRaceTime(row.race_time) }}</span>
            </template>
            <!-- Edit mode: show input -->
            <template v-else>
              <ResultTimeInput
                v-model="localResults[index]!.race_time"
                placeholder="00:00:00.000"
                @update:model-value="handleTimeChange"
              />
            </template>
          </td>
          <td v-if="!isQualifying" class="px-2 py-2 text-end">
            <!-- Read-only: show time diff as text -->
            <template v-if="readOnly">
              <span
                v-if="row.race_time_difference !== null && row.race_time_difference !== ''"
                class="text-gray-900 font-mono"
                >+{{ formatRaceTime(row.race_time_difference) }}</span
              >
            </template>
            <!-- Edit mode: show input -->
            <template v-else>
              <ResultTimeInput
                v-model="localResults[index]!.race_time_difference"
                placeholder="+00:00:00.000"
                @update:model-value="handleTimeChange"
              />
            </template>
          </td>
          <td class="px-2 py-2 text-end" :class="{ 'pr-6': isQualifying }">
            <!-- Read-only: show fastest lap as text -->
            <template v-if="readOnly">
              <Tag
                v-if="row.has_fastest_lap && !isQualifying"
                value="FL"
                class="text-xs bg-purple-500 text-white mr-1"
                :pt="{ root: { class: 'bg-purple-500 text-white border-purple-600' } }"
              />
              <span
                class="font-mono"
                :class="{
                  'text-purple-600': row.has_pole || row.has_fastest_lap,
                  'text-gray-900': !row.has_fastest_lap,
                }"
                >{{ formatRaceTime(row.fastest_lap) }}</span
              >
            </template>
            <!-- Edit mode: show input -->
            <template v-else>
              <ResultTimeInput
                v-model="localResults[index]!.fastest_lap"
                placeholder="00:00:00.000"
                @update:model-value="handleTimeChange"
              />
            </template>
          </td>
          <td v-if="!isQualifying" class="px-2 py-2 text-end">
            <!-- Read-only: show penalties as text -->
            <template v-if="readOnly">
              <span class="text-gray-900 font-mono">{{ formatRaceTime(row.penalties) }}</span>
            </template>
            <!-- Edit mode: show input -->
            <template v-else>
              <ResultTimeInput
                v-model="localResults[index]!.penalties"
                placeholder="00:00:00.000"
                @update:model-value="handleTimeChange"
              />
            </template>
          </td>
          <td v-if="!isQualifying" class="px-2 py-2 text-center">
            <!-- Read-only: show status -->
            <template v-if="readOnly">
              <span v-if="row.dnf" class="text-red-600 font-medium">DNF</span>
              <span v-else class="text-gray-400">-</span>
            </template>
            <!-- Edit mode: show checkbox -->
            <template v-else>
              <Checkbox
                v-model="localResults[index]!.dnf"
                :binary="true"
                @change.stop="() => handleDnfChange(localResults[index]!)"
              />
            </template>
          </td>
          <td v-if="!readOnly" class="px-2 py-2 text-center">
            <Button
              icon="pi pi-trash"
              size="small"
              severity="danger"
              text
              @click="handleRemoveRow(index)"
            />
          </td>
        </tr>
      </tbody>
    </table>

    <!-- Add Driver Button (hidden in read-only mode) -->
    <div v-if="!readOnly" class="mt-4 flex justify-center">
      <Button
        label="Add Driver"
        icon="pi pi-plus"
        size="small"
        outlined
        :disabled="isAddDriverDisabled"
        @click="handleAddDriver"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, nextTick } from 'vue';
import draggable from 'vuedraggable';
import { PhDotsSixVertical } from '@phosphor-icons/vue';
import Select from 'primevue/select';
import Button from 'primevue/button';
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
}

const props = withDefaults(defineProps<Props>(), {
  readOnly: false,
  raceTimesRequired: true,
});
const emit = defineEmits<Emits>();

const { sortResultsByTime } = useRaceTimeCalculation();
const { formatRaceTime } = useTimeFormat();

// Local results for both drag-and-drop and times-required modes
const localResults = ref<RaceResultFormData[]>([...props.results]);

// Flag to prevent watch from overwriting during internal updates
let isInternalUpdate = false;

// Watch for changes to props.results and update localResults
watch(
  () => props.results,
  (newResults) => {
    if (!isInternalUpdate) {
      localResults.value = [...newResults];
    }
  },
  { deep: true },
);

/**
 * Check if a result row has meaningful data to display
 * A row is considered to have data if it has race_time, fastest_lap, or DNF
 */
function hasResultData(row: RaceResultFormData): boolean {
  return Boolean(row.race_time || row.fastest_lap || row.dnf);
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
 * Emit updated results with internal update flag to prevent watch race conditions
 */
function emitUpdate(): void {
  isInternalUpdate = true;
  emit('update:results', [...localResults.value]);
  nextTick(() => {
    isInternalUpdate = false;
  });
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
    if (index !== -1) {
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
  }
  emitUpdate();
}

/**
 * Display results for the template
 * In read-only mode: filters and sorts data from props for display
 * In edit mode: uses localResults to avoid prop mutation
 */
const displayResults = computed(() => {
  if (props.readOnly) {
    // In read-only mode, filter out drivers without any result data
    const resultsToProcess = props.results.filter(hasResultData);

    // Check if times-required mode
    if (props.raceTimesRequired) {
      // Check if any results have times entered - if not, keep original order
      const hasAnyTimes = resultsToProcess.some((r) =>
        props.isQualifying ? r.fastest_lap : r.race_time || r.race_time_difference,
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

      // Return non-DNF first, then DNF at the bottom
      return [...nonDnfResults, ...dnfResults];
    }

    return resultsToProcess;
  }

  // In edit mode, always use localResults to avoid prop mutation
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

function getAvailableDrivers(currentDriverId: number | null): DriverOption[] {
  return props.drivers.map((driver) => ({
    ...driver,
    disabled: driver.id !== currentDriverId && props.selectedDriverIds.has(driver.id),
  }));
}

function getDriverName(driverId: number | null): string {
  if (driverId === null) return '-';
  const driver = props.drivers.find((d) => d.id === driverId);
  return driver?.name ?? '-';
}

/**
 * Get row class for podium styling in read-only mode
 * Position is 1-indexed (index + 1)
 */
function getRowClass(index: number): string {
  if (!props.readOnly) return '';
  return getPodiumRowClass(index + 1);
}

function handleDriverChange(): void {
  emitUpdate();
}

function handleTimeChange(): void {
  emitUpdate();
}

function handleDnfChange(row: RaceResultFormData): void {
  // When DNF is toggled on, clear race time fields but keep fastest lap
  if (row.dnf) {
    row.race_time = '';
    row.race_time_difference = '';
    row.penalties = '';
  }

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
    race_time: '',
    race_time_difference: '',
    fastest_lap: '',
    penalties: '',
    has_fastest_lap: false,
    has_pole: false,
    dnf: false,
  };

  localResults.value = [...localResults.value, newRow];
  emitUpdate();
}
</script>
