<script setup lang="ts">
import DemoHero from '@public/views/demo/DemoHero.vue';
import DemoNavigation from '@public/views/demo/DemoNavigation.vue';
import DemoThemeSection from '@public/views/demo/DemoThemeSection.vue';
import DemoTypographySection from '@public/views/demo/DemoTypographySection.vue';
import DemoButtonsSection from '@public/views/demo/DemoButtonsSection.vue';
import DemoBadgesSection from '@public/views/demo/DemoBadgesSection.vue';
import DemoFormsSection from '@public/views/demo/DemoFormsSection.vue';
import DemoCardsSection from '@public/views/demo/DemoCardsSection.vue';
import DemoNavigationSection from '@public/views/demo/DemoNavigationSection.vue';
import DemoDataSection from '@public/views/demo/DemoDataSection.vue';
import DemoOverlaysSection from '@public/views/demo/DemoOverlaysSection.vue';
import DemoRoadmapSection from '@public/views/demo/DemoRoadmapSection.vue';

// Scroll to section
const scrollToSection = (id: string) => {
  const element = document.getElementById(id);
  if (element) {
    const offset = 100;
    const elementPosition = element.getBoundingClientRect().top;
    const offsetPosition = elementPosition + window.scrollY - offset;

    window.scrollTo({
      top: offsetPosition,
      behavior: 'smooth',
    });
  }
};
</script>

<template>
  <div class="min-h-screen theme-bg-primary">
    <!-- Hero Section -->
    <DemoHero />

    <!-- Table of Contents -->
    <DemoNavigation @scroll-to="scrollToSection" />

    <!-- Main Content -->
    <div class="container-racing py-16 space-y-24">
      <!-- Theme System Section -->
      <DemoThemeSection />

      <!-- Typography Section -->
      <DemoTypographySection />

      <!-- Buttons Section -->
      <DemoButtonsSection />

      <!-- Badges Section -->
      <DemoBadgesSection />

      <!-- Forms Section -->
      <DemoFormsSection />

      <!-- Cards Section -->
      <DemoCardsSection />

      <!-- Navigation Section -->
      <DemoNavigationSection />

      <!-- Data Display Section -->
      <DemoDataSection />

      <!-- Overlays Section -->
      <DemoOverlaysSection />

      <!-- Implementation Status -->
      <DemoRoadmapSection />
    </div>
  </div>
</template>

<style scoped>
/* Smooth scroll offset for fixed navigation */
section {
  scroll-margin-top: 120px;
}

/* Custom scrollbar for dark theme */
::-webkit-scrollbar {
  width: 10px;
}

::-webkit-scrollbar-track {
  background: var(--bg-secondary);
}

::-webkit-scrollbar-thumb {
  background: var(--bg-elevated);
  border-radius: 5px;
}

::-webkit-scrollbar-thumb:hover {
  background: var(--accent-gold-muted);
}
</style>
