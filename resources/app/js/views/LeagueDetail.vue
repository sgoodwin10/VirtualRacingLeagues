<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useToast } from 'primevue/usetoast';
import { useConfirm } from 'primevue/useconfirm';
import { PhUsers, PhFlagCheckered } from '@phosphor-icons/vue';
import Button from 'primevue/button';
import Card from 'primevue/card';
import Skeleton from 'primevue/skeleton';
import Tabs from 'primevue/tabs';
import TabList from 'primevue/tablist';
import Tab from 'primevue/tab';
import TabPanels from 'primevue/tabpanels';
import TabPanel from 'primevue/tabpanel';
import Toast from 'primevue/toast';
import { getLeagueById } from '@app/services/leagueService';
import { useLeagueDrivers } from '@app/composables/useLeagueDrivers';
import DriverFormDialog from '@app/components/driver/modals/DriverFormDialog.vue';
import ViewDriverModal from '@app/components/driver/ViewDriverModal.vue';
import CSVImportDialog from '@app/components/driver/modals/CSVImportDialog.vue';
import LeagueWizardDrawer from '@app/components/league/modals/LeagueWizardDrawer.vue';
import CompetitionList from '@app/components/competition/CompetitionList.vue';
import LeagueHeader from '@app/components/league/partials/LeagueHeader.vue';
import LeagueStatsBar from '@app/components/league/partials/LeagueStatsBar.vue';
import LeagueAboutPanel from '@app/components/league/partials/LeagueAboutPanel.vue';
import LeagueContactPanel from '@app/components/league/partials/LeagueContactPanel.vue';
import LeagueSocialMediaPanel from '@app/components/league/partials/LeagueSocialMediaPanel.vue';
import LeagueDriversTab from '@app/components/league/partials/LeagueDriversTab.vue';
import type { League } from '@app/types/league';
import type { Competition } from '@app/types/competition';
import type { LeagueDriver, CreateDriverRequest } from '@app/types/driver';
import BasePanel from '@app/components/common/panels/BasePanel.vue';
import Breadcrumbs, { type BreadcrumbItem } from '@app/components/common/Breadcrumbs.vue';

const route = useRoute();
const router = useRouter();
const toast = useToast();
const confirm = useConfirm();

const league = ref<League | null>(null);
const isLoading = ref(true);
const error = ref<string | null>(null);
const activeTab = ref('competitions');
const showEditModal = ref(false);

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

// Watch for active tab changes
watch(activeTab, async (newTab) => {
  if (newTab === 'drivers') {
    await loadDrivers();
  }
});

onMounted(async () => {
  await loadLeague();
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

function handleCompetitionCreated(_competition: Competition): void {
  // Competition created event handled by CompetitionList component
}

function handleCompetitionUpdated(_competition: Competition): void {
  // Competition updated event handled by CompetitionList component
}

function handleCompetitionDeleted(_competitionId: number): void {
  // Competition deleted event handled by CompetitionList component
}

function handleEditLeague(): void {
  showEditModal.value = true;
}

function handleLeagueSaved(): void {
  showEditModal.value = false;
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
  try {
    if (formMode.value === 'create') {
      await addDriver(data);
    } else if (selectedDriver.value) {
      await updateDriver(selectedDriver.value.driver_id, data);
    }
    showDriverForm.value = false;
  } catch (error) {
    // Error already handled by composable callbacks
    console.error('Failed to save driver:', error);
  }
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
      try {
        await removeDriver(driver.driver_id);
      } catch (error) {
        // Error already handled by composable callbacks
        console.error('Failed to remove driver:', error);
      }
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

const breadcrumbItems = computed((): BreadcrumbItem[] => [
  {
    label: 'Leagues',
    to: { name: 'home' },
    icon: 'pi-home',
  },
  {
    label: league.value?.name || 'League Details',
  },
]);
</script>

<template>
  <div class="max-w-7xl mx-auto p-6">
    <!-- Loading State -->
    <div v-if="isLoading" class="space-y-6">
      <Skeleton width="200px" height="2rem" class="mb-4" />
      <Skeleton width="100%" height="300px" class="mb-4" />
      <Skeleton width="100%" height="150px" />
    </div>

    <!-- Error State -->
    <div v-else-if="error || !league" class="text-center py-12">
      <Card class="bg-red-50 border border-red-200">
        <template #content>
          <div class="flex flex-col items-center gap-4">
            <i class="pi pi-exclamation-triangle text-6xl text-red-500"></i>
            <h2 class="text-2xl font-bold text-red-900">League Not Found</h2>
            <p class="text-red-700">
              {{ error || 'The league you are looking for does not exist or has been removed.' }}
            </p>
            <Button
              label="Back to Leagues"
              icon="pi pi-arrow-left"
              @click="router.push({ name: 'leagues' })"
            />
          </div>
        </template>
      </Card>
    </div>

    <!-- League Content -->
    <div v-else class="space-y-6">
      <!-- Breadcrumbs -->
      <Breadcrumbs :items="breadcrumbItems" />

      <!-- Header Image and Logo -->
      <Card class="overflow-hidden p-0">
        <template #header>
          <LeagueHeader :league="league" @edit="handleEditLeague" />
        </template>

        <template #content>
          <LeagueStatsBar :league="league" />

          <div class="space-y-6">
            <!-- Main Content: Two-Column Layout -->
            <div class="grid grid-cols-1 lg:grid-cols-5 gap-6">
              <!-- Left Column: Description (3/5 width) -->
              <div class="lg:col-span-3 space-y-4">
                <LeagueAboutPanel :league-name="league.name" :description="league.description" />
                <LeagueContactPanel
                  :organizer-name="league.organizer_name"
                  :contact-email="league.contact_email"
                />
              </div>

              <!-- Right Column: Social Media (2/5 width) -->
              <div class="lg:col-span-2 space-y-4">
                <LeagueSocialMediaPanel :league="league" />
              </div>
            </div>
          </div>
        </template>
      </Card>
    </div>

    <!-- Tabs -->
    <Tabs v-model:value="activeTab" class="mt-6">
      <TabList :pt="{ tabList: { class: 'gap-2' } }">
        <Tab value="competitions">
          <div class="flex items-center gap-2">
            <PhFlagCheckered :size="20" />
            <span>Competitions</span>
          </div>
        </Tab>
        <Tab value="drivers">
          <div class="flex items-center gap-2">
            <PhUsers :size="20" />
            <span>Drivers</span>
          </div>
        </Tab>
      </TabList>

      <TabPanels>
        <!-- Competitions Tab -->
        <TabPanel value="competitions">
          <BasePanel class="px-4 pb-4">
            <CompetitionList
              :league-id="leagueIdNumber"
              @competition-created="handleCompetitionCreated"
              @competition-updated="handleCompetitionUpdated"
              @competition-deleted="handleCompetitionDeleted"
            />
          </BasePanel>
        </TabPanel>

        <!-- Drivers Tab -->
        <TabPanel value="drivers">
          <LeagueDriversTab
            :league-id="leagueIdNumber"
            @add-driver="handleAddDriver"
            @import-csv="handleImportCSV"
            @view-driver="handleViewDriver"
            @edit-driver="handleEditDriver"
            @remove-driver="handleRemoveDriver"
          />
        </TabPanel>
      </TabPanels>
    </Tabs>

    <!-- Edit League Modal -->
    <LeagueWizardDrawer
      v-model:visible="showEditModal"
      :is-edit-mode="true"
      :league-id="leagueIdNumber"
      @league-saved="handleLeagueSaved"
    />

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

    <!-- Toast for notifications -->
    <Toast />
  </div>
</template>
