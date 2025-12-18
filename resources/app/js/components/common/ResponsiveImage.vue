<script setup lang="ts">
import { ref, computed } from 'vue';
import type { MediaObject, MediaConversions } from '@app/types/media';

interface Props {
  media: MediaObject | null | undefined;
  fallbackUrl?: string;
  alt: string;
  sizes?: string;
  imgClass?: string;
  loading?: 'lazy' | 'eager';
  conversion?: keyof MediaConversions;
  showPlaceholder?: boolean;
  placeholderColor?: string;
}

const props = withDefaults(defineProps<Props>(), {
  fallbackUrl: undefined,
  sizes: '100vw',
  imgClass: undefined,
  loading: 'lazy',
  conversion: undefined,
  showPlaceholder: true,
  placeholderColor: undefined,
});

const isLoading = ref(true);
const hasError = ref(false);

/**
 * Compute the src - prefer media object, fallback to old URL
 */
const imageSrc = computed(() => {
  if (props.media) {
    return props.conversion ? props.media.conversions[props.conversion] : props.media.original;
  }
  return props.fallbackUrl || '';
});

/**
 * Use srcset if available from media object
 */
const imageSrcset = computed(() => props.media?.srcset || '');

/**
 * Determine if we have an image to display
 */
const hasImage = computed(() => !!imageSrc.value);

/**
 * Handle image load event
 */
function handleLoad(): void {
  isLoading.value = false;
  hasError.value = false;
}

/**
 * Handle image error event
 */
function handleError(): void {
  isLoading.value = false;
  hasError.value = true;
}

/**
 * Compute placeholder style
 */
const placeholderStyle = computed(() => {
  if (props.placeholderColor) {
    return { backgroundColor: props.placeholderColor };
  }
  return {};
});
</script>

<template>
  <div v-if="hasImage" class="responsive-image-wrapper">
    <div v-if="showPlaceholder && isLoading" class="image-placeholder" :style="placeholderStyle">
      <div class="skeleton-shimmer" />
    </div>
    <img
      v-show="!hasError"
      :src="imageSrc"
      :srcset="imageSrcset"
      :sizes="sizes"
      :alt="alt"
      :loading="loading"
      :class="imgClass"
      @load="handleLoad"
      @error="handleError"
    />
  </div>
</template>

<style scoped>
.responsive-image-wrapper {
  position: relative;
  display: inline-block;
  width: 100%;
}

.image-placeholder {
  position: absolute;
  inset: 0;
  background: var(--surface-100);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.skeleton-shimmer {
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    var(--surface-100) 25%,
    var(--surface-200) 50%,
    var(--surface-100) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite ease-in-out;
}

@keyframes shimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}
</style>
