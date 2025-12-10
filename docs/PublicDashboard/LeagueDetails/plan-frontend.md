# League Detail View - Frontend Implementation Plan

**Agent**: `dev-fe-public`

## Overview

Redesign the `LeagueDetailView.vue` component to:
1. Fetch real data from the new backend API
2. Implement the new Motorsport Editorial design aesthetic
3. Show collapsible competition cards with seasons
4. Display sidebar with activity, upcoming races, and championship leaders

## Component Architecture

```
LeagueDetailView.vue
├── PageHeader (existing) - Hero section
├── StatsBar (inline) - 4 stats cards
├── Main Content (8 cols)
│   ├── Description block
│   ├── Tabs (Competitions only for now)
│   └── CompetitionCard (multiple)
│       └── SeasonRow (multiple, clickable)
└── Sidebar (4 cols)
    ├── RecentActivity
    ├── UpcomingRaces
    └── ChampionshipLeaders
```

## Step-by-Step Implementation

### Step 1: Update Types

**File**: `resources/public/js/types/public.ts`

Add new types for the API response:

```typescript
/**
 * Public League Detail Response
 */
export interface PublicLeagueDetailResponse {
  league: PublicLeagueInfo;
  stats: PublicLeagueStats;
  competitions: PublicCompetitionDetail[];
  recent_activity: PublicActivity[];
  upcoming_races: PublicUpcomingRace[];
  championship_leaders: PublicChampionshipLeader[];
}

export interface PublicLeagueInfo {
  id: number;
  name: string;
  slug: string;
  tagline: string | null;
  description: string | null;
  logo_url: string | null;
  header_image_url: string | null;
  platforms: Platform[];
  visibility: 'public' | 'unlisted';
  discord_url: string | null;
  website_url: string | null;
  twitter_handle: string | null;
  youtube_url: string | null;
  twitch_url: string | null;
  created_at: string;
}

export interface PublicLeagueStats {
  competitions_count: number;
  active_seasons_count: number;
  drivers_count: number;
}

export interface PublicCompetitionDetail {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  logo_url: string | null;
  competition_colour: string | null;
  platform: Platform;
  stats: {
    total_seasons: number;
    active_seasons: number;
    total_drivers: number;
  };
  seasons: PublicSeasonSummary[];
}

export interface PublicSeasonSummary {
  id: number;
  name: string;
  slug: string;
  car_class: string | null;
  status: 'setup' | 'active' | 'completed' | 'archived';
  stats: {
    total_drivers: number;
    active_drivers: number;
    total_rounds: number;
    completed_rounds: number;
    next_race_date: string | null;
  };
}

export interface PublicActivity {
  type: 'race_completed' | 'driver_joined' | 'season_started' | 'championship_leader';
  title: string;
  subtitle: string;
  timestamp: string;
  icon_type: 'success' | 'info' | 'warning' | 'gold' | 'purple';
}

export interface PublicUpcomingRace {
  id: number;
  track_name: string;
  season_name: string;
  competition_name: string;
  scheduled_at: string;
  drivers_registered: number;
  is_next: boolean;
}

export interface PublicChampionshipLeader {
  position: number;
  driver_name: string;
  season_name: string;
  points: number;
}
```

---

### Step 2: Update API Service

**File**: `resources/public/js/services/publicApi.ts`

Add new method:

```typescript
import type { PublicLeagueDetailResponse } from '@public/types/public';

// Inside PublicApiService class:

async fetchLeague(slug: string): Promise<PublicLeagueDetailResponse> {
  try {
    const response = await this.client.get<{ data: PublicLeagueDetailResponse }>(
      `/leagues/${slug}`
    );
    return response.data.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 404) {
        throw new Error('League not found');
      }
      const message = error.response?.data?.message || 'Failed to fetch league';
      throw new Error(message);
    }
    throw error;
  }
}
```

---

### Step 3: Create Composable

**File**: `resources/public/js/composables/usePublicLeagueDetail.ts`

