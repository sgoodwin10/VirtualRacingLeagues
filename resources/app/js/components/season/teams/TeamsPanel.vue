<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useConfirm } from 'primevue/useconfirm';
import { useToast } from 'primevue/usetoast';
import { useTeamStore } from '@app/stores/teamStore';
import { useSeasonDriverStore } from '@app/stores/seasonDriverStore';
import type { Team } from '@app/types/team';

import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Button from 'primevue/button';
import Message from 'primevue/message';

import TeamFormModal from './TeamFormModal.vue';

interface Props {
  seasonId: number;
  teamChampionshipEnabled: boolean;
}

const props = defineProps<Props>();

const confirm = useConfirm();
const toast = useToast();
const teamStore = useTeamStore();
const seasonDriverStore = useSeasonDriverStore();

const showTeamModal = ref(false);
const modalMode = ref<'add' | 'edit'>('add');
const selectedTeam = ref<Team | null>(null);

const teams = computed(() => teamStore.teams);
const loading = computed(() => teamStore.loading);

onMounted(async () => {
  if (props.teamChampionshipEnabled) {
    await loadTeams();
  }
});

async function loadTeams(): Promise<void> {
  try {
    await teamStore.fetchTeams(props.seasonId);
  } catch (error) {
    console.error('Failed to load teams:', error);
  }
}

function handleAddTeam(): void {
  selectedTeam.value = null;
  modalMode.value = 'add';
  showTeamModal.value = true;
}

function handleEditTeam(team: Team): void {
  selectedTeam.value = team;
  modalMode.value = 'edit';
  showTeamModal.value = true;
}

function handleDeleteTeam(team: Team): void {
  // Count drivers assigned to this team
  const driversInTeam = seasonDriverStore.seasonDrivers.filter(
    (driver) => driver.team_name === team.name,
  );
  const driverCount = driversInTeam.length;

  const message =
    driverCount > 0
      ? `Delete ${team.name}? ${driverCount} driver${driverCount > 1 ? 's' : ''} will become Privateer.`
      : `Delete ${team.name}?`;

  confirm.require({
    message,
    header: 'Delete Team',
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'Delete',
    rejectLabel: 'Cancel',
    acceptClass: 'p-button-danger',
    accept: async () => {
      try {
        await teamStore.deleteTeam(props.seasonId, team.id);

        toast.add({
          severity: 'success',
          summary: 'Team Deleted',
          detail: `${team.name} has been deleted${driverCount > 0 ? ` and ${driverCount} driver${driverCount > 1 ? 's' : ''} became Privateer` : ''}`,
          life: 3000,
        });

        // Refresh drivers to update team assignments
        await seasonDriverStore.fetchSeasonDrivers(props.seasonId);
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to delete team';
        toast.add({
          severity: 'error',
          summary: 'Error',
          detail: errorMessage,
          life: 5000,
        });
      }
    },
  });
}

function handleTeamSaved(): void {
  loadTeams();
}
</script>

<template>
  <Button
    v-if="teamChampionshipEnabled"
    icon="pi pi-plus"
    size="small"
    label="Add Team"
    @click="handleAddTeam"
  />

  <!-- Disabled State -->
  <div v-if="!teamChampionshipEnabled" class="text-center py-8">
    <Message severity="info" :closable="false">
      <div class="flex flex-col items-center gap-2">
        <i class="pi pi-info-circle text-2xl"></i>
        <p class="font-semibold">Teams not enabled for this season</p>
        <p class="text-sm">Enable team championship in season settings to manage teams</p>
      </div>
    </Message>
  </div>

  <!-- Enabled State -->
  <div v-else>
    <DataTable
      :value="teams"
      :loading="loading"
      striped-rows
      show-gridlines
      responsive-layout="scroll"
      class="text-sm"
    >
      <template #empty>
        <div class="text-center py-6">
          <i class="pi pi-users text-3xl text-gray-400 mb-2"></i>
          <p class="text-gray-600">No teams created yet</p>
          <p class="text-sm text-gray-500 mt-1">Click "Add Team" to create your first team</p>
        </div>
      </template>

      <template #loading>
        <div class="text-center py-6 text-gray-500">Loading teams...</div>
      </template>

      <Column field="name" header="Team">
        <template #body="{ data }">
          <div class="flex items-center gap-2">
            <img
              v-if="data.logo_url"
              :src="data.logo_url"
              :alt="data.name"
              class="w-8 h-8 rounded object-cover"
            />
            <span class="font-semibold">{{ data.name }}</span>
          </div>
        </template>
      </Column>

      <Column header="Actions" :exportable="false" style="width: 8rem">
        <template #body="{ data }">
          <div class="flex gap-1">
            <Button
              icon="pi pi-pencil"
              size="small"
              outlined
              severity="secondary"
              @click="handleEditTeam(data)"
            />
            <Button
              icon="pi pi-trash"
              size="small"
              outlined
              severity="danger"
              @click="handleDeleteTeam(data)"
            />
          </div>
        </template>
      </Column>
    </DataTable>
  </div>

  <!-- Team Form Modal -->
  <TeamFormModal
    v-model:visible="showTeamModal"
    :mode="modalMode"
    :season-id="seasonId"
    :team="selectedTeam"
    @save="handleTeamSaved"
  />
</template>
