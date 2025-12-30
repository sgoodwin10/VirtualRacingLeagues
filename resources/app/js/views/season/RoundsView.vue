<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useSeasonStore } from '@app/stores/seasonStore';
import { useToastError } from '@app/composables/useToastError';
import { PhCalendar } from '@phosphor-icons/vue';
import RoundsPanel from '@app/components/round/RoundsPanel.vue';
import { Card, CardHeader } from '@app/components/common/cards';
import Skeleton from 'primevue/skeleton';

const route = useRoute();
const seasonStore = useSeasonStore();
const { showError } = useToastError();

const seasonId = computed(() => parseInt(route.params.seasonId as string, 10));
const season = computed(() => seasonStore.currentSeason);
const isLoading = computed(() => seasonStore.loading);

onMounted(async () => {
  // Season data should already be loaded by parent SeasonDetail component
  // But we load it here just in case this view is accessed directly
  if (!season.value) {
    try {
      await seasonStore.fetchSeason(seasonId.value);
    } catch (err: unknown) {
      showError(err, { summary: 'Load Failed' });
    }
  }
});
</script>

<template>
  <div>
    <Skeleton v-if="isLoading" height="30rem" />
    <Card v-else>
      <template #header>
        <CardHeader
          title="Race Rounds"
          description="View and manage all race rounds in this season"
          :icon="PhCalendar"
          icon-color="green-600"
        />
      </template>
      <RoundsPanel
        v-if="season && season.competition?.platform_id"
        :season-id="seasonId"
        :platform-id="season.competition.platform_id"
        :competition-colour="season.competition.competition_colour"
      />
    </Card>
  </div>
</template>
