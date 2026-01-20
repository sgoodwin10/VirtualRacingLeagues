<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { authService } from '@public/services/authService';
import { useToast } from 'primevue/usetoast';
import { usePasswordValidation } from '@public/composables/usePasswordValidation';
import BackgroundGrid from '@public/components/landing/BackgroundGrid.vue';
import LandingNav from '@public/components/landing/LandingNav.vue';
import VrlButton from '@public/components/common/buttons/VrlButton.vue';
import VrlPasswordInput from '@public/components/common/forms/VrlPasswordInput.vue';
import VrlAlert from '@public/components/common/alerts/VrlAlert.vue';
import VrlFormGroup from '@public/components/common/forms/VrlFormGroup.vue';
import VrlFormLabel from '@public/components/common/forms/VrlFormLabel.vue';
import VrlFormError from '@public/components/common/forms/VrlFormError.vue';

const route = useRoute();
const router = useRouter();
const toast = useToast();

const email = ref('');
const token = ref('');
const password = ref('');
const passwordConfirmation = ref('');

// Password validation
const { passwordErrors, isPasswordValid } = usePasswordValidation(password);

const isSubmitting = ref(false);
const errorMessage = ref('');
const passwordError = ref('');

onMounted(() => {
  email.value = (route.query.email as string) || '';
  token.value = (route.query.token as string) || '';

  if (!email.value || !token.value) {
    errorMessage.value = 'Invalid reset link. Please request a new password reset.';
  }
});

const isFormValid = computed(() => {
  return (
    password.value.trim() !== '' &&
    passwordConfirmation.value.trim() !== '' &&
    isPasswordValid.value
  );
});

const validatePassword = (): boolean => {
  passwordError.value = '';
  if (!password.value.trim()) {
    passwordError.value = 'Password is required';
    return false;
  }
  if (!isPasswordValid.value) {
    passwordError.value = 'Password does not meet requirements';
    return false;
  }
  if (password.value !== passwordConfirmation.value) {
    passwordError.value = 'Passwords do not match';
    return false;
  }
  return true;
};

const handleSubmit = async (): Promise<void> => {
  errorMessage.value = '';
  passwordError.value = '';

  if (!validatePassword()) {
    return;
  }

  isSubmitting.value = true;

  try {
    await authService.resetPassword({
      email: email.value,
      token: token.value,
      password: password.value,
      password_confirmation: passwordConfirmation.value,
    });

    toast.add({
      severity: 'success',
      summary: 'Password Reset Successful',
      detail: 'Your password has been reset successfully.',
      life: 5000,
    });

    // Redirect to login after a short delay
    setTimeout(() => {
      router.push('/login');
    }, 2000);
  } catch {
    errorMessage.value = 'Failed to reset password. Please try again or request a new reset link.';
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
          <h1 class="text-display-h2 text-center mb-2">Reset Password</h1>
          <p class="text-body-secondary text-center mb-8">Enter your new password below.</p>

          <!-- Invalid Link Error -->
          <VrlAlert
            v-if="!email || !token"
            type="error"
            title="Invalid Reset Link"
            message="This reset link is invalid or has expired. Please request a new password reset."
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
          <form class="space-y-6" @submit.prevent="handleSubmit">
            <!-- Password Field -->
            <VrlFormGroup>
              <VrlFormLabel for="password" :required="true">New Password</VrlFormLabel>
              <VrlPasswordInput
                id="password"
                v-model="password"
                placeholder="Enter your new password"
                :error="passwordError"
                :disabled="isSubmitting"
                autocomplete="new-password"
                @input="passwordError = ''"
              />

              <!-- Password Requirements -->
              <div
                v-if="password && passwordErrors.length > 0"
                class="mt-3 p-3 bg-[var(--bg-card)] rounded-[var(--radius)] border border-[var(--border)]"
              >
                <p
                  class="text-[0.75rem] text-[var(--text-secondary)] font-display tracking-wider uppercase mb-2"
                >
                  Password must:
                </p>
                <ul class="space-y-1">
                  <li
                    v-for="error in passwordErrors"
                    :key="error"
                    class="text-[0.8rem] text-[var(--red)] flex items-start gap-2"
                  >
                    <span class="text-[var(--red)]">•</span>
                    <span>{{ error }}</span>
                  </li>
                </ul>
              </div>

              <!-- Success Check -->
              <div v-if="password && isPasswordValid" class="mt-3 flex items-center gap-2">
                <span class="text-[var(--green)]">✓</span>
                <span class="text-[0.8rem] text-[var(--green)]"
                  >Password meets all requirements</span
                >
              </div>

              <VrlFormError v-if="passwordError" :error="passwordError" />
            </VrlFormGroup>

            <!-- Confirm Password Field -->
            <VrlFormGroup>
              <VrlFormLabel for="password-confirmation" :required="true"
                >Confirm New Password</VrlFormLabel
              >
              <VrlPasswordInput
                id="password-confirmation"
                v-model="passwordConfirmation"
                placeholder="Confirm your new password"
                :disabled="isSubmitting"
                autocomplete="new-password"
                @input="passwordError = ''"
              />
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
              {{ isSubmitting ? 'Resetting...' : 'Reset Password' }}
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
