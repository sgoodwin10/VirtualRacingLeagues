<template>
  <router-link
    :to="primarySeasonUrl"
    class="competition-card block bg-[var(--bg-card)] border border-[var(--border)] rounded-[8px] p-5 mb-4 transition-all hover:border-[var(--cyan)] cursor-pointer"
  >
    <!-- Header -->
    <div class="competition-header flex justify-between items-center mb-4">
      <h3
        class="competition-name font-[var(--font-display)] text-[1rem] font-semibold tracking-[0.5px]"
      >
        {{ competition.name }}
      </h3>
    </div>

    <!-- Seasons List - Single Line -->
    <div class="seasons-list flex flex-wrap items-center gap-2" @click.stop>
      <!-- Active Seasons -->
      <SeasonChip
        v-for="season in activeSeasons"
        :key="season.id"
        :season="season"
        :is-current="true"
        :league-slug="leagueSlug"
        :competition-slug="competition.slug"
      />

      <!-- Vertical Separator -->
      <div
        v-if="activeSeasons.length > 0 && completedSeasons.length > 0"
        class="h-6 w-px bg-gradient-to-b from-transparent via-[var(--border)] to-transparent mx-2"
      ></div>

      <!-- Completed Seasons -->
      <SeasonChip
        v-for="season in completedSeasons"
        :key="season.id"
        :season="season"
        :is-current="false"
        :league-slug="leagueSlug"
        :competition-slug="competition.slug"
      />
    </div>
  </router-link>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type {
  PublicCompetitionDetail,
  PublicSeasonSummary,
  PublicSeason,
} from '@public/types/public';
import SeasonChip from '@public/components/leagues/SeasonChip.vue';
import VrlBadge from '@public/components/common/badges/VrlBadge.vue';
import type { BadgeVariant } from '@public/types/components';

interface Props {
  competition: PublicCompetitionDetail;
  leagueSlug: string;
}

const props = defineProps<Props>();

/**
 * Determine competition status based on active seasons
 */
const statusVariant = computed((): BadgeVariant => {
  return props.competition.stats.active_seasons > 0 ? 'green' : 'default';
});

/**
 * Status label
 */
const statusLabel = computed(() => {
  return props.competition.stats.active_seasons > 0 ? 'Active' : 'Completed';
});

/**
 * Convert PublicSeasonSummary to PublicSeason format
 */
const mapSeason = (season: PublicSeasonSummary): PublicSeason => ({
  id: season.id,
  name: season.name,
  slug: season.slug,
  car_class: season.car_class,
  description: null,
  logo_url: '',
  banner_url: null,
  status: season.status,
  is_active: season.status === 'active',
  is_completed: season.status === 'completed',
  race_divisions_enabled: false,
  stats: {
    ...season.stats,
    total_races: 0,
    completed_races: 0,
  },
});

/**
 * Active seasons - sorted by ID descending (most recent first)
 */
const activeSeasons = computed((): PublicSeason[] => {
  return props.competition.seasons
    .filter((s) => s.status === 'active')
    .map(mapSeason)
    .sort((a, b) => b.id - a.id);
});

/**
 * Completed seasons - sorted by ID descending (most recent first)
 */
const completedSeasons = computed((): PublicSeason[] => {
  return props.competition.seasons
    .filter((s) => s.status === 'completed')
    .map(mapSeason)
    .sort((a, b) => b.id - a.id);
});

/**
 * URL for the primary season (first active, or first completed if no active)
 */
const primarySeasonUrl = computed((): string => {
  const primarySeason = activeSeasons.value[0] || completedSeasons.value[0];
  if (!primarySeason) return '#';
  return `/leagues/${props.leagueSlug}/${props.competition.slug}/${primarySeason.slug}`;
});
</script>
