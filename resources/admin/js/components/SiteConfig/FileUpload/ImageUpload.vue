<template>
  <div class="image-upload">
    <!-- Label -->
    <label v-if="label" class="block text-sm font-medium text-gray-700 mb-2">
      {{ label }}
      <span v-if="required" class="text-red-500">*</span>
    </label>

    <!-- Help Text -->
    <p v-if="helpText" class="text-xs text-gray-500 mb-2">
      {{ helpText }}
    </p>

    <!-- Current File Preview or Upload Area -->
    <div v-if="currentFile || modelValue">
      <FilePreview :file="currentFile || modelValue" @remove="handleRemove" />
    </div>
    <div v-else>
      <!-- Upload Button -->
      <div
        class="border-2 border-dashed rounded-lg p-6 text-center transition-colors duration-200"
        :class="[
          isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-gray-50',
          hasError ? 'border-red-300' : '',
        ]"
        @dragover.prevent="handleDragOver"
        @dragleave.prevent="handleDragLeave"
        @drop.prevent="handleDrop"
      >
        <input
          ref="fileInputRef"
          type="file"
          :accept="acceptedTypesString"
          class="hidden"
          @change="handleFileSelect"
        />

        <div class="space-y-2">
          <i class="pi pi-cloud-upload text-4xl text-gray-400"></i>
          <div>
            <button
              type="button"
              class="text-blue-600 hover:text-blue-700 font-medium"
              @click="triggerFileSelect"
            >
              Choose a file
            </button>
            <span class="text-gray-600"> or drag and drop</span>
          </div>
          <p class="text-xs text-gray-500">
            {{ acceptedExtensionsString }} up to {{ maxSizeFormatted }}
          </p>
        </div>
      </div>
    </div>

    <!-- Error Message -->
    <div v-if="hasError && errorMessage" class="mt-2 text-sm text-red-600">
      <i class="pi pi-exclamation-circle mr-1"></i>
      {{ errorMessage }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, type Ref } from 'vue';
import FilePreview from './FilePreview.vue';
import type { SiteConfigFile, SiteConfigFileType } from '@admin/types/siteConfig';
import type { MediaObject } from '@admin/types/media';
import { FILE_VALIDATION } from '@admin/types/siteConfig';

interface Props {
  modelValue: File | SiteConfigFile | MediaObject | null;
  fileType: SiteConfigFileType;
  label?: string;
  helpText?: string;
  required?: boolean;
  errorMessage?: string | null;
}

interface Emits {
  (e: 'update:modelValue', value: File | null): void;
  (e: 'remove'): void;
  (e: 'error', message: string): void;
}

const props = withDefaults(defineProps<Props>(), {
  label: '',
  helpText: '',
  required: false,
  errorMessage: null,
});

const emit = defineEmits<Emits>();

// State
const fileInputRef = ref<HTMLInputElement | null>(null);
const isDragging = ref(false);
const currentFile: Ref<File | null> = ref(null);

// Computed
const validation = computed(() => FILE_VALIDATION[props.fileType]);

const acceptedTypesString = computed(() => {
  return validation.value.acceptedTypes.join(',');
});

const acceptedExtensionsString = computed(() => {
  return validation.value.extensions.join(', ').toUpperCase();
});

const maxSizeFormatted = computed(() => {
  const kb = validation.value.maxSize;
  return kb >= 1024 ? `${kb / 1024}MB` : `${kb}KB`;
});

const hasError = computed(() => {
  return !!props.errorMessage;
});

/**
 * Trigger file input click
 */
const triggerFileSelect = (): void => {
  fileInputRef.value?.click();
};

/**
 * Handle file selection from input
 */
const handleFileSelect = (event: Event): void => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];

  if (file) {
    validateAndSetFile(file);
  }
};

/**
 * Handle drag over
 */
const handleDragOver = (): void => {
  isDragging.value = true;
};

/**
 * Handle drag leave
 */
const handleDragLeave = (): void => {
  isDragging.value = false;
};

/**
 * Handle file drop
 */
const handleDrop = (event: DragEvent): void => {
  isDragging.value = false;

  const file = event.dataTransfer?.files?.[0];
  if (file) {
    validateAndSetFile(file);
  }
};

/**
 * Validate file and set if valid
 */
const validateAndSetFile = (file: File): void => {
  // Validate file type
  const acceptedTypes = validation.value.acceptedTypes as readonly string[];
  if (!acceptedTypes.includes(file.type)) {
    emit('error', `Invalid file type. Accepted types: ${acceptedExtensionsString.value}`);
    return;
  }

  // Validate file size
  const fileSizeKB = file.size / 1024;
  if (fileSizeKB > validation.value.maxSize) {
    emit('error', `File size exceeds maximum of ${maxSizeFormatted.value}`);
    return;
  }

  // File is valid
  currentFile.value = file;
  emit('update:modelValue', file);
};

/**
 * Handle file removal
 */
const handleRemove = (): void => {
  currentFile.value = null;
  if (fileInputRef.value) {
    fileInputRef.value.value = '';
  }
  emit('update:modelValue', null);
  emit('remove');
};
</script>

<style scoped>
.image-upload {
  width: 100%;
}
</style>
