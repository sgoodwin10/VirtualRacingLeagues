<template>
  <div class="landing-page">
    <!-- Hero Section -->
    <section class="hero gradient-hero">
      <div class="hero-background">
        <div class="pattern-stripes absolute inset-0 opacity-50"></div>
        <div class="racing-line"></div>
        <div class="racing-line" style="top: 30%; animation-delay: 1s"></div>
        <div class="racing-line" style="top: 70%; animation-delay: 2s"></div>
      </div>

      <div class="container-racing">
        <div class="hero-content animate-fade-in-up">
          <div class="hero-tagline">
            <span>Sim Racing League Management</span>
          </div>

          <VrlHeading :level="1" variant="hero" class="hero-title">
            Setup. Race.
            <span class="highlight">Share.</span>
          </VrlHeading>

          <p class="hero-description">
            The complete platform for sim racing league managers. Create competitions, track
            results, and share standings with your community in minutes.
          </p>

          <div class="hero-cta">
            <VrlButton variant="primary" size="lg" @click="navigateTo('/register')">
              Get Started Free
            </VrlButton>
            <VrlButton variant="secondary" size="lg" @click="navigateTo('/leagues')">
              Browse Leagues
            </VrlButton>
          </div>

          <div class="hero-stats">
            <div class="hero-stat">
              <span class="hero-stat-value font-display">GT7</span>
              <VrlLabel class="hero-stat-label">Platform Support</VrlLabel>
            </div>
            <div class="hero-stat">
              <span class="hero-stat-value font-display">100%</span>
              <VrlLabel class="hero-stat-label">Free to Use</VrlLabel>
            </div>
            <div class="hero-stat">
              <span class="hero-stat-value font-display">Live</span>
              <VrlLabel class="hero-stat-label">Standings</VrlLabel>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- How It Works Section -->
    <section class="section-padding" style="background: var(--color-asphalt)">
      <div class="container-racing">
        <div class="section-header">
          <VrlLabel class="section-label">How It Works</VrlLabel>
          <VrlHeading :level="2" variant="section" class="section-title">
            Four Simple Steps
          </VrlHeading>
        </div>

        <div class="steps-grid">
          <VrlCard
            variant="default"
            :hoverable="false"
            class="step-card animate-fade-in-up animate-delay-1"
          >
            <div class="step-number">01</div>
            <div class="step-content">
              <VrlHeading :level="3" variant="card" class="step-title">
                Create Your League
              </VrlHeading>
              <p class="step-description">
                Set up your league with custom branding, invite your drivers, and configure your
                settings.
              </p>
            </div>
          </VrlCard>

          <VrlCard
            variant="default"
            :hoverable="false"
            class="step-card animate-fade-in-up animate-delay-2"
          >
            <div class="step-number">02</div>
            <div class="step-content">
              <VrlHeading :level="3" variant="card" class="step-title">
                Build Competitions
              </VrlHeading>
              <p class="step-description">
                Create seasons with rounds, races, qualifying sessions, and custom points systems.
              </p>
            </div>
          </VrlCard>

          <VrlCard
            variant="default"
            :hoverable="false"
            class="step-card animate-fade-in-up animate-delay-3"
          >
            <div class="step-number">03</div>
            <div class="step-content">
              <VrlHeading :level="3" variant="card" class="step-title"> Enter Results </VrlHeading>
              <p class="step-description">
                Record race times, positions, penalties, fastest laps, and DNF/DNS statuses.
              </p>
            </div>
          </VrlCard>

          <VrlCard
            variant="default"
            :hoverable="false"
            class="step-card animate-fade-in-up animate-delay-4"
          >
            <div class="step-number">04</div>
            <div class="step-content">
              <VrlHeading :level="3" variant="card" class="step-title">
                Share With Everyone
              </VrlHeading>
              <p class="step-description">
                Generate a public link for your community to view live standings and results.
              </p>
            </div>
          </VrlCard>
        </div>
      </div>
    </section>

    <!-- Features Section -->
    <section class="section-padding pattern-carbon">
      <div class="container-racing">
        <div class="section-header">
          <VrlLabel class="section-label">Features</VrlLabel>
          <VrlHeading :level="2" variant="section" class="section-title">
            Everything You Need
          </VrlHeading>
        </div>

        <div class="feature-grid">
          <VrlCard variant="feature" class="p-4 sm:p-6">
            <template #icon>
              <PhFlag :size="26" weight="duotone" class="text-racing-gold" />
            </template>
            <VrlHeading :level="3" variant="card" class="feature-title">
              Leagues & Competitions
            </VrlHeading>
            <p class="feature-description">
              Organize multiple competitions and seasons under a single league. Perfect for running
              parallel championships or different car classes.
            </p>
          </VrlCard>

          <VrlCard variant="feature" class="p-4 sm:p-6">
            <template #icon>
              <PhTimer :size="26" weight="duotone" class="text-racing-gold" />
            </template>
            <VrlHeading :level="3" variant="card" class="feature-title">
              Qualifying & Race Times
            </VrlHeading>
            <p class="feature-description">
              Track qualifying poles, race times, gaps, and fastest laps. Automatic calculations for
              time differences and standings.
            </p>
          </VrlCard>

          <VrlCard variant="feature" class="p-4 sm:p-6">
            <template #icon>
              <PhUsers :size="26" weight="duotone" class="text-racing-gold" />
            </template>
            <VrlHeading :level="3" variant="card" class="feature-title">
              Teams & Divisions
            </VrlHeading>
            <p class="feature-description">
              Support for team championships and multiple racing divisions. Run Pro/Am splits or
              manufacturer battles with ease.
            </p>
          </VrlCard>

          <VrlCard variant="feature" class="p-4 sm:p-6">
            <template #icon>
              <PhChartLine :size="26" weight="duotone" class="text-racing-gold" />
            </template>
            <VrlHeading :level="3" variant="card" class="feature-title">
              Driver Tracking
            </VrlHeading>
            <p class="feature-description">
              Maintain driver databases with platform IDs, track statistics, and manage driver
              statuses across seasons.
            </p>
          </VrlCard>

          <VrlCard variant="feature" class="p-4 sm:p-6">
            <template #icon>
              <PhWarning :size="26" weight="duotone" class="text-racing-gold" />
            </template>
            <VrlHeading :level="3" variant="card" class="feature-title">
              Penalties & Incidents
            </VrlHeading>
            <p class="feature-description">
              Apply time penalties, position penalties, and track DNF/DNS events. Automatic
              recalculation of final standings.
            </p>
          </VrlCard>

          <VrlCard variant="feature" class="p-4 sm:p-6">
            <template #icon>
              <PhShareNetwork :size="26" weight="duotone" class="text-racing-gold" />
            </template>
            <VrlHeading :level="3" variant="card" class="feature-title">
              Public Sharing
            </VrlHeading>
            <p class="feature-description">
              Generate shareable links for your community. Clean, responsive standings pages that
              look great on any device.
            </p>
          </VrlCard>
        </div>
      </div>
    </section>

    <!-- Pricing Section -->
    <section class="section-padding" style="background: var(--color-carbon)">
      <div class="container-racing">
        <div class="section-header">
          <VrlLabel class="section-label">Pricing</VrlLabel>
          <VrlHeading :level="2" variant="section" class="section-title">
            Start Racing Today
          </VrlHeading>
        </div>

        <VrlCard variant="default" :hoverable="false" class="pricing-card">
          <div class="pricing-badge-wrapper">
            <VrlBadge variant="featured" label="Current Offer" />
          </div>
          <div class="pricing-price">FREE</div>
          <p class="pricing-period">No credit card required. No hidden fees.</p>

          <ul class="pricing-features">
            <li>Unlimited leagues</li>
            <li>Unlimited competitions & seasons</li>
            <li>Unlimited drivers</li>
            <li>Public standings pages</li>
            <li>Teams & divisions support</li>
            <li>Gran Turismo 7 integration</li>
            <li>CSV import for drivers & results</li>
          </ul>

          <VrlButton variant="primary" size="lg" class="w-full" @click="navigateTo('/register')">
            Create Your League
          </VrlButton>
        </VrlCard>
      </div>
    </section>

    <!-- Coming Soon Section -->
    <section class="section-padding" style="background: var(--color-asphalt)">
      <div class="container-racing">
        <div class="section-header">
          <VrlLabel class="section-label">Roadmap</VrlLabel>
          <VrlHeading :level="2" variant="section" class="section-title"> Coming Soon </VrlHeading>
        </div>

        <div class="coming-soon-grid">
          <VrlCard variant="default" class="coming-soon-item">
            <PhDatabase class="coming-soon-icon" :size="32" weight="duotone" />
            <span>GT7 Daily Race Data</span>
          </VrlCard>
          <VrlCard variant="default" class="coming-soon-item">
            <PhMapPin class="coming-soon-icon" :size="32" weight="duotone" />
            <span>GT7 Track API</span>
          </VrlCard>
          <VrlCard variant="default" class="coming-soon-item">
            <PhCar class="coming-soon-icon" :size="32" weight="duotone" />
            <span>GT7 Car Database</span>
          </VrlCard>
          <VrlCard variant="default" class="coming-soon-item">
            <PhGarage class="coming-soon-icon" :size="32" weight="duotone" />
            <span>Season Car Selection</span>
          </VrlCard>
          <VrlCard variant="default" class="coming-soon-item">
            <PhScan class="coming-soon-icon" :size="32" weight="duotone" />
            <span>AI OCR Result Reader</span>
          </VrlCard>
          <VrlCard variant="default" class="coming-soon-item">
            <PhGameController class="coming-soon-icon" :size="32" weight="duotone" />
            <span>More Platforms</span>
          </VrlCard>
        </div>
      </div>
    </section>

    <!-- CTA Section -->
    <section class="cta-section">
      <div class="cta-background">
        <div class="pattern-checkered absolute inset-0 opacity-10"></div>
      </div>
      <div class="container-racing cta-content">
        <VrlHeading :level="2" variant="section" class="cta-title">
          Ready to Start Your Season?
        </VrlHeading>
        <p class="cta-description">
          Join league managers who trust Virtual Racing Leagues to power their competitions.
        </p>
        <div class="cta-buttons">
          <VrlButton variant="primary" size="lg" @click="navigateTo('/register')">
            Create Free Account
          </VrlButton>
          <VrlButton variant="secondary" size="lg" @click="navigateTo('/leagues')">
            Explore Public Leagues
          </VrlButton>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
