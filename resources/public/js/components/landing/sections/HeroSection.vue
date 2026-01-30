<script setup lang="ts">
import { RouterLink } from 'vue-router';
import VrlBadge from '@public/components/common/badges/VrlBadge.vue';
import VrlButton from '@public/components/common/buttons/VrlButton.vue';
import StatItem from '../StatItem.vue';
import HeroStandingsCard from '../HeroStandingsCard.vue';

/**
 * HeroSection Component
 *
 * Full hero section with badge, headline, subtitle, CTAs, stats, and standings card.
 * Features responsive layout and slide-in animations.
 */

const stats = [
  { value: '500+', label: 'Active Leagues' },
  { value: '10K+', label: 'Drivers' },
  { value: '50K+', label: 'Races Tracked' },
];

const standings = [
  { position: 1, initials: 'MV', name: 'Max Verstappen', team: 'Red Bull Racing', points: 256 },
  { position: 2, initials: 'LH', name: 'Oscar Piastri', team: 'McLaren', points: 243 },
  { position: 3, initials: 'CL', name: 'Charles Leclerc', team: 'Ferrari', points: 231 },
  { position: 4, initials: 'LN', name: 'Lando Norris', team: 'McLaren', points: 198 },
];
</script>

<template>
  <section class="min-h-screen flex items-center px-8 pt-32 pb-16 relative z-10">
    <div class="max-w-[1400px] mx-auto w-full grid lg:grid-cols-2 grid-cols-1 gap-16 items-center">
      <!-- Hero Content -->
      <div class="hero-content">
        <VrlBadge variant="green" dot pulse>100% Free</VrlBadge>

        <h1
          class="font-[var(--font-display)] text-[4rem] lg:text-[4rem] md:text-[3rem] sm:text-[2.5rem] font-extrabold leading-[1.1] mb-6 mt-6 tracking-[2px]"
        >
          MANAGE YOUR<br />
          <span class="text-gradient">RACING LEAGUE</span><br />
          LIKE A PRO
        </h1>

        <p class="text-[1.25rem] text-[var(--text-secondary)] mb-8 max-w-[500px]">
          Setup your league, competitions, and seasons in minutes. Track results, manage drivers,
          and share standings with your community.
        </p>

        <div class="flex flex-col md:flex-row gap-4 mb-12">
          <RouterLink to="/register">
            <VrlButton variant="primary" size="lg">Start Racing Free</VrlButton>
          </RouterLink>
          <RouterLink to="/leagues">
            <VrlButton variant="secondary" size="lg">Browse Leagues</VrlButton>
          </RouterLink>
        </div>

        <div class="flex flex-wrap gap-12 hidden">
          <StatItem
            v-for="stat in stats"
            :key="stat.label"
            :value="stat.value"
            :label="stat.label"
          />
        </div>
      </div>

      <!-- Hero Visual (hidden on mobile/tablet) -->
      <div class="hidden lg:block hero-visual">
        <HeroStandingsCard :standings="standings" />
      </div>
    </div>
  </section>
</template>

<style scoped>
.text-gradient {
  background: linear-gradient(135deg, var(--cyan), var(--purple));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.hero-content {
  animation: slideInLeft 1s ease-out;
}

.hero-visual {
  animation: slideInRight 1s ease-out 0.3s both;
}

@keyframes slideInLeft {
  from {
    opacity: 0;
    transform: translateX(-50px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes slideInRight {
  from {
    opacity: 0;
    transform: translateX(50px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

/* Respect user's motion preferences */
@media (prefers-reduced-motion: reduce) {
  .hero-content,
  .hero-visual {
    animation: none;
  }
}

/* Responsive adjustments */
@media (max-width: 1024px) {
  .hero-content {
    text-align: center;
  }

  .hero-content h1 {
    font-size: 3rem;
  }

  .hero-content p {
    margin-left: auto;
    margin-right: auto;
  }

  .hero-content .flex {
    justify-content: center;
  }
}

@media (max-width: 768px) {
  .hero-content h1 {
    font-size: 2.5rem;
  }

  .hero-content .flex-wrap {
    flex-direction: column;
    gap: 1.5rem;
  }
}
</style>
