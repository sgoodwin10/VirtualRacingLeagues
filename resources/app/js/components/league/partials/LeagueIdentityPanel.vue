<script setup lang="ts">
/**
 * LeagueIdentityPanel Component
 *
 * Sticky left sidebar panel displaying league identity information:
 * - Header image with logo
 * - League name and tagline
 * - Status tags
 * - Stats grid
 * - Terminal-style config
 * - Social links
 * - Action buttons
 */
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import {
  PhGlobe,
  PhLockKey,
  PhEyeSlash,
  PhCircle,
  PhArchive,
  PhTrophy,
  PhDiscordLogo,
  PhTwitterLogo,
  PhYoutubeLogo,
  PhTwitchLogo,
  PhInstagramLogo,
  PhPencilSimple,
  PhGear,
  PhUsersThree,
} from '@phosphor-icons/vue';
import { Button } from '@app/components/common/buttons';
import LeagueTerminalConfig from './LeagueTerminalConfig.vue';
import type { League } from '@app/types/league';

interface Props {
  league: League;
  seasonsCount?: number;
}

interface Emits {
  (e: 'edit'): void;
  (e: 'settings'): void;
}

const props = withDefaults(defineProps<Props>(), {
  seasonsCount: 0,
});

const emit = defineEmits<Emits>();
const router = useRouter();

const visibilityConfig = computed(() => {
  switch (props.league.visibility) {
    case 'public':
      return { icon: PhGlobe, label: 'Public', class: 'bg-[var(--green-dim)] text-[var(--green)]' };
    case 'private':
      return {
        icon: PhLockKey,
        label: 'Private',
        class: 'bg-[var(--orange-dim)] text-[var(--orange)]',
      };
    case 'unlisted':
      return {
        icon: PhEyeSlash,
        label: 'Unlisted',
        class: 'bg-[var(--purple-dim)] text-[var(--purple)]',
      };
    default:
      return { icon: PhGlobe, label: 'Public', class: 'bg-[var(--green-dim)] text-[var(--green)]' };
  }
});

const statusConfig = computed(() => {
  switch (props.league.status) {
    case 'active':
      return { icon: PhCircle, label: 'Active', class: 'bg-[var(--cyan-dim)] text-[var(--cyan)]' };
    case 'archived':
      return { icon: PhArchive, label: 'Archived', class: 'bg-[var(--red-dim)] text-[var(--red)]' };
    default:
      return { icon: PhCircle, label: 'Active', class: 'bg-[var(--cyan-dim)] text-[var(--cyan)]' };
  }
});

const headerImageUrl = computed(() => {
  // Try new responsive media system first
  if (props.league.header_image?.original) {
    return props.league.header_image.original;
  }
  // Fallback to legacy URL
  return props.league.header_image_url || null;
});

const logoUrl = computed(() => {
  // Try new responsive media system first
  if (props.league.logo?.original) {
    return props.league.logo.original;
  }
  // Fallback to legacy URL
  return props.league.logo_url || null;
});

const hasHeaderImage = computed(() => !!headerImageUrl.value);

const socialLinks = computed(() => {
  const links = [];
  if (props.league.discord_url) {
    links.push({ icon: PhDiscordLogo, url: props.league.discord_url, title: 'Discord' });
  }
  if (props.league.twitter_handle) {
    links.push({
      icon: PhTwitterLogo,
      url: `https://twitter.com/${props.league.twitter_handle}`,
      title: 'Twitter',
    });
  }
  if (props.league.youtube_url) {
    links.push({ icon: PhYoutubeLogo, url: props.league.youtube_url, title: 'YouTube' });
  }
  if (props.league.twitch_url) {
    links.push({ icon: PhTwitchLogo, url: props.league.twitch_url, title: 'Twitch' });
  }
  if (props.league.instagram_handle) {
    links.push({
      icon: PhInstagramLogo,
      url: `https://instagram.com/${props.league.instagram_handle}`,
      title: 'Instagram',
    });
  }
  return links;
});

