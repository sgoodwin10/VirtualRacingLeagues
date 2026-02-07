<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useAuthStore } from '@public/stores/authStore';
import { useRecaptcha } from '@public/composables/useRecaptcha';
import { isAxiosError, hasValidationErrors, getErrorMessage } from '@public/types/errors';
import BackgroundGrid from '@public/components/landing/BackgroundGrid.vue';
import LandingNav from '@public/components/landing/LandingNav.vue';
import VrlButton from '@public/components/common/buttons/VrlButton.vue';
import VrlInput from '@public/components/common/forms/VrlInput.vue';
import VrlPasswordInput from '@public/components/common/forms/VrlPasswordInput.vue';
import VrlCheckbox from '@public/components/common/forms/VrlCheckbox.vue';
import VrlAlert from '@public/components/common/alerts/VrlAlert.vue';
import VrlFormGroup from '@public/components/common/forms/VrlFormGroup.vue';
import VrlFormLabel from '@public/components/common/forms/VrlFormLabel.vue';
import VrlFormError from '@public/components/common/forms/VrlFormError.vue';

const authStore = useAuthStore();
const { executeRecaptcha, loadScript } = useRecaptcha();

// Form data
const email = ref('');
const password = ref('');
const remember = ref(false);

// Form state
const isSubmitting = ref(false);
const errorMessage = ref('');
const emailError = ref('');
const passwordError = ref('');
const recaptchaError = ref('');

const isFormValid = computed(() => {
  return email.value.trim() !== '' && password.value.trim() !== '';
});

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

const validatePassword = (): boolean => {
  passwordError.value = '';
  if (!password.value.trim()) {
    passwordError.value = 'Password is required';
    return false;
  }
  return true;
};

const handleSubmit = async (): Promise<void> => {
  errorMessage.value = '';
  emailError.value = '';
  passwordError.value = '';
  recaptchaError.value = '';

  const isEmailValid = validateEmail();
  const isPasswordValid = validatePassword();

  if (!isEmailValid || !isPasswordValid) {
    return;
  }

  isSubmitting.value = true;

  try {
    // Execute reCAPTCHA before login
    const recaptchaToken = await executeRecaptcha('login');

    await authStore.login({
      email: email.value.trim(),
      password: password.value,
      remember: remember.value,
      recaptcha_token: recaptchaToken,
    });

    // Note: authStore.login() will redirect to app subdomain automatically
    // This code won't execute after redirect, but keeping it for safety
  } catch (error: unknown) {
    if (isAxiosError(error)) {
      if (hasValidationErrors(error)) {
        const validationErrors = error.response?.data?.errors;
        if (validationErrors?.recaptcha_token) {
          recaptchaError.value = 'Security verification failed. Please try again.';
        } else {
          errorMessage.value = 'Invalid email or password. Please try again.';
        }
      } else if (error.response?.status === 401) {
        errorMessage.value = 'Invalid email or password. Please try again.';
      } else if (error.response?.status === 429) {
        errorMessage.value = 'Too many login attempts. Please wait a moment and try again.';
      } else if (error.response?.status && error.response.status >= 500) {
        errorMessage.value = 'Server error. Please try again later.';
      } else {
        errorMessage.value = 'Login failed. Please try again.';
      }
    } else {
      errorMessage.value = getErrorMessage(error, 'Login failed. Please try again.');
    }
  } finally {
    isSubmitting.value = false;
  }
};

onMounted(() => {
  loadScript();
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
      <div class="max-w-md mx-auto">
        <!-- Auth Card -->
        <div
          class="bg-[var(--bg-panel)] border border-[var(--border)] rounded-[var(--radius-lg)] p-8"
        >
          <!-- Header -->
          <h1 class="text-display-h2 text-center mb-2">Sign In</h1>
          <p class="text-body-secondary text-center mb-8">Welcome back to Virtual Racing Leagues</p>

          <!-- Error Message -->
          <VrlAlert
            v-if="errorMessage"
            type="error"
            title="Error"
            :message="errorMessage"
            class="mb-6"
          />

          <!-- reCAPTCHA Error -->
          <VrlAlert
            v-if="recaptchaError"
            type="error"
            title="Security Check Failed"
            :message="recaptchaError"
            class="mb-6"
          />

          <!-- Login Form -->
          <form class="space-y-6" @submit.prevent="handleSubmit">
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

            <!-- Password Field -->
            <VrlFormGroup>
              <VrlFormLabel for="password" :required="true">Password</VrlFormLabel>
              <VrlPasswordInput
                id="password"
                v-model="password"
                placeholder="Enter your password"
                :error="passwordError"
                :disabled="isSubmitting"
                autocomplete="current-password"
                @input="passwordError = ''"
              />
              <VrlFormError v-if="passwordError" :error="passwordError" />
            </VrlFormGroup>

            <!-- Remember Me & Forgot Password -->
            <div class="flex items-center justify-between mb-6">
              <VrlCheckbox v-model="remember" label="Remember me" :disabled="isSubmitting" />
              <router-link
                to="/forgot-password"
                class="text-[0.85rem] text-[var(--text-secondary)] hover:text-[var(--cyan)] transition-colors"
              >
                Forgot password?
              </router-link>
            </div>

            <!-- Submit Button -->
            <VrlButton
              type="submit"
              variant="primary"
              size="lg"
              :disabled="!isFormValid || isSubmitting"
              :loading="isSubmitting"
              class="w-full"
            >
              {{ isSubmitting ? 'Signing In...' : 'Sign In' }}
            </VrlButton>
          </form>

          <!-- Register Link -->
          <p class="text-center text-body-secondary mt-6">
            Don't have an account?
            <router-link to="/register" class="text-[var(--cyan)] hover:underline font-medium">
              Sign up
            </router-link>
          </p>
        </div>
      </div>
    </main>
  </div>
</template>
