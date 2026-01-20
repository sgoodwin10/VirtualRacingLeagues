<template>
  <div
    class="competition-card bg-[var(--bg-card)] border border-[var(--border)] rounded-[8px] p-5 mb-4 transition-all hover:border-[var(--cyan)]"
  >
    <!-- Header -->
    <div class="competition-header flex justify-between items-center mb-4">
      <h3
        class="competition-name font-[var(--font-display)] text-[1rem] font-semibold tracking-[0.5px]"
      >
        {{ competition.name }}
      </h3>

      <VrlBadge :variant="statusVariant">
        {{ statusLabel }}
      </VrlBadge>
    </div>

    <!-- Seasons List -->
    <div class="seasons-list flex flex-wrap gap-2">
      <SeasonChip
        v-for="season in seasonsForDisplay"
        :key="season.id"
        :season="season"
        :is-current="season.status === 'active'"
        :league-slug="leagueSlug"
        :competition-slug="competition.slug"
      />
    </div>
  </div>
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
 * Convert PublicSeasonSummary to PublicSeason for SeasonChip
 */
const seasonsForDisplay = computed((): PublicSeason[] => {
  return props.competition.seasons.map(
    (season: PublicSeasonSummary): PublicSeason => ({
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
    }),
  );
});
</script>
