<script setup lang="ts">
/**
 * LeagueTerminalConfig Component
 *
 * Terminal/console-style configuration panel displaying league metadata
 * in a monospace key-value format with colored dots header.
 */
import type { League } from '@app/types/league';

interface Props {
  league: League;
}

defineProps<Props>();

/**
 * Validate if a URL is safe to use (only allows http:// or https://)
 * Prevents XSS attacks via javascript: protocol
 */
function isSafeUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  const trimmedUrl = url.trim();
  return trimmedUrl.startsWith('http://') || trimmedUrl.startsWith('https://');
}
</script>

<template>
  <div
    class="bg-[var(--bg-dark)] border border-[var(--border)] rounded-[var(--radius)] overflow-hidden flex-1"
  >
    <!-- Terminal Header -->
    <div
      class="flex items-center gap-2 px-3 py-2.5 bg-[var(--bg-elevated)] border-b border-[var(--border)]"
    >
      <div class="flex gap-1">
        <span class="w-2 h-2 rounded-full bg-[var(--red)]"></span>
        <span class="w-2 h-2 rounded-full bg-[var(--yellow)]"></span>
        <span class="w-2 h-2 rounded-full bg-[var(--green)]"></span>
      </div>
      <span class="font-mono text-[10px] text-[var(--text-muted)] tracking-[0.5px]">
        league.config
      </span>
    </div>

    <!-- Terminal Body -->
    <div class="p-3 font-mono text-xs">
      <!-- Timezone -->
      <div class="flex mb-2">
        <span class="text-[var(--cyan)] min-w-[100px]">timezone:</span>
        <span class="text-[var(--text-secondary)]">{{ league.timezone }}</span>
      </div>

      <!-- Platforms -->
      <div v-if="league.platforms && league.platforms.length > 0" class="flex mb-2">
        <span class="text-[var(--cyan)] min-w-[100px]">platforms:</span>
        <span class="text-[var(--text-secondary)]">
          {{ league.platforms.map((p) => p.name).join(', ') }}
        </span>
      </div>

      <!-- Organizer -->
      <div v-if="league.organizer_name" class="flex mb-2">
        <span class="text-[var(--cyan)] min-w-[100px]">organizer:</span>
        <span class="text-[var(--text-secondary)]">{{ league.organizer_name }}</span>
      </div>

      <!-- Contact -->
      <div v-if="league.contact_email" class="flex mb-2">
        <span class="text-[var(--cyan)] min-w-[100px]">contact:</span>
        <a
          :href="`mailto:${league.contact_email}`"
          class="text-[var(--green)] no-underline hover:underline break-all"
        >
          {{ league.contact_email }}
        </a>
      </div>

      <!-- Website -->
      <div v-if="league.website_url" class="flex mb-2">
        <span class="text-[var(--cyan)] min-w-[100px]">website:</span>
        <a
          v-if="isSafeUrl(league.website_url)"
          :href="league.website_url"
          target="_blank"
          rel="noopener noreferrer"
          class="text-[var(--green)] no-underline hover:underline break-all"
        >
          {{ league.website_url }}
        </a>
        <span v-else class="text-[var(--text-secondary)] break-all">
          {{ league.website_url }}
        </span>
      </div>

      <!-- Slug -->
      <div class="flex mb-2">
        <span class="text-[var(--cyan)] min-w-[100px]">slug:</span>
        <span class="text-[var(--text-secondary)]">{{ league.slug }}</span>
      </div>

      <!-- Description (if short enough) -->
      <div v-if="league.description && league.description.length < 100" class="flex mb-2">
        <span class="text-[var(--cyan)] min-w-[100px]">description:</span>
        <span class="text-[var(--text-secondary)] break-words">{{ league.description }}</span>
      </div>

      <!-- Discord -->
      <div v-if="league.discord_url" class="flex mb-2">
        <span class="text-[var(--cyan)] min-w-[100px]">discord:</span>
        <a
          v-if="isSafeUrl(league.discord_url)"
          :href="league.discord_url"
          target="_blank"
          rel="noopener noreferrer"
          class="text-[var(--green)] no-underline hover:underline break-all"
        >
          {{ league.discord_url }}
        </a>
        <span v-else class="text-[var(--text-secondary)] break-all">
          {{ league.discord_url }}
        </span>
      </div>

      <!-- Twitter -->
      <div v-if="league.twitter_handle" class="flex mb-2">
        <span class="text-[var(--cyan)] min-w-[100px]">twitter:</span>
        <a
          :href="`https://twitter.com/${league.twitter_handle}`"
          target="_blank"
          rel="noopener noreferrer"
          class="text-[var(--green)] no-underline hover:underline"
        >
          @{{ league.twitter_handle }}
        </a>
      </div>

      <!-- Instagram -->
      <div v-if="league.instagram_handle" class="flex mb-2">
        <span class="text-[var(--cyan)] min-w-[100px]">instagram:</span>
        <a
          :href="`https://instagram.com/${league.instagram_handle}`"
          target="_blank"
          rel="noopener noreferrer"
          class="text-[var(--green)] no-underline hover:underline"
        >
          @{{ league.instagram_handle }}
        </a>
      </div>

      <!-- Facebook -->
      <div v-if="league.facebook_handle" class="flex mb-2">
        <span class="text-[var(--cyan)] min-w-[100px]">facebook:</span>
        <a
          :href="`https://facebook.com/${league.facebook_handle}`"
          target="_blank"
          rel="noopener noreferrer"
          class="text-[var(--green)] no-underline hover:underline"
        >
          @{{ league.facebook_handle }}
        </a>
      </div>

      <!-- YouTube -->
      <div v-if="league.youtube_url" class="flex mb-2">
        <span class="text-[var(--cyan)] min-w-[100px]">youtube:</span>
        <a
          v-if="isSafeUrl(league.youtube_url)"
          :href="league.youtube_url"
          target="_blank"
          rel="noopener noreferrer"
          class="text-[var(--green)] no-underline hover:underline break-all"
        >
          {{ league.youtube_url }}
        </a>
        <span v-else class="text-[var(--text-secondary)] break-all">
          {{ league.youtube_url }}
        </span>
      </div>

      <!-- Twitch -->
      <div v-if="league.twitch_url" class="flex mb-2 last:mb-0">
        <span class="text-[var(--cyan)] min-w-[100px]">twitch:</span>
        <a
          v-if="isSafeUrl(league.twitch_url)"
          :href="league.twitch_url"
          target="_blank"
          rel="noopener noreferrer"
          class="text-[var(--green)] no-underline hover:underline break-all"
        >
          {{ league.twitch_url }}
        </a>
        <span v-else class="text-[var(--text-secondary)] break-all">
          {{ league.twitch_url }}
        </span>
      </div>
    </div>
  </div>
</template>
