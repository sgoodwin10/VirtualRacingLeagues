<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useUserStore } from '@user/stores/userStore';
import { useToast } from 'primevue/usetoast';
import { isAxiosError, hasValidationErrors } from '@user/types/errors';
import InputText from 'primevue/inputtext';
import Password from 'primevue/password';
import Button from 'primevue/button';
import Message from 'primevue/message';
import Card from 'primevue/card';

const userStore = useUserStore();
const toast = useToast();

// Form data
const firstName = ref('');
const lastName = ref('');
const email = ref('');
const password = ref('');
const passwordConfirmation = ref('');
const currentPassword = ref('');

// Form state
const isSubmitting = ref(false);
const errorMessage = ref('');
const firstNameError = ref('');
const lastNameError = ref('');
const emailError = ref('');
const passwordError = ref('');
const currentPasswordError = ref('');

onMounted(() => {
  if (userStore.user) {
    firstName.value = userStore.user.first_name;
    lastName.value = userStore.user.last_name;
    email.value = userStore.user.email;
  }
});

const handleSubmit = async (): Promise<void> => {
  errorMessage.value = '';
  firstNameError.value = '';
  lastNameError.value = '';
  emailError.value = '';
  passwordError.value = '';
  currentPasswordError.value = '';

  // Validate first name
  if (!firstName.value.trim()) {
    firstNameError.value = 'First name is required';
    return;
  }

  // Validate last name
  if (!lastName.value.trim()) {
    lastNameError.value = 'Last name is required';
    return;
  }

  // Validate email
  if (!email.value.trim()) {
    emailError.value = 'Email is required';
    return;
  }

  // If changing password, validate it
  if (password.value || passwordConfirmation.value || currentPassword.value) {
    if (!currentPassword.value) {
      currentPasswordError.value = 'Current password is required to change password';
      return;
    }
    if (!password.value) {
      passwordError.value = 'New password is required';
      return;
    }
    if (password.value.length < 8) {
      passwordError.value = 'Password must be at least 8 characters';
      return;
    }
    if (password.value !== passwordConfirmation.value) {
      passwordError.value = 'Passwords do not match';
      return;
    }
  }

  isSubmitting.value = true;

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: any = {
      first_name: firstName.value,
      last_name: lastName.value,
      email: email.value,
    };

    if (password.value) {
      updateData.password = password.value;
      updateData.password_confirmation = passwordConfirmation.value;
      updateData.current_password = currentPassword.value;
    }

    await userStore.updateProfile(updateData);

    // Clear password fields
    password.value = '';
    passwordConfirmation.value = '';
    currentPassword.value = '';

    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: 'Profile updated successfully',
      life: 3000,
    });
  } catch (error: unknown) {
    if (isAxiosError(error) && hasValidationErrors(error)) {
      const errors = error.response?.data?.errors;
      if (errors?.first_name?.[0]) firstNameError.value = errors.first_name[0];
      if (errors?.last_name?.[0]) lastNameError.value = errors.last_name[0];
      if (errors?.email?.[0]) emailError.value = errors.email[0];
      if (errors?.password?.[0]) passwordError.value = errors.password[0];
      if (errors?.current_password?.[0]) currentPasswordError.value = errors.current_password[0];
      errorMessage.value = error.response?.data?.message || 'Failed to update profile';
    } else {
      errorMessage.value = 'Failed to update profile. Please try again.';
    }
  } finally {
    isSubmitting.value = false;
  }
};
</script>

