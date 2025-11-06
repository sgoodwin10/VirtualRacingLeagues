<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useToast } from 'primevue/usetoast';
import { useCompetitionStore } from '@app/stores/competitionStore';
import type { Competition } from '@app/types/competition';
import { PhPlus } from '@phosphor-icons/vue';

import Button from 'primevue/button';
import Card from 'primevue/card';
import Skeleton from 'primevue/skeleton';

import CompetitionCard from './CompetitionCard.vue';
import CompetitionFormDrawer from './CompetitionFormDrawer.vue';
import CompetitionDeleteDialog from './CompetitionDeleteDialog.vue';

interface Props {
  leagueId: number;
}

const props = defineProps<Props>();

interface Emits {
  (e: 'competition-created', competition: Competition): void;
  (e: 'competition-updated', competition: Competition): void;
  (e: 'competition-deleted', competitionId: number): void;
}

const emit = defineEmits<Emits>();

const competitionStore = useCompetitionStore();
const toast = useToast();

const showCreateDrawer = ref(false);
const showEditDrawer = ref(false);
const showDeleteDialog = ref(false);
const editingCompetition = ref<Competition | null>(null);
const deletingCompetition = ref<Competition | null>(null);

onMounted(async () => {
  await competitionStore.fetchCompetitions(props.leagueId);
});

function handleCreateClick(): void {
  showCreateDrawer.value = true;
}

function handleEditClick(competition: Competition): void {
  editingCompetition.value = competition;
  showEditDrawer.value = true;
}

function handleDeleteClick(competition: Competition): void {
  deletingCompetition.value = competition;
  showDeleteDialog.value = true;
}

function handleArchiveClick(competition: Competition): void {
  // Archive functionality
  competitionStore.archiveExistingCompetition(competition.id);

  toast.add({
    severity: 'success',
    summary: 'Competition Archived',
    detail: 'Competition has been archived successfully',
    life: 3000,
  });
}

async function handleCompetitionCreated(competition: Competition): Promise<void> {
  // Refresh the competitions list to ensure we have the latest data with all relationships
  await competitionStore.fetchCompetitions(props.leagueId);
  emit('competition-created', competition);
}

async function handleCompetitionUpdated(competition: Competition): Promise<void> {
  // Refresh the competitions list to ensure we have the latest data with all relationships
  await competitionStore.fetchCompetitions(props.leagueId);
  emit('competition-updated', competition);
}

function handleCompetitionDeleted(competitionId: number): void {
  emit('competition-deleted', competitionId);
}
</script>

<template>
  <div class="competition-list mt-4">
    <!-- Header -->
    <!-- Loading skeleton -->
    <div
      v-if="competitionStore.loading"
      class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
    >
      <Skeleton v-for="i in 6" :key="i" height="20rem" />
    </div>

    <!-- Empty state -->
    <Card v-else-if="competitionStore.competitions.length === 0">
      <template #content>
        <div class="text-center py-8">
          <i class="pi pi-flag text-6xl text-gray-400 mb-4"></i>
          <h3 class="text-xl font-semibold mb-2">No Competitions Yet</h3>
          <p class="text-gray-600 mb-4">Create your first competition to start organizing races.</p>
          <Button
            label="Create Your First Competition"
            icon="pi pi-plus"
            @click="handleCreateClick"
          />
        </div>
      </template>
    </Card>

    <!-- Competition cards grid -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <CompetitionCard
        v-for="comp in competitionStore.competitions"
        :key="comp.id"
        :competition="comp"
        @edit="handleEditClick(comp)"
        @delete="handleDeleteClick(comp)"
        @archive="handleArchiveClick(comp)"
      />

      <!-- Create Competition Card -->
      <div
        class="flex flex-col items-center justify-center w-full h-32 rounded-md border-2 border-dashed border-blue-200 bg-gradient-to-br from-white to-blue-50 hover:from-blue-50 hover:to-blue-100 hover:border-blue-200 transition-all cursor-pointer group"
        @click="handleCreateClick"
      >
        <div class="flex flex-col items-center gap-2">
          <div class="p-1 rounded-full bg-blue-100 group-hover:bg-blue-200 transition-colors">
            <PhPlus :size="24" class="text-blue-500 group-hover:text-blue-600" weight="bold" />
          </div>
          <div class="text-center">
            <h3
              class="text-xl font-semibold text-blue-600 group-hover:text-blue-700 transition-colors"
            >
              Create Competition
            </h3>
            <p class="text-sm text-blue-500 mt-1">Start organising a new competition</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Create Drawer -->
    <CompetitionFormDrawer
      v-model:visible="showCreateDrawer"
      :league-id="leagueId"
      @competition-saved="handleCompetitionCreated"
    />

    <!-- Edit Drawer -->
    <CompetitionFormDrawer
      v-model:visible="showEditDrawer"
      :league-id="leagueId"
      :competition="editingCompetition"
      is-edit-mode
      @competition-saved="handleCompetitionUpdated"
    />

    <!-- Delete Dialog -->
    <CompetitionDeleteDialog
      v-model:visible="showDeleteDialog"
      :competition="deletingCompetition"
      @confirmed="handleCompetitionDeleted"
    />
  </div>
</template>
