<template>
  <form class="site-config-form" @submit.prevent="handleSubmit">
    <!-- Tabs -->
    <Tabs v-model:value="activeTab" class="mb-6">
      <TabList>
        <Tab value="0">Site Identity & Settings</Tab>
        <Tab value="1">Tracking & Analytics</Tab>
      </TabList>
      <TabPanels>
        <!-- Site Identity & Settings Tab -->
        <TabPanel value="0">
          <div class="p-6">
            <IdentitySettings
              :form-data="combinedFormData"
              :get-field-error="getFieldError"
              :has-field-error="hasFieldError"
              @update:form-data="updateCombinedData"
              @error="handleError"
            />
          </div>
        </TabPanel>

        <!-- Tracking & Analytics Tab -->
        <TabPanel value="1">
          <div class="p-6">
            <TrackingSettings
              :form-data="trackingFormData"
              :get-field-error="getFieldError"
              :has-field-error="hasFieldError"
              @update:form-data="updateTrackingData"
            />
          </div>
        </TabPanel>
      </TabPanels>
    </Tabs>

    <!-- Form Actions -->
    <div class="flex justify-end gap-3 pt-4 border-t border-gray-200">
      <Button type="button" label="Cancel" severity="secondary" outlined @click="handleCancel" />
      <Button
        type="submit"
        label="Save Changes"
        icon="pi pi-check"
        :loading="saving"
        :disabled="!isFormValid || saving"
      />
    </div>
  </form>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import Tabs from 'primevue/tabs';
import TabList from 'primevue/tablist';
import Tab from 'primevue/tab';
import TabPanels from 'primevue/tabpanels';
import TabPanel from 'primevue/tabpanel';
import Button from 'primevue/button';
import IdentitySettings from './IdentitySettings.vue';
import TrackingSettings from './TrackingSettings.vue';
import type { SiteConfig, UpdateSiteConfigRequest, SiteConfigFile } from '@admin/types/siteConfig';

interface Props {
  config: SiteConfig | null;
  saving: boolean;
  getFieldError: (field: string) => string | null;
  hasFieldError: (field: string) => boolean;
}

