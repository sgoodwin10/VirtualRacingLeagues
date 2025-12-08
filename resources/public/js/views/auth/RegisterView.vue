<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@public/stores/authStore';
import { useToast } from 'primevue/usetoast';
import { isAxiosError, hasValidationErrors, getErrorMessage } from '@public/types/errors';
import InputText from 'primevue/inputtext';
import Password from 'primevue/password';
import Message from 'primevue/message';

const router = useRouter();
const authStore = useAuthStore();
const toast = useToast();

// Form data
const firstName = ref('');
const lastName = ref('');
const email = ref('');
const password = ref('');
const passwordConfirmation = ref('');

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
    passwordConfirmation.value.trim() !== ''
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
  firstNameError.value = '';
  lastNameError.value = '';
  emailError.value = '';
  passwordError.value = '';

  const isFirstNameValid = validateFirstName();
  const isLastNameValid = validateLastName();
  const isEmailValid = validateEmail();
  const isPasswordValid = validatePassword();

  if (!isFirstNameValid || !isLastNameValid || !isEmailValid || !isPasswordValid) {
    return;
  }

  isSubmitting.value = true;

  try {
    await authStore.register({
      first_name: firstName.value,
      last_name: lastName.value,
      email: email.value,
      password: password.value,
      password_confirmation: passwordConfirmation.value,
    });

    toast.add({
      severity: 'success',
      summary: 'Registration Successful',
      detail: 'Please check your email to verify your account.',
      life: 5000,
    });

    router.push({ name: 'verify-email' });
  } catch (error: unknown) {
    if (isAxiosError(error) && hasValidationErrors(error)) {
      const errors = error.response?.data?.errors;
      if (errors?.first_name?.[0]) firstNameError.value = errors.first_name[0];
      if (errors?.last_name?.[0]) lastNameError.value = errors.last_name[0];
      if (errors?.email?.[0]) emailError.value = errors.email[0];
      if (errors?.password?.[0]) passwordError.value = errors.password[0];
      errorMessage.value =
        error.response?.data?.message || 'Registration failed. Please check your input.';
    } else {
      errorMessage.value = getErrorMessage(error, 'Registration failed. Please try again.');
    }
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
          <h1 class="font-display text-3xl md:text-4xl mb-3 text-gold uppercase tracking-wider">
            Create Account
          </h1>
          <p class="font-body text-barrier">Sign up to get started</p>
        </div>

        <!-- Error Message -->
        <Message v-if="errorMessage" severity="error" :closable="false" class="mb-6">
          {{ errorMessage }}
        </Message>

        <!-- Registration Form -->
        <form class="space-y-5" @submit.prevent="handleSubmit">
          <!-- First Name Field -->
          <div>
            <label
              for="first-name"
              class="block font-display text-xs uppercase tracking-widest text-gold mb-2"
            >
              First Name
            </label>
            <InputText
              id="first-name"
              v-model="firstName"
              type="text"
              placeholder="John"
              :class="{ 'p-invalid': firstNameError }"
              class="w-full bg-carbon border-tarmac text-pit-white focus:border-gold transition-colors"
              :disabled="isSubmitting"
              aria-label="First Name"
              @input="firstNameError = ''"
            />
            <small v-if="firstNameError" class="text-dnf mt-1 block font-body text-sm">
              {{ firstNameError }}
            </small>
          </div>

          <!-- Last Name Field -->
          <div>
            <label
              for="last-name"
              class="block font-display text-xs uppercase tracking-widest text-gold mb-2"
            >
              Last Name
            </label>
            <InputText
              id="last-name"
              v-model="lastName"
              type="text"
              placeholder="Doe"
              :class="{ 'p-invalid': lastNameError }"
              class="w-full bg-carbon border-tarmac text-pit-white focus:border-gold transition-colors"
              :disabled="isSubmitting"
              aria-label="Last Name"
              @input="lastNameError = ''"
            />
            <small v-if="lastNameError" class="text-dnf mt-1 block font-body text-sm">
              {{ lastNameError }}
            </small>
          </div>

          <!-- Email Field -->
          <div>
            <label
              for="email"
              class="block font-display text-xs uppercase tracking-widest text-gold mb-2"
            >
              Email Address
            </label>
            <InputText
              id="email"
              v-model="email"
              type="email"
              placeholder="john@example.com"
              :class="{ 'p-invalid': emailError }"
              class="w-full bg-carbon border-tarmac text-pit-white focus:border-gold transition-colors"
              :disabled="isSubmitting"
              autocomplete="email"
              aria-label="Email Address"
              @input="emailError = ''"
            />
            <small v-if="emailError" class="text-dnf mt-1 block font-body text-sm">
              {{ emailError }}
            </small>
          </div>

          <!-- Password Field -->
          <div>
            <label
              for="password"
              class="block font-display text-xs uppercase tracking-widest text-gold mb-2"
            >
              Password
            </label>
            <Password
              id="password"
              v-model="password"
              placeholder="Enter your password"
              :class="{ 'p-invalid': passwordError }"
              input-class="w-full bg-carbon border-tarmac text-pit-white focus:border-gold"
              :pt="{
                root: { class: 'w-full' },
                input: { class: 'w-full' },
              }"
              :disabled="isSubmitting"
              :toggle-mask="true"
              autocomplete="new-password"
              aria-label="Password"
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
              Confirm Password
            </label>
            <Password
              id="password-confirmation"
              v-model="passwordConfirmation"
              placeholder="Confirm your password"
              input-class="w-full bg-carbon border-tarmac text-pit-white focus:border-gold"
              :pt="{
                root: { class: 'w-full' },
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

          <!-- Submit Button -->
          <button
            type="submit"
            :disabled="!isFormValid || isSubmitting"
            class="w-full btn btn-primary"
            :aria-busy="isSubmitting"
          >
            <span v-if="!isSubmitting">Create Account</span>
            <span v-else>Creating Account...</span>
          </button>
        </form>

        <!-- Login Link -->
        <div class="mt-8 text-center">
          <p class="font-body text-sm text-barrier">
            Already have an account?
            <router-link
              to="/login"
              class="text-gold hover:text-gold-bright transition-colors font-medium"
            >
              Sign in
            </router-link>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
