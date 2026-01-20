<script setup lang="ts">
import { ref, computed } from 'vue';
import { authService } from '@public/services/authService';
import { useToast } from 'primevue/usetoast';
import BackgroundGrid from '@public/components/landing/BackgroundGrid.vue';
import LandingNav from '@public/components/landing/LandingNav.vue';
import VrlButton from '@public/components/common/buttons/VrlButton.vue';
import VrlInput from '@public/components/common/forms/VrlInput.vue';
import VrlAlert from '@public/components/common/alerts/VrlAlert.vue';
import VrlFormGroup from '@public/components/common/forms/VrlFormGroup.vue';
import VrlFormLabel from '@public/components/common/forms/VrlFormLabel.vue';
import VrlFormError from '@public/components/common/forms/VrlFormError.vue';

const toast = useToast();

const email = ref('');
const isSubmitting = ref(false);
const emailSent = ref(false);
const errorMessage = ref('');
const emailError = ref('');

const isFormValid = computed(() => email.value.trim() !== '');

const validateEmail = (): boolean => {
  emailError.value = '';
  if (!email.value.trim()) {
    emailError.value = 'Email is required';
    return false;
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.value)) {
    emailError.value = 'Please enter a valid email address';
    return false;
  }
  return true;
};

const handleSubmit = async (): Promise<void> => {
  errorMessage.value = '';
  emailError.value = '';

  if (!validateEmail()) {
    return;
  }

  isSubmitting.value = true;

  try {
    await authService.requestPasswordReset(email.value);
    emailSent.value = true;

    toast.add({
      severity: 'success',
      summary: 'Email Sent',
      detail: 'Password reset link has been sent to your email.',
      life: 5000,
    });
  } catch {
    errorMessage.value = 'Failed to send reset link. Please try again.';
  } finally {
    isSubmitting.value = false;
  }
};
</script>

<template>
  <div class="flex-1 bg-[var(--bg-dark)] text-[var(--text-primary)] overflow-x-hidden">
    <!-- Background Effects -->
    <BackgroundGrid />

    <!-- Navigation -->
    <LandingNav />

    <!-- Main Content -->
    <main class="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
      <div class="max-w-md mx-auto">
        <!-- Auth Card -->
        <div
          class="bg-[var(--bg-panel)] border border-[var(--border)] rounded-[var(--radius-lg)] p-8"
        >
          <!-- Header -->
          <h1 class="text-display-h2 text-center mb-2">Forgot Password?</h1>
          <p class="text-body-secondary text-center mb-8">
            Enter your email address and we'll send you a link to reset your password.
          </p>

          <!-- Success State -->
          <VrlAlert
            v-if="emailSent"
            type="success"
            title="Email Sent"
            message="Password reset link has been sent to your email. Please check your inbox."
            class="mb-6"
          />

          <!-- Error Message -->
          <VrlAlert
            v-if="errorMessage"
            type="error"
            title="Error"
            :message="errorMessage"
            class="mb-6"
          />

          <!-- Form -->
          <form v-if="!emailSent" class="space-y-6" @submit.prevent="handleSubmit">
            <!-- Email Field -->
            <VrlFormGroup>
              <VrlFormLabel for="email" :required="true">Email Address</VrlFormLabel>
              <VrlInput
                id="email"
                v-model="email"
                type="email"
                placeholder="john@example.com"
                :error="emailError"
                :disabled="isSubmitting"
                autocomplete="email"
                @input="emailError = ''"
              />
              <VrlFormError v-if="emailError" :error="emailError" />
            </VrlFormGroup>

            <!-- Submit Button -->
            <VrlButton
              type="submit"
              variant="primary"
              size="lg"
              :disabled="!isFormValid || isSubmitting"
              :loading="isSubmitting"
              class="w-full"
            >
              {{ isSubmitting ? 'Sending...' : 'Send Reset Link' }}
            </VrlButton>
          </form>

          <!-- Back to Login Link -->
          <div class="text-center mt-6">
            <router-link
              to="/login"
              class="text-[var(--text-secondary)] hover:text-[var(--cyan)] transition-colors inline-flex items-center gap-2"
            >
              <span>←</span>
              <span>Back to login</span>
            </router-link>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>
