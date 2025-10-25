<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useToast } from 'primevue/usetoast';
import { useConfirm } from 'primevue/useconfirm';
import { PhUsers, PhFlagCheckered } from '@phosphor-icons/vue';
import Button from 'primevue/button';
import Card from 'primevue/card';
import Chip from 'primevue/chip';
import Skeleton from 'primevue/skeleton';
import Tabs from 'primevue/tabs';
import TabList from 'primevue/tablist';
import Tab from 'primevue/tab';
import TabPanels from 'primevue/tabpanels';
import TabPanel from 'primevue/tabpanel';
import IconField from 'primevue/iconfield';
import InputIcon from 'primevue/inputicon';
import InputText from 'primevue/inputtext';
import Select from 'primevue/select';
import Toast from 'primevue/toast';
import ConfirmDialog from 'primevue/confirmdialog';
import { getLeagueById } from '@user/services/leagueService';
import { useImageUrl } from '@user/composables/useImageUrl';
import { useDateFormatter } from '@user/composables/useDateFormatter';
import { useDriverStore } from '@user/stores/driverStore';
import DriverManagementDrawer from '@user/components/driver/DriverManagementDrawer.vue';
import DriverTable from '@user/components/driver/DriverTable.vue';
import DriverFormDialog from '@user/components/driver/modals/DriverFormDialog.vue';
import ViewDriverModal from '@user/components/driver/ViewDriverModal.vue';
import CSVImportDialog from '@user/components/driver/modals/CSVImportDialog.vue';
import LeagueWizardDrawer from '@user/components/league/modals/LeagueWizardDrawer.vue';
import CompetitionList from '@user/components/competition/CompetitionList.vue';
import CompetitionFormDrawer from '@user/components/competition/CompetitionFormDrawer.vue';
import type { League } from '@user/types/league';
import type { Competition } from '@user/types/competition';
import type { LeagueDriver, CreateDriverRequest } from '@user/types/driver';
import HTag from '@user/components/common/HTag.vue';
import Tag from 'primevue/tag';
import BasePanel from '@user/components/common/panels/BasePanel.vue';
import FormLabel from '@user/components/common/forms/FormLabel.vue';
import Breadcrumbs, { type BreadcrumbItem } from '@user/components/common/Breadcrumbs.vue';

const route = useRoute();
const router = useRouter();
const toast = useToast();
const confirm = useConfirm();
const driverStore = useDriverStore();

const league = ref<League | null>(null);
const isLoading = ref(true);
const error = ref<string | null>(null);
const activeTab = ref('competitions');
const showDriverDrawer = ref(false);
const showEditDrawer = ref(false);
const showCreateCompetitionDrawer = ref(false);

// Driver dialog states
const showDriverForm = ref(false);
const showViewModal = ref(false);
const showCSVImport = ref(false);
const formMode = ref<'create' | 'edit'>('create');
const selectedDriver = ref<LeagueDriver | null>(null);

// Search and filter
const searchInput = ref('');
const statusFilterOptions = [
  { label: 'All Drivers', value: 'all' },
  { label: 'Active Only', value: 'active' },
  { label: 'Inactive Only', value: 'inactive' },
  { label: 'Banned Only', value: 'banned' },
];

const { formatDate } = useDateFormatter();

// Get league ID from route params
const leagueId = computed(() => route.params.id as string);
const leagueIdNumber = computed(() => parseInt(leagueId.value, 10));

// Image handling with composables
const logo = computed(() =>
  useImageUrl(() => league.value?.logo_url, '/images/default-league-logo.png'),
);

const headerImage = computed(() => useImageUrl(() => league.value?.header_image_url));

// Watch for active tab changes
watch(activeTab, async (newTab) => {
  if (newTab === 'drivers') {
    await loadDrivers();
  }
});

// Watch for search input changes (debounced)
let searchTimeout: ReturnType<typeof setTimeout> | null = null;
watch(searchInput, (newValue) => {
  if (searchTimeout) {
    clearTimeout(searchTimeout);
  }
  searchTimeout = setTimeout(() => {
    driverStore.setSearchQuery(newValue);
    if (activeTab.value === 'drivers') {
      loadDrivers();
    }
  }, 300);
});

