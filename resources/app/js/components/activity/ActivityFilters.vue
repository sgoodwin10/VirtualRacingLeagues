<script setup lang="ts">
import { ref } from 'vue';
import type { ActivityFilterParams, EntityType, ActivityAction } from '@app/types/activityLog';
import Select from 'primevue/select';
import DatePicker from 'primevue/datepicker';
import Button from 'primevue/button';

interface Emits {
  (e: 'filter', filters: ActivityFilterParams): void;
  (e: 'clear'): void;
}

const emit = defineEmits<Emits>();

const selectedEntityType = ref<EntityType | undefined>();
const selectedAction = ref<ActivityAction | undefined>();
const fromDate = ref<Date | undefined>();
const toDate = ref<Date | undefined>();

const entityTypes: { label: string; value: EntityType }[] = [
  { label: 'League', value: 'league' },
  { label: 'Driver', value: 'driver' },
  { label: 'Competition', value: 'competition' },
  { label: 'Season', value: 'season' },
  { label: 'Round', value: 'round' },
  { label: 'Race', value: 'race' },
  { label: 'Qualifier', value: 'qualifier' },
  { label: 'Division', value: 'division' },
  { label: 'Team', value: 'team' },
  { label: 'Season Driver', value: 'season_driver' },
];

const actions: { label: string; value: ActivityAction }[] = [
  { label: 'Create', value: 'create' },
  { label: 'Update', value: 'update' },
  { label: 'Delete', value: 'delete' },
  { label: 'Complete', value: 'complete' },
  { label: 'Archive', value: 'archive' },
  { label: 'Import', value: 'import' },
  { label: 'Add Driver', value: 'add_driver' },
  { label: 'Remove Driver', value: 'remove_driver' },
  { label: 'Reorder', value: 'reorder' },
  { label: 'Enter Results', value: 'enter_results' },
];

function applyFilters() {
  const filters: ActivityFilterParams = {};

  if (selectedEntityType.value) {
    filters.entity_type = selectedEntityType.value;
  }

  if (selectedAction.value) {
    filters.action = selectedAction.value;
  }

  if (fromDate.value) {
    filters.from_date = fromDate.value.toISOString().split('T')[0];
  }

  if (toDate.value) {
    filters.to_date = toDate.value.toISOString().split('T')[0];
  }

  emit('filter', filters);
}

function clearFilters() {
  selectedEntityType.value = undefined;
  selectedAction.value = undefined;
  fromDate.value = undefined;
  toDate.value = undefined;
  emit('clear');
}

function hasActiveFilters(): boolean {
  return !!(selectedEntityType.value || selectedAction.value || fromDate.value || toDate.value);
}
</script>

<template>
  <div class="activity-filters bg-[var(--bg-card)] rounded-lg border border-[var(--border)] p-4">
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <!-- Entity Type Filter -->
      <div>
        <label class="block text-sm font-mono font-medium text-[var(--text-primary)] mb-2">
          Entity Type
        </label>
        <Select
          v-model="selectedEntityType"
          :options="entityTypes"
          option-label="label"
          option-value="value"
          placeholder="All Types"
          show-clear
          class="w-full"
          @change="applyFilters"
        />
      </div>

      <!-- Action Filter -->
      <div>
        <label class="block text-sm font-mono font-medium text-[var(--text-primary)] mb-2">
          Action
        </label>
        <Select
          v-model="selectedAction"
          :options="actions"
          option-label="label"
          option-value="value"
          placeholder="All Actions"
          show-clear
          class="w-full"
          @change="applyFilters"
        />
      </div>

      <!-- From Date Filter -->
      <div>
        <label class="block text-sm font-mono font-medium text-[var(--text-primary)] mb-2">
          From Date
        </label>
        <DatePicker
          v-model="fromDate"
          placeholder="Select start date"
          show-icon
          :show-button-bar="true"
          date-format="yy-mm-dd"
          class="w-full"
          @date-select="applyFilters"
          @clear-click="applyFilters"
        />
      </div>

      <!-- To Date Filter -->
      <div>
        <label class="block text-sm font-mono font-medium text-[var(--text-primary)] mb-2">
          To Date
        </label>
        <DatePicker
          v-model="toDate"
          placeholder="Select end date"
          show-icon
          :show-button-bar="true"
          date-format="yy-mm-dd"
          class="w-full"
          @date-select="applyFilters"
          @clear-click="applyFilters"
        />
      </div>
    </div>

    <!-- Actions -->
    <div v-if="hasActiveFilters()" class="mt-4 flex justify-end">
      <Button
        label="Clear All Filters"
        icon="pi pi-times"
        severity="secondary"
        outlined
        size="small"
        @click="clearFilters"
      />
    </div>
  </div>
</template>
