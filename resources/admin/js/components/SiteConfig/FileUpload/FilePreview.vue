<template>
  <div v-if="file" class="file-preview">
    <div class="relative group">
      <!-- Image Preview -->
      <div class="aspect-video w-full bg-gray-50 rounded-lg overflow-hidden border border-gray-200">
        <img
          :src="previewUrl"
          :alt="fileName || 'Preview'"
          class="w-full h-full object-contain"
          @error="onImageError"
        />
      </div>

      <!-- Remove Button Overlay -->
      <button
        v-if="!readonly"
        type="button"
        class="absolute top-2 right-2 p-2 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
        @click="handleRemove"
      >
        <i class="pi pi-times text-sm"></i>
      </button>
    </div>

    <!-- File Info -->
    <div class="mt-2 text-sm text-gray-600">
      <div class="flex items-center justify-between">
        <span class="truncate">{{ fileName }}</span>
        <span class="ml-2 text-gray-500">{{ formatFileSize(fileSize) }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { SiteConfigFile } from '@admin/types/siteConfig';
import { logger } from '@admin/utils/logger';

interface Props {
  file: File | SiteConfigFile | null;
  readonly?: boolean;
}

interface Emits {
  (e: 'remove'): void;
}

const props = withDefaults(defineProps<Props>(), {
  readonly: false,
});

const emit = defineEmits<Emits>();

/**
 * Get preview URL for the file
 */
const previewUrl = computed(() => {
  if (!props.file) return '';

  // If it's a File object (newly uploaded), create object URL
  if (props.file instanceof File) {
    return URL.createObjectURL(props.file);
  }

  // If it's a SiteConfigFile (from API), use the URL
  return (props.file as SiteConfigFile).url;
});

/**
 * Get file name for display
 */
const fileName = computed(() => {
  if (!props.file) return '';

  if (props.file instanceof File) {
    return props.file.name;
  }

  return (props.file as SiteConfigFile).file_name;
});

/**
 * Get file size in bytes
 */
const fileSize = computed(() => {
  if (!props.file) return 0;

  if (props.file instanceof File) {
    return props.file.size;
  }

  return (props.file as SiteConfigFile).file_size;
});

/**
 * Format file size for display
 */
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
};

/**
 * Handle image load error
 */
const onImageError = (event: Event): void => {
  logger.error('Failed to load image:', event);
  // You could set a placeholder image here
};

/**
 * Handle remove button click
 */
const handleRemove = (): void => {
  emit('remove');
};
</script>

<style scoped>
.file-preview {
  width: 100%;
}
</style>