// Watch for status filter changes
watch(
  () => driverStore.statusFilter,
  () => {
    if (activeTab.value === 'drivers') {
      loadDrivers();
    }
  },
);

// Watch for page changes
watch(
  () => driverStore.currentPage,
  () => {
    if (activeTab.value === 'drivers') {
      loadDrivers();
    }
  },
);

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

/**
 * Load drivers for the league
 */
async function loadDrivers(): Promise<void> {
  try {
    await driverStore.fetchLeagueDrivers(leagueIdNumber.value);
  } catch {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to load drivers',
      life: 3000,
    });
  }
}

function handleCreateCompetitions(): void {
  showCreateCompetitionDrawer.value = true;
}

function handleCompetitionCreated(competition: Competition): void {
  // Competition created successfully - toast shown by CompetitionFormDrawer
  // Close the drawer
  showCreateCompetitionDrawer.value = false;
  // Emit to CompetitionList to refresh
  console.log('Competition created:', competition);
}

function handleCompetitionUpdated(competition: Competition): void {
  console.log('Competition updated:', competition);
}

function handleCompetitionDeleted(competitionId: number): void {
  console.log('Competition deleted:', competitionId);
}

function handleCreateDrivers(): void {
  showDriverDrawer.value = true;
}

function handleEditLeague(): void {
  showEditDrawer.value = true;
}

function handleLeagueSaved(): void {
  showEditDrawer.value = false;
  loadLeague();
}

/**
 * Handle add driver button click
 */
function handleAddDriver(): void {
  formMode.value = 'create';
  selectedDriver.value = null;
  showDriverForm.value = true;
}

/**
 * Handle view driver button click
 */
function handleViewDriver(driver: LeagueDriver): void {
  selectedDriver.value = driver;
  showViewModal.value = true;
}

/**
 * Handle edit driver button click
 */
function handleEditDriver(driver: LeagueDriver): void {
  formMode.value = 'edit';
  selectedDriver.value = driver;
  showDriverForm.value = true;
}

/**
 * Handle edit from view modal
 */
function handleEditFromView(): void {
  showViewModal.value = false;
  if (selectedDriver.value) {
    handleEditDriver(selectedDriver.value);
  }
}

/**
 * Handle driver form save
 */
async function handleSaveDriver(data: CreateDriverRequest): Promise<void> {
  try {
    if (formMode.value === 'create') {
      await driverStore.createNewDriver(leagueIdNumber.value, data);
      toast.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Driver added successfully',
        life: 3000,
      });
    } else if (selectedDriver.value) {
      // In edit mode, update both driver fields and league-specific settings
      // Use driver_id (the actual driver ID), not id (the league_driver pivot ID)
      await driverStore.updateDriver(leagueIdNumber.value, selectedDriver.value.driver_id, data);
      toast.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Driver updated successfully',
        life: 3000,
      });
    }
    showDriverForm.value = false;
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error instanceof Error ? error.message : 'Failed to save driver',
      life: 5000,
    });
  }
}

/**
 * Handle remove driver button click
 */
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
        // Use driver_id (the actual driver ID), not id (the league_driver pivot ID)
        await driverStore.removeDriver(leagueIdNumber.value, driver.driver_id);
        toast.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Driver removed from league',
          life: 3000,
        });
      } catch {
        toast.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to remove driver',
          life: 3000,
        });
      }
    },
  });
}

/**
 * Handle import CSV button click
 */
function handleImportCSV(): void {
  showCSVImport.value = true;
}

/**
 * Handle CSV import
 */
