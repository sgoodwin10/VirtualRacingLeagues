<template>
  <VrlModal
    :visible="visible"
    title="About League"
    width="2xl"
    @update:visible="handleUpdateVisible"
  >
    <VrlModalBody padding="lg">
      <!-- League Name -->
      <h2
        class="font-[var(--font-display)] text-[1.5rem] font-bold tracking-wide mb-4 text-[var(--text-primary)]"
      >
        {{ league.name }}
      </h2>

      <!-- Tagline -->
      <div v-if="league.tagline" class="mb-6">
        <p class="text-[var(--cyan)] text-[1.05rem] italic">{{ league.tagline }}</p>
      </div>

      <!-- Description -->
      <div v-if="league.description" class="mb-8">
        <h3
          class="font-[var(--font-display)] text-[0.95rem] font-semibold tracking-wide mb-3 text-[var(--text-secondary)] uppercase"
        >
          Description
        </h3>
        <div class="text-[var(--text-primary)] text-[0.95rem] leading-relaxed whitespace-pre-wrap">
          {{ league.description }}
        </div>
      </div>

      <!-- Social Media Links -->
      <div v-if="hasSocialLinks" class="border-t border-[var(--border)] pt-6">
        <h3
          class="font-[var(--font-display)] text-[0.95rem] font-semibold tracking-wide mb-4 text-[var(--text-secondary)] uppercase"
        >
          Connect With Us
        </h3>

        <div class="space-y-3">
          <!-- Discord -->
          <a
            v-if="league.discord_url"
            :href="league.discord_url"
            target="_blank"
            rel="noopener noreferrer"
            class="flex items-center gap-3 px-4 py-3 rounded-lg bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:bg-[var(--bg-highlight)] hover:text-[var(--cyan)] transition-colors group"
          >
            <PhDiscordLogo :size="24" weight="fill" class="group-hover:text-[var(--cyan)]" />
            <div class="flex-1">
              <div class="font-medium text-[var(--text-primary)]">Discord</div>
              <div class="text-[0.85rem] text-[var(--text-muted)] truncate">
                {{ league.discord_url }}
              </div>
            </div>
            <PhArrowSquareOut :size="18" class="opacity-0 group-hover:opacity-100" />
          </a>

          <!-- Website -->
          <a
            v-if="league.website_url"
            :href="league.website_url"
            target="_blank"
            rel="noopener noreferrer"
            class="flex items-center gap-3 px-4 py-3 rounded-lg bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:bg-[var(--bg-highlight)] hover:text-[var(--cyan)] transition-colors group"
          >
            <PhGlobe :size="24" weight="bold" class="group-hover:text-[var(--cyan)]" />
            <div class="flex-1">
              <div class="font-medium text-[var(--text-primary)]">Website</div>
              <div class="text-[0.85rem] text-[var(--text-muted)] truncate">
                {{ league.website_url }}
              </div>
            </div>
            <PhArrowSquareOut :size="18" class="opacity-0 group-hover:opacity-100" />
          </a>

          <!-- Twitter/X -->
          <a
            v-if="league.twitter_handle"
            :href="`https://twitter.com/${league.twitter_handle}`"
            target="_blank"
            rel="noopener noreferrer"
            class="flex items-center gap-3 px-4 py-3 rounded-lg bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:bg-[var(--bg-highlight)] hover:text-[var(--cyan)] transition-colors group"
          >
            <PhXLogo :size="24" weight="fill" class="group-hover:text-[var(--cyan)]" />
            <div class="flex-1">
              <div class="font-medium text-[var(--text-primary)]">Twitter / X</div>
              <div class="text-[0.85rem] text-[var(--text-muted)]">
                @{{ league.twitter_handle }}
              </div>
            </div>
            <PhArrowSquareOut :size="18" class="opacity-0 group-hover:opacity-100" />
          </a>

          <!-- Instagram -->
          <a
            v-if="league.instagram_handle"
            :href="`https://instagram.com/${league.instagram_handle}`"
            target="_blank"
            rel="noopener noreferrer"
            class="flex items-center gap-3 px-4 py-3 rounded-lg bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:bg-[var(--bg-highlight)] hover:text-[var(--cyan)] transition-colors group"
          >
            <PhInstagramLogo :size="24" weight="fill" class="group-hover:text-[var(--cyan)]" />
            <div class="flex-1">
              <div class="font-medium text-[var(--text-primary)]">Instagram</div>
              <div class="text-[0.85rem] text-[var(--text-muted)]">
                @{{ league.instagram_handle }}
              </div>
            </div>
            <PhArrowSquareOut :size="18" class="opacity-0 group-hover:opacity-100" />
          </a>

          <!-- YouTube -->
          <a
            v-if="league.youtube_url"
            :href="league.youtube_url"
            target="_blank"
            rel="noopener noreferrer"
            class="flex items-center gap-3 px-4 py-3 rounded-lg bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:bg-[var(--bg-highlight)] hover:text-[var(--cyan)] transition-colors group"
          >
            <PhYoutubeLogo :size="24" weight="fill" class="group-hover:text-[var(--cyan)]" />
            <div class="flex-1">
              <div class="font-medium text-[var(--text-primary)]">YouTube</div>
              <div class="text-[0.85rem] text-[var(--text-muted)] truncate">
                {{ league.youtube_url }}
              </div>
            </div>
            <PhArrowSquareOut :size="18" class="opacity-0 group-hover:opacity-100" />
          </a>

          <!-- Twitch -->
          <a
            v-if="league.twitch_url"
            :href="league.twitch_url"
            target="_blank"
            rel="noopener noreferrer"
            class="flex items-center gap-3 px-4 py-3 rounded-lg bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:bg-[var(--bg-highlight)] hover:text-[var(--cyan)] transition-colors group"
          >
            <PhTwitchLogo :size="24" weight="fill" class="group-hover:text-[var(--cyan)]" />
            <div class="flex-1">
              <div class="font-medium text-[var(--text-primary)]">Twitch</div>
              <div class="text-[0.85rem] text-[var(--text-muted)] truncate">
                {{ league.twitch_url }}
              </div>
            </div>
            <PhArrowSquareOut :size="18" class="opacity-0 group-hover:opacity-100" />
          </a>
        </div>
      </div>
    </VrlModalBody>
  </VrlModal>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import {
  PhDiscordLogo,
  PhGlobe,
  PhXLogo,
  PhInstagramLogo,
  PhYoutubeLogo,
  PhTwitchLogo,
  PhArrowSquareOut,
} from '@phosphor-icons/vue';
import type { PublicLeagueInfo } from '@public/types/public';
import VrlModal from '@public/components/common/modals/VrlModal.vue';
import VrlModalBody from '@public/components/common/modals/VrlModalBody.vue';

interface Props {
  visible: boolean;
  league: PublicLeagueInfo;
}

interface Emits {
  (e: 'update:visible', value: boolean): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

/**
 * Check if league has any social media links
 */
const hasSocialLinks = computed(() => {
  return !!(
    props.league.discord_url ||
    props.league.website_url ||
    props.league.twitter_handle ||
    props.league.instagram_handle ||
    props.league.youtube_url ||
    props.league.twitch_url
  );
});

/**
 * Handle visibility updates
 */
const handleUpdateVisible = (value: boolean): void => {
  emit('update:visible', value);
};
</script>
