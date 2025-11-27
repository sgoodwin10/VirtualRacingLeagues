<template>
  <div
    class="flex flex-row rounded-lg border border-blue-200 hover:border-blue-400 transition-colors"
  >
    <div class="flex items-center p-4 border-r rounded-l-lg border-blue-200 bg-blue-50">
      <PhTimer size="24" class="text-blue-600" />
    </div>

    <div class="flex flex-grow items-center">
      <div class="flex-grow flex flex-row items-center">
        <div class="flex items-center px-2 min-w-[200px]">
          <span class="font-medium text-blue-900">{{ race.name || 'Qualifying Session' }}</span>
        </div>

        <div class="flex flex-row gap-6 text-sm text-gray-600 mr-4">
          <div class="flex flex-col min-w-18">
            <div class="font-medium text-gray-500">Format</div>
            <div class="text-gray-600 text-md">{{ formatQualifying(race) }}</div>
          </div>
          <div v-if="race.qualifying_length">
            <div class="flex flex-col min-w-18">
              <div class="font-medium text-gray-500">Duration</div>
              <div class="text-gray-600 text-md">{{ race.qualifying_length }} minutes</div>
            </div>
          </div>
          <div v-if="race.qualifying_tire">
            <div class="flex flex-col min-w-18">
              <div class="font-medium text-gray-500">Tyre</div>
              <div class="text-gray-600 text-md">{{ race.qualifying_tire }}</div>
            </div>
          </div>
          <div v-if="race.weather">
            <div class="flex flex-col">
              <div class="font-medium text-gray-500">Weather</div>
              <div class="text-gray-600 text-md">{{ race.weather }}</div>
            </div>
          </div>
        </div>

        <div class="flex gap-2 ml-auto">
          <Tag v-if="hasPoleBonus" value="Pole Bonus" severity="success" />
        </div>
      </div>

      <div class="flex-none flex items-center gap-2 mx-4">
        <Button
          label="Results"
          icon="pi pi-list-check"
          text
          size="small"
          severity="info"
          @click="handleEnterResults"
        />
        <div v-if="!isRoundCompleted" class="flex items-center gap-2">
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
import Button from 'primevue/button';
import Tag from 'primevue/tag';
import ToggleSwitch from 'primevue/toggleswitch';
import { EditButton, DeleteButton } from '@app/components/common/buttons';
import type { Race } from '@app/types/race';
import { QUALIFYING_FORMAT_OPTIONS } from '@app/types/race';
import { PhTimer } from '@phosphor-icons/vue';

interface Props {
  race: Race;
  isRoundCompleted?: boolean;
}

interface Emits {
  (e: 'edit', race: Race): void;
  (e: 'delete', race: Race): void;
  (e: 'enterResults', race: Race): void;
  (e: 'toggleStatus', race: Race, newStatus: 'scheduled' | 'completed'): void;
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
</script>
