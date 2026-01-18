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
  <div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full space-y-8">
      <!-- Header -->
      <div>
        <h2 class="text-center text-3xl font-bold text-gray-900">Sign in to your account</h2>
      </div>

      <!-- Error Message -->
      <Message v-if="errorMessage" severity="error" :closable="false">
        {{ errorMessage }}
      </Message>

      <!-- Login Form -->
      <form class="mt-8 space-y-6" @submit.prevent="handleSubmit">
        <div class="space-y-4">
          <!-- Email Field -->
          <div>
            <label for="email" class="block text-sm font-medium text-gray-700">
              Email address
            </label>
            <InputText
              id="email"
              v-model="email"
              type="email"
              placeholder="john@example.com"
              :class="{ 'p-invalid': emailError }"
              class="mt-1 w-full"
              :disabled="isSubmitting"
              autocomplete="email"
              aria-label="Email Address"
              @input="emailError = ''"
            />
            <small v-if="emailError" class="text-red-600 mt-1 block text-sm">
              {{ emailError }}
            </small>
          </div>

          <!-- Password Field -->
          <div>
            <label for="password" class="block text-sm font-medium text-gray-700"> Password </label>
            <Password
              id="password"
              v-model="password"
              placeholder="Enter your password"
              :class="{ 'p-invalid': passwordError }"
              :pt="{
                root: { class: 'mt-1 w-full' },
                input: { class: 'w-full' },
              }"
              :disabled="isSubmitting"
              :feedback="false"
              :toggle-mask="true"
              autocomplete="current-password"
              aria-label="Password"
              @input="passwordError = ''"
            />
            <small v-if="passwordError" class="text-red-600 mt-1 block text-sm">
              {{ passwordError }}
            </small>
          </div>
        </div>

        <!-- Remember Me & Forgot Password -->
        <div class="flex items-center justify-between">
          <div class="flex items-center">
            <Checkbox
              v-model="remember"
              input-id="remember"
              :binary="true"
              :disabled="isSubmitting"
              aria-label="Remember me"
            />
            <label for="remember" class="ml-2 text-sm text-gray-900 cursor-pointer">
              Remember me
            </label>
          </div>
          <div class="text-sm">
            <router-link to="/forgot-password" class="text-gray-600 hover:text-gray-900">
              Forgot password?
            </router-link>
          </div>
        </div>

        <!-- Submit Button -->
        <button
          type="submit"
          :disabled="!isFormValid || isSubmitting"
          class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
          :aria-busy="isSubmitting"
        >
          <span v-if="!isSubmitting">Sign In</span>
          <span v-else>Signing In...</span>
        </button>
      </form>

      <!-- Register Link -->
      <div class="text-center">
        <p class="text-sm text-gray-600">
          Don't have an account?
          <router-link to="/register" class="font-medium text-gray-900 hover:text-gray-700">
            Sign up
          </router-link>
        </p>
      </div>
    </div>
  </div>
</template>
