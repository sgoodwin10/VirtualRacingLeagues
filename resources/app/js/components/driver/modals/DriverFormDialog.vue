<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import BaseModal from '@app/components/common/modals/BaseModal.vue';
import { Button } from '@app/components/common/buttons';
import DriverEditSidebar from '@app/components/driver/modals/partials/DriverEditSidebar.vue';
import BasicInfoSection from '@app/components/driver/modals/partials/sections/BasicInfoSection.vue';
import AdditionalSection from '@app/components/driver/modals/partials/sections/AdditionalSection.vue';
import { useLeagueStore } from '@app/stores/leagueStore';
import { usePlatformFormFields } from '@app/composables/usePlatformFormFields';
import type { LeagueDriver, CreateDriverRequest, DriverFormData } from '@app/types/driver';
import type { SectionId } from '@app/components/driver/modals/partials/DriverEditSidebar.vue';

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

// General/server error (not tied to a specific field)
const generalError = ref<string>('');

// Loading state
const saving = ref(false);

// Active section for sidebar
const activeSection = ref<SectionId>('basic');

// Track if user has manually entered a nickname
const userHasEnteredNickname = ref(false);

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
      // If editing and nickname exists, mark as user-entered
      userHasEnteredNickname.value = !!driver?.nickname;
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
 * Auto-populate nickname based on priority:
 * 1. Discord ID (highest priority)
 * 2. First available platform ID field
 * 3. First Name (lowest priority)
 *
 * This method is called whenever relevant fields change
 */
const autoPopulateNickname = (): void => {
  // Skip if user has manually entered a nickname or we're in edit mode
  if (userHasEnteredNickname.value || props.mode === 'edit') {
    return;
  }

  // Priority 1: Discord ID
  if (formData.value.discord_id?.trim()) {
    formData.value.nickname = formData.value.discord_id.trim();
    return;
  }

  // Priority 2: First available platform ID
  for (const field of platformFormFields.value) {
    const value = formData.value[field.field];
    if (value && String(value).trim()) {
      formData.value.nickname = String(value).trim();
      return;
    }
  }

  // Priority 3: First Name (lowest priority)
  if (formData.value.first_name?.trim()) {
    formData.value.nickname = formData.value.first_name.trim();
    return;
  }

  // If none of the source fields have values, clear the nickname
  formData.value.nickname = '';
};

// Note: Auto-population is now handled directly in event handlers
// (handleDiscordIdUpdate, handleFirstNameUpdate, handlePlatformFieldUpdate)
// rather than through a watcher for better testability and predictability

/**
 * Validate form data
 */
const validateForm = (): boolean => {
  errors.value = {};
  generalError.value = '';

  // Check if driver has any name field (nickname, first_name, or last_name)
  const hasName = formData.value.nickname || formData.value.first_name || formData.value.last_name;

  // Check if driver has any platform ID (discord_id or any dynamic platform field)
  let hasPlatformId = !!formData.value.discord_id;

  if (!hasPlatformId && hasAnyPlatformField.value) {
    hasPlatformId = platformFormFields.value.some((field) => {
      const value = formData.value[field.field];
      return value !== undefined && value !== null && value !== '';
    });
  }

  // Require at least one name field OR at least one platform ID
  if (!hasName && !hasPlatformId) {
    errors.value.identifier =
      'Either a name field (Nickname, First Name, or Last Name) or a platform ID is required';
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

  // Clean up empty string values - convert to null for proper backend handling
  const cleanedData: DriverFormData = {
    first_name: formData.value.first_name || null,
    last_name: formData.value.last_name || null,
    nickname: formData.value.nickname || null,
    discord_id: formData.value.discord_id || null,
    email: formData.value.email || null,
    phone: formData.value.phone || null,
    driver_number: formData.value.driver_number,
    status: formData.value.status,
    league_notes: formData.value.league_notes || null,
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
  generalError.value = '';
  userHasEnteredNickname.value = false; // Reset manual entry flag
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
  // Trigger auto-population after platform field update
  autoPopulateNickname();
};

/**
 * Handle field updates that might trigger auto-population
 */
const handleDiscordIdUpdate = (value: string): void => {
  formData.value.discord_id = value;
  autoPopulateNickname();
};

const handleFirstNameUpdate = (value: string): void => {
  formData.value.first_name = value;
  autoPopulateNickname();
};

/**
 * Handle nickname manual input
 * Marks the nickname as manually entered by the user
 */
const handleNicknameUpdate = (value: string): void => {
  // If user enters any value (including empty string), mark as manually entered
  userHasEnteredNickname.value = true;
  formData.value.nickname = value;
};

/**
 * Set a server/general error message
 * This is used by parent components to display API errors that don't map to specific fields
 */
const setServerError = (message: string): void => {
  generalError.value = message;
};

// Expose methods and state for testing
defineExpose({
  getFormData: () => formData.value,
  errors,
  generalError,
  dialogTitle,
  validateForm,
  handleSubmit,
  handleCancel,
  resetForm,
  autoPopulateNickname,
  handleNicknameUpdate,
  handleDiscordIdUpdate,
  handleFirstNameUpdate,
  handlePlatformFieldUpdate,
  userHasEnteredNickname,
  setServerError,
});
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
      <DriverEditSidebar
        :active-section="activeSection"
        :general-error="generalError"
        @change-section="handleSectionChange"
      />

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
          @update:nickname="handleNicknameUpdate"
          @update:discord-id="handleDiscordIdUpdate"
          @update:status="formData.status = $event as 'active' | 'inactive' | 'banned'"
          @update:first-name="handleFirstNameUpdate"
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
