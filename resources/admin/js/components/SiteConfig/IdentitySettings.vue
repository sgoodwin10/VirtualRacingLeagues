<template>
  <div class="identity-settings">
    <!-- Two Column Layout: 2/3 - 1/3 -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Left Column (2/3) -->
      <div class="lg:col-span-2 space-y-6">
        <!-- Site Information Section -->
        <div class="bg-gray-50 rounded-lg border border-gray-200 p-5">
          <h3 class="text-sm font-semibold text-gray-900 mb-4">Site Information</h3>
          <div class="space-y-4">
            <!-- Site Name -->
            <div>
              <label for="site_name" class="block text-sm font-medium text-gray-700 mb-2">
                Site Name <span class="text-red-500">*</span>
              </label>
              <InputText
                id="site_name"
                v-model="localFormData.site_name"
                :class="{ 'p-invalid': hasFieldError('site_name') }"
                class="w-full"
                placeholder="Enter site name"
              />
              <small v-if="hasFieldError('site_name')" class="text-red-600">
                {{ getFieldError('site_name') }}
              </small>
            </div>

            <!-- Timezone -->
            <div>
              <label for="timezone" class="block text-sm font-medium text-gray-700 mb-2">
                Timezone <span class="text-red-500">*</span>
              </label>
              <Select
                id="timezone"
                v-model="localFormData.timezone"
                :options="timezoneOptions"
                option-label="label"
                option-value="value"
                :class="{ 'p-invalid': hasFieldError('timezone') }"
                class="w-full"
                placeholder="Select a timezone"
                filter
                show-clear
              />
              <small class="text-gray-500">Default timezone for the application</small>
              <small v-if="hasFieldError('timezone')" class="block text-red-600 mt-1">
                {{ getFieldError('timezone') }}
              </small>
            </div>

            <!-- Discord Link -->
            <div>
              <label for="discord_link" class="block text-sm font-medium text-gray-700 mb-2">
                Discord Server Link
              </label>
              <InputText
                id="discord_link"
                v-model="localFormData.discord_link"
                :class="{ 'p-invalid': hasFieldError('discord_link') }"
                class="w-full"
                type="url"
                placeholder="https://discord.gg/xxxxx"
              />
              <small class="text-gray-500">Link to your Discord community server</small>
              <small v-if="hasFieldError('discord_link')" class="block text-red-600 mt-1">
                {{ getFieldError('discord_link') }}
              </small>
            </div>
          </div>
        </div>

        <!-- Email Addresses Section -->
        <div class="bg-gray-50 rounded-lg border border-gray-200 p-5">
          <h3 class="text-sm font-semibold text-gray-900 mb-4">Email Addresses</h3>
          <div class="space-y-4">
            <!-- Support Email -->
            <div>
              <label for="support_email" class="block text-sm font-medium text-gray-700 mb-2">
                Support Email
              </label>
              <InputText
                id="support_email"
                v-model="localFormData.support_email"
                :class="{ 'p-invalid': hasFieldError('support_email') }"
                class="w-full"
                type="email"
                placeholder="support@example.com"
              />
              <small class="text-gray-500">Email address for customer support inquiries</small>
              <small v-if="hasFieldError('support_email')" class="block text-red-600 mt-1">
                {{ getFieldError('support_email') }}
              </small>
            </div>

            <!-- Contact Email -->
            <div>
              <label for="contact_email" class="block text-sm font-medium text-gray-700 mb-2">
                Contact Email
              </label>
              <InputText
                id="contact_email"
                v-model="localFormData.contact_email"
                :class="{ 'p-invalid': hasFieldError('contact_email') }"
                class="w-full"
                type="email"
                placeholder="contact@example.com"
              />
              <small class="text-gray-500">General contact email address</small>
              <small v-if="hasFieldError('contact_email')" class="block text-red-600 mt-1">
                {{ getFieldError('contact_email') }}
              </small>
            </div>

            <!-- Admin Email -->
            <div>
              <label for="admin_email" class="block text-sm font-medium text-gray-700 mb-2">
                Admin Email
              </label>
              <InputText
                id="admin_email"
                v-model="localFormData.admin_email"
                :class="{ 'p-invalid': hasFieldError('admin_email') }"
                class="w-full"
                type="email"
                placeholder="admin@example.com"
              />
              <small class="text-gray-500">Email address for administrative notifications</small>
              <small v-if="hasFieldError('admin_email')" class="block text-red-600 mt-1">
                {{ getFieldError('admin_email') }}
              </small>
            </div>
          </div>
        </div>
      </div>

      <!-- Right Column (1/3) -->
      <div class="space-y-6">
        <!-- Application Settings Section -->
        <div class="bg-gray-50 rounded-lg border border-gray-200 p-5">
          <h3 class="text-sm font-semibold text-gray-900 mb-4">Application Settings</h3>
          <div class="space-y-4">
            <!-- Maintenance Mode -->
            <div class="flex items-start justify-between">
              <div class="flex-1 pr-3">
                <label
                  for="maintenance_mode"
                  class="text-sm font-medium text-gray-900 cursor-pointer block"
                >
                  Maintenance Mode
                </label>
                <p class="text-xs text-gray-600 mt-1">Show maintenance page to visitors</p>
              </div>
              <ToggleSwitch
                v-model="localFormData.maintenance_mode"
                input-id="maintenance_mode"
                :class="{ 'p-invalid': hasFieldError('maintenance_mode') }"
              />
            </div>
            <small v-if="hasFieldError('maintenance_mode')" class="block text-red-600 -mt-2">
              {{ getFieldError('maintenance_mode') }}
            </small>

            <!-- User Registration Enabled -->
            <div class="flex items-start justify-between pt-2 border-t border-gray-200">
              <div class="flex-1 pr-3">
                <label
                  for="user_registration_enabled"
                  class="text-sm font-medium text-gray-900 cursor-pointer block"
                >
                  User Registration
                </label>
                <p class="text-xs text-gray-600 mt-1">Allow new users to register</p>
              </div>
              <ToggleSwitch
                v-model="localFormData.user_registration_enabled"
                input-id="user_registration_enabled"
                :class="{ 'p-invalid': hasFieldError('user_registration_enabled') }"
              />
            </div>
            <small
              v-if="hasFieldError('user_registration_enabled')"
              class="block text-red-600 -mt-2"
            >
              {{ getFieldError('user_registration_enabled') }}
            </small>
          </div>
        </div>

        <!-- Image Uploads Section -->
        <div class="bg-gray-50 rounded-lg border border-gray-200 p-5">
          <h3 class="text-sm font-semibold text-gray-900 mb-4">Site Images</h3>
          <div class="space-y-4">
            <!-- Logo Upload -->
            <div>
              <ImageUpload
                v-model="localFormData.logo"
                file-type="logo"
                label="Logo"
                help-text="512x512px or larger"
                :error-message="getFieldError('logo')"
                @remove="handleLogoRemove"
                @error="handleUploadError"
              />
            </div>

            <!-- Favicon Upload -->
            <div>
              <ImageUpload
                v-model="localFormData.favicon"
                file-type="favicon"
                label="Favicon"
                help-text="32x32px or 64x64px"
                :error-message="getFieldError('favicon')"
                @remove="handleFaviconRemove"
                @error="handleUploadError"
              />
            </div>

            <!-- Open Graph Image Upload -->
            <div>
              <ImageUpload
                v-model="localFormData.og_image"
                file-type="og_image"
                label="OG Image"
                help-text="1200x630px recommended"
                :error-message="getFieldError('og_image')"
                @remove="handleOgImageRemove"
                @error="handleUploadError"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import InputText from 'primevue/inputtext';
