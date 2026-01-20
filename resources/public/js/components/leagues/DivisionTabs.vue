<template>
  <div class="standings-tabs flex gap-2 flex-wrap">
    <button
      v-for="division in divisions"
      :key="division.division_id"
      :class="[
        'standings-tab',
        'px-4 py-2 rounded-[var(--radius)] font-[var(--font-display)] text-[0.8rem] cursor-pointer transition-all',
        modelValue === division.division_id
          ? 'bg-[var(--cyan)] border border-[var(--cyan)] text-[var(--bg-dark)]'
          : 'bg-transparent border border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--cyan)]',
      ]"
      @click="$emit('update:modelValue', division.division_id)"
    >
      {{ division.division_name }}
    </button>
  </div>
</template>

<script setup lang="ts">
import type { SeasonStandingDivision } from '@public/types/public';

interface Props {
  divisions: SeasonStandingDivision[];
  modelValue: number | null;
}

interface Emits {
  (e: 'update:modelValue', value: number): void;
}

defineProps<Props>();
defineEmits<Emits>();
</script>
