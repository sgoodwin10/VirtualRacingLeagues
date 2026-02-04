<script setup lang="ts">
import { useSiteConfig } from '@app/composables/useSiteConfig';

const { maintenanceMessage, hasDiscord, discordUrl } = useSiteConfig();

const openDiscord = (): void => {
  if (discordUrl.value) {
    window.open(discordUrl.value, '_blank');
  }
};
</script>

<template>
  <div class="flex-1 bg-[var(--bg-dark)] text-[var(--text-primary)] min-h-screen overflow-x-hidden">
    <!-- Background Pattern -->
    <div class="fixed inset-0 overflow-hidden pointer-events-none">
      <div
        class="absolute inset-0"
        style="
          background-image:
            linear-gradient(rgba(0, 255, 255, 0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 255, 255, 0.03) 1px, transparent 1px);
          background-size: 50px 50px;
        "
      />
    </div>

    <!-- Main Content -->
    <main class="relative z-10 flex items-center justify-center min-h-screen px-4 sm:px-6 lg:px-8">
      <div class="max-w-md w-full">
        <!-- Maintenance Card -->
        <div
          class="bg-[var(--bg-panel)] border border-[var(--border)] rounded-[var(--radius-lg)] p-8"
        >
          <!-- Icon -->
          <div class="flex justify-center mb-6">
            <div
              class="w-20 h-20 rounded-full bg-[var(--yellow)]/10 flex items-center justify-center"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="w-10 h-10 text-[var(--yellow)]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
          </div>

          <!-- Header -->
          <h1 class="text-display-h2 text-center mb-2">Maintenance Mode</h1>
          <p class="text-body-secondary text-center mb-8">
            {{ maintenanceMessage }}
          </p>

          <!-- Discord Button -->
          <div v-if="hasDiscord" class="text-center space-y-4">
            <p class="text-body-secondary">
              Stay connected with our community and get notified when we're back online.
            </p>

            <button
              type="button"
              class="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-[var(--cyan)] text-[var(--bg-dark)] rounded-[var(--radius)] font-display font-medium tracking-wider uppercase hover:bg-[var(--cyan)]/90 transition-colors"
              @click="openDiscord"
            >
              Join Our Discord
            </button>
          </div>

          <!-- Fallback Message -->
          <div v-else class="text-center">
            <p class="text-body-secondary">
              We'll be back online shortly. Thank you for your patience.
            </p>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>
