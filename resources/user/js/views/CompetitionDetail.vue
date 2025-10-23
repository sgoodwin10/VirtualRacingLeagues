<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useToast } from 'primevue/usetoast';
import { useCompetitionStore } from '@user/stores/competitionStore';
import type { Competition } from '@user/types/competition';

import Button from 'primevue/button';
import Skeleton from 'primevue/skeleton';
import Message from 'primevue/message';
import Tabs from 'primevue/tabs';
import TabList from 'primevue/tablist';
import Tab from 'primevue/tab';
import TabPanels from 'primevue/tabpanels';
import TabPanel from 'primevue/tabpanel';
import Card from 'primevue/card';

import CompetitionHeader from '@user/components/competition/CompetitionHeader.vue';
import CompetitionSettings from '@user/components/competition/CompetitionSettings.vue';
import CompetitionFormDrawer from '@user/components/competition/CompetitionFormDrawer.vue';
import Breadcrumbs, { type BreadcrumbItem } from '@user/components/common/Breadcrumbs.vue';

const route = useRoute();
const router = useRouter();
const toast = useToast();
const competitionStore = useCompetitionStore();

const competition = ref<Competition | null>(null);
const isLoading = ref(true);
const error = ref<string | null>(null);
const activeTab = ref('seasons');
const showEditDrawer = ref(false);

const leagueId = computed(() => parseInt(route.params.leagueId as string, 10));
const competitionId = computed(() => parseInt(route.params.competitionId as string, 10));

onMounted(async () => {
  await loadCompetition();
});

async function loadCompetition(): Promise<void> {
  isLoading.value = true;
  error.value = null;

  try {
    competition.value = await competitionStore.fetchCompetition(competitionId.value);
  } catch {
    error.value = 'Failed to load competition';
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to load competition',
      life: 5000,
    });
  } finally {
    isLoading.value = false;
  }
}

function handleEdit(): void {
  showEditDrawer.value = true;
}

function handleBackToLeague(): void {
  router.push({ name: 'league-detail', params: { id: leagueId.value } });
}

function handleCompetitionUpdated(updated: Competition): void {
  competition.value = updated;
}

function handleArchived(): void {
  loadCompetition();
}

function handleDeleted(): void {
  toast.add({
    severity: 'success',
    summary: 'Competition Deleted',
    detail: 'Redirecting to league dashboard...',
    life: 3000,
  });

  setTimeout(() => {
    handleBackToLeague();
  }, 1500);
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
    label: competition.value?.league?.name || 'League',
    to: { name: 'league-detail', params: { id: leagueId.value } },
  },
  {
    label: competition.value?.name || 'Competition Details',
  },
]);
</script>

<template>
  <div class="max-w-7xl mx-auto p-6">
    <!-- Loading skeleton -->
    <Skeleton v-if="isLoading" height="30rem" />

    <!-- Error state -->
    <Message v-else-if="error" severity="error">
      {{ error }}
    </Message>

    <!-- Competition content -->
    <div v-else-if="competition">
      <!-- Breadcrumbs -->
      <Breadcrumbs :items="breadcrumbItems" class="mb-4" />

      <!-- Archived banner -->
      <Message v-if="competition.is_archived" severity="warn" :closable="false" class="mb-4">
        <div class="flex items-center justify-between">
          <span> <strong>Archived Competition</strong> - This competition is read-only. </span>
          <span class="text-sm text-gray-600">(Restore coming in next update)</span>
        </div>
      </Message>

      <!-- Header -->
      <CompetitionHeader
        :competition="competition"
        @edit="handleEdit"
        @back-to-league="handleBackToLeague"
      />

      <!-- Tabs -->
      <Tabs v-model:value="activeTab">
        <TabList>
          <Tab value="seasons">Seasons</Tab>
          <Tab value="settings">Settings</Tab>
        </TabList>

        <TabPanels>

          <TabPanel value="seasons">
            <Message severity="info">Season management coming in next update</Message>
            <Card>
              <template #content>
                <div class="text-center py-8">
                  <i class="pi pi-flag text-6xl text-gray-400 mb-4"></i>
                  <h3 class="text-xl font-semibold mb-2">Ready to Race?</h3>
                  <p class="text-gray-600 mb-4">
                    Create your first season to start organizing races.
                  </p>
                  <Button label="Create First Season" disabled />
                  <p class="text-sm text-gray-500 mt-2">(Season feature coming soon)</p>
                </div>
              </template>
            </Card>
          </TabPanel>


          <TabPanel value="settings">
            <CompetitionSettings
              :competition="competition"
              @updated="loadCompetition"
              @archived="handleArchived"
              @deleted="handleDeleted"
            />
          </TabPanel>
        </TabPanels>
      </Tabs>

      <!-- Edit Drawer -->
      <CompetitionFormDrawer
        v-model:visible="showEditDrawer"
        :league-id="leagueId"
        :competition="competition"
        is-edit-mode
        @competition-saved="handleCompetitionUpdated"
      />
    </div>
  </div>
</template>
