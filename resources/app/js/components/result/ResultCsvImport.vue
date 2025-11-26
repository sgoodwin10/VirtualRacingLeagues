<template>
  <div class="border border-gray-200 rounded-lg p-4 bg-gray-50 max-w-3xl">
    <div class="flex items-center gap-2 mb-3">
      <PhFileCsv :size="20" class="text-gray-600" />
      <h3 class="font-medium text-gray-900">Import from CSV</h3>
    </div>

    <Textarea
      v-model="csvText"
      :rows="5"
      placeholder="Paste CSV data here...
Example:
driver,race_time,race_time_difference,fastest_lap_time
John Smith,01:23:45.678,,01:32.456
Jane Doe,,,01:33.123
Bob Wilson,,DNF,01:35.000"
      class="w-full font-mono"
      :invalid="!!parseError"
    />

    <div v-if="parseError" class="mt-2 text-sm text-red-600">
      {{ parseError }}
    </div>

    <div class="mt-3 flex items-center justify-between">
      <span class="text-sm text-gray-500">
        Expected columns: driver,
        {{
          isQualifying
            ? 'fastest_lap_time'
            : 'race_time, race_time_difference (or DNF), fastest_lap_time'
        }}
      </span>
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
import { ref } from 'vue';
import Textarea from 'primevue/textarea';
import Button from 'primevue/button';
import { PhFileCsv } from '@phosphor-icons/vue';
import type { CsvResultRow } from '@app/types/raceResult';

interface Props {
  isQualifying: boolean;
}

interface Emits {
  (e: 'parse', rows: CsvResultRow[]): void;
}

defineProps<Props>();
const emit = defineEmits<Emits>();

const csvText = ref('');
const parseError = ref<string | null>(null);
const fileInputRef = ref<HTMLInputElement | null>(null);

function handleParse(): void {
  parseError.value = null;

  try {
    const rows = parseCsv(csvText.value);
    emit('parse', rows);
  } catch (error) {
    parseError.value = error instanceof Error ? error.message : 'Failed to parse CSV';
  }
}

function parseCsv(text: string): CsvResultRow[] {
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
  const diffIndex = header.indexOf('race_time_difference');
  const fastestLapIndex = header.findIndex((h) => h === 'fastest_lap_time' || h === 'fastest_lap');

  // Ensure indices are valid
  if (raceTimeIndex === -1 && diffIndex === -1 && fastestLapIndex === -1) {
    throw new Error(
      'CSV must have at least one of: race_time, race_time_difference, or fastest_lap_time',
    );
  }

  // Parse data rows
  const results: CsvResultRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i]?.trim() ?? '';
    if (!line) continue;

    const values = line.split(',').map((v) => v.trim());
    const driver = values[driverIndex];

    if (!driver || driver === '') continue;

    const row: CsvResultRow = { driver };

    if (raceTimeIndex !== -1 && values[raceTimeIndex] !== undefined) {
      row.race_time = values[raceTimeIndex];
    }

    // Check if race_time_difference indicates DNF
    const dnfIndicators = ['dnf', 'did not finish', 'retired', 'ret', 'dns', 'dsq'];
    if (diffIndex !== -1 && values[diffIndex] !== undefined) {
      const diffValue = values[diffIndex].toLowerCase().trim();
      if (dnfIndicators.includes(diffValue)) {
        row.dnf = true;
        row.race_time_difference = ''; // Clear the time since it's DNF
      } else {
        row.race_time_difference = values[diffIndex];
      }
    }

    if (fastestLapIndex !== -1 && values[fastestLapIndex] !== undefined) {
      row.fastest_lap_time = values[fastestLapIndex];
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
  // eslint-disable-next-line no-undef
  const reader = new FileReader();

  // eslint-disable-next-line no-undef
  reader.onload = (e: ProgressEvent<FileReader>) => {
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
