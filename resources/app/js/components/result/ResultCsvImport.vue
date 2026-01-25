<template>
  <div
    class="border border-[var(--color-border-muted)] rounded-lg p-4 w-full bg-[var(--bg-highlight)]"
  >
    <div class="flex items-center gap-2 mb-3">
      <PhFileCsv :size="20" class="text-gray-600" />
      <div class="font-medium font-mono">Import from CSV</div>
    </div>

    <Textarea
      v-model="csvText"
      :rows="5"
      :placeholder="placeholderText"
      class="w-full"
      :invalid="!!parseError"
    />

    <div v-if="parseError" class="mt-2 text-sm text-red-600">
      {{ parseError }}
    </div>

    <div class="mt-3 space-y-3">
      <div class="space-y-2">
        <p class="font-medium">Minimum Required Headers:</p>
        <div class="flex flex-row gap-2 w-full">
          <div
            class="bg-[var(--bg-elevated)] border border-[var(--border)] rounded-lg p-3 overflow-x-auto flex-1"
          >
            <code class="font-mono text-sm text-[var(--text-accent)]">{{
              requiredHeadersDisplay
            }}</code>
          </div>
          <Button label="Add Headers" size="lg" variant="outline" @click="addHeaders" />
        </div>
      </div>

      <div class="flex items-center justify-end gap-2">
        <input
          ref="fileInputRef"
          type="file"
          accept=".csv,text/csv"
          class="hidden"
          @change="handleFileSelect"
        />
        <Button label="Download Example" size="sm" variant="secondary" @click="downloadExample" />
        <Button
          label="Upload CSV"
          :icon="PhUpload"
          size="sm"
          variant="primary"
          @click="triggerFileInput"
        />
        <Button
          label="Parse CSV"
          :icon="PhCheck"
          size="sm"
          :disabled="!csvText.trim()"
          @click="handleParse"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import Papa from 'papaparse';
import Textarea from 'primevue/textarea';
import { Button } from '@app/components/common/buttons';
import { PhFileCsv, PhUpload, PhCheck } from '@phosphor-icons/vue';
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
Driver
John Smith
Jane Doe
Bob Wilson`;
  } else if (props.isQualifying) {
    // Qualifying with race times required - need driver and FastestLapTime
    return `Paste CSV data here. Example:
Driver,FastestLapTime
John Smith,01:32.456
Jane Doe,01:33.123
Bob Wilson,01:35.000`;
  } else {
    // Race with times required - need time columns
    return `Paste CSV data here. Example:
Driver,RaceTime,RaceTimeDifference,FastestLapTime
John Smith,01:23:45.678,,01:32.456
Jane Doe,,,01:33.123
Bob Wilson,,DNF,01:35.000`;
  }
});

const requiredHeadersDisplay = computed(() => {
  if (!props.raceTimesRequired) {
    return 'Driver';
  } else if (props.isQualifying) {
    return 'Driver,FastestLapTime';
  } else {
    return 'Driver,RaceTime,RaceTimeDifference,FastestLapTime';
  }
});

/**
 * Generate example CSV content for download
 */
const exampleCsvContent = computed(() => {
  if (!props.raceTimesRequired) {
    return `Driver
John Smith
Jane Doe
Bob Wilson`;
  } else if (props.isQualifying) {
    return `Driver,FastestLapTime
John Smith,01:32.456
Jane Doe,01:33.123
Bob Wilson,01:35.000`;
  } else {
    return `Driver,RaceTime,RaceTimeDifference,FastestLapTime
