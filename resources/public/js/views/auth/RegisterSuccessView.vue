<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { PhCheckCircle, PhEnvelopeSimple, PhArrowRight } from '@phosphor-icons/vue';
import BackgroundGrid from '@public/components/landing/BackgroundGrid.vue';
import LandingNav from '@public/components/landing/LandingNav.vue';
import VrlButton from '@public/components/common/buttons/VrlButton.vue';
import VrlAlert from '@public/components/common/alerts/VrlAlert.vue';

/**
 * RegisterSuccessView Component
 *
 * Displays a success message after successful registration.
 * Provides clear next steps and instructions for email verification.
 */

const router = useRouter();

// Get user email from route query (passed from registration)
const userEmail = computed(() => router.currentRoute.value.query.email as string | undefined);

const handleLoginRedirect = () => {
  router.push('/login');
};

const handleCheckEmail = () => {
  // This will open the user's default email client
  window.location.href = 'mailto:';
};

// Expose methods for testing
defineExpose({
  handleLoginRedirect,
  handleCheckEmail,
});
</script>

<template>
  <div class="flex-1 bg-[var(--bg-dark)] text-[var(--text-primary)] overflow-x-hidden">
    <!-- Background Effects -->
    <BackgroundGrid />

    <!-- Navigation -->
    <LandingNav />

    <!-- Main Content -->
    <main class="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
      <div class="max-w-2xl mx-auto">
        <!-- Success Card -->
        <div
          class="bg-[var(--bg-panel)] border border-[var(--border)] rounded-[var(--radius-lg)] p-8 sm:p-12"
        >
          <!-- Success Icon -->
          <div class="flex justify-center mb-6">
            <div
              class="w-20 h-20 rounded-full bg-[var(--green-dim)] border-2 border-[var(--green)] flex items-center justify-center"
            >
              <PhCheckCircle :size="48" class="text-[var(--green)]" weight="fill" />
            </div>
          </div>

          <!-- Header -->
          <h1 class="text-display-h1 text-center mb-3">Welcome to Virtual Racing Leagues!</h1>
          <p class="text-body-lg text-center text-[var(--text-secondary)] mb-8">
            Your account has been created successfully
          </p>

          <!-- Success Message -->
          <div class="mb-8">
            <VrlAlert
              type="success"
              title="Registration Complete"
              :message="
                userEmail
                  ? `We've sent a confirmation email to ${userEmail}. Please check your email and click the verification link to activate your account.`
                  : `We've sent a confirmation email to your inbox. Please check your email and click the verification link to activate your account.`
              "
            />
          </div>

          <!-- What's Next Section -->
          <div class="mb-8">
            <h2 class="text-display-h4 mb-4 flex items-center gap-2">
              <PhEnvelopeSimple :size="24" class="text-[var(--cyan)]" />
              What happens next?
            </h2>
            <div class="space-y-4">
              <!-- Step 1 -->
              <div class="flex gap-4">
                <div
                  class="flex-shrink-0 w-8 h-8 rounded-full bg-[var(--cyan-dim)] border border-[var(--cyan)] flex items-center justify-center font-[var(--font-display)] font-bold text-[var(--cyan)]"
                >
                  1
                </div>
                <div class="flex-1 pt-1">
                  <h3 class="font-[var(--font-display)] font-semibold mb-1">Check your email</h3>
                  <p class="text-[0.9rem] text-[var(--text-secondary)]">
                    Look for an email from Virtual Racing Leagues in your inbox. Don't forget to
                    check your spam folder if you don't see it within a few minutes.
                  </p>
                </div>
              </div>

              <!-- Step 2 -->
              <div class="flex gap-4">
                <div
                  class="flex-shrink-0 w-8 h-8 rounded-full bg-[var(--cyan-dim)] border border-[var(--cyan)] flex items-center justify-center font-[var(--font-display)] font-bold text-[var(--cyan)]"
                >
                  2
                </div>
                <div class="flex-1 pt-1">
                  <h3 class="font-[var(--font-display)] font-semibold mb-1">
                    Verify your email address
                  </h3>
                  <p class="text-[0.9rem] text-[var(--text-secondary)]">
                    Click the verification link in the email to confirm your email address and
                    activate your account.
                  </p>
                </div>
              </div>

              <!-- Step 3 -->
              <div class="flex gap-4">
                <div
                  class="flex-shrink-0 w-8 h-8 rounded-full bg-[var(--cyan-dim)] border border-[var(--cyan)] flex items-center justify-center font-[var(--font-display)] font-bold text-[var(--cyan)]"
                >
                  3
                </div>
                <div class="flex-1 pt-1">
                  <h3 class="font-[var(--font-display)] font-semibold mb-1">Start racing!</h3>
                  <p class="text-[0.9rem] text-[var(--text-secondary)]">
                    Once verified, sign in to your dashboard to join leagues, track your progress,
                    and compete with racers around the world.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="flex flex-col sm:flex-row gap-4 mb-6">
            <VrlButton
              variant="primary"
              size="lg"
              :icon="PhEnvelopeSimple"
              class="flex-1 justify-center"
              @click="handleCheckEmail"
            >
              Open Email Client
            </VrlButton>
            <VrlButton
              variant="outline"
              size="lg"
              :icon="PhArrowRight"
              icon-pos="right"
              class="flex-1 justify-center"
              @click="handleLoginRedirect"
            >
              Continue to Login
            </VrlButton>
          </div>

          <!-- Help Text -->
          <div
            class="text-center text-[0.85rem] text-[var(--text-secondary)] p-4 bg-[var(--bg-card)] rounded-[var(--radius)] border border-[var(--border)]"
          >
            <p class="mb-2">
              <strong class="text-[var(--text-primary)]">Didn't receive the email?</strong>
            </p>
            <p>
              Check your spam folder or wait a few minutes. If you still don't receive it,
              <router-link to="/login" class="text-[var(--cyan)] hover:underline">
                contact support
              </router-link>
              for assistance.
            </p>
          </div>
        </div>

        <!-- Additional Info -->
        <div class="mt-8 text-center">
          <p class="text-body-secondary">
            Already verified?
            <router-link to="/login" class="text-[var(--cyan)] hover:underline font-medium">
              Sign in now
            </router-link>
          </p>
        </div>
      </div>
    </main>
  </div>
</template>
