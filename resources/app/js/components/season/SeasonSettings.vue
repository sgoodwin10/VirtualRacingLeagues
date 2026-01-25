<script setup lang="ts">
import { ref, computed } from 'vue';
import { useSeasonStore } from '@app/stores/seasonStore';
import { useToast } from 'primevue/usetoast';
import { useVrlConfirm } from '@app/composables/useVrlConfirm';
import VrlConfirmDialog from '@app/components/common/dialogs/VrlConfirmDialog.vue';
import type { Season } from '@app/types/season';

import {
  PhPlay,
  PhFlag,
  PhArchive,
  PhTrash,
  PhWarning,
  PhGear,
  PhArrowCounterClockwise,
  PhCheckCircle,
} from '@phosphor-icons/vue';
import { Button } from '@app/components/common/buttons';
import { CardHeader } from '@app/components/common/cards';
import Card from '@app/components/common/cards/Card.vue';
import InfoBox from '@app/components/common/cards/InfoBox.vue';

import SeasonDeleteDialog from '@app/components/season/modals/SeasonDeleteDialog.vue';

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

const showDeleteDialog = ref(false);

// VRL Confirmation dialogs
const {
  isVisible: isCompleteVisible,
  options: completeOptions,
  isLoading: isCompleting,
  showConfirmation: showCompleteConfirmation,
  handleAccept: handleCompleteAccept,
  handleReject: handleCompleteReject,
} = useVrlConfirm();

const {
  isVisible: isReactivateVisible,
  options: reactivateOptions,
  isLoading: isReactivating,
  showConfirmation: showReactivateConfirmation,
  handleAccept: handleReactivateAccept,
  handleReject: handleReactivateReject,
} = useVrlConfirm();

// Computed properties for valid state transitions
const canComplete = computed(() => props.season.status === 'active');
const canReactivate = computed(() => props.season.status === 'completed');

// Status configuration
const statusConfig = computed(() => {
  const configs = {
    setup: {
      icon: PhGear,
      color: 'text-[var(--yellow)]',
      bgColor: 'bg-[var(--yellow-dim)]',
      borderColor: 'border-[var(--yellow)]',
      label: 'Setup',
      description:
        'Season is being configured and is not yet active. Complete setup and activate when ready.',
    },
    active: {
      icon: PhPlay,
      color: 'text-[var(--green)]',
      bgColor: 'bg-[var(--green-dim)]',
      borderColor: 'border-[var(--green)]',
      label: 'Active',
      description: 'Season is currently active. Racing is in progress and results can be recorded.',
    },
    completed: {
      icon: PhFlag,
      color: 'text-[var(--cyan)]',
      bgColor: 'bg-[var(--cyan-dim)]',
      borderColor: 'border-[var(--cyan)]',
      label: 'Completed',
      description:
        'Season has finished. All races have been completed and final standings are set.',
    },
  };

  return configs[props.season.status as keyof typeof configs];
});

function handleComplete(): void {
  showCompleteConfirmation({
    header: 'Complete Season',
    message: 'Mark this season as completed? This indicates the season has finished.',
    icon: PhCheckCircle,
    iconColor: 'var(--green)',
    iconBgColor: 'var(--green-dim)',
    acceptLabel: 'Complete',
    rejectLabel: 'Cancel',
    acceptVariant: 'success',
    rejectVariant: 'secondary',
    onAccept: async () => {
      try {
        await seasonStore.completeExistingSeason(props.season.id);

        toast.add({
          severity: 'success',
          summary: 'Season Completed',
          detail: 'Season has been marked as completed',
          life: 3000,
        });

        emit('updated');
        window.location.reload();
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to complete season';
        toast.add({
          severity: 'error',
          summary: 'Error',
          detail: errorMessage,
          life: 5000,
        });
      }
    },
  });
}

