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
  <div class="min-h-screen flex items-center justify-center pattern-carbon p-4 md:p-8">
    <div class="w-full max-w-md">
      <div class="card-racing p-8 md:p-10">
        <!-- Header -->
        <div class="text-center mb-8">
          <div
            class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-tarmac mb-4"
          >
            <i class="pi pi-lock text-3xl text-gold"></i>
          </div>
          <h1 class="font-display text-3xl md:text-4xl mb-3 text-gold uppercase tracking-wider">
            Forgot Password?
          </h1>
          <p class="font-body text-barrier">
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
        <form v-if="!emailSent" class="space-y-6" @submit.prevent="handleSubmit">
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

          <!-- Submit Button -->
          <button
            type="submit"
            :disabled="!isFormValid || isSubmitting"
            class="w-full btn btn-primary"
            :aria-busy="isSubmitting"
          >
            <span v-if="!isSubmitting">Send Reset Link</span>
            <span v-else>Sending...</span>
          </button>
        </form>

        <!-- Back to Login -->
        <div class="mt-8 text-center">
          <router-link
            to="/login"
            class="font-body text-sm text-gold hover:text-gold-bright transition-colors"
          >
            Back to Login
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>
