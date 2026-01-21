<template>
  <div
    class="league-detail-view bg-[var(--bg-dark)] text-[var(--text-primary)] overflow-x-hidden flex-1 flex flex-col"
  >
    <!-- Background Effects -->
    <BackgroundGrid />
    <SpeedLines />

    <!-- Main Content -->
    <main class="relative z-10 flex-1 pt-24 pb-16">
      <div class="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <!-- Back Button -->
        <router-link
          to="/leagues"
          class="back-btn inline-flex items-center gap-2 text-[var(--text-secondary)] text-[0.9rem] mb-4 hover:text-[var(--cyan)] transition-colors"
        >
          <span>←</span>
          <span>Back to Leagues</span>
        </router-link>

        <!-- Loading State -->
        <div v-if="loading" class="space-y-6">
          <VrlSkeleton class="h-[300px] rounded-[12px]" />
          <VrlSkeleton class="h-[200px] rounded-[12px]" />
          <VrlSkeleton class="h-[200px] rounded-[12px]" />
        </div>

        <!-- Error State -->
        <VrlAlert v-else-if="error" type="error" title="Error">
          {{ error }}
        </VrlAlert>

        <!-- Content -->
        <template v-else-if="leagueData">
          <!-- League Header -->
          <LeagueHeader :league="leagueData.league" :stats="leagueData.stats" />

          <!-- Competitions Section -->
          <div class="competitions-section mb-8">
            <h2
              class="section-title font-[var(--font-display)] text-[1.25rem] font-semibold tracking-[1px] mb-4 flex items-center gap-3"
            >
              <span class="text-[var(--cyan)]">//</span>
              <span>COMPETITIONS</span>
            </h2>

            <!-- Empty State -->
            <div
              v-if="leagueData.competitions.length === 0"
              class="text-center py-12 bg-[var(--bg-card)] border border-[var(--border)] rounded-[8px]"
            >
              <p class="text-[var(--text-secondary)]">No competitions available</p>
            </div>

            <!-- Competition Cards -->
            <div v-else>
              <CompetitionCard
                v-for="competition in leagueData.competitions"
                :key="competition.id"
                :competition="competition"
                :league-slug="leagueData.league.slug"
              />
            </div>
          </div>
        </template>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useToast } from 'primevue/usetoast';
import { leagueService } from '@public/services/leagueService';
import type { PublicLeagueDetailResponse } from '@public/types/public';
import BackgroundGrid from '@public/components/landing/BackgroundGrid.vue';
import SpeedLines from '@public/components/landing/SpeedLines.vue';
import LeagueHeader from '@public/components/leagues/LeagueHeader.vue';
import CompetitionCard from '@public/components/leagues/CompetitionCard.vue';
import VrlAlert from '@public/components/common/alerts/VrlAlert.vue';
import VrlSkeleton from '@public/components/common/loading/VrlSkeleton.vue';

const route = useRoute();
const toast = useToast();

// State
const leagueData = ref<PublicLeagueDetailResponse | null>(null);
const loading = ref(false);
const error = ref<string | null>(null);

/**
 * Fetch league detail
 */
const fetchLeagueDetail = async () => {
  const leagueSlug = route.params.leagueSlug as string;

  if (!leagueSlug) {
    error.value = 'Invalid league';
    return;
  }

  loading.value = true;
  error.value = null;

  try {
    leagueData.value = await leagueService.getLeagueDetail(leagueSlug);
  } catch (err) {
    console.error('Failed to fetch league detail:', err);
    error.value = 'Failed to load league details. Please try again.';
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to load league details',
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
  fetchLeagueDetail();
});
</script>
