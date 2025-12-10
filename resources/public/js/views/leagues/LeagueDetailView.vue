<template>
  <div class="league-detail-page">
    <!-- Loading State -->
    <template v-if="isLoading">
      <!-- Header Skeleton -->
      <div class="page-header-skeleton">
        <div class="skeleton-image"></div>
        <div class="container-racing">
          <div class="skeleton-header-content">
            <div class="skeleton-label"></div>
            <div class="skeleton-title"></div>
            <div class="skeleton-description"></div>
          </div>
        </div>
      </div>

      <!-- Stats Skeleton -->
      <section class="stats-section">
        <div class="container-racing">
          <div class="stats-grid">
            <div v-for="n in 4" :key="n" class="skeleton-stat"></div>
          </div>
        </div>
      </section>

      <!-- Breadcrumbs Skeleton -->
      <section class="breadcrumbs-section">
        <div class="container-racing py-4">
          <div class="skeleton-breadcrumb"></div>
        </div>
      </section>

      <!-- Content Skeleton -->
      <section class="content-section section-padding">
        <div class="container-racing">
          <div class="grid grid-cols-12 gap-6 md:gap-8">
            <div class="col-span-12 lg:col-span-8 space-y-4 md:space-y-6">
              <div class="skeleton-card"></div>
              <div class="skeleton-card tall"></div>
            </div>
            <div class="col-span-12 lg:col-span-4 space-y-4 md:space-y-6">
              <div class="skeleton-card"></div>
              <div class="skeleton-card"></div>
              <div class="skeleton-card"></div>
            </div>
          </div>
        </div>
      </section>
    </template>

    <!-- Error State -->
    <div v-else-if="error" class="error-container">
      <PhWarningCircle :size="64" weight="duotone" class="text-racing-danger mb-4" />
      <h2 class="font-display text-2xl text-racing-pit-white uppercase tracking-wide mb-2">
        League Not Found
      </h2>
      <p class="font-body text-racing-barrier mb-6">{{ error }}</p>
      <VrlButton variant="primary" size="md" @click="$router.push('/leagues')">
        Browse All Leagues
      </VrlButton>
    </div>

    <!-- League Content -->
    <template v-else-if="league">
      <!-- Page Header -->
      <PageHeader
        :label="league.visibility === 'public' ? 'Public League' : 'Private League'"
        :title="league.name"
        :description="league.tagline || undefined"
        :background-image="league.header_image_url || undefined"
        :logo-url="league.logo_url || undefined"
      >
        <template #social-links>
          <div v-if="hasSocialLinks" class="social-links">
            <a
              v-if="league.discord_url"
              :href="league.discord_url"
              target="_blank"
              rel="noopener noreferrer"
              class="social-btn"
            >
              <PhDiscordLogo :size="14" weight="fill" />
              Discord
            </a>
            <a
              v-if="league.twitter_handle"
              :href="`https://twitter.com/${league.twitter_handle}`"
              target="_blank"
              rel="noopener noreferrer"
              class="social-btn"
            >
              <PhTwitterLogo :size="14" weight="fill" />
              Twitter
            </a>
            <a
              v-if="league.youtube_url"
              :href="league.youtube_url"
              target="_blank"
              rel="noopener noreferrer"
              class="social-btn"
            >
              <PhYoutubeLogo :size="14" weight="fill" />
              YouTube
            </a>
            <a
              v-if="league.twitch_url"
              :href="league.twitch_url"
              target="_blank"
              rel="noopener noreferrer"
              class="social-btn"
            >
              <PhTwitchLogo :size="14" weight="fill" />
              Twitch
            </a>
            <a
              v-if="league.website_url"
              :href="league.website_url"
              target="_blank"
              rel="noopener noreferrer"
              class="social-btn"
            >
              <PhGlobe :size="14" weight="fill" />
              Website
            </a>
          </div>
        </template>
      </PageHeader>

      <!-- Stats Bar -->
      <section class="stats-section">
        <div class="container-racing">
          <div class="stats-grid">
            <!-- Competitions -->
            <VrlStatsCard label="Competitions" :value="stats?.competitions_count || 0">
              <template #icon>
                <PhFlagCheckered :size="20" weight="fill" class="text-racing-gold" />
              </template>
            </VrlStatsCard>

            <!-- Active Seasons -->
            <VrlStatsCard label="Active Seasons" :value="stats?.active_seasons_count || 0">
              <template #icon>
                <PhCalendarDots :size="20" weight="fill" class="text-racing-gold" />
              </template>
            </VrlStatsCard>

            <!-- Drivers -->
            <VrlStatsCard label="Drivers" :value="stats?.drivers_count || 0" :highlighted="true">
              <template #icon>
                <PhUsers :size="20" weight="fill" class="text-racing-gold" />
              </template>
            </VrlStatsCard>

            <!-- Platform -->
            <VrlStatsCard
              label="Platform"
              :value="platformsList.map((p) => p.slug.toUpperCase()).join(', ') || 'N/A'"
            >
              <template #icon>
                <PhGameController :size="20" weight="fill" class="text-racing-gold" />
              </template>
            </VrlStatsCard>
          </div>
        </div>
      </section>

      <!-- Breadcrumbs -->
      <section class="breadcrumbs-section">
        <div class="container-racing py-4">
          <VrlBreadcrumbs :items="breadcrumbItems" />
        </div>
      </section>

      <!-- Main Content -->
      <section class="content-section section-padding">
        <div class="container-racing">
          <div class="grid grid-cols-12 gap-6 md:gap-8">
            <!-- Left Column: Main Content -->
            <div class="col-span-12 lg:col-span-8 space-y-4 md:space-y-6">
              <!-- League Description -->
              <VrlCard
                v-if="league.description"
                variant="default"
                :hoverable="false"
                class="racing-stripe animate-fade-in-up"
              >
                <div class="p-4 md:p-6 pl-6 md:pl-8">
                  <p class="font-body text-base md:text-lg leading-relaxed text-racing-concrete">
                    {{ league.description }}
                  </p>
                </div>
              </VrlCard>

              <!-- Tabs Navigation -->
              <VrlTabs v-model="activeTabIndex" :tabs="tabItems" class="animate-fade-in-up">
                <!-- Tab Icons -->
                <template #icon-0>
                  <PhFlagCheckered :size="14" weight="fill" />
                </template>
                <template #icon-1>
                  <PhUsers :size="14" />
                </template>
                <template #icon-2>
                  <PhChartLine :size="14" />
                </template>

                <!-- Competitions Panel -->
                <template #tab-0>
                  <div v-if="competitions.length === 0" class="text-center py-12">
                    <PhFlagCheckered :size="48" weight="duotone" class="text-racing-gravel mb-4" />
                    <p class="font-body text-racing-barrier">No competitions available yet</p>
                  </div>
                  <div v-else class="space-y-4">
                    <!-- Competition List -->
                    <div
                      v-for="competition in competitions"
                      :key="competition.id"
                      class="competition-card rounded border border-racing-tarmac hover:border-racing-gold/30 transition-all bg-racing-asphalt"
                      :class="{ expanded: expandedCompetitions.has(competition.id) }"
                    >
                      <!-- Competition Header -->
                      <div
                        class="flex items-center gap-4 px-6 py-5 cursor-pointer"
                        @click="toggleCompetition(competition.id)"
                      >
                        <div
                          class="competition-icon w-14 h-14 flex items-center justify-center flex-shrink-0 shadow-lg rounded"
                          :style="getCompetitionGradient(competition.competition_colour)"
                        >
                          <img
                            v-if="competition.logo_url"
                            :src="competition.logo_url"
                            :alt="competition.name"
                            class="w-full h-full object-cover rounded"
                          />
                          <span v-else class="font-display text-xl text-white">
                            {{ competition.name.substring(0, 3).toUpperCase() }}
                          </span>
                        </div>

                        <div class="flex-1 min-w-0">
                          <div class="flex items-center gap-3 mb-1">
                            <h3
                              class="font-display text-lg text-racing-pit-white uppercase tracking-wide"
                            >
                              {{ competition.name }}
                            </h3>
                            <VrlBadge
                              v-if="competition.stats.active_seasons > 0"
                              variant="active"
                              :label="`${competition.stats.active_seasons} Active`"
                              :pulse="true"
                            />
                          </div>
                          <p
                            v-if="competition.description"
                            class="font-body text-sm text-racing-barrier"
                          >
                            {{ competition.description }}
                          </p>
                        </div>

                        <div class="flex items-center gap-4">
                          <div class="text-right">
                            <div class="font-display text-xl text-racing-pit-white">
                              {{ competition.seasons.length }}
                            </div>
                            <div class="font-data text-[9px] text-racing-gravel uppercase">
                              Seasons
                            </div>
                          </div>

                          <PhCaretDown
                            :size="18"
                            class="text-racing-gravel chevron transition-transform duration-300"
                            :class="{ 'rotate-180': expandedCompetitions.has(competition.id) }"
                          />
                        </div>
                      </div>

                      <!-- Seasons Panel -->
                      <div
                        class="seasons-panel bg-racing-carbon/50"
                        :class="{ expanded: expandedCompetitions.has(competition.id) }"
                      >
                        <div class="px-6 py-4 space-y-3">
                          <router-link
                            v-for="season in competition.seasons"
                            :key="season.id"
                            :to="`/leagues/${league.slug}/seasons/${season.slug}`"
                            class="flex items-center gap-4 px-4 py-3 bg-racing-asphalt/50 rounded border border-racing-tarmac hover:border-racing-gold/30 transition-all no-underline"
                          >
                            <div
                              class="w-10 h-10 rounded flex items-center justify-center"
                              :class="getSeasonIconClass(season.status)"
                            >
                              <component :is="getSeasonIcon(season.status)" :size="16" />
                            </div>
                            <div class="flex-1">
                              <div class="font-display text-base text-racing-pit-white uppercase">
                                {{ season.name }}
                              </div>
                              <div class="font-data text-xs text-racing-gravel mt-0.5">
                                {{ getSeasonSubtitle(season) }}
                              </div>
                            </div>
                            <VrlBadge
                              :variant="getSeasonBadgeVariant(season.status)"
                              :label="season.status"
                            />
                            <PhArrowRight :size="16" class="text-racing-gravel" />
                          </router-link>
                        </div>
                      </div>
                    </div>
                  </div>
                </template>

                <!-- Drivers Panel - Placeholder -->
                <template #tab-1>
                  <div class="text-center py-12">
                    <PhUsers :size="48" weight="duotone" class="text-racing-gravel mb-4" />
                    <p class="font-body text-racing-barrier">Driver roster coming soon</p>
                  </div>
                </template>

                <!-- Statistics Panel - Placeholder -->
                <template #tab-2>
                  <div class="text-center py-12">
                    <PhChartLine :size="48" weight="duotone" class="text-racing-gravel mb-4" />
                    <p class="font-body text-racing-barrier">League statistics coming soon</p>
                  </div>
                </template>
              </VrlTabs>
            </div>

            <!-- Right Column: Sidebar -->
            <div class="col-span-12 lg:col-span-4 space-y-4 md:space-y-6 animate-fade-in-up">
              <!-- Recent Activity -->
              <VrlCard variant="default" :hoverable="false">
                <template #header>
                  <div class="px-5 py-4">
                    <h3
                      class="font-display text-base text-racing-pit-white uppercase tracking-wide flex items-center gap-2"
                    >
                      <PhClockCounterClockwise :size="16" class="text-racing-gold" />
                      Recent Activity
                    </h3>
                  </div>
                </template>
                <div v-if="recentActivity.length === 0" class="p-6 text-center">
                  <PhClockCounterClockwise
                    :size="48"
                    weight="duotone"
                    class="text-racing-gravel/50 mb-3 mx-auto"
                  />
                  <p class="font-body text-sm text-racing-gravel">No recent activity to display</p>
                </div>
                <div v-else class="p-4 space-y-3">
                  <div
                    v-for="(activity, index) in recentActivity"
                    :key="index"
                    class="flex items-start gap-3 p-3 rounded hover:bg-racing-tarmac/30 transition-all"
                  >
                    <div
                      class="w-8 h-8 rounded flex items-center justify-center flex-shrink-0"
                      :class="getActivityIconClass(activity.icon_type)"
                    >
                      <component :is="getActivityIcon(activity.type)" :size="14" weight="fill" />
                    </div>
                    <div class="flex-1 min-w-0">
                      <div class="font-body text-sm text-racing-pit-white">
                        {{ activity.title }}
                      </div>
                      <div class="font-data text-xs text-racing-gravel mt-0.5">
                        {{ activity.subtitle }}
                      </div>
                    </div>
                    <span class="font-data text-[10px] text-racing-gravel">{{
                      formatTimestamp(activity.timestamp)
                    }}</span>
                  </div>
                </div>
              </VrlCard>

              <!-- Upcoming Races -->
              <VrlCard variant="default" :hoverable="false">
                <template #header>
                  <div class="px-5 py-4">
                    <h3
                      class="font-display text-base text-racing-pit-white uppercase tracking-wide flex items-center gap-2"
                    >
                      <PhCalendar :size="16" class="text-racing-gold" />
                      Upcoming Races
                    </h3>
                  </div>
                </template>
                <div v-if="upcomingRaces.length === 0" class="p-6 text-center">
                  <PhCalendar
                    :size="48"
                    weight="duotone"
                    class="text-racing-gravel/50 mb-3 mx-auto"
                  />
                  <p class="font-body text-sm text-racing-gravel">No upcoming races scheduled</p>
                </div>
                <div v-else class="p-4 space-y-3">
                  <div
                    v-for="race in upcomingRaces.slice(0, 3)"
                    :key="race.id"
                    class="p-4 rounded border"
                    :class="
                      race.is_next
                        ? 'bg-racing-gold/5 border-racing-gold/20'
                        : 'bg-racing-asphalt/50 border-racing-tarmac'
                    "
                  >
                    <div class="flex items-center justify-between mb-2">
                      <span class="font-display text-base text-racing-pit-white uppercase">
                        {{ race.track_name }}
                      </span>
                      <VrlBadge
                        v-if="race.is_next"
                        variant="featured"
                        label="Next"
                        :rounded="false"
                      />
                      <span v-else class="font-data text-[10px] text-racing-gravel">
                        {{ formatDate(race.scheduled_at) }}
                      </span>
                    </div>
                    <div class="font-data text-xs text-racing-gravel">
                      {{ race.season_name }} • {{ race.competition_name }}
                    </div>
                    <div v-if="race.drivers_registered > 0" class="flex items-center gap-2 mt-3">
                      <span class="font-data text-[10px] text-racing-gravel">
                        {{ race.drivers_registered }}
                        {{ race.drivers_registered === 1 ? 'driver' : 'drivers' }} registered
                      </span>
                    </div>
                  </div>
                </div>
              </VrlCard>

              <!-- Championship Leaders -->
              <VrlCard variant="default" :hoverable="false">
                <template #header>
                  <div class="px-5 py-4">
                    <h3
                      class="font-display text-base text-racing-pit-white uppercase tracking-wide flex items-center gap-2"
                    >
                      <PhTrophy :size="16" weight="fill" class="text-racing-gold" />
                      Championship Leaders
                    </h3>
                  </div>
                </template>
                <div v-if="championshipLeaders.length === 0" class="p-6 text-center">
                  <PhTrophy
                    :size="48"
                    weight="duotone"
                    class="text-racing-gravel/50 mb-3 mx-auto"
                  />
                  <p class="font-body text-sm text-racing-gravel">
                    No championship data available yet
                  </p>
                </div>
                <div v-else class="divide-y divide-racing-tarmac/50">
                  <div
                    v-for="leader in championshipLeaders.slice(0, 3)"
                    :key="leader.position"
                    class="data-row px-5 py-4 flex items-center gap-3"
                  >
                    <span
                      class="font-display text-2xl w-8"
                      :class="getPositionClass(leader.position)"
                    >
                      {{ leader.position }}
                    </span>
                    <div class="flex-1">
                      <div class="font-body text-sm font-semibold text-racing-pit-white">
                        {{ leader.driver_name }}
                      </div>
                      <div class="font-data text-xs text-racing-gravel">
                        {{ leader.season_name }}
                      </div>
                    </div>
                    <span
                      class="font-data text-lg font-semibold"
                      :class="leader.position === 1 ? 'text-racing-gold' : 'text-racing-pit-white'"
                    >
                      {{ leader.points }}
                    </span>
                  </div>
                </div>
              </VrlCard>
            </div>
          </div>
        </div>
      </section>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import {
  PhWarningCircle,
  PhDiscordLogo,
  PhTwitterLogo,
  PhYoutubeLogo,
  PhTwitchLogo,
  PhGlobe,
  PhFlagCheckered,
  PhCalendarDots,
  PhUsers,
  PhGameController,
  PhChartLine,
  PhCaretDown,
  PhArrowRight,
  PhClockCounterClockwise,
  PhCalendar,
  PhTrophy,
  PhPlay,
  PhCheck,
  PhClock,
  PhUserPlus,
  PhCalendarPlus,
} from '@phosphor-icons/vue';
import { usePublicLeagueDetail } from '@public/composables/usePublicLeagueDetail';
import { parseRGBColor } from '@public/types/public';
import type { RecentActivity } from '@public/types/public';
import VrlButton from '@public/components/common/buttons/VrlButton.vue';
import VrlBreadcrumbs, {
  type BreadcrumbItem,
} from '@public/components/common/navigation/VrlBreadcrumbs.vue';
import VrlStatsCard from '@public/components/common/cards/VrlStatsCard.vue';
import VrlCard from '@public/components/common/cards/VrlCard.vue';
import VrlBadge from '@public/components/common/badges/VrlBadge.vue';
import VrlTabs, { type TabItem } from '@public/components/common/navigation/VrlTabs.vue';
import PageHeader from '@public/components/common/layout/PageHeader.vue';

