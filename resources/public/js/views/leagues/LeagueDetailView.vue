<template>
  <div class="league-detail-page">
    <PublicHeader />

    <!-- Loading State -->
    <div v-if="loading" class="loading-container">
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
      <!-- Hero Banner -->
      <section class="league-hero">
        <div class="league-hero-background">
          <img
            v-if="league.header_image_url"
            :src="league.header_image_url"
            :alt="league.name"
            class="league-hero-image"
          />
          <div v-else class="league-hero-placeholder gradient-hero"></div>
          <div class="league-hero-overlay"></div>
        </div>

        <div class="container-racing league-hero-content">
          <div class="league-hero-info">
            <div class="league-logo">
              <img
                v-if="league.logo_url"
                :src="league.logo_url"
                :alt="league.name"
              />
              <PhFlag v-else :size="40" weight="duotone" />
            </div>

            <div class="league-info">
              <h1 class="league-name">{{ league.name }}</h1>
              <p v-if="league.tagline" class="league-tagline">{{ league.tagline }}</p>

              <div class="league-platforms">
                <span
                  v-for="platform in league.platforms"
                  :key="platform.id"
                  class="platform-tag"
                >
                  {{ platform.name }}
                </span>
              </div>
            </div>
          </div>

          <div class="league-stats-bar">
            <div class="stat-item">
              <span class="stat-value font-data">{{ league.competitions_count }}</span>
              <span class="stat-label">{{ league.competitions_count === 1 ? 'Competition' : 'Competitions' }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-value font-data">{{ league.drivers_count }}</span>
              <span class="stat-label">{{ league.drivers_count === 1 ? 'Driver' : 'Drivers' }}</span>
            </div>
            <div v-if="totalSeasons > 0" class="stat-item">
              <span class="stat-value font-data">{{ totalSeasons }}</span>
              <span class="stat-label">{{ totalSeasons === 1 ? 'Season' : 'Seasons' }}</span>
            </div>
          </div>
        </div>
      </section>

      <!-- Social Links -->
      <section v-if="hasSocialLinks" class="social-section">
        <div class="container-racing">
          <div class="social-links">
            <a
              v-if="league.discord_url"
              :href="league.discord_url"
              target="_blank"
              rel="noopener noreferrer"
              class="social-link-btn"
            >
              <PhDiscordLogo :size="20" />
              <span>Discord</span>
            </a>
            <a
              v-if="league.twitter_handle"
              :href="`https://twitter.com/${league.twitter_handle}`"
              target="_blank"
              rel="noopener noreferrer"
              class="social-link-btn"
            >
              <PhTwitterLogo :size="20" />
              <span>Twitter</span>
            </a>
            <a
              v-if="league.youtube_url"
              :href="league.youtube_url"
              target="_blank"
              rel="noopener noreferrer"
              class="social-link-btn"
            >
              <PhYoutubeLogo :size="20" />
              <span>YouTube</span>
            </a>
            <a
              v-if="league.twitch_url"
              :href="league.twitch_url"
              target="_blank"
              rel="noopener noreferrer"
              class="social-link-btn"
            >
              <PhTwitchLogo :size="20" />
              <span>Twitch</span>
            </a>
            <a
              v-if="league.website_url"
              :href="league.website_url"
              target="_blank"
              rel="noopener noreferrer"
              class="social-link-btn"
            >
              <PhGlobe :size="20" />
              <span>Website</span>
            </a>
          </div>
        </div>
      </section>

      <!-- Main Content -->
      <section class="league-content section-padding">
        <div class="container-racing">
          <!-- Description -->
          <div v-if="league.description" class="league-description racing-stripe">
            <p>{{ league.description }}</p>
          </div>

          <!-- Competitions -->
          <div class="competitions-section">
            <h2 class="section-heading">
              <PhTrophy :size="24" weight="duotone" class="section-icon" />
              Competitions
            </h2>

            <div v-if="competitions.length === 0" class="empty-competitions">
              <p>No competitions available yet.</p>
            </div>

            <div v-else class="competitions-list">
              <div
                v-for="competition in competitions"
                :key="competition.id"
                class="competition-card"
              >
                <div class="competition-header" :style="competitionStyle(competition)">
                  <div class="competition-logo">
                    <img
                      v-if="competition.logo_url"
                      :src="competition.logo_url"
                      :alt="competition.name"
                    />
                    <PhTrophy v-else :size="24" weight="duotone" />
                  </div>
                  <div class="competition-info">
                    <h3 class="competition-name">{{ competition.name }}</h3>
                    <span class="competition-platform">{{ competition.platform_name }}</span>
                  </div>
                </div>

                <div v-if="competition.description" class="competition-description">
                  <p>{{ competition.description }}</p>
                </div>

                <!-- Seasons -->
                <div class="seasons-list">
                  <router-link
                    v-for="season in competition.seasons"
                    :key="season.id"
                    :to="`/leagues/${league.slug}/seasons/${season.slug}`"
                    class="season-card"
                    :class="{ 'is-active': season.is_active }"
                  >
                    <div class="season-status">
                      <span
                        class="status-badge"
                        :class="`status-${season.status}`"
                      >
                        {{ season.status }}
                      </span>
                    </div>

                    <div class="season-info">
                      <h4 class="season-name">{{ season.name }}</h4>
                      <span v-if="season.car_class" class="season-car">{{ season.car_class }}</span>
                    </div>

                    <div class="season-stats">
                      <div class="season-stat">
                        <span class="font-data">{{ season.stats.active_drivers }}</span>
                        <span>Drivers</span>
                      </div>
                      <div class="season-stat">
                        <span class="font-data">{{ season.stats.completed_races }}/{{ season.stats.total_races }}</span>
                        <span>Races</span>
                      </div>
                    </div>

                    <PhCaretRight :size="20" class="season-arrow" />
                  </router-link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </template>

    <PublicFooter />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import {
  PhFlag,
  PhTrophy,
  PhCaretRight,
  PhDiscordLogo,
  PhTwitterLogo,
  PhYoutubeLogo,
  PhTwitchLogo,
  PhGlobe,
  PhWarningCircle,
} from '@phosphor-icons/vue';
import PublicHeader from '@public/components/layout/PublicHeader.vue';
import PublicFooter from '@public/components/layout/PublicFooter.vue';
import type { PublicLeague, PublicCompetition } from '@public/types/public';
import { parseRGBColor, rgbToCss } from '@public/types/public';

const route = useRoute();

// State
const loading = ref(true);
const error = ref<string | null>(null);
const league = ref<PublicLeague | null>(null);
const competitions = ref<PublicCompetition[]>([]);

// Computed
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
  return competitions.value.reduce((sum, comp) => sum + comp.seasons.length, 0);
});

