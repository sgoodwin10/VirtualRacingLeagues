<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import { useSeasonStore } from '@app/stores/seasonStore';
import { useToastError } from '@app/composables/useToastError';
import { useToast } from 'primevue/usetoast';
import { PhCalendar, PhDownload } from '@phosphor-icons/vue';
import RoundsPanel from '@app/components/round/RoundsPanel.vue';
import { Card, CardHeader } from '@app/components/common/cards';
import { Button } from '@app/components/common/buttons';
import Skeleton from 'primevue/skeleton';
import { recalculateSeasonResults } from '@app/services/seasonService';

const route = useRoute();
const seasonStore = useSeasonStore();
const { showError } = useToastError();
const toast = useToast();

const seasonId = computed(() => parseInt(route.params.seasonId as string, 10));
const season = computed(() => seasonStore.currentSeason);
const isLoading = computed(() => seasonStore.loading);
const isRecalculating = ref(false);

async function handleRecalculateResults() {
  isRecalculating.value = true;
  try {
    const result = await recalculateSeasonResults(seasonId.value);
    toast.add({
      severity: 'success',
      summary: 'Results Recalculated',
      detail: `Successfully recalculated ${result.recalculated_count} round(s)`,
      life: 5000,
    });
  } catch (err: unknown) {
    showError(err, { summary: 'Recalculation Failed' });
  } finally {
    isRecalculating.value = false;
  }
}

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
          class="w-full"
        >
          <template #actions>
            <Button
              label="Recalculate Results"
              title="Recalculate Results"
              variant="secondary"
              outline
              :icon="PhDownload"
              :loading="isRecalculating"
              @click="handleRecalculateResults"
            />
          </template>
        </CardHeader>
      </template>
      <RoundsPanel
        v-if="season && season.competition?.platform_id"
        :season-id="seasonId"
        :platform-id="season.competition.platform_id"
        :competition-colour="season.competition.competition_colour"
        :is-season-completed="season.is_completed"
      />
    </Card>
  </div>
</template>
