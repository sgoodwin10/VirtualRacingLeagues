<script setup lang="ts">
import { ref, computed } from 'vue';
import { useSeasonStore } from '@app/stores/seasonStore';
import { useToast } from 'primevue/usetoast';
import { useConfirm } from 'primevue/useconfirm';
import type { Season } from '@app/types/season';

import { PhGear, PhPlay, PhFlag, PhArchive, PhTrash, PhWarning } from '@phosphor-icons/vue';
import BasePanel from '@app/components/common/panels/BasePanel.vue';
import PanelHeader from '@app/components/common/panels/PanelHeader.vue';
import Button from 'primevue/button';
import Tag from 'primevue/tag';
import Message from 'primevue/message';

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

// Status display configuration
const statusConfig = computed(() => {
  const configs = {
    setup: { label: 'Setup', severity: 'secondary' as const },
    active: { label: 'Active', severity: 'success' as const },
    completed: { label: 'Completed', severity: 'info' as const },
    archived: { label: 'Archived', severity: 'warn' as const },
  };
  return configs[props.season.status];
});

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
  <div class="season-settings space-y-4">
    <!-- Two Column Layout -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <!-- Left Column: Season Status (2/3 width) -->
      <div class="lg:col-span-2">
        <!-- Season Status Panel -->
        <BasePanel v-if="!season.is_archived" class="h-full">
          <template #header>
            <PanelHeader
              :icon="PhGear"
              :icon-size="20"
              icon-class="text-blue-600"
              title="Season Status"
              description="Manage your season lifecycle"
              gradient="from-blue-50 to-indigo-50"
            />
          </template>

          <div class="p-4">
            <!-- Current Status Display -->
            <div class="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
              <div>
                <span class="text-lg font-medium text-gray-900">Current Status</span>
              </div>
              <Tag :value="statusConfig.label" :severity="statusConfig.severity" />
            </div>

            <!-- Status Actions -->
            <div class="space-y-3">
              <!-- Activate Action -->
              <div class="flex items-center justify-between py-2">
                <div class="flex items-center gap-3">
                  <PhPlay :size="20" class="text-green-600" weight="fill" />
                  <div>
                    <div class="font-medium text-gray-900">Activate Season</div>
                    <div class="text-sm text-gray-600">Start racing and open for results</div>
                  </div>
                </div>
                <Button
                  label="Activate"
                  size="small"
                  severity="success"
                  :loading="isActivating"
                  :disabled="!canActivate"
                  @click="handleActivate"
                />
              </div>

              <!-- Complete Action -->
              <div class="flex items-center justify-between py-2">
                <div class="flex items-center gap-3">
                  <PhFlag :size="20" class="text-blue-600" weight="fill" />
                  <div>
                    <div class="font-medium text-gray-900">Complete Season</div>
                    <div class="text-sm text-gray-600">Mark season as finished</div>
                  </div>
                </div>
                <Button
                  label="Complete"
                  size="small"
                  severity="info"
                  :loading="isCompleting"
                  :disabled="!canComplete"
                  @click="handleComplete"
                />
              </div>

              <!-- Archive Action -->
              <div class="flex items-center justify-between py-2">
                <div class="flex items-center gap-3">
                  <PhArchive :size="20" class="text-gray-600" weight="fill" />
                  <div>
                    <div class="font-medium text-gray-900">Archive Season</div>
                    <div class="text-sm text-gray-600">Hide from lists and make read-only</div>
                  </div>
                </div>
                <Button
                  label="Archive"
                  size="small"
                  severity="secondary"
                  :loading="isArchiving"
                  :disabled="!canArchive"
                  @click="handleArchive"
                />
              </div>
            </div>
          </div>
        </BasePanel>

        <!-- Archived Season Info Panel -->
        <BasePanel v-else class="h-full">
          <template #header>
            <PanelHeader
              :icon="PhArchive"
              :icon-size="20"
              icon-class="text-amber-600"
              title="Archived Season"
              gradient="from-amber-50 to-orange-50"
            />
          </template>

          <div class="p-4">
            <Message severity="info" :closable="false">
              This season is archived and read-only. To make changes, restore it from the archived
              status first.
            </Message>
          </div>
        </BasePanel>
      </div>

      <!-- Right Column: Danger Zone (1/3 width) -->
      <div class="lg:col-span-1">
        <!-- Danger Zone Panel with red border -->
        <div class="h-full rounded-lg border-2 border-red-300 bg-red-50/30 overflow-hidden">
          <BasePanel class="h-full border-0 shadow-none bg-transparent">
            <template #header>
              <PanelHeader
                :icon="PhWarning"
                :icon-size="20"
                icon-class="text-red-600"
                title="Danger Zone"
                description="Irreversible actions"
                gradient="from-red-100 to-rose-100"
              />
            </template>

            <div class="p-4">
              <div class="flex flex-col gap-3">
                <div class="flex items-start gap-3">
                  <PhTrash :size="20" class="text-red-600 mt-0.5 shrink-0" weight="fill" />
                  <div>
                    <div class="font-medium text-gray-900 mb-1">Delete Season</div>
                    <div class="text-sm text-gray-600">
                      Permanently remove all race results and historical data. This action cannot be
                      undone.
                    </div>
                  </div>
                </div>
                <Button
                  label="Delete Season"
                  size="small"
                  severity="danger"
                  outlined
                  class="w-full"
                  @click="handleDelete"
                />
              </div>
            </div>
          </BasePanel>
        </div>
      </div>
    </div>

    <SeasonDeleteDialog
      v-model:visible="showDeleteDialog"
      :season="season"
      @confirmed="handleSeasonDeleted"
    />
  </div>
</template>
