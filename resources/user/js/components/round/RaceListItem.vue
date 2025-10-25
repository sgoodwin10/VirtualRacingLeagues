<template>
  <div class="p-4 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors">
    <div class="flex items-center justify-between">
      <div class="flex-1">
        <div class="flex items-center gap-3 mb-2">
          <Tag :value="`Race ${race.race_number}`" severity="success" />
          <span class="font-medium">{{ race.name || 'Untitled Race' }}</span>
          <Tag v-if="race.race_type" :value="raceTypeLabel" severity="secondary" />
        </div>

        <div class="grid grid-cols-2 gap-2 text-sm text-gray-600">
          <div>
            <span class="font-medium">Length:</span>
            {{ formatRaceLength(race) }}
          </div>
          <div>
            <span class="font-medium">Qualifying:</span>
            {{ formatQualifying(race) }}
          </div>
          <div>
            <span class="font-medium">Grid:</span>
            {{ formatGridSource(race.grid_source) }}
          </div>
          <div v-if="race.mandatory_pit_stop">
            <span class="font-medium">Pit Stop:</span>
            Mandatory
            <span v-if="race.minimum_pit_time">({{ race.minimum_pit_time }}s min)</span>
          </div>
        </div>

        <div v-if="race.race_divisions" class="mt-2">
          <Tag value="Divisions Enabled" severity="info" />
        </div>
      </div>

      <div class="flex items-center gap-2 ml-4">
        <Button
          v-tooltip.top="'Edit Race'"
          icon="pi pi-pencil"
          text
          rounded
          size="small"
          severity="secondary"
          @click="handleEdit"
        />
        <Button
          v-tooltip.top="'Delete Race'"
          icon="pi pi-trash"
          text
          rounded
          size="small"
          severity="danger"
          @click="handleDelete"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import Button from 'primevue/button';
import Tag from 'primevue/tag';
import type { Race, GridSource } from '@user/types/race';
import {
  RACE_TYPE_OPTIONS,
  QUALIFYING_FORMAT_OPTIONS,
  GRID_SOURCE_OPTIONS,
} from '@user/types/race';

interface Props {
  race: Race;
}

interface Emits {
  (e: 'edit', race: Race): void;
  (e: 'delete', race: Race): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const raceTypeLabel = computed(() => {
  const option = RACE_TYPE_OPTIONS.find((opt) => opt.value === props.race.race_type);
  return option?.label || props.race.race_type;
});

function formatRaceLength(race: Race): string {
  if (race.length_type === 'laps') {
    return `${race.length_value} laps`;
  } else {
    return `${race.length_value} minutes${race.extra_lap_after_time ? ' + lap' : ''}`;
  }
}

function formatQualifying(race: Race): string {
  const option = QUALIFYING_FORMAT_OPTIONS.find((opt) => opt.value === race.qualifying_format);
  const formatLabel = option?.label || race.qualifying_format;

  if (race.qualifying_format === 'none' || race.qualifying_format === 'previous_race') {
    return formatLabel;
  }

  return `${formatLabel}${race.qualifying_length ? ` (${race.qualifying_length}min)` : ''}`;
}

function formatGridSource(gridSource: GridSource): string {
  const option = GRID_SOURCE_OPTIONS.find((opt) => opt.value === gridSource);
  return option?.label || gridSource;
}

function handleEdit(): void {
  emit('edit', props.race);
}

function handleDelete(): void {
  emit('delete', props.race);
}
</script>
