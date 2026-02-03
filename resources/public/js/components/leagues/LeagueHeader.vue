<template>
  <div class="league-header-wrapper mb-8">
    <!-- Header Card -->
    <div
      class="league-header bg-[var(--bg-card)] border border-[var(--border)] rounded-[12px] overflow-hidden"
    >
      <!-- Banner -->
      <div class="league-header-banner h-[200px] relative" :style="bannerStyle"></div>

      <!-- Content -->
      <div
        class="league-header-content flex flex-col sm:flex-row items-start sm:items-end gap-6 px-6 pb-4 -mt-12 sm:-mt-[50px] relative z-[2]"
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
          <div class="flex items-start justify-between gap-4 mb-2">
            <h1
              class="league-header-name font-[var(--font-display)] text-[1.75rem] font-bold tracking-[1px]"
            >
              {{ league.name }}
            </h1>
          </div>
          <div class="w-full flex flex-row">
            <div
              class="league-header-meta flex flex-nowrap items-center gap-4 text-[var(--text-secondary)] text-[0.9rem] w-full whitespace-nowrap"
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
                {{ stats.active_seasons_count }}
                {{ stats.active_seasons_count > 1 ? 'Active Seasons' : 'Active Season' }}
              </span>
            </div>
            <div>
              <VrlButton
                v-if="showAboutButton"
                :icon="PhInfo"
                label="About"
                variant="secondary"
                size="sm"
                type="button"
                aria-label="View league information"
                @click="handleAboutClick"
              />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Social Media Links (floating below header) -->
    <div
      v-if="hasSocialLinks"
      class="league-header-socials flex flex-wrap justify-center items-center gap-3 py-4"
    >
      <!-- Discord -->
      <a
        v-if="league.discord_url"
        :href="league.discord_url"
        target="_blank"
        rel="noopener noreferrer"
        class="social-link flex items-center gap-2 px-3 py-1.5 rounded-md bg-[var(--bg-elevated)] text-[#5865F2] text-[0.85rem] hover:bg-[#5865F2] hover:text-white transition-colors"
      >
        <PhDiscordLogo :size="18" weight="fill" />
        <span>Discord</span>
      </a>

      <!-- Website -->
      <a
        v-if="league.website_url"
        :href="league.website_url"
        target="_blank"
        rel="noopener noreferrer"
        class="social-link flex items-center gap-2 px-3 py-1.5 rounded-md bg-[var(--bg-elevated)] text-[var(--cyan)] text-[0.85rem] hover:bg-[var(--cyan)] hover:text-white transition-colors"
      >
        <PhGlobe :size="18" weight="bold" />
        <span>Website</span>
      </a>

      <!-- Twitter/X -->
      <a
        v-if="league.twitter_handle"
        :href="`https://twitter.com/${league.twitter_handle}`"
        target="_blank"
        rel="noopener noreferrer"
        class="social-link flex items-center gap-2 px-3 py-1.5 rounded-md bg-[var(--bg-elevated)] text-[var(--text-primary)] text-[0.85rem] hover:bg-[var(--text-primary)] hover:text-[var(--bg-dark)] transition-colors"
      >
        <PhXLogo :size="18" weight="fill" />
        <span>X</span>
      </a>

      <!-- Instagram -->
      <a
        v-if="league.instagram_handle"
        :href="`https://instagram.com/${league.instagram_handle}`"
        target="_blank"
        rel="noopener noreferrer"
        class="social-link flex items-center gap-2 px-3 py-1.5 rounded-md bg-[var(--bg-elevated)] text-[#E4405F] text-[0.85rem] hover:bg-[#E4405F] hover:text-white transition-colors"
      >
        <PhInstagramLogo :size="18" weight="fill" />
        <span>Instagram</span>
      </a>

      <!-- Facebook -->
      <a
        v-if="league.facebook_handle"
        :href="`https://facebook.com/${league.facebook_handle.replace(/^@/, '')}`"
        target="_blank"
        rel="noopener noreferrer"
        class="social-link flex items-center gap-2 px-3 py-1.5 rounded-md bg-[var(--bg-elevated)] text-[#1877F2] text-[0.85rem] hover:bg-[#1877F2] hover:text-white transition-colors"
      >
        <PhFacebookLogo :size="18" weight="fill" />
        <span>Facebook</span>
      </a>

      <!-- YouTube -->
      <a
        v-if="league.youtube_url"
        :href="league.youtube_url"
        target="_blank"
        rel="noopener noreferrer"
        class="social-link flex items-center gap-2 px-3 py-1.5 rounded-md bg-[var(--bg-elevated)] text-[#FF0000] text-[0.85rem] hover:bg-[#FF0000] hover:text-white transition-colors"
      >
        <PhYoutubeLogo :size="18" weight="fill" />
        <span>YouTube</span>
      </a>

      <!-- Twitch -->
      <a
        v-if="league.twitch_url"
        :href="league.twitch_url"
        target="_blank"
        rel="noopener noreferrer"
        class="social-link flex items-center gap-2 px-3 py-1.5 rounded-md bg-[var(--bg-elevated)] text-[#9146FF] text-[0.85rem] hover:bg-[#9146FF] hover:text-white transition-colors"
      >
        <PhTwitchLogo :size="18" weight="fill" />
        <span>Twitch</span>
      </a>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import {
  PhDiscordLogo,
  PhGlobe,
  PhXLogo,
  PhInstagramLogo,
  PhFacebookLogo,
  PhYoutubeLogo,
  PhTwitchLogo,
  PhInfo,
} from '@phosphor-icons/vue';
import { VrlButton } from '@public/components/common/buttons';
import type { PublicLeagueInfo, LeagueStats } from '@public/types/public';

interface Props {
  league: PublicLeagueInfo;
  stats: LeagueStats;
}

interface Emits {
  (e: 'open-about'): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

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

/**
 * Check if league has any social media links
 */
const hasSocialLinks = computed(() => {
  return !!(
    props.league.discord_url ||
    props.league.website_url ||
    props.league.twitter_handle ||
    props.league.instagram_handle ||
    props.league.facebook_handle ||
    props.league.youtube_url ||
    props.league.twitch_url
  );
});

/**
 * Show About button if league has tagline or description
 */
const showAboutButton = computed(() => {
  return !!(props.league.tagline || props.league.description);
});

/**
 * Handle About button click
 */
const handleAboutClick = (): void => {
  emit('open-about');
};
</script>
