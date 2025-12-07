<template>
  <div class="landing-page">
    <!-- Navigation -->
    <PublicHeader />

    <!-- Hero Section -->
    <section class="hero gradient-hero">
      <div class="hero-background">
        <div class="pattern-stripes absolute inset-0 opacity-50"></div>
        <div class="racing-line"></div>
        <div class="racing-line" style="top: 30%; animation-delay: 1s;"></div>
        <div class="racing-line" style="top: 70%; animation-delay: 2s;"></div>
      </div>

      <div class="container-racing">
        <div class="hero-content animate-fade-in-up">
          <div class="hero-tagline">
            <span>Sim Racing League Management</span>
          </div>

          <h1 class="hero-title">
            Setup. Race.
            <span class="highlight">Share.</span>
          </h1>

          <p class="hero-description">
            The complete platform for sim racing league managers. Create competitions, track results,
            and share standings with your community in minutes.
          </p>

          <div class="hero-cta">
            <router-link to="/register" class="btn btn-primary">
              Get Started Free
            </router-link>
            <router-link to="/leagues" class="btn btn-secondary">
              Browse Leagues
            </router-link>
          </div>

          <div class="hero-stats">
            <div class="hero-stat">
              <span class="hero-stat-value font-display">GT7</span>
              <span class="hero-stat-label">Platform Support</span>
            </div>
            <div class="hero-stat">
              <span class="hero-stat-value font-display">100%</span>
              <span class="hero-stat-label">Free to Use</span>
            </div>
            <div class="hero-stat">
              <span class="hero-stat-value font-display">Live</span>
              <span class="hero-stat-label">Standings</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- How It Works Section -->
    <section class="section-padding" style="background: var(--color-asphalt);">
      <div class="container-racing">
        <div class="section-header">
          <span class="section-label">How It Works</span>
          <h2 class="section-title">Four Simple Steps</h2>
        </div>

        <div class="steps-grid">
          <div class="step-card animate-fade-in-up animate-delay-1">
            <div class="step-number">01</div>
            <div class="step-content">
              <h3 class="step-title">Create Your League</h3>
              <p class="step-description">
                Set up your league with custom branding, invite your drivers, and configure your settings.
              </p>
            </div>
          </div>

          <div class="step-card animate-fade-in-up animate-delay-2">
            <div class="step-number">02</div>
            <div class="step-content">
              <h3 class="step-title">Build Competitions</h3>
              <p class="step-description">
                Create seasons with rounds, races, qualifying sessions, and custom points systems.
              </p>
            </div>
          </div>

          <div class="step-card animate-fade-in-up animate-delay-3">
            <div class="step-number">03</div>
            <div class="step-content">
              <h3 class="step-title">Enter Results</h3>
              <p class="step-description">
                Record race times, positions, penalties, fastest laps, and DNF/DNS statuses.
              </p>
            </div>
          </div>

          <div class="step-card animate-fade-in-up animate-delay-4">
            <div class="step-number">04</div>
            <div class="step-content">
              <h3 class="step-title">Share With Everyone</h3>
              <p class="step-description">
                Generate a public link for your community to view live standings and results.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Features Section -->
    <section class="section-padding pattern-carbon">
      <div class="container-racing">
        <div class="section-header">
          <span class="section-label">Features</span>
          <h2 class="section-title">Everything You Need</h2>
        </div>

        <div class="feature-grid">
          <div class="feature-card">
            <PhFlag class="feature-icon" :size="48" weight="duotone" />
            <h3 class="feature-title">Leagues & Competitions</h3>
            <p class="feature-description">
              Organize multiple competitions and seasons under a single league. Perfect for running
              parallel championships or different car classes.
            </p>
          </div>

          <div class="feature-card">
            <PhTimer class="feature-icon" :size="48" weight="duotone" />
            <h3 class="feature-title">Qualifying & Race Times</h3>
            <p class="feature-description">
              Track qualifying poles, race times, gaps, and fastest laps. Automatic calculations for
              time differences and standings.
            </p>
          </div>

          <div class="feature-card">
            <PhUsers class="feature-icon" :size="48" weight="duotone" />
            <h3 class="feature-title">Teams & Divisions</h3>
            <p class="feature-description">
              Support for team championships and multiple racing divisions. Run Pro/Am splits or
              manufacturer battles with ease.
            </p>
          </div>

          <div class="feature-card">
            <PhChartLine class="feature-icon" :size="48" weight="duotone" />
            <h3 class="feature-title">Driver Tracking</h3>
            <p class="feature-description">
              Maintain driver databases with platform IDs, track statistics, and manage driver
              statuses across seasons.
            </p>
          </div>

          <div class="feature-card">
            <PhWarning class="feature-icon" :size="48" weight="duotone" />
            <h3 class="feature-title">Penalties & Incidents</h3>
            <p class="feature-description">
              Apply time penalties, position penalties, and track DNF/DNS events. Automatic
              recalculation of final standings.
            </p>
          </div>

          <div class="feature-card">
            <PhShareNetwork class="feature-icon" :size="48" weight="duotone" />
            <h3 class="feature-title">Public Sharing</h3>
            <p class="feature-description">
              Generate shareable links for your community. Clean, responsive standings pages that
              look great on any device.
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- Pricing Section -->
    <section class="section-padding" style="background: var(--color-carbon);">
      <div class="container-racing">
        <div class="section-header">
          <span class="section-label">Pricing</span>
          <h2 class="section-title">Start Racing Today</h2>
        </div>

        <div class="pricing-card">
          <div class="pricing-badge">Current Offer</div>
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

          <router-link to="/register" class="btn btn-primary" style="width: 100%;">
            Create Your League
          </router-link>
        </div>
      </div>
    </section>

    <!-- Coming Soon Section -->
    <section class="section-padding" style="background: var(--color-asphalt);">
      <div class="container-racing">
        <div class="section-header">
          <span class="section-label">Roadmap</span>
          <h2 class="section-title">Coming Soon</h2>
        </div>

        <div class="coming-soon-grid">
          <div class="coming-soon-item">
            <PhDatabase class="coming-soon-icon" :size="32" weight="duotone" />
            <span>GT7 Daily Race Data</span>
          </div>
          <div class="coming-soon-item">
            <PhMapPin class="coming-soon-icon" :size="32" weight="duotone" />
            <span>GT7 Track API</span>
          </div>
          <div class="coming-soon-item">
            <PhCar class="coming-soon-icon" :size="32" weight="duotone" />
            <span>GT7 Car Database</span>
          </div>
          <div class="coming-soon-item">
            <PhGarage class="coming-soon-icon" :size="32" weight="duotone" />
            <span>Season Car Selection</span>
          </div>
          <div class="coming-soon-item">
            <PhScan class="coming-soon-icon" :size="32" weight="duotone" />
            <span>AI OCR Result Reader</span>
          </div>
          <div class="coming-soon-item">
            <PhGameController class="coming-soon-icon" :size="32" weight="duotone" />
            <span>More Platforms</span>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA Section -->
    <section class="cta-section">
      <div class="cta-background">
        <div class="pattern-checkered absolute inset-0 opacity-10"></div>
      </div>
      <div class="container-racing cta-content">
        <h2 class="cta-title">Ready to Start Your Season?</h2>
        <p class="cta-description">
          Join league managers who trust Virtual Racing Leagues to power their competitions.
        </p>
        <div class="cta-buttons">
          <router-link to="/register" class="btn btn-primary">
            Create Free Account
          </router-link>
          <router-link to="/leagues" class="btn btn-secondary">
            Explore Public Leagues
          </router-link>
        </div>
      </div>
    </section>

    <!-- Footer -->
    <PublicFooter />
  </div>
