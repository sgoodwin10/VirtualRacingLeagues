<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useToast } from 'primevue/usetoast';
import DataView from 'primevue/dataview';
import Button from 'primevue/button';
import Card from 'primevue/card';
import { useLeagueStore } from '@app/stores/leagueStore';
import LeagueWizardDrawer from '@app/components/league/modals/LeagueWizardDrawer.vue';
import LeagueCard from '@app/components/league/LeagueCard.vue';
import PageHeader from '@app/components/common/PageHeader.vue';
// import BasePanel from '@app/components/common/panels/BasePanel.vue';
import Breadcrumbs, { type BreadcrumbItem } from '@app/components/common/Breadcrumbs.vue';

const toast = useToast();
const leagueStore = useLeagueStore();

const isLoading = ref(false);
const showWizardDrawer = ref(false);
const isEditMode = ref(false);
const editingLeagueId = ref<number | undefined>(undefined);

const canCreateLeague = computed(() => !leagueStore.hasReachedFreeLimit);

const createButtonTooltip = computed(() => {
  if (!canCreateLeague.value) {
    return 'You have reached the maximum number of leagues for the free tier';
  }
  return 'Create a new league';
});

onMounted(async () => {
  await loadLeagues();
});

async function loadLeagues(): Promise<void> {
  isLoading.value = true;
  try {
    await leagueStore.fetchLeagues();
  } catch {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to load leagues',
      life: 5000,
    });
  } finally {
    isLoading.value = false;
  }
}

function openCreateDrawer(): void {
  if (canCreateLeague.value) {
    isEditMode.value = false;
    editingLeagueId.value = undefined;
    showWizardDrawer.value = true;
  } else {
    toast.add({
      severity: 'warn',
      summary: 'League Limit Reached',
      detail:
        'You have reached the maximum number of leagues for the free tier. Please upgrade your plan to create more leagues.',
      life: 5000,
    });
  }
}

function handleLeagueEdit(leagueId: number): void {
  isEditMode.value = true;
  editingLeagueId.value = leagueId;
  showWizardDrawer.value = true;
}

async function handleLeagueSaved(): Promise<void> {
  // Close drawer and reset state
  showWizardDrawer.value = false;
  isEditMode.value = false;
  editingLeagueId.value = undefined;

  // Reload the leagues list after successful save
  await loadLeagues();
}

function handleLeagueView(leagueId: number): void {
  console.log('League viewed:', leagueId);
}

function handleLeagueDelete(leagueId: number): void {
  console.log('League deleted:', leagueId);
}

const breadcrumbItems = computed((): BreadcrumbItem[] => [
  {
    label: 'Leagues',
    icon: 'pi-home',
  },
]);
</script>

<template>
  <div class="max-w-7xl mx-auto p-6">
    <LeagueWizardDrawer
      v-model:visible="showWizardDrawer"
      :is-edit-mode="isEditMode"
      :league-id="editingLeagueId"
      @league-saved="handleLeagueSaved"
    />

    <!-- Breadcrumbs -->
    <Breadcrumbs :items="breadcrumbItems" />

    <div
      class="mt-3 flex justify-between items-center mb-6 bg-white p-4 rounded-lg border border-blue-100"
    >
      <div class="w-1/2">
        <PageHeader
          title="Your Leagues"
          description="Manage your racing leagues and competitions"
        />
      </div>

      <Button
        label="Create League"
        icon="pi pi-plus"
        :severity="canCreateLeague ? 'primary' : 'secondary'"
        :disabled="!canCreateLeague"
        :title="createButtonTooltip"
        @click="openCreateDrawer"
      />
    </div>

    <!-- Free Tier Notice -->
    <div v-if="leagueStore.hasReachedFreeLimit" class="my-6 hidden">
      <Card class="bg-yellow-50 border border-yellow-200">
        <template #content>
          <div class="flex items-start gap-3">
            <i class="pi pi-info-circle text-yellow-600 text-xl"></i>
            <div>
              <p class="font-semibold text-yellow-900 mb-1">Free Tier Limit Reached</p>
              <p class="text-yellow-800">
                You've reached the maximum of {{ leagueStore.leagueCount }} league(s) for the free
                tier. Upgrade your plan to create more leagues and unlock additional features.
              </p>
            </div>
          </div>
        </template>
      </Card>
    </div>

    <!-- Leagues List -->
    <DataView :value="leagueStore.leagues" :loading="isLoading" data-key="id">
      <template #empty>
        <div class="text-center py-12">
          <i class="pi pi-inbox text-6xl text-gray-400 mb-4"></i>
          <h3 class="text-xl font-semibold text-gray-700 mb-2">No leagues yet</h3>
          <p class="text-gray-600 mb-6">Get started by creating your first racing league</p>
          <Button
            label="Create Your First League"
            icon="pi pi-plus"
            :disabled="!canCreateLeague"
            @click="openCreateDrawer"
          />
        </div>
      </template>

      <template #list="{ items }">
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <LeagueCard
            v-for="league in items"
            :key="league.id"
            :league="league"
            @view="handleLeagueView"
            @edit="handleLeagueEdit"
            @delete="handleLeagueDelete"
          />
        </div>
      </template>
    </DataView>
  </div>
</template>
