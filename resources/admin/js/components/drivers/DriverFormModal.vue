<template>
  <BaseModal
    :visible="visible"
    width="50rem"
    @update:visible="emit('update:visible', $event)"
    @close="handleClose"
  >
    <template #header>{{ isEditMode ? 'Edit Driver' : 'Create New Driver' }}</template>

    <form class="space-y-4" @submit.prevent="handleSubmit">
      <!-- Name Section -->
      <div class="grid grid-cols-2 gap-4">
        <!-- First Name -->
        <div>
          <label for="first-name" class="block mb-2">First Name</label>
          <InputText
            id="first-name"
            v-model="form.first_name"
            class="w-full"
            :invalid="hasFieldError('first_name')"
            placeholder="John"
          />
          <small v-if="hasFieldError('first_name')" class="text-red-500">
            {{ getFieldError('first_name') }}
          </small>
        </div>

        <!-- Last Name -->
        <div>
          <label for="last-name" class="block mb-2">Last Name</label>
          <InputText
            id="last-name"
            v-model="form.last_name"
            class="w-full"
            :invalid="hasFieldError('last_name')"
            placeholder="Doe"
          />
          <small v-if="hasFieldError('last_name')" class="text-red-500">
            {{ getFieldError('last_name') }}
          </small>
        </div>
      </div>

      <!-- Nickname -->
      <div>
        <label for="nickname" class="block mb-2">Nickname / Gamertag</label>
        <InputText
          id="nickname"
          v-model="form.nickname"
          class="w-full"
          :invalid="hasFieldError('nickname')"
          placeholder="SpeedDemon"
        />
        <small v-if="hasFieldError('nickname')" class="text-red-500">
          {{ getFieldError('nickname') }}
        </small>
        <small class="text-gray-500"> Used if first/last name not provided, or as gamertag </small>
      </div>

      <!-- Contact Info Section -->
      <div class="grid grid-cols-2 gap-4">
        <!-- Email -->
        <div>
          <label for="email" class="block mb-2">Email</label>
          <InputText
            id="email"
            v-model="form.email"
            type="email"
            class="w-full"
            :invalid="hasFieldError('email')"
            placeholder="driver@example.com"
          />
          <small v-if="hasFieldError('email')" class="text-red-500">
            {{ getFieldError('email') }}
          </small>
        </div>

        <!-- Phone -->
        <div>
          <label for="phone" class="block mb-2">Phone</label>
          <InputText
            id="phone"
            v-model="form.phone"
            type="tel"
            class="w-full"
            :invalid="hasFieldError('phone')"
            placeholder="+1 234-567-8900"
          />
          <small v-if="hasFieldError('phone')" class="text-red-500">
            {{ getFieldError('phone') }}
          </small>
        </div>
      </div>

      <!-- Platform IDs Section -->
      <div class="space-y-4 pt-2">
        <h3 class="text-lg font-semibold text-gray-900">Platform IDs</h3>

        <!-- PSN ID -->
        <div>
          <label for="psn-id" class="block mb-2">PlayStation Network (PSN) ID</label>
          <InputText
            id="psn-id"
            v-model="form.psn_id"
            class="w-full"
            :invalid="hasFieldError('psn_id')"
            placeholder="PSN_Username"
          />
          <small v-if="hasFieldError('psn_id')" class="text-red-500">
            {{ getFieldError('psn_id') }}
          </small>
        </div>

        <!-- iRacing -->
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label for="iracing-id" class="block mb-2">iRacing ID</label>
            <InputText
              id="iracing-id"
              v-model="form.iracing_id"
              class="w-full"
              :invalid="hasFieldError('iracing_id')"
              placeholder="iRacing_Username"
            />
            <small v-if="hasFieldError('iracing_id')" class="text-red-500">
              {{ getFieldError('iracing_id') }}
            </small>
          </div>

          <div>
            <label for="iracing-customer-id" class="block mb-2">iRacing Customer ID</label>
            <InputNumber
              id="iracing-customer-id"
              v-model="form.iracing_customer_id"
              class="w-full"
              :invalid="hasFieldError('iracing_customer_id')"
              placeholder="123456"
              :use-grouping="false"
            />
            <small v-if="hasFieldError('iracing_customer_id')" class="text-red-500">
              {{ getFieldError('iracing_customer_id') }}
            </small>
          </div>
        </div>

        <!-- Discord ID -->
        <div>
          <label for="discord-id" class="block mb-2">Discord ID</label>
          <InputText
            id="discord-id"
            v-model="form.discord_id"
            class="w-full"
            :invalid="hasFieldError('discord_id')"
            placeholder="username#1234"
          />
          <small v-if="hasFieldError('discord_id')" class="text-red-500">
            {{ getFieldError('discord_id') }}
          </small>
        </div>

        <small class="text-gray-500">
          At least one name field (First/Last/Nickname) and one platform ID is required
        </small>
      </div>
    </form>

    <template #footer>
      <div class="flex justify-end gap-2">
        <Button
          label="Cancel"
          severity="secondary"
          :disabled="loading"
          @click="emit('update:visible', false)"
        />
        <Button
          :label="isEditMode ? 'Update Driver' : 'Create New Driver'"
          :loading="loading"
          variant="success"
          @click="handleSubmit"
        />
      </div>
    </template>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import BaseModal from '@admin/components/modals/BaseModal.vue';
