<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import Dialog from 'primevue/dialog';
import InputText from 'primevue/inputtext';
import InputNumber from 'primevue/inputnumber';
import Select from 'primevue/select';
import Textarea from 'primevue/textarea';
import Button from 'primevue/button';
import FormInputGroup from '@user/components/common/forms/FormInputGroup.vue';
import FormLabel from '@user/components/common/forms/FormLabel.vue';
import FormError from '@user/components/common/forms/FormError.vue';
import FormHelper from '@user/components/common/forms/FormHelper.vue';
import FormCharacterCount from '@user/components/common/forms/FormCharacterCount.vue';
import { useLeagueStore } from '@user/stores/leagueStore';
import type { LeagueDriver, CreateDriverRequest } from '@user/types/driver';

interface Props {
  visible: boolean;
  mode: 'create' | 'edit';
  driver?: LeagueDriver | null;
  leagueId?: number;
}

interface Emits {
  (e: 'update:visible', value: boolean): void;
  (e: 'save', data: CreateDriverRequest): void;
  (e: 'cancel'): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const leagueStore = useLeagueStore();

// Form data - platform fields stored dynamically
const formData = ref<CreateDriverRequest & Record<string, unknown>>({
  first_name: '',
  last_name: '',
  nickname: '',
  email: '',
  phone: '',
  driver_number: undefined,
  status: 'active',
  league_notes: '',
});

// Validation errors
const errors = ref<Record<string, string>>({});

// Status options
const statusOptions = [
  { label: 'Active', value: 'active' },
  { label: 'Inactive', value: 'inactive' },
  { label: 'Banned', value: 'banned' },
];

// Dialog title
const dialogTitle = computed(() => {
  return props.mode === 'create' ? 'Add Driver' : 'Edit Driver';
});

// Get platform form fields from store
const platformFormFields = computed(() => leagueStore.platformFormFields);

// Check if at least one platform field is shown
const hasAnyPlatformField = computed(() => {
  return platformFormFields.value.length > 0;
});

// Watch for driver changes in edit mode
watch(
  () => props.driver,
  (leagueDriver) => {
    if (leagueDriver && props.mode === 'edit') {
      const driver = leagueDriver.driver;
      const newFormData: CreateDriverRequest & Record<string, unknown> = {
        first_name: driver?.first_name || '',
        last_name: driver?.last_name || '',
        nickname: driver?.nickname || '',
        email: driver?.email || '',
        phone: driver?.phone || '',
        driver_number: leagueDriver.driver_number || undefined,
        status: leagueDriver.status || 'active',
        league_notes: leagueDriver.league_notes || '',
      };

      // Populate dynamic platform fields
      platformFormFields.value.forEach((field) => {
        const value = driver?.[field.field as keyof typeof driver];
        newFormData[field.field] = value ?? (field.type === 'number' ? undefined : '');
      });

      formData.value = newFormData;
    }
  },
  { immediate: true },
);

// Watch for visible changes to reset form in create mode
watch(
  () => props.visible,
  (visible) => {
    if (visible && props.mode === 'create') {
      resetForm();
    }
  },
);

/**
 * Validate form data
 */
const validateForm = (): boolean => {
  errors.value = {};

  // At least one name field is required
  const hasName = formData.value.first_name || formData.value.last_name || formData.value.nickname;
  if (!hasName) {
    errors.value.name = 'At least one name field (First Name, Last Name, or Nickname) is required';
  }

  // At least one platform ID is required (check dynamic platform fields)
  if (hasAnyPlatformField.value) {
    const hasPlatformValue = platformFormFields.value.some((field) => {
      const value = formData.value[field.field];
      return value !== undefined && value !== null && value !== '';
    });

    if (!hasPlatformValue) {
      errors.value.platform = 'At least one platform ID is required for this league';
    }
  }

  // Email validation
  if (formData.value.email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.value.email)) {
      errors.value.email = 'Please enter a valid email address';
    }
  }

  // Driver number validation
  if (formData.value.driver_number !== undefined && formData.value.driver_number !== null) {
    if (formData.value.driver_number < 1 || formData.value.driver_number > 999) {
      errors.value.driver_number = 'Driver number must be between 1 and 999';
    }
  }

  return Object.keys(errors.value).length === 0;
};

/**
 * Handle form submission
 */
const handleSubmit = (): void => {
  if (!validateForm()) {
    return;
  }

  // Clean up empty string values
  const cleanedData: CreateDriverRequest & Record<string, unknown> = {
    first_name: formData.value.first_name || undefined,
    last_name: formData.value.last_name || undefined,
    nickname: formData.value.nickname || undefined,
    email: formData.value.email || undefined,
    phone: formData.value.phone || undefined,
    driver_number: formData.value.driver_number,
    status: formData.value.status,
    league_notes: formData.value.league_notes || undefined,
  };

  // Add dynamic platform fields
  platformFormFields.value.forEach((field) => {
    const value = formData.value[field.field];
    if (value !== '' && value !== null && value !== undefined) {
      cleanedData[field.field] = value;
    }
  });

  emit('save', cleanedData as CreateDriverRequest);
};

/**
 * Handle cancel button click
 */
const handleCancel = (): void => {
  resetForm();
  emit('cancel');
  emit('update:visible', false);
};

/**
 * Reset form to initial state
 */
