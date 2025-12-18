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
const { passwordStrength, passwordErrors, isPasswordValid } = usePasswordValidation(password);

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

            <!-- Password Strength Indicator -->
            <div v-if="password" class="mt-2">
              <div class="flex items-center justify-between mb-1">
                <span class="text-xs font-body text-barrier">Password Strength:</span>
                <span
                  class="text-xs font-display uppercase tracking-wider font-semibold"
                  :style="{ color: passwordStrength.color }"
                >
                  {{ passwordStrength.label }}
                </span>
              </div>
              <div class="w-full h-1.5 bg-tarmac rounded-full overflow-hidden">
                <div
                  class="h-full transition-all duration-300 ease-out rounded-full"
                  :style="{
                    width: `${(passwordStrength.score / 4) * 100}%`,
                    backgroundColor: passwordStrength.color,
                  }"
                />
              </div>
            </div>

            <!-- Password Requirements -->
            <div v-if="password && passwordErrors.length > 0" class="mt-3 space-y-1">
              <p class="text-xs font-body text-barrier mb-1.5">Password must:</p>
              <ul class="space-y-1">
                <li
                  v-for="error in passwordErrors"
                  :key="error"
                  class="text-xs font-body text-dnf flex items-start"
                >
                  <i class="pi pi-times-circle text-dnf mr-2 mt-0.5 text-[10px]"></i>
                  <span>{{ error }}</span>
                </li>
              </ul>
            </div>

            <!-- Success Check -->
            <div v-if="password && isPasswordValid" class="mt-2 flex items-center">
              <i class="pi pi-check-circle text-pole mr-2 text-sm"></i>
              <span class="text-xs font-body text-pole">Password meets all requirements</span>
            </div>

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
