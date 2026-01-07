<script setup lang="ts">
import { computed } from 'vue';
import { useSeasonStore } from '@app/stores/seasonStore';

const seasonStore = useSeasonStore();

const season = computed(() => seasonStore.currentSeason);
</script>

<template>
  <div class="season-status-view">
    <div v-if="season" class="space-y-6">
      <div class="bg-white rounded-lg shadow p-6">
        <h2 class="text-2xl font-semibold mb-4">Season Status</h2>
        <p class="text-gray-600">
          This view will display the current status and progress of the season.
        </p>
      </div>

      <!-- Placeholder content - to be implemented -->
      <div class="bg-white rounded-lg shadow p-6">
        <h3 class="text-lg font-medium mb-4">Season Information</h3>
        <div class="space-y-2">
          <div>
            <span class="font-medium">Season Name:</span>
            {{ season.name }}
          </div>
          <div>
            <span class="font-medium">Status:</span>
            {{ season.status }}
          </div>
          <div v-if="season.startDate">
            <span class="font-medium">Start Date:</span>
            {{ new Date(season.startDate).toLocaleDateString() }}
          </div>
          <div v-if="season.endDate">
            <span class="font-medium">End Date:</span>
            {{ new Date(season.endDate).toLocaleDateString() }}
          </div>
        </div>
      </div>
    </div>

    <div v-else class="bg-white rounded-lg shadow p-6">
      <p class="text-gray-500">Loading season data...</p>
    </div>
  </div>
</template>
