<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import type { MediaObject, MediaConversions } from '@public/types/media';

interface Props {
  media: MediaObject | null | undefined;
  fallbackUrl?: string; // For backward compatibility
  alt: string;
  sizes?: string; // e.g., "(max-width: 640px) 100vw, 640px"
  imageClass?: string;
  loading?: 'lazy' | 'eager';
  conversion?: keyof MediaConversions;
  showPlaceholder?: boolean; // Show loading placeholder while image loads
  aspectRatio?: string; // e.g., "16/9" to prevent layout shift
  placeholderColor?: string; // Custom placeholder background color
}

const props = withDefaults(defineProps<Props>(), {
  fallbackUrl: undefined,
  sizes: '100vw',
  imageClass: undefined,
  loading: 'lazy',
  conversion: undefined,
  showPlaceholder: true,
  aspectRatio: undefined,
  placeholderColor: undefined,
});

const isImageLoaded = ref(false);
const hasError = ref(false);
const imgRef = ref<HTMLImageElement | undefined>();

const imageSrc = computed(() => {
  if (props.media) {
    return props.conversion ? props.media.conversions[props.conversion] : props.media.original;
  }
  return props.fallbackUrl || '';
});

const imageSrcset = computed(() => props.media?.srcset || '');

const showPlaceholderState = computed(() => {
  return props.showPlaceholder && !isImageLoaded.value && !hasError.value;
});

const containerStyle = computed(() => {
  if (props.aspectRatio) {
    return {
      aspectRatio: props.aspectRatio,
    };
  }
  return {};
});

const placeholderStyle = computed(() => {
  if (props.placeholderColor) {
    return { backgroundColor: props.placeholderColor };
  }
  return {};
});

const handleImageLoad = () => {
  isImageLoaded.value = true;
};

const handleImageError = () => {
  hasError.value = true;
  isImageLoaded.value = true; // Consider loaded to hide placeholder
};

// For eager loading, check if image is already cached
onMounted(() => {
  if (props.loading === 'eager' && imgRef.value?.complete) {
    isImageLoaded.value = true;
  }
});
</script>

<template>
  <div v-if="imageSrc" class="responsive-image-wrapper" :style="containerStyle">
    <!-- Loading Placeholder -->
    <div
      v-if="showPlaceholderState"
      class="image-placeholder"
      :style="placeholderStyle"
      aria-hidden="true"
    >
      <div class="shimmer-wrapper">
        <div class="shimmer" />
      </div>
    </div>

    <!-- Actual Image -->
    <img
      ref="imgRef"
      :src="imageSrc"
      :srcset="imageSrcset"
      :sizes="sizes"
      :alt="alt"
      :loading="loading"
      :class="[imageClass, { 'image-loaded': isImageLoaded }]"
      class="responsive-image"
      @load="handleImageLoad"
      @error="handleImageError"
    />
  </div>
</template>

<style scoped>
.responsive-image-wrapper {
  position: relative;
  overflow: hidden;
  background-color: var(--bg-tertiary);
}

.image-placeholder {
  position: absolute;
  inset: 0;
  background-color: var(--bg-tertiary);
  z-index: 1;
}

.shimmer-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.shimmer {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    90deg,
    transparent 0%,
    var(--bg-elevated) 20%,
    var(--bg-elevated) 40%,
    transparent 60%
  );
  background-size: 200% 100%;
  animation: shimmer 2s infinite linear;
}

@keyframes shimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

.responsive-image {
  width: 100%;
  height: 100%;
  opacity: 0;
  transition: opacity 0.3s var(--ease-racing, cubic-bezier(0.16, 1, 0.3, 1));
  position: relative;
  z-index: 2;
}

.responsive-image.image-loaded {
  opacity: 1;
}
</style>