// Methods
const competitionStyle = (competition: PublicCompetition) => {
  const color = parseRGBColor(competition.competition_colour);
  if (!color) return {};
  return {
    borderLeftColor: rgbToCss(color),
  };
};

const fetchLeagueData = async () => {
  void route.params.slug; // Will be used for API call
  loading.value = true;
  error.value = null;

  try {
    // TODO: Replace with actual API calls
    // const leagueData = await publicApi.getLeague(_slug);
    // const competitionsData = await publicApi.getLeagueCompetitions(_slug);

    // Mock data for now
    await new Promise(resolve => setTimeout(resolve, 500));

    league.value = {
      id: 1,
      name: 'GT7 Racing League',
      slug: 'gt7-racing-league',
      tagline: 'Competitive Gran Turismo 7 racing every Sunday',
      description: 'Welcome to the GT7 Racing League! We host competitive racing events every Sunday evening. All skill levels are welcome, from beginners to experienced racers. Join our Discord community to get started.',
      logo_url: null,
      header_image_url: null,
      platforms: [{ id: 1, name: 'GT7', slug: 'gt7' }],
      discord_url: 'https://discord.gg/example',
      website_url: null,
      twitter_handle: 'gt7racingleague',
      instagram_handle: null,
      youtube_url: 'https://youtube.com/@gt7racingleague',
      twitch_url: null,
      visibility: 'public',
      competitions_count: 2,
      drivers_count: 24,
    };

    competitions.value = [
      {
        id: 1,
        name: 'GT3 Championship',
        slug: 'gt3-championship',
        description: 'High-performance GT3 class racing with manufacturer variety.',
        platform_id: 1,
        platform_name: 'GT7',
        platform_slug: 'gt7',
        logo_url: null,
        competition_colour: '{"r":100,"g":102,"b":241}',
        stats: {
          total_seasons: 2,
          active_seasons: 1,
          total_drivers: 18,
        },
        seasons: [
          {
            id: 1,
            name: 'Season 3',
            slug: 'season-3',
            car_class: 'GT3',
            description: null,
            logo_url: '',
            banner_url: null,
            status: 'active',
            is_active: true,
            is_completed: false,
            race_divisions_enabled: false,
            stats: {
              total_drivers: 18,
              active_drivers: 16,
              total_races: 8,
              completed_races: 4,
            },
          },
          {
            id: 2,
            name: 'Season 2',
            slug: 'season-2',
            car_class: 'GT3',
            description: null,
            logo_url: '',
            banner_url: null,
            status: 'completed',
            is_active: false,
            is_completed: true,
            race_divisions_enabled: false,
            stats: {
              total_drivers: 16,
              active_drivers: 16,
              total_races: 8,
              completed_races: 8,
            },
          },
        ],
      },
      {
        id: 2,
        name: 'Gr.4 Cup',
        slug: 'gr4-cup',
        description: 'Entry-level racing for Gr.4 class vehicles.',
        platform_id: 1,
        platform_name: 'GT7',
        platform_slug: 'gt7',
        logo_url: null,
        competition_colour: '{"r":52,"g":211,"b":153}',
        stats: {
          total_seasons: 1,
          active_seasons: 1,
          total_drivers: 12,
        },
        seasons: [
          {
            id: 3,
            name: 'Season 1',
            slug: 'season-1',
            car_class: 'Gr.4',
            description: null,
            logo_url: '',
            banner_url: null,
            status: 'active',
            is_active: true,
            is_completed: false,
            race_divisions_enabled: true,
            stats: {
              total_drivers: 12,
              active_drivers: 12,
              total_races: 6,
              completed_races: 2,
            },
          },
        ],
      },
    ];
  } catch (e) {
    error.value = 'Unable to load league. Please try again later.';
    console.error('Failed to fetch league:', e);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchLeagueData();
});
</script>

