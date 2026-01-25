<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useToast } from 'primevue/usetoast';
import { useTeamStore } from '@app/stores/teamStore';
import { useSeasonDriverStore } from '@app/stores/seasonDriverStore';
import { useVrlConfirm } from '@app/composables/useVrlConfirm';
import VrlConfirmDialog from '@app/components/common/dialogs/VrlConfirmDialog.vue';
import type { Team } from '@app/types/team';

import Column from 'primevue/column';
import { Button, FooterAddButton } from '@app/components/common/buttons';
import Message from 'primevue/message';
import { PhPencil, PhTrash, PhUsersThree, PhWarning } from '@phosphor-icons/vue';

import { TechDataTable, TeamCell } from '@app/components/common/tables';
import TeamFormModal from './TeamFormModal.vue';
import { CardHeader } from '@app/components/common/cards';

interface Props {
  seasonId: number;
  teamChampionshipEnabled: boolean;
  isSeasonCompleted?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  isSeasonCompleted: false,
});

const toast = useToast();
const teamStore = useTeamStore();
const seasonDriverStore = useSeasonDriverStore();

// VRL Confirmation dialog
const {
  isVisible: isDeleteTeamVisible,
  options: deleteTeamOptions,
  isLoading: isDeleteTeamLoading,
  showConfirmation: showDeleteTeamConfirmation,
  handleAccept: handleDeleteTeamAccept,
  handleReject: handleDeleteTeamReject,
} = useVrlConfirm();

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

// Watch for seasonId changes to reload data when navigating between seasons
watch(
  () => props.seasonId,
  async (newSeasonId, oldSeasonId) => {
    if (newSeasonId && newSeasonId !== oldSeasonId && props.teamChampionshipEnabled) {
      await loadTeams();
    }
  },
);

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
    (driver) => driver.team_id === team.id,
  );
  const driverCount = driversInTeam.length;

  const message =
    driverCount > 0
      ? `Delete ${team.name}? ${driverCount} driver${driverCount > 1 ? 's' : ''} will become Privateer.`
      : `Delete ${team.name}?`;

  showDeleteTeamConfirmation({
    header: 'Delete Team',
    message,
    icon: PhWarning,
    iconColor: 'var(--red)',
    iconBgColor: 'var(--red-dim)',
    acceptLabel: 'Delete',
    rejectLabel: 'Cancel',
    acceptVariant: 'danger',
    rejectVariant: 'secondary',
    onAccept: async () => {
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
  <div>
    <!-- Disabled State -->
    <div v-if="!teamChampionshipEnabled" class="text-center py-6">
      <Message severity="info" :closable="false" class="w-full">
        <div class="flex flex-col items-center gap-2">
          <i class="pi pi-info-circle text-2xl"></i>
          <p class="font-semibold">Teams not enabled for this season</p>
          <p class="text-sm">Enable team championship in season settings to manage teams</p>
        </div>
      </Message>
    </div>

    <!-- Enabled State -->
    <div v-else>
      <!-- DataTable -->
      <TechDataTable :value="teams" :loading="loading" responsive-layout="scroll" class="text-sm">
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

        <template #header>
          <CardHeader title="Teams" :icon="PhUsersThree" icon-color="purple-400" />
        </template>

        <Column field="name" header="Team">
          <template #body="{ data }">
            <TeamCell
              :name="data.name"
              :logo="data.logo"
              :logo-url="data.logo_url"
              :color="data.color"
            />
          </template>
        </Column>

        <Column
          v-if="!props.isSeasonCompleted"
          header="Actions"
          :exportable="false"
          style="width: 8rem"
        >
          <template #body="{ data }">
            <div class="flex gap-1">
              <Button :icon="PhPencil" size="sm" variant="outline" @click="handleEditTeam(data)" />
              <Button :icon="PhTrash" size="sm" variant="danger" @click="handleDeleteTeam(data)" />
            </div>
          </template>
        </Column>
      </TechDataTable>

      <!-- Add Team Button (footer, hidden for completed seasons) -->
      <FooterAddButton
        v-if="teamChampionshipEnabled && !props.isSeasonCompleted"
        label="Add Team"
        @click="handleAddTeam"
      />
    </div>

    <!-- Team Form Modal -->
    <TeamFormModal
      v-model:visible="showTeamModal"
      :mode="modalMode"
      :season-id="seasonId"
      :team="selectedTeam"
      @save="handleTeamSaved"
    />

    <!-- Confirm Delete Team Dialog -->
    <VrlConfirmDialog
      v-model:visible="isDeleteTeamVisible"
      v-bind="deleteTeamOptions"
      :loading="isDeleteTeamLoading"
      @accept="handleDeleteTeamAccept"
      @reject="handleDeleteTeamReject"
    />
  </div>
</template>
