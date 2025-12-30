<script setup lang="ts">
import { watch } from 'vue';
import { useUserStore } from '@app/stores/userStore';
import { useProfileForm } from '@app/composables/useProfileForm';
import { PhUser, PhLockKey, PhWarning } from '@phosphor-icons/vue';
import Dialog from 'primevue/dialog';
import InputText from 'primevue/inputtext';
import Password from 'primevue/password';
import { Button } from '@app/components/common/buttons';
import { PhCheck } from '@phosphor-icons/vue';
import Message from 'primevue/message';
import Divider from 'primevue/divider';

interface Props {
  visible: boolean;
}

interface Emits {
  (e: 'update:visible', value: boolean): void;
  (e: 'profile-updated'): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const userStore = useUserStore();
const {
  firstName,
  lastName,
  email,
  password,
  passwordConfirmation,
  currentPassword,
  isSubmitting,
  errors,
  hasPasswordFields,
  initializeForm,
  submitForm,
} = useProfileForm();

// Watch visibility changes to initialize form
watch(
  () => props.visible,
  (newVisible) => {
    if (newVisible) {
      initializeForm();
    }
  },
);

const handleClose = (): void => {
  // Reset form to initial state when closing
  initializeForm();
  emit('update:visible', false);
};

const handleSubmit = async (): Promise<void> => {
  const success = await submitForm();
  if (success) {
    emit('profile-updated');
    handleClose();
  }
};
</script>

<template>
  <Dialog
    :visible="visible"
    modal
    :draggable="false"
    :closable="!isSubmitting"
    :style="{ width: '42rem' }"
    :breakpoints="{ '1199px': '75vw', '575px': '90vw' }"
    @update:visible="emit('update:visible', $event)"
  >
    <template #header>
      <div class="flex items-center gap-3">
        <div class="flex items-center justify-center w-10 h-10 rounded-lg bg-primary-50">
          <PhUser :size="20" weight="duotone" class="text-primary-600" />
        </div>
        <div>
          <h2 class="text-xl font-semibold text-slate-900">Profile Settings</h2>
          <p class="text-sm text-slate-500 mt-0.5">Manage your account information</p>
        </div>
      </div>
    </template>

    <div class="pt-2">
      <!-- General Error Message -->
      <Message v-if="errors.general" severity="error" :closable="false" class="mb-6">
        {{ errors.general }}
      </Message>

      <form class="space-y-8" @submit.prevent="handleSubmit">
        <!-- Personal Information Section -->
        <section>
          <div class="flex items-center gap-2 mb-6">
            <h3 class="text-base font-semibold text-slate-900">Personal Information</h3>
          </div>

          <div class="space-y-5">
            <!-- Name Row - Two columns on larger screens -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <!-- First Name -->
              <div>
                <label
                  for="profile-first-name"
                  class="block text-sm font-medium text-slate-700 mb-2"
                >
                  First Name
                </label>
                <InputText
                  id="profile-first-name"
                  v-model="firstName"
                  type="text"
                  placeholder="Enter first name"
                  :invalid="!!errors.firstName"
                  class="w-full"
                  :disabled="isSubmitting"
                  autocomplete="given-name"
                />
                <small v-if="errors.firstName" class="text-red-600 mt-1.5 block">
                  {{ errors.firstName }}
                </small>
              </div>

              <!-- Last Name -->
              <div>
                <label
                  for="profile-last-name"
                  class="block text-sm font-medium text-slate-700 mb-2"
                >
                  Last Name
                </label>
                <InputText
                  id="profile-last-name"
                  v-model="lastName"
                  type="text"
                  placeholder="Enter last name"
                  :invalid="!!errors.lastName"
                  class="w-full"
                  :disabled="isSubmitting"
                  autocomplete="family-name"
                />
                <small v-if="errors.lastName" class="text-red-600 mt-1.5 block">
                  {{ errors.lastName }}
                </small>
              </div>
            </div>

            <!-- Email Address -->
            <div>
              <label for="profile-email" class="block text-sm font-medium text-slate-700 mb-2">
                Email Address
              </label>
              <InputText
                id="profile-email"
                v-model="email"
                type="email"
                placeholder="Enter email address"
                :invalid="!!errors.email"
                class="w-full"
                :disabled="isSubmitting"
                autocomplete="email"
              />
              <small v-if="errors.email" class="text-red-600 mt-1.5 block">
                {{ errors.email }}
              </small>

