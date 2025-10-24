<script setup lang="ts">
import { ref, watch } from 'vue';
import BaseModal from '@admin/components/modals/BaseModal.vue';
import InputText from 'primevue/inputtext';
import Select from 'primevue/select';
import InputSwitch from 'primevue/inputswitch';
import Button from 'primevue/button';
import { useToast } from 'primevue/usetoast';
import type { User, UpdateUserPayload } from '@admin/types/user';
import { userService } from '@admin/services/userService';
import { getValidationErrors, hasValidationErrors } from '@admin/types/errors';

const props = defineProps<{
  visible: boolean;
  user: User | null;
}>();

const emit = defineEmits<{
  'update:visible': [value: boolean];
  'user-updated': [];
}>();

const toast = useToast();
const loading = ref(false);

const form = ref<{
  first_name: string;
  last_name: string;
  email: string;
  alias: string;
  password: string;
  status: 'active' | 'inactive' | 'suspended';
  email_verified: boolean;
}>({
  first_name: '',
  last_name: '',
  email: '',
  alias: '',
  password: '',
  status: 'active',
  email_verified: false,
});

const fieldErrors = ref<Record<string, string[]>>({});

const statusOptions = [
  { label: 'Active', value: 'active' },
  { label: 'Inactive', value: 'inactive' },
  { label: 'Suspended', value: 'suspended' },
];

watch(
  () => props.user,
  (newUser) => {
    if (newUser) {
      form.value = {
        first_name: newUser.first_name,
        last_name: newUser.last_name,
        email: newUser.email,
        alias: newUser.alias || '',
        password: '',
        status: newUser.status,
        email_verified: !!newUser.email_verified_at,
      };
      fieldErrors.value = {};
    }
  },
);

const getFieldError = (fieldName: string): string | undefined => {
  return fieldErrors.value[fieldName]?.[0];
};

const hasFieldError = (fieldName: string): boolean => {
  return !!fieldErrors.value[fieldName];
};

const handleSubmit = async () => {
  if (!props.user) return;

  loading.value = true;
  fieldErrors.value = {};

  try {
    const updateData: UpdateUserPayload = {
      first_name: form.value.first_name,
      last_name: form.value.last_name,
      email: form.value.email,
      alias: form.value.alias || null,
      status: form.value.status as 'active' | 'inactive' | 'suspended',
    };

    if (form.value.password) {
      updateData.password = form.value.password;
    }

    await userService.updateUser(props.user.id, updateData);

    // Handle email verification toggle separately if it changed
    const wasVerified = !!props.user.email_verified_at;
    if (form.value.email_verified !== wasVerified) {
      if (form.value.email_verified && !wasVerified) {
        // Verify email if toggle is ON and email was not verified
        await userService.verifyEmail(props.user.id);
      }
      // Note: We don't support unverifying emails (toggle from ON to OFF)
      // This is intentional for security/audit reasons
    }

    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: 'User updated successfully',
      life: 3000,
    });

    emit('user-updated');
  } catch (error) {
    if (hasValidationErrors(error)) {
      const errors = getValidationErrors(error);
      if (errors) {
        fieldErrors.value = errors;
        toast.add({
          severity: 'error',
          summary: 'Validation Error',
          detail: 'Please correct the errors in the form',
          life: 3000,
        });
      }
    } else {
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to update user',
        life: 3000,
      });
    }
  } finally {
    loading.value = false;
  }
};

const handleClose = () => {
  fieldErrors.value = {};
};
</script>

<template>
  <BaseModal
    :visible="props.visible"
    width="40rem"
    @update:visible="emit('update:visible', $event)"
    @close="handleClose"
  >
    <template #header>Edit User</template>

    <form class="space-y-4" @submit.prevent="handleSubmit">
      <div>
        <label for="edit-first-name" class="block mb-2">First Name *</label>
        <InputText
          id="edit-first-name"
          v-model="form.first_name"
          class="w-full"
          :class="{ 'border-red-500': hasFieldError('first_name') }"
          :invalid="hasFieldError('first_name')"
          required
        />
        <small v-if="hasFieldError('first_name')" class="text-red-500">
          {{ getFieldError('first_name') }}
        </small>
      </div>

      <div>
        <label for="edit-last-name" class="block mb-2">Last Name *</label>
        <InputText
          id="edit-last-name"
          v-model="form.last_name"
          class="w-full"
          :class="{ 'border-red-500': hasFieldError('last_name') }"
          :invalid="hasFieldError('last_name')"
          required
        />
        <small v-if="hasFieldError('last_name')" class="text-red-500">
          {{ getFieldError('last_name') }}
        </small>
      </div>

      <div>
        <label for="edit-email" class="block mb-2">Email *</label>
        <InputText
          id="edit-email"
          v-model="form.email"
          type="email"
          class="w-full"
          :class="{ 'border-red-500': hasFieldError('email') }"
          :invalid="hasFieldError('email')"
          required
        />
        <small v-if="hasFieldError('email')" class="text-red-500">
          {{ getFieldError('email') }}
        </small>
      </div>

      <div>
        <label for="edit-alias" class="block mb-2">Alias</label>
        <InputText
          id="edit-alias"
          v-model="form.alias"
          class="w-full"
          :class="{ 'border-red-500': hasFieldError('alias') }"
          :invalid="hasFieldError('alias')"
        />
        <small v-if="hasFieldError('alias')" class="text-red-500">
          {{ getFieldError('alias') }}
        </small>
      </div>

      <div>
        <label for="edit-password" class="block mb-2">Password (leave blank to keep current)</label>
        <InputText
          id="edit-password"
          v-model="form.password"
          type="password"
          class="w-full"
          :class="{ 'border-red-500': hasFieldError('password') }"
          :invalid="hasFieldError('password')"
        />
        <small v-if="hasFieldError('password')" class="text-red-500">
          {{ getFieldError('password') }}
        </small>
      </div>

      <div>
        <label for="edit-status" class="block mb-2">Status *</label>
        <Select
          id="edit-status"
          v-model="form.status"
          :options="statusOptions"
          option-label="label"
          option-value="value"
          class="w-full"
          :class="{ 'border-red-500': hasFieldError('status') }"
          :invalid="hasFieldError('status')"
        />
        <small v-if="hasFieldError('status')" class="text-red-500">
          {{ getFieldError('status') }}
        </small>
      </div>

      <div>
        <div class="flex items-center justify-between">
          <div class="flex-1">
            <label for="edit-email-verified" class="block mb-1 font-medium">Email Verified</label>
            <p class="text-sm text-gray-600">
              {{
                props.user?.email_verified_at
                  ? 'Email was verified on ' +
                    new Date(props.user.email_verified_at).toLocaleDateString()
                  : 'Email has not been verified yet'
              }}
            </p>
          </div>
          <InputSwitch
            id="edit-email-verified"
            v-model="form.email_verified"
            :disabled="!!props.user?.email_verified_at"
          />
        </div>
        <small class="text-gray-500 block mt-2">
          {{
            props.user?.email_verified_at
              ? 'Email is already verified and cannot be unverified'
              : "Toggle ON to manually verify this user's email address"
          }}
        </small>
      </div>
    </form>

    <template #footer>
      <div class="flex justify-end gap-2">
        <Button
          type="button"
          label="Cancel"
          severity="secondary"
          @click="emit('update:visible', false)"
        />
        <Button type="button" label="Save" :loading="loading" @click="handleSubmit" />
      </div>
    </template>
  </BaseModal>
</template>
