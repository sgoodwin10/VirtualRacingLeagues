<template>
  <div
    class="league-header bg-[var(--bg-card)] border border-[var(--border)] rounded-[12px] overflow-hidden mb-8"
  >
    <!-- Banner -->
    <div class="league-header-banner h-[200px] relative" :style="bannerStyle"></div>

    <!-- Content -->
    <div
      class="league-header-content flex flex-col sm:flex-row items-start sm:items-end gap-6 px-6 pb-6 -mt-12 sm:-mt-[50px] relative z-[2]"
    >
      <!-- Logo -->
      <div
        class="league-header-logo w-[100px] h-[100px] bg-[var(--bg-elevated)] border-4 border-[var(--bg-card)] rounded-[16px] flex items-center justify-center font-[var(--font-display)] text-[2rem] font-bold text-[var(--cyan)] flex-shrink-0"
      >
        <img
          v-if="logoUrl"
          :src="logoUrl"
          :alt="league.name"
          class="w-full h-full object-cover rounded-[12px]"
        />
        <span v-else>{{ initials }}</span>
      </div>

      <!-- Info -->
      <div class="league-header-info flex-1">
        <h1
          class="league-header-name font-[var(--font-display)] text-[1.75rem] font-bold tracking-[1px] mb-2"
        >
          {{ league.name }}
        </h1>
        <div
          class="league-header-meta flex flex-wrap gap-4 text-[var(--text-secondary)] text-[0.9rem]"
        >
          <span v-if="primaryPlatform" class="flex items-center gap-2">
            <span>{{ platformIcon }}</span>
            <span>{{ primaryPlatform.name }}</span>
          </span>
          <span class="hidden sm:inline">•</span>
          <span>{{ stats.drivers_count }} Drivers</span>
          <span class="hidden sm:inline">•</span>
          <span>{{ stats.competitions_count }} Competitions</span>
          <span v-if="stats.active_seasons_count > 0" class="hidden sm:inline">•</span>
          <span v-if="stats.active_seasons_count > 0">
            {{ stats.active_seasons_count }} Active Seasons
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { PublicLeagueInfo, LeagueStats } from '@public/types/public';

interface Props {
  league: PublicLeagueInfo;
  stats: LeagueStats;
}

const props = defineProps<Props>();

/**
 * Get league initials from name
 */
const initials = computed(() => {
  return props.league.name
    .split(' ')
    .map((word) => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
});

/**
 * Get primary platform (first in array)
 */
const primaryPlatform = computed(() => {
  return props.league.platforms?.[0] || null;
});

/**
 * Get platform icon emoji based on platform name
 */
const platformIcon = computed(() => {
  const platformName = primaryPlatform.value?.name.toLowerCase() || '';

  if (platformName.includes('iracing')) return '🏎️';
  if (platformName.includes('gran turismo') || platformName.includes('gt7')) return '🎮';
  if (platformName.includes('assetto')) return '🏁';
  if (platformName.includes('f1')) return '🏎️';
  if (platformName.includes('forza')) return '🎮';

  return '🎮'; // Default
});

/**
 * Get logo URL from media object or fallback
 */
const logoUrl = computed(() => {
  // Try new media object first
  if (props.league.logo?.original) {
    return props.league.logo.original;
  }
  // Fallback to old logo_url
  return props.league.logo_url || null;
});

/**
 * Generate banner background style
 */
const bannerStyle = computed(() => {
  // Try new media object first
  if (props.league.header_image?.original) {
    return {
      backgroundImage: `url(${props.league.header_image.original})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    };
  }

  // Fallback to old header_image_url
  if (props.league.header_image_url) {
    return {
      backgroundImage: `url(${props.league.header_image_url})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    };
  }

  // Fallback to gradient
  return {
    background: 'linear-gradient(135deg, var(--bg-elevated), var(--bg-highlight))',
  };
});
</script>
