<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { authService } from '@public/services/authService';
import { useToast } from 'primevue/usetoast';
import { usePasswordValidation } from '@public/composables/usePasswordValidation';
import Password from 'primevue/password';
import Message from 'primevue/message';

const route = useRoute();
const router = useRouter();
const toast = useToast();

const email = ref('');
const token = ref('');
const password = ref('');
const passwordConfirmation = ref('');

// Password validation
const { passwordErrors, isPasswordValid } = usePasswordValidation(password);

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
  return (
    password.value.trim() !== '' &&
    passwordConfirmation.value.trim() !== '' &&
    isPasswordValid.value
  );
});

const validatePassword = (): boolean => {
  passwordError.value = '';
  if (!password.value.trim()) {
    passwordError.value = 'Password is required';
    return false;
  }
  if (!isPasswordValid.value) {
    passwordError.value = 'Password does not meet requirements';
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
      detail: 'Your password has been reset successfully.',
      life: 5000,
    });

    // Redirect to login after a short delay
    setTimeout(() => {
      router.push('/login');
    }, 2000);
  } catch {
    errorMessage.value = 'Failed to reset password. Please try again or request a new reset link.';
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
        <h2 class="text-center text-3xl font-bold text-gray-900">Reset your password</h2>
        <p class="mt-2 text-center text-sm text-gray-600">Enter your new password below.</p>
      </div>

      <!-- Error Message -->
      <Message v-if="errorMessage" severity="error" :closable="false">
        {{ errorMessage }}
      </Message>

      <!-- Form -->
      <form class="mt-8 space-y-6" @submit.prevent="handleSubmit">
        <div class="space-y-4">
          <!-- Password Field -->
          <div>
            <label for="password" class="block text-sm font-medium text-gray-700">
              New Password
            </label>
            <Password
              id="password"
              v-model="password"
              placeholder="Enter your new password"
              :class="{ 'p-invalid': passwordError }"
              :pt="{
                root: { class: 'mt-1 w-full' },
                input: { class: 'w-full' },
              }"
              :disabled="isSubmitting"
              :toggle-mask="true"
              autocomplete="new-password"
              aria-label="New Password"
              @input="passwordError = ''"
            />

            <!-- Password Requirements -->
            <div v-if="password && passwordErrors.length > 0" class="mt-2 space-y-1">
              <p class="text-xs text-gray-600">Password must:</p>
              <ul class="space-y-1">
                <li
                  v-for="error in passwordErrors"
                  :key="error"
                  class="text-xs text-red-600 flex items-start"
                >
                  <span class="mr-2">•</span>
                  <span>{{ error }}</span>
                </li>
              </ul>
            </div>

            <!-- Success Check -->
            <div v-if="password && isPasswordValid" class="mt-2 flex items-center">
              <span class="text-xs text-green-600">✓ Password meets all requirements</span>
            </div>

            <small v-if="passwordError" class="text-red-600 mt-1 block text-sm">
              {{ passwordError }}
            </small>
          </div>

          <!-- Confirm Password Field -->
          <div>
            <label for="password-confirmation" class="block text-sm font-medium text-gray-700">
              Confirm New Password
            </label>
            <Password
              id="password-confirmation"
              v-model="passwordConfirmation"
              placeholder="Confirm your new password"
              :pt="{
                root: { class: 'mt-1 w-full' },
                input: { class: 'w-full' },
              }"
              :disabled="isSubmitting"
              :feedback="false"
              :toggle-mask="true"
              autocomplete="new-password"
              aria-label="Confirm Password"
              @input="passwordError = ''"
            />
          </div>
        </div>

        <!-- Submit Button -->
        <button
          type="submit"
          :disabled="!isFormValid || isSubmitting"
          class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
          :aria-busy="isSubmitting"
        >
          <span v-if="!isSubmitting">Reset Password</span>
          <span v-else>Resetting...</span>
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