import ToggleSwitch from 'primevue/toggleswitch';
import Select from 'primevue/select';
import ImageUpload from './FileUpload/ImageUpload.vue';
import { COMMON_TIMEZONES } from '@admin/types/siteConfig';
import type { SiteConfigFile } from '@admin/types/siteConfig';

interface LocalFormData {
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

interface Props {
  formData: LocalFormData;
  getFieldError: (field: string) => string | null;
  hasFieldError: (field: string) => boolean;
}

interface Emits {
  (e: 'update:formData', value: LocalFormData): void;
  (e: 'error', message: string): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// Local reactive copy
const localFormData = ref<LocalFormData>({ ...props.formData });

// Timezone options
const timezoneOptions = COMMON_TIMEZONES;

// Watch for changes and emit
watch(
  localFormData,
  (newValue) => {
    emit('update:formData', newValue);
  },
  { deep: true }
);

/**
 * Handle logo removal
 */
const handleLogoRemove = (): void => {
  localFormData.value.logo = null;
  localFormData.value.remove_logo = true;
};

/**
 * Handle favicon removal
 */
const handleFaviconRemove = (): void => {
  localFormData.value.favicon = null;
  localFormData.value.remove_favicon = true;
};

/**
 * Handle OG image removal
 */
const handleOgImageRemove = (): void => {
  localFormData.value.og_image = null;
  localFormData.value.remove_og_image = true;
};

/**
 * Handle upload error
 */
const handleUploadError = (message: string): void => {
  emit('error', message);
};
</script>

<style scoped>
/* Component-specific styles if needed */
</style>
