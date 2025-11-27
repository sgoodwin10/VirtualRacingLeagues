<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import type { Season } from '@app/types/season';

import Card from 'primevue/card';
import Chip from 'primevue/chip';
import Button from 'primevue/button';

interface Props {
  season: Season;
  leagueId: number;
}

const props = defineProps<Props>();

interface Emits {
  (e: 'edit'): void;
  (e: 'delete'): void;
  (e: 'archive'): void;
}

const emit = defineEmits<Emits>();

const router = useRouter();

const cardClasses = computed(() => ({
  'opacity-60': props.season.is_archived,
}));

const statusSeverity = computed(() => {
  switch (props.season.status) {
    case 'active':
      return 'success';
    case 'completed':
      return 'info';
    case 'archived':
      return 'warn';
    case 'setup':
    default:
      return 'secondary';
  }
});

const statusLabel = computed(() => {
  return props.season.status.charAt(0).toUpperCase() + props.season.status.slice(1);
});

function handleView(): void {
  router.push({
    name: 'season-detail',
    params: {
      leagueId: props.leagueId,
      competitionId: props.season.competition_id,
      seasonId: props.season.id,
    },
  });
}
</script>

<template>
  <Card :class="cardClasses" class="season-card cursor-pointer" @click="handleView">
    <template #header>
      <img :src="season.logo_url" :alt="season.name" class="w-full h-48 object-cover" />
    </template>

    <template #title>
      <div class="flex justify-between items-start">
        <span>{{ season.name }}</span>
        <Chip :label="statusLabel" :severity="statusSeverity" size="small" />
      </div>
    </template>

    <template #subtitle>
      <div class="flex items-center gap-2">
        <Chip v-if="season.car_class" :label="season.car_class" icon="pi pi-car" size="small" />
      </div>
    </template>

    <template #content>
      <p v-if="season.description" class="text-gray-600 text-sm mb-4 line-clamp-2">
        {{ season.description }}
      </p>

      <!-- Stats -->
      <div class="grid grid-cols-2 gap-2">
        <div>
          <span class="text-xs text-gray-500">Drivers</span>
          <p class="font-semibold">{{ season.stats.total_drivers }}</p>
        </div>
        <div>
          <span class="text-xs text-gray-500">Rounds</span>
          <p class="font-semibold">
            {{ season.stats.total_rounds ?? season.stats.total_races ?? 0 }}
          </p>
        </div>
      </div>
    </template>

    <template #footer>
      <div class="flex gap-2">
        <Button label="View" icon="pi pi-eye" outlined @click.stop="handleView" />
        <Button
          label="Edit"
          icon="pi pi-pencil"
          outlined
          :disabled="season.is_archived"
          @click.stop="emit('edit')"
        />
        <Button
          label="Delete"
          icon="pi pi-trash"
          severity="danger"
          outlined
          @click.stop="emit('delete')"
        />
      </div>
    </template>
  </Card>
</template>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
