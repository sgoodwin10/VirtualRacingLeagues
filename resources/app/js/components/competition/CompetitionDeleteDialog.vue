<script setup lang="ts">
import { ref, computed } from 'vue';
import { useCompetitionStore } from '@app/stores/competitionStore';
import { useToast } from 'primevue/usetoast';
import type { Competition } from '@app/types/competition';

import Dialog from 'primevue/dialog';
import Button from 'primevue/button';
import Message from 'primevue/message';
import InputText from 'primevue/inputtext';
import FormInputGroup from '@app/components/common/forms/FormInputGroup.vue';
import FormLabel from '@app/components/common/forms/FormLabel.vue';

interface Props {
  visible: boolean;
  competition: Competition | null;
}

const props = defineProps<Props>();

interface Emits {
  (e: 'update:visible', value: boolean): void;
  (e: 'confirmed', competitionId: number): void;
}

const emit = defineEmits<Emits>();

const competitionStore = useCompetitionStore();
const toast = useToast();

const step = ref<'suggest-archive' | 'confirm-delete'>('suggest-archive');
const confirmationText = ref('');
const isDeleting = ref(false);

const localVisible = computed({
  get: () => props.visible,
  set: (value) => {
    emit('update:visible', value);
    if (!value) {
      // Reset on close
      step.value = 'suggest-archive';
      confirmationText.value = '';
    }
  },
});

const canDelete = computed(() => confirmationText.value === 'DELETE');

async function handleArchive(): Promise<void> {
  if (!props.competition) return;

  try {
    await competitionStore.archiveExistingCompetition(props.competition.id);

    toast.add({
      severity: 'success',
      summary: 'Competition Archived',
      detail: 'Competition has been archived successfully',
      life: 3000,
    });

    localVisible.value = false;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to archive competition';
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
  if (!canDelete.value || !props.competition) return;

  isDeleting.value = true;

  try {
    await competitionStore.deleteExistingCompetition(props.competition.id);

    toast.add({
      severity: 'success',
      summary: 'Competition Deleted',
      detail: 'Competition has been permanently deleted',
      life: 3000,
    });

    emit('confirmed', props.competition.id);
    localVisible.value = false;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to delete competition';
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
  localVisible.value = false;
}
</script>

<template>
  <Dialog v-model:visible="localVisible" :modal="true" :style="{ width: '40rem' }">
    <template #header>
      <div class="flex items-center gap-3">
        <i class="pi pi-trash text-red-500 text-2xl"></i>
        <span class="text-xl font-bold">Delete Competition</span>
      </div>
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
        Deleting <strong>{{ competition?.name }}</strong> will permanently remove:
      </p>

      <ul class="list-disc pl-6 mb-4 space-y-2">
        <li>All seasons in this competition</li>
        <li>All race results and standings</li>
        <li>All driver associations</li>
        <li>All historical data</li>
      </ul>

      <Message severity="warn" :closable="false" class="mb-4">
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
        <Button label="Cancel" outlined :disabled="isDeleting" @click="handleCancel" />

        <!-- Step 1 buttons -->
        <template v-if="step === 'suggest-archive'">
          <Button label="Archive Instead" severity="secondary" @click="handleArchive" />
          <Button label="Continue to Delete" severity="danger" outlined @click="continueToDelete" />
        </template>

        <!-- Step 2 button -->
        <Button
          v-else
          label="Delete Competition"
          severity="danger"
          :loading="isDeleting"
          :disabled="!canDelete"
          @click="handleConfirmDelete"
        />
      </div>
    </template>
  </Dialog>
</template>
