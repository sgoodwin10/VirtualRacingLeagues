<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { authService } from '@public/services/authService';
import { useToast } from 'primevue/usetoast';
import Password from 'primevue/password';
import Button from 'primevue/button';
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
            <i class="pi pi-key text-3xl text-blue-600"></i>
          </div>
          <h1 class="text-2xl font-bold text-gray-900 mb-2">Reset Password</h1>
          <p class="text-gray-600">Enter your new password below</p>
        </div>

        <!-- Error Message -->
        <Message v-if="errorMessage" severity="error" :closable="false" class="mb-6">
          {{ errorMessage }}
        </Message>

        <!-- Form -->
        <form class="space-y-5" @submit.prevent="handleSubmit">
          <!-- Password Field -->
          <div>
            <label for="password" class="block text-sm font-medium text-gray-700 mb-2">
              New Password
            </label>
            <Password
              id="password"
              v-model="password"
              placeholder="Enter your new password"
              :class="{ 'p-invalid': passwordError }"
              input-class="w-full"
              :pt="{
                root: { class: 'w-full' },
                input: { class: 'w-full' },
              }"
              :disabled="isSubmitting"
              :toggle-mask="true"
              autocomplete="new-password"
              @input="passwordError = ''"
            />
            <small v-if="passwordError" class="text-red-600 mt-1 block">
              {{ passwordError }}
            </small>
          </div>

          <!-- Confirm Password Field -->
          <div>
            <label for="password-confirmation" class="block text-sm font-medium text-gray-700 mb-2">
              Confirm New Password
            </label>
            <Password
              id="password-confirmation"
              v-model="passwordConfirmation"
              placeholder="Confirm your new password"
              input-class="w-full"
              :pt="{
                root: { class: 'w-full' },
                input: { class: 'w-full' },
              }"
              :disabled="isSubmitting"
              :feedback="false"
              :toggle-mask="true"
              autocomplete="new-password"
              @input="passwordError = ''"
            />
          </div>

          <!-- Submit Button -->
          <Button
            type="submit"
            label="Reset Password"
            icon="pi pi-check"
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
