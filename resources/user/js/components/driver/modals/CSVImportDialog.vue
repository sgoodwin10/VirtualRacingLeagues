<script setup lang="ts">
import { ref, watch, computed, onMounted } from 'vue';
import BaseModal from '@user/components/common/modals/BaseModal.vue';
import Textarea from 'primevue/textarea';
import Button from 'primevue/button';
import Message from 'primevue/message';
import FormInputGroup from '@user/components/common/forms/FormInputGroup.vue';
import FormLabel from '@user/components/common/forms/FormLabel.vue';
import FormHelper from '@user/components/common/forms/FormHelper.vue';
import { useLeagueStore } from '@user/stores/leagueStore';
import type { ImportDriversResponse } from '@user/types/driver';
import BaseModalHeader from '@user/components/common/modals/BaseModalHeader.vue';

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

// Generate CSV example dynamically based on league's platform headers
const csvExample = computed(() => {
  const platformHeaders = leagueStore.platformCsvHeaders;

  if (platformHeaders.length === 0) {
    // Fallback example if headers not loaded yet
    return `Nickname,DiscordID,DriverNumber
John Smith,john#1234,5
Jane Doe,jane#5678,7
Mike Ross,,3`;
  }

  // Build headers: Nickname, DiscordID + platform ID columns + DriverNumber (optional)
  const headers = ['Nickname', 'DiscordID', ...platformHeaders.map((h) => h.field), 'DriverNumber'];

  // Generate example data rows based on the platform columns
  const exampleRows: string[][] = [];

  // Example 1: Full data with both nickname and Discord ID
  const row1 = ['John Smith', 'john#1234'];
  platformHeaders.forEach((header) => {
    if (header.field === 'psn_id') {
      row1.push('john_psn_123');
    } else if (header.field === 'iracing_id') {
      row1.push('john_iracing');
    } else if (header.field === 'iracing_customer_id') {
      row1.push('123456');
    } else {
      row1.push('john_' + header.field);
    }
  });
  row1.push('5'); // DriverNumber
  exampleRows.push(row1);

  // Example 2: Driver with Discord ID only (no nickname)
  const row2 = ['', 'jane#5678'];
  platformHeaders.forEach((header) => {
    if (header.field === 'psn_id') {
      row2.push('jane_psn_456');
    } else if (header.field === 'iracing_id') {
      row2.push('jane_iracing');
    } else if (header.field === 'iracing_customer_id') {
      row2.push('789012');
    } else {
      row2.push('jane_' + header.field);
    }
  });
  row2.push('7'); // DriverNumber
  exampleRows.push(row2);

  // Example 3: Driver with nickname only (no Discord ID)
  const row3 = ['Mike Ross', ''];
  platformHeaders.forEach((header) => {
    if (header.field === 'psn_id') {
      row3.push('mike_psn_789');
    } else if (header.field === 'iracing_id') {
      row3.push('mike_iracing');
    } else if (header.field === 'iracing_customer_id') {
      row3.push('345678');
    } else {
      row3.push('mike_' + header.field);
    }
  });
  row3.push(''); // Empty DriverNumber to show it's optional
  exampleRows.push(row3);

  // Format as CSV
  const headerRow = headers.join(',');
  const dataRows = exampleRows.map((row) => row.join(','));

  return `${headerRow}\n${dataRows.join('\n')}`;
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
 */
const processCSVData = (csvData: string): string => {
  const lines = csvData.trim().split('\n');
  if (lines.length === 0) {
    return csvData;
  }

  // Get header row
  const headerRow = lines[0];
  if (!headerRow) {
    return csvData;
  }

  const headers = headerRow.split(',').map((h) => h.trim());

  // Find nickname and Discord ID column indices
  const nicknameIndex = headers.findIndex(
    (h) => h.toLowerCase() === 'nickname' || h.toLowerCase() === 'name',
  );
  const discordIdIndex = headers.findIndex(
    (h) => h.toLowerCase() === 'discordid' || h.toLowerCase() === 'discord_id',
  );

  // If we can't find either column, return original data
  if (nicknameIndex === -1 || discordIdIndex === -1) {
    return csvData;
  }

  // Process data rows
  const processedLines = [headerRow]; // Keep header as-is
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line || !line.trim()) continue; // Skip empty lines

    const columns = line.split(',').map((col) => col.trim());

    // If nickname is empty but Discord ID is present, use Discord ID as nickname
    const nicknameValue = columns[nicknameIndex];
    const discordIdValue = columns[discordIdIndex];

    if (!nicknameValue && discordIdValue) {
      columns[nicknameIndex] = discordIdValue;
    }

    processedLines.push(columns.join(','));
  }

  return processedLines.join('\n');
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
 * Download CSV template with correct headers
 */
const downloadTemplate = (): void => {
  const headers = leagueStore.platformCsvHeaders;
  if (headers.length === 0) {
    error.value = 'Platform headers not loaded. Please try again.';
    return;
  }

  const csvContent = headers.map((h) => h.field).join(',');
  // eslint-disable-next-line no-undef
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', 'driver_import_template.csv');
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
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
</script>

<template>
  <BaseModal :visible="visible" width="3xl" @update:visible="$emit('update:visible', $event)">
    <template #header>
      <BaseModalHeader title="Import Drivers from CSV" />
    </template>
    <div class="space-y-4">
      <!-- Instructions -->
      <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 class="font-semibold text-blue-900 mb-2">CSV Format Instructions</h4>
        <FormHelper
          text="Paste your CSV data below. The CSV must include headers and at least the following columns:"
          class="text-blue-800"
        />
        <ul class="text-sm text-blue-800 space-y-1 my-3">
          <li><strong>Required:</strong> At least one of Nickname or DiscordID</li>
          <li class="text-xs italic ml-4">
            Note: If Nickname is empty, Discord ID will be used as the nickname
          </li>
          <li><strong>Required:</strong> At least one platform ID for this league's platforms</li>
          <li><strong>Optional:</strong> FirstName, LastName, DriverNumber</li>
        </ul>
        <div class="flex items-center gap-2 mb-2">
          <p class="text-sm font-medium text-blue-900 hidden">CSV Template:</p>
          <Button
            label="Download Template"
            size="small"
            severity="info"
            icon="pi pi-download"
            class="hidden"
            @click="downloadTemplate"
          />
          <Button label="Use Example" size="small" severity="info" @click="useExample" />
        </div>
        <div v-if="leagueStore.platformCsvHeaders.length > 0">
          <p class="text-xs text-blue-800 mb-1">Expected headers for this league:</p>
          <pre class="text-xs bg-white border border-blue-200 rounded p-2 overflow-x-auto">{{
            leagueStore.platformCsvHeaders.map((h) => h.field).join(',')
          }}</pre>
        </div>
        <div v-else class="text-sm text-blue-600">Loading CSV template configuration...</div>
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
      <div v-if="importResult" class="space-y-2">
        <!-- Success Message -->
        <Message v-if="importResult.success_count > 0" severity="success" :closable="false">
          Successfully imported {{ importResult.success_count }} driver{{
            importResult.success_count === 1 ? '' : 's'
          }}
        </Message>

        <!-- Errors List -->
        <div v-if="importResult.errors.length > 0" class="space-y-2">
          <Message severity="warn" :closable="false">
            {{ importResult.errors.length }} error{{ importResult.errors.length === 1 ? '' : 's' }}
            occurred during import:
          </Message>
          <div class="bg-red-50 border border-red-200 rounded-lg p-4 max-h-48 overflow-y-auto">
            <ul class="text-sm text-red-800 space-y-1">
              <li v-for="(err, index) in importResult.errors" :key="index">
                <strong>Row {{ err.row }}:</strong> {{ err.message }}
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="flex justify-end gap-2">
        <Button label="Cancel" severity="secondary" :disabled="importing" @click="handleClose" />
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