```typescript
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { publicApi } from '@public/services/publicApi';
import type {
  PublicLeagueDetailResponse,
  PublicLeagueInfo,
  PublicLeagueStats,
  PublicCompetitionDetail,
  PublicActivity,
  PublicUpcomingRace,
  PublicChampionshipLeader,
} from '@public/types/public';

export function usePublicLeagueDetail() {
  const route = useRoute();
  const router = useRouter();

  // State
  const isLoading = ref(true);
  const error = ref<string | null>(null);
  const league = ref<PublicLeagueInfo | null>(null);
  const stats = ref<PublicLeagueStats | null>(null);
  const competitions = ref<PublicCompetitionDetail[]>([]);
  const recentActivity = ref<PublicActivity[]>([]);
  const upcomingRaces = ref<PublicUpcomingRace[]>([]);
  const championshipLeaders = ref<PublicChampionshipLeader[]>([]);

  // Expanded competitions state (for collapsible cards)
  const expandedCompetitions = ref<Set<number>>(new Set());

  // Computed
  const slug = computed(() => route.params.slug as string);

  const hasSocialLinks = computed(() => {
    if (!league.value) return false;
    return !!(
      league.value.discord_url ||
      league.value.twitter_handle ||
      league.value.youtube_url ||
      league.value.twitch_url ||
      league.value.website_url
    );
  });

  const totalSeasons = computed(() => {
    return competitions.value.reduce(
      (sum, comp) => sum + comp.stats.total_seasons,
      0
    );
  });

  const primaryPlatform = computed(() => {
    return league.value?.platforms[0] ?? null;
  });

  // Methods
  const fetchLeagueDetail = async () => {
    isLoading.value = true;
    error.value = null;

    try {
      const data = await publicApi.fetchLeague(slug.value);

      league.value = data.league;
      stats.value = data.stats;
      competitions.value = data.competitions;
      recentActivity.value = data.recent_activity;
      upcomingRaces.value = data.upcoming_races;
      championshipLeaders.value = data.championship_leaders;

      // Expand first competition with active seasons by default
      const firstActiveComp = data.competitions.find(
        (c) => c.stats.active_seasons > 0
      );
      if (firstActiveComp) {
        expandedCompetitions.value.add(firstActiveComp.id);
      }
    } catch (err) {
      if (err instanceof Error && err.message === 'League not found') {
        error.value = 'League not found';
      } else {
        error.value = 'Failed to load league. Please try again later.';
      }
      console.error('Failed to fetch league detail:', err);
    } finally {
      isLoading.value = false;
    }
  };

  const toggleCompetition = (competitionId: number) => {
    if (expandedCompetitions.value.has(competitionId)) {
      expandedCompetitions.value.delete(competitionId);
    } else {
      expandedCompetitions.value.add(competitionId);
    }
  };

  const isCompetitionExpanded = (competitionId: number): boolean => {
    return expandedCompetitions.value.has(competitionId);
  };

  const navigateToSeason = (seasonSlug: string) => {
    router.push(`/leagues/${slug.value}/seasons/${seasonSlug}`);
  };

  const formatRelativeTime = (timestamp: string): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const formatScheduledDate = (timestamp: string): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays <= 7) return `In ${diffDays} days`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Initialize on mount
  onMounted(() => {
    fetchLeagueDetail();
  });

  return {
    // State
    isLoading,
    error,
    league,
    stats,
    competitions,
    recentActivity,
    upcomingRaces,
    championshipLeaders,
    expandedCompetitions,

    // Computed
    slug,
    hasSocialLinks,
    totalSeasons,
    primaryPlatform,

    // Methods
    fetchLeagueDetail,
    toggleCompetition,
    isCompetitionExpanded,
    navigateToSeason,
    formatRelativeTime,
    formatScheduledDate,
  };
}
```

---

### Step 4: Redesign LeagueDetailView.vue

**File**: `resources/public/js/views/leagues/LeagueDetailView.vue`

#### Template Structure