import InputText from 'primevue/inputtext';
import InputNumber from 'primevue/inputnumber';
import Button from 'primevue/button';
import { useToast } from 'primevue/usetoast';
import { driverService } from '@admin/services/driverService';
import { useErrorToast } from '@admin/composables/useErrorToast';
import { isRequestCancelled } from '@admin/types/errors';
import { useRequestCancellation } from '@admin/composables/useRequestCancellation';
import type { Driver, CreateDriverDTO, UpdateDriverDTO } from '@admin/types/driver';

interface Props {
  visible: boolean;
  driver?: Driver | null;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  'update:visible': [value: boolean];
  'driver-saved': [];
}>();

// Composables
const toast = useToast();
const { showErrorToast } = useErrorToast();
const { getSignal, cancel: cancelRequests } = useRequestCancellation();

// State
const loading = ref(false);
const form = ref<CreateDriverDTO | UpdateDriverDTO>({
  first_name: null,
  last_name: null,
  nickname: null,
  email: null,
  phone: null,
  psn_id: null,
  iracing_id: null,
  iracing_customer_id: null,
  discord_id: null,
});
const fieldErrors = ref<Record<string, string[]>>({});

/**
 * Type guard to check if error is an API validation error
 */
const isValidationError = (
  error: unknown,
): error is { response: { data: { errors: Record<string, string[]> } } } => {
  return (
    typeof error === 'object' &&
    error !== null &&
    'response' in error &&
    typeof error.response === 'object' &&
    error.response !== null &&
    'data' in error.response &&
    typeof error.response.data === 'object' &&
    error.response.data !== null &&
    'errors' in error.response.data
  );
};

// Computed
const isEditMode = computed(() => !!props.driver);

/**
 * Check if a field has an error
 */
const hasFieldError = (field: string): boolean => {
  return !!fieldErrors.value[field];
};

/**
 * Get the first error message for a field
 */
const getFieldError = (field: string): string | undefined => {
  return fieldErrors.value[field]?.[0];
};

/**
 * Reset the form to initial state
 */
const resetForm = (): void => {
  form.value = {
    first_name: null,
    last_name: null,
    nickname: null,
    email: null,
    phone: null,
    psn_id: null,
    iracing_id: null,
    iracing_customer_id: null,
    discord_id: null,
  };
  fieldErrors.value = {};
};

/**
 * Watch for driver prop changes to populate form
 */
watch(
  () => props.driver,
  (driver) => {
    fieldErrors.value = {};
    if (driver) {
      form.value = {
        first_name: driver.first_name,
        last_name: driver.last_name,
        nickname: driver.nickname,
        email: driver.email,
        phone: driver.phone,
        psn_id: driver.psn_id,
        iracing_id: driver.iracing_id,
        iracing_customer_id: driver.iracing_customer_id,
        discord_id: driver.discord_id,
      };
    } else {
      resetForm();
    }
  },
  { immediate: true },
);

/**
 * Handle form submission
 */
const handleSubmit = async (): Promise<void> => {
  loading.value = true;
  fieldErrors.value = {};

  // Cancel any pending requests
  cancelRequests('Submitting form');

  try {
    if (isEditMode.value && props.driver) {
      // Update existing driver
      await driverService.updateDriver(props.driver.id, form.value, getSignal());
      toast.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Driver updated successfully',
        life: 3000,
      });
    } else {
      // Create new driver
      await driverService.createDriver(form.value, getSignal());
      toast.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Driver created successfully',
        life: 3000,
      });
    }

    emit('driver-saved');
    emit('update:visible', false);
    resetForm();
  } catch (error: unknown) {
    // Silently ignore cancelled requests
    if (isRequestCancelled(error)) {
      return;
    }

    // Handle validation errors
    if (isValidationError(error)) {
      fieldErrors.value = error.response.data.errors;
    } else {
      showErrorToast(
        error,
        isEditMode.value ? 'Failed to update driver' : 'Failed to create driver',
      );
    }
  } finally {
    loading.value = false;
  }
};

/**
 * Handle modal close
 */
const handleClose = (): void => {
  loading.value = false;
  cancelRequests('Modal closed');
  emit('update:visible', false);
};

/**
 * Watch for modal visibility to reset form when it closes
 */
watch(
  () => props.visible,
  (visible) => {
    if (!visible) {
      resetForm();
      fieldErrors.value = {};
    }
  },
);
</script>

<style scoped></style>
