<script setup lang="ts">
import { computed } from 'vue';
import { useSiteConfig } from '@public/composables/useSiteConfig';
import BackgroundGrid from '@public/components/landing/BackgroundGrid.vue';
import VrlAlert from '@public/components/common/alerts/VrlAlert.vue';
import VrlButton from '@public/components/common/buttons/VrlButton.vue';

const { siteName, maintenanceMessage, hasDiscord, discordUrl } = useSiteConfig();

const defaultMessage = computed(
  () =>
    `${siteName.value} is currently undergoing maintenance. We'll be back online shortly. Thank you for your patience.`,
);

const displayMessage = computed(() => {
  return maintenanceMessage.value.trim() || defaultMessage.value;
});

const openDiscord = (): void => {
  if (discordUrl.value) {
    window.open(discordUrl.value, '_blank');
  }
};
</script>

<template>
  <div class="flex-1 bg-[var(--bg-dark)] text-[var(--text-primary)] overflow-x-hidden">
    <!-- Background Effects -->
    <BackgroundGrid />

    <!-- Main Content -->
    <main class="flex items-center justify-center min-h-screen px-4 sm:px-6 lg:px-8 pt-24 pb-16">
      <div class="max-w-2xl w-full">
        <!-- Maintenance Card -->
        <div
          class="bg-[var(--bg-panel)] border border-[var(--border)] rounded-[var(--radius-lg)] p-8 md:p-12"
        >
          <!-- Icon/Logo Area -->
          <div class="text-center mb-8">
            <div
              class="inline-flex items-center justify-center w-20 h-20 rounded-full bg-[var(--cyan)]/10 border border-[var(--cyan)]/20 mb-6"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-10 w-10 text-[var(--cyan)]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </div>
            <h1 class="text-display-h1 mb-3">Under Maintenance</h1>
            <p class="text-body-secondary text-lg">We're making things better</p>
          </div>

          <!-- Maintenance Message -->
          <VrlAlert
            type="warning"
            title="Scheduled Maintenance"
            :message="displayMessage"
            class="mb-8"
          />

          <!-- Additional Info -->
          <div class="text-center space-y-6">
            <p class="text-body-secondary">
              We appreciate your understanding while we improve our services.
            </p>

            <!-- Discord Button (if available) -->
            <VrlButton
              v-if="hasDiscord"
              variant="primary"
              size="lg"
              class="w-full md:w-auto"
              @click="openDiscord"
            >
              Join Our Discord for Updates
            </VrlButton>

            <!-- Support Email (optional) -->
            <p class="text-sm text-body-secondary mt-6">
              Need immediate assistance?
              <a href="mailto:support@example.com" class="text-[var(--cyan)] hover:underline">
                Contact Support
              </a>
            </p>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>
