<script setup lang="ts">
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useSeasonStore } from '@app/stores/seasonStore';
import { useToastError, TOAST_DURATION } from '@app/composables/useToastError';
import SeasonSettings from '@app/components/season/SeasonSettings.vue';

const route = useRoute();
const router = useRouter();
const seasonStore = useSeasonStore();
const { showSuccess } = useToastError();

const TRANSITION_DELAY = 1500;

const seasonId = computed(() => parseInt(route.params.seasonId as string, 10));
const leagueId = computed(() => parseInt(route.params.leagueId as string, 10));
const season = computed(() => seasonStore.currentSeason);

async function handleUpdated(): Promise<void> {
  // Reload the season after update
  await seasonStore.fetchSeason(seasonId.value);
}

function handleArchived(): void {
  // Reload the season after archiving
  seasonStore.fetchSeason(seasonId.value);
}

function handleDeleted(): void {
  showSuccess('Redirecting to league...', {
    summary: 'Season Deleted',
    life: TOAST_DURATION.SHORT,
  });

  setTimeout(() => {
    router.push({
      name: 'league-detail',
      params: {
        id: leagueId.value,
      },
    });
  }, TRANSITION_DELAY);
}
</script>

<template>
  <div>
    <SeasonSettings
      v-if="season"
      :season="season"
      @updated="handleUpdated"
      @archived="handleArchived"
      @deleted="handleDeleted"
    />
  </div>
</template>
