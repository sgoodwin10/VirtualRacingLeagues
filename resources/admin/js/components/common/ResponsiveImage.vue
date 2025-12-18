<template>
  <div v-if="imageSrc" class="responsive-image-wrapper" :class="wrapperClass">
    <!-- Loading Placeholder -->
    <div
      v-if="showPlaceholder && isLoading"
      class="image-placeholder"
      :class="imgClass"
      :style="placeholderStyle"
    >
      <div class="skeleton-shimmer" />
    </div>

    <!-- Image -->
    <img
      v-show="!isLoading || !showPlaceholder"
      :src="imageSrc"
      :srcset="imageSrcset"
      :sizes="sizes"
      :alt="alt"
      :loading="loading"
      :class="imgClass"
      @load="onLoad"
      @error="onError"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import type { MediaObject, MediaConversions } from '@admin/types/media';

/**
 * Props interface for ResponsiveImage component
 */
export interface ResponsiveImageProps {
  /**
   * Media object with responsive conversions
   */
  media?: MediaObject | null;

  /**
   * Fallback URL for backward compatibility with old logo_url fields
   */
  fallbackUrl?: string;

  /**
   * Alt text for the image (required for accessibility)
   */
  alt: string;

  /**
   * Sizes attribute for responsive images
   * @default '100vw'
   */
  sizes?: string;

  /**
   * CSS classes to apply to the image
   */
  imgClass?: string;

  /**
   * Image loading strategy
   * @default 'lazy'
   */
  loading?: 'lazy' | 'eager';

  /**
   * Specific conversion to use (if not provided, uses original)
   */
  conversion?: keyof MediaConversions;

  /**
   * Whether to show a loading placeholder
   * @default true
   */
  showPlaceholder?: boolean;

  /**
   * Custom placeholder background color
   */
  placeholderColor?: string;
}

// Props with defaults
const props = withDefaults(defineProps<ResponsiveImageProps>(), {
  loading: 'lazy',
  sizes: '100vw',
  media: null,
  fallbackUrl: '',
  imgClass: '',
  conversion: undefined,
  showPlaceholder: true,
  placeholderColor: undefined,
});

// State
const isLoading = ref(true);

/**
 * Compute the image source
 * Priority: media conversion > media original > fallbackUrl
 */
const imageSrc = computed(() => {
  if (props.media) {
    // If a specific conversion is requested, use it
    if (props.conversion) {
      return props.media.conversions[props.conversion];
    }
    // Otherwise use the original
    return props.media.original;
  }
  // Fall back to old URL format for backward compatibility
  return props.fallbackUrl || '';
});

/**
 * Compute the srcset attribute
 * Only use srcset if we have a media object with conversions
 */
const imageSrcset = computed(() => {
  return props.media?.srcset || '';
});

/**
 * Compute wrapper classes
 */
const wrapperClass = computed(() => ({
  'is-loading': isLoading.value,
}));

/**
 * Compute placeholder style
 */
const placeholderStyle = computed(() => {
  if (props.placeholderColor) {
    return { backgroundColor: props.placeholderColor };
  }
  return {};
});

/**
 * Handle image load event
 */
const onLoad = (): void => {
  isLoading.value = false;
};

/**
 * Handle image error event
 */
const onError = (): void => {
  isLoading.value = false;
};
</script>

<style scoped>
.responsive-image-wrapper {
  position: relative;
  display: inline-block;
  width: 100%;
}

.image-placeholder {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: var(--p-surface-100, #f3f4f6);
  overflow: hidden;
}

.skeleton-shimmer {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent 0%,
    var(--p-surface-200, #e5e7eb) 50%,
    transparent 100%
  );
  animation: shimmer 1.5s infinite;
}

@keyframes shimmer {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}

/* Smooth fade-in transition when image loads */
.responsive-image-wrapper img {
  transition: opacity 0.3s ease-in-out;
  opacity: 1;
}

.responsive-image-wrapper.is-loading img {
  opacity: 0;
}
</style>
