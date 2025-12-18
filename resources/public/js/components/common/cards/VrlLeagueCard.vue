<script setup lang="ts">
import { computed } from 'vue';
import { RouterLink, type RouteLocationRaw } from 'vue-router';
import { PhFlagCheckered } from '@phosphor-icons/vue';
import { sanitizeImageUrl } from '@public/utils/urlSanitizer';
import ResponsiveImage from '@public/components/common/ResponsiveImage.vue';
import type { MediaObject } from '@public/types/media';

interface Props {
  name: string;
  tagline?: string;
  logoUrl?: string; // OLD - deprecated
  logo?: MediaObject | null; // NEW - responsive media
  headerImageUrl?: string; // OLD - deprecated
  headerImage?: MediaObject | null; // NEW - responsive media
  competitions?: number;
  drivers?: number;
  to?: string | RouteLocationRaw;
  class?: string;
}

const props = withDefaults(defineProps<Props>(), {
  tagline: undefined,
  logoUrl: undefined,
  logo: undefined,
  headerImageUrl: undefined,
  headerImage: undefined,
  competitions: 0,
  drivers: 0,
  to: undefined,
  class: undefined,
});

const cardClasses = computed(() => {
  const baseClasses = 'card-racing rounded overflow-hidden';
  const interactiveClasses = props.to ? 'cursor-pointer' : '';

  return [baseClasses, interactiveClasses, props.class].filter(Boolean).join(' ');
});

const sanitizedHeaderImageUrl = computed(() => {
  return sanitizeImageUrl(props.headerImageUrl);
});

const sanitizedLogoUrl = computed(() => {
  return sanitizeImageUrl(props.logoUrl);
});

const headerStyle = computed(() => {
  // Use new headerImage media object if available, otherwise fall back to old headerImageUrl
  const backgroundUrl = props.headerImage?.conversions.medium || sanitizedHeaderImageUrl.value;

  if (backgroundUrl) {
    return {
      background: `url(${backgroundUrl}) center/cover, var(--bg-tertiary)`,
    };
  }
  return {
    background: 'var(--bg-tertiary)',
  };
});
</script>

<template>
  <component :is="to ? RouterLink : 'div'" :to="to" :class="cardClasses">
    <!-- Header with checkered pattern -->
    <div class="relative h-28 sm:h-32" :style="headerStyle">
      <div class="absolute inset-0 pattern-checkered opacity-10" />
      <div
        class="absolute bottom-0 left-0 right-0 h-16"
        style="background: linear-gradient(to top, var(--bg-secondary), transparent)"
      />

      <!-- Logo positioned at bottom-left -->
      <div
        class="absolute -bottom-5 sm:-bottom-6 left-4 w-12 h-12 sm:w-14 sm:h-14 rounded flex items-center justify-center"
        style="background: var(--bg-secondary); border: 2px solid var(--border-primary)"
      >
        <ResponsiveImage
          v-if="logo || sanitizedLogoUrl"
          :media="logo"
          :fallback-url="sanitizedLogoUrl || undefined"
          :alt="`${name} logo`"
          sizes="(max-width: 640px) 48px, 56px"
          loading="lazy"
          image-class="w-full h-full object-cover rounded"
        />
        <PhFlagCheckered v-else :size="20" weight="fill" class="text-racing-gold sm:text-xl" />
      </div>
    </div>

    <!-- Content -->
    <div class="pt-8 sm:pt-10 pb-3 sm:pb-4 px-3 sm:px-4">
      <h3
        class="font-display text-sm sm:text-base uppercase tracking-wide mb-1"
        style="color: var(--text-primary)"
      >
        {{ name }}
      </h3>
      <p v-if="tagline" class="text-xs sm:text-sm mb-2 sm:mb-3" style="color: var(--text-muted)">
        {{ tagline }}
      </p>
      <div
        class="flex gap-3 sm:gap-4 font-data text-[10px] sm:text-xs"
        style="color: var(--text-dim)"
      >
        <span>
          <strong style="color: var(--text-primary)">{{ competitions }}</strong>
          Competitions
        </span>
        <span>
          <strong style="color: var(--text-primary)">{{ drivers }}</strong>
          Drivers
        </span>
      </div>
    </div>
  </component>
</template>

<style scoped>
.card-racing {
  background: var(--bg-secondary);
  border: 1px solid var(--border-primary);
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.card-racing.cursor-pointer:hover {
  border-color: var(--card-hover-border);
  /* transform: translateY(-4px); */
  box-shadow: var(--shadow-card);
}
</style>