John Smith,01:23:45.678,,01:32.456
Jane Doe,,,01:33.123
Bob Wilson,,DNF,01:35.000`;
  }
});

/**
 * Download example CSV file
 */
function downloadExample(): void {
  const blob = new globalThis.Blob([exampleCsvContent.value], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = props.isQualifying
    ? 'qualifying-results-example.csv'
    : 'race-results-example.csv';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

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
  return match && match[1] ? parseInt(match[1], 10) : null;
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
  // Parse CSV using papaparse
  const parseResult = Papa.parse(text, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header: string) => header.trim().toLowerCase(),
  });

  if (parseResult.errors.length > 0) {
    console.warn('CSV parsing errors:', parseResult.errors);
    // Continue anyway - papaparse will have parsed what it could
  }

  const rows = parseResult.data as Record<string, string>[];

  if (rows.length === 0) {
    throw new Error('CSV must have at least a header row and one data row');
  }

  // Get headers (already lowercase from transformHeader)
  const headers = parseResult.meta.fields || [];
  const driverField = headers.find((h) => h === 'driver');

  if (!driverField) {
    throw new Error('CSV must have a "Driver" column');
  }

  // Support both PascalCase and snake_case for backward compatibility
  // PascalCase: RaceTime, RaceTimeDifference, FastestLapTime
  // Legacy snake_case: race_time, original_race_time_difference, fastest_lap_time
  const raceTimeField = headers.find((h) => h === 'racetime' || h === 'race_time');
  const diffField = headers.find(
    (h) => h === 'racetimedifference' || h === 'original_race_time_difference',
  );
  const fastestLapField = headers.find(
    (h) => h === 'fastestlaptime' || h === 'fastest_lap_time' || h === 'fastest_lap',
  );

  // Validation logic depends on context:
  // 1. If race times are NOT required: only Driver column is needed (already validated above)
  // 2. For qualifiers with race times required: only Driver and FastestLapTime are required
  // 3. For races with race times required: need RaceTime OR RaceTimeDifference (at minimum)
  if (raceTimesRequired) {
    if (isQualifying) {
      // Qualifiers only require FastestLapTime when race times are enabled
      if (!fastestLapField) {
        throw new Error(
          'CSV must have a "FastestLapTime" column for qualifying sessions (legacy format "fastest_lap_time" also supported)',
        );
      }
    } else {
      // Races with times required need at least one time column
      if (!raceTimeField && !diffField && !fastestLapField) {
        throw new Error(
          'CSV must have at least one of: RaceTime, RaceTimeDifference, or FastestLapTime (legacy snake_case formats also supported)',
        );
      }
    }
  }
  // If race times are NOT required, only Driver column is needed (already validated above)

  // Parse data rows
  const results: CsvResultRow[] = [];
  const errors: string[] = [];
  const dnfIndicators = ['dnf', 'did not finish', 'retired', 'ret', 'dns', 'dsq'];

  rows.forEach((csvRow, index) => {
    const driver = csvRow[driverField]?.trim().replace(/\+/g, '');
    if (!driver || driver === '') return;

    const row: CsvResultRow = { driver };

    // Race time
    if (raceTimeField && csvRow[raceTimeField]) {
      const value = csvRow[raceTimeField]?.trim().replace(/\+/g, '');
      if (value) {
        row.race_time = value;
      }
    }

    // Fastest lap time
    if (fastestLapField && csvRow[fastestLapField]) {
      const value = csvRow[fastestLapField]?.trim().replace(/\+/g, '');
      if (value) {
        row.fastest_lap_time = value;
      }
    }

    // Check if original_race_time_difference indicates DNF or lap count
    if (diffField && csvRow[diffField]) {
      const diffValue = csvRow[diffField]?.trim().replace(/\+/g, '') ?? '';

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
              errors.push(
                `Row ${index + 2} (${driver}): ${error instanceof Error ? error.message : 'Failed to calculate time from laps'}`,
              );
              return; // Skip this row and continue with the next one
            }
          } else {
            // Store the time difference
            row.original_race_time_difference = diffValue;
          }
        }
      }
    }

    results.push(row);
  });

  // If there were errors during parsing, throw with all collected errors
  if (errors.length > 0) {
    throw new Error(`CSV parsing errors:\n${errors.join('\n')}`);
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

/**
 * Add minimum required headers to the textarea
 * Inserts at the top if data already exists
 */
function addHeaders(): void {
  const headers = requiredHeadersDisplay.value;
  if (csvText.value.trim()) {
    csvText.value = headers + '\n' + csvText.value;
  } else {
    csvText.value = headers;
  }
}
</script>
