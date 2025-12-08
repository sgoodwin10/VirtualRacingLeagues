<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '@public/stores/authStore';
import Message from 'primevue/message';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

const isLoading = ref(true);
const status = ref<'success' | 'error' | null>(null);
const reason = ref<string>('');

// Computed
const isSuccess = computed(() => status.value === 'success');
const isError = computed(() => status.value === 'error');

const errorMessage = computed(() => {
  if (!isError.value) return '';

  // Map common error reasons to user-friendly messages
  const errorMessages: Record<string, string> = {
    'invalid-token': 'The verification link is invalid or has expired.',
    'already-verified': 'Your email has already been verified.',
    expired: 'The verification link has expired. Please request a new one.',
    'not-found': 'We could not find your account. Please try registering again.',
  };

  return (
    errorMessages[reason.value] || reason.value || 'Email verification failed. Please try again.'
  );
});

// Helper to get app subdomain URL
const getAppSubdomainUrl = (): string => {
  return `http://${import.meta.env.VITE_APP_DOMAIN}`;
};

// Actions
const goToDashboard = async (): Promise<void> => {
  // Redirect to app subdomain
  window.location.href = getAppSubdomainUrl();
};

const goToLogin = async (): Promise<void> => {
  await router.push({ name: 'login' });
};

const goToVerifyEmail = async (): Promise<void> => {
  await router.push({ name: 'verify-email' });
};

// Lifecycle
onMounted(() => {
  // Read query parameters
  const statusParam = route.query.status as string;
  const reasonParam = route.query.reason as string;

  if (statusParam === 'success') {
    status.value = 'success';
    // Refresh user state after successful verification
    authStore.checkAuth().catch(() => {
      // Silently fail - user might not be logged in
    });
  } else if (statusParam === 'error') {
    status.value = 'error';
    reason.value = reasonParam || '';
  } else {
    // No valid status parameter, redirect to verify-email page
    router.replace({ name: 'verify-email' });
    return;
  }

  isLoading.value = false;
});
</script>

<template>
  <div class="min-h-screen flex items-center justify-center pattern-carbon p-4 md:p-8">
    <div class="w-full max-w-md">
      <div class="card-racing p-8 md:p-10">
        <!-- Loading State -->
        <div v-if="isLoading" class="text-center">
          <div
            class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-tarmac mb-4"
          >
            <i class="pi pi-spin pi-spinner text-3xl text-gold"></i>
          </div>
          <h1 class="font-display text-3xl md:text-4xl mb-3 text-gold uppercase tracking-wider">
            Verifying Email
          </h1>
          <p class="font-body text-barrier">Please wait while we verify your email address...</p>
        </div>

        <!-- Success State -->
        <div v-if="!isLoading && isSuccess" class="text-center">
          <div
            class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-tarmac mb-4"
          >
            <i class="pi pi-check-circle text-4xl text-gold"></i>
          </div>
          <h1 class="font-display text-3xl md:text-4xl mb-3 text-gold uppercase tracking-wider">
            Email Verified!
          </h1>
          <p class="font-body text-barrier mb-6">
            Your email address has been successfully verified. You can now access all features of
            your account.
          </p>

          <!-- Success Message -->
          <Message severity="success" :closable="false" class="mb-6">
            <p class="text-sm font-body">
              Thank you for verifying your email address. Your account is now fully activated.
            </p>
          </Message>

          <!-- Go to Dashboard Button -->
          <button class="w-full btn btn-primary" @click="goToDashboard">Go to Dashboard</button>
        </div>

        <!-- Error State -->
        <div v-if="!isLoading && isError" class="text-center">
          <div
            class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-tarmac mb-4"
          >
            <i class="pi pi-times-circle text-4xl text-dnf"></i>
          </div>
          <h1 class="font-display text-3xl md:text-4xl mb-3 text-dnf uppercase tracking-wider">
            Verification Failed
          </h1>
          <p class="font-body text-barrier mb-6">
            We encountered an issue while verifying your email address.
          </p>

          <!-- Error Message -->
          <Message severity="error" :closable="false" class="mb-6">
            <p class="text-sm font-body">{{ errorMessage }}</p>
          </Message>

          <!-- Action Buttons -->
          <div class="space-y-3">
            <button class="w-full btn btn-primary" @click="goToVerifyEmail">
              Request New Verification Email
            </button>
            <button class="w-full btn btn-secondary" @click="goToLogin">Go to Login</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
