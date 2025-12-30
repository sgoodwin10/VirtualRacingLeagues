<script setup lang="ts">
import { ref, computed } from 'vue';
import { useSeasonStore } from '@app/stores/seasonStore';
import { useToast } from 'primevue/usetoast';
import { useConfirm } from 'primevue/useconfirm';
import type { Season } from '@app/types/season';

import { PhPlay, PhFlag, PhArchive, PhTrash, PhWarning, PhGear } from '@phosphor-icons/vue';
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

          <!-- Status Actions -->
          <div class="space-y-0">
            <!-- Activate Action -->
            <div
              class="flex items-center justify-between border-b border-[var(--border-muted)] py-4"
            >
              <div class="flex items-center gap-3">
                <PhPlay :size="20" class="text-[var(--green)]" weight="fill" />
                <div>
                  <div class="text-body-small font-medium text-[var(--text-primary)]">
                    Activate Season
                  </div>
                  <div class="text-body-small text-[var(--text-muted)]">
                    Start racing and open for results
                  </div>
                </div>
              </div>
              <Button
                label="Activate"
                size="sm"
                variant="success"
                :loading="isActivating"
                :disabled="!canActivate"
                @click="handleActivate"
              />
            </div>

            <!-- Complete Action -->
            <div
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
                severity="info"
                :loading="isCompleting"
                :disabled="!canComplete"
                @click="handleComplete"
              />
            </div>

            <!-- Archive Action -->
            <div class="flex items-center justify-between py-4">
              <div class="flex items-center gap-3">
                <PhArchive :size="20" class="text-[var(--text-secondary)]" weight="fill" />
                <div>
                  <div class="text-body-small font-medium text-[var(--text-primary)]">
                    Archive Season
                  </div>
                  <div class="text-body-small text-[var(--text-muted)]">
                    Hide from lists and make read-only
                  </div>
                </div>
              </div>
              <Button
                label="Archive"
                size="sm"
                variant="secondary"
                :loading="isArchiving"
                :disabled="!canArchive"
                @click="handleArchive"
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
  </div>
</template>
