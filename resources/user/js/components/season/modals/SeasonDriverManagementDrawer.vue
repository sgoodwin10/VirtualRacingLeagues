<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { useDebounceFn } from '@vueuse/core';
import { useToast } from 'primevue/usetoast';
import { useSeasonDriverStore } from '@user/stores/seasonDriverStore';
import type { SeasonDriver, AvailableDriver } from '@user/types/seasonDriver';

import Drawer from 'primevue/drawer';
import InputText from 'primevue/inputtext';
import Button from 'primevue/button';

import DrawerHeader from '@user/components/common/modals/DrawerHeader.vue';
import SeasonDriversTable from '@user/components/season/SeasonDriversTable.vue';
import AvailableDriversTable from '@user/components/season/AvailableDriversTable.vue';

interface Props {
  visible: boolean;
  seasonId: number;
  leagueId: number;
  platformId?: number;
}

const props = defineProps<Props>();

interface Emits {
  (e: 'update:visible', value: boolean): void;
}

const emit = defineEmits<Emits>();

const toast = useToast();
const seasonDriverStore = useSeasonDriverStore();

const availableSearch = ref('');
const seasonSearch = ref('');
const isDataLoaded = ref(false);
const isAddingDriver = ref(false);

const localVisible = computed({
  get: () => props.visible,
  set: (value) => emit('update:visible', value),
});

watch(
  () => props.visible,
  async (visible) => {
    if (visible && !isDataLoaded.value) {
      await loadData();
      isDataLoaded.value = true;
    }
  },
);

onMounted(async () => {
  if (props.visible && !isDataLoaded.value) {
    await loadData();
    isDataLoaded.value = true;
  }
});

async function loadData(): Promise<void> {
  // Load season drivers (critical)
  try {
    await seasonDriverStore.fetchSeasonDrivers(props.seasonId);
  } catch (error) {
    console.error('Failed to load season drivers:', error);
  }

  // Load available drivers (critical)
  try {
    await seasonDriverStore.fetchAvailableDrivers(props.seasonId, props.leagueId);
  } catch (error) {
    console.error('Failed to load available drivers:', error);
  }

  // Load stats (nice-to-have, don't block on failure)
  try {
    await seasonDriverStore.fetchStats(props.seasonId);
  } catch (error) {
    console.error('Failed to load driver stats:', error);
  }
}

async function handleAddDriver(driver: AvailableDriver): Promise<void> {
  isAddingDriver.value = true;

  try {
    await seasonDriverStore.addDriver(props.seasonId, {
      league_driver_id: driver.id,
      status: 'active',
      notes: undefined,
    });

    toast.add({
      severity: 'success',
      summary: 'Driver Added',
      detail: `${driver.driver_name} has been added to the season`,
      life: 3000,
    });

    // Refresh data after successful add
    await refreshData();
  } catch (error: unknown) {
    console.error('Failed to add driver:', error);

    const errorMessage = error instanceof Error ? error.message : 'Failed to add driver to season';

    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: errorMessage,
      life: 5000,
    });
  } finally {
    isAddingDriver.value = false;
  }
}

async function refreshData(): Promise<void> {
  // Re-fetch season drivers and available drivers
  try {
    await seasonDriverStore.fetchSeasonDrivers(props.seasonId);
  } catch (error) {
    console.error('Failed to reload season drivers:', error);
  }

  try {
    await seasonDriverStore.fetchAvailableDrivers(props.seasonId, props.leagueId);
  } catch (error) {
    console.error('Failed to reload available drivers:', error);
  }

  // Stats are already updated by the store mutations during addDriver
}

async function handleSearchAvailable(): Promise<void> {
  seasonDriverStore.setAvailableSearchQuery(availableSearch.value);

  try {
    await seasonDriverStore.fetchAvailableDrivers(props.seasonId, props.leagueId);
  } catch (error) {
    console.error('Failed to search available drivers:', error);

    const errorMessage =
      error instanceof Error ? error.message : 'Failed to search available drivers';

    toast.add({
      severity: 'error',
      summary: 'Search Error',
      detail: errorMessage,
      life: 5000,
    });
  }
}

async function handleSearchSeason(): Promise<void> {
  seasonDriverStore.setSearchQuery(seasonSearch.value);

  try {
    await seasonDriverStore.fetchSeasonDrivers(props.seasonId);
  } catch (error) {
    console.error('Failed to search season drivers:', error);

    const errorMessage = error instanceof Error ? error.message : 'Failed to search season drivers';

    toast.add({
      severity: 'error',
      summary: 'Search Error',
      detail: errorMessage,
      life: 5000,
    });
  }
}

// Create debounced versions of search functions
const debouncedSearchAvailable = useDebounceFn(async () => {
  await handleSearchAvailable();
}, 300);

const debouncedSearchSeason = useDebounceFn(async () => {
  await handleSearchSeason();
}, 300);

// Watch search queries and trigger debounced search
watch(availableSearch, () => {
  debouncedSearchAvailable();
});

watch(seasonSearch, () => {
  debouncedSearchSeason();
});

function handleViewDriver(driver: SeasonDriver | AvailableDriver): void {
  // Navigate to driver detail or show driver info modal
  console.log('View driver:', driver);
}
</script>

<template>
  <Drawer v-model:visible="localVisible" position="bottom" class="!h-[75vh] w-full bg-gray-50">
    <template #header>
      <DrawerHeader
        title="Manage Season Drivers"
        subtitle="Add or remove drivers from this season"
      />
    </template>

    <div class="container mx-auto flex flex-col max-w-7xl px-4 h-full">
      <!-- Two-column layout -->
      <div class="grid grid-cols-2 gap-6 flex-1 overflow-hidden">
        <!-- Left: Available Drivers -->
        <div class="flex flex-col bg-white rounded-lg shadow-sm p-4 overflow-hidden">
          <div class="mb-4">
            <h3 class="text-lg font-semibold mb-2">Available Drivers</h3>
            <InputText v-model="availableSearch" placeholder="Search drivers..." size="small" />
          </div>
          <div class="flex-1 overflow-auto">
            <AvailableDriversTable
              :platform-id="platformId"
              :loading="seasonDriverStore.loadingAvailable || isAddingDriver"
              @view="handleViewDriver"
              @add="handleAddDriver"
            />
          </div>
        </div>

        <!-- Right: Season Drivers -->
        <div class="flex flex-col bg-white rounded-lg shadow-sm p-4 overflow-hidden">
          <div class="mb-4">
            <h3 class="text-lg font-semibold mb-2">Season Drivers</h3>
            <InputText v-model="seasonSearch" placeholder="Search drivers..." size="small" />
          </div>
          <div class="flex-1 overflow-auto">
            <SeasonDriversTable
              :season-id="seasonId"
              :platform-id="platformId"
              :loading="seasonDriverStore.loading"
              :show-number-column="false"
              :show-team-column="false"
              @view="handleViewDriver"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <div class="bg-tertiary mt-4 shadow-reverse border-t border-gray-200">
      <div class="container mx-auto flex flex-col max-w-7xl">
        <div class="flex justify-end p-4">
          <Button label="Close" @click="localVisible = false" />
        </div>
      </div>
    </div>
  </Drawer>
</template>
