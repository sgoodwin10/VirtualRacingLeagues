<script setup lang="ts">
import { computed } from 'vue';
import type { Competition } from '@app/types/competition';

import Button from 'primevue/button';
import Chip from 'primevue/chip';
import { PhImage } from '@phosphor-icons/vue';
import ResponsiveImage from '@app/components/common/ResponsiveImage.vue';

interface Props {
  competition: Competition;
}

const props = defineProps<Props>();

interface Emits {
  (e: 'edit'): void;
  (e: 'back-to-league'): void;
}

const emit = defineEmits<Emits>();

const hasLogo = computed(() => {
  const url = props.competition.logo_url;
  // Handle null, empty string, and legacy "default.png" placeholder
  return !!url && url !== 'default.png';
});

// Convert competition_colour JSON string to CSS rgb() color
const competitionBackgroundColor = computed(() => {
  if (!props.competition.competition_colour) {
    return 'rgb(226, 232, 240)'; // Fallback to slate-200
  }

  try {
    const rgb = JSON.parse(props.competition.competition_colour);
    return `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
  } catch {
    return 'rgb(226, 232, 240)'; // Fallback on parse error
  }
});
</script>

<template>
  <div class="competition-header bg-white shadow-sm rounded-lg p-6 mb-6">
    <div class="flex items-start gap-6">
      <!-- Competition Logo -->
      <div
        class="flex items-center justify-center w-24 h-24 rounded-lg"
        :style="{ backgroundColor: competitionBackgroundColor }"
      >
        <ResponsiveImage
          v-if="hasLogo"
          :media="competition.logo"
          :fallback-url="competition.logo_url ?? undefined"
          :alt="competition.name"
          conversion="small"
          sizes="96px"
          img-class="w-full h-full rounded-lg object-cover"
        />
        <PhImage v-else :size="48" weight="light" class="text-white/50" />
      </div>

      <!-- Competition Info -->
      <div class="flex-1">
        <div class="flex justify-between items-start mb-2">
          <h1 class="text-3xl font-bold">{{ competition.name }}</h1>
          <Button
            icon="pi pi-cog"
            label="Edit"
            outlined
            :disabled="competition.is_archived"
            @click="emit('edit')"
          />
        </div>

        <!-- Platform Badge -->
        <Chip
          v-if="competition.platform"
          :label="competition.platform.name"
          icon="pi pi-gamepad"
          class="mb-2"
        />

        <!-- Description -->
        <p v-if="competition.description" class="text-gray-600 mb-4">
          {{ competition.description }}
        </p>

        <!-- Stats -->
        <div class="flex gap-6">
          <div>
            <span class="text-sm text-gray-500">Seasons</span>
            <p class="text-xl font-bold">{{ competition.stats.total_seasons }}</p>
          </div>
          <div>
            <span class="text-sm text-gray-500">Rounds</span>
            <p class="text-xl font-bold">{{ competition.stats.total_rounds }}</p>
          </div>
          <div>
            <span class="text-sm text-gray-500">Drivers</span>
            <p class="text-xl font-bold">{{ competition.stats.total_drivers }}</p>
          </div>
          <div>
            <span class="text-sm text-gray-500">Races</span>
            <p class="text-xl font-bold">{{ competition.stats.total_races }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