```vue
<template>
  <div class="league-detail-page">
    <!-- Loading State -->
    <div v-if="isLoading" class="loading-container">
      <div class="loading-spinner"></div>
      <p>Loading league...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-container container-racing">
      <PhWarningCircle :size="64" weight="duotone" class="error-icon" />
      <h2>League Not Found</h2>
      <p>{{ error }}</p>
      <router-link to="/leagues" class="btn btn-primary">
        Browse All Leagues
      </router-link>
    </div>

    <!-- League Content -->
    <template v-else-if="league">
      <!-- Hero Section -->
      <section class="league-hero">
        <!-- Background with overlay -->
        <div class="league-hero-background">
          <img v-if="league.header_image_url" :src="league.header_image_url" :alt="league.name" />
          <div v-else class="league-hero-placeholder gradient-hero"></div>
          <div class="league-hero-overlay"></div>
          <div class="pattern-grid"></div>
        </div>

        <!-- Hero Content -->
        <div class="league-hero-content container-racing">
          <!-- Breadcrumbs -->
          <VrlBreadcrumbs :items="breadcrumbs" class="hero-breadcrumbs" />

          <div class="hero-main">
            <!-- Left: Logo + Info -->
            <div class="hero-info">
              <div class="league-logo-wrapper">
                <div class="league-logo">
                  <img v-if="league.logo_url" :src="league.logo_url" :alt="league.name" />
                  <span v-else class="league-logo-placeholder">{{ leagueInitials }}</span>
                </div>
                <!-- Live indicator if active seasons -->
                <div v-if="stats?.active_seasons_count" class="live-indicator">
                  <span class="live-dot"></span>
                  <span class="live-text">Live</span>
                </div>
              </div>

              <div class="league-text">
                <div class="league-meta">
                  <VrlBadge v-if="league.visibility === 'unlisted'" variant="private">
                    Unlisted
                  </VrlBadge>
                  <span class="league-created">Created {{ formatCreatedDate }}</span>
                </div>
                <h1 class="league-name">{{ league.name }}</h1>
                <p v-if="league.tagline" class="league-tagline">{{ league.tagline }}</p>
              </div>
            </div>

            <!-- Right: Social Links (desktop) -->
            <div v-if="hasSocialLinks" class="hero-social hide-mobile">
              <SocialLinks :league="league" />
            </div>
          </div>
        </div>
      </section>

      <!-- Stats Bar -->
      <section class="stats-section">
        <div class="container-racing">
          <div class="stats-grid">
            <StatsCard icon="flag-checkered" :value="stats?.competitions_count ?? 0" label="Competitions" />
            <StatsCard icon="calendar-dots" :value="stats?.active_seasons_count ?? 0" label="Active Seasons" />
            <StatsCard icon="users" :value="stats?.drivers_count ?? 0" label="Drivers" highlight />
            <StatsCard icon="game-controller" :value="primaryPlatform?.name ?? '-'" label="Platform" />
          </div>
        </div>
      </section>

      <!-- Main Content -->
      <section class="main-content section-padding">
        <div class="container-racing">
          <div class="content-grid">
            <!-- Left Column -->
            <div class="main-column">
              <!-- Description -->
              <div v-if="league.description" class="description-block racing-stripe">
                <p>{{ league.description }}</p>
              </div>

              <!-- Mobile Social Links -->
              <div v-if="hasSocialLinks" class="mobile-social hide-desktop">
                <SocialLinks :league="league" />
              </div>

              <!-- Tabs (single tab for now) -->
              <div class="tabs-container">
                <button class="tab-button active">
                  <PhFlagCheckered :size="16" />
                  Competitions
                </button>
              </div>

              <!-- Competitions Panel -->
              <div class="competitions-panel card-racing">
                <div class="panel-header">
                  <div>
                    <h2 class="panel-title">Competitions</h2>
                    <p class="panel-subtitle">
                      {{ competitions.length }} competitions with {{ totalSeasons }} total seasons
                    </p>
                  </div>
                </div>

                <!-- Competition List -->
                <div class="competitions-list">
                  <CompetitionCard
                    v-for="competition in competitions"
                    :key="competition.id"
                    :competition="competition"
                    :expanded="isCompetitionExpanded(competition.id)"
                    :league-slug="slug"
                    @toggle="toggleCompetition(competition.id)"
                    @navigate-to-season="navigateToSeason"
                  />
                </div>
              </div>
            </div>

            <!-- Sidebar -->
            <aside class="sidebar-column">
              <!-- Recent Activity -->
              <RecentActivityCard :activities="recentActivity" :format-time="formatRelativeTime" />

              <!-- Upcoming Races -->
              <UpcomingRacesCard :races="upcomingRaces" :format-date="formatScheduledDate" />

              <!-- Championship Leaders -->
              <ChampionshipLeadersCard :leaders="championshipLeaders" />
            </aside>
          </div>
        </div>
      </section>
    </template>
  </div>
</template>
```