const route = useRoute();
const slug = route.params.slug as string;

const {
  isLoading,
  error,
  league,
  stats,
  competitions,
  recentActivity,
  upcomingRaces,
  championshipLeaders,
  hasSocialLinks,
  platformsList,
  fetchLeague,
} = usePublicLeagueDetail(slug);

// Breadcrumbs
const breadcrumbItems = computed<BreadcrumbItem[]>(() => [
  { label: 'Home', to: '/' },
  { label: 'Leagues', to: '/leagues' },
  { label: league.value?.name || 'League' },
]);

// Tabs configuration
const activeTabIndex = ref(0);

const tabItems = computed<TabItem[]>(() => [
  { label: 'Competitions', count: competitions.value.length },
  { label: 'Drivers', count: stats.value?.drivers_count || 0, disabled: true },
  { label: 'Statistics', disabled: true },
]);

// Tab change handler removed - VrlTabs component handles state internally via v-model

// Collapsible competitions
const expandedCompetitions = ref(new Set<number>());

const toggleCompetition = (id: number) => {
  if (expandedCompetitions.value.has(id)) {
    expandedCompetitions.value.delete(id);
  } else {
    expandedCompetitions.value.add(id);
  }
};

// Helper functions
const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric' }).format(date);
};

const formatTimestamp = (timestamp: string): string => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInSeconds = Math.floor(diffInMs / 1000);
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);

  if (diffInSeconds < 60) {
    return 'Just now';
  } else if (diffInMinutes < 60) {
    return `${diffInMinutes}m ago`;
  } else if (diffInHours < 24) {
    return `${diffInHours}h ago`;
  } else if (diffInDays < 7) {
    return `${diffInDays}d ago`;
  } else {
    return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(date);
  }
};

