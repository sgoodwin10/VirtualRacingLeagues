<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue';
import { useToast } from 'primevue/usetoast';
import { useSeasonDriverStore } from '@app/stores/seasonDriverStore';
import { useSeasonDriverValidation } from '@app/composables/useSeasonDriverValidation';
import type { SeasonDriver, SeasonDriverForm } from '@app/types/seasonDriver';

import BaseModal from '@app/components/common/modals/BaseModal.vue';
import BaseModalHeader from '@app/components/common/modals/BaseModalHeader.vue';
import Button from 'primevue/button';
import Select from 'primevue/select';
import Textarea from 'primevue/textarea';

import FormLabel from '@app/components/common/forms/FormLabel.vue';
import FormError from '@app/components/common/forms/FormError.vue';
import FormInputGroup from '@app/components/common/forms/FormInputGroup.vue';
import FormOptionalText from '@app/components/common/forms/FormOptionalText.vue';

interface Props {
  visible: boolean;
  seasonId: number;
  seasonDriver?: SeasonDriver | null;
}

const props = withDefaults(defineProps<Props>(), {
  seasonDriver: null,
});

interface Emits {
  (e: 'update:visible', value: boolean): void;
  (e: 'saved'): void;
}

const emit = defineEmits<Emits>();

const toast = useToast();
const seasonDriverStore = useSeasonDriverStore();

const form = reactive<SeasonDriverForm>({
  status: 'active',
  notes: '',
});

const isSubmitting = ref(false);

const { errors, validateAll, clearError } = useSeasonDriverValidation(form);

function handleUpdateVisible(value: boolean): void {
  emit('update:visible', value);
}

function getSeasonDriverDisplayName(seasonDriver: SeasonDriver): string {
  const { first_name, last_name, nickname } = seasonDriver;

  if (first_name && last_name) {
    return `${first_name} ${last_name}`;
  }

  return nickname || 'Unknown Driver';
}

const dialogTitle = computed(() => {
  return `Edit ${props.seasonDriver ? getSeasonDriverDisplayName(props.seasonDriver) : 'Driver'}`;
});

const statusOptions = [
  { label: 'Active', value: 'active' },
  { label: 'Reserve', value: 'reserve' },
  { label: 'Withdrawn', value: 'withdrawn' },
];

const canSubmit = computed(() => {
  return !isSubmitting.value && !errors.status && !errors.notes;
});

watch(
  () => props.visible,
  (visible) => {
    if (visible && props.seasonDriver) {
      loadSeasonDriverData();
    }
  },
);

function loadSeasonDriverData(): void {
  if (!props.seasonDriver) return;

  form.status = props.seasonDriver.status;
  form.notes = props.seasonDriver.notes || '';
}

function resetForm(): void {
  form.status = 'active';
  form.notes = '';
  errors.status = undefined;
  errors.notes = undefined;
}

function handleCancel(): void {
  handleUpdateVisible(false);
  resetForm();
}

async function handleSubmit(): Promise<void> {
  if (!validateAll()) {
    return;
  }

  if (!props.seasonDriver) throw new Error('Season driver is required for edit mode');

  isSubmitting.value = true;

  try {
    await seasonDriverStore.updateDriver(props.seasonId, props.seasonDriver.id, {
      status: form.status,
      notes: form.notes || null,
    });

    toast.add({
      severity: 'success',
      summary: 'Driver Updated',
      detail: 'Driver details have been updated',
      life: 3000,
    });

    emit('saved');
    handleUpdateVisible(false);
    resetForm();
  } catch (error: unknown) {
    console.error('Failed to save season driver:', error);

    const errorMessage = error instanceof Error ? error.message : 'Failed to save driver';

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
</script>

<template>
  <BaseModal :visible="visible" width="lg" @update:visible="handleUpdateVisible">
    <template #header>
      <BaseModalHeader :title="dialogTitle" />
    </template>

    <div class="space-y-4 py-4">
      <!-- Status -->
      <FormInputGroup>
        <FormLabel for="status" text="Status" required />
        <Select
          id="status"
          v-model="form.status"
          :options="statusOptions"
          option-label="label"
          option-value="value"
          :class="{ 'p-invalid': errors.status }"
          :disabled="isSubmitting"
          class="w-full"
          @update:model-value="clearError('status')"
        />
        <FormOptionalText text="Driver's status in this season" />
        <FormError :error="errors.status" />
      </FormInputGroup>

      <!-- Notes -->
      <FormInputGroup>
        <FormLabel for="notes" text="Notes" />
        <Textarea
          id="notes"
          v-model="form.notes"
          rows="4"
          placeholder="Internal notes about this driver in this season..."
          :class="{ 'p-invalid': errors.notes }"
          :disabled="isSubmitting"
          maxlength="1000"
          class="w-full"
          @update:model-value="clearError('notes')"
        />
        <FormOptionalText text="Optional internal notes (not visible to drivers)" />
        <FormError :error="errors.notes" />
      </FormInputGroup>
    </div>

    <template #footer>
      <div class="flex gap-2 justify-end">
        <Button label="Cancel" outlined :disabled="isSubmitting" @click="handleCancel" />
        <Button
          label="Save Changes"
          :loading="isSubmitting"
          :disabled="!canSubmit"
          @click="handleSubmit"
        />
      </div>
    </template>
  </BaseModal>
</template>
