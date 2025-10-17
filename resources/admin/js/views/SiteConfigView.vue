<template>
  <div class="site-config-view">
    <!-- Header -->
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-900 mb-2">Site Configuration</h1>
      <p class="text-gray-600">Manage your site's global settings and appearance</p>
    </div>

    <!-- Loading State -->
    <Card v-if="loading">
      <template #content>
        <div class="text-center py-8">
          <i class="pi pi-spinner pi-spin text-4xl text-blue-500 mb-3"></i>
          <p class="text-gray-600">Loading site configuration...</p>
        </div>
      </template>
    </Card>

    <!-- Error State -->
    <Card v-else-if="error && !config">
      <template #content>
        <div class="text-center py-8">
          <i class="pi pi-exclamation-circle text-4xl text-red-500 mb-3"></i>
          <p class="text-gray-900 font-medium mb-2">Failed to Load Configuration</p>
          <p class="text-gray-600 mb-4">{{ error }}</p>
          <Button label="Try Again" icon="pi pi-refresh" @click="loadConfig" />
        </div>
      </template>
    </Card>

    <!-- Form -->
    <Card v-else-if="config">
      <template #content>
        <SiteConfigForm
          :config="config"
          :saving="saving"
          :get-field-error="getFieldError"
          :has-field-error="hasFieldError"
          @submit="handleSubmit"
          @cancel="handleCancel"
          @error="handleFormError"
        />
      </template>
    </Card>

    <!-- Confirmation Dialog -->
    <ConfirmDialog />

    <!-- Toast for notifications -->
    <Toast />
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useConfirm } from 'primevue/useconfirm';
import Button from 'primevue/button';
import Card from 'primevue/card';
import Toast from 'primevue/toast';
import ConfirmDialog from 'primevue/confirmdialog';
import SiteConfigForm from '@admin/components/SiteConfig/SiteConfigForm.vue';
import { useSiteConfig } from '@admin/composables/useSiteConfig';
import { useErrorToast } from '@admin/composables/useErrorToast';
import type { UpdateSiteConfigRequest } from '@admin/types/siteConfig';

// Composables
const confirm = useConfirm();
const { showErrorToast, showSuccessToast } = useErrorToast();

// Site config composable
const {
  config,
  loading,
  saving,
  error,
  fetchConfig,
  updateConfig,
  getFieldError,
  hasFieldError,
  clearValidationErrors,
} = useSiteConfig();

/**
 * Load site configuration
 */
const loadConfig = async (): Promise<void> => {
  await fetchConfig();

  if (error.value) {
    showErrorToast(error.value, 'Failed to load configuration');
  }
};

/**
 * Handle form submission
 */
const handleSubmit = (data: UpdateSiteConfigRequest): void => {
  confirm.require({
    message: 'Are you sure you want to save these configuration changes?',
    header: 'Confirm Changes',
    icon: 'pi pi-exclamation-triangle',
    rejectLabel: 'Cancel',
    acceptLabel: 'Save Changes',
    accept: async () => {
      await saveConfig(data);
    },
  });
};

/**
 * Save site configuration
 */
const saveConfig = async (data: UpdateSiteConfigRequest): Promise<void> => {
  clearValidationErrors();

  const success = await updateConfig(data);

  if (success) {
    showSuccessToast('Site configuration updated successfully');
    // Note: The Pinia store is automatically updated by the composable
    // No need to fetch config again
  } else {
    // Show validation errors
    if (Object.keys(getFieldError).length > 0) {
      showErrorToast('Validation Error', 'Please correct the errors in the form');
    } else {
      showErrorToast(error.value || 'Unknown error', 'Failed to update site configuration');
    }
  }
};

/**
 * Handle cancel
 */
const handleCancel = (): void => {
  confirm.require({
    message: 'Are you sure you want to cancel? Any unsaved changes will be lost.',
    header: 'Confirm Cancel',
    icon: 'pi pi-question-circle',
    rejectLabel: 'No',
    acceptLabel: 'Yes, Cancel',
    accept: () => {
      // Reload config to reset form
      loadConfig();
    },
  });
};

/**
 * Handle form error
 */
const handleFormError = (message: string): void => {
  showErrorToast(message, 'Form Error');
};

// Load data on mount
onMounted(() => {
  loadConfig();
});
</script>

<style scoped>
.site-config-view {
  width: 100%;
  max-width: 100%;
}

/* Custom styles if needed */
</style>
