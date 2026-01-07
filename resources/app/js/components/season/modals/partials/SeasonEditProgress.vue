<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  seasonName: string;
  driverSettingsCount: number;
  teamSettingsEnabled: boolean;
  mediaCount: number;
  progressPercentage: number;
}

const props = defineProps<Props>();

const displayName = computed(() => {
  if (!props.seasonName || props.seasonName.trim() === '') {
    return '--';
  }
  return props.seasonName.length > 15
    ? props.seasonName.substring(0, 15) + '...'
    : props.seasonName;
});

const nameComplete = computed(() => props.seasonName.trim() !== '');
const driverSettingsText = computed(() => `${props.driverSettingsCount}`);
const teamSettingsText = computed(() => (props.teamSettingsEnabled ? 'ON' : 'OFF'));
const mediaText = computed(() => `${props.mediaCount}/2`);
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

      <!-- Driver Settings -->
      <div class="flex items-center justify-between">
        <span class="text-[var(--text-secondary)]">Driver Settings</span>
        <span
          :class="{
            'text-[var(--green)] font-medium': driverSettingsCount > 0,
            'text-[var(--text-muted)]': driverSettingsCount === 0,
          }"
          class="font-mono"
        >
          {{ driverSettingsText }}
        </span>
      </div>

      <!-- Team Settings -->
      <div class="flex items-center justify-between">
        <span class="text-[var(--text-secondary)]">Team Settings</span>
        <span
          :class="{
            'text-[var(--green)] font-medium': teamSettingsEnabled,
            'text-[var(--text-muted)]': !teamSettingsEnabled,
          }"
          class="font-mono uppercase"
        >
          {{ teamSettingsText }}
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
