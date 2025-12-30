<template>
  <Tag
    v-if="showWarning"
    v-tooltip.top="{
      value: tooltipMessage,
      escape: false,
    }"
    variant="warning"
    value="Orphaned Results"
    class="cursor-pointer"
    @click="handleClick"
  >
    <template #icon>
      <PhWarning :size="14" weight="regular" />
    </template>
  </Tag>

  <Dialog v-model:visible="dialogVisible" :modal="true" :style="{ width: '40rem' }">
    <template #header>
      <div class="flex items-center gap-3">
        <i class="pi pi-exclamation-triangle text-amber-500 text-2xl"></i>
        <span class="text-xl font-bold">Orphaned Results Detected</span>
      </div>
    </template>

    <div class="py-4">
      <p class="mb-4">
        This {{ eventType.toLowerCase() }} has results for drivers who are not assigned to any
        division. These results exist in the database but are not visible in the division tabs.
      </p>

      <div class="border rounded-lg p-4 bg-amber-50 border-amber-200 mb-4">
        <h4 class="font-semibold mb-2">Affected Drivers</h4>

        <div v-if="isLoadingDrivers" class="flex items-center justify-center py-4">
          <i class="pi pi-spinner pi-spin text-2xl text-amber-600"></i>
          <span class="ml-2 text-sm">Loading drivers...</span>
        </div>

        <div v-else-if="loadError" class="text-sm text-red-600">
          <i class="pi pi-exclamation-circle"></i>
          {{ loadError }}
        </div>

        <div v-else-if="orphanedDrivers.length > 0">
          <p class="mb-2">
            <strong>{{ orphanedDrivers.length }}</strong>
            {{ orphanedDrivers.length === 1 ? 'driver' : 'drivers' }} without division assignment
          </p>
          <div class="max-h-48 overflow-y-auto">
            <ul class="list-disc list-inside space-y-1">
              <li v-for="driver in orphanedDrivers" :key="driver.id">
                {{ driver.name }}
              </li>
            </ul>
          </div>
        </div>

        <p v-else class="text-sm">No orphaned drivers found.</p>
      </div>

      <div>
        <div class="font-semibold text-red-600 text-lg">Action:</div>
        <p>
          Remove the orphaned results, update the drivers team assignment, and then re-enter the
          results.
        </p>
      </div>
    </div>

    <template #footer>
      <div class="flex gap-2 justify-end">
        <Button label="Close" variant="outline" :disabled="isDeleting" @click="handleClose" />
        <Button
          label="Remove Orphans"
          variant="warning"
          :loading="isDeleting"
          @click="handleRemoveOrphans"
        />
      </div>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch, onUnmounted } from 'vue';
import Tag from 'primevue/tag';
import Dialog from 'primevue/dialog';
import { Button } from '@app/components/common/buttons';
import { useToast } from 'primevue/usetoast';
import { deleteOrphanedResults, getOrphanedResults } from '@app/services/raceService';
import { PhWarning } from '@phosphor-icons/vue';

interface Props {
  hasOrphanedResults?: boolean;
  isCompleted: boolean;
  isQualifying?: boolean;
  raceId: number;
}

const props = withDefaults(defineProps<Props>(), {
  hasOrphanedResults: false,
  isQualifying: false,
});

interface Emits {
  (e: 'orphans-removed'): void;
}

const emit = defineEmits<Emits>();

const toast = useToast();
const dialogVisible = ref(false);
const isDeleting = ref(false);
const isLoadingDrivers = ref(false);
const loadError = ref<string | null>(null);
const orphanedDrivers = ref<Array<{ id: number; name: string }>>([]);

// AbortController for request cancellation
let abortController: AbortController | null = null;

const showWarning = computed(() => {
  return props.isCompleted && props.hasOrphanedResults;
});

// Cleanup on unmount
onUnmounted(() => {
  if (abortController) {
    abortController.abort();
  }
});

// Fetch orphaned drivers when dialog is opened
watch(dialogVisible, async (isVisible) => {
  if (isVisible) {
    // Cancel any previous request
    if (abortController) {
      abortController.abort();
    }

    // Create new AbortController for this request
    abortController = new AbortController();

    isLoadingDrivers.value = true;
    loadError.value = null;

    try {
      const result = await getOrphanedResults(props.raceId);
      // Check if dialog is still visible (component might have unmounted or dialog closed)
      if (dialogVisible.value) {
        orphanedDrivers.value = result.drivers;
      }
    } catch (error) {
      // Don't show error if request was aborted
      if (error instanceof Error && error.name === 'AbortError') {
        return;
      }

      if (dialogVisible.value) {
        loadError.value =
          error instanceof Error ? error.message : 'Failed to load orphaned drivers';
      }
    } finally {
      if (dialogVisible.value) {
        isLoadingDrivers.value = false;
      }
    }
  } else {
    // Cancel request and reset state when dialog is closed
    if (abortController) {
      abortController.abort();
      abortController = null;
    }
    orphanedDrivers.value = [];
    loadError.value = null;
  }
});

const eventType = computed(() => {
  return props.isQualifying ? 'Qualifying Session' : 'Race';
});

const tooltipMessage = computed(() => {
  const type = props.isQualifying ? 'qualifying session' : 'race';
  return `This ${type} has results for drivers not assigned to any division. These results are not visible in the division tabs.`;
});

function handleClick(): void {
  dialogVisible.value = true;
}

function handleClose(): void {
  dialogVisible.value = false;
}

async function handleRemoveOrphans(): Promise<void> {
  isDeleting.value = true;

  try {
    const result = await deleteOrphanedResults(props.raceId);

    toast.add({
      severity: 'success',
      summary: 'Orphans Removed',
      detail: result.message || 'Orphaned results have been successfully removed',
      life: 3000,
    });

    emit('orphans-removed');
    dialogVisible.value = false;
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to remove orphaned results';

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
</script>
