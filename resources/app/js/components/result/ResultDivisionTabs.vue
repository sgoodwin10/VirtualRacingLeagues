<template>
  <div class="border border-gray-200 rounded-lg overflow-hidden">
    <Tabs v-model:value="activeTab">
      <TabList>
        <div class="flex items-center justify-between w-full">
          <div class="flex items-center gap-2">
            <Tab v-for="division in divisions" :key="division.id" :value="division.id">
              {{ division.name }}
            </Tab>
          </div>
          <Button
            v-if="!readOnly"
            label="Reset All Results"
            icon="pi pi-refresh"
            severity="danger"
            outlined
            size="small"
            class="mr-4"
            @click="handleResetAllClick"
          />
        </div>
      </TabList>
      <TabPanels>
        <TabPanel v-for="division in divisions" :key="division.id" :value="division.id">
          <ResultEntryTable
            :results="divisionResults[division.id] ?? []"
            :drivers="driversByDivision[division.id] || []"
            :is-qualifying="isQualifying"
            :selected-driver-ids="selectedDriverIdsByDivision[division.id] ?? new Set()"
            :read-only="readOnly"
            @update:results="(results) => handleDivisionUpdate(division.id, results)"
          />
        </TabPanel>
      </TabPanels>
    </Tabs>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import Tabs from 'primevue/tabs';
import TabList from 'primevue/tablist';
import Tab from 'primevue/tab';
import TabPanels from 'primevue/tabpanels';
import TabPanel from 'primevue/tabpanel';
import Button from 'primevue/button';
import { useConfirm } from 'primevue/useconfirm';
import ResultEntryTable from './ResultEntryTable.vue';
import type { RaceResultFormData, DriverOption } from '@app/types/raceResult';
import type { Division } from '@app/types/division';

interface Props {
  results: RaceResultFormData[];
  divisions: Division[];
  driversByDivision: Record<number, DriverOption[]>;
  isQualifying: boolean;
  selectedDriverIds: Set<number>;
  readOnly?: boolean;
}

interface Emits {
  (e: 'update:results', results: RaceResultFormData[]): void;
  (e: 'reset-all'): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const confirm = useConfirm();

// Active tab value (division ID) - defaults to -1, will be set to first division when available
const activeTab = ref<number>(-1);

// Watch for divisions to set initial active tab
watch(
  () => props.divisions,
  (divisions) => {
    if (divisions.length > 0 && activeTab.value === -1) {
      activeTab.value = divisions[0]?.id ?? -1;
    }
  },
  { immediate: true },
);

// Compute selected driver IDs per division for the Add Driver button
const selectedDriverIdsByDivision = computed<Record<number, Set<number>>>(() => {
  const byDivision: Record<number, Set<number>> = {};
  for (const division of props.divisions) {
    const divisionDriverIds = new Set(
      (props.driversByDivision[division.id] || []).map((d) => d.id),
    );
    const selectedInDivision = new Set<number>();
    for (const result of props.results) {
      // Type-safe null check before Set operations
      if (result.driver_id !== null && divisionDriverIds.has(result.driver_id)) {
        selectedInDivision.add(result.driver_id);
      }
    }
    byDivision[division.id] = selectedInDivision;
  }
  return byDivision;
});

// Split results by division
const divisionResults = ref<Record<number, RaceResultFormData[]>>({});

// Initialize division results - filter results by driver's division_id
watch(
  () => props.results,
  (results) => {
    const newDivisionResults: Record<number, RaceResultFormData[]> = {};

    for (const division of props.divisions) {
      // Get the driver IDs that belong to this division
      const divisionDriverIds = new Set(
        (props.driversByDivision[division.id] || []).map((d) => d.id),
      );

      // Filter results to only include drivers from this division
      // Type-safe: explicit null check before Set.has() operation
      newDivisionResults[division.id] = results.filter((r) => {
        return r.driver_id !== null && divisionDriverIds.has(r.driver_id);
      });
    }

    divisionResults.value = newDivisionResults;
  },
  { immediate: true },
);

function handleDivisionUpdate(divisionId: number, updatedResults: RaceResultFormData[]): void {
  // Update the specific division's results
  divisionResults.value[divisionId] = updatedResults;

  // Merge all division results back into the main array
  const allResults: RaceResultFormData[] = [];

  for (const division of props.divisions) {
    allResults.push(...(divisionResults.value[division.id] || []));
  }

  // Emit the updated results array to trigger reactivity in parent
  emit('update:results', [...allResults]);
}

function handleResetAllClick(): void {
  confirm.require({
    message:
      'Are you sure you want to reset all results? This will clear all times, penalties, and DNF status for all drivers across all divisions.',
    header: 'Reset All Results',
    icon: 'pi pi-exclamation-triangle',
    rejectProps: {
      label: 'Cancel',
      severity: 'secondary',
      outlined: true,
    },
    acceptProps: {
      label: 'Reset All',
      severity: 'danger',
    },
    accept: () => {
      emit('reset-all');
    },
  });
}
</script>
