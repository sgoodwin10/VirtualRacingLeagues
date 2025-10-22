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
}

interface Emits {
  (e: 'update:visible', value: boolean): void;
  (e: 'import', csvData: string): Promise<ImportDriversResponse>;
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
  const headers = leagueStore.platformCsvHeaders;
  if (headers.length === 0) {
    // Fallback example if headers not loaded yet
    return `FirstName,LastName,Email,DriverNumber
John,Smith,john@example.com,5
Jane,Doe,jane@example.com,7
Mike,Ross,,3`;
  }

  // Create example with actual headers
  const headerRow = headers.join(',');
  const exampleRows = [
    'John,Smith,john@example.com,5',
    'Jane,Doe,jane@example.com,7',
    'Mike,Ross,,3',
  ];

  return `${headerRow}\n${exampleRows.join('\n')}`;
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
    const result = await emit('import', csvData.value);
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

  const csvContent = headers.join(',');
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
  <BaseModal
    :visible="visible"
    width="3xl"
    @update:visible="$emit('update:visible', $event)"
  >
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
          <li><strong>Required:</strong> At least one name (FirstName, LastName, or Nickname)</li>
          <li><strong>Required:</strong> At least one platform ID for this league's platforms</li>
          <li><strong>Optional:</strong> Email, Phone, DriverNumber</li>
        </ul>
        <div class="flex items-center gap-2 mb-2">
          <p class="text-sm font-medium text-blue-900">CSV Template:</p>
          <Button
            label="Download Template"
            size="small"
            severity="info"
            icon="pi pi-download"
            @click="downloadTemplate"
          />
          <Button label="Use Example" size="small" severity="info" text @click="useExample" />
        </div>
        <div v-if="leagueStore.platformCsvHeaders.length > 0">
          <p class="text-xs text-blue-800 mb-1">Expected headers for this league:</p>
          <pre class="text-xs bg-white border border-blue-200 rounded p-2 overflow-x-auto">{{
            leagueStore.platformCsvHeaders.join(',')
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
