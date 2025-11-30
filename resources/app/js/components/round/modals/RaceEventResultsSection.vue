<template>
  <div class="bg-white border border-gray-200 rounded-lg">
    <!-- Section Header -->
    <div class="bg-gray-50 px-4 py-3 border-b border-gray-200">
      <div class="flex items-center justify-between">
        <h3 class="font-semibold text-gray-900">
          {{ raceEventTitle }}
        </h3>
        <Tag v-if="raceEvent.status === 'completed'" severity="success" value="Completed" />
        <Tag v-else severity="secondary" :value="raceEvent.status" />
      </div>
    </div>

    <!-- Results Table -->
    <div class="overflow-x-auto">
      <DataTable :value="filteredResults" :rows="50" :row-class="getRowClass" class="text-sm">
        <Column field="position" header="#" class="w-16">
          <template #body="{ data }">
            <div class="text-center font-medium">
              {{ data.position ?? '-' }}
            </div>
          </template>
        </Column>

        <Column field="driver.name" header="Driver" class="min-w-[200px]">
          <template #body="{ data }">
            <div class="flex items-center gap-2">
              <span class="font-medium text-gray-900">{{ data.driver?.name || 'Unknown' }}</span>
              <Tag
                v-if="data.has_pole && raceEvent.is_qualifier"
                value="P"
                class="text-xs bg-purple-200 text-purple-800"
                :pt="{ root: { class: 'bg-purple-200 text-purple-800 border-purple-300' } }"
              />
            </div>
          </template>
        </Column>

        <Column v-if="!raceEvent.is_qualifier" field="race_time" header="Time" class="w-42">
          <template #body="{ data }">
            <span class="font-mono text-gray-900">{{ data.race_time || '' }}</span>
            <Tag v-if="data.dnf" severity="danger" value="DNF" class="text-xs" />
          </template>
        </Column>

        <Column
          v-if="!raceEvent.is_qualifier"
          field="race_time_difference"
          header="Gap"
          class="w-42"
        >
          <template #body="{ data }">
            <span class="font-mono text-gray-600">{{ data.race_time_difference || '-' }}</span>
          </template>
        </Column>

        <Column
          field="fastest_lap"
          :header="raceEvent.is_qualifier ? 'Lap Time' : 'Fastest Lap'"
          class="w-42"
        >
          <template #body="{ data }">
            <div class="flex items-center gap-2">
              <span
                class="font-mono"
                :class="{
                  'text-purple-600': data.has_fastest_lap && !raceEvent.is_qualifier,
                  'text-gray-900': !data.has_fastest_lap || raceEvent.is_qualifier,
                }"
              >
                {{ data.fastest_lap || '-' }}
              </span>
              <Tag
                v-if="data.has_fastest_lap && !raceEvent.is_qualifier"
                value="FL"
                class="text-xs bg-purple-500 text-white"
                :pt="{ root: { class: 'bg-purple-500 text-white border-purple-600' } }"
              />
            </div>
          </template>
        </Column>

        <Column v-if="!raceEvent.is_qualifier" field="penalties" header="Penalties" class="w-42">
          <template #body="{ data }">
            <div class="flex items-center gap-2">
              <span class="font-mono text-gray-900">{{ data.penalties || '-' }}</span>
            </div>
          </template>
        </Column>

        <Column v-if="!raceEvent.is_qualifier" field="positions_gained" header="+/-" class="w-24">
          <template #body="{ data }">
            <div class="text-center font-semibold" :class="getPositionsGainedClass(data)">
              {{ formatPositionsGained(data.positions_gained) }}
            </div>
          </template>
        </Column>

        <Column field="race_points" header="Points" class="w-24">
          <template #body="{ data }">
            <div class="text-center font-semibold text-gray-900">
              {{ data.race_points }}
            </div>
          </template>
        </Column>

        <template #empty>
          <div class="text-center py-6 text-gray-500">
            No results recorded for this
            {{ raceEvent.is_qualifier ? 'qualifying session' : 'race' }}
          </div>
        </template>
      </DataTable>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Tag from 'primevue/tag';
import { getPodiumRowClass } from '@app/constants/podiumColors';
import type { RaceEventResults, RaceResultWithDriver } from '@app/types/roundResult';

interface Props {
  raceEvent: RaceEventResults;
  divisionId?: number;
}

const props = defineProps<Props>();

// Computed
const raceEventTitle = computed(() => {
  if (props.raceEvent.is_qualifier) {
    return props.raceEvent.name || 'Qualifying';
  }
  return props.raceEvent.name || `Race ${props.raceEvent.race_number}`;
});

const filteredResults = computed<RaceResultWithDriver[]>(() => {
  let results = props.raceEvent.results;

  // If divisionId is provided, filter results by division
  if (props.divisionId !== undefined) {
    results = results.filter((result) => result.division_id === props.divisionId);
  }

  // Filter out drivers who don't have valid results
  // For qualifying: must have fastest_lap (qualifying time)
  // For races: must have race_time, dnf, or fastest_lap
  results = results.filter((result) => {
    if (props.raceEvent.is_qualifier) {
      // Qualifying: require a fastest_lap time (the lap time)
      return result.fastest_lap !== null && result.fastest_lap !== '';
    } else {
      // Race: require race_time, dnf flag, or fastest_lap
      return (
        (result.race_time !== null && result.race_time !== '') ||
        result.dnf === true ||
        (result.fastest_lap !== null && result.fastest_lap !== '')
      );
    }
  });

  return results;
});

// Row class for podium positions (only for races, not qualifying)
function getRowClass(data: RaceResultWithDriver): string {
  if (props.raceEvent.is_qualifier) {
    return '';
  }

  return getPodiumRowClass(data.position);
}

// Format positions gained/lost
function formatPositionsGained(value: number | null): string {
  if (value === null) {
    return '-';
  }
  if (value === 0) {
    return '0';
  }
  if (value > 0) {
    return `+${value}`;
  }
  return value.toString();
}

// Get CSS class for positions gained/lost
function getPositionsGainedClass(data: RaceResultWithDriver): string {
  if (data.positions_gained === null || data.positions_gained === 0) {
    return 'text-gray-600';
  }
  if (data.positions_gained > 0) {
    return 'text-green-600';
  }
  return 'text-red-600';
}
</script>