const getCompetitionGradient = (colorString: string | null): Record<string, string> => {
  const color = parseRGBColor(colorString);
  if (!color) {
    return {
      background: 'linear-gradient(135deg, #3b82f6, #1e40af)',
    };
  }
  const darkenFactor = 0.7;
  return {
    background: `linear-gradient(135deg, rgb(${color.r}, ${color.g}, ${color.b}), rgb(${Math.floor(color.r * darkenFactor)}, ${Math.floor(color.g * darkenFactor)}, ${Math.floor(color.b * darkenFactor)}))`,
  };
};

const getSeasonIcon = (status: string) => {
  switch (status) {
    case 'active':
      return PhPlay;
    case 'completed':
      return PhCheck;
    case 'setup':
      return PhClock;
    default:
      return PhCheck;
  }
};

const getSeasonIconClass = (status: string): string => {
  switch (status) {
    case 'active':
      return 'bg-racing-success/10 text-racing-success';
    case 'completed':
      return 'bg-racing-tarmac text-racing-barrier';
    case 'setup':
      return 'bg-racing-warning/10 text-racing-warning';
    default:
      return 'bg-racing-tarmac text-racing-barrier';
  }
};

const getSeasonSubtitle = (season: {
  status: string;
  stats: {
    completed_rounds: number;
    total_rounds: number;
    active_drivers: number;
    total_drivers: number;
  };
}): string => {
  if (season.status === 'active') {
    return `Round ${season.stats.completed_rounds} of ${season.stats.total_rounds} • ${season.stats.active_drivers} drivers`;
  } else if (season.status === 'completed') {
    return `${season.stats.total_rounds} races completed • ${season.stats.total_drivers} drivers`;
  } else {
    return `${season.stats.total_rounds} races scheduled`;
  }
};

