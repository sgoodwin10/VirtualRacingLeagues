<script setup lang="ts">
import { ref } from 'vue';
import { useAuthStore } from '@public/stores/authStore';
import { useToast } from 'primevue/usetoast';
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
  <div class="min-h-screen flex items-center justify-center pattern-carbon p-4 md:p-8">
    <div class="w-full max-w-md">
      <div class="card-racing p-8 md:p-10">
        <!-- Header -->
        <div class="text-center mb-8">
          <div
            class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-tarmac mb-4"
          >
            <i class="pi pi-envelope text-3xl text-gold"></i>
          </div>
          <h1 class="font-display text-3xl md:text-4xl mb-3 text-gold uppercase tracking-wider">
            Verify Your Email
          </h1>
          <p class="font-body text-barrier">
            We've sent a verification link to your email address. Please check your inbox and click
            the link to verify your account.
          </p>
        </div>

        <!-- Info Message -->
        <Message severity="info" :closable="false" class="mb-6">
          <p class="text-sm font-body">
            Didn't receive the email? Check your spam folder or request a new verification link.
          </p>
        </Message>

        <!-- Resend Button -->
        <button
          :disabled="isResending"
          class="w-full btn btn-primary"
          :aria-busy="isResending"
          @click="resendVerification"
        >
          <span v-if="!isResending">Resend Verification Email</span>
          <span v-else>Sending...</span>
        </button>

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