#### Script Setup

```vue
<script setup lang="ts">
import { computed } from 'vue';
import { PhWarningCircle, PhFlagCheckered } from '@phosphor-icons/vue';
import { usePublicLeagueDetail } from '@public/composables/usePublicLeagueDetail';
import VrlBreadcrumbs from '@public/components/common/navigation/VrlBreadcrumbs.vue';
import VrlBadge from '@public/components/common/badges/VrlBadge.vue';

// Sub-components (inline or separate files)
import StatsCard from './components/StatsCard.vue';
import SocialLinks from './components/SocialLinks.vue';
import CompetitionCard from './components/CompetitionCard.vue';
import RecentActivityCard from './components/RecentActivityCard.vue';
import UpcomingRacesCard from './components/UpcomingRacesCard.vue';
import ChampionshipLeadersCard from './components/ChampionshipLeadersCard.vue';

const {
  isLoading,
  error,
  league,
  stats,
  competitions,
  recentActivity,
  upcomingRaces,
  championshipLeaders,
  slug,
  hasSocialLinks,
  totalSeasons,
  primaryPlatform,
  toggleCompetition,
  isCompetitionExpanded,
  navigateToSeason,
  formatRelativeTime,
  formatScheduledDate,
} = usePublicLeagueDetail();

// Computed
const breadcrumbs = computed(() => [
  { label: 'Leagues', to: '/leagues' },
  { label: league.value?.name ?? 'League' },
]);

const leagueInitials = computed(() => {
  if (!league.value) return '';
  return league.value.name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
});

const formatCreatedDate = computed(() => {
  if (!league.value?.created_at) return '';
  const date = new Date(league.value.created_at);
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
});
</script>
```

---

### Step 5: Create Sub-Components

Create these components in `resources/public/js/views/leagues/components/`:

#### 5.1 StatsCard.vue

```vue
<template>
  <div class="stats-card gradient-border">
    <div class="stats-card-inner">
      <div class="stats-icon">
        <component :is="iconComponent" :size="20" weight="fill" />
      </div>
      <div class="stats-content">
        <div class="stats-value" :class="{ highlight }">{{ value }}</div>
        <div class="stats-label">{{ label }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import {
  PhFlagCheckered,
  PhCalendarDots,
  PhUsers,
  PhGameController,
} from '@phosphor-icons/vue';

const props = defineProps<{
  icon: 'flag-checkered' | 'calendar-dots' | 'users' | 'game-controller';
  value: string | number;
  label: string;
  highlight?: boolean;
}>();

const iconComponent = computed(() => {
  const icons = {
    'flag-checkered': PhFlagCheckered,
    'calendar-dots': PhCalendarDots,
    'users': PhUsers,
    'game-controller': PhGameController,
  };
  return icons[props.icon];
});
</script>
```

#### 5.2 SocialLinks.vue