              <!-- Email Verification Warning -->
              <div
                v-if="!userStore.isEmailVerified"
                class="flex items-start gap-2 mt-3 p-3 bg-orange-50 border border-orange-200 rounded-lg"
              >
                <PhWarning :size="18" weight="fill" class="text-orange-600 mt-0.5 flex-shrink-0" />
                <p class="text-sm text-orange-800">
                  Your email address is not verified. Please check your inbox for a verification
                  link.
                </p>
              </div>
            </div>
          </div>
        </section>

        <Divider />

        <!-- Password Section -->
        <section>
          <div class="flex items-center gap-2 mb-3">
            <div class="flex items-center justify-center w-8 h-8 rounded-lg bg-slate-100">
              <PhLockKey :size="16" weight="duotone" class="text-slate-600" />
            </div>
            <h3 class="text-base font-semibold text-slate-900">Change Password</h3>
          </div>

          <p class="text-sm text-slate-600 mb-6">
            Leave password fields blank if you don't want to change your current password.
          </p>

          <div class="space-y-5">
            <!-- Current Password -->
            <div>
              <label
                for="profile-current-password"
                class="block text-sm font-medium text-slate-700 mb-2"
              >
                Current Password
              </label>
              <Password
                id="profile-current-password"
                v-model="currentPassword"
                placeholder="Enter current password"
                :invalid="!!errors.currentPassword"
                input-class="w-full"
                :pt="{
                  root: { class: 'w-full' },
                  input: { root: { class: 'w-full' } },
                }"
                :disabled="isSubmitting"
                :feedback="false"
                :toggle-mask="true"
                autocomplete="current-password"
              />
              <small v-if="errors.currentPassword" class="text-red-600 mt-1.5 block">
                {{ errors.currentPassword }}
              </small>
            </div>

            <!-- New Password Row - Two columns -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <!-- New Password -->
              <div>
                <label for="profile-password" class="block text-sm font-medium text-slate-700 mb-2">
                  New Password
                </label>
                <Password
                  id="profile-password"
                  v-model="password"
                  placeholder="Enter new password"
                  :invalid="!!errors.password"
                  input-class="w-full"
                  :pt="{
                    root: { class: 'w-full' },
                    input: { root: { class: 'w-full' } },
                  }"
                  :disabled="isSubmitting"
                  :toggle-mask="true"
                  autocomplete="new-password"
                />
                <small v-if="errors.password" class="text-red-600 mt-1.5 block">
                  {{ errors.password }}
                </small>
              </div>

              <!-- Confirm New Password -->
              <div>
                <label
                  for="profile-password-confirmation"
                  class="block text-sm font-medium text-slate-700 mb-2"
                >
                  Confirm Password
                </label>
                <Password
                  id="profile-password-confirmation"
                  v-model="passwordConfirmation"
                  placeholder="Confirm new password"
                  input-class="w-full"
                  :pt="{
                    root: { class: 'w-full' },
                    input: { root: { class: 'w-full' } },
                  }"
                  :disabled="isSubmitting"
                  :feedback="false"
                  :toggle-mask="true"
                  autocomplete="new-password"
                />
              </div>
            </div>

            <!-- Password Requirements -->
            <div
              v-if="hasPasswordFields"
              class="p-4 bg-slate-50 border border-slate-200 rounded-lg"
            >
              <p class="text-sm font-medium text-slate-700 mb-2">Password Requirements:</p>
              <ul class="text-sm text-slate-600 space-y-1">
                <li class="flex items-start gap-2">
                  <span class="text-slate-400 mt-0.5">•</span>
                  <span>Minimum 8 characters long</span>
                </li>
                <li class="flex items-start gap-2">
                  <span class="text-slate-400 mt-0.5">•</span>
                  <span>Must match confirmation password</span>
                </li>
                <li class="flex items-start gap-2">
                  <span class="text-slate-400 mt-0.5">•</span>
                  <span>Requires current password for verification</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        <!-- Action Buttons -->
        <div class="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
          <Button
            type="button"
            label="Cancel"
            variant="secondary"
            :disabled="isSubmitting"
            @click="handleClose"
          />
          <Button
            type="submit"
            label="Save Changes"
            :icon="PhCheck"
            :loading="isSubmitting"
            :disabled="isSubmitting"
          />
        </div>
      </form>
    </div>
  </Dialog>
</template>
