<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue';
import { useToast } from 'primevue/usetoast';
import { useDivisionStore } from '@app/stores/divisionStore';
import type { Division, DivisionForm, DivisionFormErrors } from '@app/types/division';

// PrimeVue Components
import { Button } from '@app/components/common/buttons';
import InputText from 'primevue/inputtext';
import Textarea from 'primevue/textarea';

// Common Components
import BaseModal from '@app/components/common/modals/BaseModal.vue';
import FormLabel from '@app/components/common/forms/FormLabel.vue';
import FormError from '@app/components/common/forms/FormError.vue';
import FormInputGroup from '@app/components/common/forms/FormInputGroup.vue';
import ImageUpload from '@app/components/common/forms/ImageUpload.vue';

// Props
interface Props {
  visible: boolean;
  mode: 'add' | 'edit';
  seasonId: number;
  division?: Division | null;
}

const props = withDefaults(defineProps<Props>(), {
  division: null,
});

// Emits
interface Emits {
  (e: 'update:visible', value: boolean): void;
  (e: 'save', division: Division): void;
}

const emit = defineEmits<Emits>();

// Composables
const toast = useToast();
const divisionStore = useDivisionStore();

// State
const form = reactive<DivisionForm>({
  name: '',
  description: '',
  logo: null,
  logo_url: null,
});

const errors = reactive<DivisionFormErrors>({
  name: undefined,
  description: undefined,
  logo: undefined,
});

const isSubmitting = ref(false);

// Computed
const localVisible = computed({
  get: () => props.visible,
  set: (value) => emit('update:visible', value),
});

const modalTitle = computed(() => (props.mode === 'add' ? 'Add Division' : 'Edit Division'));

const descriptionCharCount = computed(() => form.description.length);

const canSubmit = computed(() => {
  return (
    !isSubmitting.value &&
    form.name.trim().length >= 2 &&
    !errors.name &&
    !errors.description &&
    !errors.logo
  );
});

// Watch drawer visibility
watch(
  () => props.visible,
  (visible) => {
    if (visible) {
      if (props.mode === 'edit' && props.division) {
        loadDivisionData();
      } else {
        resetForm();
      }
    }
  },
);

// Methods
function loadDivisionData(): void {
  if (!props.division) return;

  form.name = props.division.name;
  form.description = props.division.description || '';
  form.logo = null;
  // Prefer new media format, fallback to old URL format
  form.logo_url = props.division.logo?.original ?? props.division.logo_url;
}

function resetForm(): void {
  form.name = '';
  form.description = '';
  form.logo = null;
  form.logo_url = null;
  errors.name = undefined;
  errors.description = undefined;
  errors.logo = undefined;
}

function validateName(): boolean {
  errors.name = undefined;

  if (!form.name.trim()) {
    errors.name = 'Division name is required';
    return false;
  }

  if (form.name.trim().length < 2) {
    errors.name = 'Division name must be at least 2 characters';
    return false;
  }

  if (form.name.length > 60) {
    errors.name = 'Division name must not exceed 60 characters';
    return false;
  }

  return true;
}

function validateDescription(): boolean {
  errors.description = undefined;

  // Description is optional, but if provided it must be valid
  if (form.description.trim().length > 0) {
    if (form.description.trim().length < 10) {
      errors.description = 'Description must be at least 10 characters';
      return false;
    }

    if (form.description.length > 500) {
      errors.description = 'Description must not exceed 500 characters';
      return false;
    }
  }

  return true;
}

function validateAll(): boolean {
  return validateName() && validateDescription();
}

function handleCancel(): void {
  localVisible.value = false;
  resetForm();
}

async function handleSubmit(): Promise<void> {
  if (!validateAll()) {
    return;
  }

  isSubmitting.value = true;

  try {
    if (props.mode === 'edit' && props.division) {
      const updated = await divisionStore.updateDivision(props.seasonId, props.division.id, {
        name: form.name,
        description: form.description.trim() || null,
        logo: form.logo,
      });

      toast.add({
        severity: 'success',
        summary: 'Division Updated',
        detail: 'Division has been updated successfully',
        life: 3000,
      });

      emit('save', updated);
    } else {
      const created = await divisionStore.createDivision(props.seasonId, {
        name: form.name,
        description: form.description.trim() || undefined,
        logo: form.logo || undefined,
      });

      toast.add({
        severity: 'success',
        summary: 'Division Created',
        detail: 'Division has been created successfully',
        life: 3000,
      });

      emit('save', created);
    }

    localVisible.value = false;
    resetForm();
  } catch (error: unknown) {
    // Clear file input on error to prevent stale file objects
    form.logo = null;

    const errorMessage = error instanceof Error ? error.message : 'Failed to save division';

    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: errorMessage,
      life: 5000,
    });
  } finally {
    isSubmitting.value = false;
  }
}

function clearNameError(): void {
  errors.name = undefined;
}

function clearDescriptionError(): void {
  errors.description = undefined;
}
</script>

<template>
  <BaseModal
    v-model:visible="localVisible"
    :header="modalTitle"
    width="lg"
    :closable="!isSubmitting"
    :dismissable-mask="false"
  >
    <div class="space-y-6">
      <!-- Division Name Field -->
      <FormInputGroup>
        <FormLabel for="division-name" text="Division Name" required />
        <InputText
          id="division-name"
          v-model="form.name"
          size="sm"
          placeholder="e.g., Pro Division, Amateur Division"
          :class="{ 'p-invalid': errors.name }"
          :disabled="isSubmitting"
          maxlength="60"
          class="w-full"
          @input="clearNameError"
        />
        <FormError :error="errors.name" />
      </FormInputGroup>

      <!-- Division Description Field (Optional) -->
      <FormInputGroup>
        <FormLabel for="division-description" text="Description" />
        <Textarea
          id="division-description"
          v-model="form.description"
          rows="4"
          placeholder="Describe this division (optional)"
          :class="{ 'p-invalid': errors.description }"
          :disabled="isSubmitting"
          maxlength="500"
          class="w-full"
          @input="clearDescriptionError"
        />
        <div class="flex justify-between items-center">
          <FormError :error="errors.description" />
          <span class="text-sm text-gray-500">{{ descriptionCharCount }}/500</span>
        </div>
      </FormInputGroup>

      <!-- Division Logo Upload -->
      <FormInputGroup>
        <ImageUpload
          v-model="form.logo"
          label="Division Logo"
          label-text="Division Logo"
          :existing-image-url="form.logo_url"
          accept="image/png,image/jpeg,image/jpg"
          :max-file-size="2 * 1024 * 1024"
          :min-dimensions="{ width: 100, height: 100 }"
          :recommended-dimensions="{ width: 300, height: 300 }"
          preview-size="sm"
          helper-text="A square logo. Recommended: 300x300px. Optional."
        />
        <FormError :error="errors.logo" />
      </FormInputGroup>
    </div>

    <template #footer>
      <div class="flex gap-2 justify-end">
        <Button label="Cancel" variant="secondary" :disabled="isSubmitting" @click="handleCancel" />
        <Button
          :label="mode === 'add' ? 'Create Division' : 'Save Changes'"
          :loading="isSubmitting"
          :disabled="!canSubmit"
          @click="handleSubmit"
        />
      </div>
    </template>
  </BaseModal>
</template>
