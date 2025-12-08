<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { authService } from '@public/services/authService';
import { useToast } from 'primevue/usetoast';
import Password from 'primevue/password';
import Message from 'primevue/message';

const route = useRoute();
const router = useRouter();
const toast = useToast();

const email = ref('');
const token = ref('');
const password = ref('');
const passwordConfirmation = ref('');

const isSubmitting = ref(false);
const errorMessage = ref('');
const passwordError = ref('');

onMounted(() => {
  email.value = (route.query.email as string) || '';
  token.value = (route.query.token as string) || '';

  if (!email.value || !token.value) {
    errorMessage.value = 'Invalid reset link. Please request a new password reset.';
  }
});

const isFormValid = computed(() => {
  return password.value.trim() !== '' && passwordConfirmation.value.trim() !== '';
});

const validatePassword = (): boolean => {
  passwordError.value = '';
  if (!password.value.trim()) {
    passwordError.value = 'Password is required';
    return false;
  }
  if (password.value.length < 8) {
    passwordError.value = 'Password must be at least 8 characters';
    return false;
  }
  if (password.value !== passwordConfirmation.value) {
    passwordError.value = 'Passwords do not match';
    return false;
  }
  return true;
};

const handleSubmit = async (): Promise<void> => {
  errorMessage.value = '';
  passwordError.value = '';

  if (!validatePassword()) {
    return;
  }

  isSubmitting.value = true;

  try {
    await authService.resetPassword({
      email: email.value,
      token: token.value,
      password: password.value,
      password_confirmation: passwordConfirmation.value,
    });

    toast.add({
      severity: 'success',
      summary: 'Password Reset Successful',
      detail: 'Your password has been reset. You can now log in with your new password.',
      life: 5000,
    });

    router.push({ name: 'login' });
  } catch {
    errorMessage.value =
      'Failed to reset password. The link may have expired. Please request a new reset link.';
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
            <i class="pi pi-key text-3xl text-gold"></i>
          </div>
          <h1 class="font-display text-3xl md:text-4xl mb-3 text-gold uppercase tracking-wider">
            Reset Password
          </h1>
          <p class="font-body text-barrier">Enter your new password below</p>
        </div>

        <!-- Error Message -->
        <Message v-if="errorMessage" severity="error" :closable="false" class="mb-6">
          {{ errorMessage }}
        </Message>

        <!-- Form -->
        <form class="space-y-6" @submit.prevent="handleSubmit">
          <!-- Password Field -->
          <div>
            <label
              for="password"
              class="block font-display text-xs uppercase tracking-widest text-gold mb-2"
            >
              New Password
            </label>
            <Password
              id="password"
              v-model="password"
              placeholder="Enter your new password"
              :class="{ 'p-invalid': passwordError }"
              input-class="w-full bg-carbon border-tarmac text-pit-white focus:border-gold"
              :pt="{
                root: { class: 'w-full' },
                input: { class: 'w-full' },
              }"
              :disabled="isSubmitting"
              :toggle-mask="true"
              autocomplete="new-password"
              aria-label="New Password"
              @input="passwordError = ''"
            />
            <small v-if="passwordError" class="text-dnf mt-1 block font-body text-sm">
              {{ passwordError }}
            </small>
          </div>

          <!-- Confirm Password Field -->
          <div>
            <label
              for="password-confirmation"
              class="block font-display text-xs uppercase tracking-widest text-gold mb-2"
            >
              Confirm New Password
            </label>
            <Password
              id="password-confirmation"
              v-model="passwordConfirmation"
              placeholder="Confirm your new password"
              input-class="w-full bg-carbon border-tarmac text-pit-white focus:border-gold"
              :pt="{
                root: { class: 'w-full' },
                input: { class: 'w-full' },
              }"
              :disabled="isSubmitting"
              :feedback="false"
              :toggle-mask="true"
              autocomplete="new-password"
              aria-label="Confirm New Password"
              @input="passwordError = ''"
            />
          </div>

          <!-- Submit Button -->
          <button
            type="submit"
            :disabled="!isFormValid || isSubmitting"
            class="w-full btn btn-primary"
            :aria-busy="isSubmitting"
          >
            <span v-if="!isSubmitting">Reset Password</span>
            <span v-else>Resetting...</span>
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
