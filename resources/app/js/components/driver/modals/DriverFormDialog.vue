<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import BaseModal from '@app/components/common/modals/BaseModal.vue';
import BaseModalHeader from '@app/components/common/modals/BaseModalHeader.vue';
import InputText from 'primevue/inputtext';
import InputNumber from 'primevue/inputnumber';
import Select from 'primevue/select';
import Textarea from 'primevue/textarea';
import Button from 'primevue/button';
import Accordion from 'primevue/accordion';
import AccordionPanel from 'primevue/accordionpanel';
import AccordionHeader from 'primevue/accordionheader';
import AccordionContent from 'primevue/accordioncontent';
import FormInputGroup from '@app/components/common/forms/FormInputGroup.vue';
import FormLabel from '@app/components/common/forms/FormLabel.vue';
import FormError from '@app/components/common/forms/FormError.vue';
import FormHelper from '@app/components/common/forms/FormHelper.vue';
import FormCharacterCount from '@app/components/common/forms/FormCharacterCount.vue';
import { useLeagueStore } from '@app/stores/leagueStore';
import { usePlatformFormFields } from '@app/composables/usePlatformFormFields';
import type { LeagueDriver, CreateDriverRequest, DriverFormData } from '@app/types/driver';

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

// Fetch platform form fields on mount if league is provided
if (props.leagueId) {
  usePlatformFormFields({
    leagueId: props.leagueId,
    onSuccess: () => {
      if (props.mode === 'create') {
        resetForm();
      }
    },
  });
}

// Form data - platform fields stored dynamically
const formData = ref<DriverFormData>({
  first_name: '',
  last_name: '',
  nickname: '',
  discord_id: '',
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
      const newFormData: DriverFormData = {
        first_name: driver?.first_name || '',
        last_name: driver?.last_name || '',
        nickname: driver?.nickname || '',
        discord_id: driver?.discord_id || '',
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

  // At least one of nickname or discord_id is required
  const hasIdentifier = formData.value.nickname || formData.value.discord_id;
  if (!hasIdentifier) {
    errors.value.identifier = 'At least one of Nickname or Discord ID is required';
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
  const cleanedData: DriverFormData = {
    first_name: formData.value.first_name || undefined,
    last_name: formData.value.last_name || undefined,
    nickname: formData.value.nickname || undefined,
    discord_id: formData.value.discord_id || undefined,
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
  const newFormData: DriverFormData = {
    first_name: '',
    last_name: '',
    nickname: '',
    discord_id: '',
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
</script>

<template>
  <BaseModal :visible="visible" width="2xl" @update:visible="$emit('update:visible', $event)">
    <template #header>
      <BaseModalHeader :title="dialogTitle" />
    </template>

    <form class="space-y-3" @submit.prevent="handleSubmit">
      <!-- Primary Fields Section -->
      <div class="space-y-3">
        <!-- Nickname and Discord ID - At least one required -->
        <div class="grid grid-cols-2 gap-3">
          <FormInputGroup>
            <FormLabel for="nickname" text="Nickname" />
            <InputText
              id="nickname"
              v-model="formData.nickname"
              placeholder="JSmith"
              class="w-full"
            />
          </FormInputGroup>

          <FormInputGroup>
            <FormLabel for="discord_id" text="Discord ID" />
            <InputText
              id="discord_id"
              v-model="formData.discord_id"
              placeholder="Discord username or ID"
              class="w-full"
            />
          </FormInputGroup>
        </div>

        <!-- Validation Message for Identifier -->
        <div v-if="errors.identifier">
          <FormError :error="errors.identifier" />
        </div>

        <!-- Status and Dynamic Platform Fields in Grid -->
        <div class="grid grid-cols-2 gap-3">
          <FormInputGroup>
            <FormLabel for="status" text="Status" required />
            <Select
              id="status"
              v-model="formData.status"
              :options="statusOptions"
              option-label="label"
              option-value="value"
              placeholder="Select status"
              class="w-full"
            />
          </FormInputGroup>

          <!-- Dynamic Platform Fields - Rendered based on league's platforms -->
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

        <!-- Platform Validation Message -->
        <div v-if="errors.platform">
          <FormError :error="errors.platform" />
        </div>
      </div>

      <!-- Secondary Fields Section (Expandable) -->
      <Accordion :multiple="false" class="mt-2">
        <AccordionPanel value="0">
          <AccordionHeader>
            <span class="text-sm font-medium text-gray-700">
              Additional Information (Optional)
            </span>
          </AccordionHeader>
          <AccordionContent>
            <div class="space-y-3 pt-2">
              <!-- Name Fields -->
              <div class="grid grid-cols-2 gap-3">
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
              </div>

              <!-- Contact Fields -->
              <div class="grid grid-cols-2 gap-3">
                <FormInputGroup>
                  <FormLabel for="email" text="Email" />
                  <InputText
                    id="email"
                    v-model="formData.email"
                    type="email"
                    placeholder="john@example.com"
                    class="w-full"
                  />
                  <FormError :error="errors.email" />
                </FormInputGroup>
                <FormInputGroup>
                  <FormLabel for="phone" text="Phone" />
                  <InputText
                    id="phone"
                    v-model="formData.phone"
                    placeholder="+1234567890"
                    class="w-full"
                  />
                </FormInputGroup>
                <!-- Driver Number -->
                <FormInputGroup>
                  <FormLabel for="driver_number" text="Driver Number" />
                  <InputNumber
                    id="driver_number"
                    v-model="formData.driver_number"
                    :min="1"
                    :max="999"
                    :use-grouping="false"
                    placeholder="5"
                    class=""
                  />
                  <FormHelper text="Between 1 and 999" />
                  <FormError :error="errors.driver_number" />
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
                  <FormHelper text="Notes specific to this league" />
                  <FormCharacterCount :current="formData.league_notes?.length || 0" :max="500" />
                </div>
              </FormInputGroup>
            </div>
          </AccordionContent>
        </AccordionPanel>
      </Accordion>
    </form>

    <template #footer>
      <div class="flex justify-end gap-2">
        <Button label="Cancel" severity="secondary" @click="handleCancel" />
        <Button :label="mode === 'create' ? 'Add Driver' : 'Save Changes'" @click="handleSubmit" />
      </div>
    </template>
  </BaseModal>
</template>
