<script setup lang="ts">
import { ref, computed } from 'vue';
import { useAuthStore } from '@public/stores/authStore';
import { isAxiosError, hasValidationErrors, getErrorMessage } from '@public/types/errors';
import { usePasswordValidation } from '@public/composables/usePasswordValidation';
import InputText from 'primevue/inputtext';
import Password from 'primevue/password';
import Message from 'primevue/message';

const authStore = useAuthStore();

// Form data
const firstName = ref('');
const lastName = ref('');
const email = ref('');
const password = ref('');
const passwordConfirmation = ref('');

// Password validation
const { passwordErrors, isPasswordValid } = usePasswordValidation(password);

// Form state
const isSubmitting = ref(false);
const errorMessage = ref('');
const firstNameError = ref('');
const lastNameError = ref('');
const emailError = ref('');
const passwordError = ref('');

const isFormValid = computed(() => {
  return (
    firstName.value.trim() !== '' &&
    lastName.value.trim() !== '' &&
    email.value.trim() !== '' &&
    password.value.trim() !== '' &&
    passwordConfirmation.value.trim() !== '' &&
    isPasswordValid.value
  );
});

const validateFirstName = (): boolean => {
  firstNameError.value = '';
  if (!firstName.value.trim()) {
    firstNameError.value = 'First name is required';
    return false;
  }
  return true;
};

const validateLastName = (): boolean => {
  lastNameError.value = '';
  if (!lastName.value.trim()) {
    lastNameError.value = 'Last name is required';
    return false;
  }
  return true;
};

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
  firstNameError.value = '';
  lastNameError.value = '';
  emailError.value = '';
  passwordError.value = '';

  const isFirstNameValid = validateFirstName();
  const isLastNameValid = validateLastName();
  const isEmailValid = validateEmail();
  const isPasswordValidated = validatePassword();

  if (!isFirstNameValid || !isLastNameValid || !isEmailValid || !isPasswordValidated) {
    return;
  }

  isSubmitting.value = true;

  try {
    await authStore.register({
      first_name: firstName.value.trim(),
      last_name: lastName.value.trim(),
      email: email.value.trim(),
      password: password.value,
      password_confirmation: passwordConfirmation.value,
    });

    // Redirect is handled by authStore.register()
  } catch (error: unknown) {
    if (isAxiosError(error)) {
      if (hasValidationErrors(error)) {
        const validationErrors = error.response?.data?.errors;
        if (validationErrors) {
          if (validationErrors.email && Array.isArray(validationErrors.email)) {
            emailError.value = validationErrors.email[0];
          }
          if (validationErrors.password && Array.isArray(validationErrors.password)) {
            passwordError.value = validationErrors.password[0];
          }
          if (validationErrors.first_name && Array.isArray(validationErrors.first_name)) {
            firstNameError.value = validationErrors.first_name[0];
          }
          if (validationErrors.last_name && Array.isArray(validationErrors.last_name)) {
            lastNameError.value = validationErrors.last_name[0];
          }
        }
      } else if (error.response?.status && error.response.status >= 500) {
        errorMessage.value = 'Server error. Please try again later.';
      } else {
        errorMessage.value = 'Registration failed. Please try again.';
      }
    } else {
      errorMessage.value = getErrorMessage(error, 'Registration failed. Please try again.');
    }
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
        <h2 class="text-center text-3xl font-bold text-gray-900">Create your account</h2>
      </div>

      <!-- Error Message -->
      <Message v-if="errorMessage" severity="error" :closable="false">
        {{ errorMessage }}
      </Message>

      <!-- Registration Form -->
      <form class="mt-8 space-y-6" @submit.prevent="handleSubmit">
        <div class="space-y-4">
          <!-- First Name Field -->
          <div>
            <label for="first-name" class="block text-sm font-medium text-gray-700">
              First Name
            </label>
            <InputText
              id="first-name"
              v-model="firstName"
              type="text"
              placeholder="John"
              :class="{ 'p-invalid': firstNameError }"
              class="mt-1 w-full"
              :disabled="isSubmitting"
              aria-label="First Name"
              @input="firstNameError = ''"
            />
            <small v-if="firstNameError" class="text-red-600 mt-1 block text-sm">
              {{ firstNameError }}
            </small>
          </div>

          <!-- Last Name Field -->
          <div>
            <label for="last-name" class="block text-sm font-medium text-gray-700">
              Last Name
            </label>
            <InputText
              id="last-name"
              v-model="lastName"
              type="text"
              placeholder="Doe"
              :class="{ 'p-invalid': lastNameError }"
              class="mt-1 w-full"
              :disabled="isSubmitting"
              aria-label="Last Name"
              @input="lastNameError = ''"
            />
            <small v-if="lastNameError" class="text-red-600 mt-1 block text-sm">
              {{ lastNameError }}
            </small>
          </div>

          <!-- Email Field -->
          <div>
            <label for="email" class="block text-sm font-medium text-gray-700">
              Email address
            </label>
            <InputText
              id="email"
              v-model="email"
              type="email"
              placeholder="john@example.com"
              :class="{ 'p-invalid': emailError }"
              class="mt-1 w-full"
              :disabled="isSubmitting"
              autocomplete="email"
              aria-label="Email Address"
              @input="emailError = ''"
            />
            <small v-if="emailError" class="text-red-600 mt-1 block text-sm">
              {{ emailError }}
            </small>
          </div>

          <!-- Password Field -->
          <div>
            <label for="password" class="block text-sm font-medium text-gray-700"> Password </label>
            <Password
              id="password"
              v-model="password"
              placeholder="Enter your password"
              :class="{ 'p-invalid': passwordError }"
              :pt="{
                root: { class: 'mt-1 w-full' },
                input: { class: 'w-full' },
              }"
              :disabled="isSubmitting"
              :toggle-mask="true"
              autocomplete="new-password"
              aria-label="Password"
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
              Confirm Password
            </label>
            <Password
              id="password-confirmation"
              v-model="passwordConfirmation"
              placeholder="Confirm your password"
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
          <span v-if="!isSubmitting">Create Account</span>
          <span v-else>Creating Account...</span>
        </button>
      </form>

      <!-- Login Link -->
      <div class="text-center">
        <p class="text-sm text-gray-600">
          Already have an account?
          <router-link to="/login" class="font-medium text-gray-900 hover:text-gray-700">
            Sign in
          </router-link>
        </p>
      </div>
    </div>
  </div>
</template>
