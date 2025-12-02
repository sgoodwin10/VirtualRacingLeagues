<template>
  <div class="overflow-x-auto">
    <table class="w-full">
      <thead class="bg-gray-100">
        <tr>
          <th class="px-2 py-2 text-center font-medium text-gray-700 w-6">#</th>
          <th class="px-2 py-2 text-left font-medium text-gray-700 min-w-[200px]">Driver</th>
          <th v-if="!isQualifying" class="px-2 py-2 text-right font-medium text-gray-700 w-42">
            Race Time
          </th>
          <th v-if="!isQualifying" class="px-2 py-2 text-right font-medium text-gray-700 w-42">
            Time Diff
          </th>
          <th class="px-2 py-2 text-right font-medium text-gray-700 w-42">
            {{ isQualifying ? 'Lap Time' : 'Fastest Lap' }}
          </th>
          <th v-if="!isQualifying" class="px-2 py-2 text-right font-medium text-gray-700 w-42">
            Penalties
          </th>
          <th v-if="!isQualifying" class="px-2 py-2 text-right font-medium text-gray-700 w-20">
            DNF
          </th>
          <th v-if="!readOnly" class="px-2 py-2 text-center font-medium text-gray-700 w-4"></th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="(row, index) in sortedResults"
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
                v-model="row.driver_id"
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
                v-model="row.race_time"
                placeholder="00:00:00.000"
                @update:model-value="handleTimeChange"
              />
            </template>
          </td>
          <td v-if="!isQualifying" class="px-2 py-2 text-end">
            <!-- Read-only: show time diff as text -->
            <template v-if="readOnly">
              <span v-if="row.race_time_difference !== null && row.race_time_difference !== ''" class="text-gray-900 font-mono">+{{
                formatRaceTime(row.race_time_difference)
              }}</span>
            </template>
            <!-- Edit mode: show input -->
            <template v-else>
              <ResultTimeInput
                v-model="row.race_time_difference"
                placeholder="+00:00:00.000"
                @update:model-value="handleTimeChange"
              />
            </template>
          </td>
          <td class="px-2 py-2 text-end">
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
                v-model="row.fastest_lap"
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
                v-model="row.penalties"
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
                v-model="row.dnf"
                :binary="true"
                @change.stop="() => handleDnfChange(row)"
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
import { computed } from 'vue';
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
}

interface Emits {
  (e: 'update:results', results: RaceResultFormData[]): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const { sortResultsByTime } = useRaceTimeCalculation();
const { formatRaceTime } = useTimeFormat();

/**
 * Check if a result row has meaningful data to display
 * A row is considered to have data if it has race_time, fastest_lap, or DNF
 */
function hasResultData(row: RaceResultFormData): boolean {
  return Boolean(row.race_time || row.fastest_lap || row.dnf);
}

const sortedResults = computed(() => {
  // In read-only mode, filter out drivers without any result data
  const resultsToProcess = props.readOnly ? props.results.filter(hasResultData) : props.results;

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
  emit('update:results', props.results);
}

function handleTimeChange(): void {
  emit('update:results', props.results);
}

function handleDnfChange(row: RaceResultFormData): void {
  // When DNF is toggled on, clear race time fields but keep fastest lap
  if (row.dnf) {
    row.race_time = '';
    row.race_time_difference = '';
    row.penalties = '';
  }

  emit('update:results', props.results);
}

function handleRemoveRow(index: number): void {
  // Get the actual row from sortedResults (which is what's rendered)
  const rowToRemove = sortedResults.value[index];

  if (!rowToRemove) {
    return;
  }

  // Find the index in the original props.results array
  const originalIndex = props.results.findIndex((r) => r.driver_id === rowToRemove.driver_id);

  if (originalIndex === -1) {
    return;
  }

  const updatedResults = [...props.results];
  updatedResults.splice(originalIndex, 1);
  emit('update:results', updatedResults);
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

  const updatedResults = [...props.results, newRow];
  emit('update:results', updatedResults);
}
</script>
