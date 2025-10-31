<script setup lang="ts">
import { computed } from 'vue';
import type { Season } from '@app/types/season';

import Button from 'primevue/button';
import Chip from 'primevue/chip';

interface Props {
  season: Season;
}

const props = defineProps<Props>();

interface Emits {
  (e: 'edit'): void;
  (e: 'back-to-league'): void;
}

const emit = defineEmits<Emits>();

const statusSeverity = computed(() => {
  switch (props.season.status) {
    case 'active':
      return 'success';
    case 'completed':
      return 'info';
    case 'archived':
      return 'warn';
    case 'setup':
    default:
      return 'secondary';
  }
});

const statusLabel = computed(() => {
  return props.season.status.charAt(0).toUpperCase() + props.season.status.slice(1);
});
</script>

<template>
  <div class="season-header bg-white shadow-sm rounded-lg overflow-hidden mb-6">
    <!-- Banner (if exists) -->
    <div v-if="season.banner_url" class="w-full h-48 overflow-hidden">
      <img :src="season.banner_url" :alt="season.name" class="w-full h-full object-cover" />
    </div>

    <!-- Content -->
    <div class="p-6">
      <div class="flex items-start gap-6">
        <!-- Season Logo -->
        <img
          :src="season.logo_url"
          :alt="season.name"
          class="w-24 h-24 rounded-lg object-cover flex-shrink-0"
        />

        <!-- Season Info -->
        <div class="flex-1">
          <div class="flex justify-between items-start mb-2">
            <div>
              <h1 class="text-3xl font-bold">{{ season.name }}</h1>
              <p v-if="season.competition" class="text-gray-600 mt-1">
                {{ season.competition.name }}
              </p>
            </div>
            <Button
              icon="pi pi-cog"
              label="Edit"
              outlined
              :disabled="season.is_archived"
              @click="emit('edit')"
            />
          </div>

          <!-- Status and Car Class -->
          <div class="flex gap-2 mb-4">
            <Chip :label="statusLabel" :severity="statusSeverity" />
            <Chip v-if="season.car_class" :label="season.car_class" icon="pi pi-car" />
            <Chip
              v-if="season.team_championship_enabled"
              label="Team Championship"
              icon="pi pi-users"
            />
            <Chip v-if="season.race_divisions_enabled" label="Race Divisions" icon="pi pi-trophy" />
          </div>

          <!-- Description -->
          <p v-if="season.description" class="text-gray-600 mb-4">
            {{ season.description }}
          </p>

          <!-- Stats -->
          <div class="flex gap-6">
            <div>
              <span class="text-sm text-gray-500">Drivers</span>
              <p class="text-xl font-bold">{{ season.stats.total_drivers }}</p>
            </div>
            <div>
              <span class="text-sm text-gray-500">Rounds</span>
              <p class="text-xl font-bold">
                {{ season.stats.total_rounds ?? season.stats.total_races ?? 0 }}
              </p>
            </div>
            <div>
              <span class="text-sm text-gray-500">Completed</span>
              <p class="text-xl font-bold">
                {{ season.stats.completed_rounds ?? season.stats.completed_races ?? 0 }}
              </p>
            </div>
            <div v-if="season.race_divisions_enabled">
              <span class="text-sm text-gray-500">Divisions</span>
              <p class="text-xl font-bold">{{ season.stats.total_divisions ?? 0 }}</p>
            </div>
            <div v-if="season.team_championship_enabled">
              <span class="text-sm text-gray-500">Teams</span>
              <p class="text-xl font-bold">{{ season.stats.total_teams ?? 0 }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
