<template>
  <div>
    <h1 class="text-3xl font-bold text-gray-900 mb-4">Settings</h1>

    <!-- Platform Car Management Card -->
    <Card class="mb-6">
      <template #title>
        <div class="flex items-center gap-2">
          <i class="pi pi-car text-xl"></i>
          <span>Platform Car Management</span>
        </div>
      </template>
      <template #content>
        <div class="space-y-4">
          <p class="text-surface-600 dark:text-surface-400">
            Import car and brand data from the GT7 platform API. This will create new cars, update
            existing ones, and deactivate cars that are no longer available.
          </p>

          <div class="flex items-center gap-3">
            <Button
              label="Import GT7 Cars"
              icon="pi pi-download"
              severity="primary"
              :loading="importing"
              :disabled="importing"
              @click="handleImport"
            />
            <span v-if="importing" class="text-sm text-surface-600">
              Importing cars from GT7 API...
            </span>
          </div>

          <!-- Last Import Summary -->
          <div
            v-if="lastImportSummary"
            class="mt-4 p-4 bg-surface-50 dark:bg-surface-800 rounded-lg border border-surface-200 dark:border-surface-700"
          >
            <h3 class="font-semibold text-sm mb-2 text-surface-900 dark:text-surface-100">
              Last Import Summary
            </h3>
            <div class="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
              <div>
                <span class="text-surface-600 dark:text-surface-400">Cars Created:</span>
                <span class="ml-2 font-semibold text-green-600">{{
                  lastImportSummary.carsCreated
                }}</span>
              </div>
              <div>
                <span class="text-surface-600 dark:text-surface-400">Cars Updated:</span>
                <span class="ml-2 font-semibold text-blue-600">{{
                  lastImportSummary.carsUpdated
                }}</span>
              </div>
              <div>
                <span class="text-surface-600 dark:text-surface-400">Cars Deactivated:</span>
                <span class="ml-2 font-semibold text-orange-600">{{
                  lastImportSummary.carsDeactivated
                }}</span>
              </div>
              <div>
                <span class="text-surface-600 dark:text-surface-400">Brands Created:</span>
                <span class="ml-2 font-semibold text-green-600">{{
                  lastImportSummary.brandsCreated
                }}</span>
              </div>
              <div>
                <span class="text-surface-600 dark:text-surface-400">Brands Updated:</span>
                <span class="ml-2 font-semibold text-blue-600">{{
                  lastImportSummary.brandsUpdated
                }}</span>
              </div>
              <div v-if="lastImportSummary.errors.length > 0">
                <span class="text-surface-600 dark:text-surface-400">Errors:</span>
                <span class="ml-2 font-semibold text-red-600">{{
                  lastImportSummary.errors.length
                }}</span>
              </div>
            </div>
            <!-- Show errors if any -->
            <div v-if="lastImportSummary.errors.length > 0" class="mt-3">
              <p class="text-sm font-semibold text-red-600 mb-1">Import Errors:</p>
              <ul class="text-sm text-red-600 list-disc list-inside">
                <li v-for="(error, index) in lastImportSummary.errors" :key="index">
                  {{ error }}
                </li>
              </ul>
            </div>
          </div>
        </div>
      </template>
    </Card>

    <!-- Other Settings Card -->
    <Card>
      <template #title>Other Settings</template>
      <template #content>
        <p class="text-surface-600 dark:text-surface-400">
          Additional application settings will be added here.
        </p>
      </template>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import Card from 'primevue/card';
import Button from 'primevue/button';
import { platformCarService } from '@admin/services/platformCarService';
import { useErrorToast } from '@admin/composables/useErrorToast';
import type { PlatformCarImportSummary } from '@admin/types/platformCar';
import { logger } from '@admin/utils/logger';

const { showErrorToast, showSuccessToast } = useErrorToast();

// State
const importing = ref(false);
const lastImportSummary = ref<PlatformCarImportSummary | null>(null);

/**
 * Handle platform car import
 * Calls API to import GT7 cars and displays results
 */
const handleImport = async (): Promise<void> => {
  importing.value = true;
  lastImportSummary.value = null; // Clear previous summary

  try {
    logger.info('Starting GT7 car import...');
    const summary = await platformCarService.importCars();

    // Store summary for display
    lastImportSummary.value = summary;

    // Build success message
    const totalChanges =
      summary.carsCreated + summary.carsUpdated + summary.carsDeactivated + summary.brandsCreated;

    let message = `Import completed successfully! ${totalChanges} total changes made.`;

    // Add specific counts
    const details: string[] = [];
    if (summary.carsCreated > 0) details.push(`${summary.carsCreated} cars created`);
    if (summary.carsUpdated > 0) details.push(`${summary.carsUpdated} cars updated`);
    if (summary.carsDeactivated > 0) details.push(`${summary.carsDeactivated} cars deactivated`);
    if (summary.brandsCreated > 0) details.push(`${summary.brandsCreated} brands created`);
    if (summary.brandsUpdated > 0) details.push(`${summary.brandsUpdated} brands updated`);

    if (details.length > 0) {
      message = `Import completed successfully! ${details.join(', ')}.`;
    }

    // Show warning if errors occurred
    if (summary.errors.length > 0) {
      showErrorToast(
        `Import completed with ${summary.errors.length} error(s). See summary below for details.`,
        'Import Warning',
      );
    } else {
      showSuccessToast(message, 'Import Successful', 5000);
    }

    logger.info('GT7 car import completed:', summary);
  } catch (error) {
    logger.error('Failed to import GT7 cars:', error);
    showErrorToast(error, 'Import Failed');
    lastImportSummary.value = null;
  } finally {
    importing.value = false;
  }
};
</script>
