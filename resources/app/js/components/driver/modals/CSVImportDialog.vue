<script setup lang="ts">
import { ref, watch, computed, onMounted, onUnmounted } from 'vue';
import { useMemoize } from '@vueuse/core';
import Papa from 'papaparse';
import BaseModal from '@app/components/common/modals/BaseModal.vue';
import Textarea from 'primevue/textarea';
import { Button } from '@app/components/common/buttons';
import Message from 'primevue/message';
import FormInputGroup from '@app/components/common/forms/FormInputGroup.vue';
import FormLabel from '@app/components/common/forms/FormLabel.vue';
import FormHelper from '@app/components/common/forms/FormHelper.vue';
import { useLeagueStore } from '@app/stores/leagueStore';
import type { ImportDriversResponse } from '@app/types/driver';
import BaseModalHeader from '@app/components/common/modals/BaseModalHeader.vue';

interface Props {
  visible: boolean;
  leagueId: number;
  onImport: (csvData: string) => Promise<ImportDriversResponse>;
}

interface Emits {
  (e: 'update:visible', value: boolean): void;
  (e: 'close'): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const leagueStore = useLeagueStore();

const csvData = ref('');
const importing = ref(false);
const importResult = ref<ImportDriversResponse | null>(null);
const error = ref<string | null>(null);

/**
 * Convert snake_case to PascalCase
 * If already PascalCase (no underscores), return as-is
 */
const toPascalCase = (str: string): string => {
  if (!str.includes('_')) {
    // Already PascalCase or single word - return as-is
    return str;
  }
  return str
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('');
};

/**
 * Memoized function to generate CSV example based on platform headers
 * This prevents expensive recalculations on every access
 */
const generateCsvExample = useMemoize((platformHeaders: typeof leagueStore.platformCsvHeaders) => {
  if (platformHeaders.length === 0) {
    // Fallback example if headers not loaded yet
    return `Nickname,DiscordID,DriverNumber
John Smith,john#1234,5
Jane Doe,jane#5678,7
Mike Ross,,3`;
  }

  // Build headers: Nickname, DiscordID + platform ID columns + DriverNumber (optional)
  const headers = [
    'Nickname',
    'DiscordID',
    ...platformHeaders.map((h) => toPascalCase(h.field)),
    'DriverNumber',
  ];

  // Generate example data rows based on the platform columns
  const exampleRows: string[][] = [];

  // Example 1: Full data with both nickname and Discord ID
  const row1 = ['John Smith', 'john#1234'];
  platformHeaders.forEach((header) => {
    const field = toPascalCase(header.field);
    if (field === 'PsnId') {
      row1.push('john_psn_123');
    } else if (field === 'IracingId') {
      row1.push('john_iracing');
    } else if (field === 'IracingCustomerId') {
      row1.push('123456');
    } else {
      row1.push('john_' + field);
    }
  });
  row1.push('5'); // DriverNumber
  exampleRows.push(row1);

  // Example 2: Driver with Discord ID only (no nickname)
  const row2 = ['', 'jane#5678'];
  platformHeaders.forEach((header) => {
    const field = toPascalCase(header.field);
    if (field === 'PsnId') {
      row2.push('jane_psn_456');
    } else if (field === 'IracingId') {
      row2.push('jane_iracing');
    } else if (field === 'IracingCustomerId') {
      row2.push('789012');
    } else {
      row2.push('jane_' + field);
    }
  });
  row2.push('7'); // DriverNumber
  exampleRows.push(row2);

  // Example 3: Driver with nickname only (no Discord ID)
  const row3 = ['Mike Ross', ''];
  platformHeaders.forEach((header) => {
    const field = toPascalCase(header.field);
    if (field === 'PsnId') {
      row3.push('mike_psn_789');
    } else if (field === 'IracingId') {
      row3.push('mike_iracing');
    } else if (field === 'IracingCustomerId') {
      row3.push('345678');
    } else {
      row3.push('mike_' + field);
    }
  });
  row3.push(''); // Empty DriverNumber to show it's optional
  exampleRows.push(row3);

  // Format as CSV
  const headerRow = headers.join(',');
  const dataRows = exampleRows.map((row) => row.join(','));

  return `${headerRow}\n${dataRows.join('\n')}`;
});

// Generate CSV example dynamically based on league's platform headers
// Uses memoization to prevent expensive recalculations
const csvExample = computed(() => generateCsvExample(leagueStore.platformCsvHeaders));

/**
 * Group CSV headers by platform for display purposes
 * Returns a map of platform names to their respective headers
 */
const headersByPlatform = computed(() => {
  const grouped = new Map<string, typeof leagueStore.platformCsvHeaders>();

  leagueStore.platformCsvHeaders.forEach((header) => {
    const existing = grouped.get(header.platform_name) || [];
    grouped.set(header.platform_name, [...existing, header]);
  });

  return grouped;
});

// Watch for visible changes to reset form
watch(
  () => props.visible,
  (visible) => {
    if (visible) {
      resetForm();
    }
  },
);

/**
 * Process CSV data to handle missing nicknames
 * If nickname is empty, use Discord ID as fallback
 * Uses papaparse to properly handle quoted values with commas
 */
const processCSVData = (csvData: string): string => {
  // Parse CSV using papaparse
  const parseResult = Papa.parse(csvData, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header: string) => header.trim(),
  });

  if (parseResult.errors.length > 0) {
    // If there are parsing errors, return original data
    console.warn('CSV parsing errors:', parseResult.errors);
    return csvData;
  }

  const rows = parseResult.data as Record<string, string>[];

  // Find nickname and Discord ID column names (case-insensitive)
  const headers = parseResult.meta.fields || [];
  const nicknameField = headers.find(
    (h) => h.toLowerCase() === 'nickname' || h.toLowerCase() === 'name',
  );
  const discordIdField = headers.find(
    (h) => h.toLowerCase() === 'discordid' || h.toLowerCase() === 'discord_id',
  );

  // If we can't find either column, return original data
  if (!nicknameField || !discordIdField) {
    return csvData;
  }

  // Process rows: if nickname is empty but Discord ID is present, use Discord ID as nickname
  rows.forEach((row) => {
    const nicknameValue = row[nicknameField];
    const discordIdValue = row[discordIdField];

    if (!nicknameValue && discordIdValue) {
      row[nicknameField] = discordIdValue;
    }
  });

  // Convert back to CSV format
  return Papa.unparse(rows, {
    header: true,
  });
};

