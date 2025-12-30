<template>
  <div
    class="flex flex-row rounded-lg border border-amber-200 hover:border-amber-400 transition-colors"
  >
    <div class="flex items-center p-4 border-r rounded-l-lg border-amber-300 bg-amber-50">
      <PhFlag size="24" class="text-amber-600" />
    </div>

    <div class="flex flex-grow items-center">
      <div class="flex-grow flex flex-row items-center">
        <div class="flex items-center px-2 min-w-[200px]">
          <div class="flex flex-col">
            <span class="font-medium text-green-900">{{
              race.name || `Race ${race.race_number}`
            }}</span>
            <span v-if="race.race_type" class="text-sm text-gray-500">{{ raceTypeLabel }}</span>
          </div>
        </div>

        <div class="flex flex-row gap-6 text-sm text-gray-600 mr-4">
          <div class="flex flex-col min-w-18">
            <div class="font-medium text-gray-500">Grid Source</div>
            <div class="text-gray-600 text-md">{{ formatGridSource(race.grid_source) }}</div>
          </div>
          <div class="flex flex-col min-w-18">
            <div class="font-medium text-gray-500">Length</div>
            <div class="text-gray-600 text-md">{{ formatRaceLength(race) }}</div>
          </div>
          <div v-if="race.weather">
            <div class="flex flex-col min-w-18">
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

        <div class="flex gap-2 ml-auto text-xs">
          <Tag v-if="hasRacePoints" value="Race Points" severity="info" />
          <Tag v-if="hasFastestLapBonus" value="FL Bonus" variant="success" />
        </div>
      </div>

      <div class="flex-none flex items-center gap-2 mx-4">
        <Button
          :label="isCompleted ? 'View Results' : 'Enter Results'"
          :icon="PhListChecks"
          text
          size="sm"
          :severity="isCompleted ? 'success' : 'info'"
          @click="handleEnterResults"
        />
        <div v-if="!isRoundCompleted" class="flex items-center gap-2">
          <OrphanedResultsWarning
            :race-id="race.id"
            :has-orphaned-results="race.has_orphaned_results"
            :is-completed="isCompleted"
            :is-qualifying="false"
            @orphans-removed="handleOrphansRemoved"
          />
          <ToggleSwitch v-model="isCompleted" @update:model-value="handleToggleStatus">
            <template #handle="{ checked }">
              <i :class="['!text-xs pi', { 'pi-check': checked, 'pi-times': !checked }]" />
            </template>
          </ToggleSwitch>
          <span :class="['text-sm font-medium', isCompleted ? 'text-green-600' : 'text-slate-400']">
            Completed
          </span>
        </div>
        <EditButton v-if="!isRoundCompleted && !isCompleted" @click="handleEdit" />
        <DeleteButton v-if="!isRoundCompleted && !isCompleted" @click="handleDelete" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { Button } from '@app/components/common/buttons';
import Tag from 'primevue/tag';
import ToggleSwitch from 'primevue/toggleswitch';
import { EditButton, DeleteButton } from '@app/components/common/buttons';
import OrphanedResultsWarning from './OrphanedResultsWarning.vue';
import type { Race, GridSource } from '@app/types/race';
import { RACE_TYPE_OPTIONS, GRID_SOURCE_OPTIONS } from '@app/types/race';
import { PhFlag, PhListChecks } from '@phosphor-icons/vue';

interface Props {
  race: Race;
  isRoundCompleted?: boolean;
}

interface Emits {
  (e: 'edit', race: Race): void;
  (e: 'delete', race: Race): void;
  (e: 'enterResults', race: Race): void;
  (e: 'toggleStatus', race: Race, newStatus: 'scheduled' | 'completed'): void;
  (e: 'refresh'): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const raceTypeLabel = computed(() => {
  const option = RACE_TYPE_OPTIONS.find((opt) => opt.value === props.race.race_type);
  return option?.label || props.race.race_type;
});

const hasFastestLapBonus = computed(() => {
  return props.race.fastest_lap !== null && props.race.fastest_lap > 0;
});

const hasRacePoints = computed(() => {
  return !!props.race.race_points;
});

const isCompleted = computed({
  get: () => props.race.status === 'completed',
  set: () => {
    // Handled by handleToggleStatus
  },
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

function handleEnterResults(): void {
  emit('enterResults', props.race);
}

function handleToggleStatus(checked: boolean): void {
  const newStatus = checked ? 'completed' : 'scheduled';
  emit('toggleStatus', props.race, newStatus);
}

function handleOrphansRemoved(): void {
  emit('refresh');
}
</script>
