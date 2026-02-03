<script setup lang="ts">
import BasePanel from '@app/components/common/panels/BasePanel.vue';
import FormLabel from '@app/components/common/forms/FormLabel.vue';
import { useDateFormatter } from '@app/composables/useDateFormatter';
import type { League } from '@app/types/league';

interface Props {
  league: League;
}

defineProps<Props>();

const { formatDate } = useDateFormatter();
</script>

<template>
  <BasePanel>
    <template #header>
      <div class="flex items-center gap-2 border-b border-gray-200 py-2 mx-4 w-full">
        <span class="font-medium text-surface-700">Social Media & Links</span>
      </div>
    </template>

    <!-- Metadata Section -->
    <div
      v-if="league.created_at || league.updated_at"
      class="pt-4 border-t border-gray-200 space-y-3"
    >
      <!-- Created Date -->
      <div v-if="league.created_at">
        <FormLabel text="Created" />
        <p class="text-gray-600 text-sm mt-1">
          {{ formatDate(league.created_at) }}
        </p>
      </div>

      <!-- Last Updated -->
      <div v-if="league.updated_at">
        <FormLabel text="Last Updated" />
        <p class="text-gray-600 text-sm mt-1">
          {{ formatDate(league.updated_at) }}
        </p>
      </div>
    </div>
  </BasePanel>

  <!-- Social Media & Links Section -->
  <BasePanel
    v-if="
      league.discord_url ||
      league.website_url ||
      league.twitter_handle ||
      league.instagram_handle ||
      league.facebook_handle ||
      league.youtube_url ||
      league.twitch_url
    "
  >
    <div class="grid grid-cols-2 gap-2 px-2">
      <!-- Discord -->
      <a
        v-if="league.discord_url"
        :href="league.discord_url"
        target="_blank"
        rel="noopener noreferrer"
        class="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors group"
      >
        <div
          class="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg bg-indigo-100 group-hover:bg-indigo-200 transition-colors"
        >
          <i class="pi pi-discord text-indigo-600"></i>
        </div>
        <div class="flex-1 min-w-0">
          <div class="font-medium text-gray-900">Discord</div>
          <div class="text-md text-gray-500 truncate">{{ league.discord_url }}</div>
        </div>
      </a>

      <!-- Website -->
      <a
        v-if="league.website_url"
        :href="league.website_url"
        target="_blank"
        rel="noopener noreferrer"
        class="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors group"
      >
        <div
          class="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg bg-blue-100 group-hover:bg-blue-200 transition-colors"
        >
          <i class="pi pi-globe text-blue-600"></i>
        </div>
        <div class="flex-1 min-w-0">
          <div class="font-medium text-gray-900">Website</div>
          <div class="text-md text-gray-500 truncate">{{ league.website_url }}</div>
        </div>
      </a>

      <!-- Twitter -->
      <a
        v-if="league.twitter_handle"
        :href="`https://twitter.com/${league.twitter_handle.replace('@', '')}`"
        target="_blank"
        rel="noopener noreferrer"
        class="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors group"
      >
        <div
          class="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg bg-gray-100 group-hover:bg-gray-200 transition-colors"
        >
          <i class="pi pi-twitter text-gray-900"></i>
        </div>
        <div class="flex-1 min-w-0">
          <div class="font-medium text-gray-900">Twitter</div>
          <div class="text-md text-gray-500 truncate">
            @{{ league.twitter_handle.replace('@', '') }}
          </div>
        </div>
      </a>

      <!-- Instagram -->
      <a
        v-if="league.instagram_handle"
        :href="`https://instagram.com/${league.instagram_handle.replace('@', '')}`"
        target="_blank"
        rel="noopener noreferrer"
        class="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors group"
      >
        <div
          class="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg bg-pink-100 group-hover:bg-pink-200 transition-colors"
        >
          <i class="pi pi-instagram text-pink-600"></i>
        </div>
        <div class="flex-1 min-w-0">
          <div class="font-medium text-gray-900">Instagram</div>
          <div class="text-md text-gray-500 truncate">
            @{{ league.instagram_handle.replace('@', '') }}
          </div>
        </div>
      </a>

      <!-- Facebook -->
      <a
        v-if="league.facebook_handle"
        :href="`https://facebook.com/${league.facebook_handle.replace('@', '')}`"
        target="_blank"
        rel="noopener noreferrer"
        class="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors group"
      >
        <div
          class="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg bg-blue-100 group-hover:bg-blue-200 transition-colors"
        >
          <i class="pi pi-facebook text-[#1877F2]"></i>
        </div>
        <div class="flex-1 min-w-0">
          <div class="font-medium text-gray-900">Facebook</div>
          <div class="text-md text-gray-500 truncate">
            @{{ league.facebook_handle.replace('@', '') }}
          </div>
        </div>
      </a>

      <!-- YouTube -->
      <a
        v-if="league.youtube_url"
        :href="league.youtube_url"
        target="_blank"
        rel="noopener noreferrer"
        class="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors group"
      >
        <div
          class="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg bg-red-100 group-hover:bg-red-200 transition-colors"
        >
          <i class="pi pi-youtube text-red-600"></i>
        </div>
        <div class="flex-1 min-w-0">
          <div class="font-medium text-gray-900">YouTube</div>
          <div class="text-md text-gray-500 truncate">{{ league.youtube_url }}</div>
        </div>
      </a>

      <!-- Twitch -->
      <a
        v-if="league.twitch_url"
        :href="league.twitch_url"
        target="_blank"
        rel="noopener noreferrer"
        class="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors group"
      >
        <div
          class="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg bg-purple-100 group-hover:bg-purple-200 transition-colors"
        >
          <i class="pi pi-twitch text-purple-600"></i>
        </div>
        <div class="flex-1 min-w-0">
          <div class="font-medium text-gray-900">Twitch</div>
          <div class="text-md text-gray-500 truncate">{{ league.twitch_url }}</div>
        </div>
      </a>
    </div>
  </BasePanel>
</template>
