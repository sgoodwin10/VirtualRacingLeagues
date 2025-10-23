<script setup lang="ts">
import { ref } from 'vue';
import { useCompetitionStore } from '@user/stores/competitionStore';
import { useToast } from 'primevue/usetoast';
import type { Competition } from '@user/types/competition';

import Card from 'primevue/card';
import Button from 'primevue/button';
import Message from 'primevue/message';

import CompetitionDeleteDialog from './CompetitionDeleteDialog.vue';

interface Props {
  competition: Competition;
}

const props = defineProps<Props>();

interface Emits {
  (e: 'updated'): void;
  (e: 'archived'): void;
  (e: 'deleted'): void;
}

const emit = defineEmits<Emits>();

const competitionStore = useCompetitionStore();
const toast = useToast();

const showDeleteDialog = ref(false);
const isArchiving = ref(false);

async function handleArchive(): Promise<void> {
  isArchiving.value = true;

  try {
    await competitionStore.archiveExistingCompetition(props.competition.id);

    toast.add({
      severity: 'success',
      summary: 'Competition Archived',
      detail: 'Competition has been archived successfully',
      life: 3000,
    });

    emit('archived');
  } catch (error: any) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.message || 'Failed to archive competition',
      life: 5000,
    });
  } finally {
    isArchiving.value = false;
  }
}

function handleDelete(): void {
  showDeleteDialog.value = true;
}

function handleCompetitionDeleted(): void {
  emit('deleted');
}
</script>

<template>
  <div class="competition-settings space-y-6">
    <!-- Archive Section -->
    <Card v-if="!competition.is_archived">
      <template #title>Archive Competition</template>
      <template #content>
        <p class="text-gray-600 mb-4">
          Archive this competition when the series has ended but you want to preserve all historical
          data. Archived competitions:
        </p>
        <ul class="list-disc pl-6 mb-4 space-y-1 text-gray-600">
          <li>Hidden from active lists</li>
          <li>Read-only (cannot be edited)</li>
          <li>Can be reviewed later</li>
          <li>Preserve all seasons, races, and results</li>
        </ul>

        <Button
          label="Archive Competition"
          severity="secondary"
          :loading="isArchiving"
          @click="handleArchive"
        />
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
          Deleting this competition will permanently remove all seasons, races, results, and
          historical data. This action cannot be undone.
        </p>

        <Button label="Delete Competition" severity="danger" @click="handleDelete" />
      </template>
    </Card>

    <CompetitionDeleteDialog
      v-model:visible="showDeleteDialog"
      :competition="competition"
      @confirmed="handleCompetitionDeleted"
    />
  </div>
</template>
