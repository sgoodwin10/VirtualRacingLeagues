<script setup lang="ts">
import { ref, computed } from 'vue';
import { useSeasonStore } from '@app/stores/seasonStore';
import { useToast } from 'primevue/usetoast';
import type { Season } from '@app/types/season';

import BaseModal from '@app/components/common/modals/BaseModal.vue';
import BaseModalHeader from '@app/components/common/modals/BaseModalHeader.vue';
import { Button } from '@app/components/common/buttons';
import Message from 'primevue/message';
import InputText from 'primevue/inputtext';
import FormInputGroup from '@app/components/common/forms/FormInputGroup.vue';
import FormLabel from '@app/components/common/forms/FormLabel.vue';

interface Props {
  visible: boolean;
  season: Season | null;
}

const props = defineProps<Props>();

interface Emits {
  (e: 'update:visible', value: boolean): void;
  (e: 'confirmed', seasonId: number): void;
}

const emit = defineEmits<Emits>();

const seasonStore = useSeasonStore();
const toast = useToast();

const step = ref<'suggest-archive' | 'confirm-delete'>('suggest-archive');
const confirmationText = ref('');
const isDeleting = ref(false);

function handleUpdateVisible(value: boolean): void {
  emit('update:visible', value);
  if (!value) {
    step.value = 'suggest-archive';
    confirmationText.value = '';
  }
}

const canDelete = computed(() => confirmationText.value === 'DELETE');

async function handleArchive(): Promise<void> {
  if (!props.season) return;

  try {
    await seasonStore.archiveExistingSeason(props.season.id);

    toast.add({
      severity: 'success',
      summary: 'Season Archived',
      detail: 'Season has been archived successfully',
      life: 3000,
    });

    handleUpdateVisible(false);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to archive season';
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: errorMessage,
      life: 5000,
    });
  }
}

function continueToDelete(): void {
  step.value = 'confirm-delete';
}

async function handleConfirmDelete(): Promise<void> {
  if (!canDelete.value || !props.season) return;

  isDeleting.value = true;

  try {
    await seasonStore.deleteExistingSeason(props.season.id);

    toast.add({
      severity: 'success',
      summary: 'Season Deleted',
      detail: 'Season has been permanently deleted',
      life: 3000,
    });

    emit('confirmed', props.season.id);
    handleUpdateVisible(false);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to delete season';
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: errorMessage,
      life: 5000,
    });
  } finally {
    isDeleting.value = false;
  }
}

function handleCancel(): void {
  handleUpdateVisible(false);
}
</script>

<template>
  <BaseModal :visible="visible" width="2xl" @update:visible="handleUpdateVisible">
    <template #header>
      <BaseModalHeader title="Delete Season">
        <template #default>
          <div class="flex items-center gap-3">
            <i class="pi pi-trash text-red-500 text-2xl"></i>
            <span class="text-xl font-bold">Delete Season</span>
          </div>
        </template>
      </BaseModalHeader>
    </template>

    <!-- Step 1: Suggest Archive -->
    <div v-if="step === 'suggest-archive'" class="py-4">
      <Message severity="info" :closable="false" class="mb-4">
        <strong>Consider Archiving Instead</strong>
      </Message>

      <p class="mb-4">Archiving preserves all your data and allows you to review it later.</p>

      <div class="grid grid-cols-2 gap-4 mb-4">
        <!-- Archive Option -->
        <div class="border rounded-lg p-4">
          <h4 class="font-semibold mb-2">Archive</h4>
          <ul class="text-sm space-y-1">
            <li class="flex items-start">
              <i class="pi pi-check text-green-600 mr-2 mt-0.5"></i>
              <span>Preserves all data</span>
            </li>
            <li class="flex items-start">
              <i class="pi pi-check text-green-600 mr-2 mt-0.5"></i>
              <span>Can review later</span>
            </li>
            <li class="flex items-start">
              <i class="pi pi-check text-green-600 mr-2 mt-0.5"></i>
              <span>Hidden from active lists</span>
            </li>
          </ul>
        </div>

        <!-- Delete Option -->
        <div class="border rounded-lg p-4 border-red-300 bg-red-50">
          <h4 class="font-semibold mb-2 text-red-700">Delete</h4>
          <ul class="text-sm space-y-1 text-red-600">
            <li class="flex items-start">
              <i class="pi pi-times mr-2 mt-0.5"></i>
              <span>Permanent removal</span>
            </li>
            <li class="flex items-start">
              <i class="pi pi-times mr-2 mt-0.5"></i>
              <span>Cannot undo</span>
            </li>
            <li class="flex items-start">
              <i class="pi pi-times mr-2 mt-0.5"></i>
              <span>All data lost</span>
            </li>
          </ul>
        </div>
      </div>
    </div>

    <!-- Step 2: Confirm Delete -->
    <div v-else-if="step === 'confirm-delete'" class="py-4">
      <Message severity="error" :closable="false" class="mb-4">
        <strong>DANGER ZONE</strong>
      </Message>

      <p class="mb-4">
        Deleting <strong>{{ season?.name }}</strong> will permanently remove:
      </p>

      <ul class="list-disc pl-6 mb-4 space-y-2">
        <li>All driver assignments for this season</li>
        <li>All race results and standings</li>
        <li>All divisions and teams</li>
        <li>All historical data</li>
      </ul>

      <Message variant="warning" :closable="false" class="mb-4">
        This action CANNOT be undone!
      </Message>

      <FormInputGroup>
        <FormLabel for="confirm" text='Type "DELETE" to confirm' required />
        <InputText
          id="confirm"
          v-model="confirmationText"
          placeholder="DELETE"
          :disabled="isDeleting"
        />
      </FormInputGroup>
    </div>

    <template #footer>
      <div class="flex gap-2 justify-end">
        <Button label="Cancel" variant="outline" :disabled="isDeleting" @click="handleCancel" />

        <!-- Step 1 buttons -->
        <template v-if="step === 'suggest-archive'">
          <Button label="Archive Instead" variant="secondary" @click="handleArchive" />
          <Button label="Continue to Delete" variant="danger" @click="continueToDelete" />
        </template>

        <!-- Step 2 button -->
        <Button
          v-else
          label="Delete Season"
          variant="danger"
          :loading="isDeleting"
          :disabled="!canDelete"
          @click="handleConfirmDelete"
        />
      </div>
    </template>
  </BaseModal>
</template>
