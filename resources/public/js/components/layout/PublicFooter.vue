<script setup lang="ts">
import { ref } from 'vue';
import { PhDiscordLogo } from '@phosphor-icons/vue';
import PublicContactModal from '@public/components/contact/PublicContactModal.vue';
import { useGtm } from '@public/composables/useGtm';

/**
 * PublicFooter Component
 *
 * Unified footer for all public pages featuring:
 * - Copyright information
 * - Social media links (Discord)
 * - Navigation links (Privacy, Terms, Contact)
 * - Contact modal integration
 */

const currentYear = new Date().getFullYear();
const appName = import.meta.env.VITE_APP_NAME || 'Virtual Racing Leagues';
const isContactOpen = ref(false);
const { trackEvent } = useGtm();

function openContactModal() {
  isContactOpen.value = true;
  trackEvent('contact_form_open', { source: 'public' });
}

function handleSuccess() {
  // Optional: additional handling after successful submission
}
</script>

<template>
  <footer class="bg-[var(--bg-panel)] border-t border-[var(--border)] px-8 py-12 relative z-10">
    <div class="max-w-[1400px] mx-auto">
      <!-- Desktop Layout: 3 columns -->
      <div class="hidden md:grid md:grid-cols-3 md:items-center md:gap-8">
        <!-- Left: Copyright -->
        <div class="text-[var(--text-muted)] text-[0.85rem]">
          &copy; {{ currentYear }} {{ appName }}. All rights reserved.
        </div>

        <!-- Middle: Social Links -->
        <div class="flex justify-center">
          <a
            href="https://discord.gg/virtualracingleagues"
            target="_blank"
            rel="noopener noreferrer"
            class="text-[var(--text-secondary)] hover:text-[var(--cyan)] transition-colors duration-300"
            aria-label="Join our Discord"
          >
            <PhDiscordLogo :size="24" weight="fill" />
          </a>
        </div>

        <!-- Right: Navigation Links -->
        <div class="flex justify-end gap-8">
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
          <button
            class="text-[var(--text-secondary)] no-underline text-[0.85rem] transition-colors duration-300 hover:text-[var(--cyan)] cursor-pointer bg-transparent border-0 p-0"
            @click="openContactModal"
          >
            Contact
          </button>
        </div>
      </div>

      <!-- Mobile Layout: Stacked -->
      <div class="md:hidden flex flex-col items-center gap-6">
        <!-- Copyright -->
        <div class="text-[var(--text-muted)] text-[0.85rem] text-center">
          &copy; {{ currentYear }} {{ appName }}. All rights reserved.
        </div>

        <!-- Social Links -->
        <div class="flex justify-center">
          <a
            href="https://discord.gg/virtualracingleagues"
            target="_blank"
            rel="noopener noreferrer"
            class="text-[var(--text-secondary)] hover:text-[var(--cyan)] transition-colors duration-300"
            aria-label="Join our Discord"
          >
            <PhDiscordLogo :size="24" weight="fill" />
          </a>
        </div>

        <!-- Navigation Links -->
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
          <button
            class="text-[var(--text-secondary)] no-underline text-[0.85rem] transition-colors duration-300 hover:text-[var(--cyan)] cursor-pointer bg-transparent border-0 p-0"
            @click="openContactModal"
          >
            Contact
          </button>
        </div>
      </div>
    </div>

    <!-- Contact Modal -->
    <PublicContactModal v-model:visible="isContactOpen" @success="handleSuccess" />
  </footer>
</template>
