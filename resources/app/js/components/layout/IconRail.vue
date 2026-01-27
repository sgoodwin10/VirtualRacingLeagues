<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useNavigationStore } from '@app/stores/navigationStore';
import { useUserStore } from '@app/stores/userStore';
import { useToast } from 'primevue/usetoast';
import { PhHouse, PhUser, PhSignOut, PhQuestion } from '@phosphor-icons/vue';
import RailItem from './RailItem.vue';
import LeagueRailItem from './LeagueRailItem.vue';
import type { Component } from 'vue';
import type { League } from '@app/types/league';

const router = useRouter();
const route = useRoute();
const navigationStore = useNavigationStore();
const userStore = useUserStore();
const toast = useToast();

interface NavItem {
  id: string;
  label: string;
  icon: Component;
  route?: string;
  action?: () => void;
}

const homeItem = computed<NavItem>(() => ({
  id: 'home',
  label: 'Home',
  icon: PhHouse,
  route: '/',
}));

const leagues = computed(() => navigationStore.leagues);
const leaguesLoading = computed(() => navigationStore.leaguesLoading);

const bottomItems = computed<NavItem[]>(() => [
  {
    id: 'profile',
    label: 'Profile',
    icon: PhUser,
    action: () => navigationStore.setProfileModal(true),
  },
  {
    id: 'help',
    label: 'Help',
    icon: PhQuestion,
    action: () => window.open('/help', '_blank', 'noopener,noreferrer'),
  },
  {
    id: 'logout',
    label: 'Logout',
    icon: PhSignOut,
    action: () => userStore.logout(),
  },
]);

function isActive(item: NavItem): boolean {
  if (!item.route) return false;
  return route.path === item.route;
}

function isLeagueActive(league: League): boolean {
  return route.path.startsWith(`/leagues/${league.id}`);
}

function handleClick(item: NavItem): void {
  if (item.action) {
    item.action();
  } else if (item.route) {
    router.push(item.route);
  }
}

function handleLeagueClick(league: League): void {
  router.push(`/leagues/${league.id}`);
}

// Helper to get the best logo URL (prioritize responsive media with thumb conversion)
function getLogoUrl(league: League): string | null {
  if (league.logo?.conversions?.thumb) {
    return league.logo.conversions.thumb;
  }
  return league.logo_url;
}

// Fetch leagues on mount
onMounted(async () => {
  try {
    await navigationStore.fetchLeagues();
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to load leagues';
    toast.add({
      severity: 'error',
      summary: 'Error Loading Leagues',
      detail: errorMessage,
      life: 5000,
    });
  }
});
</script>

<template>
  <aside class="icon-rail">
    <!-- Logo -->
    <div class="rail-logo">
      <img src="/images/logo/256.png" alt="Logo" class="logo-image" />
    </div>

    <!-- Navigation Items -->
    <nav class="rail-nav">
      <!-- Home Button -->
      <RailItem
        :icon="homeItem.icon"
        :active="isActive(homeItem)"
        :tooltip="homeItem.label"
        @click="handleClick(homeItem)"
      />

      <!-- Divider between Home and Leagues -->
      <div v-if="leagues.length > 0" class="rail-divider-small" />

      <!-- User's Leagues -->
      <LeagueRailItem
        v-for="league in leagues"
        :key="league.id"
        :logo-url="getLogoUrl(league)"
        :name="league.name"
        :active="isLeagueActive(league)"
        :tooltip="league.name"
        @click="handleLeagueClick(league)"
      />

      <!-- Loading State -->
      <div v-if="leaguesLoading && leagues.length === 0" class="rail-loading">
        <div class="loading-spinner" role="status" aria-label="Loading leagues" />
      </div>

      <!-- Empty State - No Leagues -->
      <div
        v-if="!leaguesLoading && leagues.length === 0"
        v-tooltip.right="'No leagues yet. Create one from the home page!'"
        class="rail-empty-state"
      >
        <div class="empty-icon">?</div>
      </div>

      <div class="rail-divider-small" />

      <RailItem
        v-for="item in bottomItems"
        :key="item.id"
        :icon="item.icon"
        :tooltip="item.label"
        @click="handleClick(item)"
      />
    </nav>

    <!-- Bottom Navigation Items -->
    <div class="rail-nav-bottom"></div>
  </aside>
</template>

<style scoped>
.icon-rail {
  width: 64px;
  background: var(--bg-panel);
  border-right: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16px 0;
  gap: 8px;
}

.rail-logo {
  width: 48px;
  height: 48px;
  /* background: linear-gradient(135deg, var(--cyan), var(--green));
  border-radius: var(--p-content-border-radius, 6px); */
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
}

.logo-image {
  width: 28px;
  height: 28px;
  object-fit: contain;
}

.rail-nav {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
  align-items: center;
}

.rail-divider {
  width: 24px;
  height: 1px;
  background: var(--border);
  margin: 8px 0;
}

.rail-divider-small {
  width: 16px;
  height: 1px;
  background: var(--border);
  margin: 4px 0;
}

.rail-loading {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.loading-spinner {
  width: 20px;
  height: 20px;
  border: 2px solid var(--border);
  border-top-color: var(--cyan);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.rail-nav-bottom {
  margin-top: auto;
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
  align-items: center;
}

.rail-empty-state {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: help;
}

.empty-icon {
  width: 32px;
  height: 32px;
  border-radius: var(--p-content-border-radius, 6px);
  background: var(--bg-elevated);
  border: 2px dashed var(--border);
  color: var(--text-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-mono);
  font-size: 14px;
  font-weight: 600;
  opacity: 0.5;
}
</style>