const getSeasonBadgeVariant = (status: string): 'active' | 'completed' | 'upcoming' => {
  switch (status) {
    case 'active':
      return 'active';
    case 'completed':
      return 'completed';
    case 'setup':
      return 'upcoming';
    default:
      return 'completed';
  }
};

const getActivityIcon = (type: RecentActivity['type']) => {
  switch (type) {
    case 'race_completed':
      return PhFlagCheckered;
    case 'driver_joined':
      return PhUserPlus;
    case 'season_started':
      return PhCalendarPlus;
    case 'championship_leader':
      return PhTrophy;
    default:
      return PhFlagCheckered;
  }
};

const getActivityIconClass = (iconType: string): string => {
  switch (iconType) {
    case 'success':
      return 'bg-racing-success/10 text-racing-success';
    case 'info':
      return 'bg-racing-info/10 text-racing-info';
    case 'warning':
      return 'bg-racing-warning/10 text-racing-warning';
    case 'gold':
      return 'bg-racing-gold/10 text-racing-gold';
    case 'purple':
      return 'bg-racing-fastest-lap/10 text-racing-fastest-lap';
    default:
      return 'bg-racing-tarmac text-racing-barrier';
  }
};

const getPositionClass = (position: number): string => {
  if (position === 1) return 'text-racing-gold';
  if (position === 2) return 'text-[#c0c0c0]';
  if (position === 3) return 'text-[#cd7f32]';
  return 'text-racing-barrier';
};