function handleEdit(): void {
  emit('edit');
}

function handleSettings(): void {
  emit('settings');
}

function handleManageDrivers(): void {
  router.push({ name: 'league-drivers', params: { id: props.league.id } });
}

function handleViewCompetitions(): void {
  router.push({ name: 'league-detail', params: { id: props.league.id } });
}
</script>

<template>
  <aside
    class="w-[380px] flex-shrink-0 bg-[var(--bg-panel)] border-r border-[var(--border)] flex flex-col sticky top-0 h-full overflow-y-auto"
  >
    <!-- Header Image Area -->
    <div class="relative h-[180px] flex-shrink-0">
      <!-- Background Image or Fallback Gradient -->
      <div
        v-if="hasHeaderImage"
        class="absolute inset-0 bg-cover bg-center"
        :style="{ backgroundImage: `url(${headerImageUrl})` }"
      ></div>
      <div
        v-else
        class="absolute inset-0 bg-gradient-to-br from-[var(--purple-dim)] via-[var(--bg-card)] to-[var(--cyan-dim)]"
      ></div>

      <!-- Overlay -->
      <div
        class="absolute inset-0 bg-gradient-to-b from-[rgba(22,27,34,0.3)] to-[rgba(22,27,34,0.9)]"
      ></div>

      <!-- Grid Pattern -->
      <div class="absolute inset-0 opacity-50 league-header-grid"></div>

      <!-- League Logo -->
      <div class="absolute bottom-[-40px] left-6 z-10">
        <div
          v-if="logoUrl"
          class="w-20 h-20 rounded-[var(--radius)] border-[3px] border-[var(--bg-panel)] bg-[var(--bg-card)] shadow-lg overflow-hidden"
        >
          <img :src="logoUrl" :alt="`${league.name} logo`" class="w-full h-full object-cover" />
        </div>
        <div
          v-else
          class="w-20 h-20 rounded-[var(--radius)] border-[3px] border-[var(--bg-panel)] bg-gradient-to-br from-[var(--cyan)] to-[var(--green)] shadow-lg flex items-center justify-center"
        >
          <PhTrophy :size="32" class="text-[var(--bg-dark)]" />
        </div>
      </div>
    </div>

    <!-- League Info Content -->
    <div class="flex-1 px-6 pt-14 pb-6 flex flex-col">
      <!-- League Name & Tagline -->
      <h1 class="font-mono text-xl font-semibold text-[var(--text-primary)] mb-1.5 leading-tight">
        {{ league.name }}
      </h1>
      <p
        v-if="league.tagline"
        class="font-sans text-[13px] text-[var(--text-secondary)] italic mb-4"
      >
        "{{ league.tagline }}"
      </p>

      <!-- Status Tags -->
      <div class="flex flex-wrap gap-2 mb-6">
        <!-- Visibility Tag -->
        <span
          :class="[
            'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[var(--radius)] font-mono text-[10px] font-semibold tracking-[0.5px] uppercase',
            visibilityConfig.class,
          ]"
        >
          <component :is="visibilityConfig.icon" :size="12" />
          {{ visibilityConfig.label }}
        </span>

        <!-- Status Tag -->
        <span
          :class="[
            'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[var(--radius)] font-mono text-[10px] font-semibold tracking-[0.5px] uppercase',
            statusConfig.class,
          ]"
        >
          <component :is="statusConfig.icon" :size="12" />
          {{ statusConfig.label }}
        </span>
      </div>

      <div class="grid grid-cols-1 gap-px overflow-hidden mb-6 space-y-1">
        <Button
          label="View Competitions"
          :icon="PhTrophy"
          variant="outline"
          outline
          size="lg"
          class="w-full justify-center"
          @click="handleViewCompetitions"
        />
        <!-- Manage Drivers Button -->
        <Button
          label="Manage Drivers"
          :icon="PhUsersThree"
          variant="outline"
          size="lg"
          class="w-full justify-center"
          @click="handleManageDrivers"
        />
      </div>

      <!-- Stats Grid -->
      <div
        class="grid grid-cols-2 gap-px bg-[var(--border)] rounded-[var(--radius)] overflow-hidden mb-6"
      >
        <!-- Competitions -->
        <div class="bg-[var(--bg-card)] p-3.5 text-center">
          <div class="font-mono text-2xl font-semibold text-[var(--text-primary)] leading-none">
            {{ league.competitions_count || 0 }}
          </div>
          <div
            class="font-mono text-[9px] font-medium tracking-[0.5px] uppercase text-[var(--text-muted)] mt-1.5"
          >
            Competitions
          </div>
        </div>

        <!-- Drivers -->
        <div class="bg-[var(--bg-card)] p-3.5 text-center">
          <div class="font-mono text-2xl font-semibold text-[var(--text-primary)] leading-none">
            {{ league.drivers_count || 0 }}
          </div>
          <div
            class="font-mono text-[9px] font-medium tracking-[0.5px] uppercase text-[var(--text-muted)] mt-1.5"
          >
            Drivers
          </div>
        </div>

        <!-- Seasons -->
        <div class="bg-[var(--bg-card)] p-3.5 text-center">
          <div class="font-mono text-2xl font-semibold text-[var(--text-primary)] leading-none">
            {{ seasonsCount }}
          </div>
          <div
            class="font-mono text-[9px] font-medium tracking-[0.5px] uppercase text-[var(--text-muted)] mt-1.5"
          >
            Seasons
          </div>
        </div>

        <!-- Platforms -->
        <div class="bg-[var(--bg-card)] p-3.5 text-center">
          <div class="font-mono text-2xl font-semibold text-[var(--text-primary)] leading-none">
            {{ league.platforms?.length || 0 }}
          </div>
          <div
            class="font-mono text-[9px] font-medium tracking-[0.5px] uppercase text-[var(--text-muted)] mt-1.5"
          >
            Platforms
          </div>
        </div>
      </div>

      <!-- Terminal Config Panel -->
      <LeagueTerminalConfig :league="league" class="mb-6" />

      <!-- Social Links -->
      <div v-if="socialLinks.length > 0" class="flex flex-wrap gap-1.5">
        <a
          v-for="(link, index) in socialLinks"
          :key="index"
          :href="link.url"
          :title="link.title"
          target="_blank"
          rel="noopener noreferrer"
          class="w-8 h-8 rounded-[var(--radius)] bg-[var(--bg-card)] border border-[var(--border)] flex items-center justify-center text-[var(--text-muted)] transition-all duration-200 hover:bg-[var(--cyan-dim)] hover:border-[var(--cyan)] hover:text-[var(--cyan)]"
        >
          <component :is="link.icon" :size="14" />
        </a>
      </div>
    </div>

    <!-- Identity Footer -->
    <div class="px-6 py-4 border-t border-[var(--border)] flex flex-col gap-2">
      <Button
        label="Edit League"
        :icon="PhPencilSimple"
        variant="warning"
        outline
        size="sm"
        class="w-full justify-center"
        @click="handleEdit"
      />
      <Button
        label="Settings"
        :icon="PhGear"
        variant="secondary"
        size="sm"
        class="w-full justify-center"
        @click="handleSettings"
      />
    </div>
  </aside>
</template>

<style scoped>
.league-header-grid {
  background-image:
    linear-gradient(var(--color-grid) 1px, transparent 1px),
    linear-gradient(90deg, var(--color-grid) 1px, transparent 1px);
  background-size: 20px 20px;
}

/* Scrollbar styling for webkit browsers */
::-webkit-scrollbar {
  width: 8px;
}

::-webkit-scrollbar-track {
  background: var(--bg-panel);
}

::-webkit-scrollbar-thumb {
  background: var(--bg-highlight);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: var(--text-muted);
}
</style>
