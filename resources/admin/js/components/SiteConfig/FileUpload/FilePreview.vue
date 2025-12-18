<template>
  <div v-if="file" class="file-preview">
    <div class="relative group">
      <!-- Image Preview -->
      <div class="aspect-video w-full bg-gray-50 rounded-lg overflow-hidden border border-gray-200">
        <!-- Use ResponsiveImage for MediaObject format -->
        <ResponsiveImage
          v-if="mediaObject"
          :media="mediaObject"
          :fallback-url="legacyUrl"
          :alt="fileName || 'Preview'"
          img-class="w-full h-full object-contain"
        />
        <!-- Fallback for File objects or legacy SiteConfigFile -->
        <img
          v-else
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
        <span v-if="fileSize > 0" class="ml-2 text-gray-500">{{ formatFileSize(fileSize) }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onUnmounted, ref, watch } from 'vue';
import ResponsiveImage from '@admin/components/common/ResponsiveImage.vue';
import type { SiteConfigFile } from '@admin/types/siteConfig';
import type { MediaObject } from '@admin/types/media';
import { logger } from '@admin/utils/logger';

interface Props {
  file: File | SiteConfigFile | MediaObject | null;
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
 * Track the current object URL for cleanup
 */
const currentObjectUrl = ref<string | null>(null);

/**
 * Check if file is a MediaObject (has conversions property)
 */
const isMediaObject = (file: unknown): file is MediaObject => {
  return (
    typeof file === 'object' &&
    file !== null &&
    'id' in file &&
    'original' in file &&
    'conversions' in file &&
    'srcset' in file
  );
};

/**
 * Get MediaObject if available (prefer MediaObject format)
 */
const mediaObject = computed(() => {
  if (!props.file) return null;
  if (isMediaObject(props.file)) return props.file;
  return null;
});

/**
 * Get legacy URL for backward compatibility
 */
const legacyUrl = computed(() => {
  if (!props.file) return '';

  // If it's a SiteConfigFile (from API), use the URL
  if ('url' in props.file && typeof props.file.url === 'string') {
    return props.file.url;
  }

  return '';
});

/**
 * Get preview URL for the file (used for File objects only)
 */
const previewUrl = computed(() => {
  if (!props.file) return '';

  // If it's a File object (newly uploaded), use stored object URL
  if (props.file instanceof File) {
    return currentObjectUrl.value || '';
  }

  // If it's a SiteConfigFile (from API), use the URL
  if ('url' in props.file && typeof props.file.url === 'string') {
    return props.file.url;
  }

  // If it's a MediaObject, use original
  if (isMediaObject(props.file)) {
    return props.file.original;
  }

  return '';
});

/**
 * Cleanup function to revoke object URL
 */
const revokeObjectUrl = (): void => {
  if (currentObjectUrl.value) {
    URL.revokeObjectURL(currentObjectUrl.value);
    currentObjectUrl.value = null;
  }
};

/**
 * Watch for file changes and manage object URLs
 */
watch(
  () => props.file,
  (newFile, oldFile) => {
    // Cleanup old URL if file changed
    if (oldFile !== newFile) {
      revokeObjectUrl();
    }

    // Create new URL if new file is a File object
    if (newFile instanceof File) {
      currentObjectUrl.value = URL.createObjectURL(newFile);
    }
  },
  { immediate: true },
);

/**
 * Cleanup on component unmount
 */
onUnmounted(() => {
  revokeObjectUrl();
});

/**
 * Get file name for display
 */
const fileName = computed(() => {
  if (!props.file) return '';

  if (props.file instanceof File) {
    return props.file.name;
  }

  if ('file_name' in props.file && typeof props.file.file_name === 'string') {
    return props.file.file_name;
  }

  if (isMediaObject(props.file)) {
    // Extract filename from original URL
    const urlParts = props.file.original.split('/');
    return urlParts[urlParts.length - 1] || 'Image';
  }

  return 'Unknown file';
});

/**
 * Get file size in bytes
 */
const fileSize = computed(() => {
  if (!props.file) return 0;

  if (props.file instanceof File) {
    return props.file.size;
  }

  if ('file_size' in props.file && typeof props.file.file_size === 'number') {
    return props.file.file_size;
  }

  // MediaObject doesn't include file size
  return 0;
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