onMounted(async () => {
  await fetchLeague();
});
</script>

<style scoped>
/* Page */
.league-detail-page {
  background: var(--color-carbon);
}

/* Breadcrumbs Section */
.breadcrumbs-section {
  background: var(--color-asphalt);
  border-bottom: 1px solid var(--color-tarmac);
}

/* Social Links */
.social-links {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-sm);
  align-items: flex-start;
}

@media (max-width: 768px) {
  .social-links {
    width: 100%;
  }
}

/* Loading Skeleton Styles */
.page-header-skeleton {
  position: relative;
  background: var(--color-asphalt);
  min-height: 320px;
}

.skeleton-image {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    90deg,
    var(--color-tarmac) 0%,
    var(--color-pit-lane) 50%,
    var(--color-tarmac) 100%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

.skeleton-header-content {
  position: relative;
  padding: var(--space-4xl) 0;
}

.skeleton-label,
.skeleton-title,
.skeleton-description,
.skeleton-breadcrumb,
.skeleton-stat,
.skeleton-card {
  background: linear-gradient(
    90deg,
    var(--color-tarmac) 0%,
    var(--color-pit-lane) 50%,
    var(--color-tarmac) 100%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: 4px;
}

.skeleton-label {
  height: 16px;
  width: 120px;
  margin-bottom: var(--space-sm);
}

.skeleton-title {
  height: 48px;
  width: 60%;
  margin-bottom: var(--space-md);
}

.skeleton-description {
  height: 20px;
  width: 40%;
}

.skeleton-breadcrumb {
  height: 20px;
  width: 200px;
}

.skeleton-stat {
  height: 100px;
  border: 1px solid var(--color-tarmac);
  border-radius: 8px;
}

.skeleton-card {
  height: 200px;
  border: 1px solid var(--color-tarmac);
  border-radius: 8px;
}

.skeleton-card.tall {
  height: 400px;
}

@keyframes shimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

/* Error State */
.error-container {
  min-height: calc(100vh - var(--header-height));
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-4xl);
  text-align: center;
  background: var(--color-carbon);
}

/* Stats Section */
.stats-section {
  background: var(--color-asphalt);
  border-bottom: 1px solid var(--color-tarmac);
  padding: var(--space-xl) 0;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-lg);
}

