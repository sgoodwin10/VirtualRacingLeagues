<template>
  <div
    class="flex flex-row rounded-lg border border-amber-200 hover:border-amber-400 transition-colors"
  >
    <div class="flex items-center p-4 border-r rounded-l-lg border-amber-300 bg-amber-50">
      <PhFlag size="24" class="text-amber-600" />
    </div>

    <div class="flex flex-grow items-center">
      <div class="flex-grow flex flex-row">
        <div class="flex items-center px-2 min-w-[256px]">
          <div class="flex flex-col">
            <span class="font-medium text-green-900">{{
              race.name || `Race ${race.race_number}`
            }}</span>
            <span v-if="race.race_type" class="text-sm text-gray-500">{{ raceTypeLabel }}</span>
          </div>
        </div>

        <div class="flex flex-row gap-6 text-sm text-gray-600 mr-4 min-w-[300px]">
          <div class="flex flex-col">
            <div class="font-medium text-gray-500">Length</div>
            <div class="text-gray-600 text-md">{{ formatRaceLength(race) }}</div>
          </div>
          <div class="flex flex-col">
            <div class="font-medium text-gray-500">Grid Source</div>
            <div class="text-gray-600 text-md">{{ formatGridSource(race.grid_source) }}</div>
          </div>
          <div v-if="race.weather">
            <div class="flex flex-col">
              <div class="font-medium text-gray-500">Weather</div>
              <div class="text-gray-600 text-md">{{ race.weather }}</div>
            </div>
          </div>
          <div v-if="race.mandatory_pit_stop">
            <div class="flex flex-col">
              <div class="font-medium text-gray-500">Pit Stop</div>
              <div class="text-gray-600 text-md">
                {{ race.minimum_pit_time ? `${race.minimum_pit_time}s min` : 'Mandatory' }}
              </div>
            </div>
          </div>
        </div>

        <div class="flex gap-2 mt-2 text-xs">
          <Tag v-if="hasFastestLapBonus" value="Fastest Lap Bonus" severity="success" />
        </div>
      </div>

      <div class="flex-none items-center gap-2 mx-4">
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
import type { Race, GridSource } from '@app/types/race';
import { RACE_TYPE_OPTIONS, GRID_SOURCE_OPTIONS } from '@app/types/race';
import { PhFlag } from '@phosphor-icons/vue';

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

const hasFastestLapBonus = computed(() => {
  return !!props.race.bonus_points?.fastest_lap;
});

function formatRaceLength(race: Race): string {
  if (race.length_type === 'laps') {
    return `${race.length_value} laps`;
  } else {
    return `${race.length_value} minutes${race.extra_lap_after_time ? ' + lap' : ''}`;
  }
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
