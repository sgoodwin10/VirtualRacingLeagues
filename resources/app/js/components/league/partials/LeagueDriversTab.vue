<script setup lang="ts">
import { toRef } from 'vue';
import { Button } from '@app/components/common/buttons';
import IconField from 'primevue/iconfield';
import InputIcon from 'primevue/inputicon';
import InputText from 'primevue/inputtext';
import Select from 'primevue/select';
import BasePanel from '@app/components/common/panels/BasePanel.vue';
import DriverTable from '@app/components/driver/DriverTable.vue';
import { useLeagueDrivers } from '@app/composables/useLeagueDrivers';
import { useDriverStore } from '@app/stores/driverStore';
import type { LeagueDriver } from '@app/types/driver';
import { PhUpload, PhPlus } from '@phosphor-icons/vue';

interface Props {
  leagueId: number;
}

interface Emits {
  (e: 'add-driver'): void;
  (e: 'import-csv'): void;
  (e: 'view-driver', driver: LeagueDriver): void;
  (e: 'edit-driver', driver: LeagueDriver): void;
  (e: 'remove-driver', driver: LeagueDriver): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// Get driver store for status filter binding
const driverStore = useDriverStore();

// Use the useLeagueDrivers composable
const leagueIdRef = toRef(props, 'leagueId');
const { searchQuery } = useLeagueDrivers(leagueIdRef, {
  onSuccess: (msg) => console.log(msg),
  onError: (msg) => console.error(msg),
});

const statusFilterOptions = [
  { label: 'All Drivers', value: 'all' },
  { label: 'Active Only', value: 'active' },
  { label: 'Inactive Only', value: 'inactive' },
  { label: 'Banned Only', value: 'banned' },
];

function handleAddDriver(): void {
  emit('add-driver');
}

function handleImportCSV(): void {
  emit('import-csv');
}

function handleViewDriver(driver: LeagueDriver): void {
  emit('view-driver', driver);
}

function handleEditDriver(driver: LeagueDriver): void {
  emit('edit-driver', driver);
}

function handleRemoveDriver(driver: LeagueDriver): void {
  emit('remove-driver', driver);
}
</script>

<template>
  <BasePanel>
    <div class="space-y-4 p-4">
      <!-- Toolbar -->
      <div class="flex flex-wrap gap-4 items-center justify-between">
        <!-- Search and Filter -->
        <div class="flex gap-2 flex-1">
          <IconField>
            <InputIcon class="pi pi-search text-white" />
            <InputText v-model="searchQuery" placeholder="Search drivers..." class="w-full" />
          </IconField>
          <Select
            v-model="driverStore.statusFilter"
            :options="statusFilterOptions"
            option-label="label"
            option-value="value"
            placeholder="Filter by status"
            class="w-48"
          />
        </div>

        <!-- Action Buttons -->
        <div class="flex gap-2">
          <Button
            label="Import Drivers"
            :icon="PhUpload"
            variant="secondary"
            size="sm"
            @click="handleImportCSV"
          />
          <Button
            label="Add Driver"
            variant="outline"
            :icon="PhPlus"
            size="sm"
            @click="handleAddDriver"
          />
        </div>
      </div>

      <!-- Driver Table -->
      <div class="overflow-auto">
        <DriverTable
          :league-id="leagueId"
          @view="handleViewDriver"
          @edit="handleEditDriver"
          @remove="handleRemoveDriver"
        />
      </div>
    </div>
  </BasePanel>
</template>
