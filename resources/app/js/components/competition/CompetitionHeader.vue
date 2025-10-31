<script setup lang="ts">
import type { Competition } from '@app/types/competition';

import Button from 'primevue/button';
import Chip from 'primevue/chip';

interface Props {
  competition: Competition;
}

defineProps<Props>();

interface Emits {
  (e: 'edit'): void;
  (e: 'back-to-league'): void;
}

const emit = defineEmits<Emits>();
</script>

<template>
  <div class="competition-header bg-white shadow-sm rounded-lg p-6 mb-6">
    <div class="flex items-start gap-6">
      <!-- Competition Logo -->
      <img
        :src="competition.logo_url"
        :alt="competition.name"
        class="w-24 h-24 rounded-lg object-cover"
      />

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