/**
 * Handle CSV import submission
 */
const handleImport = async (): Promise<void> => {
  if (!csvData.value.trim()) {
    error.value = 'Please paste CSV data to import';
    return;
  }

  importing.value = true;
  error.value = null;
  importResult.value = null;

  try {
    // Process CSV to handle missing nicknames
    const processedCSV = processCSVData(csvData.value);

    const result = await props.onImport(processedCSV);
    importResult.value = result;

    // If all successful, close dialog after a short delay
    if (result.errors.length === 0) {
      setTimeout(() => {
        handleClose();
      }, 2000);
    }
  } catch (err: unknown) {
    error.value = err instanceof Error ? err.message : 'Failed to import CSV';
  } finally {
    importing.value = false;
  }
};

/**
 * Handle close button click
 */
const handleClose = (): void => {
  resetForm();
  emit('close');
  emit('update:visible', false);
};

/**
 * Reset form to initial state
 */
const resetForm = (): void => {
  csvData.value = '';
  importing.value = false;
  importResult.value = null;
  error.value = null;
};

/**
 * Copy example to clipboard and paste in textarea
 */
const useExample = (): void => {
  csvData.value = csvExample.value;
};

/**
 * Download example CSV file
 */
const downloadExample = (): void => {
  const blob = new Blob([csvExample.value], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'driver-import-example.csv';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Generate the minimum required headers string
 */
const getMinimumRequiredHeaders = (): string => {
  return ['Nickname', ...leagueStore.platformCsvHeaders.map((h) => toPascalCase(h.field))].join(
    ',',
  );
};

/**
 * Add minimum required headers to the textarea
 * Inserts at the top if data already exists
 */
const addHeaders = (): void => {
  const headers = getMinimumRequiredHeaders();
  if (csvData.value.trim()) {
    csvData.value = headers + '\n' + csvData.value;
  } else {
    csvData.value = headers;
  }
};

/**
 * Fetch CSV headers on mount
 */
onMounted(async () => {
  if (props.leagueId) {
    try {
      await leagueStore.fetchDriverCsvHeadersForLeague(props.leagueId);
    } catch (err) {
      console.error('Failed to fetch CSV headers:', err);
      error.value = 'Failed to load CSV template configuration';
    }
  }
});

/**
 * Clear memoization cache on unmount to prevent memory leaks
 */
onUnmounted(() => {
  generateCsvExample.clear();
});
</script>

<template>
  <BaseModal :visible="visible" width="3xl" @update:visible="$emit('update:visible', $event)">
    <template #header>
      <BaseModalHeader title="Import Drivers from CSV" />
    </template>
    <div class="space-y-6">
      <!-- Instructions Panel -->
      <div class="">
        <!-- Header with action buttons -->
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-semibold">CSV Format Requirements</h3>
          <div class="flex gap-2">
            <Button
              label="Download Example"
              size="sm"
              variant="secondary"
              @click="downloadExample"
            />
            <Button label="Use Example" size="sm" variant="outline" @click="useExample" />
          </div>
        </div>

        <p class="text-[var(--text-secondary)] mb-4">
          You can bulk upload drivers from a CSV file. The CSV file must contain the following
          columns:
        </p>

        <!-- Requirements List -->
        <div class="space-y-3 flex flex-row">
          <div class="w-1/2">
            <p class="font-medium mb-2">Required Columns:</p>
            <ul class="space-y-2 text-md text-[var(--text-secondary)]">
              <li class="flex items-start gap-2">
                <span class="text-[var(--text-accent)] mt-0.5">•</span>
                <span
                  >At least one of <strong class="text-[var(--text-primary)]">Nickname</strong> or
                  <strong class="text-[var(--text-primary)]">DiscordID</strong></span
                >
              </li>
              <li class="flex items-start gap-2 ml-4">
                <span class="text-[var(--text-muted)]">→</span>
                <span class="text-[var(--text-muted)] italic"
                  >If Nickname is empty, Discord ID will be used as the nickname</span
                >
              </li>
              <li class="flex items-start gap-2">
                <span class="text-[var(--text-accent)] mt-0.5">•</span>
                <div class="flex-1">
                  <span
                    >At least one
                    <strong class="text-[var(--text-primary)]">platform ID</strong> for this
                    league's enabled platform</span
                  >
                  <!-- Display possible headers for each platform -->
                  <div
                    v-if="headersByPlatform.size > 0"
                    class="mt-2 ml-4 space-y-2 text-[var(--text-secondary)]"
                  >
                    <div
                      v-for="[platformName, headers] in headersByPlatform"
                      :key="platformName"
                      class="flex flex-row gap-2"
                    >
                      <div class="font-medium text-[var(--text-primary)]">{{ platformName }}:</div>
                      <ul class="ml-4 space-y-1">
                        <li
                          v-for="header in headers"
                          :key="header.field"
                          class="flex items-center gap-2"
                        >
                          <code class="font-mono text-[var(--text-accent)]">{{
                            toPascalCase(header.field)
                          }}</code>
                          <span class="text-[var(--text-muted)]">({{ header.label }})</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </li>
            </ul>
          </div>

          <div>
            <p class="font-medium mb-2">Optional Columns:</p>
            <p class="text-sm text-[var(--text-secondary)]">FirstName, LastName, DriverNumber</p>
          </div>
        </div>
        <h4>Important Notes:</h4>
        <p class="text-[var(--text-secondary)] mb-4">
          If a driver/row is missing an optional field, just leave no spacethe commas. For
          example:<br /><code class="font-mono text-sm text-[var(--text-accent)]"
            >Nickname,PsnId,DiscordID,DriverNumber<br />
            John Smith,john1234,,5,</code
          >
        </p>

        <hr class="text-[var(--color-text-secondary)] pb-4 mt-4" />
        <!-- Expected Headers -->
        <div v-if="leagueStore.platformCsvHeaders.length > 0" class="space-y-2">
          <p class="font-medium">Minimum Required Headers:</p>
          <div class="flex flex-row gap-2 w-full">
            <div
              class="bg-[var(--bg-elevated)] border border-[var(--border)] rounded-lg p-3 overflow-x-auto flex-1"
            >
              <code class="font-mono text-sm text-[var(--text-accent)]">{{
                [
                  'Nickname',
                  ...leagueStore.platformCsvHeaders.map((h) => toPascalCase(h.field)),
                ].join(',')
              }}</code>
            </div>
            <Button label="Add Headers" size="lg" variant="outline" @click="addHeaders" />
          </div>
        </div>
        <div v-else class="text-sm text-[var(--text-muted)] italic">
          Loading CSV template configuration...
        </div>
      </div>

      <!-- CSV Input -->
      <FormInputGroup>
        <FormLabel for="csv_data" text="CSV Data" />
        <Textarea
          id="csv_data"
          v-model="csvData"
          rows="10"
          placeholder="Paste your CSV data here..."
          class="w-full font-mono text-sm"
          :disabled="importing"
        />
        <FormHelper text="Paste your CSV data including the header row" />
      </FormInputGroup>

      <!-- Error Message -->
      <Message v-if="error" severity="error" :closable="false">
        {{ error }}
      </Message>

      <!-- Import Result -->
      <div v-if="importResult" class="space-y-3">
        <!-- Success Message -->
        <Message v-if="importResult.success_count > 0" severity="success" :closable="false">
          Successfully imported {{ importResult.success_count }} driver{{
            importResult.success_count === 1 ? '' : 's'
          }}
        </Message>

        <!-- Skipped Message -->
        <Message v-if="importResult.skipped_count > 0" severity="info" :closable="false">
          Skipped {{ importResult.skipped_count }} duplicate driver{{
            importResult.skipped_count === 1 ? '' : 's'
          }}
          (already in league)
        </Message>

        <!-- Errors List -->
        <div v-if="importResult.errors.length > 0" class="space-y-2">
          <Message severity="warn" :closable="false">
            {{ importResult.errors.length }} error{{ importResult.errors.length === 1 ? '' : 's' }}
            occurred during import
          </Message>
          <div
            class="bg-[var(--bg-elevated)] border border-[var(--color-red)] rounded-lg p-4 max-h-48 overflow-y-auto"
          >
            <ul class="space-y-2 text-sm text-[var(--text-secondary)]">
              <li
                v-for="(err, index) in importResult.errors"
                :key="index"
                class="flex items-start gap-2"
              >
                <span class="text-[var(--color-red)] font-medium whitespace-nowrap"
                  >Row {{ err.row }}:</span
                >
                <span>{{ err.message }}</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="flex justify-end gap-2">
        <Button label="Cancel" variant="secondary" :disabled="importing" @click="handleClose" />
        <Button
          label="Import"
          :loading="importing"
          :disabled="!csvData.trim() || importing"
          @click="handleImport"
        />
      </div>
    </template>
  </BaseModal>
</template>