import {
  PhFlag,
  PhTimer,
  PhUsers,
  PhChartLine,
  PhWarning,
  PhShareNetwork,
  PhDatabase,
  PhMapPin,
  PhCar,
  PhGarage,
  PhScan,
  PhGameController,
} from '@phosphor-icons/vue';
import VrlButton from '@public/components/common/buttons/VrlButton.vue';
import VrlCard from '@public/components/common/cards/VrlCard.vue';
import VrlHeading from '@public/components/common/typography/VrlHeading.vue';
import VrlLabel from '@public/components/common/typography/VrlLabel.vue';
import VrlBadge from '@public/components/common/badges/VrlBadge.vue';
import { useToast } from '@public/composables/useToast';

const router = useRouter();
const toast = useToast();

const navigateTo = async (path: string) => {
  try {
    await router.push(path);
  } catch (error) {
    // Silently ignore NavigationDuplicated errors (user clicked same route)
    if (
      error &&
      typeof error === 'object' &&
      'name' in error &&
      error.name === 'NavigationDuplicated'
    ) {
      return;
    }
    // Show toast notification for actual navigation failures
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to navigate. Please try again.';
    toast.error(errorMessage, 'Navigation Error');
    console.error('Navigation failed:', error);
  }
};
</script>

<style scoped>
/* Hero Stats */
.hero-stats {
  display: flex;
  gap: var(--space-2xl);
  margin-top: var(--space-3xl);
  padding-top: var(--space-2xl);
  border-top: 1px solid var(--color-tarmac);
}

