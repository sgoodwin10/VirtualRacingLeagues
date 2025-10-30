<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useToast } from 'primevue/usetoast';
import { useConfirm } from 'primevue/useconfirm';
import { PhUsers, PhFlagCheckered, PhUser, PhEnvelope } from '@phosphor-icons/vue';
import Button from 'primevue/button';
import Card from 'primevue/card';
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
import BasePanel from '@user/components/common/panels/BasePanel.vue';
import FormLabel from '@user/components/common/forms/FormLabel.vue';
import Breadcrumbs, { type BreadcrumbItem } from '@user/components/common/Breadcrumbs.vue';
import LeagueVisibilityTag from '@user/components/league/partials/LeagueVisibilityTag.vue';
import InfoItem from '@user/components/common/InfoItem.vue';
import { PhGameController, PhMapPinArea, PhSteeringWheel, PhTrophy } from '@phosphor-icons/vue';

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

function getPlatformNames(league: League): string {
  if (!league.platforms || league.platforms.length === 0) {
    return 'No platforms';
  }

  if (league.platforms.length <= 2) {
    return league.platforms.map((p) => p.name).join(', ');
  }

  return league.platforms.map((p) => p.name).join(', ');
}
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

            <div class="absolute top-0 left-0 flex flex-col items-center gap-3 p-2">
              <LeagueVisibilityTag :visibility="league.visibility" />
            </div>
          </div>
          <!-- Title and Visibility -->
          <div
            class="flex flex-wrap items-start justify-between gap-4 bg-slate-100 border-b border-gray-200 p-3 shadow-lg"
          >
            <HTag additional-classes="ml-32" :level="2">{{ league.name }}</HTag>

            <!-- Action Buttons -->
            <div class="flex gap-3">
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
          <div class="grid grid-cols-4 border-b border-gray-200 gap-px bg-surface-200">
            <InfoItem :icon="PhGameController" :text="getPlatformNames(league)" centered />
            <InfoItem :icon="PhMapPinArea" :text="league.timezone" centered />
            <InfoItem
              :icon="PhTrophy"
              :text="
                league.competitions_count.toString() +
                ' Competition' +
                (league.competitions_count === 1 ? '' : 's')
              "
              centered
            />
            <InfoItem
              :icon="PhSteeringWheel"
              :text="
                league.drivers_count.toString() +
                ' Driver' +
                (league.drivers_count === 1 ? '' : 's')
              "
              centered
            />
          </div>
          <div class="space-y-6">
            <!-- Hero Section: Tagline -->
            <div v-if="league.tagline" class="text-center py-4 hidden">
              <p class="text-xl text-gray-600 italic font-light">{{ league.tagline }}</p>
            </div>

            <!-- Main Content: Two-Column Layout -->
            <div class="grid grid-cols-1 lg:grid-cols-5 gap-6">
              <!-- Left Column: Description (2/3 width) -->
              <div class="lg:col-span-3 space-y-4">
                <BasePanel>
                  <template #header>
                    <div class="flex items-center gap-2 border-b border-gray-200 py-2 mx-4 w-full">
                      <span class="font-medium text-surface-700">About {{ league.name }}</span>
                    </div>
                  </template>
                  <div v-if="league.description" class="prose max-w-none p-4">
                    <!-- eslint-disable-next-line vue/no-v-html -->
                    <div class="text-gray-700 leading-relaxed" v-html="league.description"></div>
                  </div>
                  <div v-else class="text-gray-500 italic pt-4">No description provided</div>
                </BasePanel>
                <BasePanel>
                  <template #header>
                    <div class="flex items-center gap-2 border-b border-gray-200 py-2 mx-4 w-full">
                      <span class="font-medium text-surface-700">Contact Information</span>
                    </div>
                  </template>

                  <div class="grid grid-cols-1 md:grid-cols-2 gap-3 p-4">
                    <!-- Organizer Name -->
                    <div
                      class="flex items-center gap-3 p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors group"
                    >
                      <div
                        class="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-lg bg-blue-100 group-hover:bg-blue-200 transition-colors"
                      >
                        <PhUser :size="20" class="text-blue-600" />
                      </div>
                      <div class="flex-1 min-w-0">
                        <div class="text-xs font-medium text-gray-500 uppercase tracking-wide">
                          Organizer
                        </div>
                        <div class="text-sm font-semibold text-gray-900 truncate mt-0.5">
                          {{ league.organizer_name }}
                        </div>
                      </div>
                    </div>

                    <!-- Contact Email -->
                    <a
                      v-if="league.contact_email"
                      :href="`mailto:${league.contact_email}`"
                      class="flex items-center gap-3 p-3 rounded-lg bg-slate-50 hover:bg-blue-50 transition-colors group"
                    >
                      <div
                        class="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-lg bg-green-100 group-hover:bg-green-200 transition-colors"
                      >
                        <PhEnvelope :size="20" class="text-green-600" />
                      </div>
                      <div class="flex-1 min-w-0">
                        <div class="text-xs font-medium text-gray-500 uppercase tracking-wide">
                          Contact Email
                        </div>
                        <div
                          class="text-sm font-semibold text-blue-600 group-hover:text-blue-700 truncate mt-0.5"
                        >
                          {{ league.contact_email }}
                        </div>
                      </div>
                    </a>

                    <!-- Placeholder if no email -->
                    <div
                      v-else
                      class="flex items-center gap-3 p-3 rounded-lg bg-slate-50 opacity-50"
                    >
                      <div
                        class="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-lg bg-gray-100"
                      >
                        <PhEnvelope :size="20" class="text-gray-400" />
                      </div>
                      <div class="flex-1 min-w-0">
                        <div class="text-xs font-medium text-gray-500 uppercase tracking-wide">
                          Contact Email
                        </div>
                        <div class="text-sm text-gray-400 italic mt-0.5">Not provided</div>
                      </div>
                    </div>
                  </div>
                </BasePanel>
              </div>

              <!-- Right Column: Basic Info & Metadata (1/3 width) -->
              <div class="lg:col-span-2 space-y-4">
                <BasePanel>
                  <template #header>
                    <div class="flex items-center gap-2 border-b border-gray-200 py-2 mx-4 w-full">
                      <span class="font-medium text-surface-700">Social Media & Links</span>
                    </div>
                  </template>

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
                  <div class="grid grid-cols-2 gap-2 px-2">
                    <!-- Discord -->
                    <a
                      v-if="league.discord_url"
                      :href="league.discord_url"
                      target="_blank"
                      rel="noopener noreferrer"
                      class="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors group"
                    >
                      <div
                        class="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg bg-indigo-100 group-hover:bg-indigo-200 transition-colors"
                      >
                        <i class="pi pi-discord text-indigo-600"></i>
                      </div>
                      <div class="flex-1 min-w-0">
                        <div class="text-sm font-medium text-gray-900">Discord</div>
                        <div class="text-xs text-gray-500 truncate">{{ league.discord_url }}</div>
                      </div>
                    </a>

                    <!-- Website -->
                    <a
                      v-if="league.website_url"
                      :href="league.website_url"
                      target="_blank"
                      rel="noopener noreferrer"
                      class="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors group"
                    >
                      <div
                        class="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg bg-blue-100 group-hover:bg-blue-200 transition-colors"
                      >
                        <i class="pi pi-globe text-blue-600"></i>
                      </div>
                      <div class="flex-1 min-w-0">
                        <div class="text-sm font-medium text-gray-900">Website</div>
                        <div class="text-xs text-gray-500 truncate">{{ league.website_url }}</div>
                      </div>
                    </a>

                    <!-- Twitter -->
                    <a
                      v-if="league.twitter_handle"
                      :href="`https://twitter.com/${league.twitter_handle.replace('@', '')}`"
                      target="_blank"
                      rel="noopener noreferrer"
                      class="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors group"
                    >
                      <div
                        class="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg bg-gray-100 group-hover:bg-gray-200 transition-colors"
                      >
                        <i class="pi pi-twitter text-gray-900"></i>
                      </div>
                      <div class="flex-1 min-w-0">
                        <div class="text-sm font-medium text-gray-900">Twitter</div>
                        <div class="text-xs text-gray-500 truncate">
                          @{{ league.twitter_handle.replace('@', '') }}
                        </div>
                      </div>
                    </a>

                    <!-- Instagram -->
                    <a
                      v-if="league.instagram_handle"
                      :href="`https://instagram.com/${league.instagram_handle.replace('@', '')}`"
                      target="_blank"
                      rel="noopener noreferrer"
                      class="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors group"
                    >
                      <div
                        class="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg bg-pink-100 group-hover:bg-pink-200 transition-colors"
                      >
                        <i class="pi pi-instagram text-pink-600"></i>
                      </div>
                      <div class="flex-1 min-w-0">
                        <div class="text-sm font-medium text-gray-900">Instagram</div>
                        <div class="text-xs text-gray-500 truncate">
                          @{{ league.instagram_handle.replace('@', '') }}
                        </div>
                      </div>
                    </a>

                    <!-- YouTube -->
                    <a
                      v-if="league.youtube_url"
                      :href="league.youtube_url"
                      target="_blank"
                      rel="noopener noreferrer"
                      class="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors group"
                    >
                      <div
                        class="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg bg-red-100 group-hover:bg-red-200 transition-colors"
                      >
                        <i class="pi pi-youtube text-red-600"></i>
                      </div>
                      <div class="flex-1 min-w-0">
                        <div class="text-sm font-medium text-gray-900">YouTube</div>
                        <div class="text-xs text-gray-500 truncate">{{ league.youtube_url }}</div>
                      </div>
                    </a>

                    <!-- Twitch -->
                    <a
                      v-if="league.twitch_url"
                      :href="league.twitch_url"
                      target="_blank"
                      rel="noopener noreferrer"
                      class="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors group"
                    >
                      <div
                        class="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg bg-purple-100 group-hover:bg-purple-200 transition-colors"
                      >
                        <i class="pi pi-twitch text-purple-600"></i>
                      </div>
                      <div class="flex-1 min-w-0">
                        <div class="text-sm font-medium text-gray-900">Twitch</div>
                        <div class="text-xs text-gray-500 truncate">{{ league.twitch_url }}</div>
                      </div>
                    </a>
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
          <CompetitionList
            :league-id="leagueIdNumber"
            @competition-created="handleCompetitionCreated"
            @competition-updated="handleCompetitionUpdated"
            @competition-deleted="handleCompetitionDeleted"
          />

          <Button
            label="Create Competitions"
            icon="pi pi-trophy"
            severity="help"
            size="small"
            class="bg-white"
            outlined
            @click="handleCreateCompetitions"
          />
        </TabPanel>

        <!-- Drivers Tab -->
        <TabPanel value="drivers">
          <BasePanel>
            <div class="space-y-4 p-4">
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
                    label="Import Drivers"
                    icon="pi pi-upload"
                    severity="secondary"
                    size="small"
                    outlined
                    @click="handleImportCSV"
                  />
                  <Button
                    label="Add Driver"
                    outlined
                    icon="pi pi-plus"
                    size="small"
                    @click="handleAddDriver"
                  />
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
