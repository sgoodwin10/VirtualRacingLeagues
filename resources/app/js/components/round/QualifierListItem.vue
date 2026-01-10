<template>
  <div
    class="flex flex-row rounded-lg border border-[var(--color-border-muted)] hover:border-[var(--color-border-default)] transition-colors bg-elevated"
  >
    <div
      class="flex items-center p-4 border-r rounded-l-lg border-[var(--color-border-default)] bg-cyan-950"
    >
      <PhTimer size="24" class="text-blue-600" />
    </div>

    <div class="flex flex-grow items-center">
      <div class="flex-grow flex flex-row items-center">
        <div class="flex items-center px-2 min-w-[200px]">
          <span class="font-medium text-primary">{{ race.name || 'Qualifying Session' }}</span>
        </div>

        <div class="flex flex-row gap-6 text-sm text-gray-600 mr-4">
          <div class="flex flex-col min-w-18">
            <div class="font-medium text-gray-500">Format</div>
            <div class="text-secondary">{{ formatQualifying(race) }}</div>
          </div>
          <div v-if="race.qualifying_length">
            <div class="flex flex-col min-w-18">
              <div class="font-medium text-gray-500">Duration</div>
              <div class="text-secondary">{{ race.qualifying_length }} minutes</div>
            </div>
          </div>
          <div v-if="race.qualifying_tire">
            <div class="flex flex-col min-w-18">
              <div class="font-medium text-gray-500">Tyre</div>
              <div class="text-secondary">{{ race.qualifying_tire }}</div>
            </div>
          </div>
          <div v-if="race.weather">
            <div class="flex flex-col">
              <div class="font-medium text-gray-500">Weather</div>
              <div class="text-secondary">{{ race.weather }}</div>
            </div>
          </div>
        </div>

        <div class="flex gap-2 ml-auto">
          <BaseBadge v-if="hasPoleBonus" variant="cyan"> Pole Bonus </BaseBadge>
        </div>
      </div>

      <div class="flex-none flex items-center gap-2 mx-4">
        <Button
          :label="isCompleted ? 'Results' : 'Enter Results'"
          :icon="isCompleted ? PhTrophy : PhListChecks"
          size="sm"
          :variant="isCompleted ? 'outline' : 'primary'"
          @click="handleEnterResults"
        />
        <div v-if="!isRoundCompleted" class="flex items-center gap-2">
          <OrphanedResultsWarning
            :race-id="race.id"
            :has-orphaned-results="race.has_orphaned_results"
            :is-completed="isCompleted"
            :is-qualifying="true"
            @orphans-removed="handleOrphansRemoved"
          />
          <BaseToggleSwitch v-model="isCompleted" @update:model-value="handleToggleStatus">
            <template #handle="{ checked }">
              <i :class="['!text-xs pi', { 'pi-check': checked, 'pi-times': !checked }]" />
            </template>
          </BaseToggleSwitch>
          <span :class="['text-sm font-medium', isCompleted ? 'text-green-600' : 'text-slate-400']">
            Completed
          </span>
        </div>
        <Button
          v-if="!isRoundCompleted && !isCompleted"
          :icon="PhPencil"
          size="sm"
          variant="warning"
          aria-label="Edit race"
          :title="`Edit race`"
          @click="handleEdit"
        />

        <Button
          v-if="!isRoundCompleted && !isCompleted"
          :icon="PhTrash"
          size="sm"
          variant="danger"
          aria-label="Delete round"
          :title="`Delete race`"
          @click="handleDelete"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { Button } from '@app/components/common/buttons';
import BaseToggleSwitch from '@app/components/common/inputs/BaseToggleSwitch.vue';
import { BaseBadge } from '@app/components/common/indicators';
import OrphanedResultsWarning from './OrphanedResultsWarning.vue';
import type { Race } from '@app/types/race';
import { QUALIFYING_FORMAT_OPTIONS } from '@app/types/race';
import { PhTimer, PhListChecks, PhPencil, PhTrash, PhTrophy } from '@phosphor-icons/vue';

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

const hasPoleBonus = computed(() => {
  return props.race.qualifying_pole !== null && props.race.qualifying_pole > 0;
});

const isCompleted = computed({
  get: () => props.race.status === 'completed',
  set: () => {
    // Handled by handleToggleStatus
  },
});

function formatQualifying(race: Race): string {
  const option = QUALIFYING_FORMAT_OPTIONS.find((opt) => opt.value === race.qualifying_format);
  return option?.label || race.qualifying_format;
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
