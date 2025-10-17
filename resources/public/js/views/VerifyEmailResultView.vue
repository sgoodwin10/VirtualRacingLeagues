<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '@public/stores/authStore';
import Button from 'primevue/button';
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
  const domain = import.meta.env.VITE_APP_DOMAIN || 'generictemplate.localhost:8000';
  return `http://app.${domain}`;
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
  <div
    class="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 p-4"
  >
    <div class="w-full max-w-md">
      <div class="bg-white rounded-lg shadow-lg p-8">
        <!-- Loading State -->
        <div v-if="isLoading" class="text-center">
          <div
            class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 mb-4"
          >
            <i class="pi pi-spin pi-spinner text-3xl text-blue-600"></i>
          </div>
          <h1 class="text-2xl font-bold text-gray-900 mb-2">Verifying Email</h1>
          <p class="text-gray-600">Please wait while we verify your email address...</p>
        </div>

        <!-- Success State -->
        <div v-if="!isLoading && isSuccess" class="text-center">
          <div
            class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4"
          >
            <i class="pi pi-check-circle text-4xl text-green-600"></i>
          </div>
          <h1 class="text-2xl font-bold text-gray-900 mb-2">Email Verified Successfully!</h1>
          <p class="text-gray-600 mb-6">
            Your email address has been successfully verified. You can now access all features of
            your account.
          </p>

          <!-- Success Message -->
          <Message severity="success" :closable="false" class="mb-6">
            <p class="text-sm">
              Thank you for verifying your email address. Your account is now fully activated.
            </p>
          </Message>

          <!-- Go to Dashboard Button -->
          <Button
            label="Go to Dashboard"
            icon="pi pi-home"
            class="w-full"
            severity="primary"
            @click="goToDashboard"
          />
        </div>

        <!-- Error State -->
        <div v-if="!isLoading && isError" class="text-center">
          <div
            class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-4"
          >
            <i class="pi pi-times-circle text-4xl text-red-600"></i>
          </div>
          <h1 class="text-2xl font-bold text-gray-900 mb-2">Verification Failed</h1>
          <p class="text-gray-600 mb-6">
            We encountered an issue while verifying your email address.
          </p>

          <!-- Error Message -->
          <Message severity="error" :closable="false" class="mb-6">
            <p class="text-sm">{{ errorMessage }}</p>
          </Message>

          <!-- Action Buttons -->
          <div class="space-y-3">
            <Button
              label="Request New Verification Email"
              icon="pi pi-envelope"
              class="w-full"
              severity="primary"
              @click="goToVerifyEmail"
            />
            <Button
              label="Go to Login"
              icon="pi pi-sign-in"
              class="w-full"
              severity="secondary"
              outlined
              @click="goToLogin"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
