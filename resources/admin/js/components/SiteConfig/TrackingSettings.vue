<template>
  <div class="tracking-settings">
    <!-- Two Column Layout -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Left Column - Google Services -->
      <div>
        <div class="bg-gray-50 rounded-lg border border-gray-200 p-5">
          <h3 class="text-sm font-semibold text-gray-900 mb-4">Google Services</h3>
          <div class="space-y-4">
            <!-- Google Tag Manager ID -->
            <div>
              <label
                for="google_tag_manager_id"
                class="block text-sm font-medium text-gray-700 mb-2"
              >
                Google Tag Manager ID
              </label>
              <InputText
                id="google_tag_manager_id"
                v-model="localFormData.google_tag_manager_id"
                :class="{ 'p-invalid': hasFieldError('google_tag_manager_id') }"
                class="w-full"
                placeholder="GTM-XXXXXX"
              />
              <small class="text-gray-500">Format: GTM-XXXXXX</small>
              <small v-if="hasFieldError('google_tag_manager_id')" class="block text-red-600 mt-1">
                {{ getFieldError('google_tag_manager_id') }}
              </small>
            </div>

            <!-- Google Analytics ID -->
            <div>
              <label for="google_analytics_id" class="block text-sm font-medium text-gray-700 mb-2">
                Google Analytics ID
              </label>
              <InputText
                id="google_analytics_id"
                v-model="localFormData.google_analytics_id"
                :class="{ 'p-invalid': hasFieldError('google_analytics_id') }"
                class="w-full"
                placeholder="G-XXXXXXXXXX"
              />
              <small class="text-gray-500">Format: G-XXXXXXXXXX</small>
              <small v-if="hasFieldError('google_analytics_id')" class="block text-red-600 mt-1">
                {{ getFieldError('google_analytics_id') }}
              </small>
            </div>

            <!-- Google Search Console Verification Code -->
            <div>
              <label
                for="google_search_console_code"
                class="block text-sm font-medium text-gray-700 mb-2"
              >
                Search Console Verification
              </label>
              <Textarea
                id="google_search_console_code"
                v-model="localFormData.google_search_console_code"
                :class="{ 'p-invalid': hasFieldError('google_search_console_code') }"
                class="w-full"
                rows="3"
                placeholder='<meta name="google-site-verification" content="..." />'
              />
              <small class="text-gray-500"
                >Paste the entire meta tag from Google Search Console</small
              >
              <small
                v-if="hasFieldError('google_search_console_code')"
                class="block text-red-600 mt-1"
              >
                {{ getFieldError('google_search_console_code') }}
              </small>
            </div>
          </div>
        </div>
      </div>

      <!-- Right Column - Empty for future expansion -->
      <div>
        <div
          class="bg-gray-50 rounded-lg border border-gray-200 p-5 h-full flex items-center justify-center"
        >
          <div class="text-center text-gray-500">
            <i class="pi pi-info-circle text-3xl mb-2"></i>
            <p class="text-sm">Additional tracking services can be added here</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import InputText from 'primevue/inputtext';
import Textarea from 'primevue/textarea';

interface LocalFormData {
  google_tag_manager_id: string | null;
  google_analytics_id: string | null;
  google_search_console_code: string | null;
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

// Watch for changes and emit
watch(
  localFormData,
  (newValue) => {
    emit('update:formData', newValue);
  },
  { deep: true }
);
</script>

<style scoped>
/* Component-specific styles if needed */
</style>
