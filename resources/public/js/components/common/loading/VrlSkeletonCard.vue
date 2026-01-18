<script setup lang="ts">
import { computed } from 'vue';
import VrlSkeleton from './VrlSkeleton.vue';
import VrlSkeletonAvatar from './VrlSkeletonAvatar.vue';
import VrlSkeletonText from './VrlSkeletonText.vue';
import type { SkeletonCardLayout, SkeletonSize } from '@public/types/loading';

interface Props {
  /** Show avatar on the left */
  showAvatar?: boolean;

  /** Avatar size */
  avatarSize?: Exclude<SkeletonSize, 'xl'>;

  /** Show title skeleton */
  showTitle?: boolean;

  /** Number of text lines */
  textLines?: number;

  /** Layout direction */
  layout?: SkeletonCardLayout;
}

const props = withDefaults(defineProps<Props>(), {
  showAvatar: true,
  avatarSize: 'md',
  showTitle: true,
  textLines: 2,
  layout: 'horizontal',
});

const cardClasses = computed(() => [
  'flex',
  'gap-4',
  props.layout === 'horizontal' ? 'flex-row items-start' : 'flex-col items-center',
]);
</script>

<template>
  <div :class="cardClasses" data-test="skeleton-card">
    <VrlSkeletonAvatar v-if="showAvatar" :size="avatarSize" />

    <div class="flex-1 min-w-0" data-test="skeleton-card-content">
      <VrlSkeleton v-if="showTitle" type="title" class="mb-3" data-test="skeleton-card-title" />
      <VrlSkeletonText :lines="textLines" data-test="skeleton-card-text" />
    </div>
  </div>
</template>
