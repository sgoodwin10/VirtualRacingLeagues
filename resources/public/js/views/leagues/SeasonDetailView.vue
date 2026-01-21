<template>
  <div class="season-detail-view bg-[var(--bg-dark)] text-[var(--text-primary)] overflow-x-hidden flex-1 flex flex-col">
    <!-- Background Effects -->
    <BackgroundGrid />
    <SpeedLines />

    <!-- Main Content -->
    <main class="relative z-10 flex-1 pt-24 pb-16">
      <div class="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <!-- Loading State -->
        <div v-if="loading" class="space-y-6">
          <VrlSkeleton class="h-[100px] rounded-[12px]" />
          <VrlSkeleton class="h-[400px] rounded-[12px]" />
        </div>

        <!-- Error State -->
        <VrlAlert v-else-if="error" type="error" title="Error">
          {{ error }}
        </VrlAlert>

        <!-- Content -->
        <template v-else-if="seasonData">
          <!-- Breadcrumbs -->
          <VrlBreadcrumbs :items="breadcrumbItems" class="mb-4" />

          <!-- Page Header -->
          <div class="page-header mb-8 pt-2 flex items-center gap-4">
            <!-- League Logo -->
            <div class="league-logo-container">
              <div v-if="leagueLogoUrl" class="logo-image-wrapper">
                <img
                  :src="leagueLogoUrl"
                  :alt="`${seasonData.league.name} logo`"
                  class="w-full h-full object-contain"
                />
              </div>
              <span v-else class="league-logo-initials">{{ leagueInitials }}</span>
            </div>

            <!-- League Name -->
            <h1 class="league-name font-[var(--font-display)] text-3xl font-bold text-[var(--text-primary)]">
              {{ seasonData.league.name }}
            </h1>
          </div>

          <!-- Standings Section -->
          <div
            class="standings-section bg-[var(--bg-card)] border border-[var(--border)] rounded-[12px] overflow-hidden mb-8"
          >
            <!-- Standings Header -->
            <div
              class="standings-header p-6 bg-[var(--bg-elevated)] border-b border-[var(--border)]"
            >
            <div
              class="page-title font-[var(--font-display)] text-md font-bold tracking-[2px] mb-1 text-[var(--text-secondary)]" 
            >
              <span class="text-[var(--cyan)]">//</span>
              {{ seasonData.competition.name.toUpperCase() }} -
              {{ seasonData.season.name.toUpperCase() }}
            </div>
              <h3
                class="standings-title font-[var(--font-display)] font-semibold tracking-[0.5px]"
              >
                Championship Standings
              </h3>
            </div>

            <!-- Standings Table (handles its own loading, tabs, divisions, teams) -->
            <StandingsTable
              :season-id="seasonData.season.id"
              :league-slug="leagueSlug"
              :season-slug="seasonSlug"
            />
          </div>
        </template>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useToast } from 'primevue/usetoast';
import { leagueService } from '@public/services/leagueService';
import type { PublicSeasonDetailResponse } from '@public/types/public';
import type { BreadcrumbItem } from '@public/types/navigation';
import BackgroundGrid from '@public/components/landing/BackgroundGrid.vue';
import SpeedLines from '@public/components/landing/SpeedLines.vue';
import StandingsTable from '@public/components/leagues/StandingsTable.vue';
import VrlBreadcrumbs from '@public/components/common/navigation/VrlBreadcrumbs.vue';
import VrlAlert from '@public/components/common/alerts/VrlAlert.vue';
import VrlSkeleton from '@public/components/common/loading/VrlSkeleton.vue';

const route = useRoute();
const toast = useToast();

// Route params
const leagueSlug = route.params.leagueSlug as string;
const seasonSlug = route.params.seasonSlug as string;

// State
const seasonData = ref<PublicSeasonDetailResponse | null>(null);
const loading = ref(false);
const error = ref<string | null>(null);

/**
 * Breadcrumb items (computed based on seasonData)
 */
const breadcrumbItems = computed((): BreadcrumbItem[] => {
  if (!seasonData.value) return [];

  return [
    { label: 'Leagues', to: '/leagues' },
    { label: seasonData.value.league.name, to: `/leagues/${seasonData.value.league.slug}` },
    {
      label: `${seasonData.value.competition.name} - ${seasonData.value.season.name}`,
    },
  ];
});

/**
 * League logo URL (prefer new media object, fallback to old URL)
 */
const leagueLogoUrl = computed((): string | null => {
  if (!seasonData.value) return null;
  return seasonData.value.league.logo?.original || seasonData.value.league.logo_url || null;
});

/**
 * League initials (for fallback when no logo is available)
 */
const leagueInitials = computed((): string => {
  if (!seasonData.value) return 'L';
  const words = seasonData.value.league.name.split(' ');
  if (words.length >= 2) {
    return `${words[0]?.[0] ?? ''}${words[1]?.[0] ?? ''}`.toUpperCase();
  }
  return (seasonData.value.league.name.substring(0, 2) || 'L').toUpperCase();
});

/**
 * Fetch season detail (for header and breadcrumbs only)
 * The StandingsTable component will fetch its own data
 */
const fetchSeasonDetail = async () => {
  if (!leagueSlug || !seasonSlug) {
    error.value = 'Invalid season';
    return;
  }

  loading.value = true;
  error.value = null;

  try {
    seasonData.value = await leagueService.getSeasonDetail(leagueSlug, seasonSlug);
  } catch (err) {
    console.error('Failed to fetch season detail:', err);
    error.value = 'Failed to load season details. Please try again.';
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to load season details',
      life: 3000,
    });
  } finally {
    loading.value = false;
  }
};

/**
 * Initialize on mount
 */
onMounted(() => {
  fetchSeasonDetail();
});
</script>

<style scoped>
/* ============================================
   League Logo in Page Header
   ============================================ */

.league-logo-container {
  position: relative;
  width: 64px;
  height: 64px;
  border-radius: 8px;
  border: 2px solid var(--border);
  background: var(--bg-elevated);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  flex-shrink: 0;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.logo-image-wrapper {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  padding: 8px;
}

.league-logo-initials {
  font-family: var(--font-mono);
  font-size: 20px;
  font-weight: 700;
  color: var(--cyan);
}

.league-name {
  letter-spacing: -0.5px;
}
</style>
