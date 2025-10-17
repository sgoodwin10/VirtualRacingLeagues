<script setup lang="ts">
import { ref, computed } from 'vue';
import { authService } from '@public/services/authService';
import { useToast } from 'primevue/usetoast';
import InputText from 'primevue/inputtext';
import Button from 'primevue/button';
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
  <div
    class="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 p-4"
  >
    <div class="w-full max-w-md">
      <div class="bg-white rounded-lg shadow-lg p-8">
        <!-- Header -->
        <div class="text-center mb-8">
          <div
            class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 mb-4"
          >
            <i class="pi pi-lock text-3xl text-blue-600"></i>
          </div>
          <h1 class="text-2xl font-bold text-gray-900 mb-2">Forgot Password?</h1>
          <p class="text-gray-600">
            Enter your email address and we'll send you a link to reset your password.
          </p>
        </div>

        <!-- Success Message -->
        <Message v-if="emailSent" severity="success" :closable="false" class="mb-6">
          Password reset link has been sent to your email. Please check your inbox.
        </Message>

        <!-- Error Message -->
        <Message v-if="errorMessage" severity="error" :closable="false" class="mb-6">
          {{ errorMessage }}
        </Message>

        <!-- Form -->
        <form v-if="!emailSent" class="space-y-5" @submit.prevent="handleSubmit">
          <!-- Email Field -->
          <div>
            <label for="email" class="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <InputText
              id="email"
              v-model="email"
              type="email"
              placeholder="john@example.com"
              :class="{ 'p-invalid': emailError }"
              class="w-full"
              :disabled="isSubmitting"
              autocomplete="email"
              @input="emailError = ''"
            />
            <small v-if="emailError" class="text-red-600 mt-1 block">
              {{ emailError }}
            </small>
          </div>

          <!-- Submit Button -->
          <Button
            type="submit"
            label="Send Reset Link"
            icon="pi pi-send"
            :loading="isSubmitting"
            :disabled="!isFormValid || isSubmitting"
            class="w-full"
            severity="primary"
          />
        </form>

        <!-- Back to Login -->
        <div class="mt-6 text-center">
          <router-link to="/login" class="text-sm text-blue-600 hover:text-blue-700 font-medium">
            Back to Login
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>
