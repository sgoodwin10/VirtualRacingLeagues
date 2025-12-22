<template>
  <div class="border border-gray-200 rounded-lg p-4 bg-gray-50 w-full">
    <div class="flex items-center gap-2 mb-3">
      <PhFileCsv :size="20" class="text-gray-600" />
      <h3 class="font-medium text-gray-900">Import from CSV</h3>
    </div>

    <Textarea
      v-model="csvText"
      :rows="5"
      :placeholder="placeholderText"
      class="w-full font-mono"
      :invalid="!!parseError"
    />

    <div v-if="parseError" class="mt-2 text-sm text-red-600">
      {{ parseError }}
    </div>

    <div class="mt-3 flex items-center justify-between">
      <span class="text-sm text-gray-500" v-html="expectedColumnsText"> </span>
      <div class="flex gap-2">
        <input
          ref="fileInputRef"
          type="file"
          accept=".csv,text/csv"
          class="hidden"
          @change="handleFileSelect"
        />
        <Button
          label="Upload CSV"
          icon="pi pi-upload"
          size="small"
          severity="secondary"
          @click="triggerFileInput"
        />
        <Button
          label="Parse CSV"
          icon="pi pi-check"
          size="small"
          :disabled="!csvText.trim()"
          @click="handleParse"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import Textarea from 'primevue/textarea';
import Button from 'primevue/button';
import { PhFileCsv } from '@phosphor-icons/vue';
import type { CsvResultRow } from '@app/types/raceResult';
import { useRaceTimeCalculation } from '@app/composables/useRaceTimeCalculation';

interface Props {
  isQualifying: boolean;
  raceTimesRequired: boolean;
}

interface Emits {
  (e: 'parse', rows: CsvResultRow[]): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const csvText = ref('');
const parseError = ref<string | null>(null);
const fileInputRef = ref<HTMLInputElement | null>(null);

const { parseTimeToMs, formatMsToTime, normalizeTimeInput } = useRaceTimeCalculation();

/**
 * Time penalty per lap when calculating race time from laps down.
 * Adds 500ms (0.5s) to the fastest lap time to account for the fact that drivers
 * who are lapped are typically slower than the race leader's fastest lap pace.
 * This provides a more realistic estimated race time for lapped drivers.
 */
const LAP_TIME_PENALTY_MS = 500;

// Computed properties for dynamic text based on context
const placeholderText = computed(() => {
  if (!props.raceTimesRequired) {
    // Race times not required - only need driver
    return `Paste CSV data here. Example:
driver
John Smith
Jane Doe
Bob Wilson`;
  } else if (props.isQualifying) {
    // Qualifying with race times required - need driver and fastest_lap_time
    return `Paste CSV data here. Example:
driver,fastest_lap_time
John Smith,01:32.456
Jane Doe,01:33.123
Bob Wilson,01:35.000`;
  } else {
    // Race with times required - need time columns
    return `Paste CSV data here. Example:
driver,race_time,original_race_time_difference,fastest_lap_time
John Smith,01:23:45.678,,01:32.456
Jane Doe,,,01:33.123
Bob Wilson,,DNF,01:35.000`;
  }
});

const expectedColumnsText = computed(() => {
  if (!props.raceTimesRequired) {
    return 'Required Column Headers: driver (`fastest_lap_time` optional)';
  } else if (props.isQualifying) {
    return 'Required Column Headers: driver, fastest_lap_time';
  } else {
    return 'Required Column Headers: driver, race_time, original_race_time_difference, fastest_lap_time <br /> Data can be blank if not applicable';
  }
});

function handleParse(): void {
  parseError.value = null;

  try {
    const rows = parseCsv(csvText.value, props.isQualifying, props.raceTimesRequired);
    emit('parse', rows);
  } catch (error) {
    parseError.value = error instanceof Error ? error.message : 'Failed to parse CSV';
  }
}

/**
 * Check if a value is in "X lap" or "X laps" format
 * Returns the number of laps if matched, otherwise null
 */
function parseLapFormat(value: string): number | null {
  const lapPattern = /^(\d+)\s*laps?$/i;
  const match = value.trim().match(lapPattern);
  return match ? parseInt(match[1] || '0', 10) : null;
}

/**
 * Calculate race time based on laps down
 * Formula: (fastest_lap_ms + 500ms) * number_of_laps
 */
function calculateRaceTimeFromLaps(fastestLapTime: string | undefined, lapsDown: number): string {
  if (!fastestLapTime) {
    throw new Error('Cannot calculate race time from laps: fastest lap time is required');
  }

  // Normalize the time format first (e.g., "01:30.000" -> "00:01:30.000")
  const normalizedTime = normalizeTimeInput(fastestLapTime);
  const fastestLapMs = parseTimeToMs(normalizedTime);

  if (fastestLapMs === null) {
    throw new Error('Cannot calculate race time from laps: invalid fastest lap time format');
  }

  // Add penalty to the fastest lap, then multiply by number of laps
  const calculatedMs = (fastestLapMs + LAP_TIME_PENALTY_MS) * lapsDown;
  return formatMsToTime(calculatedMs);
}

function parseCsv(text: string, isQualifying: boolean, raceTimesRequired: boolean): CsvResultRow[] {
  const lines = text.trim().split('\n');
  if (lines.length < 2) {
    throw new Error('CSV must have at least a header row and one data row');
  }

  // Parse header
  const header = lines[0]?.split(',').map((h) => h.trim().toLowerCase()) ?? [];
  const driverIndex = header.indexOf('driver');

  if (driverIndex === -1) {
    throw new Error('CSV must have a "driver" column');
  }

  const raceTimeIndex = header.indexOf('race_time');
  const diffIndex = header.indexOf('original_race_time_difference');
  const fastestLapIndex = header.findIndex((h) => h === 'fastest_lap_time' || h === 'fastest_lap');

  // Validation logic depends on context:
  // 1. If race times are NOT required: only driver column is needed (already validated above)
  // 2. For qualifiers with race times required: only driver and fastest_lap_time are required
  // 3. For races with race times required: need race_time OR original_race_time_difference (at minimum)
  if (raceTimesRequired) {
    if (isQualifying) {
      // Qualifiers only require fastest_lap_time when race times are enabled
      if (fastestLapIndex === -1) {
        throw new Error('CSV must have a "fastest_lap_time" column for qualifying sessions');
      }
    } else {
      // Races with times required need at least one time column
      if (raceTimeIndex === -1 && diffIndex === -1 && fastestLapIndex === -1) {
        throw new Error(
          'CSV must have at least one of: race_time, original_race_time_difference, or fastest_lap_time',
        );
      }
    }
  }
  // If race times are NOT required, only driver column is needed (already validated above)

  // Parse data rows
  const results: CsvResultRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i]?.trim() ?? '';
    if (!line) continue;

