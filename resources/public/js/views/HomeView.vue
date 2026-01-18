<script setup lang="ts">
import BackgroundGrid from '@public/components/landing/BackgroundGrid.vue';
import SpeedLines from '@public/components/landing/SpeedLines.vue';
import LandingNav from '@public/components/landing/LandingNav.vue';
import LandingFooter from '@public/components/landing/LandingFooter.vue';
import HeroSection from '@public/components/landing/sections/HeroSection.vue';
import FeaturesSection from '@public/components/landing/sections/FeaturesSection.vue';
import HowItWorksSection from '@public/components/landing/sections/HowItWorksSection.vue';
import PricingSection from '@public/components/landing/sections/PricingSection.vue';
import PlatformsSection from '@public/components/landing/sections/PlatformsSection.vue';
import ComingSoonSection from '@public/components/landing/sections/ComingSoonSection.vue';
import CtaSection from '@public/components/landing/sections/CtaSection.vue';

/**
 * HomeView - VRL Velocity Landing Page
 *
 * Main landing page for the public site featuring:
 * - Animated background effects
 * - Hero section with stats and live standings preview
 * - Features showcase
 * - How it works guide
 * - Pricing information
 * - Platform support
 * - Coming soon features
 * - Call-to-action
 */
</script>

<template>
  <div class="min-h-screen bg-[var(--bg-dark)] text-[var(--text-primary)] overflow-x-hidden">
    <!-- Background Effects -->
    <BackgroundGrid />
    <SpeedLines />

    <!-- Navigation -->
    <LandingNav />

    <!-- Main Content -->
    <main>
      <HeroSection />
      <FeaturesSection />
      <HowItWorksSection />
      <PricingSection />
      <PlatformsSection />
      <ComingSoonSection />
      <CtaSection />
    </main>

    <!-- Footer -->
    <LandingFooter />
  </div>
</template>
