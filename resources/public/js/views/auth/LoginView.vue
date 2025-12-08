<script setup lang="ts">
import { ref, computed } from 'vue';
import { useAuthStore } from '@public/stores/authStore';
import { isAxiosError, hasValidationErrors, getErrorMessage } from '@public/types/errors';
import InputText from 'primevue/inputtext';
import Password from 'primevue/password';
import Checkbox from 'primevue/checkbox';
import Message from 'primevue/message';

const authStore = useAuthStore();

// Form data
const email = ref('');
const password = ref('');
const remember = ref(false);

// Form state
const isSubmitting = ref(false);
const errorMessage = ref('');
const emailError = ref('');
const passwordError = ref('');

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

  const isEmailValid = validateEmail();
  const isPasswordValid = validatePassword();

  if (!isEmailValid || !isPasswordValid) {
    return;
  }

  isSubmitting.value = true;

  try {
    await authStore.login({
      email: email.value.trim(),
      password: password.value,
      remember: remember.value,
    });

    // Note: authStore.login() will redirect to app subdomain automatically
    // This code won't execute after redirect, but keeping it for safety
  } catch (error: unknown) {
    if (isAxiosError(error)) {
      if (hasValidationErrors(error)) {
        errorMessage.value = 'Invalid email or password. Please try again.';
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
</script>

<template>
  <div class="min-h-screen flex items-center justify-center pattern-carbon p-4 md:p-8">
    <div class="w-full max-w-md">
      <div class="card-racing p-8 md:p-10">
        <!-- Header -->
        <div class="text-center mb-8">
          <h1 class="font-display text-3xl md:text-4xl mb-3 text-gold uppercase tracking-wider">
            Welcome Back
          </h1>
          <p class="font-body text-barrier">Sign in to your account</p>
        </div>

        <!-- Error Message -->
        <Message v-if="errorMessage" severity="error" :closable="false" class="mb-6">
          {{ errorMessage }}
        </Message>

        <!-- Login Form -->
        <form class="space-y-6" @submit.prevent="handleSubmit">
          <!-- Email Field -->
          <div>
            <label
              for="email"
              class="block font-display text-xs uppercase tracking-widest text-gold mb-2"
            >
              Email Address
            </label>
            <InputText
              id="email"
              v-model="email"
              type="email"
              placeholder="john@example.com"
              :class="{ 'p-invalid': emailError }"
              class="w-full bg-carbon border-tarmac text-pit-white focus:border-gold transition-colors"
              :disabled="isSubmitting"
              autocomplete="email"
              aria-label="Email Address"
              @input="emailError = ''"
            />
            <small v-if="emailError" class="text-dnf mt-1 block font-body text-sm">
              {{ emailError }}
            </small>
          </div>

          <!-- Password Field -->
          <div>
            <label
              for="password"
              class="block font-display text-xs uppercase tracking-widest text-gold mb-2"
            >
              Password
            </label>
            <Password
              id="password"
              v-model="password"
              placeholder="Enter your password"
              :class="{ 'p-invalid': passwordError }"
              input-class="w-full bg-carbon border-tarmac text-pit-white focus:border-gold"
              :pt="{
                root: { class: 'w-full' },
                input: { class: 'w-full' },
              }"
              :disabled="isSubmitting"
              :feedback="false"
              :toggle-mask="true"
              autocomplete="current-password"
              aria-label="Password"
              @input="passwordError = ''"
            />
            <small v-if="passwordError" class="text-dnf mt-1 block font-body text-sm">
              {{ passwordError }}
            </small>
          </div>

          <!-- Remember Me & Forgot Password -->
          <div class="flex items-center justify-between flex-wrap gap-4">
            <div class="flex items-center">
              <Checkbox
                v-model="remember"
                input-id="remember"
                :binary="true"
                :disabled="isSubmitting"
                aria-label="Remember me"
              />
              <label for="remember" class="ml-2 font-body text-sm text-barrier cursor-pointer">
                Remember me
              </label>
            </div>
            <router-link
              to="/forgot-password"
              class="font-body text-sm text-gold hover:text-gold-bright transition-colors"
            >
              Forgot password?
            </router-link>
          </div>

          <!-- Submit Button -->
          <button
            type="submit"
            :disabled="!isFormValid || isSubmitting"
            class="w-full btn btn-primary"
            :aria-busy="isSubmitting"
          >
            <span v-if="!isSubmitting">Sign In</span>
            <span v-else>Signing In...</span>
          </button>
        </form>

        <!-- Register Link -->
        <div class="mt-8 text-center">
          <p class="font-body text-sm text-barrier">
            Don't have an account?
            <router-link
              to="/register"
              class="text-gold hover:text-gold-bright transition-colors font-medium"
            >
              Sign up
            </router-link>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
