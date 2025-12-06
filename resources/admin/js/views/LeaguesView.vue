<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue';
import { useConfirm } from 'primevue/useconfirm';
import { storeToRefs } from 'pinia';
import { useDebounceFn } from '@vueuse/core';
import InputText from 'primevue/inputtext';
import Select from 'primevue/select';
import MultiSelect from 'primevue/multiselect';
import Card from 'primevue/card';
import Skeleton from 'primevue/skeleton';
import ConfirmDialog from 'primevue/confirmdialog';
import LeaguesTable from '@admin/components/League/LeaguesTable.vue';
import ViewLeagueModal from '@admin/components/League/ViewLeagueModal.vue';
import type { League } from '@admin/types/league';
import { isRequestCancelled } from '@admin/types/errors';
import { useRequestCancellation } from '@admin/composables/useRequestCancellation';
import { useLeagueStore } from '@admin/stores/leagueStore';
import { useErrorToast } from '@admin/composables/useErrorToast';

// Store and composables
const leagueStore = useLeagueStore();
const { getSignal, cancel: cancelRequests } = useRequestCancellation();
const { showErrorToast, showSuccessToast } = useErrorToast();
const confirm = useConfirm();

// Destructure store state and getters with reactivity
const { leagues, loading, searchQuery, visibilityFilter, statusFilter, platformsFilter } =
  storeToRefs(leagueStore);

// Local modal state
const initialLoading = ref(true);
const viewDrawerVisible = ref(false);
const selectedLeague = ref<League | null>(null);

const visibilityOptions = [
  { label: 'All', value: 'all' },
  { label: 'Public', value: 'public' },
  { label: 'Private', value: 'private' },
  { label: 'Unlisted', value: 'unlisted' },
];

const statusOptions = [
  { label: 'All', value: 'all' },
  { label: 'Active', value: 'active' },
  { label: 'Archived', value: 'archived' },
];

// Platform options (hardcoded for now - can be fetched from API later)
const platformOptions = [
  { label: 'iRacing', value: 1 },
  { label: 'Assetto Corsa Competizione', value: 2 },
  { label: 'rFactor 2', value: 3 },
  { label: 'F1 Series', value: 4 },
  { label: 'Gran Turismo', value: 5 },
  { label: 'Project CARS', value: 6 },
];

/**
 * Load leagues from server using store
 */
const loadLeagues = async () => {
  try {
    // Cancel any pending requests before starting a new one
    cancelRequests('Loading new data');

    await leagueStore.fetchLeagues(getSignal());
  } catch (error) {
    // Silently ignore cancelled requests
    if (isRequestCancelled(error)) {
      return;
    }

    showErrorToast(error, 'Failed to load leagues');
  }
};

/**
 * Debounced version of loadLeagues for search input
 * Waits 500ms after user stops typing before making API call
 */
const debouncedLoadLeagues = useDebounceFn(() => {
  loadLeagues();
}, 500);

/**
 * Watch for search query changes
 * Use debounced load to prevent excessive API calls while typing
 */
watch(searchQuery, () => {
  debouncedLoadLeagues();
});

/**
 * Watch for filter changes
 * Load immediately when filters change (no debounce needed)
 */
watch([visibilityFilter, statusFilter, platformsFilter], () => {
  loadLeagues();
});

const handleView = (league: League) => {
  selectedLeague.value = league;
  viewDrawerVisible.value = true;
};

const handleArchive = (league: League) => {
  confirm.require({
    message: `Are you sure you want to archive "${league.name}"?`,
    header: 'Confirm Archive',
    icon: 'pi pi-exclamation-triangle',
    acceptClass: 'p-button-warning',
    accept: async () => {
      try {
        await leagueStore.archiveLeague(league.id, getSignal());
        showSuccessToast('League archived successfully');
      } catch (error) {
        // Silently ignore cancelled requests
        if (isRequestCancelled(error)) {
          return;
        }

        showErrorToast(error, 'Failed to archive league');
      }
    },
  });
};

const handleDelete = (league: League) => {
  confirm.require({
    message: `Are you sure you want to delete "${league.name}"?`,
    header: 'Confirm Delete',
    icon: 'pi pi-exclamation-triangle',
    acceptClass: 'p-button-danger',
    accept: () => {
      // Show toast that delete functionality is coming soon
      showSuccessToast('Delete functionality coming soon');
    },
  });
};

/**
 * Handle visibility filter change with runtime validation
 */
const handleVisibilityFilterChange = (value: string) => {
  const validValues = ['public', 'private', 'unlisted', 'all'] as const;
  if (validValues.includes(value as (typeof validValues)[number])) {
    leagueStore.setVisibilityFilter(value as 'public' | 'private' | 'unlisted' | 'all');
  }
};

/**
 * Handle status filter change with runtime validation
 */
const handleStatusFilterChange = (value: string) => {
  const validValues = ['active', 'archived', 'all'] as const;
  if (validValues.includes(value as (typeof validValues)[number])) {
    leagueStore.setStatusFilter(value as 'active' | 'archived' | 'all');
  }
};

onMounted(async () => {
  await loadLeagues();
  initialLoading.value = false;
});

onUnmounted(() => {
  cancelRequests('Component unmounted');
});
</script>

<template>
  <div class="leagues-view">
    <!-- Header -->
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-900 mb-2">League Management</h1>
      <p class="text-gray-600">Manage all leagues in the system</p>
    </div>

    <!-- Initial Loading Skeleton -->
    <div v-if="initialLoading" class="space-y-6">
      <Card>
        <template #content>
          <Skeleton height="4rem" />
        </template>
      </Card>
      <Card>
        <template #content>
          <Skeleton height="20rem" />
        </template>
      </Card>
    </div>

    <!-- Main Content (after initial load) -->
    <div v-else>
      <!-- Filters & Actions -->
      <Card class="mb-6">
        <template #content>
          <div class="flex flex-col gap-4">
            <!-- First Row: Search -->
            <InputText
              :model-value="searchQuery"
              placeholder="Search leagues by name or slug..."
              class="w-full"
              @update:model-value="(value) => leagueStore.setSearchQuery(value ?? '')"
            />
            <!-- Second Row: Filters -->
            <div class="flex gap-4">
              <Select
                :model-value="visibilityFilter"
                :options="visibilityOptions"
                option-label="label"
                option-value="value"
                placeholder="Filter by visibility"
                class="flex-1"
                @update:model-value="handleVisibilityFilterChange"
              />
              <Select
                :model-value="statusFilter"
                :options="statusOptions"
                option-label="label"
                option-value="value"
                placeholder="Filter by status"
                class="flex-1"
                @update:model-value="handleStatusFilterChange"
              />
              <MultiSelect
                :model-value="platformsFilter"
                :options="platformOptions"
                option-label="label"
                option-value="value"
                placeholder="Filter by platforms"
                class="flex-1"
                display="chip"
                @update:model-value="
                  (value: number[]) => leagueStore.setPlatformsFilter(value ?? [])
                "
              />
            </div>
          </div>
        </template>
      </Card>

      <!-- Leagues Table -->
      <Card :pt="{ body: { class: 'p-0' }, content: { class: 'p-0' } }">
        <template #content>
          <LeaguesTable
            :leagues="leagues ?? []"
            :loading="loading"
            @view="handleView"
            @archive="handleArchive"
            @delete="handleDelete"
          />
        </template>
      </Card>
    </div>

    <ViewLeagueModal v-model:visible="viewDrawerVisible" :league="selectedLeague" />
    <ConfirmDialog />
  </div>
</template>

<style scoped></style>
