<script setup lang="ts">
import { RouterLink, useRouter, useRoute } from 'vue-router';
import VrlButton from '@public/components/common/buttons/VrlButton.vue';

/**
 * LandingNav Component
 *
 * Fixed navigation header with logo, nav links, and CTA buttons.
 * Includes smooth scroll for anchor links and router navigation.
 */

const router = useRouter();
const route = useRoute();

const handleSmoothScroll = (event: MouseEvent, target: string) => {
  event.preventDefault();

  // Check if we're on the home page
  if (route.path === '/') {
    // On home page - just scroll to the section
    const element = document.querySelector(target);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  } else {
    // Not on home page - navigate to home with the anchor
    router.push('/').then(() => {
      // Wait for DOM to update after navigation
      setTimeout(() => {
        const element = document.querySelector(target);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    });
  }
};
</script>

<template>
  <nav
    class="fixed top-0 left-0 right-0 z-[100] px-8 py-4 bg-gradient-to-b from-[var(--bg-dark)] to-transparent backdrop-blur-md"
  >
    <div class="max-w-[1400px] mx-auto flex justify-between items-center">
      <!-- Logo -->
      <RouterLink
        to="/"
        class="font-[var(--font-display)] text-xl font-semibold text-[var(--text-primary)] no-underline tracking-[2px] flex items-center gap-2"
      >
        <img src="images/logo/64.png" alt="SimGrid Logo" class="w-10 h-10 mr-1" />
        <div class="font-logo text-2xl flex items-center">
          <span class="text-cyan">SimGrid</span>
          <span class="text-[var(--text-secondary)]">Manager</span>
        </div>
      </RouterLink>

      <!-- Nav Links (hidden on mobile) -->
      <ul class="hidden lg:flex gap-8 list-none">
        <li>
          <a
            href="#features"
            class="text-[var(--text-secondary)] no-underline font-medium text-[0.9rem] tracking-[0.5px] transition-colors duration-300 relative hover:text-[var(--text-primary)] after:content-[''] after:absolute after:bottom-[-4px] after:left-0 after:w-0 after:h-0.5 after:bg-[var(--cyan)] after:transition-all after:duration-300 hover:after:w-full"
            @click="handleSmoothScroll($event, '#features')"
          >
            Features
          </a>
        </li>
        <li>
          <a
            href="#how-it-works"
            class="text-[var(--text-secondary)] no-underline font-medium text-[0.9rem] tracking-[0.5px] transition-colors duration-300 relative hover:text-[var(--text-primary)] after:content-[''] after:absolute after:bottom-[-4px] after:left-0 after:w-0 after:h-0.5 after:bg-[var(--cyan)] after:transition-all after:duration-300 hover:after:w-full"
            @click="handleSmoothScroll($event, '#how-it-works')"
          >
            How It Works
          </a>
        </li>
        <li>
          <RouterLink
            to="/leagues"
            class="text-[var(--text-secondary)] no-underline font-medium text-[0.9rem] tracking-[0.5px] transition-colors duration-300 relative hover:text-[var(--text-primary)] after:content-[''] after:absolute after:bottom-[-4px] after:left-0 after:w-0 after:h-0.5 after:bg-[var(--cyan)] after:transition-all after:duration-300 hover:after:w-full"
          >
            Browse Leagues
          </RouterLink>
        </li>
      </ul>

      <!-- CTA Buttons -->
      <div class="hidden md:flex gap-4">
        <RouterLink to="/login">
          <VrlButton variant="secondary" size="default">Login</VrlButton>
        </RouterLink>
        <RouterLink to="/register">
          <VrlButton variant="primary" size="default">Get Started</VrlButton>
        </RouterLink>
      </div>
    </div>
  </nav>
</template>
