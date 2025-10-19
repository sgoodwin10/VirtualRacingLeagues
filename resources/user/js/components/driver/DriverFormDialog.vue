<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import Dialog from 'primevue/dialog';
import InputText from 'primevue/inputtext';
import InputNumber from 'primevue/inputnumber';
import Select from 'primevue/select';
import Textarea from 'primevue/textarea';
import Button from 'primevue/button';
import FormLabel from '@user/components/common/FormLabel.vue';
import FormError from '@user/components/common/FormError.vue';
import type { LeagueDriver, CreateDriverRequest } from '@user/types/driver';
import type { Platform } from '@user/types/league';

interface Props {
  visible: boolean;
  mode: 'create' | 'edit';
  driver?: LeagueDriver | null;
  leaguePlatforms?: Platform[];
}

interface Emits {
  (e: 'update:visible', value: boolean): void;
  (e: 'save', data: CreateDriverRequest): void;
  (e: 'cancel'): void;
}

const props = withDefaults(defineProps<Props>(), {
  leaguePlatforms: () => [],
});
const emit = defineEmits<Emits>();

// Form data
const formData = ref<CreateDriverRequest>({
  first_name: '',
  last_name: '',
  nickname: '',
  email: '',
  phone: '',
  psn_id: '',
  gt7_id: '',
  iracing_id: '',
  iracing_customer_id: undefined,
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

// Determine which platform fields to show based on league platforms
const showPlatformFields = computed(() => {
  const platformSlugs = props.leaguePlatforms.map(p => p.slug.toLowerCase());
  return {
    psn: platformSlugs.includes('playstation') || platformSlugs.includes('psn'),
    gt7: platformSlugs.includes('gran turismo') || platformSlugs.includes('gt7'),
    iracing: platformSlugs.includes('iracing'),
  };
});

// Check if at least one platform field is shown
const hasAnyPlatformField = computed(() => {
  return showPlatformFields.value.psn || showPlatformFields.value.gt7 || showPlatformFields.value.iracing;
});

// Watch for driver changes in edit mode
watch(
  () => props.driver,
  (leagueDriver) => {
    if (leagueDriver && props.mode === 'edit') {
      const driver = leagueDriver.driver;
      formData.value = {
        first_name: driver?.first_name || '',
        last_name: driver?.last_name || '',
        nickname: driver?.nickname || '',
        email: driver?.email || '',
        phone: driver?.phone || '',
        psn_id: driver?.psn_id || '',
        gt7_id: driver?.gt7_id || '',
        iracing_id: driver?.iracing_id || '',
        iracing_customer_id: driver?.iracing_customer_id || undefined,
        driver_number: leagueDriver.driver_number || undefined,
        status: leagueDriver.status || 'active',
        league_notes: leagueDriver.league_notes || '',
      };
    }
  },
  { immediate: true }
);

// Watch for visible changes to reset form in create mode
watch(
  () => props.visible,
  (visible) => {
    if (visible && props.mode === 'create') {
      resetForm();
    }
  }
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

  // At least one platform ID is required (only check platforms shown for this league)
  if (hasAnyPlatformField.value) {
    const hasPlatform =
      (showPlatformFields.value.psn && formData.value.psn_id) ||
      (showPlatformFields.value.gt7 && formData.value.gt7_id) ||
      (showPlatformFields.value.iracing && (formData.value.iracing_id || formData.value.iracing_customer_id));

    if (!hasPlatform) {
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
  const cleanedData: CreateDriverRequest = {
    ...formData.value,
    first_name: formData.value.first_name || undefined,
    last_name: formData.value.last_name || undefined,
    nickname: formData.value.nickname || undefined,
    email: formData.value.email || undefined,
    phone: formData.value.phone || undefined,
    psn_id: formData.value.psn_id || undefined,
    gt7_id: formData.value.gt7_id || undefined,
    iracing_id: formData.value.iracing_id || undefined,
    league_notes: formData.value.league_notes || undefined,
  };

  emit('save', cleanedData);
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
  formData.value = {
    first_name: '',
    last_name: '',
    nickname: '',
    email: '',
    phone: '',
    psn_id: '',
    gt7_id: '',
    iracing_id: '',
    iracing_customer_id: undefined,
    driver_number: undefined,
    status: 'active',
    league_notes: '',
  };
  errors.value = {};
};
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
        <div class="form-field">
          <FormLabel for="first_name" text="First Name" />
          <InputText
            id="first_name"
            v-model="formData.first_name"
            placeholder="John"
            class="w-full"
          />
        </div>
        <div class="form-field">
          <FormLabel for="last_name" text="Last Name" />
          <InputText
            id="last_name"
            v-model="formData.last_name"
            placeholder="Smith"
            class="w-full"
          />
        </div>
        <div class="form-field">
          <FormLabel for="nickname" text="Nickname" />
          <InputText
            id="nickname"
            v-model="formData.nickname"
            placeholder="JSmith"
            class="w-full"
          />
        </div>
      </div>
      <FormError :error="errors.name" />

      <!-- Contact Fields -->
      <div class="grid grid-cols-2 gap-4">
        <div class="form-field">
          <FormLabel for="email" text="Email (Optional)" />
          <InputText
            id="email"
            v-model="formData.email"
            type="email"
            placeholder="john@example.com"
            class="w-full"
          />
          <FormError :error="errors.email" />
        </div>
        <div class="form-field">
          <FormLabel for="phone" text="Phone (Optional)" />
          <InputText id="phone" v-model="formData.phone" placeholder="+1234567890" class="w-full" />
        </div>
      </div>

      <!-- Platform IDs - Only show platforms used by the league -->
      <div v-if="hasAnyPlatformField" class="space-y-4">
        <div class="grid grid-cols-2 gap-4">
          <div v-if="showPlatformFields.psn" class="form-field">
            <FormLabel for="psn_id" text="PSN ID" />
            <InputText
              id="psn_id"
              v-model="formData.psn_id"
              placeholder="JohnSmith77"
              class="w-full"
            />
          </div>
          <div v-if="showPlatformFields.gt7" class="form-field">
            <FormLabel for="gt7_id" text="GT7 ID" />
            <InputText
              id="gt7_id"
              v-model="formData.gt7_id"
              placeholder="JohnSmith_GT"
              class="w-full"
            />
          </div>
          <div v-if="showPlatformFields.iracing" class="form-field">
            <FormLabel for="iracing_id" text="iRacing ID" />
            <InputText
              id="iracing_id"
              v-model="formData.iracing_id"
              placeholder="JohnSmith"
              class="w-full"
            />
          </div>
          <div v-if="showPlatformFields.iracing" class="form-field">
            <FormLabel for="iracing_customer_id" text="iRacing Customer ID" />
            <InputNumber
              id="iracing_customer_id"
              v-model="formData.iracing_customer_id"
              :use-grouping="false"
              placeholder="123456"
              class="w-full"
            />
          </div>
        </div>
        <div class="text-sm text-gray-600">
          * At least one platform ID is required
        </div>
        <FormError :error="errors.platform" />
      </div>

      <!-- League-Specific Fields -->
      <div class="grid grid-cols-2 gap-4">
        <div class="form-field">
          <FormLabel for="driver_number" text="Driver Number (Optional)" />
          <InputNumber
            id="driver_number"
            v-model="formData.driver_number"
            :min="1"
            :max="999"
            :use-grouping="false"
            placeholder="5"
            class="w-full"
          />
          <FormError :error="errors.driver_number" />
        </div>
        <div class="form-field">
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
        </div>
      </div>

      <!-- League Notes -->
      <div class="form-field">
        <FormLabel for="league_notes" text="League Notes (Optional)" />
        <Textarea
          id="league_notes"
          v-model="formData.league_notes"
          rows="3"
          placeholder="Add any notes about this driver..."
          class="w-full"
        />
      </div>
    </form>

    <template #footer>
      <div class="flex justify-end gap-2">
        <Button label="Cancel" severity="secondary" @click="handleCancel" />
        <Button :label="mode === 'create' ? 'Add Driver' : 'Save Changes'" @click="handleSubmit" />
      </div>
    </template>
  </Dialog>
</template>
