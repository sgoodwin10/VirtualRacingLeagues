<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  leagueName: string;
  platformCount: number;
  visibility: string;
  mediaCount: number;
  progressPercentage: number;
}

const props = defineProps<Props>();

const displayName = computed(() => {
  if (!props.leagueName || props.leagueName.trim() === '') {
    return '--';
  }
  return props.leagueName.length > 15
    ? props.leagueName.substring(0, 15) + '...'
    : props.leagueName;
});

const nameComplete = computed(() => props.leagueName.trim() !== '');
const platformsComplete = computed(() => props.platformCount > 0);
const mediaText = computed(() => `${props.mediaCount}/3`);
</script>

<template>
  <div class="p-4 border-t border-[var(--border)] bg-[var(--bg-elevated)]">
    <div class="text-sidebar-label mb-3 text-[var(--cyan)]">Completion</div>

    <div class="space-y-2">
      <!-- Name -->
      <div class="flex items-center justify-between">
        <span class="text-[var(--text-secondary)]">Name</span>
        <span
          :class="{
            'text-[var(--green)] font-medium': nameComplete,
            'text-[var(--text-muted)]': !nameComplete,
          }"
          class="font-mono"
        >
          {{ displayName }}
        </span>
      </div>

      <!-- Platforms -->
      <div class="flex items-center justify-between">
        <span class="text-[var(--text-secondary)]">Platforms</span>
        <span
          :class="{
            'text-[var(--green)] font-medium': platformsComplete,
            'text-[var(--text-muted)]': !platformsComplete,
          }"
          class="font-mono"
        >
          {{ platformCount }}
        </span>
      </div>

      <!-- Visibility -->
      <div class="flex items-center justify-between">
        <span class="text-[var(--text-secondary)]">Visibility</span>
        <span class="text-[var(--green)] font-medium font-mono uppercase">
          {{ visibility }}
        </span>
      </div>

      <!-- Media -->
      <div class="flex items-center justify-between">
        <span class="text-[var(--text-secondary)]">Media</span>
        <span class="text-[var(--text-muted)] font-mono">
          {{ mediaText }}
        </span>
      </div>
    </div>

    <!-- Progress Bar -->
    <div class="mt-4">
      <div
        class="h-1 bg-[var(--bg-card)] rounded-full overflow-hidden border border-[var(--border-muted)]"
      >
        <div
          class="h-full bg-gradient-to-r from-[var(--cyan)] to-[var(--green)] transition-all duration-300"
          :style="{ width: `${progressPercentage}%` }"
        ></div>
      </div>
    </div>
  </div>
</template>
