<script setup lang="ts">
import { ref, watch } from 'vue';
import Dialog from 'primevue/dialog';
import Textarea from 'primevue/textarea';
import Button from 'primevue/button';
import Message from 'primevue/message';
import FormLabel from '@user/components/common/FormLabel.vue';
import type { ImportDriversResponse } from '@user/types/driver';

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

const csvData = ref('');
const importing = ref(false);
const importResult = ref<ImportDriversResponse | null>(null);
const error = ref<string | null>(null);

// CSV format example
const csvExample = `FirstName,LastName,PSN_ID,Email,DriverNumber
John,Smith,JohnSmith77,john@example.com,5
Jane,Doe,JaneDoe_GT,jane@example.com,7
Mike,Ross,MikeR_Racing,,3`;

// Watch for visible changes to reset form
watch(
  () => props.visible,
  (visible) => {
    if (visible) {
      resetForm();
    }
  }
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
  csvData.value = csvExample;
};
</script>

<template>
  <Dialog
    :visible="visible"
    header="Import Drivers from CSV"
    :modal="true"
    :closable="true"
    :draggable="false"
    class="w-full max-w-3xl"
    @update:visible="$emit('update:visible', $event)"
  >
    <div class="space-y-4">
      <!-- Instructions -->
      <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 class="font-semibold text-blue-900 mb-2">CSV Format Instructions</h4>
        <p class="text-sm text-blue-800 mb-3">
          Paste your CSV data below. The CSV must include headers and at least the following
          columns:
        </p>
        <ul class="text-sm text-blue-800 space-y-1 mb-3">
          <li><strong>Required:</strong> At least one name (FirstName, LastName, or Nickname)</li>
          <li>
            <strong>Required:</strong> At least one platform ID (PSN_ID, GT7_ID, or iRacing_ID)
          </li>
          <li><strong>Optional:</strong> Email, Phone, DriverNumber</li>
        </ul>
        <div class="flex items-center gap-2">
          <p class="text-sm font-medium text-blue-900">Example CSV:</p>
          <Button label="Use Example" size="small" severity="info" text @click="useExample" />
        </div>
        <pre class="text-xs bg-white border border-blue-200 rounded p-2 mt-2 overflow-x-auto">{{
          csvExample
        }}</pre>
      </div>

      <!-- CSV Input -->
      <div class="form-field">
        <FormLabel for="csv_data" text="CSV Data" />
        <Textarea
          id="csv_data"
          v-model="csvData"
          rows="10"
          placeholder="Paste your CSV data here..."
          class="w-full font-mono text-sm"
          :disabled="importing"
        />
      </div>

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
  </Dialog>
</template>
