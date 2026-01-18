<script setup lang="ts">
import VrlSkeleton from './VrlSkeleton.vue';

interface Props {
  /** Number of text lines to render */
  lines?: number;

  /** Make last line 60% width */
  shortLastLine?: boolean;

  /** Gap between lines (CSS value) */
  gap?: string;
}

const props = withDefaults(defineProps<Props>(), {
  lines: 3,
  shortLastLine: true,
  gap: '0.5rem',
});

const isLastLine = (index: number): boolean => index === props.lines - 1;
</script>

<template>
  <div class="flex flex-col" :style="{ gap }" data-test="skeleton-text-wrapper">
    <VrlSkeleton
      v-for="(_, index) in lines"
      :key="index"
      type="text"
      :width="isLastLine(index) && shortLastLine ? '60%' : '100%'"
    />
  </div>
</template>