.hero-stat {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.hero-stat-value {
  font-size: 1.5rem;
  color: var(--color-gold);
}

.hero-stat-label {
  font-size: 0.75rem !important;
  color: var(--color-barrier) !important;
  margin-bottom: 0 !important;
}

/* Section Headers */
.section-header {
  text-align: center;
  margin-bottom: var(--space-3xl);
}

.section-label {
  font-size: 0.625rem !important;
  letter-spacing: 0.3em !important;
  color: var(--color-gold) !important;
  display: block;
  margin-bottom: var(--space-sm) !important;
}

/* Steps Grid */
.steps-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--space-md);
}

.step-card :deep(.card-body) {
  display: flex;
  gap: var(--space-lg);
  padding: var(--space-xl);
}

.step-card {
  position: relative;
}

.step-card::after {
  content: '';
  position: absolute;
  top: 50%;
  right: -16px;
  width: 32px;
  height: 2px;
  background: linear-gradient(90deg, var(--color-gold), transparent);
  z-index: 1;
}

.step-card:last-child::after {
  display: none;
}

.step-number {
  font-family: var(--font-display);
  font-size: 2.5rem;
  color: var(--color-gold);
  opacity: 0.3;
  line-height: 1;
}

.step-content {
  flex: 1;
}

.step-title {
  margin-bottom: var(--space-sm) !important;
}

