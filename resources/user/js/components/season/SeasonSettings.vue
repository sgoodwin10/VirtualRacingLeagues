<script setup lang="ts">
import { ref, computed } from 'vue';
import { useSeasonStore } from '@user/stores/seasonStore';
import { useToast } from 'primevue/usetoast';
import type { Season } from '@user/types/season';

import Card from 'primevue/card';
import Button from 'primevue/button';
import Message from 'primevue/message';
import { useConfirm } from 'primevue/useconfirm';

import SeasonDeleteDialog from './modals/SeasonDeleteDialog.vue';

interface Props {
  season: Season;
}

const props = defineProps<Props>();

interface Emits {
  (e: 'updated'): void;
  (e: 'archived'): void;
  (e: 'deleted'): void;
}

const emit = defineEmits<Emits>();

const seasonStore = useSeasonStore();
const toast = useToast();
const confirm = useConfirm();

const showDeleteDialog = ref(false);
const isArchiving = ref(false);
const isActivating = ref(false);
const isCompleting = ref(false);

// Computed properties for valid state transitions
const canActivate = computed(() => props.season.status === 'setup');
const canComplete = computed(() => props.season.status === 'active');
const canArchive = computed(
  () => props.season.status === 'completed' || props.season.status === 'active',
);

async function handleArchive(): Promise<void> {
  confirm.require({
    message:
      'Archive this season? It will be hidden from active lists and cannot be edited while archived.',
    header: 'Archive Season',
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'Archive',
    rejectLabel: 'Cancel',
    accept: async () => {
      isArchiving.value = true;

      try {
        await seasonStore.archiveExistingSeason(props.season.id);

        toast.add({
          severity: 'success',
          summary: 'Season Archived',
          detail: 'Season has been archived successfully',
          life: 3000,
        });

        emit('archived');
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to archive season';
        toast.add({
          severity: 'error',
          summary: 'Error',
          detail: errorMessage,
          life: 5000,
        });
      } finally {
        isArchiving.value = false;
      }
    },
  });
}

async function handleActivate(): Promise<void> {
  confirm.require({
    message: 'Activate this season? It will become the active season for the competition.',
    header: 'Activate Season',
    icon: 'pi pi-check-circle',
    acceptLabel: 'Activate',
    rejectLabel: 'Cancel',
    accept: async () => {
      isActivating.value = true;

      try {
        await seasonStore.activateExistingSeason(props.season.id);

        toast.add({
          severity: 'success',
          summary: 'Season Activated',
          detail: 'Season has been activated successfully',
          life: 3000,
        });

        emit('updated');
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to activate season';
        toast.add({
          severity: 'error',
          summary: 'Error',
          detail: errorMessage,
          life: 5000,
        });
      } finally {
        isActivating.value = false;
      }
    },
  });
}

async function handleComplete(): Promise<void> {
  confirm.require({
    message: 'Mark this season as completed? This indicates the season has finished.',
    header: 'Complete Season',
    icon: 'pi pi-flag-fill',
    acceptLabel: 'Complete',
    rejectLabel: 'Cancel',
    accept: async () => {
      isCompleting.value = true;

      try {
        await seasonStore.completeExistingSeason(props.season.id);

        toast.add({
          severity: 'success',
          summary: 'Season Completed',
          detail: 'Season has been marked as completed',
          life: 3000,
        });

        emit('updated');
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to complete season';
        toast.add({
          severity: 'error',
          summary: 'Error',
          detail: errorMessage,
          life: 5000,
        });
      } finally {
        isCompleting.value = false;
      }
    },
  });
}

function handleDelete(): void {
  showDeleteDialog.value = true;
}

function handleSeasonDeleted(): void {
  emit('deleted');
}
</script>

<template>
  <div class="season-settings space-y-6">
    <!-- Status Management Section -->
    <Card v-if="!season.is_archived">
      <template #title>Season Status</template>
      <template #content>
        <p class="text-gray-600 mb-4">Manage the season lifecycle:</p>

        <div class="space-y-3">
          <!-- Activate -->
          <div v-if="season.status === 'setup'" class="flex items-center justify-between">
            <div>
              <h4 class="font-semibold">Activate Season</h4>
              <p class="text-sm text-gray-600">Start this season and open it for racing</p>
            </div>
            <Button
              label="Activate"
              icon="pi pi-play"
              severity="success"
              :loading="isActivating"
              :disabled="!canActivate || isActivating"
              @click="handleActivate"
            />
          </div>

          <!-- Complete -->
          <div v-if="season.status === 'active'" class="flex items-center justify-between">
            <div>
              <h4 class="font-semibold">Complete Season</h4>
              <p class="text-sm text-gray-600">Mark this season as finished</p>
            </div>
            <Button
              label="Complete"
              icon="pi pi-flag-fill"
              severity="info"
              :loading="isCompleting"
              :disabled="!canComplete || isCompleting"
              @click="handleComplete"
            />
          </div>

          <!-- Archive -->
          <div
            v-if="season.status === 'completed' || season.status === 'active'"
            class="flex items-center justify-between"
          >
            <div>
              <h4 class="font-semibold">Archive Season</h4>
              <p class="text-sm text-gray-600">Hide from active lists and make read-only</p>
            </div>
            <Button
              label="Archive"
              icon="pi pi-archive"
              severity="secondary"
              :loading="isArchiving"
              :disabled="!canArchive || isArchiving"
              @click="handleArchive"
            />
          </div>
        </div>
      </template>
    </Card>

    <!-- Archived Status Info -->
    <Card v-else>
      <template #title>Archived Season</template>
      <template #content>
        <Message severity="info" :closable="false">
          This season is archived and read-only. To make changes, restore it from the completed
          status first.
        </Message>
      </template>
    </Card>

    <!-- Danger Zone -->
    <Card>
      <template #title>
        <span class="text-red-600">Danger Zone</span>
      </template>
      <template #content>
        <Message severity="error" :closable="false" class="mb-4">
          <strong>PERMANENT DELETION</strong>
        </Message>

        <p class="text-gray-600 mb-4">
          Deleting this season will permanently remove all driver assignments, race results, and
          historical data. This action cannot be undone.
        </p>

        <Button label="Delete Season" severity="danger" @click="handleDelete" />
      </template>
    </Card>

    <SeasonDeleteDialog
      v-model:visible="showDeleteDialog"
      :season="season"
      @confirmed="handleSeasonDeleted"
    />
  </div>
</template>
