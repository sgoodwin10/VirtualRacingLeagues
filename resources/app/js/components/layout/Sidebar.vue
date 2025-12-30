<script setup lang="ts">
import { computed } from 'vue';
import { useNavigationStore } from '@app/stores/navigationStore';
import { PhCalendar, PhTrophy, PhUsers, PhUsersThree, PhGear } from '@phosphor-icons/vue';
import SidebarLink from './SidebarLink.vue';

const navigationStore = useNavigationStore();

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
        navigationStore.currentSeason?.stats?.total_rounds ||
        navigationStore.currentSeason?.stats?.total_races,
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
      id: 'settings',
      to: `${basePath}/settings`,
      icon: PhGear,
      label: 'Settings',
    },
  ];
});
</script>

<template>
  <aside v-if="showSidebar" class="sidebar">
    <!-- Header -->
    <div class="sidebar-header">
      <div class="sidebar-title">
        <span class="text-primary">{{ competitionName }}</span>
      </div>
      <div class="sidebar-subtitle">{{ seasonName }}</div>
    </div>

    <!-- Navigation Sections -->
    <div class="sidebar-content">
      <!-- Navigation Links -->
      <div class="sidebar-section">
        <div class="sidebar-label">Navigation</div>
        <nav class="sidebar-nav">
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
    </div>
  </aside>
</template>

<style scoped>
.sidebar {
  width: 240px;
  background: var(--bg-panel);
  border-right: 1px solid var(--border);
  display: flex;
  flex-direction: column;
}

.sidebar-header {
  padding: 20px;
  border-bottom: 1px solid var(--border);
}

.sidebar-title {
  font-family: var(--font-mono);
  font-size: var(--font-size-xs);
  font-weight: 600;
  letter-spacing: 1px;
  text-transform: uppercase;
  color: var(--cyan);
  margin-bottom: 4px;
}

.sidebar-subtitle {
  font-size: var(--font-size-md);
  color: var(--text-secondary);
}

.sidebar-content {
  flex: 1;
  padding: 16px 0;
  overflow-y: auto;
}

.sidebar-section {
  margin-bottom: 24px;
}

.sidebar-label {
  font-family: var(--font-mono);
  font-size: var(--font-size-xs);
  font-weight: 600;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  color: var(--text-muted);
  padding: 0 20px;
  margin-bottom: 8px;
}

.sidebar-nav {
  display: flex;
  flex-direction: column;
}
</style>