interface Emits {
  (e: 'submit', data: UpdateSiteConfigRequest): void;
  (e: 'cancel'): void;
  (e: 'error', message: string): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// State
const activeTab = ref('0');

// Form data types
interface CombinedFormData {
  site_name: string;
  timezone: string;
  discord_link: string | null;
  support_email: string | null;
  contact_email: string | null;
  admin_email: string | null;
  maintenance_mode: boolean;
  user_registration_enabled: boolean;
  logo: File | SiteConfigFile | null;
  favicon: File | SiteConfigFile | null;
  og_image: File | SiteConfigFile | null;
  remove_logo: boolean;
  remove_favicon: boolean;
  remove_og_image: boolean;
}

interface TrackingFormData {
  google_analytics_id: string | null;
  google_tag_manager_id: string | null;
  google_search_console_code: string | null;
}

// Combined form data for Identity & Settings tab
const combinedFormData = ref<CombinedFormData>({
  site_name: props.config?.site_name || '',
  timezone: props.config?.timezone || 'UTC',
  discord_link: props.config?.discord_link || null,
  support_email: props.config?.support_email || null,
  contact_email: props.config?.contact_email || null,
  admin_email: props.config?.admin_email || null,
  maintenance_mode: props.config?.maintenance_mode || false,
  user_registration_enabled: props.config?.user_registration_enabled ?? true,
  logo: props.config?.files.logo || null,
  favicon: props.config?.files.favicon || null,
  og_image: props.config?.files.og_image || null,
  remove_logo: false,
  remove_favicon: false,
  remove_og_image: false,
});

const trackingFormData = ref<TrackingFormData>({
  google_tag_manager_id: props.config?.google_tag_manager_id || null,
  google_analytics_id: props.config?.google_analytics_id || null,
  google_search_console_code: props.config?.google_search_console_code || null,
});

// Watch for config changes to update form data
watch(
  () => props.config,
  (newConfig) => {
    if (newConfig) {
      combinedFormData.value = {
        site_name: newConfig.site_name,
        timezone: newConfig.timezone,
        discord_link: newConfig.discord_link,
        support_email: newConfig.support_email,
        contact_email: newConfig.contact_email,
        admin_email: newConfig.admin_email,
        maintenance_mode: newConfig.maintenance_mode,
        user_registration_enabled: newConfig.user_registration_enabled,
        logo: newConfig.files.logo,
        favicon: newConfig.files.favicon,
        og_image: newConfig.files.og_image,
        remove_logo: false,
        remove_favicon: false,
        remove_og_image: false,
      };

      trackingFormData.value = {
        google_tag_manager_id: newConfig.google_tag_manager_id,
        google_analytics_id: newConfig.google_analytics_id,
        google_search_console_code: newConfig.google_search_console_code,
      };
    }
  },
  { deep: true },
);

// Form validation
const isFormValid = computed(() => {
  return (
    combinedFormData.value.site_name.trim().length > 0 &&
    combinedFormData.value.timezone.trim().length > 0
  );
});

/**
 * Update combined data
 */
const updateCombinedData = (data: Partial<CombinedFormData>): void => {
  combinedFormData.value = { ...combinedFormData.value, ...data };
};

/**
 * Update tracking data
 */
const updateTrackingData = (data: Partial<TrackingFormData>): void => {
  trackingFormData.value = { ...trackingFormData.value, ...data };
};

/**
 * Handle form submission
 */
const handleSubmit = (): void => {
  if (!isFormValid.value) return;

  const formData: UpdateSiteConfigRequest = {
    site_name: combinedFormData.value.site_name,
    maintenance_mode: combinedFormData.value.maintenance_mode,
    timezone: combinedFormData.value.timezone,
    user_registration_enabled: combinedFormData.value.user_registration_enabled,
    google_tag_manager_id: trackingFormData.value.google_tag_manager_id,
    google_analytics_id: trackingFormData.value.google_analytics_id,
    google_search_console_code: trackingFormData.value.google_search_console_code,
    discord_link: combinedFormData.value.discord_link,
    support_email: combinedFormData.value.support_email,
    contact_email: combinedFormData.value.contact_email,
    admin_email: combinedFormData.value.admin_email,
  };

  // Handle file uploads (only include if they are File objects)
  if (combinedFormData.value.logo instanceof File) {
    formData.logo = combinedFormData.value.logo;
  }
  if (combinedFormData.value.favicon instanceof File) {
    formData.favicon = combinedFormData.value.favicon;
  }
  if (combinedFormData.value.og_image instanceof File) {
    formData.og_image = combinedFormData.value.og_image;
  }

  // Handle file removal flags
  if (combinedFormData.value.remove_logo) {
    formData.remove_logo = true;
  }
  if (combinedFormData.value.remove_favicon) {
    formData.remove_favicon = true;
  }
  if (combinedFormData.value.remove_og_image) {
    formData.remove_og_image = true;
  }

  emit('submit', formData);
};

/**
 * Handle cancel
 */
const handleCancel = (): void => {
  emit('cancel');
};

/**
 * Handle error
 */
const handleError = (message: string): void => {
  emit('error', message);
};

/**
 * Get field error helper
 */
const getFieldError = (field: string): string | null => {
  return props.getFieldError(field);
};

/**
 * Check if field has error helper
 */
const hasFieldError = (field: string): boolean => {
  return props.hasFieldError(field);
};
</script>

<style scoped>
.site-config-form {
  width: 100%;
}

/* Customize PrimeVue Tabs styling for admin theme */
:deep(.p-tabs .p-tablist) {
  background: #f9fafb;
  border-bottom: 2px solid #e5e7eb;
}

:deep(.p-tabs .p-tab) {
  color: #6b7280;
  font-weight: 500;
}

:deep(.p-tabs .p-tab[data-p-active='true']) {
  color: #2563eb;
  border-color: #2563eb;
}

:deep(.p-tabs .p-tabpanels) {
  background: #ffffff;
  padding: 0;
}
</style>
