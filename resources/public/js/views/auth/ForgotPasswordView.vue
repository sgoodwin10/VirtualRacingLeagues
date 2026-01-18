<script setup lang="ts">
import { ref, computed } from 'vue';
import { authService } from '@public/services/authService';
import { useToast } from 'primevue/usetoast';
import InputText from 'primevue/inputtext';
import Message from 'primevue/message';

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
  <div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full space-y-8">
      <!-- Header -->
      <div>
        <h2 class="text-center text-3xl font-bold text-gray-900">Forgot your password?</h2>
        <p class="mt-2 text-center text-sm text-gray-600">
          Enter your email address and we'll send you a link to reset your password.
        </p>
      </div>

      <!-- Success Message -->
      <Message v-if="emailSent" severity="success" :closable="false">
        Password reset link has been sent to your email. Please check your inbox.
      </Message>

      <!-- Error Message -->
      <Message v-if="errorMessage" severity="error" :closable="false">
        {{ errorMessage }}
      </Message>

      <!-- Form -->
      <form v-if="!emailSent" class="mt-8 space-y-6" @submit.prevent="handleSubmit">
        <div>
          <label for="email" class="block text-sm font-medium text-gray-700"> Email address </label>
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

        <!-- Submit Button -->
        <button
          type="submit"
          :disabled="!isFormValid || isSubmitting"
          class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
          :aria-busy="isSubmitting"
        >
          <span v-if="!isSubmitting">Send Reset Link</span>
          <span v-else>Sending...</span>
        </button>
      </form>

      <!-- Back to Login -->
      <div class="text-center">
        <router-link to="/login" class="text-sm text-gray-600 hover:text-gray-900">
          Back to login
        </router-link>
      </div>
    </div>
  </div>
</template>
