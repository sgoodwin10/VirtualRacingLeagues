<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@public/stores/authStore';
import { isAxiosError, hasValidationErrors, getErrorMessage } from '@public/types/errors';
import { usePasswordValidation } from '@public/composables/usePasswordValidation';
import { configService } from '@public/services/configService';
import type { SiteConfig } from '@public/types/config';
import BackgroundGrid from '@public/components/landing/BackgroundGrid.vue';
import LandingNav from '@public/components/landing/LandingNav.vue';
import VrlButton from '@public/components/common/buttons/VrlButton.vue';
import VrlInput from '@public/components/common/forms/VrlInput.vue';
import VrlPasswordInput from '@public/components/common/forms/VrlPasswordInput.vue';
import VrlAlert from '@public/components/common/alerts/VrlAlert.vue';
import VrlFormGroup from '@public/components/common/forms/VrlFormGroup.vue';
import VrlFormLabel from '@public/components/common/forms/VrlFormLabel.vue';
import VrlFormError from '@public/components/common/forms/VrlFormError.vue';
import VrlSpinner from '@public/components/common/loading/VrlSpinner.vue';

const router = useRouter();
const authStore = useAuthStore();

// Site config state
const siteConfig = ref<SiteConfig | null>(null);
const isLoadingConfig = ref(true);
const configError = ref(false);

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
    const userEmail = await authStore.register({
      first_name: firstName.value.trim(),
      last_name: lastName.value.trim(),
      email: email.value.trim(),
      password: password.value,
      password_confirmation: passwordConfirmation.value,
    });

    // Redirect to success page with email as query parameter
    router.push({
      name: 'register-success',
      query: { email: userEmail },
    });
  } catch (error: unknown) {
    if (isAxiosError(error)) {
      if (hasValidationErrors(error)) {
        const validationErrors = error.response?.data?.errors;
        if (validationErrors) {
          if (validationErrors.email && Array.isArray(validationErrors.email)) {
            emailError.value = validationErrors.email[0] ?? '';
          }
          if (validationErrors.password && Array.isArray(validationErrors.password)) {
            passwordError.value = validationErrors.password[0] ?? '';
          }
          if (validationErrors.first_name && Array.isArray(validationErrors.first_name)) {
            firstNameError.value = validationErrors.first_name[0] ?? '';
          }
          if (validationErrors.last_name && Array.isArray(validationErrors.last_name)) {
            lastNameError.value = validationErrors.last_name[0] ?? '';
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

const fetchSiteConfig = async (): Promise<void> => {
  try {
    siteConfig.value = await configService.getSiteConfig();
    configError.value = false;
  } catch {
    // If config fetch fails, default to showing the form (fail-safe)
    configError.value = true;
    siteConfig.value = {
      user_registration_enabled: true,
      discord_url: null,
    };
  } finally {
    isLoadingConfig.value = false;
  }
};

const openDiscord = (): void => {
  if (siteConfig.value?.discord_url) {
    window.open(siteConfig.value.discord_url, '_blank');
  }
};

onMounted(() => {
  fetchSiteConfig();
});
</script>

<template>
  <div class="flex-1 bg-[var(--bg-dark)] text-[var(--text-primary)] overflow-x-hidden">
    <!-- Background Effects -->
    <BackgroundGrid />

    <!-- Navigation -->
    <LandingNav />

    <!-- Main Content -->
    <main class="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
      <div class="max-w-md mx-auto">
        <!-- Auth Card -->
        <div
          class="bg-[var(--bg-panel)] border border-[var(--border)] rounded-[var(--radius-lg)] p-8"
        >
          <!-- Header -->
          <h1 class="text-display-h2 text-center mb-2">Create Account</h1>
          <p class="text-body-secondary text-center mb-8">Join Virtual Racing Leagues today</p>

          <!-- Loading State -->
          <div v-if="isLoadingConfig" class="flex items-center justify-center py-12">
            <VrlSpinner size="lg" label="Loading registration form" centered />
          </div>

          <!-- Registration Disabled Message -->
          <div v-else-if="!siteConfig?.user_registration_enabled" class="space-y-6">
            <VrlAlert
              type="warning"
              title="Registration Currently Disabled"
              message="New user registration is temporarily disabled. Please join our Discord community for updates and support."
              class="mb-6"
            />

            <div class="text-center space-y-4">
              <p class="text-body-secondary">
                Stay connected with our community and get notified when registration reopens.
              </p>

              <VrlButton
                v-if="siteConfig?.discord_url"
                variant="primary"
                size="lg"
                class="w-full"
                @click="openDiscord"
              >
                Join Our Discord
              </VrlButton>

              <p class="text-center text-body-secondary mt-6">
                Already have an account?
                <router-link to="/login" class="text-[var(--cyan)] hover:underline font-medium">
                  Sign in
                </router-link>
              </p>
            </div>
          </div>

          <!-- Error Message -->
          <VrlAlert
            v-else-if="errorMessage"
            type="error"
            title="Error"
            :message="errorMessage"
            class="mb-6"
          />

          <!-- Registration Form -->
          <form v-else class="space-y-6" @submit.prevent="handleSubmit">
            <!-- Name Fields (Side by Side on Desktop) -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <VrlFormGroup>
                <VrlFormLabel for="first-name" :required="true">First Name</VrlFormLabel>
                <VrlInput
                  id="first-name"
                  v-model="firstName"
                  type="text"
                  placeholder="John"
                  :error="firstNameError"
                  :disabled="isSubmitting"
                  @input="firstNameError = ''"
                />
                <VrlFormError v-if="firstNameError" :error="firstNameError" />
              </VrlFormGroup>

              <VrlFormGroup>
                <VrlFormLabel for="last-name" :required="true">Last Name</VrlFormLabel>
                <VrlInput
                  id="last-name"
                  v-model="lastName"
                  type="text"
                  placeholder="Doe"
                  :error="lastNameError"
                  :disabled="isSubmitting"
                  @input="lastNameError = ''"
                />
                <VrlFormError v-if="lastNameError" :error="lastNameError" />
              </VrlFormGroup>
            </div>

            <!-- Email Field -->
            <VrlFormGroup>
              <VrlFormLabel for="email" :required="true">Email Address</VrlFormLabel>
              <VrlInput
                id="email"
                v-model="email"
                type="email"
                placeholder="john@example.com"
                :error="emailError"
                :disabled="isSubmitting"
                autocomplete="email"
                @input="emailError = ''"
              />
              <VrlFormError v-if="emailError" :error="emailError" />
            </VrlFormGroup>

            <!-- Password Field -->
            <VrlFormGroup>
              <VrlFormLabel for="password" :required="true">Password</VrlFormLabel>
              <VrlPasswordInput
                id="password"
                v-model="password"
                placeholder="Enter your password"
                :error="passwordError"
                :disabled="isSubmitting"
                autocomplete="new-password"
                @input="passwordError = ''"
              />

              <!-- Password Requirements -->
              <div
                v-if="password && passwordErrors.length > 0"
                class="mt-3 p-3 bg-[var(--bg-card)] rounded-[var(--radius)] border border-[var(--border)]"
              >
                <p
                  class="text-[0.75rem] text-[var(--text-secondary)] font-display tracking-wider uppercase mb-2"
                >
                  Password must:
                </p>
                <ul class="space-y-1">
                  <li
                    v-for="error in passwordErrors"
                    :key="error"
                    class="text-[0.8rem] text-[var(--red)] flex items-start gap-2"
                  >
                    <span class="text-[var(--red)]">•</span>
                    <span>{{ error }}</span>
                  </li>
                </ul>
              </div>

              <!-- Success Check -->
              <div v-if="password && isPasswordValid" class="mt-3 flex items-center gap-2">
                <span class="text-[var(--green)]">✓</span>
                <span class="text-[0.8rem] text-[var(--green)]"
                  >Password meets all requirements</span
                >
              </div>

              <VrlFormError v-if="passwordError" :error="passwordError" />
            </VrlFormGroup>

            <!-- Confirm Password Field -->
            <VrlFormGroup>
              <VrlFormLabel for="password-confirmation" :required="true"
                >Confirm Password</VrlFormLabel
              >
              <VrlPasswordInput
                id="password-confirmation"
                v-model="passwordConfirmation"
                placeholder="Confirm your password"
                :disabled="isSubmitting"
                autocomplete="new-password"
                @input="passwordError = ''"
              />
            </VrlFormGroup>

            <!-- Submit Button -->
            <VrlButton
              type="submit"
              variant="primary"
              size="lg"
              :disabled="!isFormValid || isSubmitting"
              :loading="isSubmitting"
              class="w-full"
            >
              {{ isSubmitting ? 'Creating Account...' : 'Create Account' }}
            </VrlButton>

            <!-- Login Link -->
            <p class="text-center text-body-secondary mt-6">
              Already have an account?
              <router-link to="/login" class="text-[var(--cyan)] hover:underline font-medium">
                Sign in
              </router-link>
            </p>
          </form>
        </div>
      </div>
    </main>
  </div>
</template>