@media (min-width: 1024px) {
  .stats-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

/* Content Section */
.content-section {
  background: var(--color-carbon);
}

/* Social Buttons */
.social-btn {
  display: inline-flex;
  align-items: center;
  gap: var(--space-sm);
  font-family: var(--font-display);
  font-size: 0.625rem;
  text-transform: uppercase;
  letter-spacing: 0.15em;
  padding: var(--space-sm) var(--space-lg);
  background: var(--color-racing-tarmac);
  color: var(--color-racing-barrier);
  text-decoration: none;
  transition: all var(--duration-normal);
}

.social-btn:hover {
  background: var(--color-racing-gold);
  color: var(--color-racing-carbon);
}

/* Racing stripe accent */
.racing-stripe {
  position: relative;
}

.racing-stripe::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 4px;
  background: linear-gradient(180deg, var(--color-racing-gold) 0%, var(--color-racing-safety) 100%);
}

/* Competition card styling */
.competition-card {
  position: relative;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
}

.competition-card::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 3px;
  background: linear-gradient(180deg, var(--color-racing-gold) 0%, var(--color-racing-safety) 100%);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.competition-card:hover::before {
  opacity: 1;
}

.competition-card:hover {
  background: var(--color-racing-tarmac);
  transform: translateX(4px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.competition-card:hover .competition-icon {
  transform: scale(1.05);
}

.competition-icon {
  transition: transform 0.3s ease;
  position: relative;
  overflow: hidden;
}

.competition-icon::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, transparent 100%);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.competition-card:hover .competition-icon::after {
  opacity: 1;
}

/* Seasons panel */
.seasons-panel {
  max-height: 0;
  overflow: hidden;
  transition:
    max-height 0.4s ease,
    opacity 0.3s ease;
  opacity: 0;
}

.seasons-panel.expanded {
  max-height: 600px;
  opacity: 1;
}

/* Data row hover */
.data-row {
  position: relative;
  transition: all 0.2s ease;
}

.data-row::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 3px;
  background: var(--color-racing-gold);
  opacity: 0;
  transition: opacity 0.2s ease;
}

.data-row:hover::before {
  opacity: 1;
}

.data-row:hover {
  background: var(--color-racing-tarmac);
}
</style>