<style scoped>
/* Loading & Error States */
.loading-container,
.error-container {
  min-height: calc(100vh - var(--header-height));
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-4xl);
  text-align: center;
  padding-top: calc(var(--header-height) + var(--space-4xl));
}

.loading-spinner {
  width: 48px;
  height: 48px;
  border: 3px solid var(--color-tarmac);
  border-top-color: var(--color-gold);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: var(--space-lg);
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.error-icon {
  color: var(--color-safety);
  margin-bottom: var(--space-lg);
}

/* League Hero */
.league-hero {
  position: relative;
  padding-top: var(--header-height);
  min-height: 400px;
  display: flex;
  align-items: flex-end;
}

.league-hero-background {
  position: absolute;
  inset: 0;
  z-index: 0;
}

.league-hero-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.league-hero-placeholder {
  width: 100%;
  height: 100%;
}

.league-hero-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    to top,
    var(--color-carbon) 0%,
    rgba(10, 10, 10, 0.8) 30%,
    rgba(10, 10, 10, 0.4) 100%
  );
}

.league-hero-content {
  position: relative;
  z-index: 1;
  padding: var(--space-3xl) 0;
}

.league-hero-info {
  display: flex;
  align-items: flex-start;
  gap: var(--space-xl);
  margin-bottom: var(--space-xl);
}

.league-logo {
  width: 100px;
  height: 100px;
  background: var(--color-asphalt);
  border: 2px solid var(--color-tarmac);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  overflow: hidden;
}

.league-logo img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.league-logo svg {
  color: var(--color-gold);
}

.league-name {
  font-size: clamp(1.75rem, 4vw, 2.5rem);
  margin-bottom: var(--space-sm);
}

.league-tagline {
  font-size: 1rem;
  color: var(--color-barrier);
  margin-bottom: var(--space-md);
}

.league-platforms {
  display: flex;
  gap: var(--space-sm);
}

.platform-tag {
  font-family: var(--font-display);
  font-size: 0.625rem;
  text-transform: uppercase;
  letter-spacing: 0.15em;
  padding: var(--space-xs) var(--space-md);
  background: var(--color-gold);
  color: var(--color-carbon);
}

/* Stats Bar */
.league-stats-bar {
  display: flex;
  gap: var(--space-2xl);
  padding-top: var(--space-xl);
  border-top: 1px solid var(--color-tarmac);
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--color-pit-white);
}