</template>

<script setup lang="ts">
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
import PublicHeader from '@public/components/layout/PublicHeader.vue';
import PublicFooter from '@public/components/layout/PublicFooter.vue';
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
  font-size: 0.75rem;
  color: var(--color-barrier);
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

/* Section Headers */
.section-header {
  text-align: center;
  margin-bottom: var(--space-3xl);
}

.section-label {
  font-family: var(--font-display);
  font-size: 0.625rem;
  text-transform: uppercase;
  letter-spacing: 0.3em;
  color: var(--color-gold);
  display: block;
  margin-bottom: var(--space-sm);
}

.section-title {
  font-size: clamp(2rem, 5vw, 3rem);
}

/* Steps Grid */
.steps-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--space-md);
}

.step-card {
  display: flex;
  gap: var(--space-lg);
  padding: var(--space-xl);
  background: var(--color-carbon);
  border: 1px solid var(--color-tarmac);
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
  font-size: 0.875rem;
  margin-bottom: var(--space-sm);
  color: var(--color-pit-white);
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

.coming-soon-item {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  padding: var(--space-lg);
  background: var(--color-carbon);
  border: 1px solid var(--color-tarmac);
  font-family: var(--font-body);
  font-size: 0.875rem;
  color: var(--color-barrier);
  transition: all var(--duration-normal) var(--ease-racing);
}

.coming-soon-item:hover {
  border-color: var(--color-gold-muted);
  color: var(--color-pit-white);
}

.coming-soon-icon {
  color: var(--color-gold);
  opacity: 0.6;
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
  font-size: clamp(2rem, 5vw, 3rem);
  margin-bottom: var(--space-md);
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

.cta-section .btn-primary {
  background: var(--color-pit-white);
  color: var(--color-safety-dark);
}

.cta-section .btn-primary:hover {
  background: var(--color-concrete);
  box-shadow: 0 10px 40px -10px rgba(0, 0, 0, 0.3);
}

.cta-section .btn-secondary {
  border-color: rgba(255, 255, 255, 0.5);
  color: var(--color-pit-white);
}

.cta-section .btn-secondary:hover {
  border-color: var(--color-pit-white);
  background: rgba(255, 255, 255, 0.1);
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
