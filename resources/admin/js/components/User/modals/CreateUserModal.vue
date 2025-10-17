<script setup lang="ts">
import { ref } from 'vue';
import BaseModal from '@admin/components/modals/BaseModal.vue';
import InputText from 'primevue/inputtext';
import Select from 'primevue/select';
import Button from 'primevue/button';
import { useToast } from 'primevue/usetoast';
import { userService } from '@admin/services/userService';
import { getValidationErrors, hasValidationErrors } from '@admin/types/errors';

const props = defineProps<{
  visible: boolean;
}>();

const emit = defineEmits<{
  'update:visible': [value: boolean];
  'user-created': [];
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
}>({
  first_name: '',
  last_name: '',
  email: '',
  alias: '',
  password: '',
  status: 'active',
});

const fieldErrors = ref<Record<string, string[]>>({});

const statusOptions = [
  { label: 'Active', value: 'active' },
  { label: 'Inactive', value: 'inactive' },
  { label: 'Suspended', value: 'suspended' },
];

const resetForm = () => {
  form.value = {
    first_name: '',
    last_name: '',
    email: '',
    alias: '',
    password: '',
    status: 'active',
  };
  fieldErrors.value = {};
};

const getFieldError = (fieldName: string): string | undefined => {
  return fieldErrors.value[fieldName]?.[0];
};

const hasFieldError = (fieldName: string): boolean => {
  return !!fieldErrors.value[fieldName];
};

const handleSubmit = async () => {
  loading.value = true;
  fieldErrors.value = {};

  try {
    await userService.createUser({
      first_name: form.value.first_name,
      last_name: form.value.last_name,
      email: form.value.email,
      alias: form.value.alias || null,
      password: form.value.password,
      status: form.value.status,
    });

    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: 'User created successfully',
      life: 3000,
    });

    resetForm();
    emit('user-created');
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
        detail: 'Failed to create user',
        life: 3000,
      });
    }
  } finally {
    loading.value = false;
  }
};

const handleClose = () => {
  resetForm();
};
</script>

<template>
  <BaseModal
    :visible="props.visible"
    width="40rem"
    @update:visible="emit('update:visible', $event)"
    @close="handleClose"
  >
    <template #header>Create New User</template>

    <form class="space-y-4" @submit.prevent="handleSubmit">
      <div>
        <label for="create-first-name" class="block mb-2">First Name *</label>
        <InputText
          id="create-first-name"
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
        <label for="create-last-name" class="block mb-2">Last Name *</label>
        <InputText
          id="create-last-name"
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
        <label for="create-email" class="block mb-2">Email *</label>
        <InputText
          id="create-email"
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
        <label for="create-alias" class="block mb-2">Alias</label>
        <InputText
          id="create-alias"
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
        <label for="create-password" class="block mb-2">Password *</label>
        <InputText
          id="create-password"
          v-model="form.password"
          type="password"
          class="w-full"
          :class="{ 'border-red-500': hasFieldError('password') }"
          :invalid="hasFieldError('password')"
          required
        />
        <small v-if="hasFieldError('password')" class="text-red-500">
          {{ getFieldError('password') }}
        </small>
      </div>

      <div>
        <label for="create-status" class="block mb-2">Status *</label>
        <Select
          id="create-status"
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
    </form>

    <template #footer>
      <div class="flex justify-end gap-2">
        <Button
          type="button"
          label="Cancel"
          severity="secondary"
          @click="emit('update:visible', false)"
        />
        <Button type="button" label="Create" :loading="loading" @click="handleSubmit" />
      </div>
    </template>
  </BaseModal>
</template>