async function handleCSVImport(csvData: string) {
  const result = await driverStore.importCSV(leagueIdNumber.value, csvData);

  if (result.errors.length === 0) {
    const message =
      result.success_count === 1
        ? 'Successfully imported 1 driver'
        : `Successfully imported ${result.success_count} drivers`;

    toast.add({
      severity: 'success',
      summary: 'Import Successful',
      detail: message,
      life: 3000,
    });
  } else if (result.success_count > 0) {
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

/**
 * Get driver's display name
 */
function getDriverName(leagueDriver: LeagueDriver): string {
  return leagueDriver.driver?.display_name || 'Unknown';
}

const breadcrumbItems = computed((): BreadcrumbItem[] => [
  {
    label: 'Dashboard',
    to: { name: 'home' },
    icon: 'pi-home',
  },
  {
    label: 'Leagues',
    to: { name: 'leagues' },
  },
  {
    label: league.value?.name || 'League Details',
  },
]);

const visibilitySeverity = computed((): 'success' | 'info' | 'warning' => {
  if (!league.value) return 'info';

  switch (league.value.visibility) {
    case 'public':
      return 'info';
    case 'private':
      return 'warning';
    case 'unlisted':
      return 'info';
    default:
      return 'info';
  }
});

const statusSeverity = computed((): 'success' | 'info' | 'warning' | 'danger' => {
  if (!league.value) return 'info';

  switch (league.value.status) {
    case 'active':
      return 'success';
    case 'archived':
      return 'danger';
    default:
      return 'info';
  }
});
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
          <div class="relative">
            <!-- Header Image with Error Handling -->
            <img
              v-if="headerImage.url.value && !headerImage.hasError.value"
              :src="headerImage.displayUrl.value"
              :alt="league.name"
              class="w-full h-48 object-cover"
              @load="headerImage.handleLoad"
              @error="headerImage.handleError"
            />
            <div v-else class="w-full h-64 bg-gradient-to-br from-blue-500 to-purple-600"></div>

            <!-- Logo with Error Handling and Fallback -->
            <img
              :src="logo.displayUrl.value"
              :alt="`${league.name} logo`"
              class="absolute -bottom-12 left-8 w-24 h-24 rounded-xl border-4 border-white shadow-xl object-cover"
              @load="logo.handleLoad"
              @error="logo.handleError"
            />

            <div class="absolute top-0 right-0 flex flex-col items-center gap-3 p-2">
              <Tag
                icon="pi pi-eye"
                :value="league.visibility.toUpperCase()"
                :severity="visibilitySeverity"
              />
            </div>
          </div>
          <!-- Title and Visibility -->
          <div
            class="flex flex-wrap items-start justify-between gap-4 bg-slate-100 border-b border-gray-200 p-3 shadow-lg"
          >
            <HTag additional-classes="ml-32">{{ league.name }}</HTag>

            <!-- Action Buttons -->
            <div class="flex gap-3">
              <Button
                label="Create Competitions"
                icon="pi pi-trophy"
                severity="help"
                size="small"
                class="bg-white"
                outlined
                @click="handleCreateCompetitions"
              />
              <Button
                label="Manage Drivers"
                icon="pi pi-users"
                severity="info"
                size="small"
                @click="handleCreateDrivers"
              />
              <Button
                label="Edit League"
                icon="pi pi-pencil"
                severity="secondary"
                class="bg-white"
                outlined
                size="small"
                @click="handleEditLeague"
              />
            </div>
          </div>
        </template>

        <template #content>
          <div class="space-y-6">
            <!-- Hero Section: Tagline -->
            <div v-if="league.tagline" class="text-center py-4 hidden">
              <p class="text-xl text-gray-600 italic font-light">{{ league.tagline }}</p>
            </div>

            <!-- Main Content: Two-Column Layout -->
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <!-- Left Column: Description (2/3 width) -->
              <div class="lg:col-span-2 space-y-4">
                <BasePanel>
                  <template #header>
                    <div class="flex items-center gap-2 border-b border-gray-200 pb-2 w-full">
                      <i class="pi pi-info-circle text-lg"></i>
                      <span class="font-semibold">About {{ league.name }}</span>
                    </div>
                  </template>

                  <div v-if="league.description" class="prose max-w-none pt-4">
                    <!-- eslint-disable-next-line vue/no-v-html -->
                    <div class="text-gray-700 leading-relaxed" v-html="league.description"></div>
                  </div>
                  <div v-else class="text-gray-500 italic pt-4">No description provided</div>
                </BasePanel>
                <BasePanel>
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <!-- Organizer -->
                    <div>
                      <FormLabel text="Contact Name" />
                      <p class="text-gray-700 mt-1">{{ league.organizer_name }}</p>
                    </div>

                    <!-- Contact Email -->
                    <div v-if="league.contact_email">
                      <FormLabel text="Contact Email" />
                      <a
                        :href="`mailto:${league.contact_email}`"
                        class="text-blue-600 hover:underline block mt-1"
                      >
                        {{ league.contact_email }}
                      </a>
                    </div>
                  </div>
                </BasePanel>

                <!-- Social Media & Links Section -->
                <BasePanel
                  v-if="
                    league.discord_url ||
                    league.website_url ||
                    league.twitter_handle ||
                    league.instagram_handle ||
                    league.youtube_url ||
                    league.twitch_url
                  "
                >
                  <div class="flex flex-wrap gap-3">
                    <Button
                      v-if="league.discord_url"
                      v-tooltip.top="'Discord'"
                      icon="pi pi-discord"
                      size="small"
                      class="bg-indigo-600 hover:bg-indigo-700 text-white border-0"
                      :href="league.discord_url"
                      target="_blank"
                      rel="noopener noreferrer"
                      as="a"
                    />
                    <Button
                      v-if="league.website_url"
                      v-tooltip.top="'Website'"
                      icon="pi pi-globe"
                      size="small"
                      class="bg-blue-600 hover:bg-blue-700 text-white border-0"
                      :href="league.website_url"
                      target="_blank"
                      rel="noopener noreferrer"
                      as="a"
                    />
                    <Button
                      v-if="league.twitter_handle"
                      v-tooltip.top="'Twitter'"
                      icon="pi pi-twitter"
                      size="small"
                      class="bg-black hover:bg-gray-900 text-white border-0"
                      :href="`https://twitter.com/${league.twitter_handle}`"
                      target="_blank"
                      rel="noopener noreferrer"
                      as="a"
                    />
                    <Button
                      v-if="league.instagram_handle"
                      v-tooltip.top="'Instagram'"
                      icon="pi pi-instagram"
                      size="small"
                      class="bg-pink-600 hover:bg-pink-700 text-white border-0"
                      :href="`https://instagram.com/${league.instagram_handle}`"
                      target="_blank"
                      rel="noopener noreferrer"
                      as="a"
                    />
                    <Button
                      v-if="league.youtube_url"
                      v-tooltip.top="'YouTube'"
                      icon="pi pi-youtube"
                      size="small"
                      class="bg-red-600 hover:bg-red-700 text-white border-0"
                      :href="league.youtube_url"
                      target="_blank"
                      rel="noopener noreferrer"
                      as="a"
                    />
                    <Button
                      v-if="league.twitch_url"
                      v-tooltip.top="'Twitch'"
                      icon="pi pi-twitch"
                      size="small"
                      class="bg-purple-600 hover:bg-purple-700 text-white border-0"
                      :href="league.twitch_url"
                      target="_blank"
                      rel="noopener noreferrer"
                      as="a"
                    />
                  </div>
                </BasePanel>
              </div>

              <!-- Right Column: Basic Info & Metadata (1/3 width) -->
              <div class="lg:col-span-1">
                <BasePanel>
                  <template #header>
                    <div class="flex items-center gap-2 border-b border-gray-200 pb-2 w-full">
                      <i class="pi pi-list text-lg"></i>
                      <span class="font-semibold">League Information</span>
                    </div>
                  </template>

                  <div class="space-y-6 pt-4">
                    <!-- Platforms -->
                    <div>
                      <FormLabel text="Platforms" />
                      <div
                        v-if="league.platforms && league.platforms.length > 0"
                        class="flex flex-wrap gap-2 mt-1"
                      >
                        <Chip
                          v-for="platform in league.platforms"
                          :key="platform.id"
                          :label="platform.name"
                          class="bg-blue-100 text-blue-800"
                        />
                      </div>
                      <p v-else class="text-gray-500 text-sm mt-1">No platforms specified</p>
                    </div>

                    <!-- Timezone -->
                    <div>
                      <FormLabel text="Timezone" />
                      <p class="text-gray-700 mt-1">{{ league.timezone }}</p>
                    </div>

                    <!-- Status -->
                    <div>
                      <FormLabel text="Status" />
                      <div class="mt-1">
                        <Tag
                          :value="league.status.toUpperCase()"
                          :severity="statusSeverity"
                          class="font-medium"
                        />
                      </div>
                    </div>

                    <!-- Metadata Section -->
                    <div
                      v-if="league.created_at || league.updated_at"
                      class="pt-4 border-t border-gray-200 space-y-3"
                    >
                      <!-- Created Date -->
                      <div v-if="league.created_at">
                        <FormLabel text="Created" />
                        <p class="text-gray-600 text-sm mt-1">
                          {{ formatDate(league.created_at) }}
                        </p>
                      </div>

                      <!-- Last Updated -->
                      <div v-if="league.updated_at">
                        <FormLabel text="Last Updated" />
                        <p class="text-gray-600 text-sm mt-1">
                          {{ formatDate(league.updated_at) }}
                        </p>
                      </div>
                    </div>
                  </div>
                </BasePanel>
              </div>
            </div>

            <!-- Full-Width Sections Below Main Content -->
            <div class="space-y-6">
              <!-- Contact Details Section -->
            </div>
          </div>
        </template>
      </Card>
    </div>

    <!-- Tabs -->
    <Tabs v-model:value="activeTab" class="mt-6">
      <TabList>
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
          <BasePanel>
            <template #header>
              <div class="flex items-center gap-2 border-b border-gray-200 pb-2 w-full">
                <PhFlagCheckered size="24" />
                <span class="font-semibold">Competitions</span>
              </div>
            </template>
            <template #icons>
              <Button
                size="small"
                icon="pi pi-plus"
                class="whitespace-nowrap"
                label="New Competition"
                severity="secondary"
                outlined
                @click="handleCreateCompetitions"
              />
            </template>
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
          <BasePanel>
            <template #header>
              <div class="flex items-center gap-2 border-b border-gray-200 pb-2 w-full">
                <PhUsers size="24" />
                <span class="font-semibold">League Drivers</span>
              </div>
            </template>

            <div class="space-y-4">
              <!-- Toolbar -->
              <div class="flex flex-wrap gap-4 items-center justify-between">
                <!-- Search and Filter -->
                <div class="flex gap-2 flex-1">
                  <IconField>
                    <InputIcon class="pi pi-search" />
                    <InputText
                      v-model="searchInput"
                      placeholder="Search drivers..."
                      class="w-full"
                    />
                  </IconField>
                  <Select
                    v-model="driverStore.statusFilter"
                    :options="statusFilterOptions"
                    option-label="label"
                    option-value="value"
                    placeholder="Filter by status"
                    class="w-48"
                  />
                </div>

                <!-- Action Buttons -->
                <div class="flex gap-2">
                  <Button
                    label="Import CSV"
                    icon="pi pi-upload"
                    severity="secondary"
                    @click="handleImportCSV"
                  />
                  <Button label="Add Driver" icon="pi pi-plus" @click="handleAddDriver" />
                </div>
              </div>

              <!-- Driver Table -->
              <div class="overflow-auto">
                <DriverTable
                  :league-id="leagueIdNumber"
                  @view="handleViewDriver"
                  @edit="handleEditDriver"
                  @remove="handleRemoveDriver"
                />
              </div>
            </div>
          </BasePanel>
        </TabPanel>
      </TabPanels>
    </Tabs>

    <!-- Driver Management Drawer -->
    <DriverManagementDrawer
      v-if="league"
      v-model:visible="showDriverDrawer"
      :league-id="leagueIdNumber"
      :league-name="league.name"
      :league-platforms="league.platforms || []"
      @close="showDriverDrawer = false"
    />

    <!-- Edit League Drawer -->
    <LeagueWizardDrawer
      v-model:visible="showEditDrawer"
      :is-edit-mode="true"
      :league-id="leagueIdNumber"
      @league-saved="handleLeagueSaved"
    />

    <!-- Create Competition Drawer -->
    <CompetitionFormDrawer
      v-model:visible="showCreateCompetitionDrawer"
      :league-id="leagueIdNumber"
      @competition-saved="handleCompetitionCreated"
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

    <!-- Confirm Dialog -->
    <ConfirmDialog />
  </div>
</template>