function handleReactivate(): void {
  showReactivateConfirmation({
    header: 'Reactivate Season',
    message: 'Reactivate this season? It will become active again.',
    icon: PhArrowCounterClockwise,
    iconColor: 'var(--cyan)',
    iconBgColor: 'var(--cyan-dim)',
    acceptLabel: 'Reactivate',
    rejectLabel: 'Cancel',
    acceptVariant: 'success',
    rejectVariant: 'secondary',
    onAccept: async () => {
      try {
        await seasonStore.reactivateExistingSeason(props.season.id);

        toast.add({
          severity: 'success',
          summary: 'Season Reactivated',
          detail: 'Season has been reactivated successfully',
          life: 3000,
        });

        emit('updated');
        // refresh the page
        window.location.reload();
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to reactivate season';
        toast.add({
          severity: 'error',
          summary: 'Error',
          detail: errorMessage,
          life: 5000,
        });
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
    <div class="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <!-- Left Column: Season Status (2/3 width) -->
      <div class="lg:col-span-2">
        <!-- Season Status Card -->
        <Card v-if="!season.is_archived">
          <template #header>
            <CardHeader title="Season Status" :icon="PhGear" icon-color="blue-300" />
          </template>

          <!-- Current Status Indicator -->
          <div class="mb-6">
            <div
              :class="['rounded-lg border-2 p-4', statusConfig.bgColor, statusConfig.borderColor]"
            >
              <div class="flex items-start gap-3">
                <component
                  :is="statusConfig.icon"
                  :size="24"
                  :class="['shrink-0', statusConfig.color]"
                  weight="fill"
                />
                <div class="flex-1">
                  <div
                    :class="[
                      'mb-1 font-mono text-card-title-small uppercase tracking-wide',
                      statusConfig.color,
                    ]"
                  >
                    {{ statusConfig.label }}
                  </div>
                  <div class="text-body-small text-[var(--text-secondary)]">
                    {{ statusConfig.description }}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Status Actions -->
          <div class="space-y-0">
            <!-- Complete Action (shown when season is active) -->
            <div
              v-if="!canReactivate"
              class="flex items-center justify-between border-b border-[var(--border-muted)] py-4"
            >
              <div class="flex items-center gap-3">
                <PhFlag :size="20" class="text-[var(--cyan)]" weight="fill" />
                <div>
                  <div class="text-body-small font-medium text-[var(--text-primary)]">
                    Complete Season
                  </div>
                  <div class="text-body-small text-[var(--text-muted)]">
                    Mark season as finished
                  </div>
                </div>
              </div>
              <Button
                label="Complete"
                size="sm"
                variant="primary"
                :loading="isCompleting"
                :disabled="!canComplete"
                @click="handleComplete"
              />
            </div>

            <!-- Reactivate Action (shown when season is completed) -->
            <div
              v-else
              class="flex items-center justify-between border-b border-[var(--border-muted)] py-4"
            >
              <div class="flex items-center gap-3">
                <PhArrowCounterClockwise :size="20" class="text-[var(--cyan)]" weight="fill" />
                <div>
                  <div class="text-body-small font-medium text-[var(--text-primary)]">
                    Reactivate Season
                  </div>
                  <div class="text-body-small text-[var(--text-muted)]">
                    Make season active again
                  </div>
                </div>
              </div>
              <Button
                label="Reactivate"
                size="sm"
                variant="primary"
                :loading="isReactivating"
                :disabled="!canReactivate"
                @click="handleReactivate"
              />
            </div>
          </div>
        </Card>

        <!-- Archived Season Info Card -->
        <Card v-else>
          <template #header>
            <div class="flex items-center gap-3">
              <PhArchive :size="20" class="text-[var(--orange)]" weight="fill" />
              <span
                class="font-mono text-card-title-small uppercase tracking-wide text-[var(--text-primary)]"
              >
                Archived Season
              </span>
            </div>
          </template>

          <InfoBox
            variant="info"
            title="Read-Only Mode"
            message="This season is archived and read-only. To make changes, restore it from the archived status first."
          />
        </Card>
      </div>

      <!-- Right Column: Danger Zone (1/3 width) -->
      <div class="lg:col-span-1">
        <!-- Danger Zone Card with red border -->
        <Card class="border-2 border-[var(--red)] bg-[var(--red-dim)]">
          <template #header>
            <div class="flex items-center gap-3">
              <PhWarning :size="20" class="text-[var(--red)]" weight="fill" />
              <div>
                <span
                  class="font-mono text-card-title-small uppercase tracking-wide text-[var(--red)]"
                >
                  Danger Zone
                </span>
              </div>
            </div>
          </template>

          <div class="space-y-4">
            <div class="flex items-start gap-3">
              <PhTrash :size="20" class="mt-0.5 shrink-0 text-[var(--red)]" weight="fill" />
              <div>
                <div class="text-body-small mb-1 font-medium text-[var(--text-primary)]">
                  Delete Season
                </div>
                <div class="text-body-small text-[var(--text-secondary)]">
                  Permanently remove all race results and historical data. This action cannot be
                  undone.
                </div>
              </div>
            </div>
            <Button
              label="Delete Season"
              size="sm"
              variant="danger"
              class="w-full"
              @click="handleDelete"
            />
          </div>
        </Card>
      </div>
    </div>

    <SeasonDeleteDialog
      v-model:visible="showDeleteDialog"
      :season="season"
      @confirmed="handleSeasonDeleted"
    />

    <!-- Confirm Complete Season Dialog -->
    <VrlConfirmDialog
      v-model:visible="isCompleteVisible"
      v-bind="completeOptions"
      :loading="isCompleting"
      @accept="handleCompleteAccept"
      @reject="handleCompleteReject"
    />

    <!-- Confirm Reactivate Season Dialog -->
    <VrlConfirmDialog
      v-model:visible="isReactivateVisible"
      v-bind="reactivateOptions"
      :loading="isReactivating"
      @accept="handleReactivateAccept"
      @reject="handleReactivateReject"
    />
  </div>
</template>