.stat-label {
  font-size: 0.75rem;
  color: var(--color-barrier);
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

/* Social Section */
.social-section {
  background: var(--color-asphalt);
  padding: var(--space-lg) 0;
  border-bottom: 1px solid var(--color-tarmac);
}

.social-links {
  display: flex;
  gap: var(--space-md);
  flex-wrap: wrap;
}

.social-link-btn {
  display: inline-flex;
  align-items: center;
  gap: var(--space-sm);
  font-family: var(--font-display);
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  padding: var(--space-sm) var(--space-lg);
  background: var(--color-tarmac);
  color: var(--color-barrier);
  text-decoration: none;
  transition: all var(--duration-fast);
}

.social-link-btn:hover {
  background: var(--color-gold);
  color: var(--color-carbon);
}

/* League Content */
.league-content {
  background: var(--color-carbon);
}

.league-description {
  padding: var(--space-xl);
  padding-left: calc(var(--space-xl) + 4px);
  background: var(--color-asphalt);
  margin-bottom: var(--space-3xl);
}

.league-description p {
  color: var(--color-concrete);
  line-height: 1.8;
}

/* Section Heading */
.section-heading {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  font-size: 1.25rem;
  margin-bottom: var(--space-xl);
}

.section-icon {
  color: var(--color-gold);
}

/* Competitions */
.competitions-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-xl);
}

.competition-card {
  background: var(--color-asphalt);
  border: 1px solid var(--color-tarmac);
}

.competition-header {
  display: flex;
  align-items: center;
  gap: var(--space-lg);
  padding: var(--space-lg);
  border-left: 4px solid var(--color-gold);
  background: rgba(0, 0, 0, 0.2);
}

.competition-logo {
  width: 48px;
  height: 48px;
  background: var(--color-tarmac);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  overflow: hidden;
}

.competition-logo img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.competition-logo svg {
  color: var(--color-barrier);
}

.competition-name {
  font-size: 1rem;
  margin-bottom: var(--space-xs);
}

.competition-platform {
  font-family: var(--font-data);
  font-size: 0.75rem;
  color: var(--color-barrier);
}

.competition-description {
  padding: var(--space-lg);
  border-bottom: 1px solid var(--color-tarmac);
}

.competition-description p {
  font-size: 0.875rem;
  color: var(--color-barrier);
}

/* Seasons List */
.seasons-list {
  display: flex;
  flex-direction: column;
}

.season-card {
  display: flex;
  align-items: center;
  gap: var(--space-lg);
  padding: var(--space-lg);
  text-decoration: none;
  border-bottom: 1px solid var(--color-tarmac);
  transition: all var(--duration-fast);
}

.season-card:last-child {
  border-bottom: none;
}

.season-card:hover {
  background: rgba(212, 168, 83, 0.05);
}

.season-card.is-active {
  border-left: 3px solid var(--color-gold);
  margin-left: -1px;
}

.season-status {
  flex-shrink: 0;
}

.status-badge {
  font-family: var(--font-display);
  font-size: 0.5rem;
  text-transform: uppercase;
  letter-spacing: 0.15em;
  padding: var(--space-xs) var(--space-sm);
  background: var(--color-tarmac);
  color: var(--color-barrier);
}

.status-badge.status-active {
  background: rgba(212, 168, 83, 0.2);
  color: var(--color-gold);
}

.status-badge.status-completed {
  background: rgba(52, 211, 153, 0.2);
  color: #34d399;
}

.status-badge.status-setup {
  background: rgba(96, 165, 250, 0.2);
  color: #60a5fa;
}

.status-badge.status-archived {
  background: rgba(107, 114, 128, 0.2);
  color: var(--color-gravel);
}

.season-info {
  flex: 1;
  min-width: 0;
}

.season-name {
  font-family: var(--font-body);
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-pit-white);
  margin-bottom: var(--space-xs);
}

.season-car {
  font-family: var(--font-data);
  font-size: 0.75rem;
  color: var(--color-barrier);
}

.season-stats {
  display: flex;
  gap: var(--space-xl);
  flex-shrink: 0;
}

.season-stat {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
  font-size: 0.75rem;
  color: var(--color-barrier);
}

.season-stat span:first-child {
  color: var(--color-pit-white);
  font-weight: 600;
}

.season-arrow {
  color: var(--color-barrier);
  flex-shrink: 0;
  transition: transform var(--duration-fast);
}

.season-card:hover .season-arrow {
  transform: translateX(4px);
  color: var(--color-gold);
}

.empty-competitions {
  text-align: center;
  padding: var(--space-3xl);
  color: var(--color-barrier);
}

/* Responsive */
@media (max-width: 768px) {
  .league-hero-info {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }

  .league-stats-bar {
    justify-content: center;
  }

  .season-card {
    flex-wrap: wrap;
  }

  .season-stats {
    width: 100%;
    justify-content: flex-start;
    margin-top: var(--space-sm);
  }

  .season-arrow {
    display: none;
  }
}
</style>
