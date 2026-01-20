<template>
  <router-link
    :to="`/leagues/${league.slug}`"
    class="league-card bg-[var(--bg-card)] border border-[var(--border)] rounded-[12px] overflow-hidden transition-all hover:border-[var(--cyan)] hover:-translate-y-1 cursor-pointer block relative"
  >
    <!-- Banner -->
    <div class="league-banner h-[120px] relative overflow-hidden" :style="bannerStyle">
      <div
        class="absolute bottom-0 left-0 right-0 h-[60px] bg-gradient-to-t from-[var(--bg-card)] to-transparent"
      ></div>
    </div>

    <!-- Logo (positioned outside banner to avoid overflow clipping) -->
    <div
      class="league-logo absolute top-[90px] left-6 w-[60px] h-[60px] bg-[var(--bg-elevated)] border-[3px] border-[var(--bg-card)] rounded-[12px] flex items-center justify-center font-[var(--font-display)] text-[1.25rem] font-bold text-[var(--cyan)] z-[2] overflow-hidden"
    >
      <img v-if="logoUrl" :src="logoUrl" :alt="league.name" class="w-full h-full object-cover" />
      <span v-else>{{ initials }}</span>
    </div>

    <!-- Content -->
    <div class="league-content pt-10 px-6 pb-6">
      <h3 class="font-[var(--font-display)] text-[1.1rem] font-semibold tracking-[0.5px] mb-2">
        {{ league.name }}
      </h3>

      <!-- Platform Badge -->
      <div
        v-if="primaryPlatform"
        class="inline-flex items-center gap-2 px-3 py-1 bg-[var(--cyan-dim)] text-[var(--cyan)] rounded-full text-[0.75rem] font-semibold mb-4"
      >
        <span>{{ platformIcon }}</span>
        <span>{{ primaryPlatform.name }}</span>
      </div>

      <!-- Stats -->
      <div class="league-stats flex gap-6 pt-4 border-t border-[var(--border)]">
        <div class="league-stat flex flex-col">
          <span
            class="font-[var(--font-display)] text-[1.25rem] font-bold text-[var(--text-primary)]"
          >
            {{ league.drivers_count }}
          </span>
          <span class="text-[0.75rem] text-[var(--text-muted)] uppercase tracking-[0.5px]">
            Drivers
          </span>
        </div>
        <div class="league-stat flex flex-col">
          <span
            class="font-[var(--font-display)] text-[1.25rem] font-bold text-[var(--text-primary)]"
          >
            {{ league.competitions_count }}
          </span>
          <span class="text-[0.75rem] text-[var(--text-muted)] uppercase tracking-[0.5px]">
            Competitions
          </span>
        </div>
      </div>
    </div>
  </router-link>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { PublicLeague } from '@public/types/public';

interface Props {
  league: PublicLeague;
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
