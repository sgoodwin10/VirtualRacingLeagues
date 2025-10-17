<script setup lang="ts">
import { ref } from 'vue';
import { useAuthStore } from '@public/stores/authStore';
import { useToast } from 'primevue/usetoast';
import Button from 'primevue/button';
import Message from 'primevue/message';

const authStore = useAuthStore();
const toast = useToast();

const isResending = ref(false);

const resendVerification = async (): Promise<void> => {
  isResending.value = true;

  try {
    await authStore.resendVerificationEmail();

    toast.add({
      severity: 'success',
      summary: 'Email Sent',
      detail: 'A new verification link has been sent to your email address.',
      life: 5000,
    });
  } catch {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to resend verification email. Please try again.',
      life: 5000,
    });
  } finally {
    isResending.value = false;
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
            <i class="pi pi-envelope text-3xl text-blue-600"></i>
          </div>
          <h1 class="text-2xl font-bold text-gray-900 mb-2">Verify Your Email</h1>
          <p class="text-gray-600">
            We've sent a verification link to your email address. Please check your inbox and click
            the link to verify your account.
          </p>
        </div>

        <!-- Info Message -->
        <Message severity="info" :closable="false" class="mb-6">
          <p class="text-sm">
            Didn't receive the email? Check your spam folder or request a new verification link.
          </p>
        </Message>

        <!-- Resend Button -->
        <Button
          label="Resend Verification Email"
          icon="pi pi-refresh"
          :loading="isResending"
          :disabled="isResending"
          class="w-full"
          severity="primary"
          @click="resendVerification"
        />

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