    // Split and clean values: trim whitespace and remove + characters
    const values = line.split(',').map((v) => v.trim().replace(/\+/g, ''));

    // Check bounds before accessing driver index
    if (driverIndex >= values.length) continue;

    const driver = values[driverIndex];
    if (!driver || driver === '') continue;

    const row: CsvResultRow = { driver };

    // Check bounds before accessing race_time index
    if (raceTimeIndex !== -1 && raceTimeIndex < values.length) {
      const value = values[raceTimeIndex];
      if (value !== undefined && value.trim() !== '') {
        row.race_time = value.trim();
      }
    }

    // Get fastest lap time first (needed for lap-based calculations)
    // Check bounds before accessing fastest_lap index
    if (fastestLapIndex !== -1 && fastestLapIndex < values.length) {
      const value = values[fastestLapIndex];
      if (value !== undefined && value.trim() !== '') {
        row.fastest_lap_time = value.trim();
      }
    }

    // Check if original_race_time_difference indicates DNF or lap count
    const dnfIndicators = ['dnf', 'did not finish', 'retired', 'ret', 'dns', 'dsq'];
    if (diffIndex !== -1 && diffIndex < values.length) {
      const diffValue = values[diffIndex]?.trim() ?? '';

      // Only process if diffValue is not empty
      if (diffValue !== '') {
        const diffValueLower = diffValue.toLowerCase();

        if (dnfIndicators.includes(diffValueLower)) {
          row.dnf = true;
          row.original_race_time_difference = ''; // Clear the time since it's DNF
        } else {
          // Check if it's in "X lap" or "X laps" format
          const lapsDown = parseLapFormat(diffValue);

          if (lapsDown !== null) {
            // Calculate race time based on laps and fastest lap
            try {
              const calculatedTime = calculateRaceTimeFromLaps(row.fastest_lap_time, lapsDown);
              row.original_race_time_difference = calculatedTime;
            } catch (error) {
              throw new Error(
                `Row ${i} (${driver}): ${error instanceof Error ? error.message : 'Failed to calculate time from laps'}`,
              );
            }
          } else {
            // Store the time difference (+ characters already removed during parsing)
            row.original_race_time_difference = diffValue;
          }
        }
      }
    }

    results.push(row);
  }

  if (results.length === 0) {
    throw new Error('No valid data rows found in CSV');
  }

  return results;
}

function triggerFileInput(): void {
  parseError.value = null;
  fileInputRef.value?.click();
}

function handleFileSelect(event: Event): void {
  parseError.value = null;

  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];

  if (!file) {
    return;
  }

  // Validate file size (5MB max)
  const maxFileSizeBytes = 5 * 1024 * 1024; // 5MB in bytes
  if (file.size > maxFileSizeBytes) {
    parseError.value = 'File size must not exceed 5MB';
    target.value = ''; // Reset file input
    return;
  }

  // Validate file is a CSV
  const validTypes = ['text/csv', 'application/csv', 'text/plain'];
  const validExtensions = ['.csv'];
  const hasValidExtension = validExtensions.some((ext) => file.name.toLowerCase().endsWith(ext));
  const hasValidType = validTypes.includes(file.type);

  if (!hasValidExtension && !hasValidType) {
    parseError.value = 'Please select a valid CSV file';
    target.value = ''; // Reset file input
    return;
  }

  // Read the file
  const reader: FileReader = new FileReader();

  reader.onload = (e: ProgressEvent<FileReader>): void => {
    const contents = e.target?.result;

    if (typeof contents === 'string') {
      csvText.value = contents;
    } else {
      parseError.value = 'Failed to read file contents';
    }

    // Reset file input so the same file can be selected again
    target.value = '';
  };

  reader.onerror = () => {
    parseError.value = 'Failed to read file';
    target.value = '';
  };

  reader.readAsText(file);
}
</script>