.step-description {
  font-size: 0.875rem;
  color: var(--color-barrier);
  line-height: 1.6;
}

/* Coming Soon Grid */
.coming-soon-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--space-lg);
}

.coming-soon-item :deep(.card-body) {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  padding: var(--space-lg);
  font-family: var(--font-body);
  font-size: 0.875rem;
  color: var(--color-barrier);
}

.coming-soon-item:hover :deep(.card-body) {
  color: var(--color-pit-white);
}

.coming-soon-icon {
  color: var(--color-gold);
  opacity: 0.6;
}

/* Feature Grid */
.feature-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: var(--space-lg);
}

.feature-card {
  position: relative;
  overflow: hidden;
}

.feature-card :deep(.card-body) {
  padding: var(--space-xl);
}

.feature-icon {
  color: var(--color-gold);
  opacity: 0.8;
  margin-bottom: var(--space-md);
  transition: all 0.3s ease;
}

.feature-card:hover .feature-icon {
  opacity: 1;
  transform: scale(1.1);
}

.feature-title {
  margin-bottom: var(--space-sm) !important;
  font-size: 0.875rem !important;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.feature-description {
  font-size: 0.875rem;
  color: var(--color-barrier);
  line-height: 1.6;
}

/* Pricing Card */
.pricing-card {
  max-width: 500px;
  margin: 0 auto;
}

.pricing-card :deep(.card-body) {
  padding: var(--space-3xl);
  text-align: center;
}

.pricing-badge-wrapper {
  margin-bottom: var(--space-lg);
}

.pricing-price {
  font-family: var(--font-display);
  font-size: 3.5rem;
  color: var(--color-gold);
  margin-bottom: var(--space-sm);
  line-height: 1;
}

.pricing-period {
  font-size: 0.875rem;
  color: var(--color-barrier);
  margin-bottom: var(--space-2xl);
}

.pricing-features {
  list-style: none;
  padding: 0;
  margin: 0 0 var(--space-2xl) 0;
  text-align: left;
}

.pricing-features li {
  padding: var(--space-sm) 0;
  color: var(--color-concrete);
  font-size: 0.875rem;
  position: relative;
  padding-left: var(--space-lg);
}

.pricing-features li::before {
  content: '✓';
  position: absolute;
  left: 0;
  color: var(--color-gold);
  font-weight: bold;
}

/* CTA Section */
.cta-section {
  position: relative;
  padding: var(--space-4xl) 0;
  background: linear-gradient(135deg, var(--color-safety-dark) 0%, var(--color-safety) 100%);
  overflow: hidden;
}

.cta-background {
  position: absolute;
  inset: 0;
}

.cta-content {
  position: relative;
  text-align: center;
}

.cta-title {
  margin-bottom: var(--space-md) !important;
}

.cta-description {
  font-size: 1.125rem;
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: var(--space-xl);
  max-width: 500px;
  margin-left: auto;
  margin-right: auto;
}

.cta-buttons {
  display: flex;
  gap: var(--space-md);
  justify-content: center;
  flex-wrap: wrap;
}

/* Responsive */
@media (max-width: 1024px) {
  .steps-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .step-card::after {
    display: none;
  }
}

@media (max-width: 768px) {
  .hero-stats {
    flex-direction: column;
    gap: var(--space-lg);
  }

  .steps-grid {
    grid-template-columns: 1fr;
  }

  .step-card {
    flex-direction: column;
    text-align: center;
  }

  .step-number {
    font-size: 2rem;
  }
}
</style>
