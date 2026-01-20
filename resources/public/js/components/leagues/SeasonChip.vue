<template>
  <router-link
    :to="`/leagues/${leagueSlug}/${competitionSlug}/${season.slug}`"
    :class="[
      'season-chip',
      'inline-block px-4 py-2 rounded-[var(--radius)] text-[0.85rem] font-[var(--font-body)] transition-all cursor-pointer',
      isCurrent
        ? 'bg-[var(--cyan-dim)] border border-[var(--cyan)] text-[var(--cyan)]'
        : 'bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--cyan)] hover:text-[var(--cyan)]',
    ]"
  >
    {{ season.name }}
  </router-link>
</template>

<script setup lang="ts">
import type { PublicSeason } from '@public/types/public';

interface Props {
  season: PublicSeason;
  isCurrent: boolean;
  leagueSlug: string;
  competitionSlug: string;
}

defineProps<Props>();
</script>