```vue
<template>
  <div class="social-links">
    <a v-if="league.discord_url" :href="league.discord_url" target="_blank" class="social-btn">
      <PhDiscordLogo :size="16" weight="fill" />
      Discord
    </a>
    <a v-if="league.twitter_handle" :href="`https://twitter.com/${league.twitter_handle}`" target="_blank" class="social-btn">
      <PhTwitterLogo :size="16" weight="fill" />
      Twitter
    </a>
    <a v-if="league.youtube_url" :href="league.youtube_url" target="_blank" class="social-btn">
      <PhYoutubeLogo :size="16" weight="fill" />
      YouTube
    </a>
    <a v-if="league.twitch_url" :href="league.twitch_url" target="_blank" class="social-btn">
      <PhTwitchLogo :size="16" weight="fill" />
      Twitch
    </a>
    <a v-if="league.website_url" :href="league.website_url" target="_blank" class="social-btn">
      <PhGlobe :size="16" />
      Website
    </a>
  </div>
</template>

<script setup lang="ts">
import {
  PhDiscordLogo,
  PhTwitterLogo,
  PhYoutubeLogo,
  PhTwitchLogo,
  PhGlobe,
} from '@phosphor-icons/vue';
import type { PublicLeagueInfo } from '@public/types/public';

defineProps<{
  league: PublicLeagueInfo;
}>();
</script>
```

#### 5.3 CompetitionCard.vue

```vue
<template>
  <div class="competition-card" :class="{ expanded }">
    <!-- Header (clickable) -->
    <div class="competition-header" @click="$emit('toggle')">
      <div class="competition-logo" :style="logoStyle">
        <img v-if="competition.logo_url" :src="competition.logo_url" :alt="competition.name" />
        <span v-else class="logo-text">{{ competitionInitials }}</span>
      </div>

      <div class="competition-info">
        <div class="competition-title-row">
          <h3 class="competition-name">{{ competition.name }}</h3>
          <VrlBadge v-if="competition.stats.active_seasons > 0" variant="active">
            {{ competition.stats.active_seasons }} Active
          </VrlBadge>
        </div>
        <p v-if="competition.description" class="competition-description">
          {{ competition.description }}
        </p>
      </div>

      <div class="competition-stats">
        <div class="stat">
          <span class="stat-value">{{ competition.stats.total_seasons }}</span>
          <span class="stat-label">Seasons</span>
        </div>
      </div>

      <PhCaretDown :size="20" class="chevron" />
    </div>

    <!-- Seasons Panel (collapsible) -->
    <div class="seasons-panel" :class="{ expanded }">
      <div class="seasons-list">
        <div
          v-for="season in competition.seasons"
          :key="season.id"
          class="season-row"
          @click="$emit('navigate-to-season', season.slug)"
        >
          <div class="season-status-icon" :class="statusClass(season.status)">
            <PhPlay v-if="season.status === 'active'" :size="16" weight="fill" />
            <PhCheck v-else-if="season.status === 'completed'" :size="16" />
            <PhClock v-else :size="16" />
          </div>

          <div class="season-info">
            <div class="season-name">{{ season.name }}</div>
            <div class="season-meta">
              <template v-if="season.status === 'active'">
                Round {{ season.stats.completed_rounds }} of {{ season.stats.total_rounds }}
                <span v-if="season.stats.next_race_date">
                  • Next race {{ formatNextRace(season.stats.next_race_date) }}
                </span>
              </template>
              <template v-else>
                {{ season.stats.total_rounds }} rounds completed • {{ season.stats.total_drivers }} drivers
              </template>
            </div>
          </div>

          <VrlBadge :variant="statusVariant(season.status)">
            {{ season.status }}
          </VrlBadge>

          <PhArrowRight :size="16" class="arrow" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { PhCaretDown, PhPlay, PhCheck, PhClock, PhArrowRight } from '@phosphor-icons/vue';
import VrlBadge from '@public/components/common/badges/VrlBadge.vue';
import type { PublicCompetitionDetail } from '@public/types/public';
import { parseRGBColor, rgbToCss } from '@public/types/public';

const props = defineProps<{
  competition: PublicCompetitionDetail;
  expanded: boolean;
  leagueSlug: string;
}>();

defineEmits<{
  toggle: [];
  'navigate-to-season': [slug: string];
}>();

