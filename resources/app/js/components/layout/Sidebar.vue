<script setup lang="ts">
import { ref, computed } from 'vue';
import { useNavigationStore } from '@app/stores/navigationStore';
import { PhCalendar, PhTrophy, PhUsers, PhUsersThree, PhGear, PhPower } from '@phosphor-icons/vue';
import SidebarLink from './SidebarLink.vue';
import SidebarButton from './SidebarButton.vue';
import SeasonFormSplitModal from '@app/components/season/modals/SeasonFormSplitModal.vue';

const navigationStore = useNavigationStore();
const showEditSeasonModal = ref(false);

const showSidebar = computed(() => navigationStore.showSidebar);
const competitionName = computed(() => navigationStore.currentCompetition?.name || 'COMPETITION');
const seasonName = computed(() => navigationStore.currentSeason?.name || 'Season');

const navigationLinks = computed(() => {
  if (!navigationStore.currentCompetition || !navigationStore.currentSeason) {
    return [];
  }

  const { leagueId, competitionId, seasonId } = navigationStore;
  const basePath = `/leagues/${leagueId}/competitions/${competitionId}/seasons/${seasonId}`;

  return [
    {
      id: 'rounds',
      to: basePath,
      icon: PhCalendar,
      label: 'Rounds',
      tag:
        navigationStore.currentSeason?.stats?.total_rounds ??
        navigationStore.currentSeason?.stats?.total_races ??
        undefined,
    },
    {
      id: 'standings',
      to: `${basePath}/standings`,
      icon: PhTrophy,
      label: 'Standings',
    },
    {
      id: 'drivers',
      to: `${basePath}/drivers`,
      icon: PhUsers,
      label: 'Drivers',
      tag: navigationStore.currentSeason?.stats?.total_drivers,
    },
    {
      id: 'divisions-teams',
      to: `${basePath}/divisions-teams`,
      icon: PhUsersThree,
      label: 'Divisions & Teams',
    },
    {
      id: 'season-status',
      to: `${basePath}/season-status`,
      icon: PhPower,
      label: 'Season Status',
    },
  ];
});

function openEditSeasonModal(): void {
  showEditSeasonModal.value = true;
}

function handleSeasonSaved(): void {
  // Modal will close automatically, we can refresh data here if needed
  showEditSeasonModal.value = false;
}
</script>

<template>
  <aside
    v-if="showSidebar"
    class="w-60 bg-[var(--bg-panel)] border-r border-[var(--border)] flex flex-col"
  >
    <!-- Header -->
    <div class="p-5 border-b border-surface-200">
      <div class="font-mono text-sm font-semibold tracking-wide uppercase text-cyan-500 mb-1">
        <span class="text-primary">{{ competitionName }}</span>
      </div>
      <div class="text-secondary text-lg">{{ seasonName }}</div>
    </div>

    <!-- Navigation Sections -->
    <div class="flex-1 py-4 overflow-y-auto">
      <!-- Navigation Links -->
      <div class="mb-6">
        <div class="font-mono text-xs font-semibold tracking-wider uppercase text-muted px-5 mb-2">
          Navigation
        </div>
        <nav class="flex flex-col">
          <SidebarLink
            v-for="link in navigationLinks"
            :key="link.id"
            :to="link.to"
            :icon="link.icon"
            :label="link.label"
            :tag="link.tag"
          />
        </nav>
      </div>

      <!-- Settings Section -->
      <div class="mb-6">
        <nav class="flex flex-col">
          <SidebarButton :icon="PhGear" label="Edit Season Settings" @click="openEditSeasonModal" />
        </nav>
      </div>
    </div>

    <!-- Edit Season Modal -->
    <SeasonFormSplitModal
      v-model:visible="showEditSeasonModal"
      :is-edit-mode="true"
      :competition-id="navigationStore.competitionId ?? 0"
      :competition-name="competitionName"
      :season="navigationStore.currentSeason"
      @season-saved="handleSeasonSaved"
    />
  </aside>
</template>
