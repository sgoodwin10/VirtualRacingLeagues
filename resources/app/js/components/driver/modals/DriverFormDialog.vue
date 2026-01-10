<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import BaseModal from '@app/components/common/modals/BaseModal.vue';
import { Button } from '@app/components/common/buttons';
import DriverEditSidebar from './partials/DriverEditSidebar.vue';
import BasicInfoSection from './partials/sections/BasicInfoSection.vue';
import AdditionalSection from './partials/sections/AdditionalSection.vue';
import { useLeagueStore } from '@app/stores/leagueStore';
import { usePlatformFormFields } from '@app/composables/usePlatformFormFields';
import type { LeagueDriver, CreateDriverRequest, DriverFormData } from '@app/types/driver';
import type { SectionId } from './partials/DriverEditSidebar.vue';

interface Props {
  visible: boolean;
  mode: 'create' | 'edit';
  driver?: LeagueDriver | null;
  leagueId: number;
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

// Loading state
const saving = ref(false);

// Active section for sidebar
const activeSection = ref<SectionId>('basic');

// Computed visibility
const isVisible = computed({
  get: () => props.visible,
  set: (value) => emit('update:visible', value),
});

// Dialog title
const dialogTitle = computed(() => {
  return props.mode === 'create' ? 'Add Driver' : 'Edit Driver';
});

// Fetch platform form fields - composable MUST be called unconditionally
// at the top level, not inside an if block
usePlatformFormFields({
  leagueId: props.leagueId,
  onSuccess: () => {
    if (props.mode === 'create') {
      resetForm();
    }
  },
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
    // Reset active section when modal opens
    if (visible) {
      activeSection.value = 'basic';
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
    // More comprehensive email regex that catches common invalid cases
    const emailRegex =
      /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
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
 * Handle modal close
 */
const handleClose = (): void => {
  resetForm();
};

/**
 * Handle cancel button click
 */
const handleCancel = (): void => {
  resetForm();
  emit('cancel');
  isVisible.value = false;
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

/**
 * Handle section change from sidebar
 */
const handleSectionChange = (sectionId: SectionId): void => {
  activeSection.value = sectionId;
};

/**
 * Handle platform field update
 */
const handlePlatformFieldUpdate = (field: string, value: string | number | undefined): void => {
  formData.value[field] = value;
};
</script>

<template>
  <BaseModal
    v-model:visible="isVisible"
    :header="dialogTitle"
    width="6xl"
    :closable="!saving"
    :dismissable-mask="false"
    :loading="saving"
    content-class="!p-0"
    @hide="handleClose"
  >
    <!-- Split Layout -->
    <div class="grid grid-cols-[200px_1fr] min-h-[520px] max-h-[72vh]">
      <!-- Sidebar -->
      <DriverEditSidebar :active-section="activeSection" @change-section="handleSectionChange" />

      <!-- Main Content -->
      <main class="overflow-y-auto bg-[var(--bg-dark)] p-6">
        <!-- Basic Info Section -->
        <BasicInfoSection
          v-show="activeSection === 'basic'"
          :nickname="formData.nickname || ''"
          :discord-id="formData.discord_id || ''"
          :status="formData.status || 'active'"
          :first-name="formData.first_name || ''"
          :last-name="formData.last_name || ''"
          :platform-form-fields="platformFormFields"
          :form-data="formData"
          :errors="{
            identifier: errors.identifier,
            status: errors.status,
            platform: errors.platform,
          }"
          :disabled="saving"
          @update:nickname="formData.nickname = $event"
          @update:discord-id="formData.discord_id = $event"
          @update:status="formData.status = $event as 'active' | 'inactive' | 'banned'"
          @update:first-name="formData.first_name = $event"
          @update:last-name="formData.last_name = $event"
          @update:platform-field="handlePlatformFieldUpdate"
        />

        <!-- Additional Section -->
        <AdditionalSection
          v-show="activeSection === 'additional'"
          :email="formData.email || ''"
          :phone="formData.phone || ''"
          :driver-number="formData.driver_number"
          :league-notes="formData.league_notes || ''"
          :errors="{
            email: errors.email,
            driver_number: errors.driver_number,
          }"
          :disabled="saving"
          @update:email="formData.email = $event"
          @update:phone="formData.phone = $event"
          @update:driver-number="formData.driver_number = $event"
          @update:league-notes="formData.league_notes = $event"
        />
      </main>
    </div>

    <template #footer>
      <div class="flex gap-2 justify-end">
        <Button label="Cancel" variant="secondary" :disabled="saving" @click="handleCancel" />
        <Button
          :label="mode === 'create' ? 'Add Driver' : 'Save Changes'"
          :loading="saving"
          :disabled="saving"
          variant="success"
          @click="handleSubmit"
        />
      </div>
    </template>
  </BaseModal>
</template>
