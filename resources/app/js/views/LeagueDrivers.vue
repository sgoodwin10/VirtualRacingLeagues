<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRoute } from 'vue-router';
import { useToast } from 'primevue/usetoast';
import { useConfirm } from 'primevue/useconfirm';
import Skeleton from 'primevue/skeleton';
import Toast from 'primevue/toast';
import { getLeagueById } from '@app/services/leagueService';
import { useLeagueDrivers } from '@app/composables/useLeagueDrivers';
import { usePageTitle } from '@app/composables/usePageTitle';
import DriverFormDialog from '@app/components/driver/modals/DriverFormDialog.vue';
import ViewDriverModal from '@app/components/driver/ViewDriverModal.vue';
import CSVImportDialog from '@app/components/driver/modals/CSVImportDialog.vue';
import LeagueDriversTab from '@app/components/league/partials/LeagueDriversTab.vue';
import LeagueIdentityPanel from '@app/components/league/partials/LeagueIdentityPanel.vue';
import LeagueWizardDrawer from '@app/components/league/modals/LeagueWizardDrawer.vue';
import type { League } from '@app/types/league';
import type { LeagueDriver, CreateDriverRequest } from '@app/types/driver';

const route = useRoute();
const toast = useToast();
const confirm = useConfirm();

const league = ref<League | null>(null);
const isLoading = ref(true);
const error = ref<string | null>(null);

// Modal states
const showEditModal = ref(false);
const showSettingsModal = ref(false);

// Driver dialog states
const showDriverForm = ref(false);
const showViewModal = ref(false);
const showCSVImport = ref(false);
const formMode = ref<'create' | 'edit'>('create');
const selectedDriver = ref<LeagueDriver | null>(null);

// Get league ID from route params
const leagueId = computed(() => route.params.id as string);
const leagueIdNumber = computed(() => {
  const parsed = parseInt(leagueId.value, 10);
  if (isNaN(parsed)) {
    console.error('Invalid league ID:', leagueId.value);
    return 0;
  }
  return parsed;
});

// Use the useLeagueDrivers composable for driver management
const { loadDrivers, addDriver, updateDriver, removeDriver, importFromCSV } = useLeagueDrivers(
  leagueIdNumber,
  {
    onSuccess: (msg) =>
      toast.add({ severity: 'success', summary: 'Success', detail: msg, life: 3000 }),
    onError: (msg) => toast.add({ severity: 'error', summary: 'Error', detail: msg, life: 5000 }),
  },
);

// Set dynamic page title based on league name
const pageTitle = computed(() => (league.value ? `${league.value.name} - Drivers` : 'Drivers'));
usePageTitle(pageTitle);

// Seasons count for identity panel (can be 0 for now)
const seasonsCount = computed(() => 0);

onMounted(async () => {
  await loadLeague();
  await loadDrivers();
});

async function loadLeague(): Promise<void> {
  if (!leagueId.value) {
    error.value = 'League ID is required';
    isLoading.value = false;
    return;
  }

  isLoading.value = true;
  error.value = null;

  try {
    league.value = await getLeagueById(leagueId.value);
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Failed to load league';
    error.value = errorMessage;
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: errorMessage,
      life: 5000,
    });
  } finally {
    isLoading.value = false;
  }
}

function handleEditLeague(): void {
  showEditModal.value = true;
}

function handleSettings(): void {
  showSettingsModal.value = true;
}

function handleLeagueSaved(): void {
  showEditModal.value = false;
  showSettingsModal.value = false;
  loadLeague();
}

function handleAddDriver(): void {
  formMode.value = 'create';
  selectedDriver.value = null;
  showDriverForm.value = true;
}

function handleViewDriver(driver: LeagueDriver): void {
  selectedDriver.value = driver;
  showViewModal.value = true;
}

function handleEditDriver(driver: LeagueDriver): void {
  formMode.value = 'edit';
  selectedDriver.value = driver;
  showDriverForm.value = true;
}

function handleEditFromView(): void {
  showViewModal.value = false;
  if (selectedDriver.value) {
    handleEditDriver(selectedDriver.value);
  }
}

async function handleSaveDriver(data: CreateDriverRequest): Promise<void> {
  if (formMode.value === 'create') {
    await addDriver(data);
  } else if (selectedDriver.value) {
    await updateDriver(selectedDriver.value.driver_id, data);
  }
  showDriverForm.value = false;
}