<template>
  <div class="container mx-auto px-4 py-8">
    <div class="max-w-2xl mx-auto">
      <h1 class="text-3xl font-bold text-gray-900 mb-8">Profile Settings</h1>

      <Card>
        <template #content>
          <!-- Error Message -->
          <Message v-if="errorMessage" severity="error" :closable="true" class="mb-6">
            {{ errorMessage }}
          </Message>

          <form class="space-y-6" @submit.prevent="handleSubmit">
            <!-- First Name Field -->
            <div>
              <label for="first-name" class="block text-sm font-medium text-gray-700 mb-2">
                First Name
              </label>
              <InputText
                id="first-name"
                v-model="firstName"
                type="text"
                :class="{ 'p-invalid': firstNameError }"
                class="w-full"
                :disabled="isSubmitting"
              />
              <small v-if="firstNameError" class="text-red-600 mt-1 block">
                {{ firstNameError }}
              </small>
            </div>

            <!-- Last Name Field -->
            <div>
              <label for="last-name" class="block text-sm font-medium text-gray-700 mb-2">
                Last Name
              </label>
              <InputText
                id="last-name"
                v-model="lastName"
                type="text"
                :class="{ 'p-invalid': lastNameError }"
                class="w-full"
                :disabled="isSubmitting"
              />
              <small v-if="lastNameError" class="text-red-600 mt-1 block">
                {{ lastNameError }}
              </small>
            </div>

            <!-- Email Field -->
            <div>
              <label for="email" class="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <InputText
                id="email"
                v-model="email"
                type="email"
                :class="{ 'p-invalid': emailError }"
                class="w-full"
                :disabled="isSubmitting"
                autocomplete="email"
              />
              <small v-if="emailError" class="text-red-600 mt-1 block">
                {{ emailError }}
              </small>
              <small v-if="!userStore.isEmailVerified" class="text-orange-600 mt-1 block">
                <i class="pi pi-exclamation-triangle mr-1"></i>
                Email not verified. Please check your inbox.
              </small>
            </div>

            <div class="border-t pt-6">
              <h3 class="text-lg font-semibold text-gray-900 mb-4">Change Password</h3>
              <p class="text-sm text-gray-600 mb-4">
                Leave blank if you don't want to change your password
              </p>

              <!-- Current Password -->
              <div class="mb-4">
                <label for="current-password" class="block text-sm font-medium text-gray-700 mb-2">
                  Current Password
                </label>
                <Password
                  id="current-password"
                  v-model="currentPassword"
                  placeholder="Enter current password"
                  :class="{ 'p-invalid': currentPasswordError }"
                  input-class="w-full"
                  :pt="{
                    root: { class: 'w-full' },
                    input: { class: 'w-full' },
                  }"
                  :disabled="isSubmitting"
                  :feedback="false"
                  :toggle-mask="true"
                  autocomplete="current-password"
                />
                <small v-if="currentPasswordError" class="text-red-600 mt-1 block">
                  {{ currentPasswordError }}
                </small>
              </div>

              <!-- New Password -->
              <div class="mb-4">
                <label for="password" class="block text-sm font-medium text-gray-700 mb-2">
                  New Password
                </label>
                <Password
                  id="password"
                  v-model="password"
                  placeholder="Enter new password"
                  :class="{ 'p-invalid': passwordError }"
                  input-class="w-full"
                  :pt="{
                    root: { class: 'w-full' },
                    input: { class: 'w-full' },
                  }"
                  :disabled="isSubmitting"
                  :toggle-mask="true"
                  autocomplete="new-password"
                />
                <small v-if="passwordError" class="text-red-600 mt-1 block">
                  {{ passwordError }}
                </small>
              </div>

              <!-- Confirm New Password -->
              <div>
                <label
                  for="password-confirmation"
                  class="block text-sm font-medium text-gray-700 mb-2"
                >
                  Confirm New Password
                </label>
                <Password
                  id="password-confirmation"
                  v-model="passwordConfirmation"
                  placeholder="Confirm new password"
                  input-class="w-full"
                  :pt="{
                    root: { class: 'w-full' },
                    input: { class: 'w-full' },
                  }"
                  :disabled="isSubmitting"
                  :feedback="false"
                  :toggle-mask="true"
                  autocomplete="new-password"
                />
              </div>
            </div>

            <!-- Submit Button -->
            <div class="flex justify-end">
              <Button
                type="submit"
                label="Update Profile"
                icon="pi pi-save"
                :loading="isSubmitting"
                :disabled="isSubmitting"
                severity="primary"
              />
            </div>
          </form>
        </template>
      </Card>
    </div>
  </div>
</template>
