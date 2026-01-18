<script setup lang="ts">
/**
 * LandingFooter Component
 *
 * Footer with copyright information and links.
 */

const currentYear = new Date().getFullYear();
</script>

<template>
  <footer class="px-8 py-12 border-t border-[var(--border)] relative z-10">
    <div
      class="max-w-[1400px] mx-auto flex flex-col md:flex-row justify-between items-center gap-4"
    >
      <div class="text-[var(--text-muted)] text-[0.85rem]">
        <div class="hidden">
          &copy; {{ currentYear }} Virtual Racing Leagues. All rights reserved.
        </div>
      </div>

      <div class="flex gap-8">
        <a
          href="#"
          class="text-[var(--text-secondary)] no-underline text-[0.85rem] transition-colors duration-300 hover:text-[var(--cyan)]"
        >
          Privacy
        </a>
        <a
          href="#"
          class="text-[var(--text-secondary)] no-underline text-[0.85rem] transition-colors duration-300 hover:text-[var(--cyan)]"
        >
          Terms
        </a>
        <a
          href="#"
          class="text-[var(--text-secondary)] no-underline text-[0.85rem] transition-colors duration-300 hover:text-[var(--cyan)]"
        >
          Contact
        </a>
      </div>
    </div>
  </footer>
</template>