const resetForm = (): void => {
  const newFormData: CreateDriverRequest & Record<string, unknown> = {
    first_name: '',
    last_name: '',
    nickname: '',
    email: '',
    phone: '',
    driver_number: undefined,
    status: 'active',
    league_notes: '',
  };

  // Reset dynamic platform fields
  platformFormFields.value.forEach((field) => {
    newFormData[field.field] = field.type === 'number' ? undefined : '';
  });

  formData.value = newFormData;
  errors.value = {};
};

/**
 * Fetch platform form fields on mount if league is provided
 */
onMounted(async () => {
  if (props.leagueId) {
    try {
      await leagueStore.fetchDriverFormFieldsForLeague(props.leagueId);
      // Initialize form data with platform fields
      if (props.mode === 'create') {
        resetForm();
      }
    } catch (error) {
      console.error('Failed to fetch platform form fields:', error);
    }
  }
});
</script>

<template>
  <Dialog
    :visible="visible"
    :header="dialogTitle"
    :modal="true"
    :closable="true"
    :draggable="false"
    class="w-full max-w-2xl"
    @update:visible="$emit('update:visible', $event)"
  >
    <form class="space-y-4" @submit.prevent="handleSubmit">
      <!-- Name Fields -->
      <div class="grid grid-cols-3 gap-4">
        <FormInputGroup>
          <FormLabel for="first_name" text="First Name" />
          <InputText
            id="first_name"
            v-model="formData.first_name"
            placeholder="John"
            class="w-full"
          />
        </FormInputGroup>
        <FormInputGroup>
          <FormLabel for="last_name" text="Last Name" />
          <InputText
            id="last_name"
            v-model="formData.last_name"
            placeholder="Smith"
            class="w-full"
          />
        </FormInputGroup>
        <FormInputGroup>
          <FormLabel for="nickname" text="Nickname" />
          <InputText
            id="nickname"
            v-model="formData.nickname"
            placeholder="JSmith"
            class="w-full"
          />
        </FormInputGroup>
      </div>
      <FormHelper text="At least one name field is required" />
      <FormError :error="errors.name" />

      <!-- Contact Fields -->
      <div class="grid grid-cols-2 gap-4">
        <FormInputGroup>
          <FormLabel for="email" text="Email" />
          <InputText
            id="email"
            v-model="formData.email"
            type="email"
            placeholder="john@example.com"
            class="w-full"
          />
          <FormHelper text="Optional: Driver's email address" />
          <FormError :error="errors.email" />
        </FormInputGroup>
        <FormInputGroup>
          <FormLabel for="phone" text="Phone" />
          <InputText id="phone" v-model="formData.phone" placeholder="+1234567890" class="w-full" />
          <FormHelper text="Optional: Driver's phone number" />
        </FormInputGroup>
      </div>

      <!-- Dynamic Platform Fields - Rendered based on league's platforms -->
      <div v-if="hasAnyPlatformField" class="space-y-4">
        <div class="grid grid-cols-2 gap-4">
          <FormInputGroup v-for="field in platformFormFields" :key="field.field">
            <FormLabel :for="field.field" :text="field.label" />
            <InputText
              v-if="field.type === 'text'"
              :id="field.field"
              :model-value="(formData[field.field] as string) || ''"
              :placeholder="field.placeholder || ''"
              class="w-full"
              @update:model-value="formData[field.field] = $event"
            />
            <InputNumber
              v-else-if="field.type === 'number'"
              :id="field.field"
              :model-value="(formData[field.field] as number) || undefined"
              :use-grouping="false"
              :placeholder="field.placeholder || ''"
              class="w-full"
              @update:model-value="formData[field.field] = $event"
            />
          </FormInputGroup>
        </div>
        <FormHelper text="At least one platform ID is required" />
        <FormError :error="errors.platform" />
      </div>

      <!-- League-Specific Fields -->
      <div class="grid grid-cols-2 gap-4">
        <FormInputGroup>
          <FormLabel for="driver_number" text="Driver Number" />
          <InputNumber
            id="driver_number"
            v-model="formData.driver_number"
            :min="1"
            :max="999"
            :use-grouping="false"
            placeholder="5"
            class="w-full"
          />
          <FormHelper text="Optional: Between 1 and 999" />
          <FormError :error="errors.driver_number" />
        </FormInputGroup>
        <FormInputGroup>
          <FormLabel for="status" text="Status" />
          <Select
            id="status"
            v-model="formData.status"
            :options="statusOptions"
            option-label="label"
            option-value="value"
            placeholder="Select status"
            class="w-full"
          />
          <FormHelper text="Driver's current status in this league" />
        </FormInputGroup>
      </div>

      <!-- League Notes -->
      <FormInputGroup>
        <FormLabel for="league_notes" text="League Notes" />
        <Textarea
          id="league_notes"
          v-model="formData.league_notes"
          rows="3"
          placeholder="Add any notes about this driver..."
          class="w-full"
          maxlength="500"
        />
        <div class="flex justify-between items-center">
          <FormHelper text="Optional: Add notes specific to this league" />
          <FormCharacterCount :current="formData.league_notes?.length || 0" :max="500" />
        </div>
      </FormInputGroup>
    </form>

    <template #footer>
      <div class="flex justify-end gap-2">
        <Button label="Cancel" severity="secondary" @click="handleCancel" />
        <Button :label="mode === 'create' ? 'Add Driver' : 'Save Changes'" @click="handleSubmit" />
      </div>
    </template>
  </Dialog>
</template>