function handleRemoveDriver(driver: LeagueDriver): void {
  confirm.require({
    message: `Are you sure you want to remove ${getDriverName(driver)} from this league?`,
    header: 'Confirm Removal',
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'Remove',
    rejectLabel: 'Cancel',
    acceptClass: 'p-button-danger',
    accept: async () => {
      await removeDriver(driver.driver_id);
    },
  });
}

function handleImportCSV(): void {
  showCSVImport.value = true;
}

async function handleCSVImport(csvData: string) {
  const result = await importFromCSV(csvData);

  // Additional UI feedback for partial imports
  if (result.errors.length > 0 && result.success_count > 0) {
    const message = `Imported ${result.success_count} driver${result.success_count === 1 ? '' : 's'} with ${result.errors.length} error${result.errors.length === 1 ? '' : 's'}`;
    toast.add({
      severity: 'warn',
      summary: 'Partial Import',
      detail: message,
      life: 5000,
    });
  }

  return result;
}

function getDriverName(leagueDriver: LeagueDriver): string {
  return leagueDriver.driver?.display_name || 'Unknown';
}
</script>

<template>
  <div class="flex">
    <!-- Loading State -->
    <div v-if="isLoading" class="flex-1 p-6">
      <Skeleton width="100%" height="100vh" />
    </div>

    <!-- Error State -->
    <div v-else-if="error || !league" class="flex-1 flex items-center justify-center p-6">
      <div class="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-8 max-w-md">
        <div class="flex flex-col items-center gap-4">
          <i class="pi pi-exclamation-triangle text-6xl text-[var(--red)]"></i>
          <h2 class="font-mono text-2xl font-semibold text-[var(--red)]">League Not Found</h2>
          <p class="text-[var(--text-secondary)] text-center">
            {{ error || 'The league you are looking for does not exist or has been removed.' }}
          </p>
        </div>
      </div>
    </div>

    <!-- Main Split-Panel Layout -->
    <template v-else>
      <!-- Left Panel - League Identity -->
      <LeagueIdentityPanel
        :league="league"
        :seasons-count="seasonsCount"
        @edit="handleEditLeague"
        @settings="handleSettings"
      />

      <!-- Right Panel - Driver Management Content -->
      <main class="flex-1 min-w-0 flex flex-col">
        <!-- Content Header -->
        <header
          class="flex items-center justify-between px-8 py-5 bg-[var(--bg-panel)] border-b border-[var(--border)]"
        >
          <h2
            class="font-mono text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2"
          >
            <span class="text-[var(--cyan)]">//</span> DRIVER MANAGEMENT
          </h2>
        </header>

        <!-- Content Body -->
        <div class="flex-1 px-8 py-6 overflow-y-auto">
          <!-- Driver Management Tab (reused component) -->
          <LeagueDriversTab
            :league-id="leagueIdNumber"
            @add-driver="handleAddDriver"
            @import-csv="handleImportCSV"
            @view-driver="handleViewDriver"
            @edit-driver="handleEditDriver"
            @remove-driver="handleRemoveDriver"
          />
        </div>
      </main>
    </template>

    <!-- View Driver Modal -->
    <ViewDriverModal
      v-model:visible="showViewModal"
      :driver="selectedDriver"
      @close="showViewModal = false"
      @edit="handleEditFromView"
    />

    <!-- Driver Form Dialog -->
    <DriverFormDialog
      v-if="league"
      v-model:visible="showDriverForm"
      :mode="formMode"
      :driver="selectedDriver"
      :league-id="leagueIdNumber"
      @save="handleSaveDriver"
      @cancel="showDriverForm = false"
    />

    <!-- CSV Import Dialog -->
    <CSVImportDialog
      v-model:visible="showCSVImport"
      :league-id="leagueIdNumber"
      :on-import="handleCSVImport"
      @close="showCSVImport = false"
    />

    <!-- Edit League Modal -->
    <LeagueWizardDrawer
      v-if="league"
      v-model:visible="showEditModal"
      :is-edit-mode="true"
      :league-id="leagueIdNumber"
      @league-saved="handleLeagueSaved"
    />

    <!-- Settings Modal (same as Edit for now) -->
    <LeagueWizardDrawer
      v-if="league"
      v-model:visible="showSettingsModal"
      :is-edit-mode="true"
      :league-id="leagueIdNumber"
      @league-saved="handleLeagueSaved"
    />

    <!-- Toast for notifications -->
    <Toast />
  </div>
</template>

<style scoped>
/* Ensure responsive behavior */
@media (max-width: 1024px) {
  .flex {
    flex-direction: column;
  }
}
</style>