const competitionInitials = computed(() => {
  return props.competition.name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 3)
    .toUpperCase();
});

const logoStyle = computed(() => {
  const color = parseRGBColor(props.competition.competition_colour);
  if (!color) return {};
  return {
    background: `linear-gradient(135deg, ${rgbToCss(color)}, ${rgbToCss({ r: color.r * 0.7, g: color.g * 0.7, b: color.b * 0.7 })})`,
  };
});

const statusClass = (status: string) => ({
  'status-active': status === 'active',
  'status-completed': status === 'completed',
  'status-setup': status === 'setup',
  'status-archived': status === 'archived',
});

const statusVariant = (status: string) => {
  const variants: Record<string, string> = {
    active: 'active',
    completed: 'completed',
    setup: 'upcoming',
    archived: 'private',
  };
  return variants[status] ?? 'default';
};

const formatNextRace = (date: string) => {
  const d = new Date(date);
  const now = new Date();
  const diffDays = Math.floor((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays <= 0) return 'today';
  if (diffDays === 1) return 'tomorrow';
  return `in ${diffDays} days`;
};
</script>
```

#### 5.4 RecentActivityCard.vue

```vue
<template>
  <div class="sidebar-card card-racing">
    <div class="sidebar-card-header">
      <PhClockCounterClockwise :size="18" class="header-icon" />
      <h3>Recent Activity</h3>
    </div>
    <div class="activity-list">
      <div v-for="(activity, index) in activities" :key="index" class="activity-item">
        <div class="activity-icon" :class="`icon-${activity.icon_type}`">
          <PhFlagCheckered v-if="activity.type === 'race_completed'" :size="14" weight="fill" />
          <PhUserPlus v-else-if="activity.type === 'driver_joined'" :size="14" />
          <PhCalendarPlus v-else-if="activity.type === 'season_started'" :size="14" />
          <PhTrophy v-else :size="14" weight="fill" />
        </div>
        <div class="activity-content">
          <div class="activity-title">{{ activity.title }}</div>
          <div class="activity-subtitle">{{ activity.subtitle }}</div>
        </div>
        <span class="activity-time">{{ formatTime(activity.timestamp) }}</span>
      </div>
    </div>
    <button v-if="activities.length > 0" class="view-all-btn">
      View All Activity
    </button>
  </div>
</template>

<script setup lang="ts">
import {
  PhClockCounterClockwise,
  PhFlagCheckered,
  PhUserPlus,
  PhCalendarPlus,
  PhTrophy,
} from '@phosphor-icons/vue';
import type { PublicActivity } from '@public/types/public';

defineProps<{
  activities: PublicActivity[];
  formatTime: (timestamp: string) => string;
}>();
</script>
```

#### 5.5 UpcomingRacesCard.vue

```vue
<template>
  <div class="sidebar-card card-racing">
    <div class="sidebar-card-header">
      <PhCalendar :size="18" class="header-icon" />
      <h3>Upcoming Races</h3>
    </div>
    <div class="races-list">
      <div
        v-for="race in races"
        :key="race.id"
        class="race-item"
        :class="{ 'is-next': race.is_next }"
      >
        <div class="race-header">
          <span class="race-track">{{ race.track_name }}</span>
          <span class="race-date" :class="{ highlight: race.is_next }">
            {{ formatDate(race.scheduled_at) }}
          </span>
        </div>
        <div class="race-meta">{{ race.competition_name }} • {{ race.season_name }}</div>
        <div v-if="race.is_next" class="race-drivers">
          <span class="drivers-count">{{ race.drivers_registered }} drivers registered</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { PhCalendar } from '@phosphor-icons/vue';
import type { PublicUpcomingRace } from '@public/types/public';

defineProps<{
  races: PublicUpcomingRace[];
  formatDate: (timestamp: string) => string;
}>();
</script>
```

#### 5.6 ChampionshipLeadersCard.vue

```vue
<template>
  <div class="sidebar-card card-racing">
    <div class="sidebar-card-header">
      <PhTrophy :size="18" weight="fill" class="header-icon" />
      <h3>Championship Leaders</h3>
    </div>
    <div class="leaders-list">
      <div
        v-for="leader in leaders"
        :key="`${leader.season_name}-${leader.position}`"
        class="leader-row"
      >
        <span class="position" :class="positionClass(leader.position)">
          {{ leader.position }}
        </span>
        <div class="leader-info">
          <div class="driver-name">{{ leader.driver_name }}</div>
          <div class="season-name">{{ leader.season_name }}</div>
        </div>
        <span class="points" :class="{ 'is-leader': leader.position === 1 }">
          {{ leader.points }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { PhTrophy } from '@phosphor-icons/vue';
import type { PublicChampionshipLeader } from '@public/types/public';

defineProps<{
  leaders: PublicChampionshipLeader[];
}>();

const positionClass = (position: number) => ({
  'position-1': position === 1,
  'position-2': position === 2,
  'position-3': position === 3,
});
</script>
```

---

### Step 6: Add Styles

The main `LeagueDetailView.vue` should include comprehensive scoped styles following the design system:

**Key styling areas:**
- Hero section with gradient overlays
- Stats bar with gradient-border cards
- Competition cards with expand/collapse animation
- Season rows with hover effects
- Sidebar cards with consistent styling
- Responsive breakpoints (mobile-first)

Reference the design system from:
- `.claude/guides/design/app-public/league-detail.html`
- Existing CSS variables in `resources/public/css/app.css`

---

## File Summary

| File | Action | Description |
|------|--------|-------------|
| `resources/public/js/types/public.ts` | Modify | Add new response types |
| `resources/public/js/services/publicApi.ts` | Modify | Add `fetchLeague()` method |
| `resources/public/js/composables/usePublicLeagueDetail.ts` | Create | Data fetching composable |
| `resources/public/js/views/leagues/LeagueDetailView.vue` | Modify | Complete redesign |
| `resources/public/js/views/leagues/components/StatsCard.vue` | Create | Stats display card |
| `resources/public/js/views/leagues/components/SocialLinks.vue` | Create | Social links component |
| `resources/public/js/views/leagues/components/CompetitionCard.vue` | Create | Collapsible competition |
| `resources/public/js/views/leagues/components/RecentActivityCard.vue` | Create | Activity sidebar |
| `resources/public/js/views/leagues/components/UpcomingRacesCard.vue` | Create | Races sidebar |
| `resources/public/js/views/leagues/components/ChampionshipLeadersCard.vue` | Create | Leaders sidebar |

---

## Testing

### Unit Tests (Vitest)

1. **usePublicLeagueDetail.test.ts**
   - `it('fetches league data on mount')`
   - `it('handles API errors gracefully')`
   - `it('toggles competition expansion')`
   - `it('formats dates correctly')`

2. **CompetitionCard.test.ts**
   - `it('renders competition name and stats')`
   - `it('expands/collapses on click')`
   - `it('emits navigate event on season click')`

3. **LeagueDetailView.test.ts**
   - `it('shows loading state initially')`
   - `it('displays league info after load')`
   - `it('shows error state on API failure')`
   - `it('navigates to season on click')`

### E2E Tests (Playwright)

1. **league-detail.spec.ts**
   - Navigate to league detail from list
   - Verify hero section displays correctly
   - Expand/collapse competition cards
   - Click through to season detail
   - Test mobile responsive layout

---

## Responsive Design Notes

### Breakpoints
- **Mobile**: < 768px - Single column, stacked layout
- **Tablet**: 768px - 1023px - 2 column with narrower sidebar
- **Desktop**: >= 1024px - Full 8/4 column layout

### Mobile Specific
- Social links move below description
- Stats bar becomes 2x2 grid
- Sidebar moves below main content
- Competition cards full width

---

## Accessibility

- Keyboard navigation for competition expand/collapse
- ARIA labels for interactive elements
- Focus management when expanding competitions
- Proper heading hierarchy (h1 > h2 > h3)
- Alt text for images
