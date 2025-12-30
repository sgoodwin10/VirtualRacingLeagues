<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import TeamsPanel from '@app/components/season/teams/TeamsPanel.vue';
import DivisionsPanel from '@app/components/season/divisions/DivisionsPanel.vue';
import { useSeasonStore } from '@app/stores/seasonStore';

const route = useRoute();
const seasonStore = useSeasonStore();

const seasonId = computed(() => parseInt(route.params.seasonId as string, 10));
const season = computed(() => seasonStore.currentSeason);
</script>

<template>
  <div>
    <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <!-- Divisions Card (Left) -->
      <DivisionsPanel
        v-if="season"
        :season-id="seasonId"
        :race-divisions-enabled="season.race_divisions_enabled"
        icon-color="yellow-600"
      />

      <!-- Teams Card (Right) -->
      <TeamsPanel
        v-if="season"
        :season-id="seasonId"
        :team-championship-enabled="season.team_championship_enabled"
      />
    </div>
  </div>
</template>
