<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';
import { useToast } from 'primevue/usetoast';
import { useSeasonStore } from '@app/stores/seasonStore';
import type { Season } from '@app/types/season';

import Skeleton from 'primevue/skeleton';
import Message from 'primevue/message';
import Button from 'primevue/button';

import SeasonCard from './SeasonCard.vue';
import SeasonFormDrawer from './modals/SeasonFormDrawer.vue';

interface Props {
  competitionId: number;
  leagueId: number;
}

const props = defineProps<Props>();

const toast = useToast();
const seasonStore = useSeasonStore();

const showCreateDrawer = ref(false);
const showEditDrawer = ref(false);
const selectedSeason = ref<Season | null>(null);
const archivingSeasonId = ref<number | null>(null);
const deletingSeasonId = ref<number | null>(null);

onMounted(async () => {
  await loadSeasons();
});

watch(
  () => props.competitionId,
  async () => {
    await loadSeasons();
  },
);

async function loadSeasons(): Promise<void> {
  try {
    await seasonStore.fetchSeasons(props.competitionId);
  } catch (error) {
    console.error('Failed to load seasons:', error);
  }
}

function handleCreate(): void {
  showCreateDrawer.value = true;
}

function handleEdit(season: Season): void {
  selectedSeason.value = season;
  showEditDrawer.value = true;
}

function handleSeasonSaved(): void {
  loadSeasons();
}

async function handleArchive(season: Season): Promise<void> {
  archivingSeasonId.value = season.id;
  try {
    await seasonStore.archiveExistingSeason(season.id);
    toast.add({
      severity: 'success',
      summary: 'Season Archived',
      detail: 'Season has been archived successfully',
      life: 3000,
    });
  } catch (error) {
    console.error('Failed to archive season:', error);
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to archive season',
      life: 5000,
    });
  } finally {
    archivingSeasonId.value = null;
  }
}

async function handleDelete(season: Season): Promise<void> {
  deletingSeasonId.value = season.id;
  try {
    await seasonStore.deleteExistingSeason(season.id);
    toast.add({
      severity: 'success',
      summary: 'Season Deleted',
      detail: 'Season has been deleted successfully',
      life: 3000,
    });
  } catch (error) {
    console.error('Failed to delete season:', error);
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to delete season',
      life: 5000,
    });
  } finally {
    deletingSeasonId.value = null;
  }
}
</script>

<template>
  <div class="season-list">
    <!-- Loading skeleton -->
    <div v-if="seasonStore.loading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <Skeleton height="20rem" />
      <Skeleton height="20rem" />
      <Skeleton height="20rem" />
    </div>

    <!-- Error state -->
    <Message v-else-if="seasonStore.error" severity="error">
      {{ seasonStore.error }}
    </Message>

    <!-- Empty state -->
    <div
      v-else-if="seasonStore.seasons.length === 0"
      class="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300"
    >
      <i class="pi pi-flag text-6xl text-gray-400 mb-4"></i>
      <h3 class="text-xl font-semibold mb-2">No seasons yet</h3>
      <p class="text-gray-600 mb-6">Create your first season to start organizing races.</p>
      <Button label="Create First Season" icon="pi pi-plus" @click="handleCreate" />
    </div>

    <!-- Season grid -->
    <div v-else>
      <div class="flex justify-between items-center mb-6">
        <h2 class="text-2xl font-semibold">Seasons</h2>
        <Button label="Create Season" icon="pi pi-plus" @click="handleCreate" />
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <SeasonCard
          v-for="season in seasonStore.seasons"
          :key="season.id"
          :season="season"
          :league-id="leagueId"
          @edit="handleEdit(season)"
          @archive="handleArchive(season)"
          @delete="handleDelete(season)"
        />
      </div>
    </div>

    <!-- Create Drawer -->
    <SeasonFormDrawer
      v-model:visible="showCreateDrawer"
      :competition-id="competitionId"
      @season-saved="handleSeasonSaved"
    />

    <!-- Edit Drawer -->
    <SeasonFormDrawer
      v-model:visible="showEditDrawer"
      :competition-id="competitionId"
      :season="selectedSeason"
      is-edit-mode
      @season-saved="handleSeasonSaved"
    />
  </div>
</template>
