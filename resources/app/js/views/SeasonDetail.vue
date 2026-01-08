<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useToastError } from '@app/composables/useToastError';
import { usePageTitle } from '@app/composables/usePageTitle';
import { useSeasonStore } from '@app/stores/seasonStore';
import { useSeasonDriverStore } from '@app/stores/seasonDriverStore';
import { useNavigationStore } from '@app/stores/navigationStore';
import type { Season } from '@app/types/season';

import Skeleton from 'primevue/skeleton';
import Message from 'primevue/message';

import SeasonFormSplitModal from '@app/components/season/modals/SeasonFormSplitModal.vue';

const route = useRoute();
const { showError } = useToastError();
const seasonStore = useSeasonStore();
const seasonDriverStore = useSeasonDriverStore();
const navigationStore = useNavigationStore();

const season = ref<Season | null>(null);
const isLoading = ref(true);
const error = ref<string | null>(null);
const showEditDrawer = ref(false);

const leagueId = computed(() => parseInt(route.params.leagueId as string, 10));
const competitionId = computed(() => parseInt(route.params.competitionId as string, 10));
const seasonId = computed(() => parseInt(route.params.seasonId as string, 10));
const competitionName = computed(
  () => season.value?.competition?.name || season.value?.competition_name || '',
);

// Set dynamic page title: <season name> - <competition name> - <league name> - App Dashboard
const pageTitle = computed(() => {
  if (!season.value) return null;

  const seasonName = season.value.name;
  const competitionName = season.value.competition?.name || season.value.competition_name;
  const leagueName = season.value.competition?.league?.name;

  // Build title parts in order: season, competition, league
  const parts: string[] = [];
  if (seasonName) parts.push(seasonName);
  if (competitionName) parts.push(competitionName);
  if (leagueName) parts.push(leagueName);

  return parts.length > 0 ? parts : null;
});
usePageTitle(pageTitle);

onMounted(async () => {
  const seasonLoaded = await loadSeason();
  // Only load drivers if season loaded successfully
  if (seasonLoaded) {
    await loadDrivers();
  }
});

onUnmounted(() => {
  // Clear navigation context when leaving season detail
  navigationStore.clearCompetitionContext();
});

// Watch for season changes to update navigation store
watch(
  () => season.value,
  (newSeason) => {
    if (newSeason && newSeason.competition) {
      // Set both the IDs (for URL generation) and data (for display)
      navigationStore.setCompetitionContext(leagueId.value, competitionId.value, seasonId.value);
      navigationStore.setCompetitionData(newSeason.competition, newSeason);
    }
  },
  { immediate: true },
);

async function loadSeason(): Promise<boolean> {
  isLoading.value = true;
  error.value = null;

  try {
    season.value = await seasonStore.fetchSeason(seasonId.value);
    return true;
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Failed to load season';
    error.value = errorMessage;
    showError(errorMessage, { summary: 'Load Failed' });
    return false;
  } finally {
    isLoading.value = false;
  }
}

async function loadDrivers(): Promise<void> {
  try {
    const results = await Promise.allSettled([
      seasonDriverStore.fetchSeasonDrivers(seasonId.value),
      seasonDriverStore.fetchStats(seasonId.value),
    ]);

    // Check for failures and provide specific error messages
    const failures: string[] = [];
    if (results[0].status === 'rejected') {
      failures.push('season drivers');
    }
    if (results[1].status === 'rejected') {
      failures.push('driver statistics');
    }

    if (failures.length > 0) {
      const errorMessage = `Failed to load ${failures.join(' and ')}`;
      showError(errorMessage, { summary: 'Load Failed' });
    }
  } catch (err: unknown) {
    showError(err, { summary: 'Load Failed' });
  }
}

function handleSeasonUpdated(updated: Season): void {
  season.value = updated;
  // Reload season to get fresh data
  loadSeason();
}
</script>

<template>
  <div class="p-6">
    <!-- Loading skeleton -->
    <Skeleton v-if="isLoading" height="30rem" />

    <!-- Error state -->
    <Message v-else-if="error" severity="error">
      {{ error }}
    </Message>

    <!-- Season content -->
    <div v-else-if="season" class="space-y-6">
      <!-- Nested router view for tabs -->
      <router-view />

      <!-- Edit Season Modal -->
      <SeasonFormSplitModal
        v-model:visible="showEditDrawer"
        :competition-id="competitionId"
        :competition-name="competitionName"
        :season="season"
        is-edit-mode
        @season-saved="handleSeasonUpdated"
      />
    </div>
  </div>
</template>
