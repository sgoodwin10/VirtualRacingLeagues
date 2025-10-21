<template>
  <div class="application-settings">
    <div class="space-y-6">
      <!-- Maintenance Mode -->
      <div
        class="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200"
      >
        <div class="flex-1">
          <label for="maintenance_mode" class="text-sm font-medium text-gray-900 cursor-pointer">
            Maintenance Mode
          </label>
          <p class="text-sm text-gray-600 mt-1">
            Enable to show a maintenance page to non-admin visitors
          </p>
        </div>
        <ToggleSwitch
          v-model="localFormData.maintenance_mode"
          input-id="maintenance_mode"
          :class="{ 'p-invalid': hasFieldError('maintenance_mode') }"
        />
      </div>
      <small v-if="hasFieldError('maintenance_mode')" class="block text-red-600 -mt-4">
        {{ getFieldError('maintenance_mode') }}
      </small>

      <!-- User Registration Enabled -->
      <div
        class="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200"
      >
        <div class="flex-1">
          <label
            for="user_registration_enabled"
            class="text-sm font-medium text-gray-900 cursor-pointer"
          >
            User Registration
          </label>
          <p class="text-sm text-gray-600 mt-1">Allow new users to register accounts</p>
        </div>
        <ToggleSwitch
          v-model="localFormData.user_registration_enabled"
          input-id="user_registration_enabled"
          :class="{ 'p-invalid': hasFieldError('user_registration_enabled') }"
        />
      </div>
      <small v-if="hasFieldError('user_registration_enabled')" class="block text-red-600 -mt-4">
        {{ getFieldError('user_registration_enabled') }}
      </small>

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
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import InputText from 'primevue/inputtext';
import ToggleSwitch from 'primevue/toggleswitch';
import Select from 'primevue/select';
import { COMMON_TIMEZONES } from '@admin/types/siteConfig';

interface LocalFormData {
  maintenance_mode: boolean;
  user_registration_enabled: boolean;
  timezone: string;
  discord_link: string | null;
}

interface Props {
  formData: LocalFormData;
  getFieldError: (field: string) => string | null;
  hasFieldError: (field: string) => boolean;
}

interface Emits {
  (e: 'update:formData', value: LocalFormData): void;
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
  { deep: true },
);
</script>

<style scoped>
/* Component-specific styles if needed */
</style>
