<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAdminStore } from '@admin/stores/adminStore';
import InputText from 'primevue/inputtext';
import Password from 'primevue/password';
import Button from 'primevue/button';
import Checkbox from 'primevue/checkbox';
import Message from 'primevue/message';
import { isAxiosError, hasValidationErrors, getErrorMessage } from '@admin/types/errors';

const router = useRouter();
const adminStore = useAdminStore();

// Form state
const email = ref('');
const password = ref('');
const remember = ref(false);

// UI state
const errorMessage = ref('');
const isSubmitting = ref(false);

// Validation
const emailError = ref('');
const passwordError = ref('');

const isFormValid = computed(() => {
  return email.value.trim() !== '' && password.value.trim() !== '';
});

/**
 * Validate email
 */
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

/**
 * Validate password
 */
const validatePassword = (): boolean => {
  passwordError.value = '';

  if (!password.value.trim()) {
    passwordError.value = 'Password is required';
    return false;
  }

  return true;
};

/**
 * Handle form submission
 */
const handleSubmit = async (): Promise<void> => {
  // Clear previous errors
  errorMessage.value = '';
  emailError.value = '';
  passwordError.value = '';

  // Validate form
  const isEmailValid = validateEmail();
  const isPasswordValid = validatePassword();

  if (!isEmailValid || !isPasswordValid) {
    return;
  }

  isSubmitting.value = true;

  try {
    await adminStore.login({
      email: email.value,
      password: password.value,
      remember: remember.value,
    });

    // Redirect to dashboard on success
    // Use replace to avoid adding to browser history
    await router.replace({ name: 'dashboard' });
  } catch (error: any) {
    // Handle different types of errors with user-friendly messages
    if (isAxiosError(error)) {
      if (hasValidationErrors(error)) {
        // Handle validation errors (422) - show server message or generic message
        const serverMessage = error.response?.data?.message;
        if (serverMessage && serverMessage.includes('credentials')) {
          errorMessage.value = 'Login unsuccessful. Please check your credentials and try again.';
        } else {
          errorMessage.value =
            serverMessage || 'Login unsuccessful. Please check your credentials and try again.';
        }
      } else if (error.response?.status === 401) {
        errorMessage.value = 'Login unsuccessful. Please check your credentials and try again.';
      } else if (error.response?.status === 429) {
        errorMessage.value = 'Too many login attempts. Please wait a moment and try again.';
      } else if (error.response?.status && error.response.status >= 500) {
        errorMessage.value = 'Server error. Please try again later.';
      } else {
        errorMessage.value = 'Login unsuccessful. Please check your credentials and try again.';
      }
    } else {
      // Handle other types of errors
      const message = getErrorMessage(
        error,
        'Login failed. Please check your credentials and try again.',
      );
      errorMessage.value = message;
    }
  } finally {
    isSubmitting.value = false;
  }
};

/**
 * Clear field error on input
 */
const clearEmailError = (): void => {
  emailError.value = '';
  errorMessage.value = '';
};

const clearPasswordError = (): void => {
  passwordError.value = '';
  errorMessage.value = '';
};
</script>

<template>
  <div
    class="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4"
  >
    <div class="w-full max-w-md">
      <!-- Login Card -->
      <div class="bg-white rounded-lg shadow-lg p-8">
        <!-- Logo/Header -->
        <div class="text-center mb-8">
          <div
            class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 mb-4"
          >
            <i class="pi pi-shield text-3xl text-blue-600"></i>
          </div>
          <h1 class="text-2xl font-bold text-gray-900 mb-2">Admin Login</h1>
          <p class="text-gray-600">Enter your credentials to access the admin panel</p>
        </div>

        <!-- Error Message -->
        <Message v-if="errorMessage" severity="error" :closable="false" class="mb-6">
          {{ errorMessage }}
        </Message>

        <!-- Login Form -->
        <form class="space-y-5" @submit.prevent="handleSubmit">
          <!-- Email Field -->
          <div>
            <label for="email" class="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <InputText
              id="email"
              v-model="email"
              type="email"
              placeholder="admin@example.com"
              :class="{ 'p-invalid': emailError }"
              class="w-full"
              :disabled="isSubmitting"
              autocomplete="email"
              @input="clearEmailError"
            />
            <small v-if="emailError" class="text-red-600 mt-1 block">
              {{ emailError }}
            </small>
          </div>

          <!-- Password Field -->
          <div>
            <label for="password" class="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <Password
              id="password"
              v-model="password"
              placeholder="Enter your password"
              :class="{ 'p-invalid': passwordError }"
              input-class="w-full"
              :pt="{
                root: { class: 'w-full' },
                input: { class: 'w-full' },
              }"
              :disabled="isSubmitting"
              :feedback="false"
              :toggle-mask="true"
              autocomplete="current-password"
              @input="clearPasswordError"
            />
            <small v-if="passwordError" class="text-red-600 mt-1 block">
              {{ passwordError }}
            </small>
          </div>

          <!-- Remember Me -->
          <div class="flex items-center">
            <Checkbox
              v-model="remember"
              input-id="remember"
              :binary="true"
              :disabled="isSubmitting"
            />
            <label for="remember" class="ml-2 text-sm text-gray-700 cursor-pointer">
              Remember me for 30 days
            </label>
          </div>

          <!-- Submit Button -->
          <Button
            type="submit"
            label="Sign In"
            icon="pi pi-sign-in"
            :loading="isSubmitting"
            :disabled="!isFormValid || isSubmitting"
            class="w-full"
            severity="primary"
          />
        </form>
      </div>

      <!-- Footer -->
      <div class="text-center mt-6">
        <p class="text-sm text-gray-600">Protected area. Authorized personnel only.</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Ensure PrimeVue components take full width */
:deep(.p-inputtext),
:deep(.p-password),
:deep(.p-password-input) {
  width: 100%;
}

/* Custom focus styles to match theme */
:deep(.p-inputtext:enabled:focus),
:deep(.p-password-input:enabled:focus) {
  border-color: #3b82f6;
  box-shadow: 0 0 0 0.2rem rgba(59, 130, 246, 0.25);
}

/* Error state */
:deep(.p-invalid.p-inputtext),
:deep(.p-invalid .p-inputtext) {
  border-color: #ef4444;
}

:deep(.p-invalid.p-inputtext:enabled:focus),
:deep(.p-invalid .p-inputtext:enabled:focus) {
  box-shadow: 0 0 0 0.2rem rgba(239, 68, 68, 0.25);
}

/* Button styling */
:deep(.p-button) {
  padding: 0.75rem 1.5rem;
  font-weight: 600;
}

/* Message styling */
:deep(.p-message) {
  border-radius: 0.5rem;
}

/* Checkbox styling */
:deep(.p-checkbox) {
  width: 1.25rem;
  height: 1.25rem;
}
</style>
