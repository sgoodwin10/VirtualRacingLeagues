<template>
  <div class="p-4 bg-blue-50 rounded-lg border border-blue-200 hover:bg-blue-100 transition-colors">
    <div class="flex items-center justify-between">
      <div class="flex-1">
        <div class="flex items-center gap-3 mb-2">
          <i class="pi pi-stopwatch text-blue-600"></i>
          <Tag value="Qualifying" severity="info" />
          <span class="font-medium text-blue-900">{{ race.name || 'Qualifying Session' }}</span>
        </div>

        <div class="grid grid-cols-2 gap-2 text-sm text-gray-600">
          <div>
            <span class="font-medium">Format:</span>
            {{ formatQualifying(race) }}
          </div>
          <div v-if="race.qualifying_length">
            <span class="font-medium">Duration:</span>
            {{ race.qualifying_length }} minutes
          </div>
          <div v-if="race.qualifying_tire">
            <span class="font-medium">Tire:</span>
            {{ race.qualifying_tire }}
          </div>
          <div v-if="race.weather">
            <span class="font-medium">Weather:</span>
            {{ race.weather }}
          </div>
        </div>

        <div class="flex gap-2 mt-2">
          <Tag v-if="race.race_divisions" value="Divisions Enabled" severity="info" />
          <Tag v-if="hasPoleBonus" value="Pole Bonus" severity="success" />
        </div>
      </div>

      <div class="flex items-center gap-2 ml-4">
        <Button
          v-tooltip.top="'Edit Qualifying'"
          icon="pi pi-pencil"
          text
          rounded
          size="small"
          severity="secondary"
          @click="handleEdit"
        />
        <Button
          v-tooltip.top="'Delete Qualifying'"
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
import type { Race } from '@user/types/race';
import { QUALIFYING_FORMAT_OPTIONS } from '@user/types/race';

interface Props {
  race: Race;
}

interface Emits {
  (e: 'edit', race: Race): void;
  (e: 'delete', race: Race): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const hasPoleBonus = computed(() => {
  return !!props.race.bonus_points?.pole;
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
</script>
